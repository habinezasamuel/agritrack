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
