import json
import os
from types import SimpleNamespace
from functools import wraps
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from .models import AIConversation
from farm.models import UserProfile, Farm, Field, Season, CropSeason, Activity, Task, HarvestRecord, InputRequest, Order, Payment, GrowthObservation, AgriculturalOfficerAdvice


def require_ai_user(view):
    """Use Django sessions in production and bridge the local demo auth in DEBUG."""
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view(request, *args, **kwargs)

        if not settings.DEBUG:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        username = request.headers.get('X-AgriTrack-Username', '').strip()
        if not username or len(username) > 150:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        role_map = {'ADMIN': 'admin', 'OFFICER': 'officer', 'FARMER': 'farmer'}
        role = role_map.get(request.headers.get('X-AgriTrack-Role', 'FARMER').upper(), 'farmer')
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={'email': f'{username}@agritrack.local'},
        )
        UserProfile.objects.get_or_create(user=user, defaults={'role': role})
        request.user = user
        return view(request, *args, **kwargs)

    return wrapped
# We'll import the farm views to reuse the data fetching functions, or we can directly query the models.
# For simplicity, we'll directly query the models in this view, but we could also call the farm endpoints internally.
# However, to avoid duplication, we'll create helper functions that are used by both the farm views and the AI assistant.

# Helper functions (same as in farm views) - we'll duplicate for simplicity, but in a real app we'd put these in a utils module.
def get_user_profile(user):
    try:
        return user.userprofile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user, role='farmer')
        return profile

def is_farmer(user):
    profile = get_user_profile(user)
    return profile.role == 'farmer'

def is_officer(user):
    profile = get_user_profile(user)
    return profile.role == 'officer'

def is_admin(user):
    profile = get_user_profile(user)
    return profile.role == 'admin'

def get_accessible_fields(user):
    profile = get_user_profile(user)
    if profile.role == 'admin':
        return Field.objects.all()
    elif profile.role == 'officer':
        return Field.objects.all()  # Simplified
    else:
        return Field.objects.filter(farm__farmer=profile)

def get_accessible_crop_seasons(user):
    return CropSeason.objects.filter(field__in=get_accessible_fields(user))

# We'll create a function to determine the intent of the user's message and fetch the relevant data.
# This is a simplified version. In a real app, we might use NLP or an AI model to understand the intent.
def get_data_for_question(user, question):
    """
    Based on the user's question, fetch relevant data from the database.
    Returns a dictionary of data and a list of context records used.
    """
    question_lower = question.lower()
    context_records = []
    data = {}

    # We'll define a set of rules to map questions to data fetching functions.
    # This is similar to the rule-based system in the frontend, but now we can use the data to feed an AI model.
    
    # Helper to add context records
    def add_context(record_type, description):
        context_records.append(f"{record_type}: {description}")

    # Activities this week (match both "activity" and "activities")
    if 'activit' in question_lower and 'week' in question_lower:
        if not is_farmer(user):
            return {'error': 'Permission denied'}, context_records
        today = timezone.now().date()
        one_week_ago = today - timezone.timedelta(days=7)
        activities = Activity.objects.filter(
            crop_season__field__in=get_accessible_fields(user),
            date_performed__gte=one_week_ago,
            date_performed__lte=today
        )
        data['activities_this_week'] = [
            {
                'type': a.activity_type,
                'description': a.description,
                'date': a.date_performed.isoformat(),
                'cost': float(a.cost) if a.cost else None,
            }
            for a in activities
        ]
        add_context('Activity records', f'{activities.count()} activities from the past 7 days')
        return data, context_records

    # Overdue tasks
    if 'task' in question_lower and 'overdue' in question_lower:
        if not (is_farmer(user) or is_officer(user)):
            return {'error': 'Permission denied'}, context_records
        today = timezone.now().date()
        overdue_tasks = Task.objects.filter(
            crop_season__field__in=get_accessible_fields(user),
            completed=False,
            due_date__lt=today
        )
        data['overdue_tasks'] = [
            {
                'title': t.title,
                'description': t.description,
                'due_date': t.due_date.isoformat(),
                'priority': t.priority,
                'crop_season': {
                    'field': t.crop_season.field.name,
                    'crop_type': t.crop_season.field.crop_type,
                }
            }
            for t in overdue_tasks
        ]
        add_context('Task list', f'{overdue_tasks.count()} overdue tasks')
        return data, context_records

    # Growth stage
    if 'growth stage' in question_lower or 'last recorded' in question_lower:
        if not (is_farmer(user) or is_officer(user)):
            return {'error': 'Permission denied'}, context_records
        # Get the latest growth observation for each active crop season
        latest_observations = GrowthObservation.objects.filter(
            crop_season__in=get_accessible_crop_seasons(user)
        ).order_by('crop_season', '-observation_date').distinct('crop_season')
        data['latest_growth_observations'] = [
            {
                'crop_season': {
                    'field': obs.crop_season.field.name,
                    'crop_type': obs.crop_season.field.crop_type,
                    'season': str(obs.crop_season.season),
                },
                'growth_stage': obs.growth_stage,
                'observation_date': obs.observation_date.isoformat(),
                'notes': obs.notes,
            }
            for obs in latest_observations
        ]
        add_context('Growth observation records', f'{latest_observations.count()} latest observations')
        return data, context_records

    # Estimated harvest
    if 'harvest' in question_lower and 'estimated' in question_lower:
        if not (is_farmer(user) or is_officer(user)):
            return {'error': 'Permission denied'}, context_records
        active_seasons = CropSeason.objects.filter(
            field__in=get_accessible_fields(user),
            status='active'
        )
        data['estimated_harvest_dates'] = [
            {
                'crop_season': {
                    'field': cs.field.name,
                    'crop_type': cs.field.crop_type,
                    'variety': cs.field.variety,
                },
                'planting_date': cs.planting_date.isoformat() if cs.planting_date else None,
                'expected_harvest_date': cs.expected_harvest_date.isoformat() if cs.expected_harvest_date else None,
                'status': cs.status,
            }
            for cs in active_seasons
        ]
        add_context('Crop season records', f'{active_seasons.count()} active seasons')
        return data, context_records

    # Seed request status
    if 'seed request' in question_lower or 'request status' in question_lower:
        if not is_farmer(user):
            return {'error': 'Permission denied'}, context_records
        profile = get_user_profile(user)
        input_requests = InputRequest.objects.filter(farmer=profile)
        data['input_requests'] = [
            {
                'id': ir.id,
                'input_type': ir.input_type,
                'description': ir.description,
                'total_cost': float(ir.total_cost),
                'status': ir.status,
                'submitted_at': ir.submitted_at.isoformat() if ir.submitted_at else None,
            }
            for ir in input_requests
        ]
        add_context('Input request records', f'{input_requests.count()} input requests')
        return data, context_records

    # Payment confirmation
    if 'payment' in question_lower and 'confirmed' in question_lower:
        if not is_farmer(user):
            return {'error': 'Permission denied'}, context_records
        profile = get_user_profile(user)
        confirmed_payments = Payment.objects.filter(
            order__input_request__farmer=profile,
            order__status='confirmed'
        )
        data['confirmed_payments'] = [
            {
                'amount': float(p.amount),
                'payment_date': p.payment_date.isoformat(),
                'method': p.method,
                'transaction_id': p.transaction_id,
                'order': {
                    'order_number': p.order.order_number,
                    'input_request': p.order.input_request.description,
                }
            }
            for p in confirmed_payments
        ]
        add_context('Payment records', f'{confirmed_payments.count()} confirmed payments')
        return data, context_records

    # Harvest comparison
    if 'harvest' in question_lower and 'compare' in question_lower:
        if not is_farmer(user):
            return {'error': 'Permission denied'}, context_records
        # We'll expect the user to specify which seasons to compare, but for simplicity, we'll compare the last two seasons with harvest data.
        # Get all seasons that have harvest records for the user's fields
        seasons_with_harvest = Season.objects.filter(
            cropseason__field__in=get_accessible_fields(user),
            cropseason__harvestrecord__isnull=False
        ).distinct()
        if seasons_with_harvest.count() < 2:
            data['message'] = 'Not enough seasons with harvest data to compare.'
            add_context('Harvest records', f'{seasons_with_harvest.count()} seasons with harvest data')
            return data, context_records
        # Take the two most recent seasons by year
        seasons_ordered = seasons_with_harvest.order_by('-year')
        season1 = seasons_ordered.first()
        season2 = seasons_ordered[1] if len(seasons_ordered) > 1 else None
        if not season2:
            data['message'] = 'Only one season with harvest data found.'
            add_context('Harvest records', f'{seasons_with_harvest.count()} seasons with harvest data')
            return data, context_records
        
        # Now compare these two seasons (similar to the compare_seasons view)
        harvests_season1 = HarvestRecord.objects.filter(
            crop_season__field__in=get_accessible_fields(user),
            crop_season__season=season1
        )
        harvests_season2 = HarvestRecord.objects.filter(
            crop_season__field__in=get_accessible_fields(user),
            crop_season__season=season2
        )
        total1 = harvests_season1.aggregate(total=Sum('quantity_kg'))['total'] or 0
        total2 = harvests_season2.aggregate(total=Sum('quantity_kg'))['total'] or 0
        
        def calculate_yield(harvests):
            total_qty = harvests.aggregate(total=Sum('quantity_kg'))['total'] or 0
            total_area = harvests.exclude(area_hectares__isnull=True).exclude(area_hectares=0).aggregate(total=Sum('area_hectares'))['total'] or 0
            return (total_qty / total_area) if total_area > 0 else 0, float(total_qty), float(total_area)
        
        yield1, total_qty1, total_area1 = calculate_yield(harvests_season1)
        yield2, total_qty2, total_area2 = calculate_yield(harvests_season2)
        
        data['comparison'] = {
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
        add_context('Harvest records', f'Compared {season1} and {season2}')
        return data, context_records

    # Advice
    if 'advice' in question_lower or 'how to' in question_lower:
        if not (is_farmer(user) or is_officer(user)):
            return {'error': 'Permission denied'}, context_records
        advice = AgriculturalOfficerAdvice.objects.filter(
            crop_season__field__in=get_accessible_fields(user)
        ).order_by('-advice_date')[:5]  # Latest 5 advice
        data['recent_advice'] = [
            {
                'advice_date': a.advice_date.isoformat(),
                'advice_text': a.advice_text,
                'officer': a.officer.user.username,
                'crop_season': {
                    'field': a.crop_season.field.name,
                    'crop_type': a.crop_season.field.crop_type,
                    'season': str(a.crop_season.season),
                }
            }
            for a in advice
        ]
        add_context('Agricultural officer advice', f'{advice.count()} recent advice records')
        return data, context_records

    # Short greetings and unclear text need clarification, not fake records.
    if question_lower.strip(' !?.') in ('hi', 'hello', 'hey', 'thanks', 'thank you'):
        return {'message': 'Hello! I can help with your banana fields, monitoring, tasks, requests, and harvest records. What would you like to check?'}, []
    if question_lower.strip() == 'svg':
        return {'message': 'What would you like to know about SVG? If you meant a farm record, tell me which field or activity you want to check.'}, []

    # Unknown phrasing still receives a real, authorized record snapshot.
    from farm.banana_views import banana_dashboard_summary, _accessible_plantations
    banana_response = banana_dashboard_summary(SimpleNamespace(user=user, method='GET'))
    data['farm_summary'] = {
        'fields': get_accessible_fields(user).count(),
        'crop_seasons': get_accessible_crop_seasons(user).count(),
        'banana': json.loads(banana_response.content),
        'banana_fields': list(_accessible_plantations(user).values('name', 'variety', 'total_plants_planted')[:10]),
    }
    add_context('Farm records', 'Authorized fields, crop seasons, and banana monitoring summary')
    return data, context_records


def format_rule_based_response(question_data):
    """
    Render fetched question_data as a concise, human-readable summary.

    This is the rule-based fallback used when the AI provider (e.g. OpenAI) is
    unavailable, so the assistant always returns something useful that is
    grounded in the farmer's actual records instead of dumping raw JSON.
    """
    if 'message' in question_data:
        return question_data['message']

    lines = []

    if 'farm_summary' in question_data:
        summary = question_data['farm_summary']
        banana = summary['banana']
        lines.append(f"Your saved records contain {summary['fields']} crop field(s), {summary['crop_seasons']} crop season(s), and {banana['totalPlantations']} banana field(s).")
        lines.append(f"Banana mats planted: {banana['totalPlants']}; affected mats observed: {banana['affectedPlants']}.")
        health = banana['healthRatePercent']
        lines.append('No banana monitoring data yet.' if health is None else f'Healthy banana mats: {health}% of observed mats.')
        lines.append(f"Active banana disease reports: {banana['activeDiseaseReports']}; pending assistance requests: {banana['pendingAssistanceRequests']}.")
        lines.append('For a more specific answer, ask about overdue tasks, activities this week, growth stages, harvest dates, request status, or officer advice.')

    elif 'activities_this_week' in question_data:
        activities = question_data['activities_this_week']
        if not activities:
            lines.append("You have no recorded activities in the past 7 days.")
        else:
            noun = 'activity' if len(activities) == 1 else 'activities'
            lines.append(f"You completed {len(activities)} {noun} in the past 7 days:")
            for a in activities:
                cost = a.get('cost')
                cost_str = f" (cost: {cost})" if cost else ""
                lines.append(f"- On {a.get('date')}: {a.get('type', 'Activity')} — {a.get('description')}{cost_str}")

    elif 'overdue_tasks' in question_data:
        tasks = question_data['overdue_tasks']
        if not tasks:
            lines.append("You have no overdue tasks.")
        else:
            lines.append(f"You have {len(tasks)} overdue task(s):")
            for t in tasks:
                cs = t.get('crop_season', {})
                lines.append(f"- {t.get('title')} (due {t.get('due_date')}) — {t.get('description')} "
                             f"[{t.get('priority')} priority] — field: {cs.get('field')}, crop: {cs.get('crop_type')}")

    elif 'latest_growth_observations' in question_data:
        observations = question_data['latest_growth_observations']
        if not observations:
            lines.append("No recent growth-stage observations found.")
        else:
            lines.append(f"Latest growth-stage observations ({len(observations)}):")
            for o in observations:
                cs = o.get('crop_season', {})
                notes = o.get('notes')
                note_str = f"; notes: {notes}" if notes else ""
                lines.append(f"- {cs.get('field')} / {cs.get('crop_type')} ({cs.get('season')}): "
                             f"growth stage is {o.get('growth_stage')} (observed {o.get('observation_date')}{note_str})")

    elif 'estimated_harvest_dates' in question_data:
        seasons = question_data['estimated_harvest_dates']
        if not seasons:
            lines.append("No active crop seasons with estimated harvest dates found.")
        else:
            lines.append("Estimated harvest dates for your active crop seasons:")
            for s in seasons:
                cs = s.get('crop_season', {})
                lines.append(f"- {cs.get('crop_type')} ({cs.get('variety')}) on {cs.get('field')}: "
                             f"planted {s.get('planting_date')}, expected harvest {s.get('expected_harvest_date')} "
                             f"(status: {s.get('status')})")

    elif 'input_requests' in question_data:
        requests_list = question_data['input_requests']
        if not requests_list:
            lines.append("You have no input (seed/fertilizer) requests recorded.")
        else:
            lines.append(f"You have {len(requests_list)} input request(s):")
            for r in requests_list:
                lines.append(f"- #{r.get('id')} {r.get('input_type')} — {r.get('description')} "
                             f"— cost: {r.get('total_cost')} — status: {r.get('status')} "
                             f"(submitted {r.get('submitted_at')})")

    elif 'confirmed_payments' in question_data:
        payments = question_data['confirmed_payments']
        if not payments:
            lines.append("No confirmed payments found for your input requests.")
        else:
            lines.append(f"You have {len(payments)} confirmed payment(s):")
            for p in payments:
                order = p.get('order', {})
                lines.append(f"- Amount {p.get('amount')} on {p.get('payment_date')} via {p.get('method')} "
                             f"(txn: {p.get('transaction_id')}) — order {order.get('order_number')} "
                             f"/ {order.get('input_request')}")

    elif 'comparison' in question_data:
        comp = question_data['comparison']
        s1 = comp.get('season1', {})
        s2 = comp.get('season2', {})
        diff = comp.get('difference', {})
        lines.append(f"Harvest comparison between {s1.get('name')} and {s2.get('name')}:")
        lines.append(f"- {s1.get('name')}: {s1.get('total_harvest_kg')} kg across "
                     f"{s1.get('total_area_hectares')} ha (yield {s1.get('yield_kg_per_hectare')} kg/ha)")
        lines.append(f"- {s2.get('name')}: {s2.get('total_harvest_kg')} kg across "
                     f"{s2.get('total_area_hectares')} ha (yield {s2.get('yield_kg_per_hectare')} kg/ha)")
        lines.append(f"- Change vs earlier: {diff.get('total_harvest_kg')} kg, "
                     f"{diff.get('total_area_hectares')} ha, {diff.get('yield_kg_per_hectare')} kg/ha yield")

    elif 'recent_advice' in question_data:
        advice = question_data['recent_advice']
        if not advice:
            lines.append("No recent agronomic advice found.")
        else:
            lines.append("Recent advice from agricultural officers:")
            for a in advice:
                cs = a.get('crop_season', {})
                lines.append(f"- {a.get('advice_date')} (from {a.get('officer')}): {a.get('advice_text')} "
                             f"— field: {cs.get('field')}, crop: {cs.get('crop_type')} ({cs.get('season')})")

    else:
        lines.append("Here is a summary of your records:")
        lines.append(json.dumps(question_data, indent=2))

    return "\n".join(lines)


# Now, the main view for the AI assistant
@csrf_exempt  # In production, we should use proper CSRF protection or token authentication
@require_http_methods(["POST"])
@require_ai_user
def ai_assistant(request):
    """
    Main endpoint for the AI assistant.
    Expects a JSON body: { "message": "user's question" }
    Returns a JSON response: { "response": "AI's answer", "context_records": [...], "response_type": "AI-generated" }
    """
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict) or not isinstance(data.get('message', ''), str):
            return JsonResponse({'error': 'Message must be text'}, status=400)
        user_message = data.get('message', '').strip()
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    if not user_message:
        return JsonResponse({'error': 'Message is required'}, status=400)
    if len(user_message) > 4000:
        return JsonResponse({'error': 'Please keep your message under 4,000 characters'}, status=400)
    
    # Check if the user is allowed to use the AI assistant (all authenticated users for now)
    # We can add role-based restrictions later if needed.
    
    # Fetch data based on the user's question
    question_data, context_records = get_data_for_question(request.user, user_message)
    
    if 'error' in question_data:
        return JsonResponse({'error': question_data['error']}, status=403)
    
    from .provider import generate_answer
    ai_response, provider_status = generate_answer(user_message, json.dumps(question_data))
    if ai_response:
        conversation = AIConversation.objects.create(
            user=get_user_profile(request.user), user_message=user_message,
            assistant_response=ai_response, response_type='ai_generated',
            context_records_used=json.dumps(context_records),
        )
        return JsonResponse({
            'response': ai_response, 'context_records': context_records,
            'response_type': 'AI-generated', 'conversation_id': conversation.id,
            'provider_status': None,
        })

    rule_based_response = format_rule_based_response(question_data)

    # Save the conversation
    conversation = AIConversation.objects.create(
        user=get_user_profile(request.user),
        user_message=user_message,
        assistant_response=rule_based_response,
        response_type='rule_based',
        context_records_used=json.dumps(context_records)
    )
    
    return JsonResponse({
        'response': rule_based_response,
        'context_records': context_records,
        'response_type': 'Rule-based fallback',
        'provider_status': provider_status,
        'conversation_id': conversation.id
    })
