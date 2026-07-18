import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './store';
import { UserRole, Assignment, User } from './types';
import { DEV_MODE } from './api';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import SupervisorDashboard from './screens/SupervisorDashboard';
import StoreVisitScreen from './screens/StoreVisitScreen';
import BriefsScreen from './screens/BriefsScreen';
import ReportsScreen from './screens/ReportsScreen';
import AssignSurveyScreen from './screens/AssignSurveyScreen';
import TLDashboardScreen from './screens/TLDashboardScreen';
import SurveyExecutionScreen from './screens/SurveyExecutionScreen';
import AdminReviewScreen from './screens/AdminReviewScreen';
import AdminReviewDetailScreen from './screens/AdminReviewDetailScreen';
import SupplierSelectionScreen from './screens/SupplierSelectionScreen';
import QuestionnaireSelectionScreen from './screens/QuestionnaireSelectionScreen';

const MOCK_IDENTITIES: User[] = [
  { id: 'admin-1', name: 'Executive Admin', role: UserRole.ADMIN },
  { id: 'tl1', name: 'Marc TL', role: UserRole.TEAM_LEADER },
  { id: 'tl2', name: 'Sarah TL', role: UserRole.TEAM_LEADER },
  { id: 'tl3', name: 'James TL', role: UserRole.TEAM_LEADER },
  { id: 'rep-1', name: 'Basic Field Rep', role: UserRole.FIELD_REP },
];

const DevFloatingButton: React.FC = () => {
  const { impersonatedUser, setImpersonatedUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!DEV_MODE) return null;

  const handleReset = () => {
    if (confirm("Reset App State? This will clear all local data and reload.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImpersonate = (u: User) => {
    setImpersonatedUser(u);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-900 text-yellow-400 rounded-full shadow-2xl flex items-center justify-center border-2 border-yellow-400 active:scale-90 transition-all"
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bug'} text-xl`}></i>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-yellow-400/30 animate-in slide-in-from-bottom-4">
          <h4 className="text-yellow-400 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
            <i className="fa-solid fa-user-secret"></i> Identity Impersonator
          </h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Identity Node</p>
              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                {MOCK_IDENTITIES.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleImpersonate(u)}
                    className={`w-full py-2.5 px-4 rounded-xl text-left transition-all ${
                      impersonatedUser?.id === u.id 
                        ? 'bg-yellow-400 text-slate-900' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest">{u.name}</span>
                       <span className="text-[8px] opacity-60 font-bold">{u.role} • {u.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              {impersonatedUser && (
                <button
                  onClick={() => handleImpersonate(null as any)}
                  className="w-full py-2 text-red-400 font-black text-[9px] uppercase tracking-[0.2em]"
                >
                  Reset Impersonation
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all"
              >
                Full System Wipe
              </button>
            </div>

            <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest text-center mt-2">
              Identity Logic: Client-Side Only<br/>
              Assignments depend on User ID
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, activeSession, viewingStoreId, offlineMode, syncData, logout, pendingReviewAssignments, assignments } = useApp();
  const [currentTab, setCurrentTab] = useState<'dash' | 'briefs' | 'reports' | 'assign' | 'tl_board' | 'review'>('dash');
  
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(null);
  const [reviewingAssignmentId, setReviewingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!offlineMode) syncData();
  }, [offlineMode, syncData]);

  if (!user) return <LoginScreen />;

  if (reviewingAssignmentId) return <AdminReviewDetailScreen assignmentId={reviewingAssignmentId} onBack={() => setReviewingAssignmentId(null)} />;
  if (viewingAssignmentId) return <SurveyExecutionScreen assignmentId={viewingAssignmentId} onBack={() => setViewingAssignmentId(null)} />;
  if (activeSession || viewingStoreId) return <StoreVisitScreen onSelectAssignment={(id) => setViewingAssignmentId(id)} />;

  const isAdmin = user.role === UserRole.ADMIN;
  const isTeamLeader = user.role === UserRole.TEAM_LEADER;
  const roleLabel = isAdmin ? 'Administrator' : (isTeamLeader ? 'Team Leader' : 'Field Rep');

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedSupplierId(null);
  };

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
  };

  const handleSelectAssignment = (assignmentId: string) => {
    setViewingAssignmentId(assignmentId);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center shrink-0 shadow-sm relative z-50">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter italic">Sirius Field<span className="text-blue-600">.</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">{roleLabel} • {user.name}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => logout()} title="Logout" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-100 transition-colors">
             <i className="fa-solid fa-right-from-bracket text-xs"></i>
           </button>
           <button onClick={() => syncData()} title="Sync Data" className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><i className="fa-solid fa-rotate text-xs"></i></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {currentTab === 'dash' && (isAdmin ? <SupervisorDashboard /> : <DashboardScreen />)}
        {currentTab === 'briefs' && <BriefsScreen />}
        {currentTab === 'reports' && <ReportsScreen />}
        {currentTab === 'assign' && isAdmin && <AssignSurveyScreen />}
        {currentTab === 'review' && isAdmin && <AdminReviewScreen onSelectAssignment={setReviewingAssignmentId} />}
        {currentTab === 'tl_board' && isTeamLeader && (
          !selectedStoreId ? (
            <TLDashboardScreen onSelectStore={handleSelectStore} />
          ) : !selectedSupplierId ? (
            <SupplierSelectionScreen 
              storeId={selectedStoreId} 
              onBack={() => setSelectedStoreId(null)} 
              onSelectSupplier={handleSelectSupplier} 
            />
          ) : (
            <QuestionnaireSelectionScreen 
              storeId={selectedStoreId} 
              supplierId={selectedSupplierId} 
              onBack={() => setSelectedSupplierId(null)} 
              onSelectAssignment={handleSelectAssignment} 
            />
          )
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t flex justify-around items-center safe-bottom h-20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-50 px-6">
        <NavButton active={currentTab === 'dash'} icon="fa-shapes" label="Activity" onClick={() => setCurrentTab('dash')} />
        {isTeamLeader && <NavButton active={currentTab === 'tl_board'} icon="fa-clipboard-check" label="My Tasks" onClick={() => { setCurrentTab('tl_board'); setSelectedStoreId(null); setSelectedSupplierId(null); }} />}
        {isAdmin && <NavButton active={currentTab === 'review'} icon="fa-gavel" label="Review" onClick={() => setCurrentTab('review')} badge={pendingReviewAssignments.length > 0 ? pendingReviewAssignments.length : undefined} />}
        <NavButton active={currentTab === 'briefs'} icon="fa-envelope-open-text" label="Briefs" onClick={() => setCurrentTab('briefs')} />
        <NavButton active={currentTab === 'reports'} icon="fa-chart-simple" label="Analytics" onClick={() => setCurrentTab('reports')} />
        {isAdmin && <NavButton active={currentTab === 'assign'} icon="fa-user-plus" label="Assign" onClick={() => setCurrentTab('assign')} />}
      </nav>
      
      <DevFloatingButton />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void; badge?: number }> = ({ active, icon, label, onClick, badge }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 px-4 h-full transition-all relative ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    {active && <div className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full"></div>}
    <div className="relative">
       <i className={`fa-solid ${icon} text-lg`}></i>
       {badge !== undefined && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">{badge}</div>}
    </div>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const App: React.FC = () => <AppProvider><AppContent /></AppProvider>;
export default App;
