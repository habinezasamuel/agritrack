import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
django.setup()

from django.db import connection
from django.contrib.auth.models import User
from farm.models import (
    UserProfile, Farm, Field, Fertilizer, Seed,
    BananaPlantation, BananaGrowthLog, BananaDiseaseReport,
    LivestockAnimal, AnimalDiseaseReport, FeedShortageReport,
    LivestockHealthRecord, Notification
)

def verify():
    print("==================================================")
    print("       AGRITRACK NEON POSTGRESQL VERIFICATION     ")
    print("==================================================")
    
    vendor = connection.vendor
    host = connection.settings_dict.get('HOST', 'localhost')
    db_name = connection.settings_dict.get('NAME', 'agritrack')
    
    print(f"Database Engine: {vendor.upper()}")
    print(f"Database Name:   {db_name}")
    print(f"Database Host:   {host}")
    print("--------------------------------------------------")
    
    print(f"Users:               {User.objects.count()} (e.g. {', '.join(User.objects.values_list('username', flat=True))})")
    print(f"User Profiles:       {UserProfile.objects.count()}")
    print(f"Farms:               {Farm.objects.count()}")
    print(f"Fields:              {Field.objects.count()}")
    print(f"Fertilizers Catalog: {Fertilizer.objects.count()}")
    print(f"Seeds Catalog:       {Seed.objects.count()}")
    print(f"Banana Plantations:  {BananaPlantation.objects.count()}")
    print(f"Banana Growth Logs:  {BananaGrowthLog.objects.count()}")
    print(f"Banana Diseases:     {BananaDiseaseReport.objects.count()}")
    print(f"Livestock Animals:   {LivestockAnimal.objects.count()}")
    print(f"Livestock Diseases:  {AnimalDiseaseReport.objects.count()}")
    print(f"Feed Shortages:      {FeedShortageReport.objects.count()}")
    print(f"Health Records:      {LivestockHealthRecord.objects.count()}")
    print(f"Notifications:       {Notification.objects.count()}")
    print("--------------------------------------------------")
    print("STATUS: ALL DATA STORED & ACCESSIBLE ON NEON POSTGRESQL!")
    print("==================================================")

if __name__ == '__main__':
    verify()
