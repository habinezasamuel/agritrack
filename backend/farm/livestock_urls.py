from django.urls import path
from . import livestock_views

urlpatterns = [
    path('animals/', livestock_views.animals_list_create, name='livestock_animals_list_create'),
    path('animals/<int:pk>/', livestock_views.animal_detail, name='livestock_animal_detail'),
    path('disease-reports/', livestock_views.disease_reports_list_create, name='livestock_disease_reports'),
    path('disease-reports/<int:pk>/', livestock_views.disease_report_detail, name='livestock_disease_report_detail'),
    path('feed-shortages/', livestock_views.feed_shortages_list_create, name='livestock_feed_shortages'),
    path('feed-shortages/<int:pk>/', livestock_views.feed_shortage_detail, name='livestock_feed_shortage_detail'),
    path('health-records/', livestock_views.health_records_list_create, name='livestock_health_records'),
    path('stats/', livestock_views.livestock_stats, name='livestock_stats'),
]
