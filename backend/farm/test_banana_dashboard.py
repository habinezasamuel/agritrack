import json
from datetime import date

from django.contrib.auth.models import User
from django.test import RequestFactory, TestCase
from django.db import connection
from django.test.utils import CaptureQueriesContext

from . import banana_views
from .models import (
    UserProfile, Farm, BananaPlantation, BananaGrowthLog,
    BananaDiseaseReport, BananaAssistanceRequest,
    BananaOfficerAdvice,
)


class BananaDashboardTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user('banana-farmer')
        self.profile = UserProfile.objects.create(user=self.user, role='farmer')
        self.farm = Farm.objects.create(farmer=self.profile, name='Test farm', size_hectares=1)

    def field(self, name='Field', mats=100):
        return BananaPlantation.objects.create(
            farmer=self.profile, farm=self.farm, name=name, land_size_hectares=1,
            planting_date=date(2026, 1, 1), total_plants_planted=mats,
        )

    def summary(self, user=None):
        request = self.factory.get('/banana/dashboard-summary/')
        request.user = user or self.user
        response = banana_views.banana_dashboard_summary(request)
        self.assertEqual(response.status_code, 200)
        return json.loads(response.content)

    def test_empty_dashboard_has_no_invented_health(self):
        result = self.summary()
        self.assertEqual(result['totalPlantations'], 0)
        self.assertEqual(result['totalPlants'], 0)
        self.assertIsNone(result['healthRatePercent'])

    def test_health_uses_latest_observation_per_field(self):
        first = self.field()
        second = self.field('Second', 200)
        BananaGrowthLog.objects.create(plantation=first, date=date(2026, 1, 2), stage='SHOOTING', healthy_plants=100)
        BananaGrowthLog.objects.create(plantation=first, date=date(2026, 1, 3), stage='SHOOTING', healthy_plants=60, damaged_plants=20)
        BananaGrowthLog.objects.create(plantation=second, date=date(2026, 1, 3), stage='SHOOTING', healthy_plants=100, damaged_plants=20)
        result = self.summary()
        self.assertEqual(result['totalPlants'], 300)
        self.assertEqual(result['healthyPlants'], 160)
        self.assertEqual(result['affectedPlants'], 40)
        self.assertEqual(result['healthRatePercent'], 80)

    def test_planted_mats_do_not_imply_monitoring(self):
        self.field()
        self.assertIsNone(self.summary()['healthRatePercent'])

    def test_other_farmer_cannot_see_records(self):
        self.field()
        other = User.objects.create_user('other-farmer')
        UserProfile.objects.create(user=other, role='farmer')
        self.assertEqual(self.summary(other)['totalPlantations'], 0)

    def test_status_counts_have_clear_definitions(self):
        field = self.field()
        for status in ('REPORTED', 'RESOLVED', 'CLOSED'):
            BananaDiseaseReport.objects.create(plantation=field, farmer=self.profile, description='Symptoms', problem_type='OTHER', status=status)
        for status in ('PENDING', 'UNDER_REVIEW', 'RESOLVED'):
            BananaAssistanceRequest.objects.create(plantation=field, farmer=self.profile, subject='Help', description='Advice', status=status)
        result = self.summary()
        self.assertEqual(result['activeDiseaseReports'], 1)
        self.assertEqual(result['pendingAssistanceRequests'], 1)
        self.assertEqual(result['resolvedProblemsCount'], 1)

    def test_farmer_cannot_resolve_own_request(self):
        case = BananaAssistanceRequest.objects.create(plantation=self.field(), farmer=self.profile, subject='Help', description='Advice')
        request = self.factory.patch('/banana/status/', data=json.dumps({'status': 'RESOLVED'}), content_type='application/json')
        request.user = self.user
        self.assertEqual(banana_views.update_assistance_status(request, case.pk).status_code, 403)
        case.refresh_from_db()
        self.assertEqual(case.status, 'PENDING')

    def test_officer_only_sees_assigned_fields(self):
        assigned = self.field()
        self.field('Unassigned')
        officer = User.objects.create_user('banana-officer')
        profile = UserProfile.objects.create(user=officer, role='officer')
        BananaAssistanceRequest.objects.create(plantation=assigned, farmer=self.profile, assigned_officer=profile, subject='Help', description='Advice')
        self.assertEqual(self.summary(officer)['totalPlantations'], 1)

    def test_invalid_monitoring_is_rejected_without_saving(self):
        field = self.field()
        request = self.factory.post('/banana/growth-records/', data=json.dumps({
            'plantationId': field.pk, 'healthyPlantsCount': 90,
            'damagedPlantsCount': 20, 'recordedDate': '2026-01-02',
        }), content_type='application/json')
        request.user = self.user
        self.assertEqual(banana_views.growth_records_list_create(request).status_code, 400)
        self.assertFalse(BananaGrowthLog.objects.exists())

    def dashboard_data(self, user=None):
        request = self.factory.get('/api/banana/dashboard-summary/?include_records=1')
        request.user = user or self.user
        response = banana_views.banana_dashboard_summary(request)
        self.assertEqual(response.status_code, 200)
        return json.loads(response.content)

    def test_dashboard_data_loads_all_records_without_losing_photos(self):
        field = self.field()
        field.photo_url = 'data:image/png;base64,aGVsbG8='
        field.save()
        BananaGrowthLog.objects.create(plantation=field, stage='SHOOTING', healthy_plants=80, damaged_plants=20)
        result = self.dashboard_data()
        self.assertEqual(result['summary']['healthRatePercent'], 80)
        self.assertTrue(result['plantations'][0]['photoUrl'].startswith(f'/api/banana/photos/plantation/{field.pk}/'))
        field.refresh_from_db()
        self.assertEqual(field.photo_url, 'data:image/png;base64,aGVsbG8=')
        self.client.force_login(self.user)
        photo = self.client.get(result['plantations'][0]['photoUrl'])
        self.assertEqual(photo.status_code, 200)
        self.assertEqual(photo.content, b'hello')
        self.assertEqual(len(result['growthRecords']), 1)
        self.assertEqual(result['diseaseReports'], [])
        other = User.objects.create_user('private-farmer')
        UserProfile.objects.create(user=other, role='farmer')
        private = self.dashboard_data(other)
        self.assertEqual(private['plantations'], [])
        self.assertEqual(private['growthRecords'], [])
        self.client.force_login(other)
        self.assertEqual(self.client.get(result['plantations'][0]['photoUrl']).status_code, 404)

    def test_combined_dashboard_has_no_per_report_advice_queries(self):
        field = self.field()
        officer = User.objects.create_user('advice-officer')
        profile = UserProfile.objects.create(user=officer, role='officer')
        def report():
            disease = BananaDiseaseReport.objects.create(plantation=field, farmer=self.profile, problem_type='OTHER', description='Symptoms')
            request = BananaAssistanceRequest.objects.create(plantation=field, farmer=self.profile, disease_report=disease, subject='Help', description='Advice')
            BananaOfficerAdvice.objects.create(request=request, officer=profile, diagnosis='Under review', recommendations='Monitor')
        report()
        with CaptureQueriesContext(connection) as first:
            self.dashboard_data()
        for _ in range(8):
            report()
        with CaptureQueriesContext(connection) as many:
            result = self.dashboard_data()
        self.assertEqual(len(result['diseaseReports']), 9)
        self.assertIsNotNone(result['diseaseReports'][0]['officerAdvice'])
        self.assertEqual(len(many), len(first))
