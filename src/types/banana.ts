export type BananaVariety =
  | 'FHIA-17'
  | 'Grand Nain'
  | 'Cavendish'
  | 'Gros Michel'
  | 'Cooking Banana (Injagi)'
  | 'Beer Banana (Kayinja)'
  | 'Plantain (Agatoki)'
  | 'East African Highland Banana'
  | 'Other';

export type BananaPlantingMethod = 'SUCKERS' | 'TISSUE_CULTURE' | 'CORM_SPLIT';

export type BananaGrowthStage =
  | 'VEGETATIVE_EARLY'
  | 'VEGETATIVE_MATURE'
  | 'SHOOTING'
  | 'FLOWERING_HEART'
  | 'BUNCH_DEVELOPMENT'
  | 'MATURATION'
  | 'HARVEST_PHASE';

export type BananaProblemType =
  | 'BANANA_BACTERIAL_WILT'
  | 'BLACK_SIGATOKA'
  | 'PANAMA_DISEASE'
  | 'BANANA_WEEVIL'
  | 'PESTS'
  | 'YELLOWING_LEAVES'
  | 'DRYING_LEAVES'
  | 'BROKEN_PLANTS'
  | 'POOR_GROWTH'
  | 'OTHER';

export type ProblemSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AssistanceStatus = 'PENDING' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type BananaWeatherCondition =
  | 'HEAVY_RAIN'
  | 'TOO_MUCH_RAINFALL'
  | 'LOW_RAINFALL_DROUGHT'
  | 'STRONG_WIND_LODGING'
  | 'FLOODING_WATERLOGGING'
  | 'HAIL'
  | 'NORMAL_RAINFALL'
  | 'OTHER';

export interface BananaPlantation {
  id: string;
  farmId: string;
  farmName: string;
  fieldName: string;
  variety: BananaVariety;
  landSizeHectares: number;
  plantingDate: string;
  plantsPlantedCount: number;
  plantingMethod: BananaPlantingMethod;
  soilType?: string;
  irrigationMethod?: string;
  location: string;
  photoUrl?: string;
  notes?: string;
  status: 'GROWING' | 'SHOOTING' | 'FLOWERING' | 'HARVEST_READY' | 'RENOVATING';
  createdAt: string;
  updatedAt: string;
}

export interface BananaGrowthRecord {
  id: string;
  plantationId: string;
  plantationName: string;
  recordedDate: string;
  stage: BananaGrowthStage;
  plantHeightMeters?: number;
  averageStemGirthCm?: number;
  healthyPlantsCount: number;
  damagedPlantsCount: number;
  observations: string;
  photos: string[];
  recordedByName: string;
  createdAt: string;
}

export interface BananaOfficerAdvice {
  id: string;
  requestId: string;
  officerId: string;
  officerName: string;
  officerRole: string;
  adviceDate: string;
  diagnosis: string;
  recommendations: string;
  actionTaken: string;
  recommendedProducts?: string[];
  followUpDate?: string;
  createdAt: string;
}

export interface BananaDiseaseReport {
  id: string;
  reportNumber: string;
  plantationId: string;
  plantationName: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  reportDate: string;
  problemType: BananaProblemType;
  problemTypeName?: string;
  severity: ProblemSeverity;
  description: string;
  affectedPlantsCount: number;
  location: string;
  photos: string[];
  notes?: string;
  assistanceRequested: boolean;
  status: AssistanceStatus;
  officerAdvice?: BananaOfficerAdvice;
  createdAt: string;
  updatedAt: string;
}

export interface BananaWeatherReport {
  id: string;
  reportNumber: string;
  plantationId: string;
  plantationName: string;
  farmerId: string;
  farmerName: string;
  reportDate: string;
  weatherCondition: BananaWeatherCondition;
  impactDescription: string;
  estimatedDamagedPlants?: number;
  rainfallMm?: number;
  windSeverity?: 'MILD' | 'MODERATE' | 'SEVERE' | 'GALE_FORCE';
  photos: string[];
  assistanceRequested: boolean;
  status: 'LOGGED' | 'ASSISTANCE_REQUESTED' | 'REVIEWED' | 'RESOLVED';
  officerAdvice?: BananaOfficerAdvice;
  createdAt: string;
}

export interface BananaAssistanceRequest {
  id: string;
  requestNumber: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  plantationId: string;
  plantationName: string;
  relatedReportType: 'DISEASE' | 'WEATHER' | 'GENERAL_AGRONOMY';
  relatedReportId?: string;
  title: string;
  description: string;
  urgency: ProblemSeverity;
  status: AssistanceStatus;
  photos: string[];
  requestedDate: string;
  adviceHistory: BananaOfficerAdvice[];
  actionTaken?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BananaDashboardSummary {
  totalPlantations: number;
  totalPlants: number;
  healthyPlants: number;
  affectedPlants: number;
  healthRatePercent: number | null;
  activeDiseaseReports: number;
  weatherReportsCount: number;
  pendingAssistanceRequests: number;
  resolvedProblemsCount: number;
}
