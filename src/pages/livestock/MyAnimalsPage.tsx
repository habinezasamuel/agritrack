import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { api } from '../../services/api';
import type { LivestockAnimal, LivestockHealthStatus } from '../../types';

export function MyAnimalsPage() {
  const { t } = useLanguage();
  const [animals, setAnimals] = useState<LivestockAnimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedAnimal, setSelectedAnimal] = useState<LivestockAnimal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Edit form state
  const [editTagId, setEditTagId] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editDobOrAge, setEditDobOrAge] = useState('');
  const [editGender, setEditGender] = useState<'female' | 'male' | 'group'>('female');
  const [editHealthStatus, setEditHealthStatus] = useState<LivestockHealthStatus>('HEALTHY');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchAnimals = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLivestockAnimals();
      setAnimals(data);
    } catch (err) {
      console.error('Failed to load animals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
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

  const filteredAnimals = animals.filter((a) => {
    if (typeFilter !== 'all' && a.animalType !== typeFilter) return false;
    if (statusFilter !== 'all' && a.healthStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTag = a.tagId.toLowerCase().includes(q);
      const matchBreed = a.breed.toLowerCase().includes(q);
      const matchLocation = (a.location || '').toLowerCase().includes(q);
      const matchFarm = (a.farmName || '').toLowerCase().includes(q);
      if (!matchTag && !matchBreed && !matchLocation && !matchFarm) return false;
    }
    return true;
  });

  const openDetail = (animal: LivestockAnimal) => {
    setSelectedAnimal(animal);
    setIsDetailOpen(true);
  };

  const openEdit = (animal: LivestockAnimal) => {
    setSelectedAnimal(animal);
    setEditTagId(animal.tagId);
    setEditBreed(animal.breed);
    setEditQuantity(animal.quantity || 1);
    setEditDobOrAge(animal.dobOrAge || '');
    setEditGender(animal.gender);
    setEditHealthStatus(animal.healthStatus);
    setEditLocation(animal.location || '');
    setEditNotes(animal.notes || '');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    try {
      setIsSaving(true);
      const updated = await api.updateLivestockAnimal(selectedAnimal.id, {
        tagId: editTagId,
        breed: editBreed,
        quantity: editQuantity,
        dobOrAge: editDobOrAge,
        gender: editGender,
        healthStatus: editHealthStatus,
        location: editLocation,
        notes: editNotes,
      });
      setAnimals((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      setActionMessage('Animal updated successfully.');
      setIsEditOpen(false);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update animal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnimal) return;
    try {
      await api.deleteLivestockAnimal(selectedAnimal.id);
      setAnimals((prev) => prev.filter((a) => a.id !== selectedAnimal.id));
      setActionMessage('Animal record removed.');
      setIsDeleteOpen(false);
      setIsDetailOpen(false);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete animal:', err);
    }
  };

  const getHealthBadge = (status: LivestockHealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ Healthy</span>;
      case 'SICK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">⚠️ Sick</span>;
      case 'UNDER_TREATMENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">💊 Treatment</span>;
      case 'QUARANTINED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">🔒 Quarantined</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Deceased</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-2">
            🐄 {t('myAnimals', 'My Animals')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Registered Livestock Registry</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Search, track health statuses, view details, and manage registered farm animals.</p>
        </div>
        <Link to="/livestock/register">
          <Button variant="primary" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg">
            + {t('registerAnimal', 'Register New Animal')}
          </Button>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold animate-fadeIn flex items-center gap-2">
          <span>✅</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <Card variant="elevated">
        <CardBody className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Input
                placeholder="Search tag ID, name, breed, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Animal Types' },
                  { value: 'cow', label: '🐄 Cows' },
                  { value: 'goat', label: '🐐 Goats' },
                  { value: 'sheep', label: '🐑 Sheep' },
                  { value: 'pig', label: '🐖 Pigs' },
                  { value: 'chicken', label: '🐓 Chickens' },
                  { value: 'rabbit', label: '🐇 Rabbits' },
                  { value: 'other', label: '🐾 Other Animals' },
                ]}
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Health Statuses' },
                  { value: 'HEALTHY', label: '✓ Healthy' },
                  { value: 'SICK', label: '⚠️ Sick' },
                  { value: 'UNDER_TREATMENT', label: '💊 Under Treatment' },
                  { value: 'QUARANTINED', label: '🔒 Quarantined' },
                  { value: 'DECEASED', label: 'Deceased' },
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Animals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAnimals.length === 0 ? (
        <Card variant="elevated" className="text-center p-12">
          <span className="text-5xl">🐄</span>
          <h3 className="text-lg font-bold text-slate-800 mt-4">No animals found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No registered livestock matching your search or filters.'
              : 'You have not registered any livestock animals yet. Click the button below to register your first animal.'}
          </p>
          <div className="mt-6">
            <Link to="/livestock/register">
              <Button variant="primary" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                + Register First Animal
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnimals.map((animal) => (
            <Card key={animal.id} variant="elevated" className="overflow-hidden hover:shadow-xl transition-all border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                  {animal.photoUrl ? (
                    <img src={animal.photoUrl} alt={animal.tagId} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 text-5xl">
                      {animalIcons[animal.animalType] || '🐾'}
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getHealthBadge(animal.healthStatus)}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-black">
                    {animalIcons[animal.animalType] || '🐾'} {animal.animalType.toUpperCase()}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">{animal.tagId}</h3>
                    <p className="text-xs font-semibold text-slate-500">{animal.breed} • {animal.quantity > 1 ? `${animal.quantity} head` : animal.gender.toUpperCase()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-semibold">Age / DOB</span>
                      <span className="font-bold text-slate-800">{animal.dobOrAge || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Location / Farm</span>
                      <span className="font-bold text-slate-800 truncate block">{animal.farmName || animal.location || 'Rwanda Farm'}</span>
                    </div>
                  </div>

                  {animal.notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{animal.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => openDetail(animal)} className="text-xs font-bold flex-1">
                  👁️ Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(animal)} className="text-xs font-bold">
                  ✏️ Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnimal && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Animal Details: ${selectedAnimal.tagId}`}>
          <div className="space-y-4">
            {selectedAnimal.photoUrl && (
              <img src={selectedAnimal.photoUrl} alt={selectedAnimal.tagId} className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm" />
            )}
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-900">{selectedAnimal.tagId}</span>
              {getHealthBadge(selectedAnimal.healthStatus)}
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div><span className="text-slate-400 font-bold block">Type</span> <span className="font-extrabold text-slate-900">{selectedAnimal.animalType.toUpperCase()}</span></div>
              <div><span className="text-slate-400 font-bold block">Breed</span> <span className="font-extrabold text-slate-900">{selectedAnimal.breed}</span></div>
              <div><span className="text-slate-400 font-bold block">Quantity</span> <span className="font-extrabold text-slate-900">{selectedAnimal.quantity} head</span></div>
              <div><span className="text-slate-400 font-bold block">Gender</span> <span className="font-extrabold text-slate-900">{selectedAnimal.gender}</span></div>
              <div><span className="text-slate-400 font-bold block">Age / DOB</span> <span className="font-extrabold text-slate-900">{selectedAnimal.dobOrAge || 'N/A'}</span></div>
              <div><span className="text-slate-400 font-bold block">Reg. Date</span> <span className="font-extrabold text-slate-900">{selectedAnimal.registrationDate}</span></div>
              <div className="col-span-2"><span className="text-slate-400 font-bold block">Location</span> <span className="font-extrabold text-slate-900">{selectedAnimal.location || 'Ruhango Sector'}</span></div>
            </div>

            {selectedAnimal.notes && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Additional Notes</span>
                <p className="text-xs text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 leading-relaxed">{selectedAnimal.notes}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-slate-100">
              <Link to="/livestock/disease-reports/new" className="w-full sm:flex-1">
                <Button variant="outline" size="sm" className="w-full text-rose-700 border-rose-200 hover:bg-rose-50 font-bold text-xs">
                  🩺 Report Disease
                </Button>
              </Link>
              <Link to="/livestock/records" className="w-full sm:flex-1">
                <Button variant="outline" size="sm" className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold text-xs">
                  📋 Log Health Record
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)} className="w-full sm:w-auto text-xs font-bold">
                🗑️ Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {selectedAnimal && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Animal: ${selectedAnimal.tagId}`}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input label="Name or Tag ID" value={editTagId} onChange={(e) => setEditTagId(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Breed" value={editBreed} onChange={(e) => setEditBreed(e.target.value)} required />
              <Input label="Quantity" type="number" value={editQuantity} onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)} min="1" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Age or DOB" value={editDobOrAge} onChange={(e) => setEditDobOrAge(e.target.value)} />
              <Select
                label="Health Status"
                value={editHealthStatus}
                onChange={(e) => setEditHealthStatus(e.target.value as LivestockHealthStatus)}
                options={[
                  { value: 'HEALTHY', label: '✓ Healthy' },
                  { value: 'SICK', label: '⚠️ Sick' },
                  { value: 'UNDER_TREATMENT', label: '💊 Under Treatment' },
                  { value: 'QUARANTINED', label: '🔒 Quarantined' },
                  { value: 'DECEASED', label: 'Deceased' },
                ]}
              />
            </div>
            <Input label="Farm Location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
            <Textarea label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Animal Removal"
        message={`Are you sure you want to remove animal record "${selectedAnimal?.tagId}"? This action cannot be undone.`}
        confirmText="Remove Animal"
        variant="danger"
      />
    </div>
  );
}
