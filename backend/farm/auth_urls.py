from django.urls import path
from . import auth_views

urlpatterns = [
    path('login', auth_views.auth_login, name='auth_login'),
    path('login/', auth_views.auth_login, name='auth_login_slash'),
    path('register', auth_views.auth_register, name='auth_register'),
    path('register/', auth_views.auth_register, name='auth_register_slash'),
    path('me', auth_views.auth_me, name='auth_me'),
    path('me/', auth_views.auth_me, name='auth_me_slash'),
    path('refresh', auth_views.auth_refresh, name='auth_refresh'),
    path('refresh/', auth_views.auth_refresh, name='auth_refresh_slash'),
    path('logout', auth_views.auth_logout, name='auth_logout'),
    path('logout/', auth_views.auth_logout, name='auth_logout_slash'),
]
