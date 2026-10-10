"""Read-only live check of the banana dashboard's combined loading request."""
import json
import os
import sys
from time import perf_counter
from urllib.request import Request, urlopen

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
import django
django.setup()

from farm.models import UserProfile
from farm.auth_utils import generate_tokens_for_user
from django.db import connection, transaction
from django.test import RequestFactory
from farm.banana_views import banana_dashboard_summary


def verify():
    try:
        profile = UserProfile.objects.filter(role='farmer', user__is_active=True).select_related('user').first()
        if not profile:
            raise RuntimeError('No existing farmer account')
        if '--direct' in sys.argv:
            request = RequestFactory().get('/api/banana/dashboard-summary/?include_records=1')
            request.user = profile.user
            count = 0
            def timed_query(execute, sql, params, many, context):
                nonlocal count
                count += 1
                tables = ('bananaplantation', 'bananagrowthlog', 'bananadiseasereport', 'bananaweatherreport', 'bananaassistancerequest', 'bananaofficeradvice', 'userprofile')
                label = next((table for table in tables if '"farm_' + table + '"' in sql), 'related records')
                print(f'Starting query {count} ({label})', flush=True)
                started = perf_counter()
                result = execute(sql, params, many, context)
                print(f'Database query {count}: {perf_counter() - started:.2f}s', flush=True)
                return result
            started = perf_counter()
            with transaction.atomic():
                if connection.vendor == 'postgresql':
                    with connection.cursor() as cursor:
                        cursor.execute('SET LOCAL statement_timeout = 10000')
                with connection.execute_wrapper(timed_query):
                    response = banana_dashboard_summary(request)
            print(f'Direct dashboard: HTTP {response.status_code}; {perf_counter() - started:.2f}s; {len(response.content)} bytes.', flush=True)
            return
        token, _ = generate_tokens_for_user(profile.user)
        request = Request('http://127.0.0.1:8000/api/banana/dashboard-summary/?include_records=1', headers={'Authorization': 'Bearer ' + token})
        started = perf_counter()
        with urlopen(request, timeout=30) as response:
            payload = response.read()
            data = json.loads(payload)
            for key in ('plantations', 'growthRecords', 'diseaseReports', 'weatherReports', 'assistanceRequests'):
                assert isinstance(data[key], list)
            assert isinstance(data['summary'], dict)
            print(f'Combined dashboard: HTTP {response.status}; {perf_counter() - started:.2f}s; {len(payload)} response bytes.')
        print('All six dashboard sections loaded in one request. No records changed.')
    except Exception as error:
        print(f'Verification failed ({type(error).__name__}); check the backend and database connectivity.')
        raise SystemExit(1) from None


if __name__ == '__main__':
    verify()
