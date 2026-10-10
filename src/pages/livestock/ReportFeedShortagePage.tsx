import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { api } from '../../services/api';
import type { UrgencyLevel } from '../../types';

export function ReportFeedShortagePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [animalType, setAnimalType] = useState('Dairy Cows & Goats');
  const [numberAffected, setNumberAffected] = useState(14);
  const [feedTypeNeeded, setFeedTypeNeeded] = useState('Napier Grass & Dairy Concentrate');
  const [description, setDescription] = useState('');
  const [estimatedQuantityRequired, setEstimatedQuantityRequired] = useState('300 kg fodder & 50 kg concentrate');
  const [shortageStartDate, setShortageStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Ruhango Sector, Pasture Field C');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('MEDIUM');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!feedTypeNeeded.trim()) {
      setError('Please specify the type of animal feed or pasture needed.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the feed shortage situation.');
      return;
    }
    if (!estimatedQuantityRequired.trim()) {
      setError('Please provide an estimate of the feed quantity required.');
      return;
    }

    try {
      setIsLoading(true);
      await api.createFeedShortageReport({
        farmerId: user?.id || '3',
        farmerName: user ? `${user.firstName} ${user.lastName}` : 'Paul Mukamana',
        farmerPhone: user?.phoneNumber || '+250 788 123 456',
        farmName: 'Ruhango Farm',
        animalType,
        numberAffected: Number(numberAffected) || 1,
        feedTypeNeeded: feedTypeNeeded.trim(),
        description: description.trim(),
        estimatedQuantityRequired: estimatedQuantityRequired.trim(),
        shortageStartDate,
        location,
        urgencyLevel,
        evidenceUrl: evidenceUrl || undefined,
      });

      navigate('/livestock/requests');
    } catch (err) {
      console.error('Failed to submit feed shortage report:', err);
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/livestock/feed-shortages" className="text-xs font-bold text-emerald-700 hover:underline">
            ← Back to Feed Shortage Reports
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {t('reportFeedShortage', 'Report Animal Feed & Pasture Shortage')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Request pasture fodder, silage, or supplementary animal feed assistance from agricultural officers.
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
            {/* Animal & Feed Type */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Affected Animals & Feed Type Needed
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Type of Animal Affected *"
                  placeholder="e.g. Dairy Cattle, Goats, Pigs, Layers"
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Type of Feed or Pasture Needed *"
                  placeholder="e.g. Napier Grass, Silage, Hay, Bran Concentrate"
                  value={feedTypeNeeded}
                  onChange={(e) => setFeedTypeNeeded(e.target.value)}
                  required
                />
                <Input
                  label="Estimated Quantity Required *"
                  placeholder="e.g. 500 kg fodder, 20 bales hay, 4 bags concentrate"
                  value={estimatedQuantityRequired}
                  onChange={(e) => setEstimatedQuantityRequired(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Shortage Details & Timeline */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Shortage Description & Date
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date Shortage Started *"
                  type="date"
                  value={shortageStartDate}
                  onChange={(e) => setShortageStartDate(e.target.value)}
                  required
                />
                <Input
                  label="Farm Location / Sector *"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <Textarea
                label="Description of Feed Shortage *"
                placeholder="Explain why feed is insufficient (e.g. drought, depleted communal pasture, shortage of green fodder)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />

              <Select
                label="Urgency Level *"
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as UrgencyLevel)}
                options={[
                  { value: 'LOW', label: 'Low - Planning ahead for upcoming weeks' },
                  { value: 'MEDIUM', label: 'Medium - Pasture stock running low' },
                  { value: 'HIGH', label: 'High - Severe feed deficit affecting production' },
                  { value: 'EMERGENCY', label: '🚨 EMERGENCY - Complete lack of fodder/water threatening animals' },
                ]}
              />
            </div>

            {/* Optional Photo Evidence */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                3. Photo Evidence of Pasture / Barn Condition (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                {evidenceUrl ? (
                  <img src={evidenceUrl} alt="Evidence" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-200/80 flex items-center justify-center text-3xl text-slate-400">
                    🌾
                  </div>
                )}
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-700">Upload picture of dry pasture or empty feed storage</p>
                  <p className="text-[10px] text-slate-500">Helps agricultural officers verify pasture emergency</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEvidenceSelect}
                    className="mt-2 text-xs text-slate-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link to="/livestock/feed-shortages">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 shadow-md">
                Submit Shortage Report
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
