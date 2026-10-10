import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import type { LivestockHealthRecord, LivestockAnimal, LivestockRecordType } from '../../types';

export function AnimalHealthRecordsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [records, setRecords] = useState<LivestockHealthRecord[]>([]);
  const [animals, setAnimals] = useState<LivestockAnimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal state for adding a record
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [recordType, setRecordType] = useState<LivestockRecordType>('VACCINATION');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [prescribedMedicine, setPrescribedMedicine] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [costRwf, setCostRwf] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const [recordList, animalList] = await Promise.all([
        api.getLivestockHealthRecords(),
        api.getLivestockAnimals(),
      ]);
      setRecords(recordList);
      setAnimals(animalList);
      if (animalList.length > 0) {
        setSelectedAnimalId(animalList[0].id);
      }
    } catch (err) {
      console.error('Failed to load health records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    const animal = animals.find((a) => a.id === selectedAnimalId);
    const animalTagId = animal ? animal.tagId : 'General Herd';

    try {
      setIsSaving(true);
      const created = await api.createLivestockHealthRecord({
        animalId: selectedAnimalId || '1',
        animalTagId,
        farmerId: user?.id || '3',
        recordType,
        date,
        title: title.trim(),
        details: details.trim(),
        veterinarianName: veterinarianName.trim() || undefined,
        prescribedMedicine: prescribedMedicine.trim() || undefined,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit: unit.trim() || undefined,
        costRwf: costRwf ? parseFloat(costRwf) : undefined,
        nextDueDate: nextDueDate || undefined,
        reminderActive: Boolean(nextDueDate),
      });

      setRecords((prev) => [created, ...prev]);
      setActionMessage('Health and feeding record logged successfully.');
      setIsAddOpen(false);
      // Reset
      setTitle('');
      setDetails('');
      setVeterinarianName('');
      setPrescribedMedicine('');
      setQuantity('');
      setCostRwf('');
      setNextDueDate('');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save health record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filterType !== 'ALL' && r.recordType !== filterType) return false;
    return true;
  });

  const getRecordTypeBadge = (type: LivestockRecordType) => {
    switch (type) {
      case 'VACCINATION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">💉 Vaccination</span>;
      case 'VET_VISIT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">🩺 Vet Visit</span>;
      case 'TREATMENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">💊 Treatment</span>;
      case 'FEEDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🌾 Feeding Schedule</span>;
      case 'PRODUCTION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🥛 Yield / Production</span>;
      case 'BIRTH_DEATH':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">🐣 Birth / Death</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">🛒 Purchase / Sale</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-2">
            📋 {t('animalHealthRecords', 'Health & Production Records')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Livestock Health, Feeding & Production Log</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Record vaccinations, vet visits, prescribed treatments, feeding schedules, births/deaths, and milk/egg yields.</p>
        </div>
        <Button variant="primary" onClick={() => setIsAddOpen(true)} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg">
          + Add New Record
        </Button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <Card variant="elevated">
        <CardBody className="p-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {[
              { type: 'ALL', label: 'All Records' },
              { type: 'VACCINATION', label: '💉 Vaccinations' },
              { type: 'VET_VISIT', label: '🩺 Vet Visits' },
              { type: 'TREATMENT', label: '💊 Treatments' },
              { type: 'FEEDING', label: '🌾 Feeding' },
              { type: 'PRODUCTION', label: '🥛 Production Yields' },
              { type: 'BIRTH_DEATH', label: '🐣 Birth / Death' },
              { type: 'PURCHASE_SALE', label: '🛒 Trade / Sales' },
            ].map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setFilterType(tab.type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  filterType === tab.type
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Records Table / Cards */}
      <Card variant="elevated">
        <div className="flex items-center justify-between border-b border-slate-100 py-4 px-6">
          <h2 className="text-base font-bold text-slate-900">Recorded Health & Production Log ({filteredRecords.length})</h2>
          <span className="text-xs font-semibold text-slate-400">Sorted by newest date</span>
        </div>
        <CardBody className="p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="text-4xl">📋</span>
              <p className="mt-2 text-sm font-bold text-slate-700">No records found for this category.</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getRecordTypeBadge(record.recordType)}
                    <span className="text-xs font-bold text-slate-500">• {record.date}</span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {record.animalTagId}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{record.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{record.details}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    {record.veterinarianName && (
                      <span><strong>Doctor:</strong> {record.veterinarianName}</span>
                    )}
                    {record.prescribedMedicine && (
                      <span><strong>Medicine:</strong> {record.prescribedMedicine}</span>
                    )}
                    {record.quantity && (
                      <span className="font-bold text-emerald-700"><strong>Yield / Qty:</strong> {record.quantity} {record.unit || ''}</span>
                    )}
                    {record.costRwf && (
                      <span><strong>Cost:</strong> RWF {record.costRwf.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {record.nextDueDate && (
                  <div className="sm:text-right flex-shrink-0 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">Next Schedule / Due</span>
                    <span className="text-xs font-black text-indigo-900">{record.nextDueDate}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Add Record Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Health, Feeding or Production Record">
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Animal *</label>
              <Select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                options={animals.map((a) => ({
                  value: a.id,
                  label: `${a.tagId} (${a.animalType.toUpperCase()})`,
                }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Record Type *</label>
              <Select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as LivestockRecordType)}
                options={[
                  { value: 'VACCINATION', label: '💉 Vaccination' },
                  { value: 'VET_VISIT', label: '🩺 Vet Visit' },
                  { value: 'TREATMENT', label: '💊 Prescribed Treatment' },
                  { value: 'FEEDING', label: '🌾 Feeding Schedule' },
                  { value: 'PRODUCTION', label: '🥛 Production (Milk, Eggs, etc.)' },
                  { value: 'BIRTH_DEATH', label: '🐣 Birth or Death' },
                  { value: 'PURCHASE_SALE', label: '🛒 Purchase or Sale' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Record Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Input label="Title / Event Name *" placeholder="e.g. FMD Booster, Daily Milk Yield, Deworming" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <Textarea label="Record Details & Observations *" placeholder="Provide full details of the veterinary exam, feeding quantity, or treatment dosage..." value={details} onChange={(e) => setDetails(e.target.value)} rows={3} required />

          {(recordType === 'VACCINATION' || recordType === 'VET_VISIT' || recordType === 'TREATMENT') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Input label="Veterinarian Name" placeholder="e.g. Dr. Jean-Paul Habimana" value={veterinarianName} onChange={(e) => setVeterinarianName(e.target.value)} />
              <Input label="Prescribed Medicine" placeholder="e.g. Antibiotic / Dewormer" value={prescribedMedicine} onChange={(e) => setPrescribedMedicine(e.target.value)} />
            </div>
          )}

          {(recordType === 'PRODUCTION' || recordType === 'FEEDING' || recordType === 'PURCHASE_SALE') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <Input label="Quantity" type="number" placeholder="e.g. 24" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <Input label="Unit" placeholder="e.g. Liters, Eggs, KG" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input label="Cost / Value (RWF)" type="number" placeholder="e.g. 5000" value={costRwf} onChange={(e) => setCostRwf(e.target.value)} />
            </div>
          )}

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
            <Input label="Next Due Date / Next Scheduled Activity (Reminder)" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            <p className="text-[10px] text-indigo-700 mt-1 font-semibold">Setting a next due date automatically generates a reminder in your Livestock Dashboard.</p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSaving} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">Save Health Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
