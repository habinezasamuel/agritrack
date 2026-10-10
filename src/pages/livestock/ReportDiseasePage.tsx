import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { api } from '../../services/api';
import type { LivestockAnimal, UrgencyLevel } from '../../types';

export function ReportDiseasePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [registeredAnimals, setRegisteredAnimals] = useState<LivestockAnimal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [animalType, setAnimalType] = useState('Cow');
  const [animalTagId, setAnimalTagId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [problemStartDate, setProblemStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [numberAffected, setNumberAffected] = useState(1);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Ruhango Sector, Barn B');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('MEDIUM');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnimals() {
      try {
        const list = await api.getLivestockAnimals();
        setRegisteredAnimals(list);
      } catch (err) {
        console.error('Failed to load animals:', err);
      }
    }
    loadAnimals();
  }, []);

  const handleAnimalSelect = (animalId: string) => {
    setSelectedAnimalId(animalId);
    if (!animalId) return;
    const animal = registeredAnimals.find((a) => a.id === animalId);
    if (animal) {
      setAnimalType(animal.animalType.charAt(0).toUpperCase() + animal.animalType.slice(1));
      setAnimalTagId(animal.tagId);
      if (animal.location) setLocation(animal.location);
    }
  };

  const handleEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!animalTagId.trim()) {
      setError('Please specify the animal tag ID or group identification.');
      return;
    }
    if (!symptoms.trim()) {
      setError('Please list the observed symptoms (e.g. fever, mouth lesions, weakness, appetite loss).');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the health issue in detail.');
      return;
    }

    try {
      setIsLoading(true);
      await api.createAnimalDiseaseReport({
        farmerId: user?.id || '3',
        farmerName: user ? `${user.firstName} ${user.lastName}` : 'Paul Mukamana',
        farmerPhone: user?.phoneNumber || '+250 788 123 456',
        animalId: selectedAnimalId || undefined,
        animalTagId: animalTagId.trim(),
        animalType,
        farmName: 'Ruhango Farm',
        location,
        symptoms: symptoms.trim(),
        problemStartDate,
        numberAffected: Number(numberAffected) || 1,
        description: description.trim(),
        evidenceUrl: evidenceUrl || undefined,
        urgencyLevel,
      });

      navigate('/livestock/requests');
    } catch (err) {
      console.error('Failed to submit disease report:', err);
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/livestock/disease-reports" className="text-xs font-bold text-emerald-700 hover:underline">
            ← Back to Disease Reports
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {t('reportAnimalDisease', 'Report Animal Disease')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Notify veterinary officers and administrators about sick or affected livestock for expert assistance.
          </p>
        </div>
      </div>

      {/* Prominent Veterinary Medical Disclaimer Warning Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-900 via-rose-950 to-slate-900 text-white shadow-lg border border-amber-500/40">
        <div className="flex items-start gap-3.5">
          <span className="text-3xl flex-shrink-0">🩺</span>
          <div className="space-y-1">
            <h3 className="font-extrabold text-amber-300 text-sm sm:text-base flex items-center gap-2">
              <span>CRITICAL VETERINARY ADVISORY</span>
            </h3>
            <p className="text-xs leading-relaxed text-amber-100/90 font-medium">
              {t('veterinaryWarning', 'Important: Serious animal illnesses require prompt assistance from a qualified veterinary professional. AI recommendations do not replace professional diagnosis or treatment.')}
            </p>
          </div>
        </div>
      </div>

      <Card variant="elevated" className="border border-slate-200/80 shadow-xl rounded-3xl">
        <CardBody className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5" role="alert">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Registered Animal */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                1. Select Registered Animal (Optional Quick Fill)
              </label>
              <Select
                value={selectedAnimalId}
                onChange={(e) => handleAnimalSelect(e.target.value)}
                options={[
                  { value: '', label: '-- Choose from my registered animals or enter manually below --' },
                  ...registeredAnimals.map((a) => ({
                    value: a.id,
                    label: `${a.tagId} (${a.animalType.toUpperCase()} - ${a.breed})`,
                  })),
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Animal Type *"
                placeholder="e.g. Cow, Goat, Sheep, Poultry Batch"
                value={animalType}
                onChange={(e) => setAnimalType(e.target.value)}
                required
              />
              <Input
                label="Animal Name or Tag ID *"
                placeholder="e.g. RW-COW-108 or Flocks Pen 2"
                value={animalTagId}
                onChange={(e) => setAnimalTagId(e.target.value)}
                required
              />
            </div>

            {/* Disease Symptoms & Timeline */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Symptoms & Timeline
              </h2>
              <Input
                label="Observed Symptoms *"
                placeholder="e.g. Fever (40.2°C), oral lesions, foot blisters, coughing, lethargy"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date Problem Started *"
                  type="date"
                  value={problemStartDate}
                  onChange={(e) => setProblemStartDate(e.target.value)}
                  required
                />
                <Input
                  label="Number of Animals Affected *"
                  type="number"
                  min="1"
                  value={numberAffected}
                  onChange={(e) => setNumberAffected(parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <Textarea
                label="Detailed Description of the Problem *"
                placeholder="Describe behavior changes, feeding response, body condition, or suspected cause..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Location & Urgency */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Farm Location & Urgency Level
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Farm Location / Barn Address *"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <Select
                  label="Urgency Level *"
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value as UrgencyLevel)}
                  options={[
                    { value: 'LOW', label: 'Low - Mild non-urgent observation' },
                    { value: 'MEDIUM', label: 'Medium - Noticeable symptoms needing check' },
                    { value: 'HIGH', label: 'High - Serious disease symptoms' },
                    { value: 'EMERGENCY', label: '🚨 EMERGENCY - Acute life-threatening or fast spreading outbreak' },
                  ]}
                />
              </div>
            </div>

            {/* Photo / Video Evidence Upload */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                4. Photo or Video Evidence (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                {evidenceUrl ? (
                  <img src={evidenceUrl} alt="Evidence" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-200/80 flex items-center justify-center text-3xl text-slate-400">
                    📷
                  </div>
                )}
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-700">Upload photo of symptoms or lesion</p>
                  <p className="text-[10px] text-slate-500">Helps veterinary officers diagnose symptoms quickly</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleEvidenceSelect}
                    className="mt-2 text-xs text-slate-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link to="/livestock/disease-reports">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-8 shadow-md">
                Submit Disease Report
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
