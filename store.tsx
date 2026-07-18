import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Store, VisitSession, Order, UserRole, Task, SyncStatus, SystemHealth, AssignmentStatus, GeneratedReport } from './types';
import { api, DEV_MODE } from './api';

interface AppState {
  user: User | null;
  activeSession: VisitSession | null;
  viewingStoreId: string | null;
  pendingOrders: Order[];
  offlineMode: boolean;
  stores: Store[];
  assignments: any[];
  pendingReviewAssignments: any[];
  generatedReports: GeneratedReport[];
  analyticsRevision: number; 
  systemHealth: SystemHealth | null;
  isSyncInProgress: boolean;
  roleOverride: UserRole | null;
  impersonatedUser: User | null;
}

interface AppContextType extends AppState {
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  clockIn: (store: Store) => Promise<void>;
  clockOut: (status?: 'completed' | 'incomplete' | 'abandoned') => Promise<void>;
  startViewingVisit: (storeId: string) => void;
  stopViewingVisit: () => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  placeOrder: (orderItems: {productId: string, quantity: number, price: number}[], storeId: string) => Promise<void>;
  submitSurvey: (survey: any) => Promise<void>;
  syncData: () => Promise<void>;
  refreshStores: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
  refreshPendingReviews: () => Promise<void>;
  refreshGeneratedReports: () => Promise<void>;
  createAssignment: (assignment: any) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  saveAssignmentExecution: (id: string, updates: any) => Promise<void>;
  reviewAssignment: (id: string, status: AssignmentStatus, rejectionReason?: string) => Promise<void>;
  addGeneratedReport: (report: GeneratedReport) => Promise<void>;
  setImpersonatedUser: (user: User | null) => void;
  setRoleOverride: (role: UserRole | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseUser, setBaseUser] = useState<User | null>(() => {
    const authed = api.getAuthUser();
    if (!authed && DEV_MODE) {
      return { id: 'dev-user', name: 'Dev User (Mock)', role: UserRole.FIELD_REP };
    }
    return authed;
  });

  const [impersonatedUser, setImpersonatedUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem('ff_dev_impersonation');
    return saved ? JSON.parse(saved) : null;
  });

  const setImpersonatedUser = (u: User | null) => {
    setImpersonatedUserState(u);
    if (u) localStorage.setItem('ff_dev_impersonation', JSON.stringify(u));
    else localStorage.removeItem('ff_dev_impersonation');
  };

  const setRoleOverride = (role: UserRole | null) => {
    if (!role) setImpersonatedUser(null);
    else setImpersonatedUser({ id: `dev-${role.toLowerCase()}`, name: `Dev ${role}`, role });
  };

  const roleOverride = impersonatedUser?.role || null;
  const user = useMemo(() => {
    if (DEV_MODE && impersonatedUser) return impersonatedUser;
    return baseUser;
  }, [baseUser, impersonatedUser]);

  const [activeSession, setActiveSession] = useState<VisitSession | null>(() => api.getAuthSession());
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [analyticsRevision, setAnalyticsRevision] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pendingReviewAssignments, setPendingReviewAssignments] = useState<any[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isSyncInProgress, setIsSyncInProgress] = useState(false);

  const offlineModeRef = useRef(offlineMode);
  useEffect(() => { offlineModeRef.current = offlineMode; }, [offlineMode]);

  const refreshHealth = useCallback(async () => {
    try {
      const health = await api.getSystemHealth();
      setSystemHealth(health);
    } catch (e) {
      console.warn("Health check failed");
    }
  }, []);

  const refreshStores = useCallback(async () => {
    try {
      const data = await api.getStoresByRegion('all');
      setStores(data);
    } catch (e) {
      console.error("Failed to load stores");
    }
  }, []);

  const refreshAssignments = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getAssignments(user.id);
      setAssignments(data);
    } catch (e) {
      console.error("Failed to load assignments");
    }
  }, [user]);

  const refreshPendingReviews = useCallback(async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    try {
      const data = await api.getAssignmentsForReview(user);
      setPendingReviewAssignments(data);
    } catch (e) {
      console.error("Failed to load pending reviews");
    }
  }, [user]);

  const refreshGeneratedReports = useCallback(async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    try {
      const data = await api.getGeneratedReports();
      setGeneratedReports(data);
    } catch (e) {
      console.error("Failed to load generated reports");
    }
  }, [user]);

  const syncData = useCallback(async () => {
    if (offlineModeRef.current) return;
    setIsSyncInProgress(true);
    try {
      await api.reconcileOfflineData();
      setAnalyticsRevision(r => r + 1);
      await Promise.all([refreshHealth(), refreshAssignments(), refreshPendingReviews(), refreshGeneratedReports()]);
    } finally {
      setIsSyncInProgress(false);
    }
  }, [refreshHealth, refreshAssignments, refreshPendingReviews, refreshGeneratedReports]);

  useEffect(() => {
    const handleOnline = () => { setOfflineMode(false); syncData(); };
    const handleOffline = () => setOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const syncInterval = setInterval(() => syncData(), 30000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [syncData]);

  useEffect(() => {
    if (user) {
      refreshStores();
      refreshAssignments();
      refreshPendingReviews();
      refreshGeneratedReports();
      refreshHealth();
    }
  }, [user, refreshStores, refreshAssignments, refreshPendingReviews, refreshGeneratedReports, refreshHealth]);

  const login = async (u: string, p?: string) => {
    const { user: authedUser } = await api.authenticate(u);
    setBaseUser(authedUser);
    api.setAuthUser(authedUser);
  };

  const logout = () => {
    setBaseUser(null);
    api.setAuthUser(null);
    setActiveSession(null);
    api.setAuthSession(null);
    setImpersonatedUser(null);
  };

  const clockIn = async (store: Store) => {
    if (!user) return;
    const session = await api.startVisit(store.id, user.id, { lat: 0, lng: 0 });
    setActiveSession(session);
    api.setAuthSession(session);
  };

  const clockOut = async (status: 'completed' | 'incomplete' | 'abandoned' = 'completed') => {
    if (activeSession) {
      await api.endVisit(activeSession.id, activeSession.storeId);
      setActiveSession(null);
      api.setAuthSession(null);
      setAnalyticsRevision(prev => prev + 1);
      syncData();
    }
  };

  const startViewingVisit = (id: string) => setViewingStoreId(id);
  const stopViewingVisit = () => setViewingStoreId(null);
  const updateTask = (id: string, up: any) => {};
  
  const createAssignment = async (data: any) => {
    if (!user) return;
    await api.createAssignment(user, data);
    await refreshAssignments();
    setAnalyticsRevision(prev => prev + 1);
  };

  const removeAssignment = async (id: string) => {
    if (!user) return;
    await api.deleteAssignment(user, id);
    await refreshAssignments();
    setAnalyticsRevision(prev => prev + 1);
  };

  const saveAssignmentExecution = async (id: string, updates: any) => {
    if (!user) return;
    await api.updateAssignment(user, id, updates);
    await refreshAssignments();
    setAnalyticsRevision(prev => prev + 1);
  };

  const reviewAssignment = async (id: string, status: AssignmentStatus, reason?: string) => {
    if (!user || user.role !== UserRole.ADMIN) return;
    await api.updateAssignment(user, id, { status, rejectionReason: reason });
    await refreshPendingReviews();
    setAnalyticsRevision(prev => prev + 1);
  };

  const addGeneratedReport = async (report: GeneratedReport) => {
    await api.saveGeneratedReport(report);
    await refreshGeneratedReports();
  };

  const placeOrder = async (items: any[], sId: string) => {};
  const submitSurvey = async (survey: any) => {
    if (!user) return;
    await api.submitProductSurvey(survey);
    setAnalyticsRevision(prev => prev + 1);
  };

  return (
    <AppContext.Provider value={{
      user, activeSession, viewingStoreId, pendingOrders, offlineMode, stores, assignments, pendingReviewAssignments, generatedReports, analyticsRevision, systemHealth, isSyncInProgress, roleOverride, impersonatedUser,
      login, logout, clockIn, clockOut, startViewingVisit, stopViewingVisit, updateTask, placeOrder, submitSurvey, syncData, refreshStores, refreshAssignments, refreshPendingReviews, refreshGeneratedReports, createAssignment, removeAssignment, saveAssignmentExecution, reviewAssignment, addGeneratedReport, setRoleOverride, setImpersonatedUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};