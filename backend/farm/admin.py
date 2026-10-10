from django.contrib import admin
from .models import (
    UserProfile, Farm, Field, Season, CropSeason, Activity, Task, HarvestRecord,
    InputRequest, Order, Payment, Fertilizer, Seed, AgriculturalInputApplication,
    InputPayment, InputReceipt, GrowthObservation, AgriculturalOfficerAdvice,
    ExternalAgriculturalSource, Notification, PaymentAuditLog,
    LivestockAnimal, AnimalDiseaseReport, FeedShortageReport, LivestockHealthRecord,
    BananaPlantation, BananaGrowthLog, BananaDiseaseReport, BananaWeatherReport,
    BananaAssistanceRequest, BananaOfficerAdvice,
)

admin.site.register(UserProfile)
admin.site.register(Farm)
admin.site.register(Field)
admin.site.register(Season)
admin.site.register(CropSeason)
admin.site.register(Activity)
admin.site.register(Task)
admin.site.register(HarvestRecord)
admin.site.register(InputRequest)
admin.site.register(Order)
admin.site.register(Payment)
admin.site.register(Fertilizer)
admin.site.register(Seed)
admin.site.register(AgriculturalInputApplication)
admin.site.register(InputPayment)
admin.site.register(InputReceipt)
admin.site.register(GrowthObservation)
admin.site.register(AgriculturalOfficerAdvice)
admin.site.register(ExternalAgriculturalSource)
admin.site.register(Notification)
admin.site.register(PaymentAuditLog)
admin.site.register(LivestockAnimal)
admin.site.register(AnimalDiseaseReport)
admin.site.register(FeedShortageReport)
admin.site.register(LivestockHealthRecord)
admin.site.register(BananaPlantation)
admin.site.register(BananaGrowthLog)
admin.site.register(BananaDiseaseReport)
admin.site.register(BananaWeatherReport)
admin.site.register(BananaAssistanceRequest)
admin.site.register(BananaOfficerAdvice)