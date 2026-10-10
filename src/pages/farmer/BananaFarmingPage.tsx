import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import bananaPhoto from '../../assets/banana.jpg';
import rainPhoto from '../../assets/rain.jpg';
import { bananaService } from '../../services/bananaService';
import type {
  BananaPlantation,
  BananaGrowthRecord,
  BananaDiseaseReport,
  BananaWeatherReport,
  BananaAssistanceRequest,
  BananaDashboardSummary,
  BananaVariety,
  BananaPlantingMethod,
  BananaGrowthStage,
  BananaProblemType,
  ProblemSeverity,
  BananaWeatherCondition,
} from '../../types/banana';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ActiveTab =
  | 'overview'
  | 'plantations'
  | 'monitoring'
  | 'diseases'
  | 'weather'
  | 'assistance'
  | 'timeline';

const BANANA_VARIETIES: { value: BananaVariety; label: string }[] = [
  { value: 'FHIA-17', label: 'FHIA-17 (Dual Purpose Cooking & Dessert)' },
  { value: 'Grand Nain', label: 'Grand Nain (Cavendish Dessert)' },
  { value: 'Cavendish', label: 'Cavendish (Commercial Dessert)' },
  { value: 'Gros Michel', label: 'Gros Michel (Bogoya)' },
  { value: 'Cooking Banana (Injagi)', label: 'Cooking Banana (Injagi / Matooke)' },
  { value: 'Beer Banana (Kayinja)', label: 'Beer Banana (Kayinja / Urwagate)' },
  { value: 'Plantain (Agatoki)', label: 'Plantain (Agatoki / Roasting Banana)' },
  { value: 'East African Highland Banana', label: 'East African Highland Banana' },
  { value: 'Other', label: 'Other Local Variety' },
];

const PLANTING_METHODS: { value: BananaPlantingMethod; label: string }[] = [
  { value: 'TISSUE_CULTURE', label: 'Tissue Culture Seedlings (Disease Free)' },
  { value: 'SUCKERS', label: 'Sword Suckers' },
  { value: 'CORM_SPLIT', label: 'Corm Split / Bit Method' },
];

const GROWTH_STAGES: { value: BananaGrowthStage; label: string; desc: string }[] = [
  { value: 'VEGETATIVE_EARLY', label: 'Early Vegetative (0-3 months)', desc: 'Rapid leaf emergence and root anchoring' },
  { value: 'VEGETATIVE_MATURE', label: 'Mature Vegetative (3-7 months)', desc: 'Pseudostem girth expansion and sucker development' },
  { value: 'SHOOTING', label: 'Shooting / Inflorescence (7-9 months)', desc: 'Flag leaf emergence and flower bud shooting' },
  { value: 'FLOWERING_HEART', label: 'Flowering & Banana Heart (9-10 months)', desc: 'Bract opening and hands formation' },
  { value: 'BUNCH_DEVELOPMENT', label: 'Bunch Development (10-12 months)', desc: 'Finger filling and fruit curvature' },
  { value: 'MATURATION', label: 'Maturation / Full Fingers (12-14 months)', desc: 'Full round fingers, ridges disappearing' },
  { value: 'HARVEST_PHASE', label: 'Harvest Ready', desc: 'Optimal harvest maturity for market or home' },
];

const PROBLEM_TYPES: { value: BananaProblemType; label: string; severity: ProblemSeverity }[] = [
  { value: 'BANANA_BACTERIAL_WILT', label: 'Banana Bacterial Wilt (BXW)', severity: 'CRITICAL' },
  { value: 'BLACK_SIGATOKA', label: 'Black Sigatoka Leaf Spot', severity: 'HIGH' },
  { value: 'PANAMA_DISEASE', label: 'Panama Disease (Fusarium Wilt)', severity: 'CRITICAL' },
  { value: 'BANANA_WEEVIL', label: 'Banana Weevil / Corm Borer', severity: 'MEDIUM' },
  { value: 'PESTS', label: 'Pests (Aphids / Nematodes / Mealybugs)', severity: 'MEDIUM' },
  { value: 'YELLOWING_LEAVES', label: 'Yellowing Leaves (Chlorosis / Nutrient Deficiency)', severity: 'MEDIUM' },
  { value: 'DRYING_LEAVES', label: 'Drying / Scorched Leaves', severity: 'LOW' },
  { value: 'BROKEN_PLANTS', label: 'Broken Pseudostems / Stem Lodging', severity: 'HIGH' },
  { value: 'POOR_GROWTH', label: 'Stunted Growth / Small Bunches', severity: 'MEDIUM' },
  { value: 'OTHER', label: 'Other Disease / Plantation Problem', severity: 'LOW' },
];

const WEATHER_CONDITIONS: { value: BananaWeatherCondition; label: string; icon: string }[] = [
  { value: 'HEAVY_RAIN', label: 'Heavy Rain & Storm', icon: '🌧️' },
  { value: 'TOO_MUCH_RAINFALL', label: 'Excessive Rainfall / Prolonged Wet', icon: '🌊' },
  { value: 'FLOODING_WATERLOGGING', label: 'Flooding / Waterlogged Furrows', icon: '💧' },
  { value: 'STRONG_WIND_LODGING', label: 'Strong Winds / Stem Lodging', icon: '💨' },
  { value: 'LOW_RAINFALL_DROUGHT', label: 'Low Rainfall / Severe Dry Spell', icon: '☀️' },
  { value: 'HAIL', label: 'Hailstorm / Leaf Shredding', icon: '🧊' },
  { value: 'NORMAL_RAINFALL', label: 'Normal / Optimal Rainfall', icon: '🌦️' },
  { value: 'OTHER', label: 'Other Weather Incident', icon: '☁️' },
];

export function BananaFarmingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [summary, setSummary] = useState<BananaDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [plantations, setPlantations] = useState<BananaPlantation[]>([]);
  const [growthRecords, setGrowthRecords] = useState<BananaGrowthRecord[]>([]);
  const [diseaseReports, setDiseaseReports] = useState<BananaDiseaseReport[]>([]);
  const [weatherReports, setWeatherReports] = useState<BananaWeatherReport[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<BananaAssistanceRequest[]>([]);

  // Selected filters
  const [selectedPlantationId, setSelectedPlantationId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState<null | 'plantation' | 'growth' | 'disease' | 'weather' | 'advice_detail'>(null);
  const [selectedRequestForAdvice, setSelectedRequestForAdvice] = useState<BananaAssistanceRequest | null>(null);

  // Forms
  const [plantationForm, setPlantationForm] = useState({
    farmName: 'Ruhango Green Highland Farm',
    fieldName: '',
    variety: 'FHIA-17' as BananaVariety,
    landSizeHectares: '',
    plantingDate: format(new Date(), 'yyyy-MM-dd'),
    plantsPlantedCount: '',
    plantingMethod: 'TISSUE_CULTURE' as BananaPlantingMethod,
    soilType: 'Fertile Volcanic Loam',
    irrigationMethod: 'Rainfed with Swales & Mulch',
    location: 'Ruhango District, Southern Province',
    notes: '',
    photoUrl: bananaPhoto,
  });

  const [growthForm, setGrowthForm] = useState({
    plantationId: '',
    stage: 'VEGETATIVE_EARLY' as BananaGrowthStage,
    recordedDate: format(new Date(), 'yyyy-MM-dd'),
    plantHeightMeters: '',
    averageStemGirthCm: '',
    healthyPlantsCount: '',
    damagedPlantsCount: '0',
    observations: '',
    photoUrl: bananaPhoto,
  });

  const [diseaseForm, setDiseaseForm] = useState({
    plantationId: '',
    problemType: 'BANANA_BACTERIAL_WILT' as BananaProblemType,
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    severity: 'HIGH' as ProblemSeverity,
    description: '',
    affectedPlantsCount: '',
    location: 'Ruhango Farm, Block A',
    notes: '',
    assistanceRequested: true,
    photoUrl: bananaPhoto,
  });

  const [weatherForm, setWeatherForm] = useState({
    plantationId: '',
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    weatherCondition: 'HEAVY_RAIN' as BananaWeatherCondition,
    impactDescription: '',
    estimatedDamagedPlants: '0',
    rainfallMm: '25',
    windSeverity: 'MODERATE' as 'MILD' | 'MODERATE' | 'SEVERE' | 'GALE_FORCE',
    assistanceRequested: false,
    photoUrl: rainPhoto,
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reloadData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await bananaService.getDashboardData();
      setSummary(data.summary);
      setPlantations(data.plantations);
      setGrowthRecords(data.growthRecords);
      setDiseaseReports(data.diseaseReports);
      setWeatherReports(data.weatherReports);
      setAssistanceRequests(data.assistanceRequests);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Unable to load banana farming records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
    window.addEventListener('agritrack:banana-data-synced', reloadData);
    return () => {
      window.removeEventListener('agritrack:banana-data-synced', reloadData);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const extractErrorMessage = (err: any): string => {
    const details = err?.details as Record<string, string[]> | undefined;
    if (details) {
      const msgs = Object.values(details).flat();
      if (msgs.length > 0) return msgs.join(' ');
    }
    return err?.message || 'The request failed. Please check your connection and try again.';
  };

  // Image helper for preview / file input
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for submission
  const handleCreatePlantation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (isSubmitting) return;

    const landSize = parseFloat(plantationForm.landSizeHectares);
    const plantsCount = parseInt(plantationForm.plantsPlantedCount, 10);
    if (!plantationForm.fieldName.trim() || !(landSize > 0) || !(plantsCount > 0) || !plantationForm.plantingDate) {
      setFormError('Please fill in field name, planting date, land size, and number of plants with valid values.');
      return;
    }

    setIsSubmitting(true);
    try {
      await bananaService.createPlantation({
        farmId: '1',
        farmName: plantationForm.farmName,
        fieldName: plantationForm.fieldName,
        variety: plantationForm.variety,
        landSizeHectares: landSize,
        plantingDate: plantationForm.plantingDate,
        plantsPlantedCount: plantsCount,
        plantingMethod: plantationForm.plantingMethod,
        soilType: plantationForm.soilType,
        irrigationMethod: plantationForm.irrigationMethod,
        location: plantationForm.location,
        photoUrl: plantationForm.photoUrl || bananaPhoto,
        notes: plantationForm.notes,
        status: 'GROWING',
      });
      await reloadData();
      setModalOpen(null);
      triggerToast('Banana Plantation registered successfully and saved to the cloud! 🍌');
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGrowthRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (isSubmitting) return;
    if (!growthForm.plantationId || !growthForm.healthyPlantsCount) {
      setFormError('Please select a plantation and enter healthy plant count.');
      return;
    }
    const plant = plantations.find((p) => p.id === growthForm.plantationId);
    setIsSubmitting(true);
    try {
      await bananaService.addGrowthRecord({
        plantationId: growthForm.plantationId,
        plantationName: plant ? plant.fieldName : 'Banana Field',
        recordedDate: growthForm.recordedDate,
        stage: growthForm.stage,
        plantHeightMeters: parseFloat(growthForm.plantHeightMeters) || undefined,
        averageStemGirthCm: parseFloat(growthForm.averageStemGirthCm) || undefined,
        healthyPlantsCount: parseInt(growthForm.healthyPlantsCount, 10) || 0,
        damagedPlantsCount: parseInt(growthForm.damagedPlantsCount, 10) || 0,
        observations: growthForm.observations,
        photos: [growthForm.photoUrl || bananaPhoto],
        recordedByName: user ? `${user.firstName} ${user.lastName}` : 'Farmer Hakizimana',
      });
      await reloadData();
      setModalOpen(null);
      triggerToast('Banana growth record logged and saved to the cloud! 🌱');
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDiseaseReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (isSubmitting) return;
    if (!diseaseForm.plantationId || !diseaseForm.description || !diseaseForm.affectedPlantsCount) {
      setFormError('Please select plantation, problem description, and affected count.');
      return;
    }
    const plant = plantations.find((p) => p.id === diseaseForm.plantationId);
    const probObj = PROBLEM_TYPES.find((pt) => pt.value === diseaseForm.problemType);

    setIsSubmitting(true);
    try {
      await bananaService.createDiseaseReport({
        plantationId: diseaseForm.plantationId,
        plantationName: plant ? plant.fieldName : 'Banana Field',
        farmerId: user?.id || 'farmer-1',
        farmerName: user ? `${user.firstName} ${user.lastName}` : 'Emmanuel Hakizimana',
        farmerPhone: user?.phoneNumber || '+250 788 123 456',
        reportDate: diseaseForm.reportDate,
        problemType: diseaseForm.problemType,
        problemTypeName: probObj ? probObj.label : diseaseForm.problemType,
        severity: diseaseForm.severity,
        description: diseaseForm.description,
        affectedPlantsCount: parseInt(diseaseForm.affectedPlantsCount, 10) || 1,
        location: diseaseForm.location || (plant ? plant.location : 'Farm site'),
        photos: [diseaseForm.photoUrl || bananaPhoto],
        notes: diseaseForm.notes,
        assistanceRequested: diseaseForm.assistanceRequested,
        status: 'PENDING',
      });
      await reloadData();
      setModalOpen(null);
      triggerToast('Banana problem report submitted and saved to the cloud! 🩺');
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWeatherReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (isSubmitting) return;
    if (!weatherForm.plantationId || !weatherForm.impactDescription) {
      setFormError('Please select plantation and write how weather affected your banana trees.');
      return;
    }
    const plant = plantations.find((p) => p.id === weatherForm.plantationId);
    setIsSubmitting(true);
    try {
      await bananaService.createWeatherReport({
        plantationId: weatherForm.plantationId,
        plantationName: plant ? plant.fieldName : 'Banana Field',
        farmerId: user?.id || 'farmer-1',
        farmerName: user ? `${user.firstName} ${user.lastName}` : 'Emmanuel Hakizimana',
        reportDate: weatherForm.reportDate,
        weatherCondition: weatherForm.weatherCondition,
        impactDescription: weatherForm.impactDescription,
        estimatedDamagedPlants: parseInt(weatherForm.estimatedDamagedPlants, 10) || 0,
        rainfallMm: parseFloat(weatherForm.rainfallMm) || undefined,
        windSeverity: weatherForm.windSeverity,
        photos: [weatherForm.photoUrl || rainPhoto],
        assistanceRequested: weatherForm.assistanceRequested,
        status: weatherForm.assistanceRequested ? 'ASSISTANCE_REQUESTED' : 'LOGGED',
      });
      await reloadData();
      setModalOpen(null);
      triggerToast('Weather impact recorded and saved to the cloud! 🌧️');
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered lists
  const filteredPlantations = plantations.filter((p) => {
    if (selectedPlantationId !== 'ALL' && p.id !== selectedPlantationId) return false;
    if (searchQuery && !p.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) && !p.variety.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredDiseases = diseaseReports.filter((d) => {
    if (selectedPlantationId !== 'ALL' && d.plantationId !== selectedPlantationId) return false;
    if (searchQuery && !d.problemType.toLowerCase().includes(searchQuery.toLowerCase()) && !d.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredWeather = weatherReports.filter((w) => {
    if (selectedPlantationId !== 'ALL' && w.plantationId !== selectedPlantationId) return false;
    return true;
  });

  const filteredGrowth = growthRecords.filter((g) => {
    if (selectedPlantationId !== 'ALL' && g.plantationId !== selectedPlantationId) return false;
    return true;
  });

  // Chart data
  const healthChartData = {
    labels: ['Healthy Mats', 'Affected / Damaged Mats'],
    datasets: [
      {
        data: [summary?.healthyPlants ?? 0, summary?.affectedPlants ?? 0],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  };

  const varietyChartData = {
    labels: [...new Set(plantations.map((p) => p.variety))],
    datasets: [
      {
        label: 'Planted Mats',
        data: [...new Set(plantations.map((p) => p.variety))].map((variety) =>
          plantations.filter((p) => p.variety === variety).reduce((total, p) => total + p.plantsPlantedCount, 0)),
        backgroundColor: ['#10b981', '#f59e0b', '#06b6d4'],
        borderRadius: 8,
      },
    ],
  };

  const timelineEvents = [
    ...plantations.map((p) => ({
      date: p.plantingDate,
      type: 'PLANTING',
      title: `Planting: ${p.fieldName}`,
      desc: `${p.plantsPlantedCount.toLocaleString()} ${p.variety} plants planted via ${p.plantingMethod.replace(/_/g, ' ')}.`,
      badge: 'Planting',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: '🌱',
      photo: p.photoUrl,
    })),
    ...growthRecords.map((g) => ({
      date: g.recordedDate,
      type: 'GROWTH',
      title: `Growth Update: ${g.stage.replace(/_/g, ' ')}`,
      desc: `${g.healthyPlantsCount.toLocaleString()} healthy plants (${g.plantHeightMeters ? `${g.plantHeightMeters}m height` : ''}). ${g.observations}`,
      badge: 'Monitoring',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: '📈',
      photo: g.photos[0],
    })),
    ...diseaseReports.map((d) => ({
      date: d.reportDate,
      type: 'DISEASE',
      title: `Disease Report: ${d.problemTypeName || d.problemType}`,
      desc: `Severity: ${d.severity} • Affected: ${d.affectedPlantsCount} plants. ${d.description}`,
      badge: `Problem: ${d.status}`,
      badgeColor: d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
      icon: '🦠',
      photo: d.photos[0],
    })),
    ...weatherReports.map((w) => ({
      date: w.reportDate,
      type: 'WEATHER',
      title: `Weather: ${w.weatherCondition.replace(/_/g, ' ')}`,
      desc: `${w.impactDescription} ${w.rainfallMm ? `(${w.rainfallMm}mm rain)` : ''}`,
      badge: 'Weather',
      badgeColor: 'bg-cyan-100 text-cyan-800',
      icon: '🌧️',
      photo: w.photos[0],
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#0b2e22] px-6 py-4 text-white shadow-2xl animate-fade-in border border-emerald-400/30">
          <span className="text-2xl">🍌</span>
          <div>
            <p className="font-bold text-sm">Success</p>
            <p className="text-xs text-emerald-200">{successToast}</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0b2e22] via-[#124d38] to-[#1d6349] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-15 pointer-events-none">
          <span className="text-9xl">🍌</span>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-300/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-200 border border-emerald-300/30 mb-3">
              🍌 Crop Module • Production Ready
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Banana Farming Management</h1>
            <p className="mt-2 text-sm sm:text-base text-emerald-100/80 max-w-2xl">
              Monitor banana plantations, track growth milestones, report diseases & pests, log weather impacts, request agricultural officer advice, and manage full harvest timelines.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              className="!bg-amber-300 !text-[#173c2c] hover:!bg-amber-200 font-extrabold shadow-lg shadow-amber-950/20"
              onClick={() => {
                setFormError('');
                setModalOpen('plantation');
              }}
            >
              🌱 Register Banana Field
            </Button>
            <Button
              variant="secondary"
              className="!bg-white/15 !text-white hover:!bg-white/25 border-white/30 backdrop-blur-sm"
              onClick={() => {
                if (plantations.length === 0) {
                  triggerToast('Please register a banana field first.');
                  return;
                }
                setDiseaseForm((prev) => ({ ...prev, plantationId: plantations[0].id }));
                setFormError('');
                setModalOpen('disease');
              }}
            >
              🦠 Report Disease/Problem
            </Button>
            <Button
              variant="secondary"
              className="!bg-white/15 !text-white hover:!bg-white/25 border-white/30 backdrop-blur-sm"
              onClick={() => {
                if (plantations.length === 0) {
                  triggerToast('Please register a banana field first.');
                  return;
                }
                setWeatherForm((prev) => ({ ...prev, plantationId: plantations[0].id }));
                setFormError('');
                setModalOpen('weather');
              }}
            >
              🌧️ Log Weather
            </Button>
          </div>
        </div>

        {/* Global Plantation Selector & Search */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-100">
          <span className="text-emerald-300 font-bold uppercase tracking-wider">Filtered Plantation:</span>
          <select
            value={selectedPlantationId}
            onChange={(e) => setSelectedPlantationId(e.target.value)}
            className="rounded-xl bg-white/20 border border-white/30 px-3 py-1.5 text-white font-bold backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="ALL" className="text-slate-900">All Banana Plantations ({plantations.length})</option>
            {plantations.map((p) => (
              <option key={p.id} value={p.id} className="text-slate-900">
                {p.fieldName} • {p.variety} ({p.plantsPlantedCount} mats)
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="🔍 Search banana records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl bg-white/20 border border-white/30 px-3 py-1.5 text-white placeholder-emerald-100/60 font-medium backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-300 w-52"
          />

          <span className="ml-auto text-[11px] text-emerald-200/70 hidden sm:inline">
            Total Land: {plantations.reduce((s, p) => s + p.landSizeHectares, 0).toFixed(1)} ha • Total Mats: {summary?.totalPlants.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none">
        {[
          { id: 'overview', label: '📊 Dashboard Overview', count: null },
          { id: 'plantations', label: '🌱 Banana Fields', count: plantations.length },
          { id: 'monitoring', label: '📈 Growth Monitoring', count: growthRecords.length },
          { id: 'diseases', label: '🦠 Disease Reports', count: diseaseReports.length },
          { id: 'weather', label: '🌧️ Weather & Rain', count: weatherReports.length },
          { id: 'assistance', label: '🤝 Officer Requests & Advice', count: assistanceRequests.length },
          { id: 'timeline', label: '⏳ Plantation Timeline', count: timelineEvents.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={clsx(
              'whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-[11px] font-black',
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {isLoading && <p role="status">Loading banana farming records...</p>}
      {loadError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{loadError} <Button onClick={reloadData}>Retry</Button></div>}
      {!isLoading && !loadError && summary?.totalPlantations === 0 && <p>No banana fields have been recorded yet. Register a field to get started.</p>}
      {activeTab === 'overview' && !isLoading && summary && (
        <div className="space-y-6">
          {/* 8 Stats KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">🌱</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Banana Fields</p>
                  <p className="text-xl font-black text-slate-900">{summary?.totalPlantations || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-2xl">🍌</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Banana Mats</p>
                  <p className="text-xl font-black text-slate-900">{summary?.totalPlants.toLocaleString() || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">💚</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Healthy Mats (%)</p>
                  <p className="text-xl font-black text-emerald-600">
                    {summary.healthRatePercent === null ? 'No monitoring data yet' : `${summary.healthRatePercent}%`}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-2xl">⚠️</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Affected Mats</p>
                  <p className="text-xl font-black text-rose-600">{summary?.affectedPlants.toLocaleString() || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-2xl">🦠</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Disease Reports</p>
                  <p className="text-xl font-black text-slate-900">{summary?.activeDiseaseReports || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-2xl">🌧️</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Weather Events (All Time)</p>
                  <p className="text-xl font-black text-cyan-700">{summary?.weatherReportsCount || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-2xl">🤝</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Requests</p>
                  <p className="text-xl font-black text-blue-600">{summary?.pendingAssistanceRequests || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">✅</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolved Requests</p>
                  <p className="text-xl font-black text-emerald-700">{summary?.resolvedProblemsCount || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts & Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Plantation Health Ratio</h3>
              <div className="h-56 relative flex items-center justify-center">
                {summary.healthRatePercent === null ? <p>No monitoring data yet</p> : <Doughnut data={healthChartData} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                {summary?.healthyPlants.toLocaleString()} Healthy vs {summary?.affectedPlants} Monitored/Affected
              </p>
            </Card>

            <Card className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Banana Varieties In Field</h3>
              <div className="h-56">
                <Bar data={varietyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-slate-500">Dual-purpose, dessert & cooking plantains</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-[#0b2e22] text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-400/30">
                    🤖 AgriTrack AI Advice
                  </span>
                  <span className="text-xs text-emerald-300">Live Agronomy</span>
                </div>
                <h4 className="text-lg font-black mt-2">Optimal Pruning & Sucker Selection</h4>
                <p className="mt-2 text-xs leading-relaxed text-emerald-100/85">
                  “For high bunch yields in FHIA-17 and Plantain, maintain the 'Follower System' with 1 Mother Plant, 1 Daughter (1.5m sucker), and 1 Granddaughter (peeper). Strip dried leaves immediately to prevent fungal spore buildup.”
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-emerald-200">Need specific help?</span>
                <Button
                  size="sm"
                  className="!bg-amber-300 !text-[#173c2c] font-bold"
                  onClick={() => {
                    setDiseaseForm((prev) => ({ ...prev, plantationId: plantations[0]?.id || '' }));
                    setModalOpen('disease');
                  }}
                >
                  Ask Officer →
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Jump Plantation Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Your Registered Banana Plantations</h3>
              <button
                onClick={() => setActiveTab('plantations')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                View All ({plantations.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plantations.map((p) => (
                <Card key={p.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="h-40 relative overflow-hidden bg-slate-100">
                    <img loading="lazy" decoding="async" src={p.photoUrl || bananaPhoto} alt={p.fieldName} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                      {p.status}
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-black text-slate-900 shadow-sm">
                      🍌 {p.variety}
                    </span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-black text-base text-slate-900">{p.fieldName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{p.location}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Land Size</span>
                        {p.landSizeHectares} Hectares
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Mats</span>
                        {p.plantsPlantedCount.toLocaleString()} plants
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Planted: {p.plantingDate}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedPlantationId(p.id);
                          setActiveTab('timeline');
                        }}
                      >
                        View Timeline →
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLANTATIONS (Registration & Management) */}
      {activeTab === 'plantations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Banana Plantations & Fields</h2>
              <p className="text-xs text-slate-500 mt-0.5">Register new banana plots, view variety traits, land size and planting records.</p>
            </div>
            <Button
              variant="primary"
              className="!bg-emerald-700"
              onClick={() => {
                setFormError('');
                setModalOpen('plantation');
              }}
            >
              + Register New Banana Field
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlantations.map((p) => (
              <Card key={p.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition">
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img loading="lazy" decoding="async" src={p.photoUrl || bananaPhoto} alt={p.fieldName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <span className="rounded-lg bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-900 uppercase">
                        {p.variety}
                      </span>
                      <h3 className="text-lg font-black mt-1 leading-tight">{p.fieldName}</h3>
                    </div>
                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold">{p.status}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2">{p.notes || 'No additional notes provided.'}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">Planting Method</span>
                      <strong className="text-slate-900">{p.plantingMethod.replace(/_/g, ' ')}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">Planting Date</span>
                      <strong className="text-slate-900">{p.plantingDate}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">Area</span>
                      <strong className="text-slate-900">{p.landSizeHectares} ha</strong>
                    </div>
                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">Total Mats</span>
                      <strong className="text-slate-900">{p.plantsPlantedCount.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p>📍 <strong>Location:</strong> {p.location}</p>
                    <p>💧 <strong>Irrigation / Care:</strong> {p.irrigationMethod || 'Rainfed'}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setGrowthForm((prev) => ({ ...prev, plantationId: p.id }));
                        setModalOpen('growth');
                      }}
                    >
                      📈 Record Growth
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="!bg-emerald-700"
                      onClick={() => {
                        setSelectedPlantationId(p.id);
                        setActiveTab('timeline');
                      }}
                    >
                      Timeline →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GROWTH MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Banana Growth Condition & Inspection Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track plant heights, healthy mat counts, phenological stages and visual evolution.</p>
            </div>
            <Button
              variant="primary"
              className="!bg-emerald-700"
              onClick={() => {
                if (plantations.length === 0) {
                  triggerToast('Please register a plantation first.');
                  return;
                }
                setGrowthForm((prev) => ({ ...prev, plantationId: plantations[0].id }));
                setFormError('');
                setModalOpen('growth');
              }}
            >
              + Record Growth Condition
            </Button>
          </div>

          <div className="space-y-4">
            {filteredGrowth.map((record) => (
              <Card key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img loading="lazy" decoding="async"
                      src={record.photos[0] || bananaPhoto}
                      alt="Banana growth"
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-800">
                          {record.stage.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">📅 {record.recordedDate}</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-1">{record.plantationName}</h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">{record.observations}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-shrink-0">
                    <div className="text-center px-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Height</span>
                      <strong className="text-sm font-black text-slate-900">{record.plantHeightMeters ? `${record.plantHeightMeters}m` : 'N/A'}</strong>
                    </div>
                    <div className="text-center px-2 border-l border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Healthy</span>
                      <strong className="text-sm font-black text-emerald-700">{record.healthyPlantsCount.toLocaleString()}</strong>
                    </div>
                    <div className="text-center px-2 border-l border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-rose-500 block">Damaged</span>
                      <strong className="text-sm font-black text-rose-600">{record.damagedPlantsCount}</strong>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DISEASE & PROBLEM REPORTING */}
      {activeTab === 'diseases' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Banana Disease & Pest Problem Reports</h2>
              <p className="text-xs text-slate-500 mt-0.5">Report bacterial wilt (BXW), Black Sigatoka, Panama disease, pests, and receive officer prescriptions.</p>
            </div>
            <Button
              variant="primary"
              className="!bg-rose-600 hover:!bg-rose-700 !text-white"
              onClick={() => {
                if (plantations.length === 0) {
                  triggerToast('Please register a banana field first.');
                  return;
                }
                setDiseaseForm((prev) => ({ ...prev, plantationId: plantations[0].id }));
                setFormError('');
                setModalOpen('disease');
              }}
            >
              🚨 Report Banana Disease / Problem
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredDiseases.map((report) => (
              <Card key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img loading="lazy" decoding="async" src={report.photos[0] || bananaPhoto} alt="Reported problem" className="w-16 h-16 rounded-xl object-cover border" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">{report.reportNumber} • {report.reportDate}</span>
                      <h4 className="text-base font-black text-slate-900">{report.problemTypeName || report.problemType}</h4>
                      <p className="text-xs text-slate-500">{report.plantationName}</p>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-black uppercase',
                      report.severity === 'CRITICAL' && 'bg-rose-100 text-rose-800 border border-rose-300',
                      report.severity === 'HIGH' && 'bg-amber-100 text-amber-800 border border-amber-300',
                      report.severity === 'MEDIUM' && 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                      report.severity === 'LOW' && 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {report.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl">
                  {report.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>⚠️ <strong>Affected Mats:</strong> {report.affectedPlantsCount} plants</span>
                  <span>📍 <strong>Location:</strong> {report.location}</span>
                </div>

                {/* Officer Advice Box if available */}
                {report.officerAdvice ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                        🧑🏽‍🌾 Agricultural Officer Response
                      </span>
                      <span className="text-emerald-700">{report.officerAdvice.officerName}</span>
                    </div>
                    <p className="text-xs font-bold text-emerald-950">
                      Diagnosis: <span className="font-normal">{report.officerAdvice.diagnosis}</span>
                    </p>
                    <p className="text-xs text-emerald-900">
                      <strong>Recommendation:</strong> {report.officerAdvice.recommendations}
                    </p>
                    {report.officerAdvice.actionTaken && (
                      <p className="text-[11px] text-emerald-800 italic">
                        Action Taken: {report.officerAdvice.actionTaken}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center justify-between">
                    <span>⏳ Waiting for Agricultural Officer Review</span>
                    <span className="font-bold">Status: {report.status}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: WEATHER & RAINFALL REPORTING */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Weather & Rainfall Monitoring</h2>
              <p className="text-xs text-slate-500 mt-0.5">Record heavy rainfall, strong wind lodging, flooding, and protective crop measures.</p>
            </div>
            <Button
              variant="primary"
              className="!bg-cyan-700 hover:!bg-cyan-800 !text-white"
              onClick={() => {
                if (plantations.length === 0) {
                  triggerToast('Please register a banana field first.');
                  return;
                }
                setWeatherForm((prev) => ({ ...prev, plantationId: plantations[0].id }));
                setFormError('');
                setModalOpen('weather');
              }}
            >
              🌧️ Log Weather Condition
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWeather.map((w) => (
              <Card key={w.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-100 text-cyan-800 font-extrabold text-xs px-3 py-1 flex items-center gap-1.5">
                    🌧️ {w.weatherCondition.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400">{w.reportDate}</span>
                </div>

                <div className="h-32 rounded-xl overflow-hidden bg-slate-100 relative">
                  <img loading="lazy" decoding="async" src={w.photos[0] || rainPhoto} alt="Weather incident" className="w-full h-full object-cover" />
                  {w.rainfallMm && (
                    <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
                      💧 {w.rainfallMm} mm
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-sm">{w.plantationName}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{w.impactDescription}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Damaged plants: <strong>{w.estimatedDamagedPlants || 0}</strong></span>
                  <span className="font-semibold text-emerald-700">{w.status}</span>
                </div>

                {w.officerAdvice && (
                  <div className="rounded-lg bg-emerald-50 p-2.5 text-[11px] text-emerald-900 border border-emerald-200">
                    <strong>Advisor note:</strong> {w.officerAdvice.recommendations}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: OFFICER ASSISTANCE & ADVICE */}
      {activeTab === 'assistance' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Farmer Assistance Requests & Agronomic Advice</h2>
            <p className="text-xs text-slate-500 mt-0.5">Direct communication with Agricultural Officers and Administrators for expert field support.</p>
          </div>

          <div className="space-y-4">
            {assistanceRequests.map((req) => (
              <Card key={req.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">{req.requestNumber}</span>
                      <span
                        className={clsx(
                          'rounded-full px-3 py-0.5 text-xs font-black uppercase',
                          req.status === 'RESOLVED' && 'bg-emerald-100 text-emerald-800',
                          req.status === 'IN_PROGRESS' && 'bg-purple-100 text-purple-800',
                          req.status === 'UNDER_REVIEW' && 'bg-blue-100 text-blue-800',
                          req.status === 'PENDING' && 'bg-amber-100 text-amber-800',
                          req.status === 'REJECTED' && 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {req.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{req.title}</h3>
                    <p className="text-xs text-slate-500">
                      📍 {req.plantationName} • Requested on {req.requestedDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedRequestForAdvice(req);
                        setModalOpen('advice_detail');
                      }}
                    >
                      View Full History ({req.adviceHistory.length})
                    </Button>
                    {req.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="!bg-emerald-700"
                         onClick={async () => {
                           await bananaService.updateAssistanceStatus(req.id, 'RESOLVED', 'Farmer confirmed problem resolved.');
                           await reloadData();
                           triggerToast('Request marked as resolved!');
                         }}
                      >
                        Mark as Resolved ✓
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{req.description}</p>

                {req.adviceHistory.length > 0 && (
                  <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                      <span>🧑🏽‍🌾 Officer Advice from {req.adviceHistory[0].officerName} ({req.adviceHistory[0].officerRole})</span>
                      <span className="text-emerald-700">{req.adviceHistory[0].adviceDate}</span>
                    </div>
                    <p className="text-xs text-emerald-900">
                      <strong>Diagnosis:</strong> {req.adviceHistory[0].diagnosis}
                    </p>
                    <p className="text-xs text-emerald-900">
                      <strong>Recommendation:</strong> {req.adviceHistory[0].recommendations}
                    </p>
                    {req.adviceHistory[0].recommendedProducts && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-bold text-emerald-800">Recommended inputs:</span>
                        {req.adviceHistory[0].recommendedProducts.map((p) => (
                          <span key={p} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: BANANA FARMING TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Banana Plantation Chronological Timeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Planting → Growth Monitoring → Disease Reports → Weather Incidents → Officer Advice → Harvest
            </p>
          </div>

          <div className="relative pl-6 border-l-2 border-emerald-200 space-y-8 ml-3">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                <span className="absolute -left-[33px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-emerald-600 text-sm shadow-sm">
                  {evt.icon}
                </span>

                <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className={clsx('rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase', evt.badgeColor)}>
                        {evt.badge}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">{evt.title}</h4>
                      <p className="text-xs text-slate-400">📅 {evt.date}</p>
                    </div>

                    {evt.photo && (
                      <img loading="lazy" decoding="async" src={evt.photo} alt="Timeline step" className="w-14 h-14 rounded-xl object-cover border" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{evt.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL 1: REGISTER BANANA PLANTATION --- */}
      {modalOpen === 'plantation' && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          title="🍌 Register Banana Field / Plantation"
          size="lg"
        >
          <form onSubmit={handleCreatePlantation} className="space-y-4">
            {formError && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Farm Name"
                value={plantationForm.farmName}
                onChange={(e) => setPlantationForm({ ...plantationForm, farmName: e.target.value })}
                required
              />
              <Input
                label="Field / Plot Name"
                placeholder="e.g. Block C - North Slope Plantation"
                value={plantationForm.fieldName}
                onChange={(e) => setPlantationForm({ ...plantationForm, fieldName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Banana Variety"
                value={plantationForm.variety}
                onChange={(e) => setPlantationForm({ ...plantationForm, variety: e.target.value as BananaVariety })}
                options={BANANA_VARIETIES}
                required
              />
              <Select
                label="Planting Method / Material"
                value={plantationForm.plantingMethod}
                onChange={(e) => setPlantationForm({ ...plantationForm, plantingMethod: e.target.value as BananaPlantingMethod })}
                options={PLANTING_METHODS}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Land Size (Hectares)"
                type="number"
                step="0.1"
                placeholder="e.g. 2.5"
                value={plantationForm.landSizeHectares}
                onChange={(e) => setPlantationForm({ ...plantationForm, landSizeHectares: e.target.value })}
                required
              />
              <Input
                label="Plants / Mats Planted Count"
                type="number"
                placeholder="e.g. 2200"
                value={plantationForm.plantsPlantedCount}
                onChange={(e) => setPlantationForm({ ...plantationForm, plantsPlantedCount: e.target.value })}
                required
              />
              <Input
                label="Planting Date"
                type="date"
                value={plantationForm.plantingDate}
                onChange={(e) => setPlantationForm({ ...plantationForm, plantingDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Location / Sector / GPS"
                value={plantationForm.location}
                onChange={(e) => setPlantationForm({ ...plantationForm, location: e.target.value })}
                placeholder="District, Sector, Cell"
              />
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Plantation Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, (url) => setPlantationForm({ ...plantationForm, photoUrl: url }))}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>

            <Textarea
              label="Farm / Soil Notes"
              placeholder="e.g. Well mulched with banana leaves, 3m x 3m spacing, deep volcanic soil."
              value={plantationForm.notes}
              onChange={(e) => setPlantationForm({ ...plantationForm, notes: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setModalOpen(null)}>Cancel</Button>
              <Button type="submit" variant="primary" className="!bg-emerald-700" isLoading={isSubmitting} disabled={isSubmitting}>Register Plantation</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- MODAL 2: RECORD GROWTH CONDITION --- */}
      {modalOpen === 'growth' && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          title="📈 Record Banana Growth & Monitoring"
          size="lg"
        >
          <form onSubmit={handleAddGrowthRecord} className="space-y-4">
            {formError && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Target Banana Field"
                value={growthForm.plantationId}
                onChange={(e) => setGrowthForm({ ...growthForm, plantationId: e.target.value })}
                options={plantations.map((p) => ({ value: p.id, label: `${p.fieldName} (${p.variety})` }))}
                required
              />
              <Input
                label="Inspection Date"
                type="date"
                value={growthForm.recordedDate}
                onChange={(e) => setGrowthForm({ ...growthForm, recordedDate: e.target.value })}
                required
              />
            </div>

            <Select
              label="Phenological Growth Stage"
              value={growthForm.stage}
              onChange={(e) => setGrowthForm({ ...growthForm, stage: e.target.value as BananaGrowthStage })}
              options={GROWTH_STAGES.map((s) => ({ value: s.value, label: `${s.label} - ${s.desc}` }))}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Average Plant Height (meters)"
                type="number"
                step="0.1"
                placeholder="e.g. 3.2"
                value={growthForm.plantHeightMeters}
                onChange={(e) => setGrowthForm({ ...growthForm, plantHeightMeters: e.target.value })}
              />
              <Input
                label="Average Pseudostem Girth (cm)"
                type="number"
                placeholder="e.g. 55"
                value={growthForm.averageStemGirthCm}
                onChange={(e) => setGrowthForm({ ...growthForm, averageStemGirthCm: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Healthy Plants Count"
                type="number"
                placeholder="e.g. 2150"
                value={growthForm.healthyPlantsCount}
                onChange={(e) => setGrowthForm({ ...growthForm, healthyPlantsCount: e.target.value })}
                required
              />
              <Input
                label="Damaged / Affected Plants Count"
                type="number"
                placeholder="e.g. 15"
                value={growthForm.damagedPlantsCount}
                onChange={(e) => setGrowthForm({ ...growthForm, damagedPlantsCount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Growth Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, (url) => setGrowthForm({ ...growthForm, photoUrl: url }))}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            <Textarea
              label="General Observations & Care Notes"
              placeholder="Describe leaf emergence rate, sucker spacing, flowering status, pest checks..."
              value={growthForm.observations}
              onChange={(e) => setGrowthForm({ ...growthForm, observations: e.target.value })}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setModalOpen(null)}>Cancel</Button>
              <Button type="submit" variant="primary" className="!bg-emerald-700" isLoading={isSubmitting} disabled={isSubmitting}>Save Growth Record</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- MODAL 3: REPORT BANANA DISEASE / PROBLEM --- */}
      {modalOpen === 'disease' && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          title="🚨 Report Banana Disease / Pest Problem"
          size="lg"
        >
          <form onSubmit={handleCreateDiseaseReport} className="space-y-4">
            {formError && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Affected Banana Field"
                value={diseaseForm.plantationId}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, plantationId: e.target.value })}
                options={plantations.map((p) => ({ value: p.id, label: `${p.fieldName} (${p.variety})` }))}
                required
              />
              <Input
                label="Date Observed"
                type="date"
                value={diseaseForm.reportDate}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, reportDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Problem Type"
                value={diseaseForm.problemType}
                onChange={(e) => {
                  const pt = e.target.value as BananaProblemType;
                  const found = PROBLEM_TYPES.find((p) => p.value === pt);
                  setDiseaseForm({
                    ...diseaseForm,
                    problemType: pt,
                    severity: found ? found.severity : 'MEDIUM',
                  });
                }}
                options={PROBLEM_TYPES.map((pt) => ({ value: pt.value, label: pt.label }))}
                required
              />
              <Select
                label="Severity Level"
                value={diseaseForm.severity}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, severity: e.target.value as ProblemSeverity })}
                options={[
                  { value: 'LOW', label: 'Low - Minor leaf spots or localized issue' },
                  { value: 'MEDIUM', label: 'Medium - Spread across multiple mats' },
                  { value: 'HIGH', label: 'High - Threatens bunch yield or rapid spread' },
                  { value: 'CRITICAL', label: 'Critical - Severe wilt / quarantine threat' },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Number of Affected Banana Plants"
                type="number"
                placeholder="e.g. 12"
                value={diseaseForm.affectedPlantsCount}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, affectedPlantsCount: e.target.value })}
                required
              />
              <Input
                label="Location / GPS on Farm"
                placeholder="e.g. North slope near road"
                value={diseaseForm.location}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Upload Photo of Affected Plants</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, (url) => setDiseaseForm({ ...diseaseForm, photoUrl: url }))}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
              />
            </div>

            <Textarea
              label="Problem Description"
              placeholder="Describe symptoms: premature fruit ripening, leaf yellowing, stem ooze, corm rot..."
              value={diseaseForm.description}
              onChange={(e) => setDiseaseForm({ ...diseaseForm, description: e.target.value })}
              required
            />

            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 flex items-center gap-3">
              <input
                type="checkbox"
                id="request_help"
                checked={diseaseForm.assistanceRequested}
                onChange={(e) => setDiseaseForm({ ...diseaseForm, assistanceRequested: e.target.checked })}
                className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="request_help" className="text-xs font-bold text-amber-900 cursor-pointer">
                🤝 <strong>Request Agricultural Officer Assistance:</strong> Alert agricultural officers and request on-site or digital management recommendations.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setModalOpen(null)}>Cancel</Button>
              <Button type="submit" variant="primary" className="!bg-rose-600 hover:!bg-rose-700 !text-white" isLoading={isSubmitting} disabled={isSubmitting}>
                Submit Disease Report
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- MODAL 4: LOG WEATHER & RAINFALL --- */}
      {modalOpen === 'weather' && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          title="🌧️ Record Weather Condition & Impact"
          size="lg"
        >
          <form onSubmit={handleCreateWeatherReport} className="space-y-4">
            {formError && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Target Banana Field"
                value={weatherForm.plantationId}
                onChange={(e) => setWeatherForm({ ...weatherForm, plantationId: e.target.value })}
                options={plantations.map((p) => ({ value: p.id, label: `${p.fieldName} (${p.variety})` }))}
                required
              />
              <Input
                label="Date of Incident"
                type="date"
                value={weatherForm.reportDate}
                onChange={(e) => setWeatherForm({ ...weatherForm, reportDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Weather Condition"
                value={weatherForm.weatherCondition}
                onChange={(e) => setWeatherForm({ ...weatherForm, weatherCondition: e.target.value as BananaWeatherCondition })}
                options={WEATHER_CONDITIONS.map((w) => ({ value: w.value, label: `${w.icon} ${w.label}` }))}
                required
              />
              <Input
                label="Rainfall (mm) (if measured)"
                type="number"
                placeholder="e.g. 45"
                value={weatherForm.rainfallMm}
                onChange={(e) => setWeatherForm({ ...weatherForm, rainfallMm: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Estimated Damaged Plants"
                type="number"
                placeholder="e.g. 10 (or 0 if no damage)"
                value={weatherForm.estimatedDamagedPlants}
                onChange={(e) => setWeatherForm({ ...weatherForm, estimatedDamagedPlants: e.target.value })}
              />
              <Select
                label="Wind / Storm Severity"
                value={weatherForm.windSeverity}
                onChange={(e) => setWeatherForm({ ...weatherForm, windSeverity: e.target.value as any })}
                options={[
                  { value: 'MILD', label: 'Mild - Light breeze / gentle rain' },
                  { value: 'MODERATE', label: 'Moderate - Heavy downpour' },
                  { value: 'SEVERE', label: 'Severe - High wind storm / minor lodging' },
                  { value: 'GALE_FORCE', label: 'Gale Force - Severe tree snap / flooding' },
                ]}
              />
            </div>

            <Textarea
              label="Impact on Banana Plantation"
              placeholder="e.g. Heavy winds snapped 14 mature pseudostems. Soil waterlogging in valley block."
              value={weatherForm.impactDescription}
              onChange={(e) => setWeatherForm({ ...weatherForm, impactDescription: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Weather / Damage Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, (url) => setWeatherForm({ ...weatherForm, photoUrl: url }))}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              />
            </div>

            <div className="rounded-2xl bg-cyan-50 p-4 border border-cyan-200 flex items-center gap-3">
              <input
                type="checkbox"
                id="weather_help"
                checked={weatherForm.assistanceRequested}
                onChange={(e) => setWeatherForm({ ...weatherForm, assistanceRequested: e.target.checked })}
                className="h-5 w-5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="weather_help" className="text-xs font-bold text-cyan-900 cursor-pointer">
                🤝 <strong>Request Emergency Support / Staking Bamboo allocation from Officer</strong>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setModalOpen(null)}>Cancel</Button>
              <Button type="submit" variant="primary" className="!bg-cyan-700 hover:!bg-cyan-800 !text-white" isLoading={isSubmitting} disabled={isSubmitting}>
                Save Weather Log
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- MODAL 5: OFFICER ADVICE DETAIL --- */}
      {modalOpen === 'advice_detail' && selectedRequestForAdvice && (
        <Modal
          isOpen={true}
          onClose={() => {
            setModalOpen(null);
            setSelectedRequestForAdvice(null);
          }}
          title={`📋 Advice History • ${selectedRequestForAdvice.requestNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 text-sm">{selectedRequestForAdvice.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{selectedRequestForAdvice.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span>Field: <strong>{selectedRequestForAdvice.plantationName}</strong></span>
                <span>Status: <strong className="text-emerald-700">{selectedRequestForAdvice.status}</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">Chronological Advice Entries</h5>
              {selectedRequestForAdvice.adviceHistory.map((adv) => (
                <div key={adv.id} className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-950">
                      🧑🏽‍🌾 {adv.officerName} ({adv.officerRole})
                    </span>
                    <span className="text-emerald-700">{adv.adviceDate}</span>
                  </div>
                  <p className="text-xs text-emerald-900"><strong>Diagnosis:</strong> {adv.diagnosis}</p>
                  <p className="text-xs text-emerald-900"><strong>Recommendations:</strong> {adv.recommendations}</p>
                  <p className="text-xs text-emerald-900"><strong>Action Taken:</strong> {adv.actionTaken}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => {
                  setModalOpen(null);
                  setSelectedRequestForAdvice(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
