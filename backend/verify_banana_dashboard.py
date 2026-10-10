"""Read-only verification of the active database and banana summary API."""
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agritrack.settings')

import django
django.setup()

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import RequestFactory
from farm.banana_views import banana_dashboard_summary
from farm.models import UserProfile


def verify():
    try:
        connection.ensure_connection()
        print(f'Database engine: {connection.vendor}')
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            assert cursor.fetchone()[0] == 1
            if connection.vendor == 'postgresql':
                # Check the client connection: pooled Neon connections may use
                # a different transport between the pooler and PostgreSQL.
                ssl_active = connection.connection.info.ssl_in_use
                print(f'Client SSL active: {ssl_active}')
                if not ssl_active:
                    raise RuntimeError('SSL required')
        executor = MigrationExecutor(connection)
        pending = executor.migration_plan(executor.loader.graph.leaf_nodes())
        print(f'Pending migrations: {len(pending)}')
        for role in ('farmer', 'officer', 'admin'):
            profile = UserProfile.objects.filter(role=role).select_related('user').first()
            if not profile:
                print(f'{role} summary: no account available for verification')
                continue
            request = RequestFactory().get('/api/banana/dashboard-summary/')
            request.user = profile.user
            response = banana_dashboard_summary(request)
            print(f'{role} summary HTTP status: {response.status_code}')
            if response.status_code != 200:
                raise RuntimeError
        print('Read-only verification passed. No records were changed.')
    except Exception as exc:
        # Connection errors may include sensitive configuration; omit their text.
        print(f'Verification failed ({type(exc).__name__}). Check backend configuration and connectivity.')
        raise SystemExit(1) from None


if __name__ == '__main__':
    verify()
