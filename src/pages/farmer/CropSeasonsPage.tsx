import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, type Column } from '../../components/common/Table';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import type { CropSeason, Field, CropType, CropVariety, Season } from '../../types';
import { farmService } from '../../services/farmService';

export function CropSeasonsPage() {
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [cropTypes, setCropTypes] = useState<CropType[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [seasonsList, setSeasonsList] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    fieldId: '',
    cropTypeId: '',
    cropVarietyId: '',
    seasonId: '',
    plantingMethod: 'DIRECT_SEEDING' as 'DIRECT_SEEDING' | 'TRANSPLANTING',
    plantingDate: '',
    plantedAreaHectares: '',
    expectedGrowingDurationDays: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fieldsRes, catalogRes, seasonsRes] = await Promise.all([
        farmService.getFields(),
        farmService.getCropCatalog(),
        farmService.getCropSeasons(),
      ]);
      setFields(fieldsRes);
      setCropTypes(catalogRes.cropTypes);
      setVarieties(catalogRes.varieties);
      setSeasonsList(catalogRes.seasons);
      setSeasons(seasonsRes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropTypeChange = (cropTypeId: string) => {
    setForm((prev) => ({ ...prev, cropTypeId, cropVarietyId: '' }));
  };

  const handleFieldChange = (fieldId: string) => {
    setForm((prev) => ({ ...prev, fieldId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.fieldId || !form.cropTypeId || !form.cropVarietyId || !form.seasonId || !form.plantingDate || !form.plantedAreaHectares) {
      setFormError('Please fill in all required fields');
      return;
    }

    const duration = parseInt(form.expectedGrowingDurationDays) || 120;

    try {
      const created = await farmService.createCropSeason({
        fieldId: form.fieldId,
        plantingDate: form.plantingDate,
        seasonId: form.seasonId,
        plantingMethod: form.plantingMethod,
        plantedAreaHectares: parseFloat(form.plantedAreaHectares),
        expectedGrowingDurationDays: duration,
        notes: form.notes,
        status: 'planned',
      });
      setSeasons((prev) => [created, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      setFormError(error?.message || 'Failed to create crop season');
    }
  };

  const resetForm = () => {
    setForm({
      fieldId: '',
      cropTypeId: '',
      cropVarietyId: '',
      seasonId: '',
      plantingMethod: 'DIRECT_SEEDING',
      plantingDate: '',
      plantedAreaHectares: '',
      expectedGrowingDurationDays: '',
      notes: '',
    });
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null });
    if (!id) return;
    try {
      await farmService.deleteCropSeason(id);
      setSeasons((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete crop season:', error);
    }
  };

  const columns: Column<CropSeason>[] = [
    { key: 'fieldName', header: 'Field', render: (row) => (
      <div className="font-semibold text-slate-900 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shadow-2xs">
          <i className="bi bi-geo-alt"></i>
        </span>
        {row.fieldName}
      </div>
    )},
    { key: 'cropTypeName', header: 'Crop & Variety', render: (row) => (
      <div>
        <span className="font-bold text-slate-800">{row.cropTypeName}</span>
        <span className="ml-1.5 text-xs text-slate-500 font-medium">({row.cropVarietyName})</span>
      </div>
    )},
    { key: 'seasonName', header: 'Season', render: (row) => (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
        <i className="bi bi-calendar-check"></i> {row.seasonName}
      </span>
    )},
    { key: 'plantingMethod', header: 'Method', render: (row) => (
      <span className="capitalize font-medium text-slate-700">{row.plantingMethod.replace('_', ' ').toLowerCase()}</span>
    )},
    { key: 'plantingDate', header: 'Planting Date', render: (row) => (
      <span className="text-slate-600 font-mono text-xs">{format(parseISO(row.plantingDate), 'MMM dd, yyyy')}</span>
    )},
    { key: 'plantedAreaHectares', header: 'Area', render: (row) => (
      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
        {row.plantedAreaHectares.toFixed(2)} ha
      </span>
    )},
    { key: 'estimatedHarvestDate', header: 'Est. Harvest', render: (row) => (
      <span className="text-amber-700 font-mono text-xs font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        {format(parseISO(row.estimatedHarvestDate), 'MMM dd, yyyy')}
      </span>
    )},
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link 
          to={`/crop-seasons/${row.id}`} 
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
        >
          <i className="bi bi-eye"></i> View
        </Link>
        <button 
          onClick={() => handleDelete(row.id)} 
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
        >
          <i className="bi bi-trash"></i> Delete
        </button>
      </div>
    )},
  ];

  const selectedCropType = cropTypes.find((c) => c.id === form.cropTypeId);
  const availableVarieties = varieties.filter((v) => v.cropTypeId === form.cropTypeId);

  const totalArea = seasons.reduce((acc, s) => acc + s.plantedAreaHectares, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2 backdrop-blur-xs">
            <i className="bi bi-flower1"></i> Crop Season Lifecycle
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Crop Seasons</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Manage plantings, growth schedules, variety selection, and yield expectations.</p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          onClick={() => setIsModalOpen(true)}
          leftIcon={<i className="bi bi-plus-circle-fill"></i>}
          className="shadow-glow-primary bg-emerald-500 hover:bg-emerald-400 text-white border-0 font-bold"
        >
          New Crop Season
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card-gradient">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Seasons</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><i className="bi bi-grid-fill"></i></span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{seasons.length}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">100% On Schedule</span>
        </div>

        <div className="stat-card-gradient stat-card-amber">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Planted Area</span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><i className="bi bi-layers-fill"></i></span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalArea.toFixed(2)} <span className="text-sm font-semibold text-slate-500">ha</span></div>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Across all fields</span>
        </div>

        <div className="stat-card-gradient stat-card-sky">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monitored Fields</span>
            <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center"><i className="bi bi-geo-alt-fill"></i></span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{fields.length}</div>
          <span className="text-xs text-sky-600 font-semibold mt-1 inline-block">Active Soil Plots</span>
        </div>
      </div>

      <Card variant="glass" padding="none">
        <CardHeader 
          title="All Planted Seasons" 
          subtitle={`Showing ${seasons.length} registered crop cycle(s)`} 
          action={
            <span className="badge-modern badge-emerald">
              <i className="bi bi-check-circle-fill"></i> Live Sync
            </span>
          }
        />
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={seasons}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No crop seasons yet. Create your first crop season to get started."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Crop Season" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Field"
              required
              value={form.fieldId}
              onChange={(e) => handleFieldChange(e.target.value)}
              options={fields.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` }))}
              placeholder="Select a field"
            />
            <Select
              label="Season"
              required
              value={form.seasonId}
              onChange={(e) => setForm((prev) => ({ ...prev, seasonId: e.target.value }))}
              options={seasonsList.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select a season"
            />
            <Select
              label="Crop Type"
              required
              value={form.cropTypeId}
              onChange={(e) => handleCropTypeChange(e.target.value)}
              options={cropTypes.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select crop type"
            />
            <Select
              label="Variety"
              required
              value={form.cropVarietyId}
              onChange={(e) => setForm((prev) => ({ ...prev, cropVarietyId: e.target.value }))}
              options={availableVarieties.map((v) => ({ value: v.id, label: v.name }))}
              placeholder="Select variety"
              disabled={!form.cropTypeId}
            />
            <Select
              label="Planting Method"
              required
              value={form.plantingMethod}
              onChange={(e) => setForm((prev) => ({ ...prev, plantingMethod: e.target.value as 'DIRECT_SEEDING' | 'TRANSPLANTING' }))}
              options={[
                { value: 'DIRECT_SEEDING', label: 'Direct Seeding' },
                { value: 'TRANSPLANTING', label: 'Transplanting' },
              ]}
            />
            <Input
              label="Planting Date"
              type="date"
              required
              value={form.plantingDate}
              onChange={(e) => setForm((prev) => ({ ...prev, plantingDate: e.target.value }))}
            />
            <Input
              label="Planted Area (hectares)"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.plantedAreaHectares}
              onChange={(e) => setForm((prev) => ({ ...prev, plantedAreaHectares: e.target.value }))}
              hint={form.fieldId ? `Field area: ${fields.find((f) => f.id === form.fieldId)?.areaHectares} ha` : undefined}
            />
            <Input
              label="Expected Growing Duration (days)"
              type="number"
              min="1"
              value={form.expectedGrowingDurationDays || (selectedCropType?.defaultGrowingDurationDays || '')}
              onChange={(e) => setForm((prev) => ({ ...prev, expectedGrowingDurationDays: e.target.value }))}
              hint={selectedCropType ? `Default for ${selectedCropType.name}: ${selectedCropType.defaultGrowingDurationDays} days` : undefined}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this crop season..."
            />
          </div>
          <CardFooter>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Season</Button>
          </CardFooter>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Crop Season"
        message="Are you sure you want to delete this crop season? This will also delete all associated observations, activities, and records."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}