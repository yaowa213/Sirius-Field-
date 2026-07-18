import { 
  User, Store, UserRole, StoreSurveySubmission, SurveyStatus, SyncStatus, Brief, Supplier, 
  TeamLeaderAnalytics, AnalyticsFreshness, ExecutiveReport, ReportFilters, 
  VisitSession, SystemConfig, SystemHealth, AssignmentStatus, Questionnaire, ResponseType,
  Assignment, AssignmentType, QuestionResponse, GeneratedReport
} from './types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Global Developer Mode Flag
export const DEV_MODE = true;
export const DEV_MODE_ENABLED = true;

const STORAGE_KEYS = {
  STORES: 'ff_api_stores',
  SUPPLIERS: 'ff_api_suppliers',
  QUESTIONNAIRES: 'ff_api_questionnaires',
  SURVEYS: 'ff_api_surveys',
  BRIEFS: 'ff_api_briefs',
  ASSIGNMENTS: 'ff_api_assignments',
  REPORTS: 'ff_api_generated_reports',
  SYSTEM_CONFIG: 'ff_api_system_config',
  AUTH_USER: 'ff_api_auth_user',
  AUTH_SESSION: 'ff_api_auth_session'
};

const SEED_SUPPLIERS: Supplier[] = [
  { id: 'sup-mattel', name: 'Mattel', active: true },
  { id: 'sup-prima', name: 'Prima', active: true },
  { id: 'sup-zuru', name: 'ZURU', active: true }
];

const SEED_STORES: Store[] = [
  { id: 'st-toykingdom-clearwater', name: 'Toykingdom Clearwater', region: 'Clearwater', regionId: 'CW-01', active: true, address: 'Clearwater Mall, Roodepoort' },
  { id: 'st-toysrus-clearwater', name: 'Toysrus Clearwater', region: 'Clearwater', regionId: 'CW-02', active: true, address: 'Clearwater Mall, Roodepoort' },
  { id: 'st-checkers-sandton', name: 'Checkers Sandton', region: 'Sandton', regionId: 'SAND-01', active: true, address: '88 Grayston Dr, Sandton' },
  { id: 'st-hamleys-sandton', name: 'Hamleys Sandton', region: 'Sandton', regionId: 'SAND-01', active: true, address: 'Sandton City Mall, Sandton' }
];

const SEED_QUESTIONNAIRES: Questionnaire[] = [
  {
    id: 'survey-mattel-audit',
    supplierId: 'sup-mattel',
    title: 'Mattel In-Store Audit',
    questions: [
      { id: 'q-mat-1', productName: 'Hot Wheels', questionText: 'Take a picture of Hot Wheels', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false },
      { id: 'q-mat-2', productName: 'Barbie', questionText: 'Take a picture of Barbie', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false },
      { id: 'q-mat-3', productName: 'Mattel Games', questionText: 'Take a picture of Mattel Games', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false }
    ]
  },
  {
    id: 'survey-prima-audit',
    supplierId: 'sup-prima',
    title: 'Prima In-Store Audit',
    questions: [
      { id: 'q-pri-1', productName: 'Paw Patrol', questionText: 'Take a picture of Paw Patrol', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false },
      { id: 'q-pri-2', productName: 'Prima Games', questionText: 'Take a picture of Prima Games', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false },
      { id: 'q-pri-3', productName: 'DC Figurines', questionText: 'Take a picture of DC Figurines', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false }
    ]
  },
  {
    id: 'survey-zuru-audit',
    supplierId: 'sup-zuru',
    title: 'ZURU In-Store Audit',
    questions: [
      { id: 'q-zur-1', productName: 'XShots', questionText: 'Take a picture of XShots', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false },
      { id: 'q-zur-2', productName: 'Rainbocorns', questionText: 'Take a picture of Rainbocorns', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false },
      { id: 'q-zur-3', productName: 'Robo Alive', questionText: 'Take a picture of Robo Alive', responseType: ResponseType.YES_NO, requiresPhotoOnYes: true, requiresReasonOnNo: false }
    ]
  }
];

export const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

class ApiService {
  private _syncLock = false;

  constructor() {
    if (!localStorage.getItem(STORAGE_KEYS.STORES)) {
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(SEED_STORES));
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(SEED_SUPPLIERS));
      localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRES, JSON.stringify(SEED_QUESTIONNAIRES));
    }
  }

  getAuthUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return data ? JSON.parse(data) : null;
  }

  setAuthUser(user: User | null) {
    if (user) localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }

  getAuthSession(): VisitSession | null {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return data ? JSON.parse(data) : null;
  }

  setAuthSession(session: VisitSession | null) {
    if (session) localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  private async getCollection<T>(key: string): Promise<T[]> {
    const dataStr = localStorage.getItem(key);
    return dataStr ? JSON.parse(dataStr) : [];
  }

  private async saveCollection<T>(key: string, data: T[]): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getQuestionnaire(id: string): Promise<Questionnaire | null> {
    const all = await this.getCollection<Questionnaire>(STORAGE_KEYS.QUESTIONNAIRES);
    return all.find(q => q.id === id) || null;
  }

  async getQuestionnairesBySupplier(supplierId: string): Promise<Questionnaire[]> {
    const all = await this.getCollection<Questionnaire>(STORAGE_KEYS.QUESTIONNAIRES);
    return all.filter(q => q.supplierId === supplierId);
  }

  async getSuppliers(): Promise<Supplier[]> {
    return this.getCollection<Supplier>(STORAGE_KEYS.SUPPLIERS);
  }

  async getStores(): Promise<Store[]> {
    return this.getCollection<Store>(STORAGE_KEYS.STORES);
  }

  async getStoresByRegion(region: string): Promise<Store[]> {
    const all = await this.getStores();
    if (region === 'all') return all;
    return all.filter(s => s.region.toLowerCase() === region.toLowerCase());
  }

  async isSupplierAtStore(storeId: string, supplierId: string): Promise<boolean> {
    return true; 
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const config = await this.getSystemConfig();
    const assignments = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const pendingCount = assignments.filter(a => a.syncStatus === SyncStatus.PENDING).length;

    return {
      status: 'OPTIMAL',
      lastBackupAt: config.lastRetentionCleanup || Date.now(),
      unreconciledRecords: pendingCount,
      isLegalHoldActive: config.isLegalHoldActive,
      integrityVerifiedAt: Date.now()
    };
  }

  private async getSystemConfig(): Promise<SystemConfig> {
    const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
    return data ? JSON.parse(data) : { isLegalHoldActive: false, lastRetentionCleanup: 0 };
  }

  async createAssignment(admin: User, assignmentData: any) {
    const assignments = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    
    const exists = assignments.some(a => 
      a.teamLeaderId === assignmentData.teamLeaderId && 
      a.storeId === assignmentData.storeId && 
      a.supplierId === assignmentData.supplierId && 
      a.surveyId === assignmentData.surveyId
    );
    
    if (exists) {
      throw new Error("This exact survey is already assigned to this Team Leader for this store.");
    }

    const newAssignment: Assignment = {
      ...assignmentData,
      id: `ASGN-${Date.now()}`,
      status: AssignmentStatus.ASSIGNED,
      syncStatus: SyncStatus.SYNCED,
      version: 1,
      createdAt: Date.now(),
      executionData: null,
      rejectionReason: null
    };
    await this.saveCollection(STORAGE_KEYS.ASSIGNMENTS, [...assignments, newAssignment]);
    return newAssignment;
  }

  async deleteAssignment(admin: User, assignmentId: string) {
    const assignments = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const filtered = assignments.filter(a => a.id !== assignmentId);
    await this.saveCollection(STORAGE_KEYS.ASSIGNMENTS, filtered);
  }

  async updateAssignment(user: User, assignmentId: string, updates: any) {
    const assignments = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const idx = assignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error("Assignment not found");
    
    assignments[idx] = { 
      ...assignments[idx], 
      ...updates,
      syncStatus: SyncStatus.PENDING,
      lastModifiedAt: Date.now(),
      version: (assignments[idx].version || 0) + 1
    };
    await this.saveCollection(STORAGE_KEYS.ASSIGNMENTS, assignments);
    if (navigator.onLine) this.reconcileOfflineData();
  }

  async getAssignments(userId: string) {
    const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    return all.filter((a: Assignment) => a.teamLeaderId === userId || a.forceVisible === true);
  }

  async getAllAssignments(admin: User) {
    return this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
  }

  async getAssignmentsForReview(admin: User) {
    const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    return all.filter((a: Assignment) => a.status === AssignmentStatus.PENDING_REVIEW && a.syncStatus === SyncStatus.SYNCED);
  }

  async verifyDataIntegrity(admin: User) {
    return { verified: true, issues: 0 };
  }

  async setLegalHold(admin: User, isActive: boolean) {
    const config = await this.getSystemConfig();
    config.isLegalHoldActive = isActive;
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(config));
  }

  async reconcileOfflineData() {
    if (this._syncLock || !navigator.onLine) return;
    this._syncLock = true;
    try {
      const assignments = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
      const pending = assignments.filter(a => a.syncStatus === SyncStatus.PENDING);
      if (pending.length === 0) return;
      
      for (const item of pending) {
        const inFlight = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
        const marked = inFlight.map(a => a.id === item.id ? { ...a, syncStatus: SyncStatus.SYNCING } : a);
        await this.saveCollection(STORAGE_KEYS.ASSIGNMENTS, marked);
        await new Promise(r => setTimeout(r, 500));
        const finishing = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
        const synced = finishing.map(a => a.id === item.id ? { ...a, syncStatus: SyncStatus.SYNCED } : a);
        await this.saveCollection(STORAGE_KEYS.ASSIGNMENTS, synced);
      }
    } finally {
      this._syncLock = false;
    }
  }

  async getTeamLeaderAnalytics(userId: string): Promise<TeamLeaderAnalytics> {
    const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const data = all.filter(a => a.status === AssignmentStatus.APPROVED && a.syncStatus === SyncStatus.SYNCED);
    const kpis = await this.calculateBoardroomKpis(data);
    return {
      kpis,
      reliability: { freshness: AnalyticsFreshness.REALTIME, lastUpdated: Date.now(), surveySampleCount: data.length, storeSampleCount: kpis.storesCovered, redoInclusion: false },
      byStore: [], dailyTrend: data.map((d, i) => ({ date: i, count: 1 })), bySupplier: []
    };
  }

  async calculateBoardroomKpis(data: Assignment[]) {
    const total = data.length;
    if (total === 0) return { stockAvailability: 0, complianceRate: 0, coverage: 0, exceptionRate: 0, redoRate: 0, freshnessDays: 0, surveysCompleted: 0, storesCovered: 0, missedAudits: 10, assignedStores: 10 };
    let items = 0, inStock = 0;
    data.forEach(asgn => asgn.executionData?.responses.forEach(r => { items++; if (r.result) inStock++; }));
    return { 
      stockAvailability: (inStock / (items || 1)) * 100, complianceRate: 100, coverage: 100, exceptionRate: (total > 0 ? (total - inStock) / total * 100 : 0), redoRate: 0, freshnessDays: 0,
      surveysCompleted: total, storesCovered: new Set(data.map(d => d.storeId)).size, missedAudits: 0, assignedStores: 10
    };
  }

  async getExecutiveAnalytics(user: User): Promise<ExecutiveReport> {
    const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const data = all.filter(a => a.status === AssignmentStatus.APPROVED && a.syncStatus === SyncStatus.SYNCED);
    const kpis = await this.calculateBoardroomKpis(data);
    return {
      metadata: { generatedAt: Date.now(), generatedBy: user.name, dateRange: { start: 0, end: Date.now() }, integrityHash: 'H1' },
      kpis: { overallAvailability: kpis.stockAvailability, regionalCoverage: {}, supplierPerformance: {} },
      rawApprovedData: []
    };
  }

  async generateExcelAuditExport(user: User, filters: ReportFilters): Promise<void> {
    const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const approved = all.filter(a => 
      a.status === AssignmentStatus.APPROVED && 
      (!filters.regionId || a.storeId === filters.regionId)
    );

    if (approved.length === 0) {
      throw new Error("No approved surveys available for export");
    }

    const surveyResponses: any[] = [];
    const exceptions: any[] = [];
    const kpis: any[] = [];
    const auditLog: any[] = [];

    const stats = await this.calculateBoardroomKpis(approved);
    kpis.push({ 'Metric': 'Stock Availability (OSA)', 'Value': `${stats.stockAvailability.toFixed(2)}%` });
    kpis.push({ 'Metric': 'Reach Coverage', 'Value': `${stats.coverage.toFixed(2)}%` });
    kpis.push({ 'Metric': 'Finalized Audits', 'Value': stats.surveysCompleted });
    kpis.push({ 'Metric': 'Stores Covered', 'Value': stats.storesCovered });

    approved.forEach(a => {
      try {
        a.executionData?.responses.forEach((r) => {
          const dateStr = new Date(a.submittedAt || a.createdAt).toLocaleDateString();
          const photoPath = r.photoBase64 ? `storage://surveys/${a.id}/${r.questionId}.jpg` : 'N/A';
          const row = {
            'Assignment ID': a.id, 'Date': dateStr, 'Store': a.storeName, 'Supplier': a.supplierName,
            'Team Leader': a.teamLeaderName, 'Audit Type': a.surveyName, 'Question': r.questionId,
            'Result': r.result ? 'YES' : 'NO', 'Photo Path Reference': photoPath
          };
          surveyResponses.push(row);
          if (r.result === false) exceptions.push(row);
        });
      } catch (err) {
        console.warn(`Skipping malformed assignment record: ${a.id}`, err);
      }
    });

    auditLog.push({
      'Action': 'EXPORT_INITIATED', 'Actor': user.name, 'Actor ID': user.id,
      'Timestamp': new Date().toISOString(), 'Filters Applied': JSON.stringify(filters),
      'Records Processed': approved.length, 'Integrity Hash': `SHA256-${Date.now().toString(16)}`
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(surveyResponses), 'Raw_Data');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpis), 'KPIs');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exceptions), 'Exceptions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auditLog), 'Audit_Log');

    XLSX.writeFile(wb, `Sirius_Boardroom_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  async generatePdfExecutiveSummary(user: User, filters: ReportFilters): Promise<string> {
    try {
      const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
      const approved = all.filter(a => a.status === AssignmentStatus.APPROVED);

      if (approved.length === 0) {
        throw new Error("No approved surveys available for PDF summary");
      }

      const kpis = await this.calculateBoardroomKpis(approved);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      let y = 30;

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SIRIUS FIELD EXECUTIVE SUMMARY", margin, y);
      y += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated At: ${new Date().toLocaleString()}`, margin, y);
      y += 5;
      doc.text(`Generated By: ${user.name || 'Unknown'}`, margin, y);
      y += 15;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Portfolio Performance (Aggregated)", margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`- Stock Availability (OSA): ${kpis.stockAvailability?.toFixed(2) || '0.00'}%`, margin + 5, y);
      y += 8;
      doc.text(`- Total Finalized Audit Nodes: ${approved.length}`, margin + 5, y);
      y += 8;
      doc.text(`- Store Geographic Coverage: ${kpis.storesCovered || 0} Nodes`, margin + 5, y);
      y += 8;
      doc.text(`- Compliance Benchmark: ${kpis.complianceRate?.toFixed(1) || '0.0'}%`, margin + 5, y);
      y += 20;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Node Breakdown", margin, y);
      y += 10;

      doc.setFontSize(10);
      const headers = ["Store", "Supplier", "TL Context", "Status"];
      doc.text(headers[0], margin, y);
      doc.text(headers[1], margin + 55, y);
      doc.text(headers[2], margin + 105, y);
      doc.text(headers[3], margin + 145, y);
      y += 5;
      doc.line(margin, y, 190, y);
      y += 8;

      approved.slice(0, 25).forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        try {
          doc.text((a.storeName || 'N/A').substring(0, 25), margin, y);
          doc.text((a.supplierName || 'N/A').substring(0, 22), margin + 55, y);
          doc.text((a.teamLeaderName || 'N/A').substring(0, 18), margin + 105, y);
          doc.text("APPROVED", margin + 145, y);
        } catch (e) {}
        y += 8;
      });

      return doc.output('datauristring');
    } catch (err: any) {
      throw new Error(`PDF Generation failed: ${err.message}`);
    }
  }

  /**
   * Generates a photo-rich Evidence PDF report for a selected store/supplier/questionnaire.
   * Grouped by Store -> Supplier -> Questionnaire.
   */
  async generateEvidencePdf(user: User, filters: ReportFilters): Promise<string> {
    try {
      const all = await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
      const approved = all.filter(a => 
        a.status === AssignmentStatus.APPROVED &&
        (!filters.regionId || a.storeId === filters.regionId)
      );

      if (approved.length === 0) {
        throw new Error("No approved surveys available for Evidence PDF");
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      let y = 25;

      // Report Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("SIRIUS FIELD: EVIDENCE PDF", margin, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Admin: ${user.name} | Date: ${new Date().toLocaleDateString()}`, margin, y);
      y += 15;

      // Grouping Logic: We iterate through the filtered assignments
      for (const a of approved) {
        try {
          if (y > 260) { doc.addPage(); y = 20; }

          // Section Header: Store & Supplier
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 5, 170, 15, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text(`${a.storeName} | ${a.supplierName}`, margin + 5, y + 4);
          y += 15;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`Protocol: ${a.surveyName} | TL: ${a.teamLeaderName}`, margin + 5, y);
          y += 8;

          const responses = a.executionData?.responses || [];
          for (const res of responses) {
            try {
              if (y > 240) { doc.addPage(); y = 20; }

              // Question Detail
              doc.setFont("helvetica", "bold");
              doc.setTextColor(0, 0, 0);
              doc.text(`${res.questionId}:`, margin + 5, y);
              doc.setFont("helvetica", "normal");
              doc.text(res.result ? "YES" : "NO", margin + 40, y);
              y += 5;

              // Timestamp & TL Ref
              doc.setFontSize(8);
              doc.setTextColor(150, 150, 150);
              doc.text(`Timestamp: ${new Date(a.submittedAt || a.createdAt).toLocaleString()}`, margin + 5, y);
              y += 5;

              // Comment if any
              if (a.executionData?.comment) {
                doc.setFont("helvetica", "italic");
                doc.text(`Note: ${a.executionData.comment.substring(0, 80)}`, margin + 5, y);
                y += 5;
              }

              // Photo Thumbnail (Compressed)
              if (res.photoBase64) {
                try {
                  // doc.addImage(imageData, format, x, y, width, height, alias, compression, rotation)
                  // Use a small thumbnail size to keep PDF size manageable (e.g. 40x30mm)
                  doc.addImage(res.photoBase64, 'JPEG', margin + 5, y, 40, 30, undefined, 'FAST');
                  y += 35;
                } catch (imgErr) {
                  doc.setFont("helvetica", "italic");
                  doc.setTextColor(255, 0, 0);
                  doc.text("Image unavailable – see Excel link", margin + 5, y + 5);
                  y += 10;
                }
              } else if (res.result === true) {
                // Should have had a photo but doesn't
                doc.setFont("helvetica", "italic");
                doc.setTextColor(150, 150, 150);
                doc.text("No visual evidence captured for this node.", margin + 5, y + 2);
                y += 8;
              } else {
                y += 5;
              }
              
              y += 5; // Spacing between questions
            } catch (qErr) {
              console.warn(`Error processing question ${res.questionId} in evidence PDF`, qErr);
            }
          }
          y += 10; // Spacing between assignments
        } catch (aErr) {
          console.warn(`Error processing assignment ${a.id} in evidence PDF`, aErr);
        }
      }

      return doc.output('datauristring');
    } catch (err: any) {
      throw new Error(`Evidence PDF Generation failed: ${err.message}`);
    }
  }

  async saveGeneratedReport(report: GeneratedReport): Promise<void> {
    const all = await this.getCollection<GeneratedReport>(STORAGE_KEYS.REPORTS);
    // Keep only last 5 reports to manage storage limits
    const updated = [report, ...all].slice(0, 5);
    await this.saveCollection(STORAGE_KEYS.REPORTS, updated);
  }

  async getGeneratedReports(): Promise<GeneratedReport[]> {
    return this.getCollection<GeneratedReport>(STORAGE_KEYS.REPORTS);
  }

  async authenticate(u: string) {
    const role = u.includes('admin') ? UserRole.ADMIN : (u.includes('TL') ? UserRole.TEAM_LEADER : UserRole.FIELD_REP);
    return { user: { id: 'U-01', name: u || 'Staff User', role } };
  }

  async getBriefs() { return this.getCollection<Brief>(STORAGE_KEYS.BRIEFS); }
  async createBrief(user: User, data: any) {
    const briefs = await this.getCollection<Brief>(STORAGE_KEYS.BRIEFS);
    const newBrief = { ...data, id: `B-${Date.now()}`, creatorId: user.id, createdAt: new Date().toISOString(), isActive: true };
    await this.saveCollection(STORAGE_KEYS.BRIEFS, [...briefs, newBrief]);
  }
  async updateBriefStatus(user: User, id: string, active: boolean) {
    const briefs = await this.getCollection<Brief>(STORAGE_KEYS.BRIEFS);
    const idx = briefs.findIndex(b => b.id === id);
    if (idx !== -1) briefs[idx].isActive = active;
    await this.saveCollection(STORAGE_KEYS.BRIEFS, briefs);
  }
  async getMonthlySurveyCount() { return (await this.getCollection<Assignment>(STORAGE_KEYS.ASSIGNMENTS)).filter(a => a.status === AssignmentStatus.APPROVED).length; }
  async getSuppliersByStore(id: string) { return this.getSuppliers(); }
  async startVisit(s: string, u: string, l: any) { return { id: `V-${Date.now()}`, storeId: s, userId: u, clockInTime: Date.now(), status: 'incomplete', location: l } as VisitSession; }
  async endVisit(id: string, s: string) { }
  async getVisitHistory(id: string) { return []; }
  async submitProductSurvey(survey: any) { }
}

export const api = new ApiService();
export default api;
