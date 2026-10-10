# Loading and database submission fixes

Changed application files:

- `src/services/api.ts`: timeouts, safe retries, authentication and error handling.
- `src/services/attendanceService.ts` and `attendanceResponse.ts`: API routes, response mapping and page requests.
- `src/components/officer/OfficerMeetingAttendanceSection.tsx`: farmer search, pagination, submission guards and modal feedback.
- `src/App.tsx`: load page modules on demand with loading/error feedback.
- `src/pages/farmer/AIAssistantPage.tsx`: abort stalled requests and preserve failed questions.
- `backend/farm/attendance_views.py`: validation, transactions, permissions, pagination and query optimization.
- `backend/farm/auth_views.py`: atomic user/profile registration.
- `backend/farm/api_errors.py` and `backend/agritrack/settings.py`: structured database and validation errors.

Verification files: `backend/farm/test_submission_workflows.py`,
`src/services/attendanceResponse.test.mjs`, and `backend/verify_submission_apis.py`.

Attendance requests previously included `/api` twice because the shared client
already uses `/api` as its base URL. The service now uses `/attendance/...` and
converts nested backend response names to the frontend's camelCase names.
This fixes farmer registration IDs, meeting dates, statistics, remarks, and
administrator audit data.

The shared HTTP client has a 20-second timeout; token refresh has a 10-second
timeout. Failed login requests do not trigger token refresh or page redirects.
Only safe GET/HEAD/OPTIONS gateway failures receive one retry. Save requests are
never automatically retried for gateway failures or timeouts. A timed-out save
may still complete on the server, so users are told to check saved records first.
The AI page also aborts a stalled request after 25 seconds.

The meeting form loads farmer pages when opened, debounces search, ignores stale
search responses, supports page navigation, preserves selections across pages,
and displays errors inside the form. Meetings use 25 rows per page and farmer
rosters use 50. Legacy API callers without page parameters remain compatible.
Post-save refreshes do not download the farmer roster again.

Page modules load on demand rather than bundling all dashboards, charts, and
administration pages into the initial JavaScript download. A page-loading
indicator and error boundary provide feedback while modules load or fail.
The production build's initial JavaScript decreased from about 1,123 kB to
394 kB before compression (304 kB to 122 kB compressed).

Meeting creation and invitations share a transaction. Invitations are inserted
in a batch after all selected farmer IDs are validated. Registration also saves
the user and profile together. Invalid attendance batches cannot partially save,
and officers cannot modify another officer's meeting. Database failures return
sanitized JSON errors instead of leaking database details in error responses.

Attendance statistics reuse fetched records instead of running five status
queries per meeting. Meeting lists fetch officer/register relations and
invitations, records, and audits together; regression tests check that query
counts stay constant as more meetings are added.

Run from the project root:

```powershell
.\.venv\Scripts\python.exe backend/manage.py check
.\.venv\Scripts\python.exe backend/manage.py test farm.test_submission_workflows farm.test_banana_dashboard ai_assistant.tests --settings=agritrack.test_settings
node --experimental-strip-types --test src/services/attendanceResponse.test.mjs
npm.cmd run build

# With the backend running: read-only Neon and HTTP checks
.\.venv\Scripts\python.exe backend/verify_submission_apis.py
```

No schema changes or migrations are required. Automated save and rollback tests
use an isolated SQLite database; they do not create demonstration records in
Neon. Browser interactions and every existing farm/livestock/input form have
not been exhaustively tested. Provider billing/quota is a separate issue.
