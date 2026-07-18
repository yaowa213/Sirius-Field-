import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store';
import { Store } from '../types';
import { api } from '../api';

const DashboardScreen: React.FC = () => {
  const { stores, clockIn, startViewingVisit, user, refreshStores } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [surveyCount, setSurveyCount] = useState<number>(0);
  const [briefCount, setBriefCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const [surveys, briefs] = await Promise.all([
        api.getMonthlySurveyCount(),
        api.getBriefs()
      ]);
      setSurveyCount(surveys);
      setBriefCount(briefs.length);
    };
    fetchData();
  }, []);

  const filteredStores = useMemo(() => {
    return stores
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const statusWeight = { 'incomplete': 0, 'pending': 1, 'visited': 2, 'active': 3 };
        return (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
      });
  }, [stores, searchQuery]);

  const handleStoreAction = async (store: Store) => {
    if (store.status === 'visited') {
      startViewingVisit(store.id);
    } else {
      try {
        await clockIn(store);
      } catch (err: any) {
        alert(err.message || 'Clock-in failed');
      }
    }
  };

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-full">
      <div className="px-1 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: '#000' }}>Activity Feed</h2>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#000' }}>
            {user?.role === 'TEAM_LEADER' ? 'TL Ownership Mode' : 'Field Operations'}
          </p>
        </div>
        <button onClick={refreshStores} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-slate-400 active:scale-90 transition-transform"><i className="fa-solid fa-rotate"></i></button>
      </div>

      <div className="relative group">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          type="text"
          placeholder="Search stores..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-500/10 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ color: '#000', fontSize: '16px' }}
        />
      </div>

      <div className="space-y-4 pb-12">
        {filteredStores.map((store) => (
          <div key={store.id} className={`bg-white p-5 rounded-[2rem] border transition-all shadow-sm ${store.status === 'visited' ? 'border-green-50' : (store.status === 'incomplete' ? 'border-orange-100 bg-orange-50/5' : 'border-slate-100')}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1" style={{ marginTop: 4, marginBottom: 4 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                    store.status === 'visited' ? 'bg-green-100 text-green-700' : (store.status === 'incomplete' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700')
                  }`}>
                    {store.status === 'visited' ? 'Completed' : (store.status === 'incomplete' ? 'Incomplete' : 'Pending')}
                  </span>
                  <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                    {store.regionId}
                  </span>
                </div>
                <h3 className="font-black leading-tight" style={{ color: '#000', fontSize: '16px' }}>{store.name}</h3>
                <p className="font-bold flex items-center gap-1 mt-1" style={{ color: '#000', fontSize: '12px' }}>
                  <i className="fa-solid fa-location-dot text-[9px]"></i>
                  {store.address}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-black uppercase tracking-widest" style={{ color: '#000', fontSize: '9px' }}>Owner</span>
                <span className="font-bold" style={{ color: '#000', fontSize: '10px' }}>Marc TL</span>
              </div>
              
              <button 
                onClick={() => handleStoreAction(store)}
                className={`px-8 py-3 rounded-2xl font-black transition-all active:scale-95 shadow-md flex items-center gap-2 ${
                  store.status === 'visited' 
                    ? 'bg-slate-100 text-[#000]' 
                    : (store.status === 'incomplete' ? 'bg-orange-100 text-[#000]' : 'bg-blue-100 text-[#000]')
                }`}
                style={{ fontSize: '12px' }}
              >
                {store.status === 'visited' ? (
                  <><i className="fa-solid fa-eye text-[10px]"></i> VIEW VISIT</>
                ) : (store.status === 'incomplete' ? (
                  <><i className="fa-solid fa-play text-[10px]"></i> RESUME VISIT</>
                ) : (
                  <><i className="fa-solid fa-play text-[10px]"></i> START VISIT</>
                ))}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardScreen;