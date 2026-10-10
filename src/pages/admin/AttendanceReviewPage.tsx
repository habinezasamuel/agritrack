import { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import type {
  AdminRegisterReviewSummary,
  MeetingItem,
  AttendanceRecordItem,
  AttendanceStatus,
  AttendanceAuditItem,
} from '../../types';

export function AttendanceReviewPage() {
  const { user } = useAuth();
  const [registers, setRegisters] = useState<AdminRegisterReviewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'FINALIZED' | 'IN_PROGRESS' | 'REGISTER_GENERATED'>('all');

  // Selected Meeting for Review
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [meetingDetail, setMeetingDetail] = useState<MeetingItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modification Modal State
  const [modifyingRecord, setModifyingRecord] = useState<AttendanceRecordItem | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isSubmittingMod, setIsSubmittingMod] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Active view tab inside Detail modal: 'register' | 'audits' | 'report'
  const [detailTab, setDetailTab] = useState<'register' | 'audits' | 'report'>('register');

  // Record table search inside modal
  const [recordSearch, setRecordSearch] = useState('');
  const [recordStatusFilter, setRecordStatusFilter] = useState<string>('all');

  const fetchRegisters = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await attendanceService.getAdminAttendanceRegisters();
      setRegisters(data);
    } catch (err: any) {
      console.error('Failed to fetch registers:', err);
      setActionError(err.message || 'Failed to load attendance registers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegisters();
  }, [fetchRegisters]);

  const openMeetingReview = async (meetingId: number) => {
    setSelectedMeetingId(meetingId);
    setIsDetailOpen(true);
    setDetailTab('register');
    setActionSuccess('');
    setActionError('');
    try {
      setIsDetailLoading(true);
      const data = await attendanceService.getMeetingDetail(meetingId);
      setMeetingDetail(data);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load meeting details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openModificationModal = (record: AttendanceRecordItem) => {
    setModifyingRecord(record);
    // Suggest a flip: if ABSENT -> PRESENT, if PRESENT -> ABSENT, etc.
    const suggested: AttendanceStatus = record.status === 'ABSENT' ? 'PRESENT' : record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    setNewStatus(suggested);
    setCorrectionReason('');
    setAdminRemarks('');
    setActionError('');
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId || !modifyingRecord) return;
    if (!correctionReason.trim()) {
      setActionError('A valid correction reason is required for administrative audit integrity.');
      return;
    }

    try {
      setIsSubmittingMod(true);
      setActionError('');
      const response = await attendanceService.adminModifyAttendance(selectedMeetingId, {
        record_id: modifyingRecord.id,
        new_status: newStatus,
        reason: correctionReason.trim(),
        remarks: adminRemarks.trim() || undefined,
      });

      setActionSuccess(response.message || 'Attendance status corrected and audit recorded in Neon PostgreSQL.');
      // Refresh the current meeting details immediately
      setMeetingDetail(response.meeting);
      // Close modification modal
      setModifyingRecord(null);
      // Refresh register review list
      fetchRegisters();
    } catch (err: any) {
      console.error('Correction failed:', err);
      setActionError(err.message || 'Failed to save correction to Neon PostgreSQL.');
    } finally {
      setIsSubmittingMod(false);
    }
  };

  // Filter registers
  const filteredRegisters = registers.filter((r) => {
    const matchesSearch =
      r.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.generatedByOfficer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter records within the detail modal
  const filteredRecords = (meetingDetail?.records || []).filter((rec) => {
    const q = recordSearch.toLowerCase();
    const matchesQ =
      rec.farmer.name.toLowerCase().includes(q) ||
      rec.farmer.registrationId.toLowerCase().includes(q) ||
      rec.farmer.cell.toLowerCase().includes(q) ||
      rec.farmer.village.toLowerCase().includes(q) ||
      rec.farmer.sector.toLowerCase().includes(q);
    const matchesStatus = recordStatusFilter === 'all' || rec.status === recordStatusFilter;
    return matchesQ && matchesStatus;
  });

  // Main columns for Admin Review Table
  const registerColumns: Column<AdminRegisterReviewSummary>[] = [
    {
      key: 'meetingTitle',
      header: 'Meeting & Category',
      className: 'min-w-[220px]',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.meetingTitle}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {row.category.replace(/_/g, ' ')}
            </span>
            <span>📍 {row.venue}, {row.sector}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'generatedByOfficer',
      header: 'Generated by Officer',
      className: 'min-w-[190px]',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {row.generatedByOfficer.name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Generated: {format(parseISO(row.registerGeneratedAt), 'MMM dd, yyyy · HH:mm')}
          </div>
        </div>
      ),
    },
    {
      key: 'statistics',
      header: 'Attendance Stats',
      className: 'min-w-[210px]',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-800">{row.statistics.attendedCount}</span>
            <span className="text-slate-500">/ {row.statistics.totalInvited} attended</span>
            <span className="font-extrabold text-emerald-600 ml-1">({row.statistics.attendanceRate}%)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">P: {row.statistics.presentCount}</span>
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">L: {row.statistics.lateCount}</span>
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">A: {row.statistics.absentCount}</span>
            <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-semibold">E: {row.statistics.excusedCount}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'correctionsCount',
      header: 'Admin Corrections',
      className: 'whitespace-nowrap',
      render: (row) => (
        row.correctionsCount > 0 ? (
          <Badge variant="warning" size="sm">
            🛡️ {row.correctionsCount} Modified
          </Badge>
        ) : (
          <span className="text-xs text-slate-400">None</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Register Status',
      className: 'whitespace-nowrap',
      render: (row) => (
        <Badge
          variant={row.isFinalized ? 'success' : row.status === 'IN_PROGRESS' ? 'warning' : 'primary'}
          size="sm"
        >
          {row.isFinalized ? '✓ Finalized' : row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => openMeetingReview(row.meetingId)}
          className="shadow-sm font-semibold"
        >
          Review & Modify →
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Officer Attendance Review
            </h1>
            <Badge variant="gold" size="sm">Admin Oversight</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Review and certify attendance registers generated by agricultural officers. Modify recorded statuses when corrections are required, and preserve a permanent audit history in Neon PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRegisters} disabled={isLoading}>
            🔄 Refresh Registers
          </Button>
        </div>
      </div>

      {/* Mandatory Separation of Responsibilities Alert */}
      <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-950 flex items-start gap-3 shadow-xs">
        <div className="text-xl shrink-0">🏛️</div>
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Administrative Role Notice:</span> Initial attendance registers must be generated and initially marked by the <strong>Agricultural Officer</strong> who convened the meeting. As Administrator, your authority is to review officer registers, perform verified corrections (e.g. changing Absent to Present), record audit reasons, and oversee final compliance.
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600 shadow-xs">
          <CardBody className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Officer Registers</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{registers.length}</div>
            <div className="text-xs text-slate-500 mt-1">Submitted from sector officers</div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-xs">
          <CardBody className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Farmers Tracked</div>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">
              {registers.reduce((acc, r) => acc + r.statistics.totalInvited, 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Invited across all meetings</div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardBody className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Verified Attendees</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {registers.reduce((acc, r) => acc + r.statistics.attendedCount, 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Present or excused on record</div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardBody className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Admin Corrections</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {registers.reduce((acc, r) => acc + r.correctionsCount, 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Permanent audit adjustments</div>
          </CardBody>
        </Card>
      </div>

      {/* Main Register List Card */}
      <Card className="shadow-xs border-slate-200" padding="none">
        <div className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-5 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-bold text-slate-900 text-base">
              Agricultural Officer Attendance Registers
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Search meeting, officer, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 text-sm"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'FINALIZED', label: 'Finalized Registers' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'REGISTER_GENERATED', label: 'Register Generated' },
                ]}
                className="w-44 text-sm"
              />
            </div>
          </div>
        </div>

        <CardBody className="p-0">
          <Table
            columns={registerColumns}
            data={filteredRegisters}
            keyExtractor={(row) => String(row.meetingId)}
            isLoading={isLoading}
            emptyMessage="No officer attendance registers found."
          />
        </CardBody>
      </Card>

      {/* ============================================================== */}
      {/* MEETING REVIEW & ATTENDANCE MODIFICATION MODAL */}
      {/* ============================================================== */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={meetingDetail ? `Review Register: ${meetingDetail.title}` : 'Loading Register...'}
        size="xl"
      >
        {isDetailLoading || !meetingDetail ? (
          <div className="py-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
            Loading officer attendance register & audit history from Neon PostgreSQL...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info badge & attribution */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                  Officer Attendance Register
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  Generated by: {meetingDetail.register?.generatedByOfficer.name || meetingDetail.createdBy.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  📅 {format(parseISO(meetingDetail.meetingDate), 'EEEE, MMMM dd, yyyy')} · ⏰ {meetingDetail.startTime} - {meetingDetail.endTime} · 📍 {meetingDetail.venue}, {meetingDetail.sector}, {meetingDetail.district}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={meetingDetail.register?.isFinalized ? 'success' : 'warning'} size="md">
                  {meetingDetail.register?.isFinalized ? '✓ Register Finalized' : 'Draft / Active Register'}
                </Badge>
                <div className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ID: #{meetingDetail.id}
                </div>
              </div>
            </div>

            {/* Success / Error notification */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
                <span>✓ {actionSuccess}</span>
                <button type="button" onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-950">✕</button>
              </div>
            )}
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs font-medium flex items-center justify-between">
                <span>⚠ {actionError}</span>
                <button type="button" onClick={() => setActionError('')} className="text-rose-700 hover:text-rose-950">✕</button>
              </div>
            )}

            {/* Attendance Statistic Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              <div className="bg-slate-100/90 rounded-lg p-2.5 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Invited</div>
                <div className="text-lg font-black text-slate-900">{meetingDetail.statistics.totalInvited}</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-700 uppercase">Present</div>
                <div className="text-lg font-black text-emerald-800">{meetingDetail.statistics.presentCount}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                <div className="text-[11px] font-bold text-amber-700 uppercase">Late</div>
                <div className="text-lg font-black text-amber-800">{meetingDetail.statistics.lateCount}</div>
              </div>
              <div className="bg-rose-50 rounded-lg p-2.5 border border-rose-200">
                <div className="text-[11px] font-bold text-rose-700 uppercase">Absent</div>
                <div className="text-lg font-black text-rose-800">{meetingDetail.statistics.absentCount}</div>
              </div>
              <div className="bg-sky-50 rounded-lg p-2.5 border border-sky-200">
                <div className="text-[11px] font-bold text-sky-700 uppercase">Excused</div>
                <div className="text-lg font-black text-sky-800">{meetingDetail.statistics.excusedCount}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-200">
                <div className="text-[11px] font-bold text-purple-700 uppercase">Rate</div>
                <div className="text-lg font-black text-purple-800">{meetingDetail.statistics.attendanceRate}%</div>
              </div>
            </div>

            {/* Navigation tabs inside Detail Modal */}
            <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setDetailTab('register')}
                className={`pb-2.5 px-1 border-b-2 transition ${
                  detailTab === 'register'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Farmer Attendance List ({meetingDetail.records?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('audits')}
                className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                  detailTab === 'audits'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Audit History Log
                {(meetingDetail.auditHistory?.length || 0) > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {meetingDetail.auditHistory?.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('report')}
                className={`pb-2.5 px-1 border-b-2 transition ${
                  detailTab === 'report'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Official Attendance Report
              </button>
            </div>

            {/* TAB 1: ATTENDANCE RECORDS TABLE */}
            {detailTab === 'register' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Showing real registered farmers invited to this meeting. Modify status if administrative verification reveals discrepancies.
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search farmer name, village..."
                      value={recordSearch}
                      onChange={(e) => setRecordSearch(e.target.value)}
                      className="text-xs w-52"
                    />
                    <Select
                      value={recordStatusFilter}
                      onChange={(e) => setRecordStatusFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Statuses' },
                        { value: 'PRESENT', label: 'Present' },
                        { value: 'LATE', label: 'Late' },
                        { value: 'ABSENT', label: 'Absent' },
                        { value: 'EXCUSED', label: 'Excused' },
                        { value: 'UNRECORDED', label: 'Unrecorded' },
                      ]}
                      className="text-xs w-36"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Farmer & Reg ID</th>
                        <th className="py-2.5 px-3">Administrative Location</th>
                        <th className="py-2.5 px-3">Officer Recorded Status</th>
                        <th className="py-2.5 px-3">Remarks / Verification</th>
                        <th className="py-2.5 px-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No farmer attendance records match your search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{rec.farmer.name}</div>
                              <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 inline-block px-1 rounded">
                                {rec.farmer.registrationId}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div>{rec.farmer.district}, {rec.farmer.sector}</div>
                              <div className="text-[11px] text-slate-400">
                                Cell: {rec.farmer.cell || '-'} · Village: {rec.farmer.village || '-'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                  rec.status === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'LATE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : rec.status === 'ABSENT'
                                    ? 'bg-rose-100 text-rose-800'
                                    : rec.status === 'EXCUSED'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {rec.status}
                              </span>
                              {rec.isModifiedByAdmin && (
                                <div className="mt-1">
                                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded font-semibold flex items-center gap-0.5 w-fit">
                                    🛡️ Admin Corrected
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 max-w-[200px]">
                              {rec.adminRemarks ? (
                                <div className="text-[11px] text-amber-900 font-medium bg-amber-50/70 p-1.5 rounded border border-amber-200/60">
                                  <span className="font-bold">Admin:</span> {rec.adminRemarks}
                                </div>
                              ) : rec.officerRemarks ? (
                                <div className="text-[11px] text-slate-600 italic">
                                  "{rec.officerRemarks}"
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openModificationModal(rec)}
                                className="text-xs font-semibold hover:border-amber-500 hover:text-amber-800"
                              >
                                ✏️ Modify Status
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT HISTORY LOG */}
            {detailTab === 'audits' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  Permanent audit trail tracking all administrative corrections to this register. Retains original history, administrator identity, timestamp, and modification reason.
                </div>

                {(!meetingDetail.auditHistory || meetingDetail.auditHistory.length === 0) ? (
                  <div className="py-12 text-center text-slate-400">
                    No administrative modifications have been recorded for this meeting.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Farmer Name & ID</th>
                          <th className="py-2.5 px-3">Status Change</th>
                          <th className="py-2.5 px-3">Modified By</th>
                          <th className="py-2.5 px-3">Reason / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {meetingDetail.auditHistory.map((a: AttendanceAuditItem) => (
                          <tr key={a.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {format(parseISO(a.timestamp), 'MMM dd, yyyy · HH:mm:ss')}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{a.farmerName}</div>
                              <div className="text-[11px] font-mono text-slate-500">{a.farmerRegistrationId}</div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">{a.previousStatus}</span>
                              <span className="mx-1 text-slate-400">➔</span>
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{a.newStatus}</span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">{a.modifierName}</div>
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                {a.modifierRole}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {a.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: OFFICIAL REPORT */}
            {detailTab === 'report' && (
              <div className="space-y-5 bg-white p-6 border border-slate-300 rounded-xl shadow-sm text-slate-900">
                <div className="text-center border-b border-slate-300 pb-4">
                  <div className="text-xs uppercase font-extrabold tracking-widest text-emerald-800">
                    Republic of Rwanda · Ministry of Agriculture and Animal Resources
                  </div>
                  <h2 className="text-xl font-black mt-1">Official Meeting Attendance Register & Certification Report</h2>
                  <div className="text-xs text-slate-500 mt-1">
                    Generated from verified PostgreSQL records on {format(new Date(), 'MMMM dd, yyyy · HH:mm')}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Meeting Title:</span>
                    <div className="font-bold text-sm">{meetingDetail.title}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Date & Venue:</span>
                    <div className="font-semibold">{meetingDetail.meetingDate} · {meetingDetail.venue}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Convening Officer:</span>
                    <div className="font-semibold">{meetingDetail.register?.generatedByOfficer.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Certified Attendance Rate:</span>
                    <div className="font-black text-emerald-700 text-sm">{meetingDetail.statistics.attendanceRate}%</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2 text-left">Farmer Name</th>
                        <th className="p-2 text-left">Reg ID</th>
                        <th className="p-2 text-left">Location</th>
                        <th className="p-2 text-left">Certified Status</th>
                        <th className="p-2 text-left">Verification Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {meetingDetail.records?.map((r) => (
                        <tr key={r.id}>
                          <td className="p-2 font-bold">{r.farmer.name}</td>
                          <td className="p-2 font-mono">{r.farmer.registrationId}</td>
                          <td className="p-2">{r.farmer.sector}, {r.farmer.cell}</td>
                          <td className="p-2">
                            <span className="font-bold">{r.status}</span>
                            {r.isModifiedByAdmin && <span className="text-[10px] text-amber-700 ml-1">(Admin Corrected)</span>}
                          </td>
                          <td className="p-2 text-slate-600">{r.adminRemarks || r.officerRemarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-end pt-6 border-t border-slate-200 text-xs">
                  <div>
                    <div className="text-slate-500">Agricultural Officer Signature:</div>
                    <div className="font-bold mt-4 underline">{meetingDetail.register?.generatedByOfficer.name}</div>
                    <div className="text-[11px] text-slate-400">Sector Agronomist</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Administrator Approval Stamp:</div>
                    <div className="font-bold mt-4 underline">{user?.firstName} {user?.lastName} (Admin HQ)</div>
                    <div className="text-[11px] text-slate-400">System Certified · Neon PostgreSQL Verified</div>
                  </div>
                </div>

                <div className="text-right pt-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    🖨️ Print Attendance Certificate
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* ATTENDANCE CORRECTION MODAL (ADMIN ONLY) */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!modifyingRecord}
        onClose={() => setModifyingRecord(null)}
        title="Administrative Attendance Correction"
        size="md"
      >
        {modifyingRecord && (
          <form onSubmit={handleSaveCorrection} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
              <span className="font-bold">Audit Policy:</span> Changing an attendance status updates Neon PostgreSQL immediately, recalculates meeting totals, and preserves a permanent audit history entry with your administrator account.
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">Farmer Details</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{modifyingRecord.farmer.name}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                ID: <span className="font-mono font-bold text-emerald-800">{modifyingRecord.farmer.registrationId}</span> · Location: {modifyingRecord.farmer.sector}, {modifyingRecord.farmer.cell}, {modifyingRecord.farmer.village}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Current Recorded Status</label>
                <div className="p-2.5 bg-slate-100 rounded-lg font-bold text-sm text-slate-700 border border-slate-200">
                  {modifyingRecord.status}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Corrected Status *</label>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  options={[
                    { value: 'PRESENT', label: 'Present' },
                    { value: 'ABSENT', label: 'Absent' },
                    { value: 'LATE', label: 'Late' },
                    { value: 'EXCUSED', label: 'Excused' },
                  ]}
                  className="w-full text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correction Reason (Recorded in Audit History) *
              </label>
              <Input
                placeholder="e.g. Verified presence via auditorium entry ticket; roll call missed"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                required
                className="text-sm"
              />
              <span className="text-[11px] text-slate-500">
                Explain why this status is being altered (e.g. physical ticket, verified excuse, late check-in).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Administrative Remarks (Optional)
              </label>
              <Textarea
                placeholder="Additional notes for the agricultural officer and official audit record..."
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {actionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs font-medium">
                ⚠ {actionError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModifyingRecord(null)}
                disabled={isSubmittingMod}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingMod}
                className="bg-emerald-700 hover:bg-emerald-800 font-bold"
              >
                {isSubmittingMod ? 'Saving Correction...' : '✓ Save Correction to Database'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
