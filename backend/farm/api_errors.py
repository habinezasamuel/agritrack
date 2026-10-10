"""Keep API failures useful and avoid exposing database configuration."""
from django.core.exceptions import ValidationError
from django.db import DatabaseError, IntegrityError
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class ApiErrorMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        if not request.path.startswith(('/api/', '/auth/', '/farm/', '/banana/', '/livestock/', '/ai/')):
            return None
        if isinstance(exception, ValidationError):
            details = exception.message_dict if hasattr(exception, 'message_dict') else {'form': exception.messages}
            return JsonResponse({'message': 'Please correct the submitted information.', 'details': details}, status=400)
        if isinstance(exception, IntegrityError):
            return JsonResponse({'message': 'This record conflicts with existing information. Refresh your records and check the submitted details.'}, status=409)
        if isinstance(exception, DatabaseError):
            return JsonResponse({
                'message': 'The database connection is temporarily unavailable. If you were saving a record, check whether it was saved before retrying.',
                'code': 'database_unavailable',
            }, status=503)
        return None
