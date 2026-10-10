import json
from datetime import date
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import (
    LivestockAnimal, AnimalDiseaseReport, FeedShortageReport, 
    LivestockHealthRecord, UserProfile, Farm
)
from .auth_utils import get_authenticated_user

def _safe_iso(val):
    if not val:
        return ''
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    return str(val)

def serialize_animal(animal):
    return {
        'id': str(animal.id),
        'farmerId': str(animal.farmer.id) if animal.farmer else '',
        'farmerName': animal.farmer.user.get_full_name() or animal.farmer.user.username if animal.farmer else '',
        'farmId': str(animal.farm.id) if animal.farm else '',
        'farmName': animal.farm.name if animal.farm else '',
        'location': animal.location or (animal.farm.location if animal.farm else 'Rwanda'),
        'animalType': animal.animal_type,
        'tagId': animal.tag_id,
        'breed': animal.breed or '',
        'quantity': animal.quantity,
        'dobOrAge': animal.dob_or_age or '',
        'gender': animal.gender,
        'healthStatus': animal.health_status,
        'registrationDate': _safe_iso(animal.registration_date),
        'notes': animal.notes or '',
        'photoUrl': animal.photo_url or '',
        'createdAt': _safe_iso(animal.created_at),
        'updatedAt': _safe_iso(animal.updated_at),
    }

def serialize_disease_report(report):
    return {
        'id': str(report.id),
        'reportNumber': report.report_number,
        'farmerId': str(report.farmer.id) if report.farmer else '',
        'farmerName': report.farmer.user.get_full_name() or report.farmer.user.username if report.farmer else '',
        'farmerPhone': report.farmer.phone_number if report.farmer else '',
        'animalId': str(report.animal.id) if report.animal else '',
        'animalTagId': report.animal_tag_id,
        'animalType': report.animal_type,
        'farmId': str(report.animal.farm.id) if report.animal and report.animal.farm else '',
        'farmName': report.animal.farm.name if report.animal and report.animal.farm else 'General Farm',
        'location': report.location or '',
        'symptoms': report.symptoms or '',
        'problemStartDate': _safe_iso(report.problem_start_date),
        'numberAffected': report.number_affected,
        'description': report.description or '',
        'evidenceUrl': report.evidence_url or '',
        'urgencyLevel': report.urgency_level,
        'status': report.status,
        'veterinaryRecommendation': report.veterinary_recommendation or '',
        'recommendFarmVisit': report.recommend_farm_visit,
        'farmVisitDate': _safe_iso(report.farm_visit_date) or None,
        'assignedOfficerId': str(report.assigned_officer.id) if report.assigned_officer else None,
        'assignedOfficerName': report.assigned_officer.user.get_full_name() or report.assigned_officer.user.username if report.assigned_officer else None,
        'createdAt': _safe_iso(report.created_at),
        'updatedAt': _safe_iso(report.updated_at),
    }

def serialize_feed_shortage(shortage):
    return {
        'id': str(shortage.id),
        'reportNumber': shortage.report_number,
        'farmerId': str(shortage.farmer.id) if shortage.farmer else '',
        'farmerName': shortage.farmer.user.get_full_name() or shortage.farmer.user.username if shortage.farmer else '',
        'farmerPhone': shortage.farmer.phone_number if shortage.farmer else '',
        'animalType': shortage.animal_type,
        'numberAffected': shortage.number_affected,
        'feedTypeNeeded': shortage.feed_type_needed,
        'description': shortage.description or '',
        'estimatedQuantityRequired': shortage.estimated_quantity_required or '',
        'shortageStartDate': _safe_iso(shortage.shortage_start_date),
        'location': shortage.location or '',
        'evidenceUrl': shortage.evidence_url or '',
        'urgencyLevel': shortage.urgency_level,
        'status': shortage.status,
        'officerNotes': shortage.officer_notes or '',
        'assignedOfficerId': str(shortage.assigned_officer.id) if shortage.assigned_officer else None,
        'assignedOfficerName': shortage.assigned_officer.user.get_full_name() or shortage.assigned_officer.user.username if shortage.assigned_officer else None,
        'createdAt': _safe_iso(shortage.created_at),
        'updatedAt': _safe_iso(shortage.updated_at),
    }

def serialize_health_record(rec):
    return {
        'id': str(rec.id),
        'animalId': str(rec.animal.id),
        'animalTagId': rec.animal.tag_id,
        'farmerId': str(rec.farmer.id) if rec.farmer else '',
        'recordType': rec.record_type,
        'date': _safe_iso(rec.date),
        'title': rec.title,
        'details': rec.details or '',
        'veterinarianName': rec.veterinarian_name or '',
        'prescribedMedicine': rec.prescribed_medicine or '',
        'quantity': float(rec.quantity) if rec.quantity is not None else None,
        'unit': rec.unit or '',
        'costRwf': float(rec.cost_rwf) if rec.cost_rwf is not None else None,
        'nextDueDate': _safe_iso(rec.next_due_date) or None,
        'reminderActive': rec.reminder_active,
        'createdAt': _safe_iso(rec.created_at),
    }

# ----------------- Animals API -----------------

def _is_farmer_user(user):
    return bool(user and hasattr(user, 'userprofile') and user.userprofile.role == 'farmer')


def _accessible_animals(user):
    if _is_farmer_user(user):
        return LivestockAnimal.objects.filter(farmer=user.userprofile)
    return LivestockAnimal.objects.all()


def _accessible_disease_reports(user):
    if _is_farmer_user(user):
        return AnimalDiseaseReport.objects.filter(farmer=user.userprofile)
    return AnimalDiseaseReport.objects.all()


def _accessible_feed_shortages(user):
    if _is_farmer_user(user):
        return FeedShortageReport.objects.filter(farmer=user.userprofile)
    return FeedShortageReport.objects.all()


def _accessible_health_records(user):
    if _is_farmer_user(user):
        return LivestockHealthRecord.objects.filter(animal__farmer=user.userprofile)
    return LivestockHealthRecord.objects.all()


@csrf_exempt
@require_http_methods(["GET", "POST"])
def animals_list_create(request):
    user = get_authenticated_user(request)
    if request.method == "GET":
        animals = _accessible_animals(user).select_related('farmer__user', 'farm')
        return JsonResponse([serialize_animal(a) for a in animals], safe=False)

    # POST create
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    # Ensure profile
    if user:
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'farmer'})
    else:
        profile = UserProfile.objects.first()

    farm = Farm.objects.filter(farmer=profile).first()

    animal = LivestockAnimal.objects.create(
        farmer=profile,
        farm=farm,
        animal_type=data.get('animalType', 'cow'),
        tag_id=data.get('tagId', f"TAG-{timezone.now():%m%d%H%M}"),
        breed=data.get('breed', ''),
        quantity=int(data.get('quantity', 1)),
        dob_or_age=data.get('dobOrAge', ''),
        gender=data.get('gender', 'female'),
        health_status=data.get('healthStatus', 'HEALTHY'),
        registration_date=data.get('registrationDate', timezone.now().date()),
        location=data.get('location', profile.location or 'Rwanda'),
        notes=data.get('notes', ''),
        photo_url=data.get('photoUrl', ''),
    )

    return JsonResponse(serialize_animal(animal), status=201)

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
def animal_detail(request, pk):
    try:
        animal = LivestockAnimal.objects.select_related('farmer__user', 'farm').get(pk=pk)
    except LivestockAnimal.DoesNotExist:
        return JsonResponse({'message': 'Animal not found'}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_animal(animal))

    if request.method == "DELETE":
        animal.delete()
        return JsonResponse({'success': True})

    # PATCH / PUT
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    for field, key in [
        ('animal_type', 'animalType'),
        ('tag_id', 'tagId'),
        ('breed', 'breed'),
        ('quantity', 'quantity'),
        ('dob_or_age', 'dobOrAge'),
        ('gender', 'gender'),
        ('health_status', 'healthStatus'),
        ('location', 'location'),
        ('notes', 'notes'),
        ('photo_url', 'photoUrl'),
    ]:
        if key in data:
            setattr(animal, field, data[key])

    animal.save()
    return JsonResponse(serialize_animal(animal))

# ----------------- Disease Reports API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def disease_reports_list_create(request):
    user = get_authenticated_user(request)
    if request.method == "GET":
        reports = _accessible_disease_reports(user).select_related('farmer__user', 'animal__farm', 'assigned_officer__user')
        return JsonResponse([serialize_disease_report(r) for r in reports], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile if user and hasattr(user, 'userprofile') else UserProfile.objects.first()
    animal_id = data.get('animalId')
    animal = LivestockAnimal.objects.filter(pk=animal_id).first() if animal_id else None

    report_number = f"ADR-{timezone.now():%Y%m%d}-{timezone.now().microsecond % 1000:03d}"

    report = AnimalDiseaseReport.objects.create(
        report_number=report_number,
        farmer=profile,
        animal=animal,
        animal_type=data.get('animalType', animal.animal_type if animal else 'cow'),
        animal_tag_id=data.get('animalTagId', animal.tag_id if animal else 'Unknown'),
        symptoms=data.get('symptoms', ''),
        problem_start_date=data.get('problemStartDate', timezone.now().date()),
        number_affected=int(data.get('numberAffected', 1)),
        description=data.get('description', ''),
        evidence_url=data.get('evidenceUrl', ''),
        location=data.get('location', profile.location or 'Rwanda'),
        urgency_level=data.get('urgencyLevel', 'MEDIUM'),
        status='PENDING',
    )

    if animal:
        animal.health_status = 'SICK'
        animal.save()

    return JsonResponse(serialize_disease_report(report), status=201)

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT"])
def disease_report_detail(request, pk):
    try:
        report = AnimalDiseaseReport.objects.select_related('farmer__user', 'animal__farm', 'assigned_officer__user').get(pk=pk)
    except AnimalDiseaseReport.DoesNotExist:
        return JsonResponse({'message': 'Disease report not found'}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_disease_report(report))

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    for field, key in [
        ('status', 'status'),
        ('urgency_level', 'urgencyLevel'),
        ('veterinary_recommendation', 'veterinaryRecommendation'),
        ('recommend_farm_visit', 'recommendFarmVisit'),
        ('farm_visit_date', 'farmVisitDate'),
        ('description', 'description'),
        ('symptoms', 'symptoms'),
    ]:
        if key in data:
            setattr(report, field, data[key])

    report.save()
    return JsonResponse(serialize_disease_report(report))

# ----------------- Feed Shortages API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def feed_shortages_list_create(request):
    user = get_authenticated_user(request)
    if request.method == "GET":
        shortages = _accessible_feed_shortages(user).select_related('farmer__user', 'assigned_officer__user')
        return JsonResponse([serialize_feed_shortage(s) for s in shortages], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile if user and hasattr(user, 'userprofile') else UserProfile.objects.first()
    report_number = f"FSR-{timezone.now():%Y%m%d}-{timezone.now().microsecond % 1000:03d}"

    shortage = FeedShortageReport.objects.create(
        report_number=report_number,
        farmer=profile,
        animal_type=data.get('animalType', 'cow'),
        number_affected=int(data.get('numberAffected', 1)),
        feed_type_needed=data.get('feedTypeNeeded', 'Forage / Hay'),
        description=data.get('description', ''),
        estimated_quantity_required=str(data.get('estimatedQuantityRequired', '100 kg')),
        shortage_start_date=data.get('shortageStartDate', timezone.now().date()),
        location=data.get('location', profile.location or 'Rwanda'),
        evidence_url=data.get('evidenceUrl', ''),
        urgency_level=data.get('urgencyLevel', 'MEDIUM'),
        status='PENDING',
    )

    return JsonResponse(serialize_feed_shortage(shortage), status=201)

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT"])
def feed_shortage_detail(request, pk):
    try:
        shortage = FeedShortageReport.objects.select_related('farmer__user', 'assigned_officer__user').get(pk=pk)
    except FeedShortageReport.DoesNotExist:
        return JsonResponse({'message': 'Feed shortage report not found'}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_feed_shortage(shortage))

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    for field, key in [
        ('status', 'status'),
        ('urgency_level', 'urgencyLevel'),
        ('officer_notes', 'officerNotes'),
        ('description', 'description'),
        ('feed_type_needed', 'feedTypeNeeded'),
    ]:
        if key in data:
            setattr(shortage, field, data[key])

    shortage.save()
    return JsonResponse(serialize_feed_shortage(shortage))

# ----------------- Health Records API -----------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def health_records_list_create(request):
    user = get_authenticated_user(request)
    if request.method == "GET":
        records = _accessible_health_records(user).select_related('animal', 'farmer__user')
        return JsonResponse([serialize_health_record(r) for r in records], safe=False)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Invalid JSON body'}, status=400)

    profile = user.userprofile if user and hasattr(user, 'userprofile') else UserProfile.objects.first()
    animal = LivestockAnimal.objects.get(pk=data['animalId'])

    record = LivestockHealthRecord.objects.create(
        animal=animal,
        farmer=profile,
        record_type=data.get('recordType', 'TREATMENT'),
        date=data.get('date', timezone.now().date()),
        title=data.get('title', 'Routine Check'),
        details=data.get('details', ''),
        veterinarian_name=data.get('veterinarianName', ''),
        prescribed_medicine=data.get('prescribedMedicine', ''),
        quantity=data.get('quantity'),
        unit=data.get('unit', ''),
        cost_rwf=data.get('costRwf'),
        next_due_date=data.get('nextDueDate'),
        reminder_active=data.get('reminderActive', True),
    )

    return JsonResponse(serialize_health_record(record), status=201)

# ----------------- Livestock Stats API -----------------

@require_http_methods(["GET"])
def livestock_stats(request):
    user = get_authenticated_user(request)
    animals = _accessible_animals(user)
    disease_reports = _accessible_disease_reports(user)
    feed_shortages = _accessible_feed_shortages(user)
    health_records = _accessible_health_records(user)

    total_animals = sum(a.quantity for a in animals)
    healthy_count = sum(a.quantity for a in animals if a.health_status == 'HEALTHY')
    sick_count = sum(a.quantity for a in animals if a.health_status in ('SICK', 'UNDER_TREATMENT'))
    quarantined_count = sum(a.quantity for a in animals if a.health_status == 'QUARANTINED')
    active_diseases = disease_reports.filter(status__in=['PENDING', 'UNDER_REVIEW']).count()
    active_shortages = feed_shortages.filter(status__in=['PENDING', 'UNDER_REVIEW']).count()

    today = timezone.now().date()
    vaccinations_due = health_records.filter(
        record_type='VACCINATION',
        next_due_date__gte=today,
        reminder_active=True
    ).count()

    health_rate = round((healthy_count / total_animals) * 100) if total_animals > 0 else 100

    by_type = {}
    for a in animals:
        t = a.animal_type
        by_type[t] = by_type.get(t, 0) + a.quantity

    return JsonResponse({
        'totalAnimals': total_animals,
        'healthyCount': healthy_count,
        'sickCount': sick_count,
        'quarantinedCount': quarantined_count,
        'activeDiseaseReports': active_diseases,
        'activeFeedShortages': active_shortages,
        'vaccinationsDueSoon': vaccinations_due,
        'healthRatePercent': health_rate,
        'animalsByType': by_type,
    })
