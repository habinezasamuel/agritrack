import json
from collections import Counter
from functools import wraps
from datetime import datetime
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.contrib.auth.models import User
from .models import (
    UserProfile,
    Meeting,
    MeetingInvitation,
    MeetingAttendanceRegister,
    AttendanceRecord,
    AttendanceModificationHistory,
)
from .auth_utils import get_authenticated_user


def get_user_and_profile(request):
    """Returns (user, profile, role) or (None, None, None)."""
    user = get_authenticated_user(request)
    if not user:
        return None, None, None
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'farmer'})
    return user, profile, profile.role.lower()


def compute_meeting_stats(meeting):
    """Compute real-time attendance statistics for a meeting."""
    invitations_count = meeting.invitations.count()
    records = meeting.attendance_records.all()
    
    counts = Counter(record.status for record in records)
    present_count = counts['PRESENT']
    absent_count = counts['ABSENT']
    late_count = counts['LATE']
    excused_count = counts['EXCUSED']
    unrecorded_count = counts['UNRECORDED']
    
    # Farmers who physically attended are Present or Late
    attended_count = present_count + late_count
    rate = round((attended_count / invitations_count * 100), 1) if invitations_count > 0 else 0.0
    modifications_count = meeting.attendance_audits.count()

    return {
        'total_invited': invitations_count,
        'present_count': present_count,
        'absent_count': absent_count,
        'late_count': late_count,
        'excused_count': excused_count,
        'unrecorded_count': unrecorded_count,
        'attended_count': attended_count,
        'attendance_rate': rate,
        'modifications_count': modifications_count,
    }


def serialize_farmer(profile):
    """Serialize farmer UserProfile with complete location data."""
    u = profile.user
    full_name = u.get_full_name() or u.username
    return {
        'id': profile.id,
        'user_id': u.id,
        'name': full_name,
        'username': u.username,
        'email': u.email or '',
        'phone_number': profile.phone_number or '',
        'registration_id': profile.registration_id or '',
        'district': profile.district or 'Ruhango',
        'sector': profile.sector or 'Kinazi',
        'cell': profile.cell or '',
        'village': profile.village or '',
        'location': profile.location or f"{profile.district or 'Ruhango'}, {profile.sector or 'Kinazi'}",
    }


def serialize_meeting(meeting, include_records=True):
    """Serialize Meeting object to JSON-compatible dict."""
    has_register = hasattr(meeting, 'attendance_register') and meeting.attendance_register is not None
    register_data = None

    if has_register:
        reg = meeting.attendance_register
        officer_user = reg.generated_by_officer.user
        register_data = {
            'id': reg.id,
            'generated_at': reg.generated_at.isoformat(),
            'generated_by_officer': {
                'id': reg.generated_by_officer.id,
                'name': officer_user.get_full_name() or officer_user.username,
                'username': officer_user.username,
                'email': officer_user.email or '',
                'phone': reg.generated_by_officer.phone_number or '',
            },
            'is_finalized': reg.is_finalized,
            'finalized_at': reg.finalized_at.isoformat() if reg.finalized_at else None,
            'finalized_by': (
                reg.finalized_by.user.get_full_name() or reg.finalized_by.user.username
            ) if reg.finalized_by else None,
            'notes': reg.notes,
        }

    officer_user = meeting.created_by_officer.user
    created_by_data = {
        'id': meeting.created_by_officer.id,
        'name': officer_user.get_full_name() or officer_user.username,
        'username': officer_user.username,
        'email': officer_user.email or '',
        'phone': meeting.created_by_officer.phone_number or '',
        'role': 'Agricultural Officer',
    }

    stats = compute_meeting_stats(meeting)

    meeting_date_str = meeting.meeting_date.isoformat() if hasattr(meeting.meeting_date, 'isoformat') else str(meeting.meeting_date)

    data = {
        'id': meeting.id,
        'title': meeting.title,
        'description': meeting.description,
        'meeting_date': meeting_date_str,
        'start_time': meeting.start_time,
        'end_time': meeting.end_time,
        'venue': meeting.venue,
        'district': meeting.district,
        'sector': meeting.sector,
        'agenda': meeting.agenda,
        'category': meeting.category,
        'status': meeting.status,
        'created_by': created_by_data,
        'created_at': meeting.created_at.isoformat(),
        'has_register': has_register,
        'register': register_data,
        'statistics': stats,
    }

    if include_records:
        # Invited farmers
        invitations = meeting.invitations.select_related('farmer__user').all()
        data['invited_farmers'] = [
            {
                'invitation_id': inv.id,
                'invited_at': inv.invited_at.isoformat(),
                'invitation_status': inv.invitation_status,
                'farmer': serialize_farmer(inv.farmer),
            }
            for inv in invitations
        ]

        # Attendance records
        records = meeting.attendance_records.select_related(
            'farmer__user', 'recorded_by__user', 'last_modified_by__user'
        ).all()

        data['records'] = [
            {
                'id': rec.id,
                'farmer': serialize_farmer(rec.farmer),
                'status': rec.status,
                'recorded_by': (
                    rec.recorded_by.user.get_full_name() or rec.recorded_by.user.username
                ) if rec.recorded_by else None,
                'recorded_at': rec.recorded_at.isoformat() if rec.recorded_at else None,
                'officer_remarks': rec.officer_remarks or '',
                'is_modified_by_admin': rec.is_modified_by_admin,
                'last_modified_by': (
                    rec.last_modified_by.user.get_full_name() or rec.last_modified_by.user.username
                ) if rec.last_modified_by else None,
                'last_modified_role': rec.last_modified_role,
                'admin_remarks': rec.admin_remarks or '',
                'updated_at': rec.updated_at.isoformat(),
            }
            for rec in records
        ]

        # Audit modification history
        audits = meeting.attendance_audits.select_related('modified_by__user', 'farmer__user').order_by('-timestamp')
        data['audit_history'] = [
            {
                'id': a.id,
                'attendance_record_id': a.attendance_record_id,
                'meeting_id': a.meeting_id,
                'meeting_title': a.meeting_title,
                'farmer_id': a.farmer_id,
                'farmer_name': a.farmer_name,
                'farmer_registration_id': a.farmer_registration_id,
                'previous_status': a.previous_status,
                'new_status': a.new_status,
                'modifier_name': a.modifier_name,
                'modifier_role': a.modifier_role,
                'reason': a.reason,
                'timestamp': a.timestamp.isoformat(),
            }
            for a in audits
        ]

    return data


def validate_farmer_ids(raw_ids):
    if not isinstance(raw_ids, list) or any(type(item) is not int or item <= 0 for item in raw_ids):
        raise ValidationError({'farmer_ids': ['Select valid registered farmer IDs.']})
    ids = set(raw_ids)
    farmers = list(UserProfile.objects.filter(pk__in=ids, role='farmer', user__is_active=True))
    if len(farmers) != len(ids):
        raise ValidationError({'farmer_ids': ['One or more selected farmers are unavailable. Refresh the farmer list.']})
    return farmers


def requested_page(request, queryset):
    """Keep legacy callers compatible; new clients explicitly request pages."""
    if 'page' not in request.GET:
        return queryset, None
    try:
        page = int(request.GET['page'])
        size = int(request.GET.get('page_size', 50))
        if page < 1 or not 1 <= size <= 100:
            raise ValueError
    except (TypeError, ValueError):
        raise ValidationError({'page': ['Use a positive page and a page size between 1 and 100.']})
    count = queryset.count()
    return queryset[(page - 1) * size:page * size], {'page': page, 'page_size': size, 'count': count}


def atomic_mutations(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            with transaction.atomic():
                return view(request, *args, **kwargs)
        return view(request, *args, **kwargs)
    return wrapped


# ==============================================================
# 1. MEETINGS LIST & CREATE
# ==============================================================

@csrf_exempt
@atomic_mutations
def meetings_list_create(request):
    """
    GET: List meetings.
         - Officer: see meetings they manage (or in sector)
         - Admin: see all meetings
         - Farmer: see meetings they are invited to
    POST: Create a meeting (AGRICULTURAL OFFICER ONLY!)
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        if role == 'admin':
            meetings = Meeting.objects.all().prefetch_related('invitations', 'attendance_records')
        elif role == 'officer':
            meetings = Meeting.objects.filter(created_by_officer=profile).prefetch_related('invitations', 'attendance_records')
        else: # farmer
            # Meetings where this farmer was invited
            meetings = Meeting.objects.filter(invitations__farmer=profile).prefetch_related('invitations', 'attendance_records')

        meetings = meetings.select_related(
            'created_by_officer__user', 'attendance_register__generated_by_officer__user',
            'attendance_register__finalized_by__user',
        ).prefetch_related('attendance_audits')
        meetings, page = requested_page(request, meetings.order_by('-meeting_date', '-created_at', '-pk'))
        result = [serialize_meeting(m, include_records=False) for m in meetings]
        return JsonResponse({'meetings': result, **(page or {'count': len(result)})})

    if request.method == 'POST':
        # Strictly enforce officer responsibility!
        if role != 'officer':
            return JsonResponse({
                'error': 'Permission Denied: Only Agricultural Officers are authorized to create meetings and organize farmer attendance registers.'
            }, status=403)

        try:
            body = json.loads(request.body.decode('utf-8'))
            if not isinstance(body, dict):
                raise ValueError('Expected a JSON object')
        except Exception:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)

        if any(not isinstance(body.get(key, ''), str) for key in ('title', 'venue', 'description', 'agenda')):
            return JsonResponse({'error': 'Title, venue, description, and agenda must be text.'}, status=400)
        title = body.get('title', '').strip()
        meeting_date = body.get('meeting_date')
        venue = body.get('venue', '').strip()

        if not title or not meeting_date or not venue:
            return JsonResponse({'error': 'Title, meeting date, and venue are required.'}, status=400)

        farmers = validate_farmer_ids(body.get('farmer_ids', []))
        start_time = body.get('start_time') or '09:00'
        end_time = body.get('end_time') or ''
        try:
            start = datetime.strptime(start_time, '%H:%M').time()
            end = datetime.strptime(end_time, '%H:%M').time() if end_time else None
            if end and end <= start:
                raise ValueError
        except (TypeError, ValueError):
            return JsonResponse({'error': 'Use valid start and end times; end time must be after start time.'}, status=400)

        meeting = Meeting(
            title=title,
            description=body.get('description', ''),
            meeting_date=meeting_date,
            start_time=start_time,
            end_time=end_time,
            venue=venue,
            district=body.get('district') or profile.district or 'Ruhango',
            sector=body.get('sector') or profile.sector or 'Kinazi',
            agenda=body.get('agenda', ''),
            category=body.get('category', 'SEASON_PREPARATION'),
            created_by_officer=profile,
            status='SCHEDULED',
        )

        meeting.full_clean()
        meeting.save()
        MeetingInvitation.objects.bulk_create([
            MeetingInvitation(meeting=meeting, farmer=farmer) for farmer in farmers
        ])

        return JsonResponse({
            'message': 'Meeting created successfully.',
            'meeting': serialize_meeting(meeting, include_records=True),
        }, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ==============================================================
# 2. MEETING DETAIL
# ==============================================================

@csrf_exempt
def meeting_detail(request, meeting_id):
    """GET meeting details with all invited farmers, records, stats, and audit history."""
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    try:
        meeting = Meeting.objects.get(id=meeting_id, **({'created_by_officer': profile} if role == 'officer' else {}))
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)

    # Permission check
    if role == 'farmer':
        if not meeting.invitations.filter(farmer=profile).exists():
            return JsonResponse({'error': 'Access Denied: You are not invited to this meeting.'}, status=403)

    return JsonResponse({'meeting': serialize_meeting(meeting, include_records=True)})


# ==============================================================
# 3. INVITE FARMERS (OFFICER ONLY)
# ==============================================================

@csrf_exempt
@transaction.atomic
def invite_farmers(request, meeting_id):
    """
    POST: Invite registered farmers to a meeting.
    Strictly Agricultural Officer only.
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if role != 'officer':
        return JsonResponse({'error': 'Only Agricultural Officers can invite farmers to meetings.'}, status=403)

    try:
        meeting = Meeting.objects.get(id=meeting_id, **({'created_by_officer': profile} if role == 'officer' else {}))
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)

    try:
        body = json.loads(request.body.decode('utf-8'))
        if not isinstance(body, dict):
            raise ValueError('Expected a JSON object')
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    farmer_ids = body.get('farmer_ids', [])
    if not farmer_ids:
        return JsonResponse({'error': 'Please select at least one registered farmer to invite.'}, status=400)

    farmers = validate_farmer_ids(farmer_ids)
    created_count = 0
    for f in farmers:
        _, created = MeetingInvitation.objects.get_or_create(meeting=meeting, farmer=f)
        if created:
            created_count += 1
            # If register was already generated, automatically add an UNRECORDED record
            if hasattr(meeting, 'attendance_register') and meeting.attendance_register:
                AttendanceRecord.objects.get_or_create(
                    register=meeting.attendance_register,
                    meeting=meeting,
                    farmer=f,
                    defaults={'status': 'UNRECORDED'}
                )

    return JsonResponse({
        'message': f'Successfully invited {created_count} new farmer(s).',
        'meeting': serialize_meeting(meeting, include_records=True),
    })


# ==============================================================
# 4. GENERATE ATTENDANCE REGISTER (OFFICER ONLY)
# ==============================================================

@csrf_exempt
def generate_attendance_register(request, meeting_id):
    """
    POST: Generate attendance register from real database invited farmers.
    STRICT MANDATORY REQUIREMENT:
    - Agricultural Officer ONLY.
    - Administrator MUST NOT generate the register.
    - Generated from real invitation records stored in DB.
    - Initial status is UNRECORDED (not fake or auto-present).
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    # STRICT REQUIREMENT: Officer only, Admin explicitly forbidden!
    if role == 'admin':
        return JsonResponse({
            'error': 'Permission Denied: Administrators must NOT generate initial attendance registers. This responsibility belongs strictly to the Agricultural Officer.'
        }, status=403)

    if role != 'officer':
        return JsonResponse({
            'error': 'Permission Denied: Only Agricultural Officers can generate the meeting attendance register.'
        }, status=403)

    try:
        meeting = Meeting.objects.get(id=meeting_id, **({'created_by_officer': profile} if role == 'officer' else {}))
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)

    with transaction.atomic():
        # Check if register already exists
        register, created = MeetingAttendanceRegister.objects.get_or_create(
            meeting=meeting,
            defaults={'generated_by_officer': profile}
        )

        # Get all real invited farmers for this meeting
        invitations = meeting.invitations.select_related('farmer').all()
        if not invitations.exists():
            return JsonResponse({
                'error': 'Cannot generate attendance register: No farmers have been invited to this meeting yet. Please invite registered farmers first.'
            }, status=400)

        # Generate attendance record for each invited farmer
        records_created = 0
        for inv in invitations:
            rec, rec_created = AttendanceRecord.objects.get_or_create(
                register=register,
                meeting=meeting,
                farmer=inv.farmer,
                defaults={
                    'status': 'UNRECORDED',  # Real invitation, pending physical attendance check
                    'recorded_by': profile,
                }
            )
            if rec_created:
                records_created += 1

        meeting.status = 'REGISTER_GENERATED'
        meeting.save()

    return JsonResponse({
        'message': f'Attendance register generated successfully for {invitations.count()} invited farmer(s).',
        'meeting': serialize_meeting(meeting, include_records=True),
    }, status=201 if created else 200)


# ==============================================================
# 5. OFFICER RECORD / SAVE ATTENDANCE
# ==============================================================

@csrf_exempt
def record_attendance(request, meeting_id):
    """
    POST / PUT: Agricultural Officer marks and saves attendance.
    Statuses: PRESENT, ABSENT, LATE, EXCUSED.
    Saves to Neon PostgreSQL.
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if role != 'officer':
        return JsonResponse({
            'error': 'Permission Denied: Only Agricultural Officers can record and mark initial meeting attendance.'
        }, status=403)

    try:
        meeting = Meeting.objects.get(id=meeting_id, **({'created_by_officer': profile} if role == 'officer' else {}))
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)

    if not hasattr(meeting, 'attendance_register') or not meeting.attendance_register:
        return JsonResponse({
            'error': 'Attendance register has not been generated for this meeting yet. Please click "Generate Attendance Register" first.'
        }, status=400)

    if meeting.attendance_register.is_finalized:
        return JsonResponse({'error': 'This register is finalized. An administrator must review any corrections.'}, status=400)

    try:
        body = json.loads(request.body.decode('utf-8'))
        if not isinstance(body, dict):
            raise ValueError('Expected a JSON object')
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    records_data = body.get('records', [])
    if not isinstance(records_data, list):
        return JsonResponse({'error': 'Records must be a list.'}, status=400)

    now = timezone.now()
    valid_statuses = {'PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'UNRECORDED'}

    with transaction.atomic():
        existing = list(meeting.attendance_records.select_for_update())
        by_id = {record.id: record for record in existing}
        by_farmer = {record.farmer_id: record for record in existing}
        updated = []
        seen = set()
        for item in records_data:
            if not isinstance(item, dict) or not isinstance(item.get('status'), str):
                return JsonResponse({'error': 'Each attendance item must include a valid status.'}, status=400)
            record_id, farmer_id = item.get('record_id'), item.get('farmer_id')
            if (record_id is not None and type(record_id) is not int) or (farmer_id is not None and type(farmer_id) is not int):
                return JsonResponse({'error': 'Attendance record and farmer IDs must be integers.'}, status=400)
            rec = by_id.get(record_id) if record_id else by_farmer.get(farmer_id)
            status = item['status'].upper()
            remarks = item.get('remarks', '')
            if not rec or status not in valid_statuses or rec.id in seen or not isinstance(remarks, str):
                return JsonResponse({'error': 'Check attendance statuses, remarks, and record IDs. No changes were saved.'}, status=400)
            seen.add(rec.id)
            rec.status = status
            rec.recorded_by = profile
            rec.recorded_at = now
            rec.officer_remarks = remarks
            rec.updated_at = now
            updated.append(rec)
        AttendanceRecord.objects.bulk_update(updated, ['status', 'recorded_by', 'recorded_at', 'officer_remarks', 'updated_at'])
        updated_count = len(updated)
        if meeting.status == 'REGISTER_GENERATED':
            meeting.status = 'IN_PROGRESS'
            meeting.save()

    return JsonResponse({
        'message': f'Attendance register saved successfully. Updated {updated_count} record(s).',
        'meeting': serialize_meeting(meeting, include_records=True),
    })


# ==============================================================
# 6. FINALIZE ATTENDANCE REGISTER (OFFICER ONLY)
# ==============================================================

@csrf_exempt
def finalize_attendance_register(request, meeting_id):
    """
    POST: Finalize the attendance register after the meeting.
    Strictly Agricultural Officer.
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if role != 'officer':
        return JsonResponse({'error': 'Only Agricultural Officers can finalize attendance registers.'}, status=403)

    try:
        meeting = Meeting.objects.get(id=meeting_id, **({'created_by_officer': profile} if role == 'officer' else {}))
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)

    if not hasattr(meeting, 'attendance_register') or not meeting.attendance_register:
        return JsonResponse({'error': 'Register not generated yet.'}, status=400)

    reg = meeting.attendance_register
    reg.is_finalized = True
    reg.finalized_at = timezone.now()
    reg.finalized_by = profile
    reg.save()

    meeting.status = 'FINALIZED'
    meeting.save()

    return JsonResponse({
        'message': 'Attendance register finalized successfully.',
        'meeting': serialize_meeting(meeting, include_records=True),
    })


# ==============================================================
# 7. ADMINISTRATOR REVIEW: LIST ALL OFFICER REGISTERS
# ==============================================================

@csrf_exempt
def admin_attendance_review_list(request):
    """
    GET: Officer Attendance Review section on administrator dashboard.
    Administrator views all registers generated by agricultural officers.
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    if role != 'admin':
        return JsonResponse({
            'error': 'Permission Denied: Only Administrators have access to Officer Attendance Review.'
        }, status=403)

    # Return all meetings that have an attendance register generated
    meetings = Meeting.objects.filter(
        attendance_register__isnull=False
    ).select_related(
        'attendance_register',
        'attendance_register__generated_by_officer__user',
        'created_by_officer__user'
    ).prefetch_related('invitations', 'attendance_records', 'attendance_audits').order_by('-meeting_date')

    review_list = []
    for m in meetings:
        reg = m.attendance_register
        officer = reg.generated_by_officer.user
        stats = compute_meeting_stats(m)
        review_list.append({
            'meeting_id': m.id,
            'meeting_title': m.title,
            'meeting_date': m.meeting_date.isoformat() if hasattr(m.meeting_date, 'isoformat') else str(m.meeting_date),
            'start_time': m.start_time,
            'venue': m.venue,
            'district': m.district,
            'sector': m.sector,
            'category': m.category,
            'status': m.status,
            'register_id': reg.id,
            'register_generated_at': reg.generated_at.isoformat(),
            'generated_by_officer': {
                'id': reg.generated_by_officer.id,
                'name': officer.get_full_name() or officer.username,
                'username': officer.username,
                'email': officer.email or '',
                'phone': reg.generated_by_officer.phone_number or '',
            },
            'is_finalized': reg.is_finalized,
            'finalized_at': reg.finalized_at.isoformat() if reg.finalized_at else None,
            'statistics': stats,
            'corrections_count': m.attendance_audits.count(),
        })

    return JsonResponse({
        'registers': review_list,
        'count': len(review_list),
    })


# ==============================================================
# 8. ADMINISTRATOR MODIFICATION & AUDIT LOGGING
# ==============================================================

@csrf_exempt
def admin_modify_attendance(request, meeting_id):
    """
    POST: Administrator modifies an existing attendance status.
    - Changes Present to Absent, Absent to Present, Late to Present, etc.
    - Adds a correction reason / remark.
    - Saves changes directly to Neon PostgreSQL.
    - Records permanent audit history separate from the attendance record.
    - Recalculates statistics immediately.
    STRICT MANDATORY REQUIREMENT: Admin ONLY!
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    # Strictly verify admin role
    if role != 'admin':
        return JsonResponse({
            'error': 'Permission Denied: Only Administrators are authorized to review and modify officer attendance registers with audit logging.'
        }, status=403)

    try:
        meeting = Meeting.objects.get(id=meeting_id, **({'created_by_officer': profile} if role == 'officer' else {}))
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)

    if not hasattr(meeting, 'attendance_register') or not meeting.attendance_register:
        return JsonResponse({'error': 'Cannot modify attendance: No register generated for this meeting.'}, status=400)

    try:
        body = json.loads(request.body.decode('utf-8'))
        if not isinstance(body, dict):
            raise ValueError('Expected a JSON object')
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    record_id = body.get('record_id')
    farmer_id = body.get('farmer_id')
    new_status = body.get('new_status', '').upper()
    reason = body.get('reason', '').strip()
    admin_remarks = body.get('remarks', '').strip()

    valid_statuses = {'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'}
    if new_status not in valid_statuses:
        return JsonResponse({
            'error': f"Invalid status '{new_status}'. Must be one of PRESENT, ABSENT, LATE, EXCUSED."
        }, status=400)

    if not reason:
        reason = "Administrative verification correction"

    # Find the record
    rec = None
    if record_id:
        rec = AttendanceRecord.objects.filter(id=record_id, meeting=meeting).first()
    elif farmer_id:
        rec = AttendanceRecord.objects.filter(farmer_id=farmer_id, meeting=meeting).first()

    if not rec:
        return JsonResponse({'error': 'Attendance record not found for this farmer in this meeting.'}, status=404)

    previous_status = rec.status
    farmer_profile = rec.farmer
    farmer_user = farmer_profile.user
    farmer_name = farmer_user.get_full_name() or farmer_user.username

    with transaction.atomic():
        # Update attendance record
        rec.status = new_status
        rec.is_modified_by_admin = True
        rec.last_modified_by = profile
        rec.last_modified_role = 'ADMIN'
        rec.admin_remarks = reason if not admin_remarks else f"{reason} - {admin_remarks}"
        rec.save()

        # Create permanent audit entry (Section C requirement)
        admin_name = user.get_full_name() or user.username
        audit = AttendanceModificationHistory.objects.create(
            attendance_record=rec,
            meeting=meeting,
            meeting_title=meeting.title,
            farmer=farmer_profile,
            farmer_name=farmer_name,
            farmer_registration_id=farmer_profile.registration_id or f"RWA-REG-{farmer_profile.id:04d}",
            previous_status=previous_status,
            new_status=new_status,
            modified_by=profile,
            modifier_name=admin_name,
            modifier_role='ADMIN',
            reason=reason,
            timestamp=timezone.now(),
        )

    # Return complete updated meeting with synchronized statistics and audit history
    return JsonResponse({
        'message': f"Successfully updated {farmer_name}'s attendance from {previous_status} to {new_status}.",
        'audit_id': audit.id,
        'meeting': serialize_meeting(meeting, include_records=True),
    })


# ==============================================================
# 9. REGISTERED FARMERS LIST
# ==============================================================

@csrf_exempt
def registered_farmers_list(request):
    """
    GET: Return registered farmers stored in database for meeting invitation.
    Contains name, registration ID, district, sector, cell, village.
    """
    user, profile, role = get_user_and_profile(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    if role not in ('officer', 'admin'):
        return JsonResponse({'error': 'Officer or administrator permission required'}, status=403)

    farmers = UserProfile.objects.filter(role='farmer', user__is_active=True).select_related('user').order_by('user__first_name', 'pk')
    search = request.GET.get('search', '').strip()[:150]
    if search:
        farmers = farmers.filter(
            Q(user__first_name__icontains=search) | Q(user__last_name__icontains=search)
            | Q(user__username__icontains=search) | Q(registration_id__icontains=search)
            | Q(district__icontains=search) | Q(sector__icontains=search)
            | Q(cell__icontains=search) | Q(village__icontains=search)
        )
    farmers, page = requested_page(request, farmers)
    data = [serialize_farmer(f) for f in farmers]
    return JsonResponse({'farmers': data, **(page or {'count': len(data)})})
