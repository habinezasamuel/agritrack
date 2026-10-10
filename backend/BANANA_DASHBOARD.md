# Banana dashboard

The existing backend reads `DATABASE_URL` from `backend/.env`. PostgreSQL
connections require SSL. Keep credentials in that file; never copy them into
frontend configuration.

Statistics use each user's authorized records. Farmers see their own records,
officers see fields with requests assigned to them, and administrators see all
banana records. Unknown roles receive no records.

Healthy and affected mat counts use the latest observation for each field,
ordered by monitoring date, creation time, then ID. The health percentage uses
observed mats, not planted mats. No observations means no percentage.
Weather events cover all recorded dates. Pending requests include only PENDING;
resolved requests include only RESOLVED. Closed disease reports are inactive.

Run from the project root in PowerShell:

```powershell
# Read-only database, SSL, migration, and summary checks
.\.venv\Scripts\python.exe backend/verify_banana_dashboard.py

# Tests use an isolated SQLite database and never create a Neon test database
.\.venv\Scripts\python.exe backend/manage.py test farm.test_banana_dashboard --settings=agritrack.test_settings

# Check schema changes; these dashboard fixes require no new migrations
.\.venv\Scripts\python.exe backend/manage.py makemigrations --check --dry-run

# Apply reviewed pending migrations if needed
.\.venv\Scripts\python.exe backend/manage.py migrate

# Start backend
.\.venv\Scripts\python.exe backend/manage.py runserver

# Start frontend in another terminal
npm.cmd run dev

# Build frontend
npm.cmd run build
```

The verification script invokes the summary view with existing accounts and
performs no writes. It does not verify browser behavior or the token-login flow.

## Dashboard loading

The page now requests `/api/banana/dashboard-summary/?include_records=1` once
instead of starting six separate list requests. Existing summary-only and list
endpoints remain compatible. Concurrent dashboard requests share the same
in-flight promise; responses are not cached as farm data.

The combined read has a bounded 30-second timeout to accommodate Neon connection
startup and the current database latency. Errors show the API's actual message,
and a failed refresh keeps previously loaded statistics with a visible warning.

Legacy base64 photos remain stored unchanged. List queries defer the photo field
and return authorized image URLs. Photos load lazily through
`/api/banana/photos/<kind>/<id>/` and enforce the same record ownership rules.
Related plantation photo columns are also excluded from monitoring, disease,
weather, and assistance list queries. This prevents database image transfers
from blocking record loading.

Dashboard aggregates combine related counts into fewer queries. Disease advice
uses prefetched relationships instead of querying separately for each report.

Additional checks:

```powershell
# Read-only live authenticated HTTP check; prints timing and response size
.\.venv\Scripts\python.exe backend/verify_banana_loading.py

# Optional read-only query timing (no record values printed)
.\.venv\Scripts\python.exe backend/verify_banana_loading.py --direct
```

The live check returned HTTP 200 with all sections in 21.48 seconds and 7,763
response bytes. Database latency is still noticeable; the dashboard no longer
downloads embedded photos while loading records.
