from django.http import JsonResponse
from django.db import DatabaseError
from .auth_utils import get_authenticated_user

class BearerTokenAuthMiddleware:
    """
    Middleware that populates request.user from Bearer token,
    X-AgriTrack headers, or dev fallbacks for API requests.
    Also ensures API endpoints (starting with /api/, /auth/, /livestock/, /banana/, /farm/, /ai/)
    receive JSON 401 instead of redirecting to an HTML login page.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            if not getattr(request, 'user', None) or not request.user.is_authenticated:
                user = get_authenticated_user(request)
                if user:
                    request.user = user
        except DatabaseError:
            if request.path.startswith(('/api/', '/auth/', '/livestock/', '/banana/', '/farm/', '/ai/')):
                return JsonResponse({
                    'message': 'The database connection is temporarily unavailable. If you were saving a record, check whether it was saved before retrying.',
                    'code': 'database_unavailable',
                }, status=503)
            raise

        response = self.get_response(request)

        # If an API request was redirected to accounts/login by @login_required, return JSON 401
        if response.status_code == 302:
            location = response.get('Location', '')
            if 'login' in location:
                path = request.path_info
                if any(path.startswith(prefix) for prefix in ['/api/', '/auth/', '/livestock/', '/banana/', '/farm/', '/ai/']):
                    return JsonResponse({'message': 'Authentication required', 'error': 'Not authenticated'}, status=401)

        return response
