export enum UserRole {
  FIELD_REP = 'FIELD_REP',
  TEAM_LEADER = 'TEAM_LEADER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  token?: string;
}

export enum SurveyStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REQUIRES_REDO = 'REQUIRES_REDO'
}

export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum AssignmentType {
  ROUTE = 'ROUTE',
  PROJECT = 'PROJECT',
  URGENT = 'URGENT'
}

export enum ResponseType {
  YES_NO = 'YES_NO'
}

export interface Supplier {
  id: string;
  name: string;
  active: boolean;
}

export interface Store {
  id: string;
  name: string;
  region: string;
  regionId?: string;
  active: boolean;
  address: string;
  status?: 'incomplete' | 'pending' | 'visited' | 'active';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stockLevel: number;
  price: number;
  category: string;
  supplierId: string;
}

export interface StoreSupplier {
  storeId: string;
  supplierId: string;
  active: boolean;
}

export interface Question {
  id: string;
  productName: string;
  questionText: string;
  responseType: ResponseType;
  requiresPhotoOnYes: boolean;
  requiresReasonOnNo: boolean;
}

export interface Questionnaire {
  id: string;
  supplierId: string;
  title: string;
  questions: Question[];
}

export interface QuestionResponse {
  questionId: string;
  result: boolean | null;
  photoBase64?: string;
  oosReason?: string;
}

export interface AssignmentExecutionData {
  responses: QuestionResponse[];
  comment: string;
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT'
}

export interface Assignment {
  id: string;
  storeId: string;
  storeName: string;
  supplierId: string;
  supplierName: string;
  surveyId: string;
  surveyName: string;
  teamLeaderId: string;
  teamLeaderName: string;
  assignmentType: AssignmentType;
  status: AssignmentStatus;
  syncStatus?: SyncStatus;
  version?: number;
  forceVisible: boolean;
  briefMessage?: string;
  createdAt: number;
  lastModifiedAt?: number;
  submittedAt?: number;
  rejectionReason?: string | null;
  executionData: AssignmentExecutionData | null;
}

export enum AnalyticsFreshness {
  REALTIME = 'REALTIME',
  STALE = 'STALE'
}

export interface ReportFilters {
  startDate?: number;
  endDate?: number;
  regionId?: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'PDF' | 'EXCEL';
  createdAt: number;
  dataUrl: string;
  storeName?: string;
}

export interface ExecutiveReport { 
  metadata: { 
    generatedAt: number; 
    generatedBy: string; 
    dateRange: { start: number; end: number }; 
    integrityHash: string; 
  }; 
  kpis: { 
    overallAvailability: number; 
    regionalCoverage: Record<string, number>; 
    supplierPerformance: Record<string, number>; 
  }; 
  rawApprovedData: StoreSurveySubmission[]; 
}

export interface TeamLeaderAnalytics { 
  kpis: { 
    surveysCompleted: number; 
    storesCovered: number; 
    complianceRate: number; 
    missedAudits: number; 
    assignedStores: number; 
    stockAvailability: number; 
    exceptionRate: number; 
    redoRate: number; 
    freshnessDays: number;
  }; 
  reliability: { 
    freshness: AnalyticsFreshness; 
    lastUpdated: number; 
    surveySampleCount: number; 
    storeSampleCount: number; 
    redoInclusion: boolean; 
  }; 
  byStore: any[]; 
  dailyTrend: any[]; 
  bySupplier: any[]; 
}

export interface StoreSurveySubmission {
  id: string;
  regionId: string;
  storeId: string;
  supplierId: string;
  responses: any[];
  status: SurveyStatus;
  comment: string;
  userId: string;
  timestamp: number;
  syncStatus: SyncStatus;
}

export interface Brief {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'urgent';
  createdAt: string;
  creatorId: string;
  version: number;
  isActive: boolean;
  context?: string;
}

export interface VisitSession { 
  id: string; 
  storeId: string; 
  userId: string; 
  clockInTime: number; 
  clockOutTime?: number; 
  status: 'completed' | 'incomplete' | 'abandoned'; 
  location: { lat: number; lng: number }; 
  surveySubmitted?: boolean; 
}

export interface SystemHealth {
  status: 'OPTIMAL' | 'DEGRADED' | 'OUTAGE';
  lastBackupAt: number;
  unreconciledRecords: number;
  isLegalHoldActive: boolean;
  integrityVerifiedAt: number;
}

export interface SystemConfig {
  isLegalHoldActive: boolean;
  lastRetentionCleanup: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Order { 
  id: string; 
  storeId: string; 
  repId: string; 
  items: { productId: string; quantity: number; price: number }[]; 
  total: number; 
  timestamp: number; 
  idempotencyKey: string; 
}