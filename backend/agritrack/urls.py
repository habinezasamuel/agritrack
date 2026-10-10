"""
URL configuration for agritrack project.
"""
from django.contrib import admin
from django.urls import path, include
from .views import backend_home

urlpatterns = [
    path('', backend_home, name='backend_home'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('farm.auth_urls')),
    path('auth/', include('farm.auth_urls')),
    path('api/livestock/', include('farm.livestock_urls')),
    path('livestock/', include('farm.livestock_urls')),
    path('api/banana/', include('farm.banana_urls')),
    path('banana/', include('farm.banana_urls')),
    path('api/attendance/', include('farm.attendance_urls')),
    path('attendance/', include('farm.attendance_urls')),
    path('api/farm/', include('farm.urls')),
    path('farm/', include('farm.urls')),
    path('api/', include('farm.urls')),
    path('api/', include('farm.attendance_urls')),
    path('ai/', include('ai_assistant.urls')),
    path('api/ai/', include('ai_assistant.urls')),
]
