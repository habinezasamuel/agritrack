import json
from datetime import datetime

from django.db import transaction
from django.db.models import OuterRef, Subquery, Sum
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import (
    BananaPlantation, BananaGrowthLog, BananaDiseaseReport,
    BananaWeatherReport, BananaAssistanceRequest, BananaOfficerAdvice,
    Farm, Field, UserProfile
)
from .auth_utils import get_authenticated_user

def _safe_iso(val):
    if not val:
        return ''
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    return str(val)

def _get_plantation(raw_id, user=None):
    if not raw_id:
        return None
    pid_str = str(raw_id).replace('ban-plant-', '').strip()
    qs = _accessible_plantations(user) if user else BananaPlantation.objects.all()
    try:
        pid = int(pid_str)
        return qs.filter(pk=pid).first()
    except (ValueError, TypeError):
        pass
    return qs.filter(name__icontains=str(raw_id)).first()


def _is_farmer_user(user):
    return bool(user and hasattr(user, 'userprofile') and user.userprofile.role == 'farmer')


def _accessible_plantations(user):
    if _is_farmer_user(user):
        return BananaPlantation.objects.filter(farmer=user.userprofile)
    profile = getattr(user, 'userprofile', None)
    if profile and profile.role == 'admin':
        return BananaPlantation.objects.all()
    if profile and profile.role == 'officer':
        return BananaPlantation.objects.filter(assistance_requests__assigned_officer=profile).distinct()
    return BananaPlantation.objects.none()


def _accessible_growth_logs(user):
    if _is_farmer_user(user):
        return BananaGrowthLog.objects.filter(plantation__farmer=user.userprofile)
    return BananaGrowthLog.objects.filter(plantation__in=_accessible_plantations(user))


def _accessible_disease_reports(user):
    if _is_farmer_user(user):
        return BananaDiseaseReport.objects.filter(farmer=user.userprofile)
    return BananaDiseaseReport.objects.filter(plantation__in=_accessible_plantations(user))


def _accessible_weather_reports(user):
    if _is_farmer_user(user):
        return BananaWeatherReport.objects.filter(farmer=user.userprofile)
    return BananaWeatherReport.objects.filter(plantation__in=_accessible_plantations(user))


def _accessible_assistance_requests(user):
    if _is_farmer_user(user):
        return BananaAssistanceRequest.objects.filter(farmer=user.userprofile)
    profile = getattr(user, 'userprofile', None)
    if profile and profile.role == 'admin':
        return BananaAssistanceRequest.objects.all()
    if profile and profile.role == 'officer':
        return BananaAssistanceRequest.objects.filter(assigned_officer=profile)
    return BananaAssistanceRequest.objects.none()

def serialize_plantation(p):
    return {
        'id': str(p.id),
        'farmId': str(p.farm.id) if p.farm else '',
        'farmName': p.farm.name if p.farm else 'Rwanda Farm',
        'fieldName': p.name,
        'variety': p.variety,
        'landSizeHectares': float(p.land_size_hectares),
        'plantingDate': _safe_iso(p.planting_date),
        'plantsPlantedCount': p.total_plants_planted,
        'plantingMethod': 'TISSUE_CULTURE',
        'soilType': 'Volcanic Loam',
        'irrigationMethod': 'Rainfed with Swales & Mulch',
        'location': p.farm.location if p.farm else 'Ruhango District',
        'photoUrl': p.photo_url or '',
        'notes': p.notes or '',
        'status': 'SHOOTING' if p.status == 'FLOWERING_SHOOTING' else ('HARVEST_READY' if p.status == 'HARVESTING_READY' else 'GROWING'),
        'createdAt': _safe_iso(p.created_at),
        'updatedAt': _safe_iso(p.updated_at),
    }

def serialize_growth_log(g):
    return {
        'id': str(g.id),
        'plantationId': str(g.plantation.id),
        'plantationName': g.plantation.name,
        'recordedDate': _safe_iso(g.date),
        'stage': g.stage,
        'plantHeightMeters': float(g.average_height_meters) if g.average_height_meters else None,
        'averageStemGirthCm': float(g.pseudostem_girth_cm) if g.pseudostem_girth_cm else None,
        'healthyPlantsCount': g.healthy_plants,
        'damagedPlantsCount': g.damaged_plants,
        'observations': g.general_observations or '',
        'photos': [g.photo_url] if g.photo_url else [],
        'recordedByName': g.recorded_by.user.get_full_name() if g.recorded_by else 'Farmer Hakizimana',
        'createdAt': _safe_iso(g.created_at),
    }

def serialize_disease_report(d):
    advice = d.plantation.assistance_requests.filter(disease_report=d).first()
    officer_advice = None
    if advice and advice.officer_advices.exists():
        first_adv = advice.officer_advices.first()
        officer_advice = {
            'id': str(first_adv.id),
            'requestId': str(advice.id),
            'officerId': str(first_adv.officer.id),
            'officerName': first_adv.officer.user.get_full_name() or first_adv.officer.user.username,
            'officerRole': 'Senior Agronomist & Crop Protection Officer',
            'adviceDate': _safe_iso(first_adv.created_at.date() if hasattr(first_adv.created_at, 'date') else first_adv.created_at),
            'diagnosis': first_adv.diagnosis,
            'recommendations': first_adv.recommendations,
            'actionTaken': first_adv.action_taken or '',
            'recommendedProducts': [first_adv.recommended_products] if first_adv.recommended_products else [],
            'followUpDate': _safe_iso(first_adv.follow_up_date) or None,
            'createdAt': _safe_iso(first_adv.created_at),
        }

    year_str = d.created_at.strftime('%Y') if hasattr(d.created_at, 'strftime') else '2024'
    return {
        'id': str(d.id),
        'reportNumber': f"BDR-{year_str}-{d.id:03d}",
        'plantationId': str(d.plantation.id),
        'plantationName': d.plantation.name,
        'farmerId': str(d.farmer.id) if d.farmer else '',
        'farmerName': d.farmer.user.get_full_name() or d.farmer.user.username if d.farmer else '',
        'farmerPhone': d.farmer.phone_number if d.farmer else '',
        'reportDate': _safe_iso(d.report_date),
        'problemType': d.problem_type,
        'problemTypeName': d.problem_type.replace('_', ' ').title(),
        'severity': d.severity,
        'description': d.description,
        'affectedPlantsCount': d.affected_plants_count,
        'location': d.location_details or 'Ruhango District',
        'photos': [d.photo_url] if d.photo_url else [],
        'notes': d.additional_notes or '',
        'assistanceRequested': d.request_assistance,
        'status': d.status,
        'officerAdvice': officer_advice,
        'createdAt': _safe_iso(d.created_at),
        'updatedAt': _safe_iso(d.updated_at),
    }

def serialize_weather_report(w):
    year_str = w.created_at.strftime('%Y') if hasattr(w.created_at, 'strftime') else '2024'
    return {
        'id': str(w.id),
        'reportNumber': f"BWR-{year_str}-{w.id:03d}",
        'plantationId': str(w.plantation.id),
        'plantationName': w.plantation.name,
        'farmerId': str(w.farmer.id) if w.farmer else '',
        'farmerName': w.farmer.user.get_full_name() or w.farmer.user.username if w.farmer else '',
        'farmerPhone': w.farmer.phone_number if w.farmer else '',
        'eventDate': _safe_iso(w.date),
        'weatherCondition': w.weather_type,
        'damageLevel': w.damage_level,
        'affectedPlantsCount': w.affected_plants_estimate,
        'description': w.description,
        'photos': [w.photo_url] if w.photo_url else [],
        'assistanceRequested': w.request_assistance,
        'status': 'REVIEWED',
        'createdAt': _safe_iso(w.created_at),
        'updatedAt': _safe_iso(w.created_at),
    }

def serialize_assistance_request(req):
    advices = []
    for a in req.officer_advices.all():
        advices.append({
            'id': str(a.id),
            'requestId': str(req.id),
            'officerId': str(a.officer.id),
            'officerName': a.officer.user.get_full_name() or a.officer.user.username,
            'officerRole': 'Senior Agronomist & Crop Protection Officer',
            'adviceDate': _safe_iso(a.created_at.date() if hasattr(a.created_at, 'date') else a.created_at),
            'diagnosis': a.diagnosis,
            'recommendations': a.recommendations,
            'actionTaken': a.action_taken or '',
            'recommendedProducts': [a.recommended_products] if a.recommended_products else [],
            'followUpDate': _safe_iso(a.follow_up_date) or None,
            'createdAt': _safe_iso(a.created_at),
        })

    year_str = req.created_at.strftime('%Y') if hasattr(req.created_at, 'strftime') else '2024'
    return {
        'id': str(req.id),
        'requestNumber': f"BAR-{year_str}-{req.id:03d}",
        'plantationId': str(req.plantation.id),
        'plantationName': req.plantation.name,
        'farmerId': str(req.farmer.id) if req.farmer else '',
        'farmerName': req.farmer.user.get_full_name() or req.farmer.user.username if req.farmer else '',
        'farmerPhone': req.farmer.phone_number if req.farmer else '',
        'subject': req.subject,
        'category': req.category,
        'description': req.description,
        'urgency': req.urgency,
        'status': req.status,
        'assignedOfficerName': req.assigned_officer.user.get_full_name() if req.assigned_officer else None,
        'adviceHistory': advices,
        'actionTaken': req.officer_advices.first().action_taken if req.officer_advices.exists() else None,
        'createdAt': _safe_iso(req.created_at),
        'updatedAt': _safe_iso(req.updated_at),
    }

# ----------------- Plantations API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def plantations_list_create(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)

    if request.method == "GET":
        plantations = _accessible_plantations(user).select_related('farmer__user', 'farm')
        return JsonResponse([serialize_plantation(p) for p in plantations], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile

    errors = {}
    name = str(data.get('fieldName') or '').strip()
    if not name:
        errors['fieldName'] = ['Field / plot name is required.']

    try:
        size = float(data.get('landSizeHectares'))
        if size < 0.01:
            raise ValueError
    except (TypeError, ValueError):
        errors['landSizeHectares'] = ['Land size in hectares is required and must be at least 0.01.']
        size = None

    planting_date = None
    raw_date = str(data.get('plantingDate') or '').strip()
    if not raw_date:
        errors['plantingDate'] = ['Planting date is required.']
    else:
        try:
            planting_date = datetime.strptime(raw_date, '%Y-%m-%d').date()
        except ValueError:
            errors['plantingDate'] = ['Planting date must be a valid date in YYYY-MM-DD format.']

    try:
        plants_count = int(data.get('plantsPlantedCount'))
        if plants_count < 1:
            raise ValueError
    except (TypeError, ValueError):
        errors['plantsPlantedCount'] = ['Plants / mats planted count is required and must be a positive whole number.']
        plants_count = None

    if errors:
        return JsonResponse({'message': 'Please correct the highlighted fields.', 'details': errors}, status=400)

    farm_name = str(data.get('farmName') or '').strip()
    variety = str(data.get('variety') or 'FHIA-17').strip() or 'FHIA-17'
    photo_url = str(data.get('photoUrl') or '')
    notes = str(data.get('notes') or '')

    try:
        with transaction.atomic():
            farm = Farm.objects.filter(farmer=profile).first()
            if farm is None:
                farm = Farm.objects.create(
                    farmer=profile,
                    name=farm_name or f"{profile.user.get_full_name() or profile.user.username}'s Farm",
                    size_hectares=size,
                    location=str(data.get('location') or 'Ruhango District, Southern Province'),
                )

            plantation = BananaPlantation.objects.create(
                farmer=profile,
                farm=farm,
                name=name,
                land_size_hectares=size,
                planting_date=planting_date,
                variety=variety,
                total_plants_planted=plants_count,
                current_healthy_plants=plants_count,
                photo_url=photo_url,
                notes=notes,
                status='VEGETATIVE',
            )
    except Exception:
        return JsonResponse({'message': 'Unable to save the field. Please try again.'}, status=500)

    return JsonResponse(serialize_plantation(plantation), status=201)

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
def plantation_detail(request, pk):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)

    plantation = _accessible_plantations(user).filter(pk=pk).first()
    if not plantation:
        return JsonResponse({'message': 'Plantation not found'}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_plantation(plantation))

    if request.method == "DELETE":
        plantation.delete()
        return JsonResponse({'success': True})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    for field, key in [
        ('name', 'fieldName'),
        ('variety', 'variety'),
        ('land_size_hectares', 'landSizeHectares'),
        ('photo_url', 'photoUrl'),
        ('notes', 'notes'),
        ('status', 'status'),
    ]:
        if key in data:
            setattr(plantation, field, data[key])

    plantation.save()
    return JsonResponse(serialize_plantation(plantation))

# ----------------- Growth Records API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def growth_records_list_create(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)

    if request.method == "GET":
        plantation_id = request.GET.get('plantation_id')
        records = _accessible_growth_logs(user).select_related('plantation', 'recorded_by__user')
        if plantation_id:
            records = records.filter(plantation_id=plantation_id)
        return JsonResponse([serialize_growth_log(g) for g in records], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile
    plantation = _get_plantation(data.get('plantationId'), user)
    if plantation is None:
        return JsonResponse({'message': 'Plantation not found'}, status=400)

    try:
        healthy = int(data.get('healthyPlantsCount'))
        damaged = int(data.get('damagedPlantsCount', 0))
        recorded_date = datetime.strptime(str(data.get('recordedDate')), '%Y-%m-%d').date()
        if healthy < 0 or damaged < 0 or healthy + damaged > plantation.total_plants_planted:
            raise ValueError
    except (TypeError, ValueError):
        return JsonResponse({'message': 'Enter a valid monitoring date and nonnegative whole mat counts that do not exceed planted mats.'}, status=400)

    log = BananaGrowthLog.objects.create(
        plantation=plantation,
        recorded_by=profile,
        date=recorded_date,
        stage=data.get('stage', 'SHOOTING'),
        average_height_meters=data.get('plantHeightMeters'),
        pseudostem_girth_cm=data.get('averageStemGirthCm'),
        healthy_plants=healthy,
        damaged_plants=damaged,
        general_observations=data.get('observations', ''),
        photo_url=data.get('photos', [''])[0] if data.get('photos') else '',
    )

    return JsonResponse(serialize_growth_log(log), status=201)

# ----------------- Disease Reports API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def disease_reports_list_create(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)

    if request.method == "GET":
        reports = _accessible_disease_reports(user).select_related('plantation', 'farmer__user')
        return JsonResponse([serialize_disease_report(d) for d in reports], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile
    plantation = _get_plantation(data.get('plantationId'), user)
    if plantation is None:
        return JsonResponse({'message': 'Plantation not found'}, status=400)

    report = BananaDiseaseReport.objects.create(
        plantation=plantation,
        farmer=profile,
        report_date=data.get('reportDate', timezone.now().date()),
        problem_type=data.get('problemType', 'BANANA_BACTERIAL_WILT'),
        description=data.get('description', ''),
        affected_plants_count=int(data.get('affectedPlantsCount', 1)),
        severity=data.get('severity', 'MEDIUM'),
        location_details=data.get('location', ''),
        photo_url=data.get('photos', [''])[0] if data.get('photos') else '',
        additional_notes=data.get('notes', ''),
        request_assistance=data.get('assistanceRequested', True),
        status='REPORTED',
    )

    return JsonResponse(serialize_disease_report(report), status=201)

# ----------------- Weather Reports API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def weather_reports_list_create(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)

    if request.method == "GET":
        reports = _accessible_weather_reports(user).select_related('plantation', 'farmer__user')
        return JsonResponse([serialize_weather_report(w) for w in reports], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile
    plantation = _get_plantation(data.get('plantationId'), user)
    if plantation is None:
        return JsonResponse({'message': 'Plantation not found'}, status=400)

    report = BananaWeatherReport.objects.create(
        plantation=plantation,
        farmer=profile,
        date=data.get('eventDate', timezone.now().date()),
        weather_type=data.get('weatherCondition', 'HEAVY_RAIN'),
        description=data.get('description', ''),
        damage_level=data.get('damageLevel', 'MILD'),
        affected_plants_estimate=int(data.get('affectedPlantsCount', 0)),
        photo_url=data.get('photos', [''])[0] if data.get('photos') else '',
        request_assistance=data.get('assistanceRequested', False),
    )

    return JsonResponse(serialize_weather_report(report), status=201)

# ----------------- Assistance Requests API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def assistance_requests_list_create(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)

    if request.method == "GET":
        requests_qs = _accessible_assistance_requests(user).select_related('plantation', 'farmer__user', 'assigned_officer__user').prefetch_related('officer_advices__officer__user')
        return JsonResponse([serialize_assistance_request(r) for r in requests_qs], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile
    plantation = _get_plantation(data.get('plantationId'), user)
    if plantation is None:
        return JsonResponse({'message': 'Plantation not found'}, status=400)

    req = BananaAssistanceRequest.objects.create(
        farmer=profile,
        plantation=plantation,
        subject=data.get('subject', 'Request for Technical Assistance'),
        category=data.get('category', 'DISEASE_OUTBREAK'),
        description=data.get('description', ''),
        urgency=data.get('urgency', 'NORMAL'),
        status='PENDING',
    )

    return JsonResponse(serialize_assistance_request(req), status=201)

def _get_assistance_request(raw_id, user=None):
    if not raw_id:
        return None
    pid_str = str(raw_id).replace('bar-', '').strip()
    qs = _accessible_assistance_requests(user) if user else BananaAssistanceRequest.objects.all()
    try:
        pid = int(pid_str)
        return qs.filter(pk=pid).first()
    except (ValueError, TypeError):
        pass
    return None

@csrf_exempt
@require_http_methods(["POST"])
def add_officer_advice(request, pk):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)
    if not hasattr(user, 'userprofile') or user.userprofile.role not in ('officer', 'admin'):
        return JsonResponse({'message': 'Officer permission required'}, status=403)

    req = _get_assistance_request(pk, user)
    if not req:
        return JsonResponse({'message': 'Assistance request not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    officer_profile = user.userprofile
    if data.get('newStatus', 'IN_PROGRESS') not in dict(BananaAssistanceRequest.STATUS_CHOICES):
        return JsonResponse({'message': 'Invalid request status'}, status=400)

    advice = BananaOfficerAdvice.objects.create(
        request=req,
        officer=officer_profile,
        diagnosis=data.get('diagnosis', ''),
        recommendations=data.get('recommendations', ''),
        recommended_products=', '.join(data.get('recommendedProducts', [])) if isinstance(data.get('recommendedProducts'), list) else data.get('recommendedProducts', ''),
        action_taken=data.get('actionTaken', ''),
        follow_up_date=data.get('followUpDate'),
        status_update=data.get('newStatus', 'IN_PROGRESS'),
    )

    req.status = data.get('newStatus', 'IN_PROGRESS')
    req.assigned_officer = officer_profile
    req.save()

    return JsonResponse(serialize_assistance_request(req))

@csrf_exempt
@require_http_methods(["PATCH", "PUT"])
def update_assistance_status(request, pk):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)
    if not hasattr(user, 'userprofile') or user.userprofile.role not in ('officer', 'admin'):
        return JsonResponse({'message': 'Officer permission required'}, status=403)

    req = _get_assistance_request(pk, user)
    if not req:
        return JsonResponse({'message': 'Assistance request not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    if 'status' in data:
        if data['status'] not in dict(BananaAssistanceRequest.STATUS_CHOICES):
            return JsonResponse({'message': 'Invalid request status'}, status=400)
        req.status = data['status']
    req.save()

    return JsonResponse(serialize_assistance_request(req))

# ----------------- Dashboard Summary API -----------------

@require_http_methods(["GET"])
def banana_dashboard_summary(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse({'message': 'Authentication required'}, status=401)
    plantations = _accessible_plantations(user)
    disease_reports = _accessible_disease_reports(user)
    weather_reports = _accessible_weather_reports(user)
    assistance_requests = _accessible_assistance_requests(user)

    total_plants = plantations.aggregate(total=Sum('total_plants_planted'))['total'] or 0
    latest = BananaGrowthLog.objects.filter(plantation_id=OuterRef('plantation_id')).order_by('-date', '-created_at', '-pk')
    monitoring = _accessible_growth_logs(user).filter(pk=Subquery(latest.values('pk')[:1]))
    observed = monitoring.aggregate(healthy=Sum('healthy_plants'), affected=Sum('damaged_plants'))
    healthy_plants = observed['healthy'] or 0
    affected_plants = observed['affected'] or 0
    observed_total = healthy_plants + affected_plants

    active_diseases = disease_reports.exclude(status__in=['RESOLVED', 'CLOSED']).count()
    pending_assistance = assistance_requests.filter(status='PENDING').count()
    resolved_problems = assistance_requests.filter(status='RESOLVED').count()

    health_rate = round((healthy_plants / observed_total) * 100, 1) if observed_total > 0 else None

    return JsonResponse({
        'totalPlantations': plantations.count(),
        'totalPlants': total_plants,
        'healthyPlants': healthy_plants,
        'affectedPlants': affected_plants,
        'healthRatePercent': health_rate,
        'monitoredFieldsCount': monitoring.count(),
        'weatherReportingPeriod': 'All recorded events',
        'resolvedProblemsDefinition': 'Resolved assistance requests',
        'activeDiseaseReports': active_diseases,
        'weatherReportsCount': weather_reports.count(),
        'pendingAssistanceRequests': pending_assistance,
        'resolvedProblemsCount': resolved_problems,
    })
