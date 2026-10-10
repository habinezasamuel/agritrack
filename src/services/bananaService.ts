import { api } from './api';
import type {
  BananaPlantation,
  BananaGrowthRecord,
  BananaDiseaseReport,
  BananaWeatherReport,
  BananaAssistanceRequest,
  BananaOfficerAdvice,
  BananaDashboardSummary,
  AssistanceStatus,
} from '../types/banana';

const mapOfficerAdvice = (a: any): BananaOfficerAdvice => ({
  id: String(a.id),
  requestId: String(a.requestId || ''),
  officerId: String(a.officerId || ''),
  officerName: a.officerName || '',
  officerRole: a.officerRole || 'Agricultural Officer',
  adviceDate: a.adviceDate || a.createdAt || '',
  diagnosis: a.diagnosis || '',
  recommendations: a.recommendations || '',
  actionTaken: a.actionTaken || '',
  recommendedProducts: Array.isArray(a.recommendedProducts)
    ? a.recommendedProducts
    : a.recommendedProducts
      ? [a.recommendedProducts]
      : [],
  followUpDate: a.followUpDate || undefined,
  createdAt: a.createdAt || '',
});

interface BananaDashboardData {
  summary: BananaDashboardSummary;
  plantations: BananaPlantation[];
  growthRecords: BananaGrowthRecord[];
  diseaseReports: BananaDiseaseReport[];
  weatherReports: BananaWeatherReport[];
  assistanceRequests: BananaAssistanceRequest[];
}

const mapWeatherReport = (w: any): BananaWeatherReport => ({
  id: String(w.id),
  reportNumber: w.reportNumber || '',
  plantationId: String(w.plantationId || ''),
  plantationName: w.plantationName || '',
  farmerId: String(w.farmerId || ''),
  farmerName: w.farmerName || '',
  reportDate: w.eventDate || w.reportDate || '',
  weatherCondition: w.weatherCondition || 'OTHER',
  impactDescription: w.description || w.impactDescription || '',
  estimatedDamagedPlants: w.affectedPlantsCount ?? w.estimatedDamagedPlants ?? 0,
  rainfallMm: w.rainfallMm,
  windSeverity: w.damageLevel || w.windSeverity,
  photos: Array.isArray(w.photos) ? w.photos : w.photos ? [w.photos] : [],
  assistanceRequested: !!w.assistanceRequested,
  status: w.status || 'LOGGED',
  officerAdvice: w.officerAdvice ? mapOfficerAdvice(w.officerAdvice) : undefined,
  createdAt: w.createdAt || '',
});

const mapRelatedReportType = (category?: string): BananaAssistanceRequest['relatedReportType'] => {
  const c = String(category || '').toUpperCase();
  if (c.includes('DISEASE')) return 'DISEASE';
  if (c.includes('WEATHER')) return 'WEATHER';
  return 'GENERAL_AGRONOMY';
};

const mapUrgency = (urgency?: string): BananaAssistanceRequest['urgency'] => {
  const u = String(urgency || '').toUpperCase();
  if (u === 'LOW' || u === 'HIGH' || u === 'CRITICAL') return u;
  return 'MEDIUM';
};

const mapAssistanceRequest = (r: any): BananaAssistanceRequest => ({
  id: String(r.id),
  requestNumber: r.requestNumber || '',
  farmerId: String(r.farmerId || ''),
  farmerName: r.farmerName || '',
  farmerPhone: r.farmerPhone || '',
  plantationId: String(r.plantationId || ''),
  plantationName: r.plantationName || '',
  relatedReportType: mapRelatedReportType(r.category),
  relatedReportId: r.relatedReportId ? String(r.relatedReportId) : undefined,
  title: r.subject || r.title || '',
  description: r.description || '',
  urgency: mapUrgency(r.urgency),
  status: r.status || 'PENDING',
  photos: Array.isArray(r.photos) ? r.photos : r.photos ? [r.photos] : [],
  requestedDate: r.requestedDate || r.createdAt || '',
  adviceHistory: Array.isArray(r.adviceHistory) ? r.adviceHistory.map(mapOfficerAdvice) : [],
  actionTaken: r.actionTaken || undefined,
  assignedOfficerName: r.assignedOfficerName || undefined,
  createdAt: r.createdAt || '',
  updatedAt: r.updatedAt || r.createdAt || '',
});

class BananaService {
  private dashboardRequest: { token: string | null; promise: Promise<BananaDashboardData> } | null = null;

  getDashboardData(): Promise<BananaDashboardData> {
    const token = api.getAccessToken();
    if (this.dashboardRequest?.token === token) return this.dashboardRequest.promise;
    const promise = api.get<BananaDashboardData>('/banana/dashboard-summary/', { include_records: 1 }, { timeout: 30000 })
      .then((data) => ({
        ...data,
        weatherReports: data.weatherReports.map(mapWeatherReport),
        assistanceRequests: data.assistanceRequests.map(mapAssistanceRequest),
      }));
    const request = { token, promise };
    this.dashboardRequest = request;
    void promise.finally(() => {
      if (this.dashboardRequest === request) this.dashboardRequest = null;
    }).catch(() => {});
    return promise;
  }
  async syncWithBackend(): Promise<void> {
    try {
      await Promise.all([
        this.getPlantations(),
        this.getGrowthRecords(),
        this.getDiseaseReports(),
        this.getWeatherReports(),
        this.getAssistanceRequests(),
      ]);
      window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
    } catch (e) {
      console.warn('Banana cloud sync deferred:', e);
    }
  }

  // --- Plantations ---
  async getPlantations(): Promise<BananaPlantation[]> {
    return api.get<BananaPlantation[]>('/banana/plantations/');
  }

  async getPlantationById(id: string): Promise<BananaPlantation | undefined> {
    const plantations = await this.getPlantations();
    return plantations.find((p) => p.id === String(id));
  }

  async createPlantation(data: Omit<BananaPlantation, 'id' | 'createdAt' | 'updatedAt'>): Promise<BananaPlantation> {
    const created = await api.post<BananaPlantation>('/banana/plantations/', {
      fieldName: data.fieldName,
      variety: data.variety,
      landSizeHectares: data.landSizeHectares,
      plantingDate: data.plantingDate,
      plantsPlantedCount: data.plantsPlantedCount,
      photoUrl: data.photoUrl,
      notes: data.notes,
    });
    this.dispatchNotification(
      'New Banana Plantation Registered',
      `Field "${data.fieldName}" with ${data.plantsPlantedCount.toLocaleString()} plants registered successfully.`,
      'SUCCESS'
    );
    window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
    return created;
  }

  async updatePlantation(id: string, updates: Partial<BananaPlantation>): Promise<BananaPlantation | null> {
    try {
      const updated = await api.patch<BananaPlantation>(`/banana/plantations/${id}/`, {
        fieldName: updates.fieldName,
        variety: updates.variety,
        landSizeHectares: updates.landSizeHectares,
        photoUrl: updates.photoUrl,
        notes: updates.notes,
        status: updates.status,
      });
      window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
      return updated;
    } catch (e) {
      console.warn('Failed to update banana plantation', e);
      return null;
    }
  }

  async deletePlantation(id: string): Promise<boolean> {
    try {
      await api.delete(`/banana/plantations/${id}/`);
      window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
      return true;
    } catch (e) {
      console.warn('Failed to delete banana plantation', e);
      return false;
    }
  }

  // --- Growth Records ---
  async getGrowthRecords(plantationId?: string): Promise<BananaGrowthRecord[]> {
    const query = plantationId ? `?plantation_id=${encodeURIComponent(plantationId)}` : '';
    return api.get<BananaGrowthRecord[]>(`/banana/growth-records/${query}`);
  }

  async addGrowthRecord(data: Omit<BananaGrowthRecord, 'id' | 'createdAt'>): Promise<BananaGrowthRecord> {
    const created = await api.post<BananaGrowthRecord>('/banana/growth-records/', {
      plantationId: data.plantationId,
      recordedDate: data.recordedDate,
      stage: data.stage,
      plantHeightMeters: data.plantHeightMeters,
      averageStemGirthCm: data.averageStemGirthCm,
      healthyPlantsCount: data.healthyPlantsCount,
      damagedPlantsCount: data.damagedPlantsCount,
      observations: data.observations,
      photos: data.photos,
    });
    this.dispatchNotification(
      'Growth Monitoring Updated',
      `Recorded growth condition for ${data.plantationName} (${data.healthyPlantsCount} healthy plants).`,
      'INFO'
    );
    window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
    return created;
  }

  // --- Disease Reports ---
  async getDiseaseReports(plantationId?: string): Promise<BananaDiseaseReport[]> {
    const reports = await api.get<BananaDiseaseReport[]>('/banana/disease-reports/');
    return plantationId ? reports.filter((r) => r.plantationId === plantationId) : reports;
  }

  async createDiseaseReport(data: Omit<BananaDiseaseReport, 'id' | 'reportNumber' | 'createdAt' | 'updatedAt'>): Promise<BananaDiseaseReport> {
    const created = await api.post<BananaDiseaseReport>('/banana/disease-reports/', {
      plantationId: data.plantationId,
      reportDate: data.reportDate,
      problemType: data.problemType,
      description: data.description,
      affectedPlantsCount: data.affectedPlantsCount,
      severity: data.severity,
      location: data.location,
      photos: data.photos,
      notes: data.notes,
      assistanceRequested: data.assistanceRequested,
    });
    this.dispatchNotification(
      'Banana Problem Reported',
      `Report ${created.reportNumber} (${data.problemTypeName || data.problemType}) logged. ${data.assistanceRequested ? 'Officer assistance requested.' : ''}`,
      'WARNING'
    );
    window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
    return created;
  }

  async updateDiseaseReport(_id: string, _updates: Partial<BananaDiseaseReport>): Promise<BananaDiseaseReport | null> {
    return null;
  }

  // --- Weather Reports ---
  async getWeatherReports(plantationId?: string): Promise<BananaWeatherReport[]> {
    const raw = await api.get<any[]>('/banana/weather-reports/');
    const reports = raw.map(mapWeatherReport);
    return plantationId ? reports.filter((r) => r.plantationId === plantationId) : reports;
  }

  async createWeatherReport(data: Omit<BananaWeatherReport, 'id' | 'reportNumber' | 'createdAt'>): Promise<BananaWeatherReport> {
    const res = await api.post<any>('/banana/weather-reports/', {
      plantationId: data.plantationId,
      eventDate: data.reportDate,
      weatherCondition: data.weatherCondition,
      description: data.impactDescription,
      affectedPlantsCount: data.estimatedDamagedPlants ?? 0,
      damageLevel: data.windSeverity || 'MILD',
      photos: data.photos,
      assistanceRequested: data.assistanceRequested,
    });
    const created = mapWeatherReport(res);
    this.dispatchNotification(
      'Weather Impact Recorded',
      `Weather log ${created.reportNumber} recorded for ${created.plantationName}.`,
      'INFO'
    );
    window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
    return created;
  }

  // --- Assistance Requests ---
  async getAssistanceRequests(plantationId?: string): Promise<BananaAssistanceRequest[]> {
    const raw = await api.get<any[]>('/banana/assistance-requests/');
    const requests = raw.map(mapAssistanceRequest);
    return plantationId ? requests.filter((r) => r.plantationId === plantationId) : requests;
  }

  async createAssistanceRequest(data: Omit<BananaAssistanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<BananaAssistanceRequest> {
    const res = await api.post<any>('/banana/assistance-requests/', {
      plantationId: data.plantationId,
      subject: data.title,
      category:
        data.relatedReportType === 'WEATHER'
          ? 'WEATHER_DAMAGE'
          : data.relatedReportType === 'DISEASE'
            ? 'DISEASE_OUTBREAK'
            : 'GENERAL_AGRONOMY',
      description: data.description,
      urgency: data.urgency,
    });
    const created = mapAssistanceRequest(res);
    window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
    return created;
  }

  async addOfficerAdvice(
    requestId: string,
    adviceData: Omit<BananaOfficerAdvice, 'id' | 'requestId' | 'createdAt'>,
    newStatus: AssistanceStatus = 'IN_PROGRESS'
  ): Promise<BananaAssistanceRequest | null> {
    try {
      const res = await api.post<any>(`/banana/assistance-requests/${requestId}/advice/`, {
        diagnosis: adviceData.diagnosis,
        recommendations: adviceData.recommendations,
        recommendedProducts: adviceData.recommendedProducts || [],
        actionTaken: adviceData.actionTaken,
        followUpDate: adviceData.followUpDate,
        newStatus,
      });
      this.dispatchNotification(
        'Agricultural Officer Responded',
        `Officer ${adviceData.officerName} provided recommendations for request ${requestId}.`,
        'SUCCESS'
      );
      window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
      return mapAssistanceRequest(res);
    } catch (e) {
      console.warn('Failed to submit officer advice', e);
      return null;
    }
  }

  async updateAssistanceStatus(requestId: string, status: AssistanceStatus, actionTaken?: string): Promise<BananaAssistanceRequest | null> {
    try {
      const res = await api.patch<any>(`/banana/assistance-requests/${requestId}/status/`, { status, actionTaken });
      this.dispatchNotification(
        'Assistance Status Updated',
        `Request status changed to ${status}.`,
        status === 'RESOLVED' ? 'SUCCESS' : 'INFO'
      );
      window.dispatchEvent(new CustomEvent('agritrack:banana-data-synced'));
      return mapAssistanceRequest(res);
    } catch (e) {
      console.warn('Failed to update assistance status', e);
      return null;
    }
  }

  // --- Summary & Dashboard Aggregates ---
  async getDashboardSummary(): Promise<BananaDashboardSummary> {
    return api.get<BananaDashboardSummary>('/banana/dashboard-summary/');
  }

  private dispatchNotification(title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR') {
    try {
      const newNotif = {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        relatedEntityType: 'BANANA_FARMING',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent('agritrack:notification-received', { detail: newNotif }));
    } catch (e) {
      console.error('Failed to dispatch notification', e);
    }
  }
}

export const bananaService = new BananaService();
export default bananaService;
