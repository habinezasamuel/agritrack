import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAttendanceResponse } from './attendanceResponse.ts';

test('database roster fields support searching and invitations', () => {
  const roster = normalizeAttendanceResponse({ farmers: [{ id: 42, user_id: 7, name: 'Hasa', registration_id: 'REG-42', phone_number: '123', cell: '', village: '' }] });
  assert.equal(roster.farmers[0].registrationId.toLowerCase(), 'reg-42');
  assert.equal(roster.farmers[0].userId, 7);
  assert.equal(roster.farmers[0].id, 42);
});

test('nested meeting data supports dates, counters, officer remarks and audit history', () => {
  const raw = {
    meeting_date: '2026-10-10', start_time: '09:00', has_register: true,
    statistics: { total_invited: 2, present_count: 1, attendance_rate: 50 },
    records: [{ officer_remarks: 'On time', farmer: { registration_id: 'REG-1' } }],
    register: { is_finalized: false, generated_by_officer: { name: 'Officer' } },
    audit_history: [{ previous_status: 'ABSENT', new_status: 'PRESENT' }],
  };
  const result = normalizeAttendanceResponse(raw);
  assert.equal(result.meetingDate, '2026-10-10');
  assert.equal(result.statistics.totalInvited, 2);
  assert.equal(result.records[0].officerRemarks, 'On time');
  assert.equal(result.records[0].farmer.registrationId, 'REG-1');
  assert.equal(result.register.generatedByOfficer.name, 'Officer');
  assert.equal(result.auditHistory[0].newStatus, 'PRESENT');
  assert.equal(raw.meeting_date, '2026-10-10');
});
