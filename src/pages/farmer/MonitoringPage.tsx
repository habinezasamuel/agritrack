import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Input';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { FileUpload } from '../../components/common/FileUpload';
import type {
  CropSeason,
  GrowthObservation,
  GrowthStage,
  Activity,
  ActivityType,
  WaterRecord,
  CropProblem,
} from '../../types';
import { farmService } from '../../services/farmService';

type MonitoringTab = 'observations' | 'activities' | 'water' | 'problems';

const GROWTH_STAGES: { value: GrowthStage; label: string }[] = [
  { value: 'NURSERY', label: 'Nursery' },
  { value: 'TRANSPLANTING', label: 'Transplanting' },
  { value: 'TILLERING', label: 'Tillering' },
  { value: 'PANICLE_INITIATION', label: 'Panicle Initiation' },
  { value: 'FLOWERING', label: 'Flowering' },
  { value: 'GRAIN_FILLING', label: 'Grain Filling' },
  { value: 'MATURITY', label: 'Maturity' },
  { value: 'HARVESTING', label: 'Harvesting' },
  { value: 'LAND_PREPARATION', label: 'Land Preparation' },
  { value: 'PLANTING', label: 'Planting' },
  { value: 'VEGETATIVE', label: 'Vegetative' },
  { value: 'REPRODUCTIVE', label: 'Reproductive' },
  { value: 'RIPENING', label: 'Ripening' },
];

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'LAND_PREPARATION', label: 'Land Preparation' },
  { value: 'PLANTING', label: 'Planting' },
  { value: 'IRRIGATION', label: 'Irrigation' },
  { value: 'FERTILIZER_APPLICATION', label: 'Fertilizer Application' },
  { value: 'WEEDING', label: 'Weeding' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'DISEASE_CONTROL', label: 'Disease Control' },
  { value: 'HARVESTING', label: 'Harvesting' },
  { value: 'POST_HARVEST', label: 'Post Harvest' },
  { value: 'OTHER', label: 'Other' },
];

const WATER_CONDITIONS = [
  { value: 'FLOODED', label: 'Flooded' },
  { value: 'SATURATED', label: 'Saturated' },
  { value: 'MOIST', label: 'Moist' },
  { value: 'DRY', label: 'Dry' },
  { value: 'DRAINED', label: 'Drained' },
];

const PROBLEM_TYPES = [
  { value: 'PEST', label: 'Pest' },
  { value: 'DISEASE', label: 'Disease' },
  { value: 'WEED', label: 'Weed' },
  { value: 'WATER', label: 'Water' },
  { value: 'NUTRIENT', label: 'Nutrient' },
  { value: 'WEATHER', label: 'Weather' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('observations');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [observations, setObservations] = useState<GrowthObservation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [problems, setProblems] = useState<CropProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<null | 'observation' | 'activity' | 'water' | 'problem'>(null);

  const [observationForm, setObservationForm] = useState({
    stage: '' as GrowthStage | '',
    observedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [activityForm, setActivityForm] = useState({
    type: '' as ActivityType | '',
    activityDate: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
  });

  const [waterForm, setWaterForm] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    waterDepthCm: '',
    waterCondition: 'MOIST' as WaterRecord['waterCondition'],
    notes: '',
  });

  const [problemForm, setProblemForm] = useState({
    problemType: '' as CropProblem['problemType'] | '',
    severity: 'MEDIUM' as CropProblem['severity'],
    description: '',
    affectedAreaHectares: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [seasonsRes, observationsRes, activitiesRes, waterRes, problemsRes] = await Promise.all([
        farmService.getCropSeasons(),
        farmService.getGrowthObservations(),
        farmService.getActivities(),
        farmService.getWaterRecords(),
        farmService.getCropProblems(),
      ]);
      setSeasons(seasonsRes);
      setSelectedSeasonId(seasonsRes[0]?.id || '');
      setObservations(observationsRes);
      setActivities(activitiesRes);
      setWaterRecords(waterRes);
      setProblems(problemsRes);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);

  const handleObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationForm.stage || !observationForm.observedDate || !selectedSeasonId) return;

    try {
      const created = await farmService.createGrowthObservation({
        cropSeasonId: selectedSeasonId,
        stage: observationForm.stage,
        observedDate: observationForm.observedDate,
        notes: observationForm.notes,
      });
      setObservations((prev) => [created, ...prev]);
      setModalType(null);
      setObservationForm({ stage: '', observedDate: new Date().toISOString().split('T')[0], notes: '' });
    } catch (error) {
      console.error('Failed to save observation:', error);
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.type || !activityForm.activityDate || !selectedSeasonId) return;

    try {
      const created = await farmService.createActivity({
        cropSeasonId: selectedSeasonId,
        type: activityForm.type,
        activityDate: activityForm.activityDate,
        description: activityForm.description,
        cost: activityForm.cost ? parseFloat(activityForm.cost) : undefined,
      });
      setActivities((prev) => [created, ...prev]);
      setModalType(null);
      setActivityForm({ type: '', activityDate: new Date().toISOString().split('T')[0], description: '', cost: '' });
    } catch (error) {
      console.error('Failed to save activity:', error);
    }
  };

  const handleWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterForm.recordDate || !waterForm.waterDepthCm || !selectedSeasonId) return;

    try {
      const created = await farmService.createWaterRecord({
        cropSeasonId: selectedSeasonId,
        recordDate: waterForm.recordDate,
        waterDepthCm: parseFloat(waterForm.waterDepthCm),
        waterCondition: waterForm.waterCondition,
        notes: waterForm.notes,
      });
      setWaterRecords((prev) => [created, ...prev]);
      setModalType(null);
      setWaterForm({ recordDate: new Date().toISOString().split('T')[0], waterDepthCm: '', waterCondition: 'MOIST', notes: '' });
    } catch (error) {
      console.error('Failed to save water record:', error);
    }
  };

  const handleProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemForm.problemType || !problemForm.description || !selectedSeasonId) return;

    try {
      const created = await farmService.createCropProblem({
        cropSeasonId: selectedSeasonId,
        problemType: problemForm.problemType,
        severity: problemForm.severity,
        description: problemForm.description,
        affectedAreaHectares: problemForm.affectedAreaHectares ? parseFloat(problemForm.affectedAreaHectares) : undefined,
      });
      setProblems((prev) => [created, ...prev]);
      setModalType(null);
      setProblemForm({ problemType: '', severity: 'MEDIUM', description: '', affectedAreaHectares: '' });
    } catch (error) {
      console.error('Failed to report problem:', error);
    }
  };

  const observationColumns: Column<GrowthObservation>[] = [
    { key: 'stage', header: 'Growth Stage', render: (row) => <Badge variant="primary">{GROWTH_STAGES.find((s) => s.value === row.stage)?.label || row.stage}</Badge> },
    { key: 'observedDate', header: 'Date', render: (row) => format(parseISO(row.observedDate), 'MMM dd, yyyy') },
    { key: 'notes', header: 'Notes' },
    { key: 'recordedByName', header: 'Recorded By' },
  ];

  const activityColumns: Column<Activity>[] = [
    { key: 'type', header: 'Activity', render: (row) => <Badge variant="info">{ACTIVITY_TYPES.find((t) => t.value === row.type)?.label || row.type}</Badge> },
    { key: 'activityDate', header: 'Date', render: (row) => format(parseISO(row.activityDate), 'MMM dd, yyyy') },
    { key: 'description', header: 'Description' },
    { key: 'cost', header: 'Cost (RWF)', render: (row) => row.cost ? row.cost.toLocaleString() : '-' },
    { key: 'performedByName', header: 'Performed By' },
  ];

  const waterColumns: Column<WaterRecord>[] = [
    { key: 'recordDate', header: 'Date', render: (row) => format(parseISO(row.recordDate), 'MMM dd, yyyy') },
    { key: 'waterDepthCm', header: 'Depth (cm)', render: (row) => `${row.waterDepthCm} cm` },
    { key: 'waterCondition', header: 'Condition', render: (row) => <Badge variant={row.waterCondition === 'FLOODED' ? 'info' : row.waterCondition === 'DRY' ? 'warning' : 'success'}>{WATER_CONDITIONS.find((c) => c.value === row.waterCondition)?.label}</Badge> },
    { key: 'notes', header: 'Notes' },
    { key: 'recordedByName', header: 'Recorded By' },
  ];

  const problemColumns: Column<CropProblem>[] = [
    { key: 'problemType', header: 'Type', render: (row) => <Badge variant="danger">{PROBLEM_TYPES.find((t) => t.value === row.problemType)?.label || row.problemType}</Badge> },
    { key: 'severity', header: 'Severity', render: (row) => <Badge variant={row.severity === 'CRITICAL' ? 'danger' : row.severity === 'HIGH' ? 'warning' : 'info'}>{row.severity}</Badge> },
    { key: 'reportedDate', header: 'Reported', render: (row) => format(parseISO(row.reportedDate), 'MMM dd, yyyy') },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const tabs: { id: MonitoringTab; label: string; count: number; icon: string }[] = [
    { id: 'observations', label: 'Growth Observations', count: observations.length, icon: 'bi-eye-fill' },
    { id: 'activities', label: 'Field Activities', count: activities.length, icon: 'bi-activity' },
    { id: 'water', label: 'Water Records', count: waterRecords.length, icon: 'bi-droplet-fill' },
    { id: 'problems', label: 'Incidents & Alerts', count: problems.length, icon: 'bi-exclamation-triangle-fill' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-2 backdrop-blur-xs">
            <i className="bi bi-shield-check"></i> Field Agronomy Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Crop Field Monitoring</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Record stage observations, track irrigation & weeding activities, measure water levels, and report pest issues.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            options={seasons.map((s) => ({ value: s.id, label: `🌾 ${s.cropTypeName} (${s.fieldName})` }))}
            className="w-full sm:w-64 bg-white/10 text-white border-white/20"
            aria-label="Select crop season"
          />
          <Button 
            variant="primary" 
            size="md"
            onClick={() => setModalType(activeTab as 'observation' | 'activity' | 'water' | 'problem')}
            leftIcon={<i className="bi bi-plus-circle-fill"></i>}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold border-0 shadow-glow-primary whitespace-nowrap"
          >
            Add Record
          </Button>
        </div>
      </div>

      {selectedSeason && (
        <Card variant="glass" padding="lg" className="border-l-4 border-l-emerald-600">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold shadow-xs">
                <i className="bi bi-flower2"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">{selectedSeason.cropTypeName} <span className="text-emerald-700">({selectedSeason.cropVarietyName})</span></h3>
                  <StatusBadge status={selectedSeason.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span><i className="bi bi-geo-alt"></i> {selectedSeason.fieldName}</span>
                  <span>•</span>
                  <span><i className="bi bi-calendar3"></i> {selectedSeason.seasonName}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-modern badge-teal">
                <i className="bi bi-gear-wide-connected"></i> {selectedSeason.plantingMethod.replace('_', ' ')}
              </span>
              <span className="badge-modern badge-amber">
                <i className="bi bi-hourglass-split"></i> Est. Harvest: {format(parseISO(selectedSeason.estimatedHarvestDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation Pills */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200/80">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <i className={`bi ${tab.icon}`}></i>
            {tab.label}
            <span className={`ml-1.5 px-2 py-0.2 rounded-full text-xs font-bold ${
              activeTab === tab.id 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <Card variant="default" padding="none">
        <CardBody>
          {activeTab === 'observations' && (
            <Table
              columns={observationColumns}
              data={observations.filter((o) => o.cropSeasonId === selectedSeasonId)}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No growth observations recorded yet."
              hoverable
            />
          )}
          {activeTab === 'activities' && (
            <Table
              columns={activityColumns}
              data={activities.filter((a) => a.cropSeasonId === selectedSeasonId)}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No activities recorded yet."
              hoverable
            />
          )}
          {activeTab === 'water' && (
            <Table
              columns={waterColumns}
              data={waterRecords.filter((w) => w.cropSeasonId === selectedSeasonId)}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No water records yet."
              hoverable
            />
          )}
          {activeTab === 'problems' && (
            <Table
              columns={problemColumns}
              data={problems.filter((p) => p.cropSeasonId === selectedSeasonId)}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No crop problems reported."
              hoverable
            />
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalType === 'observation'} onClose={() => setModalType(null)} title="Record Growth Observation" size="md">
        <form onSubmit={handleObservationSubmit} className="space-y-4">
          <Select
            label="Growth Stage"
            required
            value={observationForm.stage}
            onChange={(e) => setObservationForm((prev) => ({ ...prev, stage: e.target.value as GrowthStage }))}
            options={GROWTH_STAGES}
            placeholder="Select growth stage"
          />
          <Input
            label="Observation Date"
            type="date"
            required
            value={observationForm.observedDate}
            onChange={(e) => setObservationForm((prev) => ({ ...prev, observedDate: e.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={observationForm.notes}
            onChange={(e) => setObservationForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Describe what you observed..."
          />
          <FileUpload label="Photos (optional)" accept="image/*" multiple maxFiles={3} maxSizeMB={5} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Save Observation</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'activity'} onClose={() => setModalType(null)} title="Record Activity" size="md">
        <form onSubmit={handleActivitySubmit} className="space-y-4">
          <Select
            label="Activity Type"
            required
            value={activityForm.type}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value as ActivityType }))}
            options={ACTIVITY_TYPES}
            placeholder="Select activity type"
          />
          <Input
            label="Activity Date"
            type="date"
            required
            value={activityForm.activityDate}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, activityDate: e.target.value }))}
          />
          <Textarea
            label="Description"
            rows={3}
            value={activityForm.description}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the activity..."
          />
          <Input
            label="Cost (RWF, optional)"
            type="number"
            min="0"
            value={activityForm.cost}
            onChange={(e) => setActivityForm((prev) => ({ ...prev, cost: e.target.value }))}
          />
          <FileUpload label="Photos (optional)" accept="image/*" multiple maxFiles={3} maxSizeMB={5} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Save Activity</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'water'} onClose={() => setModalType(null)} title="Record Water Condition" size="md">
        <form onSubmit={handleWaterSubmit} className="space-y-4">
          <Input
            label="Record Date"
            type="date"
            required
            value={waterForm.recordDate}
            onChange={(e) => setWaterForm((prev) => ({ ...prev, recordDate: e.target.value }))}
          />
          <Input
            label="Water Depth (cm)"
            type="number"
            step="0.1"
            min="0"
            required
            value={waterForm.waterDepthCm}
            onChange={(e) => setWaterForm((prev) => ({ ...prev, waterDepthCm: e.target.value }))}
          />
          <Select
            label="Water Condition"
            required
            value={waterForm.waterCondition}
            onChange={(e) => setWaterForm((prev) => ({ ...prev, waterCondition: e.target.value as WaterRecord['waterCondition'] }))}
            options={WATER_CONDITIONS}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={waterForm.notes}
            onChange={(e) => setWaterForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes..."
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'problem'} onClose={() => setModalType(null)} title="Report Crop Problem" size="md">
        <form onSubmit={handleProblemSubmit} className="space-y-4">
          <Select
            label="Problem Type"
            required
            value={problemForm.problemType}
            onChange={(e) => setProblemForm((prev) => ({ ...prev, problemType: e.target.value as CropProblem['problemType'] }))}
            options={PROBLEM_TYPES}
            placeholder="Select problem type"
          />
          <Select
            label="Severity"
            required
            value={problemForm.severity}
            onChange={(e) => setProblemForm((prev) => ({ ...prev, severity: e.target.value as CropProblem['severity'] }))}
            options={SEVERITIES}
          />
          <Textarea
            label="Description"
            required
            rows={3}
            value={problemForm.description}
            onChange={(e) => setProblemForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the problem..."
          />
          <Input
            label="Affected Area (hectares, optional)"
            type="number"
            step="0.01"
            min="0"
            value={problemForm.affectedAreaHectares}
            onChange={(e) => setProblemForm((prev) => ({ ...prev, affectedAreaHectares: e.target.value }))}
          />
          <FileUpload label="Photos (optional)" accept="image/*" multiple maxFiles={3} maxSizeMB={5} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Report Problem</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}