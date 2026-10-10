from django.contrib.auth.models import User
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
from .models import UserProfile

signer = TimestampSigner(salt='agritrack-auth-token')

def generate_tokens_for_user(user):
    """Generate signed access and refresh tokens for a user."""
    access_token = signer.sign(f"{user.id}:{user.username}")
    refresh_token = signer.sign(f"{user.id}:{user.username}:refresh")
    return access_token, refresh_token

def get_user_from_token(token_str):
    """Validate a token and return the User instance, or None if invalid."""
    if not token_str:
        return None
    try:
        # 14 days expiration for simplicity and resilience
        value = signer.unsign(token_str, max_age=14 * 86400)
        user_id = int(value.split(':')[0])
        return User.objects.filter(id=user_id, is_active=True).first()
    except (BadSignature, SignatureExpired, ValueError, IndexError):
        return None

def get_authenticated_user(request):
    """
    Extract user from session, Bearer Authorization header, or dev headers.
    """
    if request.user and request.user.is_authenticated:
        return request.user

    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        user = get_user_from_token(token)
        if user:
            return user

    # Development fallback
    if settings.DEBUG:
        username = request.headers.get('X-AgriTrack-Username', '').strip()
        if username:
            user = User.objects.filter(username=username, is_active=True).first()
            if user:
                return user
            # Fallback to demo farmer
            return User.objects.filter(username='farmer', is_active=True).first()

    return None

def user_to_dict(user):
    """Serialize user into frontend-compatible format."""
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'farmer'})
    role_map = {
        'admin': 'ADMIN',
        'officer': 'OFFICER',
        'farmer': 'FARMER',
    }
    frontend_role = role_map.get(profile.role.lower(), 'FARMER')

    return {
        'id': str(user.id),
        'username': user.username,
        'email': user.email or f"{user.username}@agritrack.rw",
        'firstName': user.first_name or user.username.capitalize(),
        'lastName': user.last_name or '',
        'role': frontend_role,
        'phoneNumber': profile.phone_number or '',
        'location': profile.location or '',
        'isActive': user.is_active,
        'createdAt': user.date_joined.isoformat() if user.date_joined else '',
        'updatedAt': user.date_joined.isoformat() if user.date_joined else '',
    }
