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

Migration `farm.0007_meetingsubmission_and_more` adds meeting submission receipts.
It has been applied to Neon and preserves existing records. Each creation request
uses a unique submission key. After a timeout, the frontend checks for the
committed response; repeating the same pending submission returns the original
meeting. Keys are scoped to the authenticated officer and cannot be reused for
different details. Saving the meeting, invitations, and receipt is atomic.

Meeting save responses now use the just-created objects instead of querying
empty attendance registers and histories again. Attendance saves have a bounded
30-second deadline. Failed requests retain their form data and pending key.
Pending keys live in memory; after reloading the browser, check the meeting list
before repeating an uncertain save.

Automated save and rollback tests
use an isolated SQLite database; they do not create demonstration records in
Neon. Browser interactions and every existing farm/livestock/input form have
not been exhaustively tested. Provider billing/quota is a separate issue.

## Automatic attendance marking

Officers select Present, Late, Absent, or Excused beside each farmer. Nearby clicks
are queued into one save request; newer choices wait behind the current batch.
Each row shows Waiting to save, Saving, Saved, or Retry. Counts update from the
database confirmation. Remarks save on leaving the input, and the existing bulk
save remains available. Finalization is disabled while marks remain pending or
failed. Finalized registers are read-only for officers.

The totals act as filters. Attendance rate remains calculated as
`(Present + Late) / Invited * 100`; no numeric farmer scores are introduced.

Automatic saves request a compact response from the existing attendance API.
After a timeout the client reads the saved statuses and remarks before deciding
whether confirmation failed. The backend validates the whole batch and updates
the existing records in a transaction, including officer identity and timestamps.
Tests cover all four statuses, remarks, persistence on reopening, rate calculation,
repeated saves without duplicate attendance records, and finalized-register locks.
No migration is required for these attendance controls.

## Record-loading recovery

Identical simultaneous reads now share one request, scoped to user/token, URL,
parameters, and timeout. Results are removed on success or failure; completed
records are never cached. Writes advance the read generation so a post-save
reload does not reuse a read started before the save. General reads have a
bounded 30-second timeout; explicit confirmation deadlines remain unchanged.

Register details prefetch their farmer, officer, register, and audit relationships.
Failed register loads stop the spinner and show an in-modal Retry register button.
The meeting list has its own Retry loading button.

Database connection attempts now use a 5-second timeout instead of 15 seconds.
Authentication database failures return a sanitized `503 database_unavailable`
response before any save handler runs. The HTTP client preserves that message.
The shared request deadline is 30 seconds. Manual attendance saves use the same
compact response and read-back confirmation as automatic marks. Finalization
also checks the saved register after a timeout. Network outages can still
prevent a save; no success is shown without database confirmation.
