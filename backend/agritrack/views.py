from django.conf import settings
from django.shortcuts import render
from django.views.decorators.http import require_GET


@require_GET
def backend_home(request):
    return render(request, 'farm/backend_home.html', {
        'frontend_url': settings.FRONTEND_URL.rstrip('/'),
        'show_dev_commands': settings.DEBUG,
    })
