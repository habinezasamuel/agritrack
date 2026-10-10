export type UserRole = 'ADMIN' | 'FARMER' | 'OFFICER' | 'VETERINARY_OFFICER';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  totalAreaHectares: number;
  soilType: string;
  irrigationMethod: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  id: string;
  farmId: string;
  farmName?: string;
  name: string;
  code: string;
  areaHectares: number;
  soilType?: string;
  irrigationMethod?: string;
  gpsCoordinates?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropType {
  id: string;
  name: string;
  scientificName?: string;
  description?: string;
  defaultGrowingDurationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CropVariety {
  id: string;
  cropTypeId: string;
  cropTypeName?: string;
  name: string;
  description?: string;
  growingDurationDays: number;
  yieldPotentialTonsPerHectare?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CropSeason {
  id: string;
  fieldId: string;
  fieldName?: string;
  cropTypeId: string;
  cropTypeName?: string;
  cropVarietyId: string;
  cropVarietyName?: string;
  seasonId: string;
  seasonName?: string;
  plantingMethod: 'DIRECT_SEEDING' | 'TRANSPLANTING';
  plantingDate: string;
  plantedAreaHectares: number;
  expectedGrowingDurationDays: number;
  estimatedHarvestDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'HARVESTED' | 'FAILED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GrowthStage = 
  | 'NURSERY'
  | 'TRANSPLANTING'
  | 'TILLERING'
  | 'PANICLE_INITIATION'
  | 'FLOWERING'
  | 'GRAIN_FILLING'
  | 'MATURITY'
  | 'HARVESTING'
  | 'LAND_PREPARATION'
  | 'PLANTING'
  | 'VEGETATIVE'
  | 'REPRODUCTIVE'
  | 'RIPENING';

export interface GrowthObservation {
  id: string;
  cropSeasonId: string;
  stage: GrowthStage;
  observedDate: string;
  notes?: string;
  photos: string[];
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 
  | 'LAND_PREPARATION'
  | 'PLANTING'
  | 'IRRIGATION'
  | 'FERTILIZER_APPLICATION'
  | 'WEEDING'
  | 'PEST_CONTROL'
  | 'DISEASE_CONTROL'
  | 'HARVESTING'
  | 'POST_HARVEST'
  | 'OTHER';

export interface Activity {
  id: string;
  cropSeasonId: string;
  type: ActivityType;
  activityDate: string;
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  performedById: string;
  performedByName?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WaterRecord {
  id: string;
  cropSeasonId: string;
  recordDate: string;
  waterDepthCm: number;
  waterCondition: 'FLOODED' | 'SATURATED' | 'MOIST' | 'DRY' | 'DRAINED';
  notes?: string;
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  cropSeasonId: string;
  title: string;
  description?: string;
  dueDate: string;
  completedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  assignedToName?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropProblem {
  id: string;
  cropSeasonId: string;
  reportedDate: string;
  problemType: 'PEST' | 'DISEASE' | 'WEED' | 'WATER' | 'NUTRIENT' | 'WEATHER' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedAreaHectares?: number;
  photos: string[];
  reportedById: string;
  reportedByName?: string;
  status: 'REPORTED' | 'UNDER_REVIEW' | 'ADVICE_GIVEN' | 'RESOLVED' | 'ESCALATED';
  createdAt: string;
  updatedAt: string;
}

export interface OfficerAdvice {
  id: string;
  cropProblemId: string;
  officerId: string;
  officerName?: string;
  advice: string;
  recommendedActions?: string;
  followUpDate?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestPlot {
  id: string;
  cropSeasonId: string;
  plotName: string;
  areaHectares: number;
  gpsCoordinates?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestEntry {
  id: string;
  cropSeasonId: string;
  harvestPlotId: string;
  harvestPlotName?: string;
  harvestDate: string;
  quantityKg: number;
  moistureContentPercent?: number;
  qualityGrade?: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECTED';
  notes?: string;
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  cropSeasonId?: string;
  category: 'SEEDS' | 'FERTILIZER' | 'PESTICIDE' | 'LABOR' | 'EQUIPMENT' | 'IRRIGATION' | 'TRANSPORT' | 'OTHER';
  description: string;
  amount: number;
  currency: 'RWF';
  expenseDate: string;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  reference?: string;
  receiptPhoto?: string;
  recordedById: string;
  recordedByName?: string;
  linkedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  cropSeasonId?: string;
  buyerName: string;
  quantityKg: number;
  unitPrice: number;
  totalAmount: number;
  currency: 'RWF';
  saleDate: string;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  paymentReference?: string;
  notes?: string;
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InputProduct {
  id: string;
  name: string;
  category: 'SEED' | 'FERTILIZER';
  varietyOrDescription: string;
  packSize: number;
  unit: 'KG' | 'BAG' | 'LITRE' | 'TONNE';
  priceRwf: number;
  stockQuantity: number;
  reservedQuantity: number;
  status: 'ACTIVE' | 'UNAVAILABLE' | 'DISCONTINUED';
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'IN' | 'OUT' | 'RESERVATION' | 'RELEASE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  referenceType: 'ORDER' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'EXPIRY' | 'DAMAGE' | 'MANUAL';
  referenceId?: string;
  notes?: string;
  performedById: string;
  performedByName?: string;
  createdAt: string;
}

export interface InputRequestItem {
  id: string;
  requestId: string;
  productId: string;
  productName?: string;
  productCategory?: string;
  productVariety?: string;
  requestedQuantity: number;
  approvedQuantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export type RequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PENDING_REVIEW'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'READY_FOR_COLLECTION'
  | 'COLLECTED'
  | 'DELIVERED';

export type PaymentStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED';

export interface InputRequest {
  id: string;
  requestNumber: string;
  farmerId: string;
  farmerName?: string;
  fieldId: string;
  fieldName?: string;
  cropSeasonId: string;
  cropSeasonName?: string;
  status: RequestStatus;
  items: InputRequestItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: 'RWF';
  paymentStatus?: PaymentStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  productVariety?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type OrderStatus = 
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_COLLECTION'
  | 'OUT_FOR_DELIVERY'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  requestId: string;
  requestNumber?: string;
  farmerId: string;
  farmerName?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: 'RWF';
  paymentMethod?: 'MOBILE_MONEY' | 'BANK_TRANSFER';
  confirmedAt?: string;
  preparedAt?: string;
  collectedAt?: string;
  deliveredAt?: string;
  collectionMethod: 'COLLECTION' | 'DELIVERY';
  collectionLocation?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'MOBILE_MONEY' | 'BANK_TRANSFER';

export interface PaymentAttempt {
  id: string;
  orderId: string;
  orderNumber?: string;
  farmerId: string;
  farmerName?: string;
  method: PaymentMethod;
  amount: number;
  currency: 'RWF';
  status: PaymentStatus;
  providerTransactionId?: string;
  providerReference?: string;
  farmerReference?: string;
  proofPhoto?: string;
  initiatedAt: string;
  confirmedAt?: string;
  confirmedById?: string;
  confirmedByName?: string;
  verificationNotes?: string;
  failureReason?: string;
  refundAmount?: number;
  refundStatus?: 'NOT_APPLICABLE' | 'PENDING' | 'PROCESSED' | 'FAILED';
  refundReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment extends PaymentAttempt {
  applicationId: string;
  applicationNumber: string;
  inputType: string;
  crop: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  fieldName: string;
  farmName: string;
  farmerPhone: string;
  isSandbox: boolean;
  proofFile?: string;
  verifiedAt?: string;
  verifiedByName?: string;
  receiptNumber?: string;
  receiptIssuedAt?: string;
  auditLogs: PaymentAuditLog[];
}

export interface PaymentAuditLog {
  id: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  notes: string;
  performedByName?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  swiftCode?: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  relatedEntityType?: 'REQUEST' | 'ORDER' | 'PAYMENT' | 'ADVICE' | 'TASK' | 'SYSTEM';
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  userMessage: string;
  assistantResponse: string;
  responseType: 'LIVE_AI' | 'RULE_BASED_FALLBACK';
  contextRecordsUsed?: string[];
  createdAt: string;
}

export interface DashboardStats {
  activeFields: number;
  activeCropSeasons: number;
  upcomingTasks: number;
  overdueTasks: number;
  pendingRequests: number;
  totalHarvestKg: number;
  totalExpenses: number;
  totalSales: number;
  cashBalance: number;
}

export interface ReportFilters {
  farmerId?: string;
  fieldId?: string;
  cropTypeId?: string;
  seasonId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export * from './banana';

// ==========================================
// LIVESTOCK MANAGEMENT TYPES
// ==========================================

export type AnimalType = 'cow' | 'goat' | 'sheep' | 'pig' | 'chicken' | 'rabbit' | 'other';

export type LivestockHealthStatus = 'HEALTHY' | 'SICK' | 'UNDER_TREATMENT' | 'QUARANTINED' | 'DECEASED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type DiseaseReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'ASSISTANCE_PROVIDED' | 'RESOLVED';

export type FeedShortageStatus = 'PENDING' | 'UNDER_REVIEW' | 'ASSISTANCE_COORDINATED' | 'RESOLVED';

export type LivestockRecordType = 
  | 'VACCINATION' 
  | 'VET_VISIT' 
  | 'TREATMENT' 
  | 'FEEDING' 
  | 'BIRTH_DEATH' 
  | 'PURCHASE_SALE' 
  | 'PRODUCTION';

export interface LivestockAnimal {
  id: string;
  farmerId: string;
  farmerName: string;
  farmId?: string;
  farmName?: string;
  location: string;
  animalType: AnimalType;
  tagId: string; // Name or tag ID
  breed: string;
  quantity: number;
  dobOrAge: string;
  gender: 'female' | 'male' | 'group';
  healthStatus: LivestockHealthStatus;
  registrationDate: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnimalDiseaseReport {
  id: string;
  reportNumber: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  animalId?: string;
  animalTagId: string;
  animalType: string;
  farmId?: string;
  farmName: string;
  location: string;
  symptoms: string;
  problemStartDate: string;
  numberAffected: number;
  description: string;
  evidenceUrl?: string;
  urgencyLevel: UrgencyLevel;
  status: DiseaseReportStatus;
  veterinaryRecommendation?: string;
  recommendFarmVisit?: boolean;
  farmVisitDate?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedShortageReport {
  id: string;
  reportNumber: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmId?: string;
  farmName: string;
  location: string;
  animalType: string;
  numberAffected: number;
  feedTypeNeeded: string;
  description: string;
  estimatedQuantityRequired: string;
  shortageStartDate: string;
  evidenceUrl?: string;
  urgencyLevel: UrgencyLevel;
  status: FeedShortageStatus;
  officerNotes?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LivestockHealthRecord {
  id: string;
  animalId: string;
  animalTagId: string;
  farmerId: string;
  recordType: LivestockRecordType;
  date: string;
  title: string;
  details: string;
  veterinarianName?: string;
  prescribedMedicine?: string;
  quantity?: number;
  unit?: string;
  costRwf?: number;
  nextDueDate?: string;
  reminderActive?: boolean;
  createdAt: string;
}

export interface LivestockSummaryStats {
  totalAnimals: number;
  totalHeadCount: number;
  animalsByType: Record<string, number>;
  healthyCount: number;
  sickCount: number;
  underTreatmentCount: number;
  openDiseaseReports: number;
  openFeedShortages: number;
  upcomingVaccinationsCount: number;
  resolvedRequestsCount: number;
}

// ==========================================
// 12. OFFICER-GENERATED ATTENDANCE & ADMIN MODIFICATION
// ==========================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'UNRECORDED';

export type MeetingStatus = 'SCHEDULED' | 'REGISTER_GENERATED' | 'IN_PROGRESS' | 'FINALIZED' | 'CANCELLED';

export type MeetingCategory =
  | 'SEASON_PREPARATION'
  | 'INPUT_DISTRIBUTION'
  | 'PEST_DISEASE_TRAINING'
  | 'IRRIGATION_WATER'
  | 'COOPERATIVE_GENERAL'
  | 'HARVEST_POSTHARVEST'
  | 'OTHER';

export interface FarmerLocationDetails {
  id: number;
  userId?: number;
  name: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  registrationId: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  location?: string;
}

export interface AttendanceRecordItem {
  id: number;
  farmer: FarmerLocationDetails;
  status: AttendanceStatus;
  recordedBy?: string | null;
  recordedAt?: string | null;
  officerRemarks?: string;
  isModifiedByAdmin: boolean;
  lastModifiedBy?: string | null;
  lastModifiedRole?: string;
  adminRemarks?: string;
  updatedAt: string;
}

export interface AttendanceAuditItem {
  id: number;
  attendanceRecordId?: number;
  meetingId: number;
  meetingTitle: string;
  farmerId: number;
  farmerName: string;
  farmerRegistrationId?: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  modifierName: string;
  modifierRole: string;
  reason: string;
  timestamp: string;
}

export interface AttendanceStats {
  totalInvited: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  unrecordedCount: number;
  attendedCount: number;
  attendanceRate: number;
  modificationsCount: number;
}

export interface MeetingAttendanceRegisterDetails {
  id: number;
  generatedAt: string;
  generatedByOfficer: {
    id: number;
    name: string;
    username: string;
    email?: string;
    phone?: string;
  };
  isFinalized: boolean;
  finalizedAt?: string | null;
  finalizedBy?: string | null;
  notes?: string;
}

export interface MeetingItem {
  id: number;
  title: string;
  description: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  district: string;
  sector: string;
  agenda: string;
  category: MeetingCategory;
  status: MeetingStatus;
  createdBy: {
    id: number;
    name: string;
    username: string;
    email?: string;
    phone?: string;
    role: string;
  };
  createdAt: string;
  hasRegister: boolean;
  register?: MeetingAttendanceRegisterDetails | null;
  statistics: AttendanceStats;
  invitedFarmers?: {
    invitationId: number;
    invitedAt: string;
    invitationStatus: string;
    farmer: FarmerLocationDetails;
  }[];
  records?: AttendanceRecordItem[];
  auditHistory?: AttendanceAuditItem[];
}

export interface AdminRegisterReviewSummary {
  meetingId: number;
  meetingTitle: string;
  meetingDate: string;
  startTime: string;
  venue: string;
  district: string;
  sector: string;
  category: MeetingCategory;
  status: MeetingStatus;
  registerId: number;
  registerGeneratedAt: string;
  generatedByOfficer: {
    id: number;
    name: string;
    username: string;
    email?: string;
    phone?: string;
  };
  isFinalized: boolean;
  finalizedAt?: string | null;
  statistics: AttendanceStats;
  correctionsCount: number;
}