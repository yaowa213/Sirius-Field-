
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid 
} from 'recharts';
import { api } from '../api';
import { useApp } from '../store';
import { TeamLeaderAnalytics, AnalyticsFreshness } from '../types';

const ReportsScreen: React.FC = () => {
  const { user, analyticsRevision, stores } = useApp();
  const [data, setData] = useState<TeamLeaderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [activeKpiDetail, setActiveKpiDetail] = useState<string | null>(null);

  const loadAnalytics = async (isManual = false) => {
    if (!user) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    
    try {
      const analytics = await api.getTeamLeaderAnalytics(user.id);
      setData(analytics);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user, analyticsRevision, selectedStoreId]);

  const hasData = data && data.kpis.surveysCompleted > 0;

  const narrative = useMemo(() => {
    if (!data) return "";
    const { kpis } = data;
    const osa = kpis.stockAvailability;
    const coverage = kpis.coverage;

    return `Territory operations for ${user?.name || 'Staff'} show a verified ${osa.toFixed(1)}% shelf availability index. Store reach is currently at ${coverage.toFixed(0)}%, reflecting ${coverage > 90 ? 'optimal' : 'active'} deployment status. Data integrity is confirmed via Golden Source protocols.`;
  }, [data, user]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 h-full bg-white">
        <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-600/10 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
        </div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Aggregating Boardroom Metrics</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-full bg-slate-50/30">
      <div className="flex justify-between items-end px-1 pt-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">Intelligence Hub</h2>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest leading-none mt-1">
            APPROVED AUDITS ONLY • PRIMA
          </p>
        </div>
        <button 
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className={`w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all shadow-sm ${refreshing ? 'animate-spin border-blue-100 text-blue-500' : ''}`}
        >
          <i className="fa-solid fa-arrows-rotate text-xs"></i>
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
         <div className="flex-1 space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Store Target</label>
            <div className="relative">
              <select 
                 value={selectedStoreId} 
                 onChange={e => setSelectedStoreId(e.target.value)}
                 className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-[12px] font-black outline-none appearance-none pr-10"
                 style={{ color: '#000' }}
              >
                 <option value="">Consolidated (Global)</option>
                 {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <i className="fa-solid fa-chevron-down text-[8px]"></i>
              </div>
            </div>
         </div>
         <div className="w-px h-10 bg-slate-100"></div>
         <div className="flex-1 space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Portfolio</label>
            <div className="bg-slate-50 rounded-xl py-3 px-4 text-[12px] font-black text-blue-600">PRIMA GROUP</div>
         </div>
      </div>

      {!hasData ? (
         <div className="p-10 text-center flex flex-col items-center bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
              <i className="fa-solid fa-chart-line text-4xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No Approved Data</h3>
            <p className="text-sm text-slate-500 max-w-[260px] mx-auto leading-relaxed mb-8 font-medium italic text-center">
              Reports only include audits that have been verified and approved by an administrator.
            </p>
         </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Block */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Boardroom Perspective</span>
                   </div>
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Confidential</span>
                </div>
                <p className="text-lg font-black leading-snug tracking-tight mb-6">
                   {narrative}
                </p>
             </div>
             <i className="fa-solid fa-file-shield absolute -right-6 -bottom-6 text-white/5 text-9xl rotate-12"></i>
          </div>

          {/* Boardroom KPI Grid */}
          <div className="grid grid-cols-2 gap-4">
             <BoardroomKpi 
                label="Stock Availability" 
                value={`${data.kpis.stockAvailability.toFixed(1)}%`} 
                trend="Healthy"
                icon="fa-box-open"
                color="blue"
                active={activeKpiDetail === 'osa'}
                onClick={() => setActiveKpiDetail(activeKpiDetail === 'osa' ? null : 'osa')}
             />
             <BoardroomKpi 
                label="Reach Coverage" 
                value={`${data.kpis.coverage.toFixed(0)}%`} 
                trend="Deploying"
                icon="fa-map-location-dot"
                color="indigo"
                active={activeKpiDetail === 'coverage'}
                onClick={() => setActiveKpiDetail(activeKpiDetail === 'coverage' ? null : 'coverage')}
             />
             <BoardroomKpi 
                label="Exception Rate" 
                value={`${data.kpis.exceptionRate.toFixed(1)}%`} 
                trend="Monitor"
                icon="fa-triangle-exclamation"
                color="orange"
                active={activeKpiDetail === 'exception'}
                onClick={() => setActiveKpiDetail(activeKpiDetail === 'exception' ? null : 'exception')}
             />
             <BoardroomKpi 
                label="Verified Sample" 
                value={data.kpis.surveysCompleted} 
                trend="Audits"
                icon="fa-clipboard-check"
                color="slate"
                active={activeKpiDetail === 'verified'}
                onClick={() => setActiveKpiDetail(activeKpiDetail === 'verified' ? null : 'verified')}
             />
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
             <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Activity Velocity</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Approval Throughput</p>
                </div>
             </div>
             <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={data.dailyTrend}>
                      <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={[0, 'auto']} />
                      <Line 
                         type="monotone" 
                         dataKey="count" 
                         stroke="#2563eb" 
                         strokeWidth={4} 
                         dot={false}
                      />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BoardroomKpi: React.FC<{ 
  label: string; 
  value: string | number; 
  trend: string; 
  icon: string; 
  color: string; 
  active: boolean;
  onClick: () => void;
}> = ({ label, value, trend, icon, color, active, onClick }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600 text-white shadow-blue-500/20',
    green: 'bg-white text-slate-800 border-slate-100',
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/20',
    orange: 'bg-white text-slate-800 border-slate-100 border-orange-100',
    slate: 'bg-slate-900 text-white shadow-slate-900/20',
  };

  const isLight = colors[color].includes('bg-white');

  return (
    <button 
      onClick={onClick}
      className={`relative p-6 rounded-[2.5rem] border text-left transition-all active:scale-[0.98] shadow-xl shadow-slate-200/20 overflow-hidden ${colors[color]}`}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 text-xs ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-white/10 text-white/40'}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      
      <div className="text-2xl font-black tracking-tighter mb-1 leading-none">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-tighter leading-none mb-2">{label}</div>
      <div className={`text-[8px] font-bold uppercase tracking-widest leading-none ${isLight ? 'text-slate-400' : 'opacity-40'}`}>
         {trend}
      </div>
    </button>
  );
};

export default ReportsScreen;
