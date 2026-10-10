import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
django.setup()

from django.contrib.auth.models import User
from farm.models import UserProfile

print("Updating & seeding registered farmers for attendance management...", flush=True)

farmers_data = [
    {
        'username': 'farmer',
        'email': 'farmer@agritrack.rw',
        'first_name': 'Emmanuel',
        'last_name': 'Hakizimana',
        'phone_number': '+250788123456',
        'registration_id': 'RWA-2026-FARM-001',
        'district': 'Ruhango',
        'sector': 'Kinazi',
        'cell': 'Burunga',
        'village': 'Gitisi',
    },
    {
        'username': 'paul_mukamana',
        'email': 'paul.m@agritrack.rw',
        'first_name': 'Paul',
        'last_name': 'Mukamana',
        'phone_number': '+250788234567',
        'registration_id': 'RWA-2026-FARM-002',
        'district': 'Ruhango',
        'sector': 'Kinazi',
        'cell': 'Rutabo',
        'village': 'Kavumu',
    },
    {
        'username': 'marie_uwimana',
        'email': 'marie.u@agritrack.rw',
        'first_name': 'Marie',
        'last_name': 'Uwimana',
        'phone_number': '+250788345678',
        'registration_id': 'RWA-2026-FARM-003',
        'district': 'Ruhango',
        'sector': 'Kinazi',
        'cell': 'Burunga',
        'village': 'Nyagatovu',
    },
    {
        'username': 'alphonse_kayitare',
        'email': 'alphonse.k@agritrack.rw',
        'first_name': 'Alphonse',
        'last_name': 'Kayitare',
        'phone_number': '+250788456789',
        'registration_id': 'RWA-2026-FARM-004',
        'district': 'Ruhango',
        'sector': 'Byimana',
        'cell': 'Mpanda',
        'village': 'Rwinyana',
    },
    {
        'username': 'claudine_mukakarisa',
        'email': 'claudine.m@agritrack.rw',
        'first_name': 'Claudine',
        'last_name': 'Mukakarisa',
        'phone_number': '+250788567890',
        'registration_id': 'RWA-2026-FARM-005',
        'district': 'Ruhango',
        'sector': 'Kinazi',
        'cell': 'Rutabo',
        'village': 'Gisiza',
    },
    {
        'username': 'eric_habimana',
        'email': 'eric.h@agritrack.rw',
        'first_name': 'Eric',
        'last_name': 'Habimana',
        'phone_number': '+250788678901',
        'registration_id': 'RWA-2026-FARM-006',
        'district': 'Ruhango',
        'sector': 'Byimana',
        'cell': 'Muhororo',
        'village': 'Kareba',
    },
    {
        'username': 'solange_nyirahabimana',
        'email': 'solange.n@agritrack.rw',
        'first_name': 'Solange',
        'last_name': 'Nyirahabimana',
        'phone_number': '+250788789012',
        'registration_id': 'RWA-2026-FARM-007',
        'district': 'Ruhango',
        'sector': 'Kinazi',
        'cell': 'Burunga',
        'village': 'Gitisi',
    },
    {
        'username': 'jean_bizimana',
        'email': 'jean.b@agritrack.rw',
        'first_name': 'Jean Claude',
        'last_name': 'Bizimana',
        'phone_number': '+250788890123',
        'registration_id': 'RWA-2026-FARM-008',
        'district': 'Ruhango',
        'sector': 'Byimana',
        'cell': 'Mpanda',
        'village': 'Murambi',
    },
]

for fd in farmers_data:
    user, _ = User.objects.get_or_create(username=fd['username'], defaults={
        'email': fd['email'],
        'first_name': fd['first_name'],
        'last_name': fd['last_name'],
    })
    user.first_name = fd['first_name']
    user.last_name = fd['last_name']
    user.email = fd['email']
    user.set_password('farmer123')
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'farmer'})
    profile.role = 'farmer'
    profile.phone_number = fd['phone_number']
    profile.registration_id = fd['registration_id']
    profile.district = fd['district']
    profile.sector = fd['sector']
    profile.cell = fd['cell']
    profile.village = fd['village']
    profile.location = f"{fd['district']}, {fd['sector']}, {fd['cell']}"
    profile.save()
    print(f"Farmer ready: {fd['first_name']} {fd['last_name']} ({fd['registration_id']}) in {fd['village']}, {fd['cell']}", flush=True)

# Update Officer profile
officer_user = User.objects.filter(username='officer').first()
if officer_user:
    officer_profile, _ = UserProfile.objects.get_or_create(user=officer_user, defaults={'role': 'officer'})
    officer_profile.district = 'Ruhango'
    officer_profile.sector = 'Kinazi'
    officer_profile.save()
    print("Officer profile location updated.", flush=True)

print("All registered farmers seeded in Neon PostgreSQL!", flush=True)
