import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { api } from '../../services/api';
import type { AnimalType, LivestockHealthStatus } from '../../types';

export function RegisterAnimalPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [animalType, setAnimalType] = useState<AnimalType>('cow');
  const [tagId, setTagId] = useState('');
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dobOrAge, setDobOrAge] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'group'>('female');
  const [farmName, setFarmName] = useState('Ruhango Farm');
  const [location, setLocation] = useState('Ruhango Sector, District Field A');
  const [healthStatus, setHealthStatus] = useState<LivestockHealthStatus>('HEALTHY');
  const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tagId.trim()) {
      setError('Please provide an animal name or tag identification number.');
      return;
    }
    if (!breed.trim()) {
      setError('Please enter the breed or variety of the animal.');
      return;
    }

    try {
      setIsLoading(true);
      await api.registerLivestockAnimal({
        farmerId: user?.id || '3',
        farmerName: user ? `${user.firstName} ${user.lastName}` : 'Paul Mukamana',
        farmName,
        location,
        animalType,
        tagId: tagId.trim(),
        breed: breed.trim(),
        quantity: Number(quantity) || 1,
        dobOrAge: dobOrAge.trim(),
        gender,
        healthStatus,
        registrationDate,
        notes: notes.trim(),
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&w=800&q=80',
      });

      navigate('/livestock/animals');
    } catch (err) {
      console.error('Failed to register animal:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/livestock/animals" className="text-xs font-bold text-emerald-700 hover:underline">
            ← Back to My Animals
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {t('registerAnimal', 'Register New Livestock')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Add a new cow, goat, sheep, pig, chicken batch, rabbit, or other farm animal to your AgriTrack registry.
          </p>
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
            {/* Animal Category Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                1. Select Animal Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'cow', label: 'Cow', icon: '🐄' },
                  { type: 'goat', label: 'Goat', icon: '🐐' },
                  { type: 'sheep', label: 'Sheep', icon: '🐑' },
                  { type: 'pig', label: 'Pig', icon: '🐖' },
                  { type: 'chicken', label: 'Chicken', icon: '🐓' },
                  { type: 'rabbit', label: 'Rabbit', icon: '🐇' },
                  { type: 'other', label: 'Other', icon: '🐾' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setAnimalType(item.type as AnimalType)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      animalType === item.type
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Identification & Breed
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Animal Name or Tag ID *"
                  placeholder="e.g. RW-COW-104 or Inyange"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  required
                />
                <Input
                  label="Breed / Variety *"
                  placeholder="e.g. Friesian Holstein, Boer, ISA Brown"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity / Head Count *"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
                <Input
                  label="Age or Date of Birth"
                  placeholder="e.g. 2 years or 2024-05-10"
                  value={dobOrAge}
                  onChange={(e) => setDobOrAge(e.target.value)}
                />
                <Select
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'female' | 'male' | 'group')}
                  options={[
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'group', label: 'Group / Flock Batch' },
                  ]}
                />
              </div>
            </div>

            {/* Farm & Health Status */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Farm Location & Health Status
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Farm Name"
                  placeholder="e.g. Ruhango Farm"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                />
                <Input
                  label="Location / Pen / Sector"
                  placeholder="e.g. Ruhango Sector, Barn B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Current Health Status"
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value as LivestockHealthStatus)}
                  options={[
                    { value: 'HEALTHY', label: '✓ Healthy' },
                    { value: 'SICK', label: '⚠️ Sick (Will log report prompt)' },
                    { value: 'UNDER_TREATMENT', label: '💊 Under Treatment' },
                    { value: 'QUARANTINED', label: '🔒 Quarantined' },
                  ]}
                />
                <Input
                  label="Date of Registration"
                  type="date"
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                />
              </div>

              <Textarea
                label="Additional Notes / Description"
                placeholder="Record vaccination history, feeding preferences, milk yield, or unique markings..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Optional Photo Upload */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                4. Animal Photo (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-200/80 flex items-center justify-center text-3xl text-slate-400">
                    📷
                  </div>
                )}
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-700">Upload animal photo or identification picture</p>
                  <p className="text-[10px] text-slate-500">Supported formats: JPG, PNG, WEBP (Max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="mt-2 text-xs text-slate-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link to="/livestock/animals">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 shadow-md">
                Complete Registration
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
