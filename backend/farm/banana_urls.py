from django.urls import path
from . import banana_views

urlpatterns = [
    path('plantations/', banana_views.plantations_list_create, name='banana_plantations_list_create'),
    path('plantations/<str:pk>/', banana_views.plantation_detail, name='banana_plantation_detail'),
    path('growth-records/', banana_views.growth_records_list_create, name='banana_growth_records'),
    path('disease-reports/', banana_views.disease_reports_list_create, name='banana_disease_reports'),
    path('weather-reports/', banana_views.weather_reports_list_create, name='banana_weather_reports'),
    path('assistance-requests/', banana_views.assistance_requests_list_create, name='banana_assistance_requests'),
    path('assistance-requests/<str:pk>/advice/', banana_views.add_officer_advice, name='banana_add_officer_advice'),
    path('assistance-requests/<str:pk>/status/', banana_views.update_assistance_status, name='banana_update_assistance_status'),
    path('dashboard-summary/', banana_views.banana_dashboard_summary, name='banana_dashboard_summary'),
]
