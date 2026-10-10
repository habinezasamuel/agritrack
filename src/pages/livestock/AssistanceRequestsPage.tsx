import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Textarea, Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { api } from '../../services/api';
import type { AnimalDiseaseReport, FeedShortageReport } from '../../types';

export function AssistanceRequestsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [diseaseReports, setDiseaseReports] = useState<AnimalDiseaseReport[]>([]);
  const [feedShortages, setFeedShortages] = useState<FeedShortageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<'ALL' | 'DISEASE' | 'SHORTAGE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected detail state
  const [selectedDiseaseReport, setSelectedDiseaseReport] = useState<AnimalDiseaseReport | null>(null);
  const [selectedShortageReport, setSelectedShortageReport] = useState<FeedShortageReport | null>(null);

  // Officer review form state
  const [reviewStatus, setReviewStatus] = useState<string>('UNDER_REVIEW');
  const [vetRecommendation, setVetRecommendation] = useState('');
  const [recommendVisit, setRecommendVisit] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [diseases, shortages] = await Promise.all([
        api.getAnimalDiseaseReports(),
        api.getFeedShortageReports(),
      ]);
      setDiseaseReports(diseases);
      setFeedShortages(shortages);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openDiseaseDetail = (report: AnimalDiseaseReport) => {
    setSelectedDiseaseReport(report);
    setSelectedShortageReport(null);
    setReviewStatus(report.status);
    setVetRecommendation(report.veterinaryRecommendation || '');
    setRecommendVisit(report.recommendFarmVisit || false);
    setVisitDate(report.farmVisitDate || '');
  };

  const openShortageDetail = (report: FeedShortageReport) => {
    setSelectedShortageReport(report);
    setSelectedDiseaseReport(null);
    setReviewStatus(report.status);
    setOfficerNotes(report.officerNotes || '');
  };

  const handleUpdateDiseaseReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiseaseReport) return;
    try {
      setIsUpdating(true);
      const updated = await api.updateAnimalDiseaseReport(selectedDiseaseReport.id, {
        status: reviewStatus as any,
        veterinaryRecommendation: vetRecommendation,
        recommendFarmVisit: recommendVisit,
        farmVisitDate: visitDate || undefined,
        assignedOfficerName: user ? `${user.firstName} ${user.lastName}` : 'Dr. Jean-Paul Habimana',
      });

      setDiseaseReports((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setSelectedDiseaseReport(updated);
      setActionMessage('Disease report updated with officer recommendations.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update disease report:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateShortageReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShortageReport) return;
    try {
      setIsUpdating(true);
      const updated = await api.updateFeedShortageReport(selectedShortageReport.id, {
        status: reviewStatus as any,
        officerNotes: officerNotes,
        assignedOfficerName: user ? `${user.firstName} ${user.lastName}` : 'Agricultural Officer',
      });

      setFeedShortages((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setSelectedShortageReport(updated);
      setActionMessage('Shortage report updated with agricultural assistance plan.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update shortage report:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'EMERGENCY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">🚨 EMERGENCY</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">⚠️ High</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Medium</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-2">
            📢 {t('assistanceRequests', 'Reports & Assistance Requests')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Livestock Assistance Tracking & Review</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Track disease reports, pasture shortage requests, officer recommendations, and resolution status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/livestock/disease-reports/new">
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md">
              + Report Disease
            </Button>
          </Link>
          <Link to="/livestock/feed-shortages/new">
            <Button variant="outline" className="border-emerald-300/40 text-emerald-200 hover:bg-emerald-500/20 font-bold text-xs">
              + Report Feed Shortage
            </Button>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <Card variant="elevated">
        <CardBody className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTabFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tabFilter === 'ALL' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All Reports ({diseaseReports.length + feedShortages.length})
            </button>
            <button
              onClick={() => setTabFilter('DISEASE')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tabFilter === 'DISEASE' ? 'bg-rose-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              🩺 Disease Reports ({diseaseReports.length})
            </button>
            <button
              onClick={() => setTabFilter('SHORTAGE')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tabFilter === 'SHORTAGE' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              🌾 Feed Shortages ({feedShortages.length})
            </button>
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'UNDER_REVIEW', label: 'Under Review' },
                { value: 'ASSISTANCE_PROVIDED', label: 'Assistance Provided' },
                { value: 'RESOLVED', label: 'Resolved' },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {/* Reports List */}
      <Card variant="elevated">
        <div className="py-4 px-6 border-b border-slate-100/80 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Submitted Requests Log</h2>
          <span className="text-xs font-semibold text-slate-400">
            {diseaseReports.length + feedShortages.length} Requests
          </span>
        </div>
        <CardBody className="p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading requests...</div>
          ) : (
            <>
              {(tabFilter === 'ALL' || tabFilter === 'DISEASE') && diseaseReports.map((report) => {
                if (statusFilter !== 'ALL' && report.status !== statusFilter) return null;
                return (
                  <div
                    key={`d-${report.id}`}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {report.reportNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          🩺 Disease
                        </span>
                        {getUrgencyBadge(report.urgencyLevel)}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{report.animalTagId} ({report.animalType})</h3>
                      <p className="text-xs text-slate-600 line-clamp-2"><strong>Symptoms:</strong> {report.symptoms}</p>
                      <p className="text-[10px] text-slate-400">Farmer: {report.farmerName} • Farm: {report.location} • Submitted: {report.createdAt.split('T')[0]}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={report.status as any} />
                      <Button variant="outline" size="sm" onClick={() => openDiseaseDetail(report)} className="text-xs font-bold">
                        View & Review →
                      </Button>
                    </div>
                  </div>
                );
              })}

              {(tabFilter === 'ALL' || tabFilter === 'SHORTAGE') && feedShortages.map((report) => {
                if (statusFilter !== 'ALL' && report.status !== statusFilter) return null;
                return (
                  <div
                    key={`s-${report.id}`}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {report.reportNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          🌾 Feed Shortage
                        </span>
                        {getUrgencyBadge(report.urgencyLevel)}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{report.feedTypeNeeded}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">Need {report.estimatedQuantityRequired} for {report.animalType} ({report.numberAffected} animals affected)</p>
                      <p className="text-[10px] text-slate-400">Farmer: {report.farmerName} • Location: {report.location} • Submitted: {report.createdAt.split('T')[0]}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={report.status as any} />
                      <Button variant="outline" size="sm" onClick={() => openShortageDetail(report)} className="text-xs font-bold">
                        View & Review →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </CardBody>
      </Card>

      {/* Disease Report Detail & Officer Recommendation Modal */}
      {selectedDiseaseReport && (
        <Modal isOpen={Boolean(selectedDiseaseReport)} onClose={() => setSelectedDiseaseReport(null)} title={`Disease Report: ${selectedDiseaseReport.reportNumber}`}>
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-lg font-black text-slate-900 block">{selectedDiseaseReport.animalTagId}</span>
                <span className="text-xs font-semibold text-slate-500">{selectedDiseaseReport.animalType} • {selectedDiseaseReport.numberAffected} animal(s) affected</span>
              </div>
              <div className="flex items-center gap-2">
                {getUrgencyBadge(selectedDiseaseReport.urgencyLevel)}
                <StatusBadge status={selectedDiseaseReport.status as any} />
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p><strong>Farmer:</strong> {selectedDiseaseReport.farmerName} ({selectedDiseaseReport.farmerPhone})</p>
              <p><strong>Location:</strong> {selectedDiseaseReport.location}</p>
              <p><strong>Date Started:</strong> {selectedDiseaseReport.problemStartDate}</p>
              <p><strong>Symptoms:</strong> {selectedDiseaseReport.symptoms}</p>
              <p><strong>Full Description:</strong> {selectedDiseaseReport.description}</p>
            </div>

            {selectedDiseaseReport.evidenceUrl && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Uploaded Evidence Photo</span>
                <img src={selectedDiseaseReport.evidenceUrl} alt="Evidence" className="w-full h-48 object-cover rounded-2xl border border-slate-200" />
              </div>
            )}

            {/* Officer Action Area */}
            <form onSubmit={handleUpdateDiseaseReport} className="space-y-4 pt-3 border-t border-slate-200">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-2">
                  <span>🩺</span> Officer / Veterinary Recommendation Panel
                </h3>

                <div className="space-y-3">
                  <Select
                    label="Update Report Status"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    options={[
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'UNDER_REVIEW', label: 'Under Review by Vet Officer' },
                      { value: 'ASSISTANCE_PROVIDED', label: 'Assistance Provided / Prescription Given' },
                      { value: 'RESOLVED', label: 'Resolved' },
                    ]}
                  />

                  <Textarea
                    label="Official Veterinary Recommendation & Treatment Advice *"
                    placeholder="Enter prescribed medicine, quarantine instructions, rehydration advice, or diagnosis..."
                    value={vetRecommendation}
                    onChange={(e) => setVetRecommendation(e.target.value)}
                    rows={3}
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={recommendVisit}
                        onChange={(e) => setRecommendVisit(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                      <span>Schedule On-Site Veterinary Visit</span>
                    </label>
                  </div>

                  {recommendVisit && (
                    <Input
                      label="Scheduled Farm Visit Date"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setSelectedDiseaseReport(null)}>Close</Button>
                <Button type="submit" variant="primary" isLoading={isUpdating} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                  Save Officer Recommendation
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Feed Shortage Detail & Officer Action Modal */}
      {selectedShortageReport && (
        <Modal isOpen={Boolean(selectedShortageReport)} onClose={() => setSelectedShortageReport(null)} title={`Feed Shortage Report: ${selectedShortageReport.reportNumber}`}>
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-lg font-black text-slate-900 block">{selectedShortageReport.feedTypeNeeded}</span>
                <span className="text-xs font-semibold text-slate-500">{selectedShortageReport.animalType} • {selectedShortageReport.numberAffected} animals</span>
              </div>
              <div className="flex items-center gap-2">
                {getUrgencyBadge(selectedShortageReport.urgencyLevel)}
                <StatusBadge status={selectedShortageReport.status as any} />
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p><strong>Farmer:</strong> {selectedShortageReport.farmerName} ({selectedShortageReport.farmerPhone})</p>
              <p><strong>Location:</strong> {selectedShortageReport.location}</p>
              <p><strong>Estimated Quantity Required:</strong> {selectedShortageReport.estimatedQuantityRequired}</p>
              <p><strong>Date Started:</strong> {selectedShortageReport.shortageStartDate}</p>
              <p><strong>Shortage Description:</strong> {selectedShortageReport.description}</p>
            </div>

            {/* Agricultural Officer Action Area */}
            <form onSubmit={handleUpdateShortageReport} className="space-y-4 pt-3 border-t border-slate-200">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-2">
                  <span>🌾</span> Agricultural Officer Assistance Coordination
                </h3>

                <div className="space-y-3">
                  <Select
                    label="Update Request Status"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    options={[
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'UNDER_REVIEW', label: 'Under Review' },
                      { value: 'ASSISTANCE_COORDINATED', label: 'Assistance Coordinated / Feed Dispatched' },
                      { value: 'RESOLVED', label: 'Resolved' },
                    ]}
                  />

                  <Textarea
                    label="Officer Notes & Fodder Allocation Response *"
                    placeholder="Describe feed bank distribution, cooperative silage assistance, or delivery instructions..."
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setSelectedShortageReport(null)}>Close</Button>
                <Button type="submit" variant="primary" isLoading={isUpdating} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                  Save Assistance Notes
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
