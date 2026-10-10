"""Read-only checks of live attendance endpoints using an existing officer."""
import json
import os
from time import perf_counter
from urllib.request import Request, urlopen
from urllib.error import HTTPError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')
import django
django.setup()

from farm.models import UserProfile
from farm.auth_utils import generate_tokens_for_user
from django.db import connection


def verify():
    try:
        connection.ensure_connection()
        print(f'Database: {connection.vendor}; client SSL: {connection.connection.info.ssl_in_use if connection.vendor == "postgresql" else "not applicable"}')
        profile = UserProfile.objects.filter(role='officer', user__is_active=True).select_related('user').first()
        if not profile:
            print('No existing active officer account available for verification.')
            raise SystemExit(1)
        token, _ = generate_tokens_for_user(profile.user)
        meeting_with_register = None
        for endpoint, collection in (
            ('/api/attendance/meetings/?page=1&page_size=25', 'meetings'),
            ('/api/attendance/farmers-roster/?page=1&page_size=50', 'farmers'),
        ):
            started = perf_counter()
            request = Request('http://127.0.0.1:8000' + endpoint, headers={'Authorization': 'Bearer ' + token})
            with urlopen(request, timeout=30) as response:
                body = json.load(response)
                if not isinstance(body.get(collection), list):
                    raise ValueError('Unexpected response contract')
                print(f'{collection}: HTTP {response.status}; {len(body[collection])} rows on page; {perf_counter() - started:.2f}s')
                if collection == 'meetings':
                    meeting_with_register = next((meeting for meeting in body['meetings'] if meeting['has_register']), None)
        if meeting_with_register:
            started = perf_counter()
            request = Request(f"http://127.0.0.1:8000/api/attendance/meetings/{meeting_with_register['id']}/", headers={'Authorization': 'Bearer ' + token})
            with urlopen(request, timeout=30) as response:
                body = json.load(response)
                assert isinstance(body['meeting']['records'], list)
                print(f'Register details: HTTP {response.status}; {perf_counter() - started:.2f}s')
            started = perf_counter()
            request = Request(f"http://127.0.0.1:8000/api/attendance/meetings/{meeting_with_register['id']}/attendance/", headers={'Authorization': 'Bearer ' + token})
            with urlopen(request, timeout=30) as response:
                body = json.load(response)
                assert isinstance(body['records'], list)
                assert isinstance(body['statistics'], dict)
                print(f'Attendance confirmation: HTTP {response.status}; {len(body["records"])} saved records; {perf_counter() - started:.2f}s')
        print('Live read-only verification passed. No records were changed.')
    except HTTPError as error:
        print(f'Verification failed: HTTP {error.code}. Check server logs and authentication.')
        raise SystemExit(1) from None
    except Exception as error:
        print(f'Verification failed ({type(error).__name__}). Check database and backend connectivity.')
        raise SystemExit(1) from None


if __name__ == '__main__':
    verify()
