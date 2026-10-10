import os
import sys
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
django.setup()

from datetime import date
from django.test import RequestFactory
from django.contrib.auth.models import User
from farm.models import (
    UserProfile,
    Meeting,
    MeetingInvitation,
    MeetingAttendanceRegister,
    AttendanceRecord,
    AttendanceModificationHistory,
)
from farm.attendance_views import (
    meetings_list_create,
    invite_farmers,
    generate_attendance_register,
    record_attendance,
    admin_attendance_review_list,
    admin_modify_attendance,
    meeting_detail,
)

print("=" * 70, flush=True)
print("TESTING CLEAR RESPONSIBILITIES: OFFICER GENERATION & ADMIN MODIFICATION", flush=True)
print("=" * 70, flush=True)

rf = RequestFactory()

# Fetch users
officer_user = User.objects.get(username='officer')
admin_user = User.objects.get(username='admin')
farmer_user = User.objects.get(username='farmer')

officer_profile = UserProfile.objects.get(user=officer_user)
admin_profile = UserProfile.objects.get(user=admin_user)
farmer_profile = UserProfile.objects.get(user=farmer_user)

# Other farmers
other_farmers = list(UserProfile.objects.filter(role='farmer').exclude(id=farmer_profile.id)[:4])
invited_farmer_ids = [farmer_profile.id] + [f.id for f in other_farmers]

print(f"Users found: Officer ({officer_user.username}), Admin ({admin_user.username}), Farmers ({len(invited_farmer_ids)})", flush=True)

# ---------------------------------------------------------
# STEP 1: Agricultural officer creates a meeting
# ---------------------------------------------------------
print("\n--- STEP 1: Agricultural officer creates a meeting ---", flush=True)
req = rf.post('/api/meetings/', data=json.dumps({
    'title': 'Season 2026A Kinazi Maize & Banana Productivity Assembly',
    'description': 'Mandatory seasonal alignment on input schedules, pest control, and yield tracking.',
    'meeting_date': str(date.today()),
    'start_time': '09:00',
    'end_time': '12:00',
    'venue': 'Kinazi Sector Community Auditorium',
    'district': 'Ruhango',
    'sector': 'Kinazi',
    'category': 'SEASON_PREPARATION',
    'agenda': '1. Seed and fertilizer delivery timelines\n2. Banana Xanthomonas Wilt prevention\n3. Cooperative market linkages',
}), content_type='application/json')
req.user = officer_user

res = meetings_list_create(req)
assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.content}"
res_data = json.loads(res.content)
meeting_id = res_data['meeting']['id']
print(f"SUCCESS: Meeting created by Officer. Meeting ID: {meeting_id}, Title: '{res_data['meeting']['title']}'", flush=True)

# Verify Admin CANNOT create a meeting
admin_create_req = rf.post('/api/meetings/', data=json.dumps({'title': 'Admin Meeting', 'meeting_date': str(date.today()), 'venue': 'HQ'}), content_type='application/json')
admin_create_req.user = admin_user
admin_create_res = meetings_list_create(admin_create_req)
assert admin_create_res.status_code == 403, f"Admin should NOT create meetings! Expected 403, got {admin_create_res.status_code}"
print("PERMISSION CHECK PASSED: Admin is forbidden from creating meetings (HTTP 403)", flush=True)

# ---------------------------------------------------------
# STEP 2: The officer invites registered farmers
# ---------------------------------------------------------
print("\n--- STEP 2: Officer invites registered farmers ---", flush=True)
req = rf.post(f'/api/meetings/{meeting_id}/invite/', data=json.dumps({
    'farmer_ids': invited_farmer_ids,
}), content_type='application/json')
req.user = officer_user

res = invite_farmers(req, meeting_id)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
meeting_obj = Meeting.objects.get(id=meeting_id)
assert meeting_obj.invitations.count() == len(invited_farmer_ids)
print(f"SUCCESS: Invited {meeting_obj.invitations.count()} registered farmers with location data into meeting.", flush=True)

# ---------------------------------------------------------
# STEP 3: Admin CANNOT generate the attendance register
# ---------------------------------------------------------
print("\n--- STEP 3: Verify Admin CANNOT generate attendance register ---", flush=True)
admin_gen_req = rf.post(f'/api/meetings/{meeting_id}/generate-register/')
admin_gen_req.user = admin_user
admin_gen_res = generate_attendance_register(admin_gen_req, meeting_id)
assert admin_gen_res.status_code == 403, f"Admin should NOT generate register! Got {admin_gen_res.status_code}"
print(f"PERMISSION CHECK PASSED: Admin denied from generating register (HTTP 403: {json.loads(admin_gen_res.content)['error']})", flush=True)

# Officer generates attendance register
print("\n--- Officer generates the attendance register ---", flush=True)
officer_gen_req = rf.post(f'/api/meetings/{meeting_id}/generate-register/')
officer_gen_req.user = officer_user
officer_gen_res = generate_attendance_register(officer_gen_req, meeting_id)
assert officer_gen_res.status_code == 201, f"Expected 201, got {officer_gen_res.status_code}: {officer_gen_res.content}"
reg = MeetingAttendanceRegister.objects.get(meeting_id=meeting_id)
assert reg.generated_by_officer == officer_profile
assert reg.records.count() == len(invited_farmer_ids)
# Verify real records are initially UNRECORDED (not fake or auto-present)
unrecorded_count = reg.records.filter(status='UNRECORDED').count()
assert unrecorded_count == len(invited_farmer_ids), f"Initial status must be UNRECORDED. Found {unrecorded_count}"
print(f"SUCCESS: Attendance register generated by Officer Dr. Jeanne Mukamana. Records count: {reg.records.count()}, Initial status: UNRECORDED", flush=True)

# ---------------------------------------------------------
# STEP 4: Officer records and saves attendance
# ---------------------------------------------------------
print("\n--- STEP 4: Officer records and saves attendance ---", flush=True)
# We mark:
# - Farmer 1 (Emmanuel Hakizimana): ABSENT (officer didn't see him initially)
# - Farmer 2: PRESENT
# - Farmer 3: LATE
# - Farmer 4: EXCUSED
records_to_save = [
    {'farmer_id': farmer_profile.id, 'status': 'ABSENT', 'remarks': 'Not present at roll call'},
    {'farmer_id': other_farmers[0].id, 'status': 'PRESENT', 'remarks': 'Attended on time'},
    {'farmer_id': other_farmers[1].id, 'status': 'LATE', 'remarks': 'Arrived 30 mins late'},
    {'farmer_id': other_farmers[2].id, 'status': 'EXCUSED', 'remarks': 'Sent written note for medical visit'},
]
if len(other_farmers) > 3:
    records_to_save.append({'farmer_id': other_farmers[3].id, 'status': 'PRESENT', 'remarks': 'Present'})

save_req = rf.post(f'/api/meetings/{meeting_id}/attendance/', data=json.dumps({
    'records': records_to_save,
}), content_type='application/json')
save_req.user = officer_user

save_res = record_attendance(save_req, meeting_id)
assert save_res.status_code == 200, f"Expected 200, got {save_res.status_code}: {save_res.content}"
save_data = json.loads(save_res.content)
print(f"SUCCESS: Officer recorded attendance. Stats: {save_data['meeting']['statistics']}", flush=True)
assert save_data['meeting']['statistics']['absent_count'] >= 1
assert save_data['meeting']['statistics']['present_count'] >= 1

# ---------------------------------------------------------
# STEP 5: Administrator opens the existing register
# ---------------------------------------------------------
print("\n--- STEP 5: Administrator reviews the officer's register ---", flush=True)
admin_list_req = rf.get('/api/admin/attendance-review/')
admin_list_req.user = admin_user
admin_list_res = admin_attendance_review_list(admin_list_req)
assert admin_list_res.status_code == 200
admin_list_data = json.loads(admin_list_res.content)
matching = [r for r in admin_list_data['registers'] if r['meeting_id'] == meeting_id]
assert len(matching) == 1, "Meeting register should appear in Admin Review list"
print(f"SUCCESS: Admin found officer-generated register in 'Officer Attendance Review'. Generated by: {matching[0]['generated_by_officer']['name']}", flush=True)

# ---------------------------------------------------------
# STEP 6 & 7: Administrator modifies a farmer's attendance status
# ---------------------------------------------------------
print("\n--- STEP 6 & 7: Administrator modifies attendance status & saves to PostgreSQL ---", flush=True)
# Officer marked Emmanuel as ABSENT. Admin verifies he attended with hall entry slip and changes him to PRESENT.
emmanuel_record = AttendanceRecord.objects.get(meeting_id=meeting_id, farmer=farmer_profile)
assert emmanuel_record.status == 'ABSENT'

mod_req = rf.post(f'/api/admin/attendance-review/{meeting_id}/modify/', data=json.dumps({
    'record_id': emmanuel_record.id,
    'new_status': 'PRESENT',
    'reason': 'Verified presence via auditorium entry ticket #204; officer roll call was missed during registration queue.',
    'remarks': 'Approved by Administrator Alex Kagabo',
}), content_type='application/json')
mod_req.user = admin_user

mod_res = admin_modify_attendance(mod_req, meeting_id)
assert mod_res.status_code == 200, f"Expected 200, got {mod_res.status_code}: {mod_res.content}"
mod_data = json.loads(mod_res.content)
print(f"SUCCESS: Admin modified attendance: {mod_data['message']}", flush=True)

# Verify Neon PostgreSQL has updated record directly without duplicating registers
emmanuel_record.refresh_from_db()
assert emmanuel_record.status == 'PRESENT', "Database record must be updated to PRESENT"
assert emmanuel_record.is_modified_by_admin is True, "Must be flagged as modified by admin"
assert emmanuel_record.last_modified_role == 'ADMIN'
assert MeetingAttendanceRegister.objects.filter(meeting_id=meeting_id).count() == 1, "There must remain exactly ONE register!"

# ---------------------------------------------------------
# STEP 8: Officer sees the corrected record
# ---------------------------------------------------------
print("\n--- STEP 8: Officer opens register and sees synchronized corrected record ---", flush=True)
officer_view_req = rf.get(f'/api/meetings/{meeting_id}/')
officer_view_req.user = officer_user
officer_view_res = meeting_detail(officer_view_req, meeting_id)
assert officer_view_res.status_code == 200
officer_view_data = json.loads(officer_view_res.content)['meeting']

emmanuel_in_officer_view = next(r for r in officer_view_data['records'] if r['farmer']['id'] == farmer_profile.id)
assert emmanuel_in_officer_view['status'] == 'PRESENT'
assert emmanuel_in_officer_view['is_modified_by_admin'] is True
print(f"SUCCESS: Officer dashboard sees corrected status: {emmanuel_in_officer_view['farmer']['name']} is now '{emmanuel_in_officer_view['status']}' (Admin remarked: '{emmanuel_in_officer_view['admin_remarks']}')", flush=True)

# ---------------------------------------------------------
# STEP 9: Attendance totals and reports reflect the correction
# ---------------------------------------------------------
print("\n--- STEP 9: Attendance totals reflect the correction ---", flush=True)
stats = officer_view_data['statistics']
print(f"Updated Stats: Present: {stats['present_count']}, Absent: {stats['absent_count']}, Late: {stats['late_count']}, Rate: {stats['attendance_rate']}%, Modifications: {stats['modifications_count']}", flush=True)
assert stats['absent_count'] == 0, "Absent count decreased to 0 because Emmanuel was corrected to Present"

# ---------------------------------------------------------
# STEP 10: The audit history identifies who changed the record and when
# ---------------------------------------------------------
print("\n--- STEP 10: Audit history verification ---", flush=True)
audits = officer_view_data['audit_history']
assert len(audits) >= 1, "Audit log must contain at least 1 record"
latest_audit = audits[0]
print(f"Audit Entry: Farmer: {latest_audit['farmer_name']}, Prev: {latest_audit['previous_status']} -> New: {latest_audit['new_status']}")
print(f"             Modified By: {latest_audit['modifier_name']} ({latest_audit['modifier_role']}) at {latest_audit['timestamp']}")
print(f"             Reason: {latest_audit['reason']}")

assert latest_audit['previous_status'] == 'ABSENT'
assert latest_audit['new_status'] == 'PRESENT'
assert latest_audit['modifier_role'] == 'ADMIN'
assert 'Verified presence' in latest_audit['reason']

print("\n" + "=" * 70, flush=True)
print("ALL 10 WORKFLOW STEPS & PERMISSIONS SUCCESSFULLY VERIFIED!", flush=True)
print("=" * 70, flush=True)
