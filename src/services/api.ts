import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { InflightReads } from './inflightReads';
import type { LoginCredentials, AuthResponse, User, PaginatedResponse, RegisterData, ApiError } from '../types';
import type { 
  LivestockAnimal, 
  AnimalDiseaseReport, 
  FeedShortageReport, 
  LivestockHealthRecord, 
  LivestockSummaryStats 
} from '../types';
import { 
  mockLogin, 
  mockRegister, 
  mockLogout, 
  mockRefreshToken, 
  getStoredUser, 
  getAccessToken, 
  isAuthenticated,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  CURRENT_USER_KEY
} from './mockAuth';
import {
  getStoredAnimals,
  saveStoredAnimals,
  getStoredDiseaseReports,
  saveStoredDiseaseReports,
  getStoredFeedShortages,
  saveStoredFeedShortages,
  getStoredHealthRecords,
  saveStoredHealthRecords,
  computeLivestockStats,
} from './mockLivestock';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const GATEWAY_ERROR_STATUSES = [502, 503, 504];
const MAX_GATEWAY_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 30000;
const GATEWAY_RETRY_BASE_DELAY_MS = 1000;

class ApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;
  private useMock: boolean;
  private reads = new InflightReads();
  private readGeneration = 0;

  constructor() {
    this.useMock = USE_MOCK;
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: REQUEST_TIMEOUT_MS,
    });

    if (!this.useMock) {
      this.client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          const token = localStorage.getItem(ACCESS_TOKEN_KEY);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      this.client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError<ApiError>) => {
          const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
            _retryCount?: number;
          };

          const isAuthRequest = /\/auth\/(login|register|refresh)\/?$/.test(originalRequest?.url || '');
          if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;

            try {
              const newToken = await this.refreshAccessToken();
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.client(originalRequest);
            } catch (refreshError) {
              if ((refreshError as AxiosError).response?.status === 401 || !localStorage.getItem(REFRESH_TOKEN_KEY)) {
                this.clearAuth();
              }
              return Promise.reject(
                this.formatError(refreshError as AxiosError<ApiError>)
              );
            }
          }

          if (
            this.isTransientServerError(error) &&
            originalRequest && this.isIdempotentRequest(originalRequest)
          ) {
            const retryCount = originalRequest._retryCount ?? 0;
            if (retryCount < MAX_GATEWAY_RETRIES) {
              originalRequest._retryCount = retryCount + 1;
              const delay = GATEWAY_RETRY_BASE_DELAY_MS * 2 ** retryCount;
              await new Promise((resolve) => setTimeout(resolve, delay));
              return this.client(originalRequest);
            }
          }

          return Promise.reject(this.formatError(error));
        }
      );
    }
  }

  isMockMode(): boolean {
    return this.useMock;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.useMock) {
      const result = mockRefreshToken();
      return result.accessToken;
    }

    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<{ accessToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true, timeout: 10000 }
      );

      const { accessToken } = response.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      return accessToken;
    })();

    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private isTransientServerError(error: AxiosError): boolean {
    const status = error.response?.status;
    return status !== undefined && GATEWAY_ERROR_STATUSES.includes(status);
  }

  private isIdempotentRequest(config: InternalAxiosRequestConfig): boolean {
    const method = (config.method || 'get').toLowerCase();
    return method === 'get' || method === 'head' || method === 'options';
  }

  private formatError(error: AxiosError<ApiError>): Error & { statusCode?: number; details?: Record<string, string[]>; isTimeout: boolean } {
    let message: string;

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const method = (error.config?.method || 'get').toLowerCase();
      message = ['get', 'head', 'options'].includes(method)
        ? 'The request timed out. Please try loading the records again.'
        : 'The save request timed out. Check your records before submitting again; the server may have saved it.';
    } else if (error.response?.data?.code === 'database_unavailable') {
      message = error.response.data.message;
    } else if (!error.response) {
      message = 'Unable to reach the server. Please check your connection and try again.';
    } else if (this.isTransientServerError(error)) {
      message = `The server is temporarily unavailable (HTTP ${error.response.status}). Please try again in a few moments.`;
    } else {
      const body = error.response.data as ApiError & { error?: string; detail?: string };
      message = (typeof body === 'object' && (body?.message || body?.error || body?.detail))
        || `The server returned HTTP ${error.response.status}. Please try again.`;
      if (error.response.status === 400 && body?.details) {
        const details = Object.values(body.details).flat().filter((value) => typeof value === 'string');
        if (details.length) message += ` ${details.join(' ')}`;
      }
    }

    const formattedError = new Error(message) as Error & { statusCode?: number; details?: Record<string, string[]>; isTimeout: boolean };
    formattedError.isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';

    formattedError.statusCode = error.response?.status;
    formattedError.details = error.response?.data?.details;

    return formattedError;
  }

  private clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  setUser(user: User): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    return getStoredUser();
  }

  getAccessToken(): string | null {
    return getAccessToken();
  }

  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  logout(): void {
    if (this.useMock) {
      mockLogout();
    } else {
      this.clearAuth();
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (this.useMock) {
      return mockLogin(credentials);
    }
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    if (this.useMock) {
      return mockRegister(userData);
    }
    const response = await this.client.post<AuthResponse>('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    if (this.useMock) {
      const user = getStoredUser();
      if (!user) throw new Error('Not authenticated');
      return user;
    }
    return this.get<User>('/auth/me');
  }



  async get<T>(url: string, params?: Record<string, unknown>, options?: { timeout?: number }): Promise<T> {
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    const timeout = options?.timeout ?? 30000;
    const key = JSON.stringify([this.getAccessToken(), this.getUser()?.id, this.readGeneration, url, params, timeout]);
    return this.reads.run<T>(key, async () => {
      const response = await this.client.get<T>(url, { params, timeout });
      return response.data;
    });
  }

  async getPaginated<T>(url: string, params?: Record<string, unknown>): Promise<PaginatedResponse<T>> {
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    return this.get<PaginatedResponse<T>>(url, params);
  }

  async post<T>(url: string, data?: unknown, options?: { timeout?: number; headers?: Record<string, string> }): Promise<T> {
    this.readGeneration += 1;
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    const response = await this.client.post<T>(url, data, options);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    this.readGeneration += 1;
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    this.readGeneration += 1;
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    this.readGeneration += 1;
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    if (this.useMock) {
      throw new Error('Mock API: use specific mock methods');
    }
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    return response.data;
  }

  // ==========================================
  // LIVESTOCK & ANIMAL MANAGEMENT METHODS
  // ==========================================

  async getLivestockAnimals(): Promise<LivestockAnimal[]> {
    if (this.useMock) {
      return getStoredAnimals();
    }
    return this.get<LivestockAnimal[]>('/livestock/animals/');
  }

  async registerLivestockAnimal(data: Omit<LivestockAnimal, 'id' | 'createdAt' | 'updatedAt'>): Promise<LivestockAnimal> {
    if (this.useMock) {
      const animals = getStoredAnimals();
      const newAnimal: LivestockAnimal = {
        ...data,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      animals.unshift(newAnimal);
      saveStoredAnimals(animals);
      return newAnimal;
    }
    return this.post<LivestockAnimal>('/livestock/animals/', data);
  }

  async updateLivestockAnimal(id: string, updates: Partial<LivestockAnimal>): Promise<LivestockAnimal> {
    if (this.useMock) {
      const animals = getStoredAnimals();
      const index = animals.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Animal not found');
      animals[index] = { ...animals[index], ...updates, updatedAt: new Date().toISOString() };
      saveStoredAnimals(animals);
      return animals[index];
    }
    return this.patch<LivestockAnimal>(`/livestock/animals/${id}/`, updates);
  }

  async deleteLivestockAnimal(id: string): Promise<{ success: boolean }> {
    if (this.useMock) {
      const animals = getStoredAnimals().filter((a) => a.id !== id);
      saveStoredAnimals(animals);
      return { success: true };
    }
    return this.delete<{ success: boolean }>(`/livestock/animals/${id}/`);
  }

  async getAnimalDiseaseReports(): Promise<AnimalDiseaseReport[]> {
    if (this.useMock) {
      return getStoredDiseaseReports();
    }
    return this.get<AnimalDiseaseReport[]>('/livestock/disease-reports/');
  }

  async createAnimalDiseaseReport(data: Omit<AnimalDiseaseReport, 'id' | 'reportNumber' | 'createdAt' | 'updatedAt' | 'status'>): Promise<AnimalDiseaseReport> {
    if (this.useMock) {
      const reports = getStoredDiseaseReports();
      const reportNumber = `ADR-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
      const newReport: AnimalDiseaseReport = {
        ...data,
        id: String(Date.now()),
        reportNumber,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reports.unshift(newReport);
      saveStoredDiseaseReports(reports);

      if (data.animalId) {
        const animals = getStoredAnimals();
        const animalIndex = animals.findIndex((a) => a.id === data.animalId);
        if (animalIndex !== -1) {
          animals[animalIndex].healthStatus = 'SICK';
          saveStoredAnimals(animals);
        }
      }

      return newReport;
    }
    return this.post<AnimalDiseaseReport>('/livestock/disease-reports/', data);
  }

  async updateAnimalDiseaseReport(id: string, updates: Partial<AnimalDiseaseReport>): Promise<AnimalDiseaseReport> {
    if (this.useMock) {
      const reports = getStoredDiseaseReports();
      const index = reports.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Disease report not found');
      reports[index] = { ...reports[index], ...updates, updatedAt: new Date().toISOString() };
      saveStoredDiseaseReports(reports);
      return reports[index];
    }
    return this.patch<AnimalDiseaseReport>(`/livestock/disease-reports/${id}/`, updates);
  }

  async getFeedShortageReports(): Promise<FeedShortageReport[]> {
    if (this.useMock) {
      return getStoredFeedShortages();
    }
    return this.get<FeedShortageReport[]>('/livestock/feed-shortages/');
  }

  async createFeedShortageReport(data: Omit<FeedShortageReport, 'id' | 'reportNumber' | 'createdAt' | 'updatedAt' | 'status'>): Promise<FeedShortageReport> {
    if (this.useMock) {
      const reports = getStoredFeedShortages();
      const reportNumber = `FSR-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;
      const newReport: FeedShortageReport = {
        ...data,
        id: String(Date.now()),
        reportNumber,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reports.unshift(newReport);
      saveStoredFeedShortages(reports);
      return newReport;
    }
    return this.post<FeedShortageReport>('/livestock/feed-shortages/', data);
  }

  async updateFeedShortageReport(id: string, updates: Partial<FeedShortageReport>): Promise<FeedShortageReport> {
    if (this.useMock) {
      const reports = getStoredFeedShortages();
      const index = reports.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Feed shortage report not found');
      reports[index] = { ...reports[index], ...updates, updatedAt: new Date().toISOString() };
      saveStoredFeedShortages(reports);
      return reports[index];
    }
    return this.patch<FeedShortageReport>(`/livestock/feed-shortages/${id}/`, updates);
  }

  async getLivestockHealthRecords(): Promise<LivestockHealthRecord[]> {
    if (this.useMock) {
      return getStoredHealthRecords();
    }
    return this.get<LivestockHealthRecord[]>('/livestock/health-records/');
  }

  async createLivestockHealthRecord(data: Omit<LivestockHealthRecord, 'id' | 'createdAt'>): Promise<LivestockHealthRecord> {
    if (this.useMock) {
      const records = getStoredHealthRecords();
      const newRecord: LivestockHealthRecord = {
        ...data,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
      };
      records.unshift(newRecord);
      saveStoredHealthRecords(records);
      return newRecord;
    }
    return this.post<LivestockHealthRecord>('/livestock/health-records/', data);
  }

  async getLivestockStats(): Promise<LivestockSummaryStats> {
    if (this.useMock) {
      const animals = getStoredAnimals();
      const diseaseReports = getStoredDiseaseReports();
      const feedShortages = getStoredFeedShortages();
      const healthRecords = getStoredHealthRecords();
      return computeLivestockStats(animals, diseaseReports, feedShortages, healthRecords);
    }
    return this.get<LivestockSummaryStats>('/livestock/stats/');
  }
}

export const api = new ApiService();
export default api;
