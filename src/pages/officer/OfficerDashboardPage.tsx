import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Textarea, Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { bananaService } from '../../services/bananaService';
import { OfficerMeetingAttendanceSection } from '../../components/officer/OfficerMeetingAttendanceSection';
import type { CropProblem, CropSeason, BananaAssistanceRequest, BananaDiseaseReport, AssistanceStatus } from '../../types';

export function OfficerDashboardPage() {
  const { user } = useAuth();
  const [assignedFarmers, setAssignedFarmers] = useState<{ id: string; name: string; fields: number }[]>([]);
  const [problems, setProblems] = useState<CropProblem[]>([]);
  const [bananaRequests, setBananaRequests] = useState<BananaAssistanceRequest[]>([]);
  const [bananaDiseases, setBananaDiseases] = useState<BananaDiseaseReport[]>([]);
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adviceModal, setAdviceModal] = useState<{ open: boolean; problem: CropProblem | null }>({ open: false, problem: null });
  const [bananaAdviceModal, setBananaAdviceModal] = useState<{ open: boolean; request: BananaAssistanceRequest | null }>({ open: false, request: null });

  const [adviceForm, setAdviceForm] = useState({
    advice: '',
    recommendedActions: '',
    followUpDate: '',
    isPublished: false,
  });

  const [bananaAdviceForm, setBananaAdviceForm] = useState({
    diagnosis: '',
    recommendations: '',
    actionTaken: '',
    status: 'IN_PROGRESS' as AssistanceStatus,
    recommendedProducts: '',
    followUpDate: format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchData();
    window.addEventListener('agritrack:banana-data-synced', fetchData);
    return () => {
      window.removeEventListener('agritrack:banana-data-synced', fetchData);
    };
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setBananaRequests(await bananaService.getAssistanceRequests());
      setBananaDiseases(await bananaService.getDiseaseReports());
      setAssignedFarmers([
        { id: '3', name: 'Paul Mukamana', fields: 2 },
        { id: '4', name: 'Marie Uwimana', fields: 1 },
        { id: 'farmer-1', name: 'Emmanuel Hakizimana', fields: 3 },
      ]);
      setSeasons([
        { id: '1', fieldId: '1', fieldName: 'Field A', cropTypeId: '1', cropTypeName: 'Rice', cropVarietyId: '1', cropVarietyName: 'IR 52', seasonId: '1', seasonName: '🌧️ Long rainy season', plantingMethod: 'TRANSPLANTING', plantingDate: '2024-03-15', plantedAreaHectares: 2.5, expectedGrowingDurationDays: 120, estimatedHarvestDate: '2024-07-13', status: 'ACTIVE', createdAt: '2024-02-10T00:00:00Z', updatedAt: '2024-02-10T00:00:00Z' },
        { id: '2', fieldId: '2', fieldName: 'Field B', cropTypeId: '2', cropTypeName: 'Maize', cropVarietyId: '3', cropVarietyName: 'SC 627', seasonId: '1', seasonName: '🌧️ Long rainy season', plantingMethod: 'DIRECT_SEEDING', plantingDate: '2024-03-01', plantedAreaHectares: 1.8, expectedGrowingDurationDays: 110, estimatedHarvestDate: '2024-06-19', status: 'ACTIVE', createdAt: '2024-02-25T00:00:00Z', updatedAt: '2024-02-25T00:00:00Z' },
      ]);
      setProblems([
        { id: '1', cropSeasonId: '1', reportedDate: '2024-04-10', problemType: 'PEST', severity: 'MEDIUM', description: 'Stem borer observed in northern section', affectedAreaHectares: 0.5, photos: [], reportedById: '3', reportedByName: 'Paul Mukamana', status: 'ADVICE_GIVEN', createdAt: '2024-04-10T00:00:00Z', updatedAt: '2024-04-10T00:00:00Z' },
        { id: '2', cropSeasonId: '2', reportedDate: '2024-05-01', problemType: 'WEED', severity: 'LOW', description: 'Weed pressure in section B', photos: [], reportedById: '4', reportedByName: 'Marie Uwimana', status: 'REPORTED', createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
        { id: '3', cropSeasonId: '1', reportedDate: '2024-05-08', problemType: 'WATER', severity: 'HIGH', description: 'Water drainage issue in lower field', affectedAreaHectares: 1.0, photos: [], reportedById: '3', reportedByName: 'Paul Mukamana', status: 'UNDER_REVIEW', createdAt: '2024-05-08T00:00:00Z', updatedAt: '2024-05-08T00:00:00Z' },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAdvice = (problem: CropProblem) => {
    setAdviceModal({ open: true, problem });
    setAdviceForm({ advice: '', recommendedActions: '', followUpDate: '', isPublished: false });
  };

  const handleAdviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adviceModal.problem || !adviceForm.advice) return;

    setProblems((prev) =>
      prev.map((p) =>
        p.id === adviceModal.problem?.id
          ? { ...p, status: 'ADVICE_GIVEN', updatedAt: new Date().toISOString() }
          : p
      )
    );

    setAdviceModal({ open: false, problem: null });
  };

  const openBananaAdvice = (req: BananaAssistanceRequest) => {
    setBananaAdviceModal({ open: true, request: req });
    setBananaAdviceForm({
      diagnosis: req.adviceHistory[0]?.diagnosis || '',
      recommendations: req.adviceHistory[0]?.recommendations || '',
      actionTaken: req.actionTaken || '',
      status: req.status === 'PENDING' ? 'IN_PROGRESS' : req.status,
      recommendedProducts: req.adviceHistory[0]?.recommendedProducts?.join(', ') || '',
      followUpDate: format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'),
    });
  };

  const handleBananaAdviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bananaAdviceModal.request || !bananaAdviceForm.recommendations) return;

    const products = bananaAdviceForm.recommendedProducts
      ? bananaAdviceForm.recommendedProducts.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    await bananaService.addOfficerAdvice(
      bananaAdviceModal.request.id,
      {
        officerId: user?.id || 'off-1',
        officerName: user ? `${user.firstName} ${user.lastName}` : 'Agricultural Officer',
        officerRole: 'Sector Agronomist',
        adviceDate: format(new Date(), 'yyyy-MM-dd'),
        diagnosis: bananaAdviceForm.diagnosis || 'Field inspection diagnosis provided',
        recommendations: bananaAdviceForm.recommendations,
        actionTaken: bananaAdviceForm.actionTaken || 'Recorded officer agronomic recommendations',
        recommendedProducts: products,
        followUpDate: bananaAdviceForm.followUpDate,
      },
      bananaAdviceForm.status
    );

    setBananaRequests(await bananaService.getAssistanceRequests());
    setBananaDiseases(await bananaService.getDiseaseReports());
    setBananaAdviceModal({ open: false, request: null });
  };

  const problemColumns: Column<CropProblem>[] = [
    { key: 'problemType', header: 'Type', className: 'whitespace-nowrap', render: (row) => <Badge variant="danger">{row.problemType}</Badge> },
    { key: 'severity', header: 'Severity', className: 'whitespace-nowrap', render: (row) => <Badge variant={row.severity === 'CRITICAL' ? 'danger' : row.severity === 'HIGH' ? 'warning' : 'info'}>{row.severity}</Badge> },
    { key: 'reportedByName', header: 'Farmer', className: 'min-w-[150px] font-semibold' },
    { key: 'reportedDate', header: 'Reported', className: 'whitespace-nowrap', render: (row) => format(parseISO(row.reportedDate), 'MMM dd, yyyy') },
    { key: 'description', header: 'Description', className: 'min-w-[260px] text-slate-600' },
    { key: 'affectedAreaHectares', header: 'Affected Area', className: 'whitespace-nowrap', render: (row) => row.affectedAreaHectares ? `${row.affectedAreaHectares} ha` : '-' },
    { key: 'status', header: 'Status', className: 'whitespace-nowrap', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: 'Actions', className: 'whitespace-nowrap', render: (row) => (
      <div className="flex items-center gap-2">
        {row.status !== 'RESOLVED' && (
          <Button size="sm" variant="outline" onClick={() => openAdvice(row)}>Give Advice</Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Agriculture Officer Portal Identity Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042f2e] via-[#0d5c56] to-[#0f766e] text-white p-6 sm:p-7 shadow-xl border border-teal-600/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30 mb-2">
              🌱 Agriculture Officer Portal • Extension & Agronomy Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Good morning, {user?.firstName || 'Officer'}!
            </h1>
            <p className="text-teal-100/80 text-sm mt-1 max-w-2xl">
              Manage assigned farmers, monitor field crop health, prescribe agronomic solutions, and coordinate agricultural inputs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-teal-100 backdrop-blur-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-300 animate-pulse" />
              <span>Agronomy Desk Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="default" padding="md" className="card-hover border-l-4 border-l-sky-500">
          <div className="flex items-center gap-4">
            <div className="stat-icon bg-[var(--agri-info-light)] text-[var(--agri-info)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--agri-text-muted)] uppercase tracking-wide">Assigned Farmers</p>
              <p className="text-2xl font-bold text-[var(--agri-text)]">{assignedFarmers.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md" className="card-hover border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4">
            <div className="stat-icon bg-[var(--agri-success-light)] text-[var(--agri-primary)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--agri-text-muted)] uppercase tracking-wide">Active Crop Seasons</p>
              <p className="text-2xl font-bold text-[var(--agri-primary)]">{seasons.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md" className="card-hover border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">🍌</span>
            <div>
              <p className="text-xs font-semibold text-[var(--agri-text-muted)] uppercase tracking-wide">Banana Requests & Diseases</p>
              <p className="text-2xl font-bold text-amber-900">{bananaRequests.length} <span className="text-xs font-normal text-amber-700">({bananaDiseases.length} reports)</span></p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md" className="card-hover border-l-4 border-l-rose-500">
          <div className="flex items-center gap-4">
            <div className="stat-icon bg-[var(--agri-danger-light)] text-[var(--agri-danger-text)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--agri-text-muted)] uppercase tracking-wide">Open Problems</p>
              <p className="text-2xl font-bold text-[var(--agri-danger-text)]">
                {problems.filter((p) => p.status !== 'RESOLVED').length + bananaRequests.filter((r) => r.status !== 'RESOLVED').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 📋 Officer-Generated Attendance & Meeting Management */}
      <OfficerMeetingAttendanceSection />

      {/* 🍌 Banana Disease & Assistance Requests Review Card */}
      <Card variant="default" padding="none" className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-emerald-50/60 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              🍌 Banana Disease & Weather Support Requests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review photos, severity, farmer location, prescribe recommendations and update resolution status.
            </p>
          </div>
          <span className="rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-950">
            {bananaRequests.filter((r) => r.status !== 'RESOLVED').length} Pending Action
          </span>
        </div>
        <CardBody className="p-4 sm:p-6">
          <Table
            columns={[
              {
                key: 'requestNumber',
                header: 'Request / Date',
                className: 'whitespace-nowrap',
                render: (row: BananaAssistanceRequest) => (
                  <div>
                    <strong className="block text-slate-900 text-xs">{row.requestNumber}</strong>
                    <span className="text-[11px] text-slate-400">{row.requestedDate}</span>
                  </div>
                ),
              },
              {
                key: 'plantationName',
                header: 'Plantation',
                render: (row: BananaAssistanceRequest) => (
                  <div>
                    <strong className="text-xs text-slate-900 block">{row.plantationName}</strong>
                    <span className="text-[11px] text-slate-500">Farmer: {row.farmerName} ({row.farmerPhone})</span>
                  </div>
                ),
              },
              {
                key: 'title',
                header: 'Problem / Incident',
                render: (row: BananaAssistanceRequest) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{row.title}</span>
                      <span
                        className={clsx(
                          'rounded px-1.5 py-0.5 text-[10px] font-black uppercase',
                          row.urgency === 'CRITICAL' && 'bg-rose-100 text-rose-800',
                          row.urgency === 'HIGH' && 'bg-amber-100 text-amber-800',
                          row.urgency === 'MEDIUM' && 'bg-yellow-100 text-yellow-800',
                          row.urgency === 'LOW' && 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {row.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{row.description}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row: BananaAssistanceRequest) => (
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase',
                      row.status === 'RESOLVED' && 'bg-emerald-100 text-emerald-800',
                      row.status === 'IN_PROGRESS' && 'bg-purple-100 text-purple-800',
                      row.status === 'UNDER_REVIEW' && 'bg-blue-100 text-blue-800',
                      row.status === 'PENDING' && 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {row.status}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'whitespace-nowrap',
                render: (row: BananaAssistanceRequest) => (
                  <Button
                    size="sm"
                    variant="primary"
                    className="!bg-emerald-700"
                    onClick={() => openBananaAdvice(row)}
                  >
                    {row.status === 'RESOLVED' ? 'View Advice' : 'Prescribe Advice →'}
                  </Button>
                ),
              },
            ]}
            data={bananaRequests}
            keyExtractor={(row) => row.id}
            emptyMessage="No pending banana requests."
            hoverable
          />
        </CardBody>
      </Card>

      <Card variant="default" padding="none">
        <CardHeader title="General Crop Problems & Seasonal Support Requests" subtitle={`${problems.length} total report(s) • Prioritize farmer support`} className="mb-0 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6" />
        <CardBody className="p-4 sm:p-6">
          <Table
            columns={problemColumns}
            data={problems}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No crop problems reported."
            hoverable
          />
        </CardBody>
      </Card>

      {/* General Advice Modal */}
      <Modal isOpen={adviceModal.open} onClose={() => setAdviceModal({ open: false, problem: null })} title="Record Advice & Recommendations" size="lg">
        {adviceModal.problem && (
          <form onSubmit={handleAdviceSubmit} className="space-y-4">
            <div className="bg-[var(--agri-surface-alt)] rounded-xl p-4 border border-[var(--agri-border)]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[var(--agri-text-muted)] uppercase tracking-wider font-semibold">Problem Type</p>
                  <p className="font-semibold text-[var(--agri-text)]">{adviceModal.problem.problemType} - {adviceModal.problem.severity}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--agri-text-muted)] uppercase tracking-wider font-semibold">Farmer</p>
                  <p className="font-semibold text-[var(--agri-text)]">{adviceModal.problem.reportedByName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[var(--agri-text-muted)] uppercase tracking-wider font-semibold">Description</p>
                  <p className="font-medium text-[var(--agri-text)]">{adviceModal.problem.description}</p>
                </div>
              </div>
            </div>

            <Textarea
              label="Advice"
              required
              rows={4}
              value={adviceForm.advice}
              onChange={(e) => setAdviceForm((prev) => ({ ...prev, advice: e.target.value }))}
              placeholder="Provide your professional agricultural advice..."
            />

            <Textarea
              label="Recommended Actions"
              rows={3}
              value={adviceForm.recommendedActions}
              onChange={(e) => setAdviceForm((prev) => ({ ...prev, recommendedActions: e.target.value }))}
              placeholder="List specific actions the farmer should take..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--agri-text)] mb-1">Follow-up Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-[var(--agri-border)] p-2.5 bg-white text-[var(--agri-text)] focus:ring-2 focus:ring-[var(--agri-primary)]"
                  value={adviceForm.followUpDate}
                  onChange={(e) => setAdviceForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[var(--agri-primary)] border-[var(--agri-border)] rounded focus:ring-[var(--agri-primary)]"
                    checked={adviceForm.isPublished}
                    onChange={(e) => setAdviceForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  />
                  <span className="text-sm font-semibold text-[var(--agri-text)]">Publish advice to farmer</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--agri-border)]">
              <Button type="button" variant="ghost" onClick={() => setAdviceModal({ open: false, problem: null })}>Cancel</Button>
              <Button type="submit">Save Advice</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 🍌 Banana Officer Advice & Diagnosis Prescription Modal */}
      {bananaAdviceModal.open && bananaAdviceModal.request && (
        <Modal
          isOpen={true}
          onClose={() => setBananaAdviceModal({ open: false, request: null })}
          title={`🍌 Prescribe Banana Advice • ${bananaAdviceModal.request.requestNumber}`}
          size="lg"
        >
          <form onSubmit={handleBananaAdviceSubmit} className="space-y-4">
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{bananaAdviceModal.request.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{bananaAdviceModal.request.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Field: <strong>{bananaAdviceModal.request.plantationName}</strong> • Farmer: <strong>{bananaAdviceModal.request.farmerName}</strong> ({bananaAdviceModal.request.farmerPhone})
                  </p>
                </div>
                {bananaAdviceModal.request.photos.length > 0 && (
                  <img
                    src={bananaAdviceModal.request.photos[0]}
                    alt="Problem attachment"
                    className="w-16 h-16 rounded-xl object-cover border border-amber-300"
                  />
                )}
              </div>
            </div>

            <Input
              label="Agronomic Diagnosis / Disease Identification"
              placeholder="e.g. Confirmed early stage Banana Bacterial Wilt (BXW)"
              value={bananaAdviceForm.diagnosis}
              onChange={(e) => setBananaAdviceForm({ ...bananaAdviceForm, diagnosis: e.target.value })}
              required
            />

            <Textarea
              label="Step-by-Step Officer Recommendations"
              placeholder="1. Tool disinfection with 20% Jik. 2. Remove male buds with wooden fork. 3. Uproot & bury infected pseudostem..."
              value={bananaAdviceForm.recommendations}
              onChange={(e) => setBananaAdviceForm({ ...bananaAdviceForm, recommendations: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recommended Products / Tools (comma separated)"
                placeholder="e.g. Jik Household Bleach, Copper Fungicide 50WP, Bamboo Stakes"
                value={bananaAdviceForm.recommendedProducts}
                onChange={(e) => setBananaAdviceForm({ ...bananaAdviceForm, recommendedProducts: e.target.value })}
              />
              <Input
                label="Action Taken / Field Visit Summary"
                placeholder="e.g. Visited farm on April 16, marked quarantine boundary"
                value={bananaAdviceForm.actionTaken}
                onChange={(e) => setBananaAdviceForm({ ...bananaAdviceForm, actionTaken: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Update Request Status"
                value={bananaAdviceForm.status}
                onChange={(e) => setBananaAdviceForm({ ...bananaAdviceForm, status: e.target.value as AssistanceStatus })}
                options={[
                  { value: 'UNDER_REVIEW', label: 'Under Review' },
                  { value: 'IN_PROGRESS', label: 'In Progress (Treatment Active)' },
                  { value: 'RESOLVED', label: 'Resolved (Problem Cleared)' },
                  { value: 'REJECTED', label: 'Rejected (Non-actionable)' },
                ]}
                required
              />
              <Input
                label="Scheduled Follow-up Date"
                type="date"
                value={bananaAdviceForm.followUpDate}
                onChange={(e) => setBananaAdviceForm({ ...bananaAdviceForm, followUpDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setBananaAdviceModal({ open: false, request: null })}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="!bg-emerald-700">
                Send Advice & Update Status ✓
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}