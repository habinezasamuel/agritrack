from django.urls import path
from . import views

urlpatterns = [
    path('assistant/', views.ai_assistant, name='ai_assistant'),
]