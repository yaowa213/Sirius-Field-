import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Supplier, VisitSession } from '../types';

interface StoreVisitScreenProps {
  onSelectAssignment: (assignmentId: string) => void;
}

const StoreVisitScreen: React.FC<StoreVisitScreenProps> = ({ onSelectAssignment }) => {
  const { activeSession, viewingStoreId, stopViewingVisit, clockOut, stores, assignments } = useApp();
  
  const isReadOnly = !!viewingStoreId;
  const storeId = activeSession?.storeId || viewingStoreId;
  const store = stores.find(s => s.id === storeId);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [history, setHistory] = useState<VisitSession[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    
    const loadInitialData = async () => {
      try {
        const [sups, hist] = await Promise.all([
          api.getSuppliersByStore(storeId),
          api.getVisitHistory(storeId)
        ]);
        setSuppliers(sups);
        setHistory(hist);
      } catch (err) {
        console.error("Failed to load store visit data", err);
      }
    };
    loadInitialData();
  }, [storeId]);

  const handleProtocolPress = (supplierId: string) => {
    // Find assignment for this supplier at this store
    const asgn = assignments.find(a => a.storeId === storeId && a.supplierId === supplierId);
    if (asgn) {
      onSelectAssignment(asgn.id);
    } else {
      console.warn("No active survey assignment found for supplier:", supplierId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={isReadOnly ? stopViewingVisit : () => setShowExitModal(true)} 
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95 transition-all border border-slate-100"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight italic">{store?.name || 'Store Node'}</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-0.5">
               {store?.address}
            </p>
          </div>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => clockOut('completed')}
            className="px-6 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            End Visit
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-white border border-slate-100 rounded-[3rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-200/20">
          <i className="fa-solid fa-store text-3xl text-blue-600"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight italic mb-2">Operation Hub<span className="text-blue-600">.</span></h2>
        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10 max-w-[300px] text-center">
           {isReadOnly ? "Viewing historical records for this store node." : "Field rep session active. Conduct on-shelf audits for assigned suppliers."}
        </p>

        <div className="w-full max-w-sm bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs shadow-inner"><i className="fa-solid fa-clipboard-list"></i></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Protocols</span>
           </div>
           <div className="space-y-2">
              {suppliers.map(sup => (
                <button 
                  key={sup.id} 
                  onClick={() => handleProtocolPress(sup.id)}
                  className="w-full text-left p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-50 active:scale-[0.98] active:bg-slate-100 transition-all group"
                >
                   <span className="text-sm font-black text-slate-800 group-active:text-blue-600">{sup.name}</span>
                   <i className="fa-solid fa-chevron-right text-slate-200 group-active:text-blue-400"></i>
                </button>
              ))}
              {suppliers.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No specific supplier audits required at this time.</p>
              )}
           </div>
        </div>

        {showExitModal && !isReadOnly && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <i className="fa-solid fa-circle-info text-2xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight text-center">Complete visit?</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-center px-4">Ensure all shelf availability audits are finalized before syncing with the boardroom.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => clockOut('completed')}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Finalize & Sync
                </button>
                <button 
                  onClick={() => setShowExitModal(false)}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Continue Audit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StoreVisitScreen;