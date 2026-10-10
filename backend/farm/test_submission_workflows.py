import json
from uuid import uuid4
from datetime import date
from unittest.mock import patch

from django.contrib.auth.models import User
from django.contrib.auth.models import AnonymousUser
from django.db import connection, OperationalError
from django.test import Client, RequestFactory, TestCase, override_settings
from django.test.utils import CaptureQueriesContext

from .attendance_views import meetings_list_create
from .middleware import BearerTokenAuthMiddleware
from .models import UserProfile, Meeting, MeetingInvitation, AttendanceRecord, MeetingSubmission


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

    def test_repeating_submission_returns_committed_meeting(self):
        key = str(uuid4())
        first = self.client.post('/api/attendance/meetings/', json.dumps(self.payload), content_type='application/json', HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(first.status_code, 201)
        repeated = self.client.post('/api/attendance/meetings/', json.dumps(self.payload), content_type='application/json', HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(repeated.status_code, 201)
        self.assertEqual(first.json()['meeting']['id'], repeated.json()['meeting']['id'])
        self.assertEqual(Meeting.objects.count(), 1)
        self.assertEqual(MeetingInvitation.objects.count(), 1)
        self.assertEqual(MeetingSubmission.objects.count(), 1)
        confirmation = self.client.get(f'/api/attendance/meeting-submissions/{key}/')
        self.assertEqual(confirmation.status_code, 200)
        self.assertEqual(confirmation.json()['meeting']['id'], first.json()['meeting']['id'])
        other = User.objects.create_user('confirmation-other-officer')
        UserProfile.objects.create(user=other, role='officer')
        self.client.force_login(other)
        self.assertEqual(self.client.get(f'/api/attendance/meeting-submissions/{key}/').status_code, 404)

    def test_create_response_does_not_requery_attendance_statistics(self):
        with patch('farm.attendance_views.compute_meeting_stats', side_effect=AssertionError('Unexpected statistics reload')):
            response = self.create()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['meeting']['statistics']['total_invited'], 1)
        self.assertEqual(response.json()['meeting']['records'], [])

    def test_compact_marks_save_all_four_statuses_and_calculate_rate(self):
        ids = [self.farmer_profile.pk]
        for number in range(3):
            user = User.objects.create_user(f'attendance-farmer-{number}')
            ids.append(UserProfile.objects.create(user=user, role='farmer').pk)
        meeting_id = self.create({'farmer_ids': ids}).json()['meeting']['id']
        self.client.post(f'/api/attendance/meetings/{meeting_id}/generate-register/')
        records = list(AttendanceRecord.objects.filter(meeting_id=meeting_id).order_by('pk'))
        marks = [{ 'record_id': record.pk, 'status': status, 'remarks': f'{status} recorded' }
                 for record, status in zip(records, ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'])]
        response = self.client.post(f'/api/attendance/meetings/{meeting_id}/attendance/', json.dumps({'records': marks, 'compact_response': True}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotIn('meeting', data)
        self.assertEqual(data['statistics']['attendance_rate'], 50)
        for key in ('present_count', 'late_count', 'absent_count', 'excused_count'):
            self.assertEqual(data['statistics'][key], 1)
        for record, mark in zip(records, marks):
            record.refresh_from_db()
            self.assertEqual(record.status, mark['status'])
            self.assertEqual(record.officer_remarks, mark['remarks'])
            self.assertEqual(record.recorded_by_id, self.profile.pk)
            self.assertIsNotNone(record.recorded_at)
        fresh = Client()
        fresh.force_login(self.officer)
        self.assertEqual(fresh.get(f'/api/attendance/meetings/{meeting_id}/').json()['meeting']['statistics']['attendance_rate'], 50)
        repeated = self.client.post(f'/api/attendance/meetings/{meeting_id}/attendance/', json.dumps({'records': marks, 'compact_response': True}), content_type='application/json')
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(AttendanceRecord.objects.filter(meeting_id=meeting_id).count(), 4)
        confirmation = self.client.get(f'/api/attendance/meetings/{meeting_id}/attendance/')
        self.assertEqual(confirmation.status_code, 200)
        self.assertEqual(confirmation.json()['statistics']['attendance_rate'], 50)
        self.assertEqual({row['status'] for row in confirmation.json()['records']}, {'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'})

    def test_finalized_register_rejects_automatic_marks(self):
        meeting_id = self.create().json()['meeting']['id']
        self.client.post(f'/api/attendance/meetings/{meeting_id}/generate-register/')
        record = AttendanceRecord.objects.get(meeting_id=meeting_id)
        register = record.register
        register.is_finalized = True
        register.save()
        response = self.client.post(f'/api/attendance/meetings/{meeting_id}/attendance/', json.dumps({'records': [{'record_id': record.pk, 'status': 'PRESENT'}], 'compact_response': True}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        record.refresh_from_db()
        self.assertEqual(record.status, 'UNRECORDED')

    def test_database_failure_during_auth_returns_json_without_processing_save(self):
        request = RequestFactory().post('/api/attendance/meetings/', '{}', content_type='application/json')
        request.user = AnonymousUser()
        handler = patch('farm.middleware.get_authenticated_user', side_effect=OperationalError('private connection details'))
        with handler:
            middleware = BearerTokenAuthMiddleware(lambda request: self.fail('Save handler must not run when authentication cannot access the database'))
            response = middleware(request)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(json.loads(response.content)['code'], 'database_unavailable')
        self.assertNotIn('private', response.content.decode())

    def test_submission_key_cannot_be_reused_for_different_details(self):
        key = str(uuid4())
        self.client.post('/api/attendance/meetings/', json.dumps(self.payload), content_type='application/json', HTTP_IDEMPOTENCY_KEY=key)
        response = self.client.post('/api/attendance/meetings/', json.dumps({**self.payload, 'title': 'Changed'}), content_type='application/json', HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Meeting.objects.count(), 1)

    @override_settings(DEBUG=True)
    def test_failed_submission_does_not_store_receipt(self):
        with patch('farm.attendance_views.MeetingInvitation.objects.bulk_create', side_effect=OperationalError('private details')):
            response = self.client.post('/api/attendance/meetings/', json.dumps(self.payload), content_type='application/json', HTTP_IDEMPOTENCY_KEY=str(uuid4()))
        self.assertEqual(response.status_code, 503)
        self.assertFalse(MeetingSubmission.objects.exists())
        self.assertFalse(Meeting.objects.exists())
