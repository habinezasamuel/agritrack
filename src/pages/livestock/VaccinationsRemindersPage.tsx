import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import type { LivestockHealthRecord } from '../../types';

export function VaccinationsRemindersPage() {
  const { t } = useLanguage();
  const [records, setRecords] = useState<LivestockHealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await api.getLivestockHealthRecords();
        setRecords(data.filter((r) => r.nextDueDate));
      } catch (err) {
        console.error('Failed to load reminders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-teal-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 mb-2">
            💉 {t('vaccinationsReminders', 'Vaccinations & Reminders')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Vaccination & Veterinary Reminders</h1>
          <p className="text-indigo-100/80 text-sm mt-1">Track upcoming vaccination boosters, scheduled vet checkups, and routine animal care dates.</p>
        </div>
        <Link to="/livestock/records">
          <Button variant="primary" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg">
            + Schedule New Event
          </Button>
        </Link>
      </div>

      {/* Reminders List */}
      <Card variant="elevated">
        <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
          <h2 className="text-base font-bold text-slate-900">Active Schedules & Reminders ({records.length})</h2>
          <span className="text-xs font-semibold text-slate-400">Current Date: {todayStr}</span>
        </div>
        <CardBody className="p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading scheduled reminders...</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="text-4xl">💉</span>
              <h3 className="text-base font-bold text-slate-800 mt-2">No upcoming reminders scheduled</h3>
              <p className="text-xs text-slate-500 mt-1">All vaccinations and veterinary checkups are up to date.</p>
            </div>
          ) : (
            records.map((record) => {
              const isOverdue = record.nextDueDate && record.nextDueDate < todayStr;
              const isDueToday = record.nextDueDate === todayStr;

              return (
                <div
                  key={record.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                      isOverdue ? 'bg-rose-100 text-rose-800' : isDueToday ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {record.recordType === 'VACCINATION' ? '💉' : '🩺'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">{record.title}</span>
                        {isOverdue && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">OVERDUE</span>}
                        {isDueToday && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">DUE TODAY</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Target Animal: <strong className="text-slate-900">{record.animalTagId}</strong></p>
                      {record.veterinarianName && (
                        <p className="text-xs text-slate-500 mt-0.5">Attending Vet: {record.veterinarianName}</p>
                      )}
                      {record.details && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{record.details}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right flex-shrink-0 space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase block">Scheduled Date</span>
                    <span className="text-sm font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 inline-block">
                      {record.nextDueDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}
