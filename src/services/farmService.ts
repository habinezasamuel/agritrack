import { api } from './api';
import type {
  CropSeason,
  HarvestEntry,
  Activity,
  Task,
  GrowthObservation,
  WaterRecord,
  Sale,
  CropProblem,
  DashboardStats,
  Field,
  Farm,
  CropType,
  CropVariety,
  Season,
} from '../types';

interface CropSeasonsResponse { cropSeasons: CropSeason[] }
interface HarvestsResponse { harvests: HarvestEntry[] }
interface ActivitiesResponse { activities: Activity[] }
interface TasksResponse { tasks: Task[] }
interface ObservationsResponse { observations: GrowthObservation[] }
interface WaterRecordsResponse { waterRecords: WaterRecord[] }
interface SalesResponse { sales: Sale[] }
interface ProblemsResponse { problems: CropProblem[] }
interface FarmsResponse { farms: Farm[] }
interface FieldsResponse { fields: Field[] }
interface CropCatalogResponse { cropTypes: CropType[]; varieties: CropVariety[]; seasons: Season[] }

export interface CropSeasonCreate {
  fieldId: string;
  plantingDate: string;
  seasonId?: string;
  plantingMethod?: 'DIRECT_SEEDING' | 'TRANSPLANTING';
  plantedAreaHectares?: number;
  expectedGrowingDurationDays?: number;
  estimatedHarvestDate?: string;
  notes?: string;
  status?: string;
}

export interface TaskCreate {
  cropSeasonId: string;
  title: string;
  description?: string;
  dueDate: string;
  priority?: Task['priority'];
}

export interface TaskUpdate {
  completed?: boolean;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: Task['priority'];
}

export interface HarvestCreate {
  cropSeasonId: string;
  harvestDate: string;
  quantityKg: number;
  qualityGrade?: string;
  harvestPlotName?: string;
  areaHectares?: number;
  moistureContentPercent?: number;
  notes?: string;
}

export interface ActivityCreate {
  cropSeasonId: string;
  type?: string;
  activityDate: string;
  description?: string;
  cost?: number;
  paymentMethod?: string;
  reference?: string;
}

export interface GrowthObservationCreate {
  cropSeasonId: string;
  stage: string;
  observedDate: string;
  notes?: string;
  photos?: string[];
}

export interface WaterRecordCreate {
  cropSeasonId: string;
  recordDate?: string;
  waterDepthCm?: number;
  waterCondition?: string;
  notes?: string;
}

export interface SaleCreate {
  buyerName: string;
  quantityKg: number;
  unitPrice: number;
  saleDate: string;
  cropSeasonId?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}

export interface CropProblemCreate {
  description: string;
  cropSeasonId?: string;
  fieldId?: string;
  problemType?: string;
  severity?: string;
  affectedAreaHectares?: number;
  photos?: string[];
  reportedDate?: string;
}

export const farmService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/dashboard-stats/');
  },

  async getFarms(): Promise<Farm[]> {
    const res = await api.get<FarmsResponse>('/farms/');
    return res.farms;
  },

  async createFarm(data: { name: string; sizeHectares: number; location?: string }): Promise<Farm> {
    return api.post<Farm>('/farms/', data);
  },

  async getFields(): Promise<Field[]> {
    const res = await api.get<FieldsResponse>('/fields/');
    return res.fields;
  },

  async createField(data: { farmId: string; name: string; areaHectares: number; cropType?: string; variety?: string }): Promise<Field> {
    return api.post<Field>('/fields/', data);
  },

  async getCropCatalog(): Promise<CropCatalogResponse> {
    return api.get<CropCatalogResponse>('/crop-catalog/');
  },

  async getCropSeasons(): Promise<CropSeason[]> {
    const res = await api.get<CropSeasonsResponse>('/crop-seasons/');
    return res.cropSeasons;
  },

  async createCropSeason(data: CropSeasonCreate): Promise<CropSeason> {
    return api.post<CropSeason>('/crop-seasons/', data);
  },

  async deleteCropSeason(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/crop-seasons/${id}/`);
  },

  async getHarvestRecords(): Promise<HarvestEntry[]> {
    const res = await api.get<HarvestsResponse>('/harvest-records/');
    return res.harvests;
  },

  async createHarvestRecord(data: HarvestCreate): Promise<HarvestEntry> {
    return api.post<HarvestEntry>('/harvest-records/', data);
  },

  async getActivities(): Promise<Activity[]> {
    const res = await api.get<ActivitiesResponse>('/activities/');
    return res.activities;
  },

  async createActivity(data: ActivityCreate): Promise<Activity> {
    return api.post<Activity>('/activities/', data);
  },

  async getTasks(): Promise<Task[]> {
    const res = await api.get<TasksResponse>('/tasks/');
    return res.tasks;
  },

  async createTask(data: TaskCreate): Promise<Task> {
    return api.post<Task>('/tasks/', data);
  },

  async updateTask(id: string, data: TaskUpdate): Promise<Task> {
    return api.patch<Task>(`/tasks/${id}/`, data);
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/tasks/${id}/`);
  },

  async getGrowthObservations(): Promise<GrowthObservation[]> {
    const res = await api.get<ObservationsResponse>('/growth-observations/');
    return res.observations;
  },

  async createGrowthObservation(data: GrowthObservationCreate): Promise<GrowthObservation> {
    return api.post<GrowthObservation>('/growth-observations/', data);
  },

  async getWaterRecords(): Promise<WaterRecord[]> {
    const res = await api.get<WaterRecordsResponse>('/water-records/');
    return res.waterRecords;
  },

  async createWaterRecord(data: WaterRecordCreate): Promise<WaterRecord> {
    return api.post<WaterRecord>('/water-records/', data);
  },

  async getSales(): Promise<Sale[]> {
    const res = await api.get<SalesResponse>('/sales/');
    return res.sales;
  },

  async createSale(data: SaleCreate): Promise<Sale> {
    return api.post<Sale>('/sales/', data);
  },

  async getCropProblems(): Promise<CropProblem[]> {
    const res = await api.get<ProblemsResponse>('/crop-problem-reports/');
    return res.problems;
  },

  async createCropProblem(data: CropProblemCreate): Promise<CropProblem> {
    return api.post<CropProblem>('/crop-problem-reports/', data);
  },
};

export default farmService;
