import { useEffect, useState, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardBody } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Select } from '../common/Select';
import { Table, type Column } from '../common/Table';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, type CreateMeetingDto } from '../../services/attendanceService';
import type {
  MeetingItem,
  AttendanceRecordItem,
  AttendanceStatus,
  FarmerLocationDetails,
  MeetingCategory,
} from '../../types';

export function OfficerMeetingAttendanceSection() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [farmersRoster, setFarmersRoster] = useState<FarmerLocationDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meetingPage, setMeetingPage] = useState(1);
  const [meetingCount, setMeetingCount] = useState(0);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterCount, setRosterCount] = useState(0);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const rosterRequest = useRef(0);

  // Selected Meeting for Register Management
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [meetingDetail, setMeetingDetail] = useState<MeetingItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Local state for editable attendance records
  const [editingRecords, setEditingRecords] = useState<Record<number, { status: AttendanceStatus; remarks: string }>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [isGeneratingRegister, setIsGeneratingRegister] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Create Meeting Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMeetingDto>({
    title: '',
    description: '',
    meeting_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '12:00',
    venue: '',
    district: 'Ruhango',
    sector: 'Kinazi',
    category: 'SEASON_PREPARATION',
    agenda: '',
    farmer_ids: [],
  });
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<number[]>([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const meetingSubmission = useRef(false);
  const inviteSubmission = useRef(false);
  const [rosterError, setRosterError] = useState('');

  // Invite more farmers modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFarmerIds, setInviteFarmerIds] = useState<number[]>([]);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Print Report View inside register modal
  const [showReportView, setShowReportView] = useState(false);

  // Status and feedback
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await attendanceService.getMeetingsPage(meetingPage);
      setMeetings(result.meetings);
      setMeetingCount(result.count);
    } catch (err: any) {
      console.error('Failed to load meetings data:', err);
      setFeedbackError(err.message || 'Failed to load meetings.');
    } finally {
      setIsLoading(false);
    }
  }, [meetingPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadFarmerPage = useCallback(async () => {
    const requestId = ++rosterRequest.current;
    setIsRosterLoading(true);
    setRosterError('');
    try {
      const result = await attendanceService.getRegisteredFarmersPage(farmerSearch.trim(), rosterPage);
      if (requestId !== rosterRequest.current) return;
      setFarmersRoster(result.farmers);
      setRosterCount(result.count);
    } catch (error: any) {
      if (requestId === rosterRequest.current) setRosterError(error.message || 'Unable to load registered farmers.');
    } finally {
      if (requestId === rosterRequest.current) setIsRosterLoading(false);
    }
  }, [farmerSearch, rosterPage]);

  useEffect(() => {
    if (!isCreateModalOpen && !isInviteModalOpen) return;
    setIsRosterLoading(true);
    const timer = window.setTimeout(() => { void loadFarmerPage(); }, 250);
    return () => { window.clearTimeout(timer); rosterRequest.current += 1; };
  }, [isCreateModalOpen, isInviteModalOpen, loadFarmerPage]);

  const refreshMeetings = async () => {
    try {
      const result = await attendanceService.getMeetingsPage(meetingPage);
      setMeetings(result.meetings);
      setMeetingCount(result.count);
    }
    catch (error: any) { setFeedbackError(error.message || 'Saved, but the meeting list could not refresh.'); }
  };

  const openMeetingRegister = async (meetingId: number, savedMeeting?: MeetingItem) => {
    setSelectedMeetingId(meetingId);
    setIsRegisterModalOpen(true);
    setShowReportView(false);
    setFeedbackSuccess('');
    setFeedbackError('');
    setMeetingDetail(null);
    try {
      setIsDetailLoading(true);
      const data = savedMeeting || await attendanceService.getMeetingDetail(meetingId);
      setMeetingDetail(data);

      // Initialize editing records mapping
      const mapping: Record<number, { status: AttendanceStatus; remarks: string }> = {};
      data.records?.forEach((rec) => {
        mapping[rec.id] = {
          status: rec.status,
          remarks: rec.officerRemarks || '',
        };
      });
      setEditingRecords(mapping);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to load register details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleGenerateRegister = async () => {
    if (!selectedMeetingId) return;
    try {
      setIsGeneratingRegister(true);
      setFeedbackError('');
      const res = await attendanceService.generateAttendanceRegister(selectedMeetingId);
      setMeetingDetail(res.meeting);

      const mapping: Record<number, { status: AttendanceStatus; remarks: string }> = {};
      res.meeting.records?.forEach((rec) => {
        mapping[rec.id] = {
          status: rec.status,
          remarks: rec.officerRemarks || '',
        };
      });
      setEditingRecords(mapping);
      setFeedbackSuccess(res.message || 'Attendance register generated successfully using invited farmers!');
      void refreshMeetings();
    } catch (err: any) {
      console.error('Failed to generate register:', err);
      setFeedbackError(err.message || 'Failed to generate attendance register.');
    } finally {
      setIsGeneratingRegister(false);
    }
  };

  const handleStatusChange = (recordId: number, status: AttendanceStatus) => {
    setEditingRecords((prev) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || { remarks: '' }),
        status,
      },
    }));
  };

  const handleRemarksChange = (recordId: number, remarks: string) => {
    setEditingRecords((prev) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || { status: 'UNRECORDED' }),
        remarks,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedMeetingId) return;
    try {
      setIsSavingAttendance(true);
      setFeedbackError('');
      const payload = Object.entries(editingRecords).map(([recordId, val]) => ({
        record_id: Number(recordId),
        status: val.status,
        remarks: val.remarks,
      }));

      const res = await attendanceService.recordAttendance(selectedMeetingId, payload);
      setMeetingDetail(res.meeting);
      setFeedbackSuccess(res.message || 'Attendance register saved to Neon PostgreSQL successfully!');
      void refreshMeetings();
    } catch (err: any) {
      console.error('Failed to save attendance:', err);
      setFeedbackError(err.message || 'Failed to save attendance register.');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleFinalizeRegister = async () => {
    if (!selectedMeetingId) return;
    if (!window.confirm('Are you sure you want to finalize this attendance register? Once finalized, it will be marked as certified for the meeting.')) {
      return;
    }
    try {
      setIsFinalizing(true);
      setFeedbackError('');
      const res = await attendanceService.finalizeAttendanceRegister(selectedMeetingId);
      setMeetingDetail(res.meeting);
      setFeedbackSuccess('Attendance register finalized successfully.');
      void refreshMeetings();
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to finalize register.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingSubmission.current) return;
    if (!createForm.title || !createForm.meeting_date || !createForm.venue) {
      setFeedbackError('Title, meeting date, and venue are required.');
      return;
    }

    meetingSubmission.current = true;
    try {
      setIsSubmittingMeeting(true);
      setFeedbackError('');
      const res = await attendanceService.createMeeting({
        ...createForm,
        farmer_ids: selectedFarmerIds,
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        description: '',
        meeting_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '12:00',
        venue: '',
        district: 'Ruhango',
        sector: 'Kinazi',
        category: 'SEASON_PREPARATION',
        agenda: '',
        farmer_ids: [],
      });
      setSelectedFarmerIds([]);
      setFeedbackSuccess('Meeting created successfully! You can now generate the attendance register.');
      setMeetings((previous) => [res.meeting, ...previous.filter((meeting) => meeting.id !== res.meeting.id)]);
      setMeetingCount((previous) => previous + 1);
      // Auto open register modal for convenience
      if (res.meeting?.id) {
        await openMeetingRegister(res.meeting.id, res.meeting);
        setFeedbackSuccess('Meeting and selected farmer invitations saved successfully.');
      }
    } catch (err: any) {
      console.error('Failed to create meeting:', err);
      setFeedbackError(err.message || 'Failed to create meeting.');
    } finally {
      meetingSubmission.current = false;
      setIsSubmittingMeeting(false);
    }
  };

  const handleInviteFarmers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteSubmission.current) return;
    if (!selectedMeetingId || inviteFarmerIds.length === 0) return;

    inviteSubmission.current = true;
    try {
      setIsSubmittingInvite(true);
      setFeedbackError('');
      const res = await attendanceService.inviteFarmers(selectedMeetingId, inviteFarmerIds);
      setMeetingDetail(res.meeting);
      setIsInviteModalOpen(false);
      setInviteFarmerIds([]);
      setFeedbackSuccess(res.message || 'Farmers invited successfully.');
      void refreshMeetings();
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to invite farmers.');
    } finally {
      inviteSubmission.current = false;
      setIsSubmittingInvite(false);
    }
  };

  const toggleSelectFarmer = (id: number) => {
    setSelectedFarmerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFarmers = () => {
    if (filteredFarmers.every((farmer) => selectedFarmerIds.includes(farmer.id))) {
      setSelectedFarmerIds((previous) => previous.filter((id) => !filteredFarmers.some((farmer) => farmer.id === id)));
    } else {
      setSelectedFarmerIds((previous) => [...new Set([...previous, ...filteredFarmers.map((f) => f.id)])]);
    }
  };

  const filteredFarmers = farmersRoster.filter(
    (f) =>
      [f.name, f.username, f.registrationId, f.district, f.sector, f.cell, f.village]
        .some((value) => (value || '').toLowerCase().includes(farmerSearch.trim().toLowerCase()))
  );

  const meetingColumns: Column<MeetingItem>[] = [
    {
      key: 'title',
      header: 'Meeting & Category',
      className: 'min-w-[240px]',
      render: (m) => (
        <div>
          <div className="font-bold text-slate-900">{m.title}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {m.category.replace(/_/g, ' ')}
            </span>
            <span>📍 {m.venue}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'meetingDate',
      header: 'Date & Time',
      className: 'whitespace-nowrap',
      render: (m) => (
        <div>
          <div className="font-semibold text-slate-800">
            {format(parseISO(m.meetingDate), 'MMM dd, yyyy')}
          </div>
          <div className="text-xs text-slate-500">
            {m.startTime} - {m.endTime}
          </div>
        </div>
      ),
    },
    {
      key: 'hasRegister',
      header: 'Register Status',
      className: 'whitespace-nowrap',
      render: (m) => {
        if (!m.hasRegister) {
          return <Badge variant="warning" size="sm">Register Not Generated</Badge>;
        }
        if (m.register?.isFinalized) {
          return <Badge variant="success" size="sm">✓ Finalized</Badge>;
        }
        return <Badge variant="primary" size="sm">Register Active</Badge>;
      },
    },
    {
      key: 'statistics',
      header: 'Attendance Summary',
      className: 'min-w-[190px]',
      render: (m) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-900">{m.statistics.attendedCount} / {m.statistics.totalInvited} Attended</span>
            <span className="text-emerald-700 font-bold">({m.statistics.attendanceRate}%)</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[11px]">
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">P: {m.statistics.presentCount}</span>
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">L: {m.statistics.lateCount}</span>
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">A: {m.statistics.absentCount}</span>
            <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-semibold">E: {m.statistics.excusedCount}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'whitespace-nowrap text-right',
      render: (m) => (
        <Button
          size="sm"
          variant={m.hasRegister ? 'primary' : 'outline'}
          onClick={() => openMeetingRegister(m.id)}
          className="font-bold text-xs shadow-xs"
        >
          {m.hasRegister ? 'Open Register →' : 'Generate Register 📋'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Officer Attendance Desk Card */}
      <Card variant="default" padding="none" className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 px-6 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-lg font-black tracking-tight">
                Farmer Meetings & Attendance Register Management
              </h2>
              <span className="bg-teal-700/80 text-teal-100 text-xs px-2.5 py-0.5 rounded-full font-bold border border-teal-500/40">
                Officer Desk
              </span>
            </div>
            <p className="text-xs text-teal-100/90 mt-1 max-w-2xl">
              Create meetings, invite registered farmers from the database, generate initial attendance registers, and record physical attendance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setFeedbackError(''); setFarmerSearch(''); setRosterPage(1); setIsCreateModalOpen(true); }}
              className="!bg-white !text-teal-900 hover:!bg-teal-50 font-bold shadow-md"
            >
              ➕ Create Meeting
            </Button>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="m-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>✓ {feedbackSuccess}</span>
            <button type="button" onClick={() => setFeedbackSuccess('')} className="text-emerald-800">✕</button>
          </div>
        )}

        {feedbackError && (
          <div className="m-4 p-3.5 bg-rose-50 border border-rose-300 text-rose-950 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>⚠ {feedbackError}</span>
            <button type="button" onClick={() => setFeedbackError('')} className="text-rose-800">✕</button>
          </div>
        )}

        <CardBody className="p-0">
          <Table
            columns={meetingColumns}
            data={meetings}
            keyExtractor={(m) => String(m.id)}
            isLoading={isLoading}
            emptyMessage="No farmer meetings scheduled yet. Click 'Create Meeting' to get started."
          />
          <div className="flex items-center justify-between p-4">
            <Button size="sm" variant="outline" disabled={isLoading || meetingPage === 1} onClick={() => setMeetingPage((page) => page - 1)}>Previous</Button>
            <span className="text-xs">Page {meetingPage} of {Math.max(1, Math.ceil(meetingCount / 25))}</span>
            <Button size="sm" variant="outline" disabled={isLoading || meetingPage * 25 >= meetingCount} onClick={() => setMeetingPage((page) => page + 1)}>Next</Button>
          </div>
        </CardBody>
      </Card>

      {/* ============================================================== */}
      {/* MEETING ATTENDANCE REGISTER MODAL (OFFICER MANAGEMENT) */}
      {/* ============================================================== */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={meetingDetail ? `Meeting Attendance: ${meetingDetail.title}` : 'Loading...'}
        size="xl"
      >
        {isDetailLoading || !meetingDetail ? (
          <div className="py-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-3" />
            Loading attendance register from Neon PostgreSQL...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Meeting metadata bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 text-sm">{meetingDetail.title}</div>
                <div className="text-slate-600 mt-0.5">
                  📅 {format(parseISO(meetingDetail.meetingDate), 'EEEE, MMMM dd, yyyy')} · ⏰ {meetingDetail.startTime} - {meetingDetail.endTime} · 📍 {meetingDetail.venue}
                </div>
                <div className="text-slate-500 mt-0.5">
                  District: <strong>{meetingDetail.district}</strong> · Sector: <strong>{meetingDetail.sector}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="text-xs"
                >
                  ➕ Invite More Farmers
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReportView(!showReportView)}
                  className="text-xs"
                >
                  {showReportView ? '← Back to Marking' : '🖨️ View Report'}
                </Button>
              </div>
            </div>

            {/* CASE 1: REGISTER NOT GENERATED YET */}
            {!meetingDetail.hasRegister ? (
              <div className="p-8 text-center bg-gradient-to-b from-teal-50/60 to-emerald-50/40 rounded-2xl border-2 border-dashed border-teal-300 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-3xl mx-auto shadow-xs">
                  📋
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Initial Attendance Register Required</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    You have invited <strong>{meetingDetail.statistics.totalInvited} registered farmer(s)</strong> to this meeting. Click the button below to generate the official attendance register from real database records.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGenerateRegister}
                    disabled={isGeneratingRegister}
                    className="!bg-teal-700 hover:!bg-teal-800 font-extrabold text-sm shadow-md"
                  >
                    {isGeneratingRegister ? 'Generating Register...' : '📋 Generate Attendance Register'}
                  </Button>
                </div>
              </div>
            ) : showReportView ? (
              /* REPORT CERTIFICATE VIEW */
              <div className="space-y-4 p-5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900">
                <div className="text-center border-b border-slate-200 pb-3">
                  <div className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">
                    Republic of Rwanda · Agricultural Extension Service
                  </div>
                  <h3 className="text-lg font-black mt-0.5">Meeting Attendance Report</h3>
                  <div className="text-slate-500 text-[11px]">
                    Verified in Neon PostgreSQL on {format(new Date(), 'MMM dd, yyyy · HH:mm')}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center py-2 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Total Invited</div>
                    <div className="text-base font-black text-slate-900">{meetingDetail.statistics.totalInvited}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 font-bold uppercase">Present</div>
                    <div className="text-base font-black text-emerald-800">{meetingDetail.statistics.presentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-700 font-bold uppercase">Absent</div>
                    <div className="text-base font-black text-rose-800">{meetingDetail.statistics.absentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-teal-700 font-bold uppercase">Attendance Rate</div>
                    <div className="text-base font-black text-teal-800">{meetingDetail.statistics.attendanceRate}%</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">Farmer</th>
                        <th className="p-2">Reg ID</th>
                        <th className="p-2">Sector / Cell</th>
                        <th className="p-2">Recorded Status</th>
                        <th className="p-2">Remarks / Certification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {meetingDetail.records?.map((r) => (
                        <tr key={r.id}>
                          <td className="p-2 font-bold">{r.farmer.name}</td>
                          <td className="p-2 font-mono text-[11px]">{r.farmer.registrationId}</td>
                          <td className="p-2">{r.farmer.sector}, {r.farmer.cell}</td>
                          <td className="p-2 font-bold">
                            {r.status}
                            {r.isModifiedByAdmin && <span className="text-amber-700 font-semibold text-[10px] ml-1">(Admin Modified)</span>}
                          </td>
                          <td className="p-2 text-slate-600">{r.adminRemarks || r.officerRemarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-200 text-xs">
                  <div>
                    <div className="text-slate-500">Prepared by Agricultural Officer:</div>
                    <div className="font-bold underline mt-2">{user?.firstName} {user?.lastName}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    🖨️ Print Report
                  </Button>
                </div>
              </div>
            ) : (
              /* CASE 2: REGISTER GENERATED - MARKING ATTENDANCE */
              <div className="space-y-4">
                {/* Statistics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-slate-100 rounded-lg p-2 border border-slate-200">
                    <div className="font-bold text-slate-500 uppercase text-[10px]">Invited</div>
                    <div className="text-base font-black text-slate-900">{meetingDetail.statistics.totalInvited}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                    <div className="font-bold text-emerald-700 uppercase text-[10px]">Present</div>
                    <div className="text-base font-black text-emerald-800">{meetingDetail.statistics.presentCount}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                    <div className="font-bold text-amber-700 uppercase text-[10px]">Late</div>
                    <div className="text-base font-black text-amber-800">{meetingDetail.statistics.lateCount}</div>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                    <div className="font-bold text-rose-700 uppercase text-[10px]">Absent</div>
                    <div className="text-base font-black text-rose-800">{meetingDetail.statistics.absentCount}</div>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-2 border border-sky-200">
                    <div className="font-bold text-sky-700 uppercase text-[10px]">Excused</div>
                    <div className="text-base font-black text-sky-800">{meetingDetail.statistics.excusedCount}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                    <div className="font-bold text-purple-700 uppercase text-[10px]">Rate</div>
                    <div className="text-base font-black text-purple-800">{meetingDetail.statistics.attendanceRate}%</div>
                  </div>
                </div>

                {/* Table for Marking Attendance */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Farmer & Reg ID</th>
                        <th className="py-2.5 px-3">Administrative Location</th>
                        <th className="py-2.5 px-3 min-w-[260px]">Attendance Status</th>
                        <th className="py-2.5 px-3">Officer Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {meetingDetail.records?.map((rec: AttendanceRecordItem) => {
                        const current = editingRecords[rec.id] || { status: rec.status, remarks: rec.officerRemarks || '' };
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{rec.farmer.name}</div>
                              <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1 rounded inline-block">
                                {rec.farmer.registrationId}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div>{rec.farmer.district}, {rec.farmer.sector}</div>
                              <div className="text-[11px] text-slate-400">
                                {rec.farmer.cell} · {rec.farmer.village}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatus[]).map((st) => (
                                  <button
                                    type="button"
                                    key={st}
                                    onClick={() => handleStatusChange(rec.id, st)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                                      current.status === st
                                        ? st === 'PRESENT'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : st === 'LATE'
                                          ? 'bg-amber-600 text-white shadow-xs'
                                          : st === 'ABSENT'
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'bg-sky-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>

                              {rec.isModifiedByAdmin && (
                                <div className="mt-1.5 text-[10px] bg-amber-50 text-amber-900 border border-amber-200 p-1 rounded font-medium flex items-center gap-1">
                                  <span>🛡️ Corrected by Administrator:</span>
                                  <span className="font-bold">{rec.adminRemarks}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                placeholder="Add remark..."
                                value={current.remarks}
                                onChange={(e) => handleRemarksChange(rec.id, e.target.value)}
                                className="w-full text-xs p-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Audit Modifications Section (if administrator made changes) */}
                {(meetingDetail.auditHistory?.length || 0) > 0 && (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2 text-xs">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span>🛡️ Administrative Modifications Log ({meetingDetail.auditHistory?.length}):</span>
                    </div>
                    <div className="space-y-1">
                      {meetingDetail.auditHistory?.map((audit) => (
                        <div key={audit.id} className="text-[11px] text-amber-900 bg-white/70 p-2 rounded border border-amber-200/60 flex items-start justify-between">
                          <div>
                            <strong>{audit.farmerName}:</strong> changed from <span className="font-bold text-rose-700">{audit.previousStatus}</span> to <span className="font-bold text-emerald-700">{audit.newStatus}</span> by Administrator {audit.modifierName}.
                            <div className="italic text-slate-500 mt-0.5">Reason: "{audit.reason}"</div>
                          </div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {format(parseISO(audit.timestamp), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Changes are saved directly to Neon PostgreSQL. Make sure to click save after marking.
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAttendance}
                      disabled={isSavingAttendance}
                      className="!bg-teal-700 hover:!bg-teal-800 font-bold"
                    >
                      {isSavingAttendance ? 'Saving...' : '💾 Save Attendance Register'}
                    </Button>

                    {!meetingDetail.register?.isFinalized && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFinalizeRegister}
                        disabled={isFinalizing}
                        className="text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                      >
                        {isFinalizing ? 'Finalizing...' : '✓ Finalize Register'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* CREATE MEETING MODAL */}
      {/* ============================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { if (!isSubmittingMeeting) setIsCreateModalOpen(false); }}
        title="Schedule Agricultural Farmer Meeting"
        size="lg"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          {feedbackError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{feedbackError}</p>}
          {rosterError && <div role="alert">{rosterError} <Button type="button" onClick={loadFarmerPage} disabled={isRosterLoading}>Retry farmer list</Button></div>}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
            <span className="font-bold">Officer Responsibility:</span> You are creating an official meeting register. You can select real registered farmers below to automatically invite them to this session.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Title *</label>
            <Input
              placeholder="e.g. Kinazi Season 2026A Seed & Fertilizer Allocation Assembly"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              required
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Date *</label>
              <Input
                type="date"
                value={createForm.meeting_date}
                onChange={(e) => setCreateForm({ ...createForm, meeting_date: e.target.value })}
                required
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <Input
                type="time"
                value={createForm.start_time}
                onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
              <Input
                type="time"
                value={createForm.end_time}
                onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location *</label>
              <Input
                placeholder="e.g. Kinazi Sector Community Hall"
                value={createForm.venue}
                onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <Select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as MeetingCategory })}
                options={[
                  { value: 'SEASON_PREPARATION', label: 'Season Preparation & Planning' },
                  { value: 'INPUT_DISTRIBUTION', label: 'Input Distribution & Subsidies' },
                  { value: 'PEST_DISEASE_TRAINING', label: 'Pest & Disease Training' },
                  { value: 'IRRIGATION_WATER', label: 'Irrigation & Water Management' },
                  { value: 'COOPERATIVE_GENERAL', label: 'Cooperative General Assembly' },
                  { value: 'HARVEST_POSTHARVEST', label: 'Harvest & Post-Harvest' },
                  { value: 'OTHER', label: 'General Farmer Meeting' },
                ]}
                className="w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Agenda / Topics</label>
            <Textarea
              placeholder="List primary meeting agenda points..."
              value={createForm.agenda}
              onChange={(e) => setCreateForm({ ...createForm, agenda: e.target.value })}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Real Registered Farmers Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Select Registered Farmers to Invite ({selectedFarmerIds.length} selected)
                </label>
                <span className="text-[11px] text-slate-500">
                  Real farmers from database roster with registration IDs and cell/village data.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSelectAllFarmers}
                disabled={isRosterLoading || filteredFarmers.length === 0 || isSubmittingMeeting}
                className="text-[11px] py-1"
              >
                {filteredFarmers.length > 0 && filteredFarmers.every((f) => selectedFarmerIds.includes(f.id)) ? 'Deselect page' : 'Select page'}
              </Button>
            </div>

            <Input
              placeholder="Filter by farmer name, registration ID, cell..."
              value={farmerSearch}
              onChange={(e) => { setFarmerSearch(e.target.value); setRosterPage(1); }}
              className="text-xs"
            />

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {isRosterLoading && <p role="status">Loading registered farmers...</p>}
              {!isRosterLoading && !rosterError && filteredFarmers.length === 0 && <p>{farmerSearch.trim() ? 'No farmers match this search. Try a different name or clear the search.' : 'No registered farmers are available yet. You can schedule the meeting and invite farmers later.'}</p>}
              {filteredFarmers.map((f) => {
                const isSelected = selectedFarmerIds.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                      isSelected ? 'bg-teal-100/70 border border-teal-300' : 'bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFarmer(f.id)}
                        disabled={isSubmittingMeeting || isRosterLoading}
                        className="rounded text-teal-700 focus:ring-teal-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{f.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {f.district}, {f.sector} · Cell: {f.cell} · Village: {f.village}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {f.registrationId}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs">
              <Button type="button" size="sm" variant="outline" disabled={isRosterLoading || rosterPage === 1} onClick={() => setRosterPage((page) => page - 1)}>Previous farmers</Button>
              <span>{rosterCount} matching farmers</span>
              <Button type="button" size="sm" variant="outline" disabled={isRosterLoading || rosterPage * 50 >= rosterCount} onClick={() => setRosterPage((page) => page + 1)}>Next farmers</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmittingMeeting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingMeeting}
              className="!bg-teal-700 font-bold"
            >
              {isSubmittingMeeting ? 'Creating Meeting...' : 'Schedule Meeting & Invite Farmers'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* INVITE MORE FARMERS MODAL */}
      {/* ============================================================== */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => { if (!isSubmittingInvite) setIsInviteModalOpen(false); }}
        title="Invite Additional Registered Farmers"
        size="md"
      >
        <form onSubmit={handleInviteFarmers} className="space-y-4">
          {feedbackError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{feedbackError}</p>}
          {rosterError && <div role="alert">{rosterError} <Button type="button" onClick={loadFarmerPage} disabled={isRosterLoading}>Retry farmer list</Button></div>}
          <Input placeholder="Search registered farmers..." value={farmerSearch} onChange={(event) => { setFarmerSearch(event.target.value); setRosterPage(1); }} />
          {isRosterLoading && <p role="status">Loading registered farmers...</p>}
          <p className="text-xs text-slate-600">
            Select additional registered farmers from the database to add to this meeting's attendance roster.
          </p>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
            {farmersRoster
              .filter((f) => !meetingDetail?.invitedFarmers?.some((inv) => inv.farmer.id === f.id))
              .map((f) => {
                const isSelected = inviteFarmerIds.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                      isSelected ? 'bg-teal-100 border border-teal-300' : 'bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isSubmittingInvite || isRosterLoading}
                        onChange={() =>
                          setInviteFarmerIds((prev) =>
                            prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id]
                          )
                        }
                      />
                      <div>
                        <div className="font-bold text-slate-900">{f.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {f.sector}, {f.cell}, {f.village}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-200 px-1 rounded">{f.registrationId}</span>
                  </label>
                );
              })}
          </div>

          <div className="flex items-center justify-between text-xs">
            <Button type="button" size="sm" variant="outline" disabled={isRosterLoading || rosterPage === 1} onClick={() => setRosterPage((page) => page - 1)}>Previous farmers</Button>
            <span>{rosterCount} matching farmers</span>
            <Button type="button" size="sm" variant="outline" disabled={isRosterLoading || rosterPage * 50 >= rosterCount} onClick={() => setRosterPage((page) => page + 1)}>Next farmers</Button>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" disabled={isSubmittingInvite} onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingInvite || inviteFarmerIds.length === 0}
              className="!bg-teal-700 font-bold"
            >
              {isSubmittingInvite ? 'Inviting...' : `Invite ${inviteFarmerIds.length} Farmer(s)`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
