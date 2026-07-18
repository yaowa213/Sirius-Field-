import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Assignment, Store, SyncStatus } from '../types';

interface TLDashboardScreenProps {
  onSelectStore: (storeId: string) => void;
}

// Fixed typo: changed TLashboardScreenProps to TLDashboardScreenProps
const TLDashboardScreen: React.FC<TLDashboardScreenProps> = ({ onSelectStore }) => {
  const { user, assignments, refreshAssignments, stores, offlineMode, isSyncInProgress } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAssignments();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Sync Stats derived from current assignments
  const syncStats = useMemo(() => {
    const pending = assignments.filter(a => a.syncStatus === SyncStatus.PENDING).length;
    const syncing = assignments.filter(a => a.syncStatus === SyncStatus.SYNCING).length;
    const synced = assignments.filter(a => a.syncStatus === SyncStatus.SYNCED).length;
    return { pending, syncing, synced };
  }, [assignments]);

  // Filter stores that have assignments for this TL
  const storesWithTasks = useMemo(() => {
    const assignedStoreIds = new Set(assignments.map((a: Assignment) => a.storeId));
    
    return stores
      .filter(s => assignedStoreIds.has(s.id))
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a.region < b.region) return -1;
        if (a.region > b.region) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [stores, assignments, searchQuery]);

  return (
    <div className="p-4 space-y-6 pb-24 bg-slate-50 min-h-full">
      <div className="flex justify-between items-end px-1 pt-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter italic" style={{ color: '#000' }}>My Territory<span className="text-blue-600">.</span></h2>
          <p className="text-[11px] font-black uppercase tracking-widest leading-none mt-1" style={{ color: '#000' }}>
            Select store to audit
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all shadow-sm ${refreshing ? 'animate-spin border-blue-100 text-blue-500' : ''}`}
        >
          <i className="fa-solid fa-rotate text-xs"></i>
        </button>
      </div>

      {/* Sync Status Indicators */}
      <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm flex items-center justify-around">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${syncStats.pending > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'}`}>
            <i className={`fa-solid fa-cloud-arrow-up text-xs ${syncStats.pending > 0 ? 'animate-bounce' : ''}`}></i>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase">Pending</span>
          <span className="text-[10px] font-black text-slate-800">{syncStats.pending}</span>
        </div>
        <div className="h-8 w-px bg-slate-100"></div>
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${isSyncInProgress ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
            <i className={`fa-solid fa-arrows-rotate text-xs ${(isSyncInProgress || syncStats.syncing > 0) && !offlineMode ? 'animate-spin' : ''}`}></i>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase">Syncing</span>
          <span className="text-[10px] font-black text-slate-800">{syncStats.syncing}</span>
        </div>
        <div className="h-8 w-px bg-slate-100"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-1">
            <i className="fa-solid fa-cloud-check text-xs"></i>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase">Synced</span>
          <span className="text-[10px] font-black text-slate-800">{syncStats.synced}</span>
        </div>
      </div>

      <div className="relative group">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          type="text"
          placeholder="Search stores or regions..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-500/10 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ color: '#000', fontSize: '16px' }}
        />
      </div>

      {storesWithTasks.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-10">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-map-location-dot text-3xl text-slate-200"></i>
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">No assigned stores</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
            "Your assigned territories will appear here as the board issues new directives."
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {storesWithTasks.map((store) => (
            <button
              key={store.id}
              onClick={() => onSelectStore(store.id)}
              className="w-full text-left bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all flex justify-between items-center group relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-inner">
                  <i className="fa-solid fa-shop"></i>
                </div>
                <div style={{ marginTop: 4, marginBottom: 4 }}>
                  <h3 className="font-black tracking-tight leading-tight" style={{ color: '#000', fontSize: '16px' }}>
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                      {store.region}
                    </span>
                    <p className="font-bold uppercase tracking-tighter" style={{ color: '#000', fontSize: '10px' }}>
                      {assignments.filter((a: Assignment) => a.storeId === store.id).length} Protocol(s)
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 {/* Local Sync Indicator per store if any assignment is pending */}
                 {assignments.some(a => a.storeId === store.id && (a.syncStatus === SyncStatus.PENDING || a.syncStatus === SyncStatus.SYNCING)) && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                 )}
                 <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-blue-500 transition-colors"></i>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="py-12 px-12 text-center opacity-30">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
           Field-Region Synchronizer: {offlineMode ? 'OFFLINE' : (isSyncInProgress ? 'SYNCING' : 'OK')}<br/>
           Auditor: {user?.name}
        </p>
      </div>
    </div>
  );
};

export default TLDashboardScreen;
