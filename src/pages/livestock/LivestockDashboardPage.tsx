import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';
import type { 
  LivestockSummaryStats, 
  LivestockAnimal, 
  AnimalDiseaseReport, 
  FeedShortageReport,
  LivestockHealthRecord 
} from '../../types';

export function LivestockDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<LivestockSummaryStats | null>(null);
  const [animals, setAnimals] = useState<LivestockAnimal[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<AnimalDiseaseReport[]>([]);
  const [feedShortages, setFeedShortages] = useState<FeedShortageReport[]>([]);
  const [healthRecords, setHealthRecords] = useState<LivestockHealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [statsData, animalList, diseaseList, shortageList, recordList] = await Promise.all([
          api.getLivestockStats(),
          api.getLivestockAnimals(),
          api.getAnimalDiseaseReports(),
          api.getFeedShortageReports(),
          api.getLivestockHealthRecords(),
        ]);
        setStats(statsData);
        setAnimals(animalList);
        setDiseaseReports(diseaseList);
        setFeedShortages(shortageList);
        setHealthRecords(recordList);
      } catch (err) {
        console.error('Failed to load livestock data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const animalIcons: Record<string, string> = {
    cow: '🐄',
    goat: '🐐',
    sheep: '🐑',
    pig: '🐖',
    chicken: '🐓',
    rabbit: '🐇',
    other: '🐾',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">{t('loading', 'Loading livestock dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xs uppercase tracking-wider mb-3">
              <span>🐄</span> {t('livestockManagement', 'Livestock Management')}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t('welcomeBack', 'Welcome back')}, {user?.firstName || user?.username}!
            </h1>
            <p className="mt-2 text-emerald-100/80 text-sm sm:text-base leading-relaxed">
              Monitor {animals.length} registered farm animals, track health records, report animal diseases to veterinary officers, and report pasture/feed shortages in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/livestock/register">
              <Button variant="primary" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg border-0">
                + {t('registerAnimal', 'Register Animal')}
              </Button>
            </Link>
            <Link to="/livestock/disease-reports/new">
              <Button variant="outline" className="border-rose-300/40 text-rose-200 hover:bg-rose-500/20 hover:text-white font-bold">
                🩺 {t('reportAnimalDisease', 'Report Sick Animal')}
              </Button>
            </Link>
            <Link to="/livestock/feed-shortages/new">
              <Button variant="outline" className="border-emerald-300/40 text-emerald-200 hover:bg-emerald-500/20 hover:text-white font-bold">
                🌾 {t('reportFeedShortage', 'Report Feed Shortage')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card variant="elevated" className="border-l-4 border-l-emerald-600 hover:shadow-lg transition-all">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Animals</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{stats?.totalAnimals || 0} <span className="text-xs font-bold text-slate-400">batches</span></h3>
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  {stats?.totalHeadCount || 0} total animals registered
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shadow-sm">
                🐄
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" className="border-l-4 border-l-teal-600 hover:shadow-lg transition-all">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Health Breakdown</p>
                <h3 className="text-3xl font-black text-emerald-700 mt-1">{stats?.healthyCount || 0} <span className="text-xs font-extrabold text-slate-400">Healthy</span></h3>
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {stats?.sickCount || 0} reported sick • {stats?.underTreatmentCount || 0} under treatment
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl shadow-sm">
                🩺
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Assistance Requests</p>
                <h3 className="text-3xl font-black text-amber-600 mt-1">
                  {(stats?.openDiseaseReports || 0) + (stats?.openFeedShortages || 0)}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  {stats?.openDiseaseReports || 0} disease • {stats?.openFeedShortages || 0} feed shortages
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shadow-sm">
                📢
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="elevated" className="border-l-4 border-l-indigo-600 hover:shadow-lg transition-all">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Reminders</p>
                <h3 className="text-3xl font-black text-indigo-700 mt-1">{stats?.upcomingVaccinationsCount || 0}</h3>
                <p className="text-xs font-semibold text-indigo-600 mt-1">
                  Vaccinations & Vet checks due
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-2xl shadow-sm">
                💉
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Animal Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Livestock Types Distribution */}
        <Card variant="elevated" className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <h2 className="text-base font-bold text-slate-900">Livestock Composition by Type</h2>
            </div>
            <Link to="/livestock/animals" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              View All Animals →
            </Link>
          </div>
          <CardBody className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {['cow', 'goat', 'sheep', 'pig', 'chicken', 'rabbit'].map((type) => {
                const count = stats?.animalsByType[type] || 0;
                return (
                  <div key={type} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all">
                    <span className="text-3xl">{animalIcons[type] || '🐾'}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">{type}s</p>
                      <p className="text-xl font-black text-slate-900">{count} <span className="text-[10px] text-slate-400 font-semibold">head</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Quick Links & Emergency Contact */}
        <Card variant="elevated" className="bg-gradient-to-br from-rose-900 via-rose-950 to-slate-900 text-white">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/30 text-rose-200 flex items-center justify-center text-xl font-black">
                🚨
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Emergency Veterinary Alert</h3>
                <p className="text-xs text-rose-200/80">Immediate Professional Intervention</p>
              </div>
            </div>
            <p className="text-xs text-rose-100/90 leading-relaxed bg-white/10 p-3.5 rounded-xl border border-white/15">
              If an animal displays acute respiratory distress, severe bleeding, sudden collapse, or rapid disease spread, contact your Sector Veterinary Officer immediately.
            </p>
            <div className="pt-2 space-y-2">
              <Link to="/livestock/disease-reports/new" className="block w-full text-center py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-lg transition-all">
                Submit Emergency Disease Report
              </Link>
              <Link to="/livestock/requests" className="block w-full text-center py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-bold text-xs transition-all">
                Track My Submitted Reports
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Disease Reports & Shortage Requests Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Disease Reports */}
        <Card variant="elevated">
          <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🩺</span>
              <h2 className="text-base font-bold text-slate-900">Recent Disease Reports</h2>
            </div>
            <Link to="/livestock/disease-reports" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              View All →
            </Link>
          </div>
          <CardBody className="p-4 sm:p-5 space-y-3">
            {diseaseReports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No disease reports logged yet.</div>
            ) : (
              diseaseReports.slice(0, 4).map((report) => (
                <div key={report.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-rose-300 hover:shadow-xs transition-all duration-200 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{report.reportNumber}</span>
                      {getUrgencyBadge(report.urgencyLevel)}
                    </div>
                    <p className="text-xs font-extrabold text-slate-800 mt-1">{report.animalTagId} ({report.animalType})</p>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{report.symptoms}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Reported: {report.createdAt.split('T')[0]}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={report.status as any} />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Feed & Pasture Shortages */}
        <Card variant="elevated">
          <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <h2 className="text-base font-bold text-slate-900">Feed & Pasture Shortage Requests</h2>
            </div>
            <Link to="/livestock/feed-shortages" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              View All →
            </Link>
          </div>
          <CardBody className="p-4 sm:p-5 space-y-3">
            {feedShortages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No feed shortage requests logged yet.</div>
            ) : (
              feedShortages.slice(0, 4).map((report) => (
                <div key={report.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-xs transition-all duration-200 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{report.reportNumber}</span>
                      {getUrgencyBadge(report.urgencyLevel)}
                    </div>
                    <p className="text-xs font-extrabold text-slate-800 mt-1">{report.feedTypeNeeded}</p>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">Need: {report.estimatedQuantityRequired} for {report.animalType}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Reported: {report.createdAt.split('T')[0]}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={report.status as any} />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Health & Vaccination Reminders Preview */}
      <Card variant="elevated">
        <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">💉</span>
            <h2 className="text-base font-bold text-slate-900">Upcoming Health & Vaccination Reminders</h2>
          </div>
          <Link to="/livestock/vaccinations" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            Manage Reminders →
          </Link>
        </div>
        <CardBody className="p-4 sm:p-5 space-y-3">
          {healthRecords.filter(r => r.nextDueDate).length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No upcoming vaccination or vet reminders scheduled.</div>
          ) : (
            healthRecords.filter(r => r.nextDueDate).map((record) => (
              <div key={record.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all duration-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {record.recordType === 'VACCINATION' ? '💉' : '🩺'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{record.title}</p>
                    <p className="text-xs text-slate-500">Target: <span className="font-semibold text-slate-700">{record.animalTagId}</span></p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Due: {record.nextDueDate}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
