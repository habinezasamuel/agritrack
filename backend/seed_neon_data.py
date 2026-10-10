import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
django.setup()

from datetime import date, timedelta
from django.contrib.auth.models import User
from django.utils import timezone
from farm.models import (
    UserProfile, Farm, Field, Season, CropSeason, Activity, Task, HarvestRecord,
    Fertilizer, Seed, AgriculturalInputApplication, InputPayment, InputReceipt,
    Notification, BananaPlantation, BananaGrowthLog, BananaDiseaseReport,
    BananaWeatherReport, BananaAssistanceRequest, BananaOfficerAdvice,
    LivestockAnimal, AnimalDiseaseReport, FeedShortageReport, LivestockHealthRecord
)

print("Starting Neon database seeding...", flush=True)

# 1. Users & Profiles
users_data = [
    ('admin', 'admin@agritrack.rw', 'admin123', 'admin', 'Alex', 'Kagabo', '+250788100001', 'Kigali HQ', True),
    ('farmer', 'farmer@agritrack.rw', 'farmer123', 'farmer', 'Emmanuel', 'Hakizimana', '+250788123456', 'Ruhango District', False),
    ('officer', 'officer@agritrack.rw', 'officer123', 'officer', 'Dr. Jeanne', 'Mukamana', '+250788987654', 'Southern Province', False),
]

user_objs = {}
for username, email, pwd, role, fname, lname, phone, loc, is_super in users_data:
    u, created = User.objects.get_or_create(username=username, defaults={
        'email': email,
        'first_name': fname,
        'last_name': lname,
        'is_staff': is_super,
        'is_superuser': is_super,
    })
    u.set_password(pwd)
    u.first_name = fname
    u.last_name = lname
    u.email = email
    u.is_staff = is_super
    u.is_superuser = is_super
    u.save()

    p, _ = UserProfile.objects.get_or_create(user=u, defaults={'role': role, 'phone_number': phone, 'location': loc})
    p.role = role
    p.phone_number = phone
    p.location = loc
    p.save()
    user_objs[username] = (u, p)
    print(f"User '{username}' ready with role '{role}'", flush=True)

farmer_profile = user_objs['farmer'][1]
officer_profile = user_objs['officer'][1]
admin_profile = user_objs['admin'][1]

# 2. Farm & Fields
farm, _ = Farm.objects.get_or_create(
    farmer=farmer_profile,
    name='Ruhango Green Highland Farm',
    defaults={'size_hectares': 5.5, 'location': 'Ruhango District, Southern Province'}
)

field_a, _ = Field.objects.get_or_create(
    farm=farm,
    name='Block A - East Slope Field',
    defaults={'size_hectares': 2.5, 'crop_type': 'Banana', 'variety': 'FHIA-17'}
)

field_b, _ = Field.objects.get_or_create(
    farm=farm,
    name='Block B - Valley Plantain Field',
    defaults={'size_hectares': 1.8, 'crop_type': 'Plantain', 'variety': 'Agatoki'}
)

field_c, _ = Field.objects.get_or_create(
    farm=farm,
    name='Block C - Highland Maize & Legumes',
    defaults={'size_hectares': 1.2, 'crop_type': 'Maize', 'variety': 'Hybrid H628'}
)
print("Farms and fields ready.", flush=True)

# 3. Seasons & Crop Seasons
season, _ = Season.objects.get_or_create(
    name='Season 2026A',
    year=2026,
    defaults={'start_month': 9, 'end_month': 2}
)

crop_season, _ = CropSeason.objects.get_or_create(
    field=field_c,
    season=season,
    defaults={
        'planting_date': date(2025, 9, 25),
        'expected_harvest_date': date(2026, 2, 15),
        'status': 'active'
    }
)

Activity.objects.get_or_create(
    crop_season=crop_season,
    activity_type='land_preparation',
    date_performed=date(2025, 9, 15),
    defaults={'description': 'Tillage and deep ridging with organic manure incorporation', 'cost': 35000.00}
)

Activity.objects.get_or_create(
    crop_season=crop_season,
    activity_type='fertilizer_application',
    date_performed=date(2025, 10, 10),
    defaults={'description': 'Basal dressing with NPK 17-17-17 at 50kg per hectare', 'cost': 45000.00}
)

Task.objects.get_or_create(
    crop_season=crop_season,
    title='Second Top-Dressing Weeding',
    due_date=date.today() + timedelta(days=5),
    defaults={'description': 'Targeted hand weeding along crop lines followed by earthing up', 'priority': 'high', 'completed': False}
)

# 4. Input Catalog: Fertilizers and Seeds
fertilizers_data = [
    ('NPK 17-17-17 Balanced Granular', 'Universal basal fertilizer for balanced vegetative and root vigor', ['Maize', 'Banana', 'Beans', 'Coffee'], 'KG', 950.00, 1200.0, 'Inorganic Compound'),
    ('Urea (46% Nitrogen)', 'High nitrogen top dressing fertilizer for lush vegetative acceleration', ['Maize', 'Rice', 'Vegetables'], 'KG', 850.00, 800.0, 'Nitrogenous'),
    ('DAP (Di-Ammonium Phosphate)', 'Phosphorus-rich fertilizer for robust root development at sowing', ['Maize', 'Wheat', 'Beans'], 'KG', 1100.00, 650.0, 'Phosphatic'),
    ('Agricultural Lime (Dolomite)', 'Soil conditioner for correcting acidity in volcanic highlands', ['Maize', 'Banana', 'Legumes'], 'KG', 300.00, 3000.0, 'Soil Ameliorant'),
]

for name, desc, crops, unit, price, qty, ftype in fertilizers_data:
    Fertilizer.objects.get_or_create(
        name=name,
        defaults={
            'description': desc,
            'supported_crops': crops,
            'unit': unit,
            'price_per_unit': price,
            'available_quantity': qty,
            'fertilizer_type': ftype,
            'is_active': True,
        }
    )

seeds_data = [
    ('Hybrid Maize Seed H628', 'Drought-tolerant high-yielding certified hybrid maize seed', 'Maize', 'H628 Hybrid', ['Maize'], 'KG', 1800.00, 450.0),
    ('Certified Climbing Beans CAB2', 'High iron and zinc climbing beans with anthracnose resistance', 'Beans', 'CAB2', ['Beans'], 'KG', 1400.00, 600.0),
    ('Soybean Seed SB 24', 'Early maturing soybean with high nodulation capacity', 'Soybean', 'SB 24', ['Soybean'], 'KG', 1250.00, 350.0),
]

for name, desc, crop, var, crops, unit, price, qty in seeds_data:
    Seed.objects.get_or_create(
        name=name,
        defaults={
            'description': desc,
            'crop': crop,
            'variety': var,
            'supported_crops': crops,
            'unit': unit,
            'price_per_unit': price,
            'available_quantity': qty,
            'is_active': True,
        }
    )
print("Catalog fertilizers and seeds ready.", flush=True)

# 5. Banana Plantations & Management
plant_1, _ = BananaPlantation.objects.get_or_create(
    farmer=farmer_profile,
    farm=farm,
    name='Block A - East Slope Plantation',
    defaults={
        'field': field_a,
        'land_size_hectares': 2.5,
        'planting_date': date(2023, 10, 15),
        'variety': 'FHIA-17',
        'total_plants_planted': 2200,
        'current_healthy_plants': 2165,
        'current_affected_plants': 35,
        'spacing': '3m x 3m',
        'status': 'FLOWERING_SHOOTING',
        'notes': 'Dual-purpose high-yielding dessert/cooking banana. Mulched with Napier grass.',
    }
)

plant_2, _ = BananaPlantation.objects.get_or_create(
    farmer=farmer_profile,
    farm=farm,
    name='Block B - Valley Plantain Field',
    defaults={
        'field': field_b,
        'land_size_hectares': 1.8,
        'planting_date': date(2024, 1, 20),
        'variety': 'Plantain (Agatoki)',
        'total_plants_planted': 1600,
        'current_healthy_plants': 1570,
        'current_affected_plants': 30,
        'spacing': '3m x 3m',
        'status': 'VEGETATIVE',
        'notes': 'Traditional cooking plantain intercropped with nitrogen-fixing cover legumes.',
    }
)

BananaGrowthLog.objects.get_or_create(
    plantation=plant_1,
    date=date(2024, 4, 20),
    stage='SHOOTING',
    defaults={
        'recorded_by': farmer_profile,
        'average_height_meters': 3.4,
        'pseudostem_girth_cm': 58,
        'healthy_plants': 2165,
        'damaged_plants': 35,
        'canopy_condition': 'EXCELLENT',
        'general_observations': 'Vigorous maroon flower heart emergence across 75% of mats.',
    }
)

b_disease, _ = BananaDiseaseReport.objects.get_or_create(
    plantation=plant_1,
    farmer=farmer_profile,
    problem_type='BANANA_BACTERIAL_WILT',
    defaults={
        'report_date': date(2024, 4, 14),
        'description': 'Isolated yellowing of middle leaves and early bunch rot on 12 mats in northeast quadrant.',
        'affected_plants_count': 12,
        'severity': 'HIGH',
        'status': 'IN_PROGRESS',
        'location_details': 'Ruhango East Block A, GPS: -2.2154, 29.7841',
        'request_assistance': True,
    }
)

b_assist, _ = BananaAssistanceRequest.objects.get_or_create(
    farmer=farmer_profile,
    plantation=plant_1,
    disease_report=b_disease,
    defaults={
        'assigned_officer': officer_profile,
        'subject': 'Suspected Bacterial Wilt on Block A',
        'category': 'DISEASE_OUTBREAK',
        'description': 'Urgent advice requested regarding Xanthomonas wilt containment protocol.',
        'urgency': 'URGENT',
        'status': 'IN_PROGRESS',
    }
)

BananaOfficerAdvice.objects.get_or_create(
    request=b_assist,
    officer=officer_profile,
    defaults={
        'diagnosis': 'Confirmed early Xanthomonas vasicola pv. musacearum (BXW). Prompt containment required.',
        'recommendations': '1. Cut affected plants at ground level and bury on-site. 2. Debud using wooden forked sticks. 3. Disinfect blades in 20% sodium hypochlorite bleach.',
        'recommended_products': 'Jik Bleach Disinfectant, Forked Debudding Tool',
        'action_taken': 'Extension officer visited farm on April 16th, marked quarantine tape, provided demonstration.',
        'follow_up_date': date(2024, 5, 10),
        'status_update': 'IN_PROGRESS',
    }
)

BananaWeatherReport.objects.get_or_create(
    plantation=plant_1,
    farmer=farmer_profile,
    date=date(2024, 4, 10),
    weather_type='HEAVY_RAIN',
    defaults={
        'description': 'Intense seasonal rainfall with surface runoff. Swales captured excess water effectively.',
        'damage_level': 'MILD',
        'affected_plants_estimate': 5,
        'request_assistance': False,
    }
)
print("Banana records ready.", flush=True)

# 6. Livestock Management
cow_1, _ = LivestockAnimal.objects.get_or_create(
    farmer=farmer_profile,
    tag_id='INY-001',
    defaults={
        'farm': farm,
        'animal_type': 'cow',
        'breed': 'Holstein Friesian Cross',
        'quantity': 1,
        'dob_or_age': '3.5 years',
        'gender': 'female',
        'health_status': 'HEALTHY',
        'registration_date': date(2023, 6, 1),
        'location': 'Ruhango District Barn #1',
        'notes': 'High producing dairy cow, average 18 liters/day. Vaccinated against Anthrax and BQ.',
    }
)

cow_2, _ = LivestockAnimal.objects.get_or_create(
    farmer=farmer_profile,
    tag_id='RUK-002',
    defaults={
        'farm': farm,
        'animal_type': 'cow',
        'breed': 'Ankole Indigenous',
        'quantity': 1,
        'dob_or_age': '4 years',
        'gender': 'female',
        'health_status': 'HEALTHY',
        'registration_date': date(2023, 8, 15),
        'location': 'Ruhango District Paddock #2',
        'notes': 'Hardy indigenous breed with high tick resistance.',
    }
)

goat_flock, _ = LivestockAnimal.objects.get_or_create(
    farmer=farmer_profile,
    tag_id='GAS-GOAT-FLOCK',
    defaults={
        'farm': farm,
        'animal_type': 'goat',
        'breed': 'Boer Crossbreed',
        'quantity': 14,
        'dob_or_age': '1 - 2 years',
        'gender': 'group',
        'health_status': 'HEALTHY',
        'registration_date': date(2024, 2, 10),
        'location': 'Ruhango Pasture Ridge',
        'notes': 'Meat goat flock rotationally grazed with mineral block supplements.',
    }
)

AnimalDiseaseReport.objects.get_or_create(
    report_number='ADR-20240412-101',
    defaults={
        'farmer': farmer_profile,
        'animal': cow_1,
        'assigned_officer': officer_profile,
        'animal_type': 'Cow',
        'animal_tag_id': 'INY-001',
        'symptoms': 'Swollen left-quarter udder, slight temperature elevation, clot in foremilk.',
        'problem_start_date': date(2024, 4, 11),
        'number_affected': 1,
        'description': 'Early signs of clinical mastitis detected during morning milking.',
        'location': 'Ruhango District Barn #1',
        'urgency_level': 'MEDIUM',
        'status': 'ASSISTANCE_PROVIDED',
        'veterinary_recommendation': 'Administer intramammary antibiotic tube for 3 days; milk affected quarter last.',
        'recommend_farm_visit': True,
        'farm_visit_date': date(2024, 4, 13),
    }
)

FeedShortageReport.objects.get_or_create(
    report_number='FSR-20240320-202',
    defaults={
        'farmer': farmer_profile,
        'assigned_officer': officer_profile,
        'animal_type': 'Cow & Goat',
        'number_affected': 16,
        'feed_type_needed': 'Silage / Brachiaria Hay bales',
        'description': 'Dry spell reduced fresh pasture regrowth; require supplementary roughage for 3 weeks.',
        'estimated_quantity_required': '500 kg',
        'shortage_start_date': date(2024, 3, 18),
        'location': 'Ruhango District Green Farm',
        'urgency_level': 'MEDIUM',
        'status': 'ASSISTANCE_COORDINATED',
        'officer_notes': 'Coordinated with Southern District Fodder Bank for 15 bales of conserved hay delivery.',
    }
)

LivestockHealthRecord.objects.get_or_create(
    animal=cow_1,
    title='Foot-and-Mouth (FMD) Annual Booster',
    defaults={
        'farmer': farmer_profile,
        'record_type': 'VACCINATION',
        'date': date(2024, 1, 15),
        'details': 'Annual prophylactic vaccination administered sub-cutaneously by veterinary officer.',
        'veterinarian_name': 'Dr. Jeanne Mukamana',
        'prescribed_medicine': 'FMD Polyvalent Vaccine',
        'cost_rwf': 8000.00,
        'next_due_date': date(2025, 1, 15),
        'reminder_active': True,
    }
)

LivestockHealthRecord.objects.get_or_create(
    animal=cow_1,
    title='Broad-Spectrum Deworming',
    defaults={
        'farmer': farmer_profile,
        'record_type': 'TREATMENT',
        'date': date(2024, 3, 10),
        'details': 'Oral drenching with Albendazole 10% for internal parasites and liver fluke.',
        'veterinarian_name': 'Dr. Jeanne Mukamana',
        'prescribed_medicine': 'Albendazole 10% Drench',
        'quantity': 50.0,
        'unit': 'ml',
        'cost_rwf': 3500.00,
        'next_due_date': date(2024, 9, 10),
        'reminder_active': True,
    }
)
print("Livestock records ready.", flush=True)

# 7. Sample Notification
Notification.objects.get_or_create(
    recipient=farmer_profile,
    title='Agricultural Officer Assigned',
    defaults={
        'message': 'Dr. Jeanne Mukamana has reviewed your Banana Wilt inquiry and provided a containment protocol.',
        'notification_type': 'success',
        'related_entity_type': 'BANANA_FARMING',
        'related_entity_id': str(plant_1.id),
        'is_read': False,
    }
)

print("Neon database seeded successfully! All tables populated.", flush=True)
