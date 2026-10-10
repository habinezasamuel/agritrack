from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.dateparse import parse_date
import datetime
from django.db.models import Sum, Avg, Count, Q
from django.db import transaction
from django.utils import timezone
import json
from .models import (
    UserProfile, Farm, Field, Season, CropSeason, Activity, Task, HarvestRecord,
    InputRequest, Order, Payment, Fertilizer, Seed, AgriculturalInputApplication,
    InputPayment, InputReceipt, GrowthObservation, AgriculturalOfficerAdvice,
    Notification, PaymentAuditLog, Sale, CropProblemReport, WaterRecord,
)

# Helper function to get the user's profile
def get_user_profile(user):
    try:
        return user.userprofile
    except UserProfile.DoesNotExist:
        # If the user doesn't have a profile, create one with default role 'farmer'
        # In a real system, you would have a signal to create the profile on user creation.
        profile = UserProfile.objects.create(user=user, role='farmer')
        return profile

# Helper function to check if the user is a farmer
def is_farmer(user):
    profile = get_user_profile(user)
    return profile.role == 'farmer'

# Helper function to check if the user is an officer
def is_officer(user):
    profile = get_user_profile(user)
    return profile.role == 'officer'

# Helper function to check if the user is an admin
def is_admin(user):
    profile = get_user_profile(user)
    return profile.role == 'admin'

# Helper function to get the farms and fields accessible to the user
def get_accessible_fields(user):
    profile = get_user_profile(user)
    if profile.role == 'admin':
        # Admin can see all fields
        return Field.objects.all()
    elif profile.role == 'officer':
        # Officer can see fields of farmers assigned to them?
        # We don't have a direct assignment yet. For simplicity, we'll assume officer can see all fields.
        # In a real system, you would have a ManyToManyField between Officer and Farmer/Farm.
        return Field.objects.all()
    else: # farmer
        # Farmer can only see their own fields
        return Field.objects.filter(farm__farmer=profile)

# Helper function to get the crop seasons accessible to the user
def get_accessible_crop_seasons(user):
    return CropSeason.objects.filter(field__in=get_accessible_fields(user))

# API Endpoints

@login_required
@require_http_methods(["GET"])
def get_my_fields(request):
    """
    Returns a list of the user's fields with basic info.
    """
    if not is_farmer(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    fields = Field.objects.filter(farm__farmer=get_user_profile(request.user))
    data = []
    for field in fields:
        data.append({
            'id': field.id,
            'name': field.name,
            'size_hectares': float(field.size_hectares),
            'crop_type': field.crop_type,
            'variety': field.variety,
        })
    return JsonResponse({'fields': data})

@login_required
@require_http_methods(["GET"])
def get_crop_progress(request):
    """
    Returns the crop progress for a given field or the user's fields.
    Optional query parameter: field_id
    """
    field_id = request.GET.get('field_id')
    if field_id:
        # Check if the user has access to this field
        try:
            field = Field.objects.get(id=field_id)
            # Permission check
            accessible_fields = get_accessible_fields(request.user)
            if field not in accessible_fields:
                return JsonResponse({'error': 'Permission denied'}, status=403)
        except Field.DoesNotExist:
            return JsonResponse({'error': 'Field not found'}, status=404)
        fields = [field]
    else:
        fields = get_accessible_fields(request.user)
    
    data = []
    for field in fields:
        # Get the active crop season for this field
        active_season = CropSeason.objects.filter(field=field, status='active').first()
        if active_season:
            # Get the latest growth observation
            latest_observation = GrowthObservation.objects.filter(crop_season=active_season).order_by('-observation_date').first()
            data.append({
                'field_id': field.id,
                'field_name': field.name,
                'crop_type': field.crop_type,
                'variety': field.variety,
                'planting_date': active_season.planting_date.isoformat() if active_season.planting_date else None,
                'expected_harvest_date': active_season.expected_harvest_date.isoformat() if active_season.expected_harvest_date else None,
                'current_growth_stage': latest_observation.growth_stage if latest_observation else 'No observations recorded',
                'last_observation_date': latest_observation.observation_date.isoformat() if latest_observation else None,
            })
        else:
            data.append({
                'field_id': field.id,
                'field_name': field.name,
                'crop_type': field.crop_type,
                'variety': field.variety,
                'planting_date': None,
                'expected_harvest_date': None,
                'current_growth_stage': 'No active season',
                'last_observation_date': None,
            })
    return JsonResponse({'crop_progress': data})

@login_required
@require_http_methods(["GET"])
def get_upcoming_activities(request):
    """
    Returns upcoming activities (tasks) for the user's fields within the next 7 days.
    """
    # Only for farmers and officers? The spec says farmer can ask about their activities.
    if not (is_farmer(request.user) or is_officer(request.user)):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    today = timezone.now().date()
    seven_days_later = today + timezone.timedelta(days=7)
    
    # Get tasks that are not completed and due within the next 7 days
    tasks = Task.objects.filter(
        crop_season__field__in=get_accessible_fields(request.user),
        completed=False,
        due_date__gte=today,
        due_date__lte=seven_days_later
    ).order_by('due_date')
    
    data = []
    for task in tasks:
        data.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'due_date': task.due_date.isoformat(),
            'priority': task.priority,
            'crop_season': {
                'id': task.crop_season.id,
                'field': task.crop_season.field.name,
                'crop_type': task.crop_season.field.crop_type,
                'season': str(task.crop_season.season),
            }
        })
    return JsonResponse({'upcoming_activities': data})

@login_required
@require_http_methods(["GET"])
def get_harvest_summary(request):
    """
    Returns a summary of harvests for the user's fields.
    Optional query parameter: season_id to filter by season.
    """
    if not is_farmer(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    season_id = request.GET.get('season_id')
    harvest_records = HarvestRecord.objects.filter(crop_season__field__in=get_accessible_fields(request.user))
    
    if season_id:
        try:
            season = Season.objects.get(id=season_id)
            harvest_records = harvest_records.filter(crop_season__season=season)
        except Season.DoesNotExist:
            return JsonResponse({'error': 'Season not found'}, status=404)
    
    # Calculate total harvest, average yield, etc.
    total_quantity = harvest_records.aggregate(total=Sum('quantity_kg'))['total'] or 0
    # For yield per hectare, we need to sum the area_hectares for each record? 
    # We'll assume each harvest record has an area_hectares field.
    # We'll calculate total area and then average yield.
    records_with_area = harvest_records.exclude(area_hectares__isnull=True).exclude(area_hectares=0)
    total_area = records_with_area.aggregate(total=Sum('area_hectares'))['total'] or 0
    average_yield = (total_quantity / total_area) if total_area > 0 else 0
    
    # Group by crop season
    by_season = harvest_records.values('crop_season__season__name', 'crop_season__season__year').annotate(
        total_quantity=Sum('quantity_kg'),
        count=Count('id')
    ).order_by('crop_season__season__year', 'crop_season__season__name')
    
    data = {
        'total_harvest_kg': float(total_quantity),
        'total_area_hectares': float(total_area) if total_area else None,
        'average_yield_kg_per_hectare': float(average_yield) if total_area else None,
        'harvest_by_season': [
            {
                'season': f"{item['crop_season__season__name']} {item['crop_season__season__year']}",
                'total_kg': float(item['total_quantity']),
                'count': item['count']
            }
            for item in by_season
        ]
    }
    return JsonResponse(data)

@login_required
@require_http_methods(["GET"])
def get_expense_and_sales_summary(request):
    """
    Returns a summary of expenses (input requests, activities costs) and sales (orders, payments).
    """
    if not is_farmer(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    profile = get_user_profile(request.user)
    
    # Expenses: sum of activity costs and input request costs (approved/completed)
    activity_costs = Activity.objects.filter(
        crop_season__field__in=get_accessible_fields(request.user)
    ).aggregate(total=Sum('cost'))['total'] or 0
    
    input_request_costs = InputRequest.objects.filter(
        farmer=profile,
        status__in=['approved', 'completed']
    ).aggregate(total=Sum('total_cost'))['total'] or 0
    
    total_expenses = activity_costs + input_request_costs
    
    # Sales: sum of payments received (confirmed orders)
    payment_received = Payment.objects.filter(
        order__input_request__farmer=profile,
        order__status='confirmed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Also, we might have sales from harvest? Not in the model yet. We'll stick to input requests and payments.
    
    data = {
        'total_expenses': float(total_expenses),
        'activity_costs': float(activity_costs),
        'input_request_costs': float(input_request_costs),
        'total_sales_received': float(payment_received),
        'net_profit': float(payment_received - total_expenses),
    }
    return JsonResponse(data)

@login_required
@require_http_methods(["GET"])
def get_input_request_status(request):
    """
    Returns the status of the user's input requests.
    Optional query parameter: status to filter by status.
    """
    if not is_farmer(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    profile = get_user_profile(request.user)
    input_requests = InputRequest.objects.filter(farmer=profile)
    
    status_filter = request.GET.get('status')
    if status_filter:
        input_requests = input_requests.filter(status=status_filter)
    
    data = []
    for req in input_requests.order_by('-created_at'):
        data.append({
            'id': req.id,
            'input_type': req.input_type,
            'description': req.description,
            'quantity_details': req.quantity_details,
            'total_cost': float(req.total_cost),
            'status': req.status,
            'submitted_at': req.submitted_at.isoformat() if req.submitted_at else None,
            'reviewed_at': req.reviewed_at.isoformat() if req.reviewed_at else None,
            'admin_notes': req.admin_notes,
        })
    return JsonResponse({'input_requests': data})

@login_required
@require_http_methods(["GET"])
def get_crop_problem_reports(request):
    """
    Returns crop problem reports (we don't have a specific model for this, but we can use growth observations with notes about problems, or officer advice).
    For simplicity, we'll return growth observations that have notes indicating problems, or officer advice that mentions problems.
    """
    # We'll assume that only officers and admins can see crop problem reports? 
    # But the spec says farmer can ask about crop problems and officer advice.
    # Let's allow farmers to see officer advice for their own fields.
    if not (is_farmer(request.user) or is_officer(request.user) or is_admin(request.user)):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    # We'll return AgriculturalOfficerAdvice for the user's accessible fields
    advice_qs = AgriculturalOfficerAdvice.objects.filter(
        crop_season__field__in=get_accessible_fields(request.user)
    ).select_related('officer', 'crop_season__field', 'crop_season__season')
    
    data = []
    for advice in advice_qs.order_by('-advice_date'):
        data.append({
            'id': advice.id,
            'advice_date': advice.advice_date.isoformat(),
            'advice_text': advice.advice_text,
            'officer': {
                'id': advice.officer.id,
                'username': advice.officer.user.username,
            },
            'crop_season': {
                'id': advice.crop_season.id,
                'field': advice.crop_season.field.name,
                'crop_type': advice.crop_season.field.crop_type,
                'season': str(advice.crop_season.season),
            }
        })
    return JsonResponse({'crop_problem_reports': data})

@login_required
@require_http_methods(["GET"])
def compare_seasons(request):
    """
    Compare two seasons for the user's fields.
    Query parameters: season1_id, season2_id
    """
    if not is_farmer(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    season1_id = request.GET.get('season1_id')
    season2_id = request.GET.get('season2_id')
    
    if not season1_id or not season2_id:
        return JsonResponse({'error': 'Both season1_id and season2_id are required'}, status=400)
    
    try:
        season1 = Season.objects.get(id=season1_id)
        season2 = Season.objects.get(id=season2_id)
    except Season.DoesNotExist:
        return JsonResponse({'error': 'One or both seasons not found'}, status=404)
    
    # Get harvest records for each season
    harvests_season1 = HarvestRecord.objects.filter(
        crop_season__field__in=get_accessible_fields(request.user),
        crop_season__season=season1
    )
    harvests_season2 = HarvestRecord.objects.filter(
        crop_season__field__in=get_accessible_fields(request.user),
        crop_season__season=season2
    )
    
    total1 = harvests_season1.aggregate(total=Sum('quantity_kg'))['total'] or 0
    total2 = harvests_season2.aggregate(total=Sum('quantity_kg'))['total'] or 0
    
    # Calculate yield per hectare for each season
    def calculate_yield(harvests):
        total_qty = harvests.aggregate(total=Sum('quantity_kg'))['total'] or 0
        total_area = harvests.exclude(area_hectares__isnull=True).exclude(area_hectares=0).aggregate(total=Sum('area_hectares'))['total'] or 0
        return (total_qty / total_area) if total_area > 0 else 0, float(total_qty), float(total_area)
    
    yield1, total_qty1, total_area1 = calculate_yield(harvests_season1)
    yield2, total_qty2, total_area2 = calculate_yield(harvests_season2)
    
    data = {
        'season1': {
            'name': str(season1),
            'total_harvest_kg': total_qty1,
            'total_area_hectares': total_area1,
            'yield_kg_per_hectare': yield1,
        },
        'season2': {
            'name': str(season2),
            'total_harvest_kg': total_qty2,
            'total_area_hectares': total_area2,
            'yield_kg_per_hectare': yield2,
        },
        'difference': {
            'total_harvest_kg': total_qty2 - total_qty1,
            'total_area_hectares': total_area2 - total_area1,
            'yield_kg_per_hectare': yield2 - yield1,
        }
    }
    return JsonResponse(data)


def _ensure_input_catalog():
    fertilizer_defaults = [
        ('Urea', 'Nitrogen', 38000, 150),
        ('DAP', 'Phosphate', 42000, 120),
        ('NPK 17-17-17', 'Compound', 45000, 200),
        ('NPK 15-15-15', 'Compound', 43000, 180),
        ('NPK 20-10-10', 'Compound', 44000, 160),
        ('TSP', 'Phosphate', 40000, 100),
        ('MOP', 'Potash', 36000, 100),
        ('CAN', 'Nitrogen', 35000, 120),
        ('Ammonium Sulfate', 'Nitrogen', 32000, 100),
        ('Compost Manure', 'Organic', 5000, 500),
        ('Farmyard Manure', 'Organic', 3500, 500),
        ('Vermicompost', 'Organic', 7000, 300),
    ]
    for name, fertilizer_type, price, stock in fertilizer_defaults:
        Fertilizer.objects.get_or_create(
            name=name,
            defaults={
                'fertilizer_type': fertilizer_type,
                'price_per_unit': price,
                'available_quantity': stock,
                'supported_crops': ['Rice', 'Maize', 'Beans', 'Irish Potato'],
                'unit': 'KG',
            },
        )
    seed_defaults = [
        ('WAB 56-104', 'Rice'), ('NERICA 4', 'Rice'), ('NERICA 7', 'Rice'),
        ('IR64', 'Rice'), ('Supa', 'Rice'), ('TXD 306 (SARO 5)', 'Rice'),
        ('Mwangaza', 'Rice'), ('IR 54', 'Rice'), ('PAN 53', 'Maize'),
        ('H628', 'Maize'), ('H614', 'Maize'), ('SC 403', 'Maize'),
        ('SC 719', 'Maize'), ('RWR 2245', 'Bean'), ('RWR 1873', 'Bean'),
        ('NABE 4', 'Bean'), ('Gatib', 'Irish Potato'), ('Kinigi', 'Irish Potato'),
        ('CIP 392797.22', 'Irish Potato'),
    ]
    for name, crop in seed_defaults:
        Seed.objects.get_or_create(
            name=name,
            crop=crop,
            defaults={'price_per_unit': 1200, 'available_quantity': 500, 'unit': 'KG', 'supported_crops': [crop]},
        )


def _serialize_application(application, include_extra=False):
    input_item = application.fertilizer or application.seed
    payment = getattr(application, 'payment', None)
    receipt = getattr(payment, 'receipt', None) if payment else None
    data = {
        'id': application.id,
        'applicationNumber': application.application_number,
        'farmer': {
            'id': application.farmer_id,
            'name': application.farmer.user.get_full_name() or application.farmer.user.username,
            'nationalId': application.farmer.phone_number or '',
            'phone': application.farmer.phone_number or '',
        },
        'farm': {'id': application.farm_id, 'name': application.farm.name},
        'field': {'id': application.field_id, 'name': application.field.name},
        'crop': application.crop,
        'inputType': application.input_type,
        'input': input_item.name if input_item else '',
        'quantity': float(application.quantity),
        'unit': application.unit,
        'unitPrice': float(application.unit_price),
        'totalAmount': float(application.total_amount),
        'status': application.status,
        'paymentStatus': application.payment_status,
        'adminComments': application.admin_comments,
        'createdAt': application.created_at.isoformat(),
        'receiptNumber': receipt.receipt_number if receipt else None,
        'approvedAt': application.approved_at.isoformat() if application.approved_at else None,
        'completedAt': application.completed_at.isoformat() if application.completed_at else None,
    }
    if include_extra and payment:
        data['payment'] = {
            'id': payment.id,
            'method': payment.method,
            'reference': payment.reference,
            'amount': float(payment.amount),
            'status': payment.status,
            'isSandbox': payment.is_sandbox,
            'providerTransactionId': payment.provider_transaction_id,
            'providerReference': payment.provider_reference,
            'proofFile': payment.proof_file,
            'paidAt': payment.paid_at.isoformat() if payment.paid_at else None,
            'verifiedAt': payment.verified_at.isoformat() if payment.verified_at else None,
        }
    return data


@login_required
@require_http_methods(["GET"])
def input_catalog(request):
    _ensure_input_catalog()
    fertilizers = Fertilizer.objects.filter(is_active=True)
    seeds = Seed.objects.filter(is_active=True)
    crop = request.GET.get('crop', '').strip().lower()

    def compatible(item):
        return not crop or not item.supported_crops or any(crop == value.lower() for value in item.supported_crops)

    return JsonResponse({
        'fertilizers': [
            {'id': item.id, 'name': item.name, 'type': item.fertilizer_type, 'unit': item.unit,
             'pricePerUnit': float(item.price_per_unit), 'availableQuantity': float(item.available_quantity),
             'supportedCrops': item.supported_crops}
            for item in fertilizers if compatible(item)
        ],
        'seeds': [
            {'id': item.id, 'name': item.name, 'crop': item.crop, 'variety': item.variety, 'unit': item.unit,
             'pricePerUnit': float(item.price_per_unit), 'availableQuantity': float(item.available_quantity),
             'supportedCrops': item.supported_crops}
            for item in seeds if compatible(item)
        ],
    })


def _create_notification(recipient, title, message, notification_type='info', related_entity_type=None, related_entity_id=None):
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )


def _create_audit_log(payment, action, old_status, new_status, notes='', performed_by=None, ip_address=None, user_agent=None):
    return PaymentAuditLog.objects.create(
        payment=payment,
        action=action,
        old_status=old_status,
        new_status=new_status,
        notes=notes,
        performed_by=performed_by,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def agricultural_input_applications(request):
    profile = get_user_profile(request.user)
    if request.method == 'GET':
        queryset = AgriculturalInputApplication.objects.select_related('farm', 'field', 'fertilizer', 'seed', 'farmer__user')
        if profile.role == 'farmer':
            queryset = queryset.filter(farmer=profile)
        elif profile.role not in ('admin', 'officer'):
            return JsonResponse({'error': 'Permission denied'}, status=403)
        return JsonResponse({'applications': [_serialize_application(item, include_extra=True) for item in queryset.order_by('-created_at')]})

    if profile.role != 'farmer':
        return JsonResponse({'error': 'Only farmers can submit applications'}, status=403)
    try:
        payload = json.loads(request.body or '{}')
        field = Field.objects.select_related('farm').get(id=payload['fieldId'], farm__farmer=profile)
        farm = field.farm
        input_type = payload['inputType']
        input_id = payload['inputId']
        quantity = float(payload['quantity'])
        item = Fertilizer.objects.get(id=input_id, is_active=True) if input_type == 'fertilizer' else Seed.objects.get(id=input_id, is_active=True)
        if quantity <= 0 or quantity > float(item.available_quantity):
            return JsonResponse({'error': 'Insufficient stock available for this application.'}, status=400)
        crop = str(payload.get('crop') or field.crop_type)
        if item.supported_crops and not any(crop.lower() == value.lower() for value in item.supported_crops):
            return JsonResponse({'error': 'This input is not configured for the selected crop.'}, status=400)
        application = AgriculturalInputApplication.objects.create(
            farmer=profile, farm=farm, field=field, crop=crop, input_type=input_type,
            fertilizer=item if input_type == 'fertilizer' else None,
            seed=item if input_type == 'seed' else None, quantity=quantity, unit=item.unit,
            unit_price=item.price_per_unit, total_amount=item.price_per_unit * quantity,
            purpose=payload.get('purpose', ''), preferred_date=payload.get('preferredDate') or None,
            notes=payload.get('notes', ''),
            status='pending_review',
            payment_status='unpaid',
        )
        return JsonResponse({'application': _serialize_application(application)}, status=201)
    except (KeyError, ValueError, TypeError, Field.DoesNotExist, Fertilizer.DoesNotExist, Seed.DoesNotExist):
        return JsonResponse({'error': 'Please provide valid farm, field, crop, input, and quantity details.'}, status=400)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def pay_input_application(request, application_id):
    profile = get_user_profile(request.user)
    try:
        application = AgriculturalInputApplication.objects.select_related('farmer').get(id=application_id, farmer=profile)
        if application.payment_status == 'paid':
            return JsonResponse({'application': _serialize_application(application)})
        if application.payment_status == 'refunded':
            return JsonResponse({'error': 'This application has been refunded. Please create a new application.'}, status=400)
        payload = json.loads(request.body or '{}')
        method = payload.get('method', 'Mobile Money')
        reference = payload.get('reference', '')
        provider_transaction_id = payload.get('providerTransactionId', '')
        provider_reference = payload.get('providerReference', '')
        proof_file = payload.get('proofFile', '')
        is_sandbox = payload.get('isSandbox', False)
        if not reference:
            return JsonResponse({'error': 'Payment reference is required.'}, status=400)
        existing_payment = InputPayment.objects.filter(application=application, reference=reference).first()
        if existing_payment:
            return JsonResponse({'application': _serialize_application(application, include_extra=True), 'payment': {
                'id': existing_payment.id,
                'reference': existing_payment.reference,
                'status': existing_payment.status,
            }})
        if is_sandbox:
            payment_status = 'paid'
            paid_at = timezone.now()
        else:
            payment_status = 'pending_verification'
            paid_at = None
        payment = InputPayment.objects.create(
            application=application, method=method, reference=reference, amount=application.total_amount,
            status=payment_status, is_sandbox=is_sandbox, provider_transaction_id=provider_transaction_id,
            provider_reference=provider_reference, proof_file=proof_file, paid_at=paid_at,
        )
        _create_audit_log(payment, 'payment_initiated', None, payment_status, f'Payment initiated by farmer via {method}', performed_by=profile, ip_address=_get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''))
        if payment_status == 'paid':
            application.payment_status = 'paid'
            application.save(update_fields=['payment_status', 'updated_at'])
            InputReceipt.objects.create(payment=payment, receipt_number=f"RCT-{application.application_number}")
            _create_audit_log(payment, 'payment_confirmed', 'pending_verification', 'paid', 'Payment confirmed via sandbox/integrated provider', performed_by=profile, ip_address=_get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''))
            admins = UserProfile.objects.filter(role='admin')
            for admin in admins:
                _create_notification(
                    admin, f"Payment received: {application.farmer.user.get_full_name() or application.farmer.user.username}",
                    f"Payment received: Farmer {application.farmer.user.get_full_name() or application.farmer.user.username} paid RWF {float(application.total_amount):,.0f} for {application.input_type}. Order {application.application_number} is ready for fulfilment.",
                    'success', 'application', str(application.id),
                )
        else:
            application.payment_status = 'pending_verification'
            application.save(update_fields=['payment_status', 'updated_at'])
            admins = UserProfile.objects.filter(role='admin')
            for admin in admins:
                _create_notification(
                    admin, f"Payment pending verification: {application.farmer.user.get_full_name() or application.farmer.user.username}",
                    f"Farmer {application.farmer.user.get_full_name() or application.farmer.user.username} submitted a {method} payment of RWF {float(application.total_amount):,.0f} for order {application.application_number}. Transaction reference: {reference}. Please verify.",
                    'warning', 'application', str(application.id),
                )
        return JsonResponse({'application': _serialize_application(application, include_extra=True), 'payment': {
            'id': payment.id, 'reference': payment.reference, 'status': payment.status,
            'method': payment.method, 'amount': float(payment.amount),
        }})
    except AgriculturalInputApplication.DoesNotExist:
        return JsonResponse({'error': 'Application not found'}, status=404)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def review_input_application(request, application_id):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    profile = get_user_profile(request.user)
    try:
        payload = json.loads(request.body or '{}')
        action = payload.get('action')
        with transaction.atomic():
            application = AgriculturalInputApplication.objects.select_for_update().select_related('fertilizer', 'seed', 'farmer__user').get(id=application_id)
            if action == 'approve':
                unit_price = payload.get('unitPrice')
                total_amount = payload.get('totalAmount')
                if unit_price is not None:
                    application.unit_price = unit_price
                if total_amount is not None:
                    application.total_amount = total_amount
                application.status = 'approved'
                application.approved_at = timezone.now()
            elif action == 'reject':
                if application.payment_status == 'paid':
                    return JsonResponse({'error': 'Cannot reject an application that has already been paid. Please process a refund instead.'}, status=400)
                application.status = 'rejected'
            else:
                return JsonResponse({'error': 'Action must be approve or reject.'}, status=400)
            application.admin_comments = payload.get('comments', '')
            application.save(update_fields=['status', 'approved_at', 'admin_comments', 'unit_price', 'total_amount', 'updated_at'])
            _create_notification(
                application.farmer,
                f"Application {application.application_number} {application.status}",
                f"Your input application {application.application_number} for {application.input_type} has been {application.status}. Admin notes: {application.admin_comments or 'No additional notes.'}",
                'success' if action == 'approve' else 'error', 'application', str(application.id),
            )
        return JsonResponse({'application': _serialize_application(application, include_extra=True)})
    except AgriculturalInputApplication.DoesNotExist:
        return JsonResponse({'error': 'Application not found'}, status=404)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def verify_payment(request, payment_id):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    profile = get_user_profile(request.user)
    try:
        payload = json.loads(request.body or '{}')
        new_status = payload.get('status')
        notes = payload.get('notes', '')
        if new_status not in ('paid', 'failed', 'refunded'):
            return JsonResponse({'error': 'Status must be paid, failed, or refunded.'}, status=400)
        with transaction.atomic():
            payment = InputPayment.objects.select_for_update().select_related('application', 'application__farmer__user').get(id=payment_id)
            old_status = payment.status
            if old_status == new_status:
                return JsonResponse({'payment': {'id': payment.id, 'reference': payment.reference, 'status': payment.status}})
            payment.status = new_status
            if new_status == 'paid':
                payment.paid_at = timezone.now()
                payment.verified_at = timezone.now()
                payment.verified_by = profile
                payment.application.payment_status = 'paid'
                payment.application.status = 'ready_for_collection'
                payment.application.save(update_fields=['payment_status', 'status', 'updated_at'])
                InputReceipt.objects.get_or_create(
                    payment=payment,
                    defaults={'receipt_number': f"RCT-{payment.application.application_number}"},
                )
            elif new_status == 'failed':
                payment.application.payment_status = 'failed'
                payment.application.save(update_fields=['payment_status', 'updated_at'])
            elif new_status == 'refunded':
                payment.application.payment_status = 'refunded'
                payment.application.save(update_fields=['payment_status', 'updated_at'])
            payment.save(update_fields=['status', 'paid_at', 'verified_at', 'verified_by', 'updated_at'])
            _create_audit_log(payment, f'payment_{new_status}', old_status, new_status, notes, performed_by=profile, ip_address=_get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', ''))
            application = payment.application
            if new_status == 'paid':
                _create_notification(
                    application.farmer,
                    f"Payment confirmed: {application.application_number}",
                    f"Your payment of RWF {float(payment.amount):,.0f} for order {application.application_number} has been confirmed. You will receive another notification when your seeds or fertiliser are ready.",
                    'success', 'application', str(application.id),
                )
            elif new_status == 'failed':
                _create_notification(
                    application.farmer,
                    f"Payment failed: {application.application_number}",
                    f"Your payment for order {application.application_number} was not successful. Status: {notes or 'Payment verification failed'}. Please try again or contact support.",
                    'error', 'application', str(application.id),
                )
            elif new_status == 'refunded':
                _create_notification(
                    application.farmer,
                    f"Payment refunded: {application.application_number}",
                    f"Your payment for order {application.application_number} has been refunded. Reason: {notes or 'Refund processed'}. Please contact support for further assistance.",
                    'warning', 'application', str(application.id),
                )
        return JsonResponse({'payment': {'id': payment.id, 'reference': payment.reference, 'status': payment.status, 'amount': float(payment.amount), 'application': _serialize_application(payment.application, include_extra=True)}})
    except InputPayment.DoesNotExist:
        return JsonResponse({'error': 'Payment not found'}, status=404)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_delivery_status(request, application_id):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    profile = get_user_profile(request.user)
    try:
        payload = json.loads(request.body or '{}')
        new_status = payload.get('status')
        notes = payload.get('notes', '')
        valid_statuses = ['ready_for_collection', 'collected', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return JsonResponse({'error': f'Status must be one of: {", ".join(valid_statuses)}'}, status=400)
        with transaction.atomic():
            application = AgriculturalInputApplication.objects.select_for_update().select_related('farmer__user').get(id=application_id)
            old_status = application.status
            if old_status == new_status:
                return JsonResponse({'application': _serialize_application(application)})
            application.status = new_status
            if new_status in ('collected', 'delivered'):
                application.completed_at = timezone.now()
                application.save(update_fields=['status', 'completed_at', 'updated_at'])
            else:
                application.save(update_fields=['status', 'updated_at'])
            _create_notification(
                application.farmer,
                f"Order {application.application_number} update",
                f"Your order {application.application_number} status has been updated to '{new_status.replace('_', ' ').title()}'. {notes or 'No additional details.'}",
                'info', 'application', str(application.id),
            )
        return JsonResponse({'application': _serialize_application(application, include_extra=True)})
    except AgriculturalInputApplication.DoesNotExist:
        return JsonResponse({'error': 'Application not found'}, status=404)


@login_required
@require_http_methods(["GET"])
def admin_payments_list(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    queryset = InputPayment.objects.select_related('application__farmer__user', 'application', 'verified_by__user').order_by('-created_at')
    farmer_id = request.GET.get('farmerId')
    status = request.GET.get('status')
    payment_method = request.GET.get('method')
    start_date = request.GET.get('startDate')
    end_date = request.GET.get('endDate')
    search = request.GET.get('search', '').strip()
    if farmer_id:
        queryset = queryset.filter(application__farmer_id=farmer_id)
    if status:
        queryset = queryset.filter(status=status)
    if payment_method:
        queryset = queryset.filter(method=payment_method)
    if start_date:
        queryset = queryset.filter(created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__date__lte=end_date)
    if search:
        queryset = queryset.filter(
            Q(reference__icontains=search) |
            Q(provider_transaction_id__icontains=search) |
            Q(application__application_number__icontains=search) |
            Q(application__farmer__user__first_name__icontains=search) |
            Q(application__farmer__user__last_name__icontains=search)
        )
    payments = []
    for p in queryset:
        app = p.application
        payments.append({
            'id': p.id,
            'reference': p.reference,
            'method': p.method,
            'amount': float(p.amount),
            'status': p.status,
            'isSandbox': p.is_sandbox,
            'providerTransactionId': p.provider_transaction_id,
            'providerReference': p.provider_reference,
            'proofFile': p.proof_file,
            'paidAt': p.paid_at.isoformat() if p.paid_at else None,
            'verifiedAt': p.verified_at.isoformat() if p.verified_at else None,
            'verifiedBy': p.verified_by.user.get_full_name() if p.verified_by and p.verified_by.user else None,
            'createdAt': p.created_at.isoformat(),
            'application': {
                'id': app.id,
                'applicationNumber': app.application_number,
                'status': app.status,
                'paymentStatus': app.payment_status,
                'inputType': app.input_type,
                'crop': app.crop,
                'quantity': float(app.quantity),
                'unit': app.unit,
                'unitPrice': float(app.unit_price),
                'totalAmount': float(app.total_amount),
                'farmer': {
                    'id': app.farmer_id,
                    'name': app.farmer.user.get_full_name() or app.farmer.user.username,
                    'phone': app.farmer.phone_number or '',
                },
                'field': {'id': app.field_id, 'name': app.field.name},
                'farm': {'id': app.farm_id, 'name': app.farm.name},
            },
        })
    total_confirmed = sum(p['amount'] for p in payments if p['status'] == 'paid')
    total_pending = sum(p['amount'] for p in payments if p['status'] == 'pending_verification')
    total_failed = sum(p['amount'] for p in payments if p['status'] == 'failed')
    total_refunded = sum(p['amount'] for p in payments if p['status'] == 'refunded')
    return JsonResponse({
        'payments': payments,
        'summary': {
            'totalConfirmed': float(total_confirmed),
            'totalPending': float(total_pending),
            'totalFailed': float(total_failed),
            'totalRefunded': float(total_refunded),
            'netCollections': float(total_confirmed - total_refunded),
            'count': len(payments),
        }
    })


@login_required
@require_http_methods(["GET"])
def admin_payment_detail(request, payment_id):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    try:
        payment = InputPayment.objects.select_related('application__farmer__user', 'application__farm', 'application__field', 'verified_by__user').get(id=payment_id)
        app = payment.application
        audit_logs = payment.audit_logs.select_related('performed_by__user').order_by('-created_at')[:20]
        logs = []
        for log in audit_logs:
            logs.append({
                'id': log.id,
                'action': log.action,
                'oldStatus': log.old_status,
                'newStatus': log.new_status,
                'notes': log.notes,
                'performedBy': log.performed_by.user.get_full_name() if log.performed_by and log.performed_by.user else None,
                'ipAddress': log.ip_address,
                'createdAt': log.created_at.isoformat(),
            })
        receipt = getattr(payment, 'receipt', None)
        return JsonResponse({
            'payment': {
                'id': payment.id,
                'reference': payment.reference,
                'method': payment.method,
                'amount': float(payment.amount),
                'status': payment.status,
                'isSandbox': payment.is_sandbox,
                'providerTransactionId': payment.provider_transaction_id,
                'providerReference': payment.provider_reference,
                'proofFile': payment.proof_file,
                'paidAt': payment.paid_at.isoformat() if payment.paid_at else None,
                'verifiedAt': payment.verified_at.isoformat() if payment.verified_at else None,
                'verifiedBy': payment.verified_by.user.get_full_name() if payment.verified_by and payment.verified_by.user else None,
                'createdAt': payment.created_at.isoformat(),
                'updatedAt': payment.updated_at.isoformat(),
            },
            'application': _serialize_application(app, include_extra=True),
            'receipt': {'receiptNumber': receipt.receipt_number, 'issuedAt': receipt.issued_at.isoformat()} if receipt else None,
            'auditLogs': logs,
        })
    except InputPayment.DoesNotExist:
        return JsonResponse({'error': 'Payment not found'}, status=404)


@login_required
@require_http_methods(["GET"])
def notifications_list(request):
    profile = get_user_profile(request.user)
    notifications = Notification.objects.filter(recipient=profile).order_by('-created_at')[:50]
    data = []
    for n in notifications:
        data.append({
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'type': n.notification_type,
            'relatedEntityType': n.related_entity_type,
            'relatedEntityId': n.related_entity_id,
            'isRead': n.is_read,
            'readAt': n.read_at.isoformat() if n.read_at else None,
            'createdAt': n.created_at.isoformat(),
        })
    unread_count = Notification.objects.filter(recipient=profile, is_read=False).count()
    return JsonResponse({'notifications': data, 'unreadCount': unread_count})


@csrf_exempt
@login_required
@require_http_methods(["PATCH"])
def mark_notification_read(request, notification_id):
    profile = get_user_profile(request.user)
    try:
        notification = Notification.objects.get(id=notification_id, recipient=profile)
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return JsonResponse({'id': notification.id, 'isRead': True})
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found'}, status=404)


@login_required
@require_http_methods(["GET"])
def notifications_unread_count(request):
    profile = get_user_profile(request.user)
    count = Notification.objects.filter(recipient=profile, is_read=False).count()
    return JsonResponse({'unreadCount': count})


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def resend_farmer_notification(request, application_id):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    try:
        application = AgriculturalInputApplication.objects.select_related('farmer__user').get(id=application_id)
        status_message = {
            'ready_for_collection': 'Your items are ready for collection.',
            'collected': 'Your items have been collected.',
            'delivered': 'Your items have been delivered.',
            'approved': 'Your application has been approved. Please proceed with payment.',
            'rejected': 'Your application has been rejected.',
        }.get(application.status, f'Your order status is now: {application.status}')
        _create_notification(
            application.farmer,
            f"Order {application.application_number} update",
            f"{status_message} Order: {application.application_number}. Items: {application.input_type} x {float(application.quantity)} {application.unit}. Total: RWF {float(application.total_amount):,.0f}. Admin notes: {application.admin_comments or 'None'}",
            'info', 'application', str(application.id),
        )
        return JsonResponse({'success': True, 'message': 'Notification sent to farmer.'})
    except AgriculturalInputApplication.DoesNotExist:
        return JsonResponse({'error': 'Application not found'}, status=404)


# ==================================================================
# CROP SEASONS, HARVESTS, ACTIVITIES, TASKS, SALES, PROBLEMS, WATER
# ==================================================================

ACTIVITY_TO_EXPENSE_CATEGORY = {
    'land_preparation': 'LABOR',
    'fertilizer_application': 'FERTILIZER',
    'weeding': 'LABOR',
    'pesticide_application': 'PESTICIDE',
    'irrigation': 'IRRIGATION',
    'harvesting': 'LABOR',
    'other': 'OTHER',
}


def _full_name(user_profile):
    if not user_profile or not user_profile.user:
        return ''
    return user_profile.user.get_full_name() or user_profile.user.username


def _parse_date(value):
    """Convert a date string (or date/datetime) into a datetime.date, or None."""
    if not value:
        return None
    if isinstance(value, datetime.date) and not isinstance(value, datetime.datetime):
        return value
    if isinstance(value, datetime.datetime):
        return value.date()
    parsed = parse_date(str(value)[:10])
    return parsed


REFERENCE_SEASON_NAMES = {
    'season-long-rainy': 'Long rainy season',
    'season-long-dry': 'Long dry season',
    'season-short-rainy': 'Short rainy season',
    'season-short-dry': 'Short dry season',
}


def _resolve_season(season_id):
    """Resolve a season id (DB id or reference catalog id) to a Season, or None."""
    if not season_id:
        return None
    try:
        return Season.objects.get(id=int(season_id))
    except (Season.DoesNotExist, ValueError, TypeError):
        pass
    name = REFERENCE_SEASON_NAMES.get(str(season_id))
    if name:
        season, _ = Season.objects.get_or_create(
            name=name,
            year=timezone.now().year,
            defaults={'start_month': 1, 'end_month': 12},
        )
        return season
    return None


def _serialize_crop_season(cs):
    return {
        'id': str(cs.id),
        'fieldId': str(cs.field_id),
        'fieldName': cs.field.name if cs.field else '',
        'cropTypeId': f"crop-{cs.field.crop_type.lower().replace(' ', '-')}" if cs.field and cs.field.crop_type else '',
        'cropTypeName': cs.field.crop_type if cs.field else '',
        'cropVarietyId': f"variety-{cs.field.variety.lower().replace(' ', '-')}" if cs.field and cs.field.variety else '',
        'cropVarietyName': cs.field.variety if cs.field else '',
        'seasonId': str(cs.season_id) if cs.season_id else '',
        'seasonName': str(cs.season) if cs.season_id else '',
        'plantingMethod': cs.planting_method or 'DIRECT_SEEDING',
        'plantingDate': cs.planting_date.isoformat() if cs.planting_date else '',
        'plantedAreaHectares': float(cs.planted_area_hectares) if cs.planted_area_hectares is not None else (float(cs.field.size_hectares) if cs.field and cs.field.size_hectares else 0),
        'expectedGrowingDurationDays': cs.expected_growing_duration_days or 0,
        'estimatedHarvestDate': cs.expected_harvest_date.isoformat() if cs.expected_harvest_date else '',
        'status': (cs.status or 'planned').upper(),
        'notes': cs.notes or '',
        'createdAt': cs.created_at.isoformat() if cs.created_at else '',
        'updatedAt': cs.updated_at.isoformat() if cs.updated_at else '',
    }


def _serialize_harvest_record(hr):
    return {
        'id': str(hr.id),
        'cropSeasonId': str(hr.crop_season_id),
        'harvestPlotId': str(hr.id),
        'harvestPlotName': hr.plot_name or f"Plot {hr.id}",
        'harvestDate': hr.harvest_date.isoformat() if hr.harvest_date else '',
        'quantityKg': float(hr.quantity_kg),
        'moistureContentPercent': float(hr.moisture_content_percent) if hr.moisture_content_percent is not None else None,
        'qualityGrade': (hr.grade or '').upper() or None,
        'notes': hr.notes or '',
        'recordedById': str(hr.recorded_by_id) if hr.recorded_by_id else '',
        'recordedByName': _full_name(hr.recorded_by),
        'createdAt': hr.created_at.isoformat() if hr.created_at else '',
        'updatedAt': hr.updated_at.isoformat() if hr.updated_at else '',
    }


def _serialize_activity(a):
    return {
        'id': str(a.id),
        'cropSeasonId': str(a.crop_season_id),
        'type': (a.activity_type or '').upper(),
        'activityDate': a.date_performed.isoformat() if a.date_performed else '',
        'description': a.description or '',
        'quantity': None,
        'unit': '',
        'cost': float(a.cost) if a.cost is not None else None,
        'performedById': str(a.recorded_by_id) if a.recorded_by_id else '',
        'performedByName': _full_name(a.recorded_by),
        'photos': [],
        'createdAt': a.created_at.isoformat() if a.created_at else '',
        'updatedAt': a.updated_at.isoformat() if a.updated_at else '',
    }


def _serialize_activity_expense(a):
    return {
        'id': str(a.id),
        'cropSeasonId': str(a.crop_season_id),
        'category': ACTIVITY_TO_EXPENSE_CATEGORY.get(a.activity_type, 'OTHER'),
        'description': a.description or a.get_activity_type_display(),
        'amount': float(a.cost) if a.cost is not None else 0,
        'currency': 'RWF',
        'expenseDate': a.date_performed.isoformat() if a.date_performed else '',
        'paymentMethod': (a.payment_method or 'CASH').upper(),
        'reference': a.reference or '',
        'recordedById': str(a.recorded_by_id) if a.recorded_by_id else '',
        'recordedByName': _full_name(a.recorded_by),
        'createdAt': a.created_at.isoformat() if a.created_at else '',
        'updatedAt': a.updated_at.isoformat() if a.updated_at else '',
    }


def _serialize_task(t):
    if t.completed:
        status = 'COMPLETED'
    elif t.due_date and t.due_date < timezone.now().date():
        status = 'OVERDUE'
    else:
        status = 'PENDING'
    return {
        'id': str(t.id),
        'cropSeasonId': str(t.crop_season_id),
        'title': t.title,
        'description': t.description or '',
        'dueDate': t.due_date.isoformat() if t.due_date else '',
        'completedDate': t.completed_date.isoformat() if t.completed_date else None,
        'status': status,
        'priority': (t.priority or 'medium').upper(),
        'createdById': str(t.created_by_id) if t.created_by_id else '',
        'createdByName': _full_name(t.created_by),
        'createdAt': t.created_at.isoformat() if t.created_at else '',
        'updatedAt': t.updated_at.isoformat() if t.updated_at else '',
    }


def _serialize_growth_observation(o):
    return {
        'id': str(o.id),
        'cropSeasonId': str(o.crop_season_id),
        'stage': o.growth_stage or '',
        'observedDate': o.observation_date.isoformat() if o.observation_date else '',
        'notes': o.notes or '',
        'photos': o.photos or [],
        'recordedById': str(o.recorded_by_id) if o.recorded_by_id else '',
        'recordedByName': _full_name(o.recorded_by),
        'createdAt': o.created_at.isoformat() if o.created_at else '',
    }


def _serialize_water_record(w):
    return {
        'id': str(w.id),
        'cropSeasonId': str(w.crop_season_id),
        'recordDate': w.record_date.isoformat() if w.record_date else '',
        'waterDepthCm': float(w.water_depth_cm) if w.water_depth_cm is not None else None,
        'waterCondition': w.water_condition or 'MOIST',
        'notes': w.notes or '',
        'recordedById': str(w.recorded_by_id) if w.recorded_by_id else '',
        'recordedByName': _full_name(w.recorded_by),
        'createdAt': w.created_at.isoformat() if w.created_at else '',
    }


def _serialize_sale(s):
    return {
        'id': str(s.id),
        'cropSeasonId': str(s.crop_season_id) if s.crop_season_id else '',
        'buyerName': s.buyer_name,
        'quantityKg': float(s.quantity_kg),
        'unitPrice': float(s.unit_price),
        'totalAmount': float(s.total_amount),
        'currency': s.currency or 'RWF',
        'saleDate': s.sale_date.isoformat() if s.sale_date else '',
        'paymentMethod': (s.payment_method or 'CASH').upper(),
        'paymentReference': s.payment_reference or '',
        'notes': s.notes or '',
        'recordedById': str(s.recorded_by_id) if s.recorded_by_id else '',
        'recordedByName': _full_name(s.recorded_by),
        'createdAt': s.created_at.isoformat() if s.created_at else '',
        'updatedAt': s.updated_at.isoformat() if s.updated_at else '',
    }


def _serialize_crop_problem(p):
    return {
        'id': str(p.id),
        'cropSeasonId': str(p.crop_season_id) if p.crop_season_id else '',
        'reportedDate': p.reported_date.isoformat() if p.reported_date else '',
        'problemType': p.problem_type or 'OTHER',
        'severity': p.severity or 'MEDIUM',
        'description': p.description or '',
        'affectedAreaHectares': float(p.affected_area_hectares) if p.affected_area_hectares is not None else None,
        'photos': p.photos or [],
        'reportedById': str(p.reported_by_id) if p.reported_by_id else '',
        'reportedByName': _full_name(p.reported_by),
        'status': p.status or 'REPORTED',
        'createdAt': p.created_at.isoformat() if p.created_at else '',
    }


def _serialize_farm(f):
    return {
        'id': str(f.id),
        'name': f.name,
        'sizeHectares': float(f.size_hectares),
        'location': f.location or '',
        'ownerId': str(f.farmer_id),
        'createdAt': f.created_at.isoformat() if f.created_at else '',
    }


def _serialize_field(f):
    return {
        'id': str(f.id),
        'farmId': str(f.farm_id),
        'farmName': f.farm.name if f.farm else '',
        'name': f.name,
        'code': f"F-{f.id:03d}",
        'areaHectares': float(f.size_hectares),
        'soilType': '',
        'irrigationMethod': '',
        'cropType': f.crop_type or '',
        'variety': f.variety or '',
        'createdAt': f.created_at.isoformat() if f.created_at else '',
        'updatedAt': f.created_at.isoformat() if f.created_at else '',
    }


def _get_accessible_crop_season(user, season_id):
    try:
        return CropSeason.objects.select_related('field', 'season').get(
            id=season_id, field__in=get_accessible_fields(user)
        )
    except (CropSeason.DoesNotExist, ValueError, TypeError):
        return None


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def crop_seasons_list_create(request):
    profile = get_user_profile(request.user)
    if request.method == "GET":
        seasons = CropSeason.objects.filter(
            field__in=get_accessible_fields(request.user)
        ).select_related('field', 'field__farm', 'season').order_by('-planting_date')
        return JsonResponse({'cropSeasons': [_serialize_crop_season(cs) for cs in seasons]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    field_id = data.get('fieldId')
    try:
        field = Field.objects.get(id=field_id, farm__farmer=profile)
    except (Field.DoesNotExist, ValueError, TypeError):
        return JsonResponse({'error': 'Field not found'}, status=404)

    planting_date = _parse_date(data.get('plantingDate'))
    if not planting_date:
        return JsonResponse({'error': 'plantingDate is required'}, status=400)

    season = _resolve_season(data.get('seasonId'))

    duration = int(data.get('expectedGrowingDurationDays') or 0)
    expected_harvest = _parse_date(data.get('estimatedHarvestDate'))
    if not expected_harvest and duration > 0:
        expected_harvest = planting_date + timezone.timedelta(days=duration)

    crop_season = CropSeason.objects.create(
        field=field,
        season=season,
        planting_date=planting_date,
        expected_harvest_date=expected_harvest,
        planting_method=data.get('plantingMethod') or 'DIRECT_SEEDING',
        planted_area_hectares=data.get('plantedAreaHectares') or field.size_hectares,
        expected_growing_duration_days=duration or None,
        notes=data.get('notes') or '',
        status=(data.get('status') or 'planned').lower(),
    )
    return JsonResponse(_serialize_crop_season(crop_season), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "DELETE"])
def crop_season_detail(request, pk):
    crop_season = _get_accessible_crop_season(request.user, pk)
    if not crop_season:
        return JsonResponse({'error': 'Crop season not found'}, status=404)

    if request.method == "GET":
        return JsonResponse(_serialize_crop_season(crop_season))

    crop_season.delete()
    return JsonResponse({'success': True})


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def harvest_records_list_create(request):
    if request.method == "GET":
        records = HarvestRecord.objects.filter(
            crop_season__field__in=get_accessible_fields(request.user)
        ).select_related('crop_season', 'recorded_by__user').order_by('-harvest_date')
        return JsonResponse({'harvests': [_serialize_harvest_record(hr) for hr in records]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
    if not crop_season:
        return JsonResponse({'error': 'Crop season not found'}, status=404)

    quantity = data.get('quantityKg')
    harvest_date = _parse_date(data.get('harvestDate'))
    if quantity is None or not harvest_date:
        return JsonResponse({'error': 'quantityKg and harvestDate are required'}, status=400)

    profile = get_user_profile(request.user)
    record = HarvestRecord.objects.create(
        crop_season=crop_season,
        harvest_date=harvest_date,
        quantity_kg=quantity,
        grade=data.get('qualityGrade') or '',
        plot_name=data.get('harvestPlotName') or '',
        area_hectares=data.get('areaHectares'),
        moisture_content_percent=data.get('moistureContentPercent'),
        notes=data.get('notes') or '',
        recorded_by=profile,
    )
    return JsonResponse(_serialize_harvest_record(record), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def activities_list_create(request):
    if request.method == "GET":
        activities = Activity.objects.filter(
            crop_season__field__in=get_accessible_fields(request.user)
        ).select_related('crop_season', 'recorded_by__user').order_by('-date_performed')
        return JsonResponse({'activities': [_serialize_activity(a) for a in activities]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
    if not crop_season:
        return JsonResponse({'error': 'Crop season not found'}, status=404)

    activity_type = (data.get('type') or data.get('activityType') or 'other').lower()
    if activity_type not in dict(Activity.ACTIVITY_TYPES):
        activity_type = 'other'

    profile = get_user_profile(request.user)
    activity = Activity.objects.create(
        crop_season=crop_season,
        activity_type=activity_type,
        description=data.get('description') or '',
        date_performed=_parse_date(data.get('activityDate')) or timezone.now().date(),
        cost=data.get('cost'),
        payment_method=data.get('paymentMethod') or '',
        reference=data.get('reference') or '',
        recorded_by=profile,
    )
    return JsonResponse(_serialize_activity(activity), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def tasks_list_create(request):
    if request.method == "GET":
        tasks = Task.objects.filter(
            crop_season__field__in=get_accessible_fields(request.user)
        ).select_related('crop_season', 'created_by__user').order_by('-due_date')
        return JsonResponse({'tasks': [_serialize_task(t) for t in tasks]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
    if not crop_season:
        return JsonResponse({'error': 'Crop season not found'}, status=404)

    title = (data.get('title') or '').strip()
    due_date = _parse_date(data.get('dueDate'))
    if not title or not due_date:
        return JsonResponse({'error': 'title and dueDate are required'}, status=400)

    priority = (data.get('priority') or 'medium').lower()
    if priority not in dict(Task.PRIORITY_CHOICES):
        priority = 'medium'

    profile = get_user_profile(request.user)
    task = Task.objects.create(
        crop_season=crop_season,
        title=title,
        description=data.get('description') or '',
        due_date=due_date,
        priority=priority,
        created_by=profile,
    )
    return JsonResponse(_serialize_task(task), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "PATCH", "DELETE"])
def task_detail(request, pk):
    try:
        task = Task.objects.select_related('crop_season', 'created_by__user').get(
            id=pk, crop_season__field__in=get_accessible_fields(request.user)
        )
    except (Task.DoesNotExist, ValueError, TypeError):
        return JsonResponse({'error': 'Task not found'}, status=404)

    if request.method == "GET":
        return JsonResponse(_serialize_task(task))

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({'success': True})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    if 'completed' in data:
        task.completed = bool(data['completed'])
        task.completed_date = timezone.now().date() if task.completed else None
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'dueDate' in data:
        parsed_due = _parse_date(data['dueDate'])
        if parsed_due:
            task.due_date = parsed_due
    if 'priority' in data:
        priority = (data['priority'] or 'medium').lower()
        if priority in dict(Task.PRIORITY_CHOICES):
            task.priority = priority
    task.save()
    return JsonResponse(_serialize_task(task))


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def growth_observations_list_create(request):
    if request.method == "GET":
        observations = GrowthObservation.objects.filter(
            crop_season__field__in=get_accessible_fields(request.user)
        ).select_related('crop_season', 'recorded_by__user').order_by('-observation_date')
        return JsonResponse({'observations': [_serialize_growth_observation(o) for o in observations]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
    if not crop_season:
        return JsonResponse({'error': 'Crop season not found'}, status=404)

    stage = data.get('stage') or ''
    observed_date = _parse_date(data.get('observedDate'))
    if not stage or not observed_date:
        return JsonResponse({'error': 'stage and observedDate are required'}, status=400)

    profile = get_user_profile(request.user)
    observation = GrowthObservation.objects.create(
        crop_season=crop_season,
        growth_stage=stage,
        observation_date=observed_date,
        notes=data.get('notes') or '',
        photos=data.get('photos') or [],
        recorded_by=profile,
    )
    return JsonResponse(_serialize_growth_observation(observation), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def water_records_list_create(request):
    if request.method == "GET":
        records = WaterRecord.objects.filter(
            crop_season__field__in=get_accessible_fields(request.user)
        ).select_related('crop_season', 'recorded_by__user').order_by('-record_date')
        return JsonResponse({'waterRecords': [_serialize_water_record(w) for w in records]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
    if not crop_season:
        return JsonResponse({'error': 'Crop season not found'}, status=404)

    profile = get_user_profile(request.user)
    record = WaterRecord.objects.create(
        crop_season=crop_season,
        record_date=_parse_date(data.get('recordDate')) or timezone.now().date(),
        water_depth_cm=data.get('waterDepthCm'),
        water_condition=data.get('waterCondition') or 'MOIST',
        notes=data.get('notes') or '',
        recorded_by=profile,
    )
    return JsonResponse(_serialize_water_record(record), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def sales_list_create(request):
    profile = get_user_profile(request.user)
    if request.method == "GET":
        sales = Sale.objects.filter(farmer=profile).select_related('crop_season', 'recorded_by__user').order_by('-sale_date')
        return JsonResponse({'sales': [_serialize_sale(s) for s in sales]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    buyer_name = (data.get('buyerName') or '').strip()
    quantity = data.get('quantityKg')
    unit_price = data.get('unitPrice')
    sale_date = _parse_date(data.get('saleDate'))
    if not buyer_name or quantity is None or unit_price is None or not sale_date:
        return JsonResponse({'error': 'buyerName, quantityKg, unitPrice and saleDate are required'}, status=400)

    crop_season = None
    if data.get('cropSeasonId'):
        crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
        if not crop_season:
            return JsonResponse({'error': 'Crop season not found'}, status=404)

    try:
        total_amount = float(quantity) * float(unit_price)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid quantity or price'}, status=400)

    sale = Sale.objects.create(
        farmer=profile,
        crop_season=crop_season,
        buyer_name=buyer_name,
        quantity_kg=quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        currency=data.get('currency') or 'RWF',
        sale_date=sale_date,
        payment_method=(data.get('paymentMethod') or 'CASH').upper(),
        payment_reference=data.get('paymentReference') or '',
        notes=data.get('notes') or '',
        recorded_by=profile,
    )
    return JsonResponse(_serialize_sale(sale), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def crop_problem_reports_list_create(request):
    profile = get_user_profile(request.user)
    if request.method == "GET":
        problems = CropProblemReport.objects.filter(
            farmer=profile
        ).select_related('field', 'crop_season', 'reported_by__user').order_by('-reported_date')
        return JsonResponse({'problems': [_serialize_crop_problem(p) for p in problems]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    description = (data.get('description') or '').strip()
    if not description:
        return JsonResponse({'error': 'description is required'}, status=400)

    field = None
    if data.get('fieldId'):
        try:
            field = Field.objects.get(id=data.get('fieldId'), farm__farmer=profile)
        except (Field.DoesNotExist, ValueError, TypeError):
            return JsonResponse({'error': 'Field not found'}, status=404)

    crop_season = None
    if data.get('cropSeasonId'):
        crop_season = _get_accessible_crop_season(request.user, data.get('cropSeasonId'))
        if not crop_season:
            return JsonResponse({'error': 'Crop season not found'}, status=404)

    problem_type = data.get('problemType') or 'OTHER'
    if problem_type not in dict(CropProblemReport.PROBLEM_TYPES):
        problem_type = 'OTHER'
    severity = data.get('severity') or 'MEDIUM'
    if severity not in dict(CropProblemReport.SEVERITY_CHOICES):
        severity = 'MEDIUM'

    problem = CropProblemReport.objects.create(
        farmer=profile,
        field=field,
        crop_season=crop_season,
        problem_type=problem_type,
        severity=severity,
        description=description,
        affected_area_hectares=data.get('affectedAreaHectares'),
        photos=data.get('photos') or [],
        reported_date=_parse_date(data.get('reportedDate')) or timezone.now().date(),
        status='REPORTED',
        reported_by=profile,
    )
    return JsonResponse(_serialize_crop_problem(problem), status=201)


@login_required
@require_http_methods(["GET"])
def dashboard_stats(request):
    if not is_farmer(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)

    profile = get_user_profile(request.user)
    fields = Field.objects.filter(farm__farmer=profile)
    crop_seasons = CropSeason.objects.filter(field__in=fields)
    today = timezone.now().date()

    tasks = Task.objects.filter(crop_season__field__in=fields)
    upcoming_tasks = tasks.filter(completed=False, due_date__gte=today).count()
    overdue_tasks = tasks.filter(completed=False, due_date__lt=today).count()

    pending_requests = InputRequest.objects.filter(
        farmer=profile, status__in=['draft', 'submitted', 'under_review']
    ).count()

    total_harvest = HarvestRecord.objects.filter(
        crop_season__field__in=fields
    ).aggregate(total=Sum('quantity_kg'))['total'] or 0

    total_expenses = Activity.objects.filter(
        crop_season__field__in=fields
    ).aggregate(total=Sum('cost'))['total'] or 0

    total_sales = Sale.objects.filter(farmer=profile).aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    return JsonResponse({
        'activeFields': fields.count(),
        'activeCropSeasons': crop_seasons.filter(status='active').count(),
        'upcomingTasks': upcoming_tasks,
        'overdueTasks': overdue_tasks,
        'pendingRequests': pending_requests,
        'totalHarvestKg': float(total_harvest),
        'totalExpenses': float(total_expenses),
        'totalSales': float(total_sales),
        'cashBalance': float(total_sales - total_expenses),
    })


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def farms_list_create(request):
    profile = get_user_profile(request.user)
    if request.method == "GET":
        farms = Farm.objects.filter(farmer=profile).order_by('name')
        return JsonResponse({'farms': [_serialize_farm(f) for f in farms]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    name = (data.get('name') or '').strip()
    size = data.get('sizeHectares')
    if not name or size is None:
        return JsonResponse({'error': 'name and sizeHectares are required'}, status=400)

    farm = Farm.objects.create(
        farmer=profile,
        name=name,
        size_hectares=size,
        location=data.get('location') or '',
    )
    return JsonResponse(_serialize_farm(farm), status=201)


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def fields_list_create(request):
    profile = get_user_profile(request.user)
    if request.method == "GET":
        fields = Field.objects.filter(farm__farmer=profile).select_related('farm').order_by('name')
        return JsonResponse({'fields': [_serialize_field(f) for f in fields]})

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    farm_id = data.get('farmId')
    try:
        farm = Farm.objects.get(id=farm_id, farmer=profile)
    except (Farm.DoesNotExist, ValueError, TypeError):
        return JsonResponse({'error': 'Farm not found'}, status=404)

    name = (data.get('name') or '').strip()
    size = data.get('areaHectares')
    if not name or size is None:
        return JsonResponse({'error': 'name and areaHectares are required'}, status=400)

    field = Field.objects.create(
        farm=farm,
        name=name,
        size_hectares=size,
        crop_type=data.get('cropType') or '',
        variety=data.get('variety') or '',
    )
    return JsonResponse(_serialize_field(field), status=201)


REFERENCE_CROP_TYPES = [
    {'id': 'crop-rice', 'name': 'Rice', 'scientificName': 'Oryza sativa', 'defaultGrowingDurationDays': 120, 'isActive': True},
    {'id': 'crop-maize', 'name': 'Maize', 'scientificName': 'Zea mays', 'defaultGrowingDurationDays': 110, 'isActive': True},
    {'id': 'crop-banana', 'name': 'Banana', 'scientificName': 'Musa acuminata', 'defaultGrowingDurationDays': 300, 'isActive': True},
    {'id': 'crop-cassava', 'name': 'Cassava', 'scientificName': 'Manihot esculenta', 'defaultGrowingDurationDays': 300, 'isActive': True},
    {'id': 'crop-potato', 'name': 'Potato', 'scientificName': 'Solanum tuberosum', 'defaultGrowingDurationDays': 120, 'isActive': True},
    {'id': 'crop-bean', 'name': 'Bean', 'scientificName': 'Phaseolus vulgaris', 'defaultGrowingDurationDays': 90, 'isActive': True},
]

REFERENCE_VARIETIES = [
    {'id': 'variety-ir-52', 'cropTypeName': 'Rice', 'name': 'IR 52', 'growingDurationDays': 120, 'isActive': True},
    {'id': 'variety-nerica-4', 'cropTypeName': 'Rice', 'name': 'NERICA 4', 'growingDurationDays': 110, 'isActive': True},
    {'id': 'variety-sc-627', 'cropTypeName': 'Maize', 'name': 'SC 627', 'growingDurationDays': 110, 'isActive': True},
    {'id': 'variety-fhia-17', 'cropTypeName': 'Banana', 'name': 'FHIA-17 (Dessert & Multi-use)', 'growingDurationDays': 270, 'isActive': True},
    {'id': 'variety-grand-nain', 'cropTypeName': 'Banana', 'name': 'Grand Nain (Cavendish Dessert)', 'growingDurationDays': 300, 'isActive': True},
    {'id': 'variety-injagi', 'cropTypeName': 'Banana', 'name': 'Injagi / Cooking (Matooke)', 'growingDurationDays': 330, 'isActive': True},
    {'id': 'variety-agatoki', 'cropTypeName': 'Banana', 'name': 'Plantain / Agatoki (Roasting)', 'growingDurationDays': 360, 'isActive': True},
]

REFERENCE_SEASONS = [
    {'id': 'season-long-rainy', 'name': 'Long rainy season', 'code': 'LONG-RAINY', 'startDate': '03-01', 'endDate': '05-31', 'isActive': True},
    {'id': 'season-long-dry', 'name': 'Long dry season', 'code': 'LONG-DRY', 'startDate': '06-01', 'endDate': '09-30', 'isActive': False},
    {'id': 'season-short-rainy', 'name': 'Short rainy season', 'code': 'SHORT-RAINY', 'startDate': '10-01', 'endDate': '12-31', 'isActive': False},
    {'id': 'season-short-dry', 'name': 'Short dry season', 'code': 'SHORT-DRY', 'startDate': '01-01', 'endDate': '02-29', 'isActive': False},
]


@login_required
@require_http_methods(["GET"])
def crop_catalog(request):
    profile = get_user_profile(request.user)
    fields = Field.objects.filter(farm__farmer=profile)

    crop_types = {ct['id']: dict(ct) for ct in REFERENCE_CROP_TYPES}
    varieties = {v['id']: dict(v) for v in REFERENCE_VARIETIES}

    for f in fields:
        if f.crop_type:
            cid = f"crop-{f.crop_type.lower().replace(' ', '-')}"
            if cid not in crop_types:
                crop_types[cid] = {
                    'id': cid, 'name': f.crop_type, 'scientificName': '',
                    'defaultGrowingDurationDays': 120, 'isActive': True,
                }
        if f.variety:
            vid = f"variety-{f.variety.lower().replace(' ', '-')}"
            if vid not in varieties:
                varieties[vid] = {
                    'id': vid, 'cropTypeName': f.crop_type or '', 'name': f.variety,
                    'growingDurationDays': 120, 'isActive': True,
                }

    db_seasons = Season.objects.all().order_by('year', 'start_month')
    seasons = [
        {
            'id': str(s.id),
            'name': str(s),
            'code': '',
            'startDate': '',
            'endDate': '',
            'isActive': True,
        }
        for s in db_seasons
    ]
    if not seasons:
        seasons = REFERENCE_SEASONS

    return JsonResponse({
        'cropTypes': list(crop_types.values()),
        'varieties': list(varieties.values()),
        'seasons': seasons,
    })