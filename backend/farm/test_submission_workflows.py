import json
from datetime import date
from unittest.mock import patch

from django.contrib.auth.models import User
from django.db import connection, OperationalError
from django.test import Client, RequestFactory, TestCase, override_settings
from django.test.utils import CaptureQueriesContext

from .attendance_views import meetings_list_create
from .models import UserProfile, Meeting, MeetingInvitation, AttendanceRecord


class SubmissionWorkflowTests(TestCase):
    def setUp(self):
        self.officer = User.objects.create_user('submission-officer', password='test-password')
        self.profile = UserProfile.objects.create(user=self.officer, role='officer')
        self.farmer = User.objects.create_user('submission-farmer', password='test-password')
        self.farmer_profile = UserProfile.objects.create(user=self.farmer, role='farmer')
        self.client.force_login(self.officer)
        self.payload = {
            'title': 'Farmer training', 'meeting_date': '2026-10-10', 'venue': 'Main hall',
            'start_time': '09:00', 'end_time': '12:00', 'category': 'PEST_DISEASE_TRAINING',
            'agenda': 'Monitoring', 'farmer_ids': [self.farmer_profile.pk],
        }

    def create(self, changes=None):
        return self.client.post('/api/attendance/meetings/', json.dumps({**self.payload, **(changes or {})}), content_type='application/json')

    def test_meeting_and_invitation_survive_fresh_read(self):
        response = self.create()
        self.assertEqual(response.status_code, 201)
        meeting_id = response.json()['meeting']['id']
        self.assertEqual(MeetingInvitation.objects.get(meeting_id=meeting_id).farmer_id, self.farmer_profile.pk)
        second = Client()
        second.force_login(self.officer)
        data = second.get(f'/api/attendance/meetings/{meeting_id}/').json()['meeting']
        self.assertEqual(data['agenda'], 'Monitoring')
        self.assertEqual(len(data['invited_farmers']), 1)

    def test_invalid_selected_farmer_saves_nothing(self):
        self.assertEqual(self.create({'farmer_ids': [self.profile.pk]}).status_code, 400)
        self.assertFalse(Meeting.objects.exists())

    def test_invalid_dates_and_times_saves_nothing(self):
        self.assertEqual(self.create({'meeting_date': 'not-a-date'}).status_code, 400)
        self.assertEqual(self.create({'end_time': '08:00'}).status_code, 400)
        self.assertFalse(Meeting.objects.exists())

    @override_settings(DEBUG=True)
    def test_failed_invitation_rolls_back_meeting(self):
        with patch('farm.attendance_views.MeetingInvitation.objects.bulk_create', side_effect=OperationalError('private database details')):
            response = self.create()
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('private', response.content.decode())
        self.assertFalse(Meeting.objects.exists())

    def test_farmer_cannot_create_meeting_or_read_roster(self):
        self.client.force_login(self.farmer)
        self.assertEqual(self.create().status_code, 403)
        self.assertEqual(self.client.get('/api/attendance/farmers-roster/').status_code, 403)

    def test_officer_cannot_modify_another_officers_meeting(self):
        other = User.objects.create_user('other-officer')
        other_profile = UserProfile.objects.create(user=other, role='officer')
        meeting = Meeting.objects.create(title='Other meeting', meeting_date=date(2026, 10, 10), venue='Hall', created_by_officer=other_profile)
        response = self.client.post(f'/api/attendance/meetings/{meeting.pk}/invite/', json.dumps({'farmer_ids': [self.farmer_profile.pk]}), content_type='application/json')
        self.assertEqual(response.status_code, 404)

    def test_invalid_attendance_batch_changes_nothing(self):
        meeting_id = self.create().json()['meeting']['id']
        self.assertEqual(self.client.post(f'/api/attendance/meetings/{meeting_id}/generate-register/').status_code, 201)
        record = AttendanceRecord.objects.get(meeting_id=meeting_id)
        response = self.client.post(f'/api/attendance/meetings/{meeting_id}/attendance/', json.dumps({'records': [
            {'record_id': record.pk, 'status': 'PRESENT'},
            {'record_id': 999999, 'status': 'PRESENT'},
        ]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        record.refresh_from_db()
        self.assertEqual(record.status, 'UNRECORDED')
        valid = self.client.post(f'/api/attendance/meetings/{meeting_id}/attendance/', json.dumps({'records': [{'record_id': record.pk, 'status': 'PRESENT', 'remarks': 'On time'}]}), content_type='application/json')
        self.assertEqual(valid.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.status, 'PRESENT')

    def test_meeting_list_query_count_does_not_grow_per_meeting(self):
        factory = RequestFactory()
        def query_count():
            request = factory.get('/api/attendance/meetings/')
            request.user = self.officer
            with CaptureQueriesContext(connection) as queries:
                self.assertEqual(meetings_list_create(request).status_code, 200)
            return len(queries)
        self.create()
        initial = query_count()
        for number in range(8):
            self.create({'title': f'Meeting {number}'})
        self.assertLessEqual(query_count(), initial)

    @override_settings(DEBUG=True)
    def test_registration_profile_failure_rolls_back_user(self):
        with patch('farm.auth_views.UserProfile.objects.create', side_effect=OperationalError('private database details')):
            response = self.client.post('/api/auth/register', json.dumps({'username': 'new-user', 'password': 'test-password', 'role': 'FARMER'}), content_type='application/json')
        self.assertEqual(response.status_code, 503)
        self.assertFalse(User.objects.filter(username='new-user').exists())

    def test_registration_and_login_saved_account(self):
        response = self.client.post('/api/auth/register', json.dumps({'username': 'new-farmer', 'password': 'test-password', 'firstName': 'New', 'role': 'FARMER'}), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.client.logout()
        login = self.client.post('/api/auth/login', json.dumps({'username': 'new-farmer', 'password': 'test-password'}), content_type='application/json')
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()['user']['firstName'], 'New')

    def test_meeting_pagination_has_stable_pages(self):
        for number in range(4):
            self.create({'title': f'Page meeting {number}'})
        first = self.client.get('/api/attendance/meetings/?page=1&page_size=2').json()
        second = self.client.get('/api/attendance/meetings/?page=2&page_size=2').json()
        self.assertEqual(first['count'], 4)
        self.assertEqual(len(first['meetings']), 2)
        self.assertFalse(set(m['id'] for m in first['meetings']) & set(m['id'] for m in second['meetings']))

    def test_roster_search_and_pagination(self):
        response = self.client.get('/api/attendance/farmers-roster/?page=1&page_size=50&search=submission-farmer')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['count'], 1)
        self.assertEqual(response.json()['farmers'][0]['id'], self.farmer_profile.pk)
        self.assertEqual(self.client.get('/api/attendance/farmers-roster/?page=0').status_code, 400)
