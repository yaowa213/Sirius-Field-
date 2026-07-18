import React, { useMemo } from 'react';
import { useApp } from '../store';
import { Assignment } from '../types';

interface SupplierSelectionScreenProps {
  storeId: string;
  onBack: () => void;
  onSelectSupplier: (supplierId: string) => void;
}

const SupplierSelectionScreen: React.FC<SupplierSelectionScreenProps> = ({ storeId, onBack, onSelectSupplier }) => {
  const { assignments } = useApp();

  const protocols = useMemo(() => {
    const storeAssignments = assignments.filter((a: Assignment) => a.storeId === storeId);
    const supplierMap = new Map<string, { id: string, name: string, taskCount: number }>();
    
    storeAssignments.forEach(asgn => {
      const existing = supplierMap.get(asgn.supplierId);
      if (existing) {
        existing.taskCount += 1;
      } else {
        supplierMap.set(asgn.supplierId, {
          id: asgn.supplierId,
          name: asgn.supplierName,
          taskCount: 1
        });
      }
    });
    
    return Array.from(supplierMap.values());
  }, [assignments, storeId]);

  const storeName = assignments.find(a => a.storeId === storeId)?.storeName || "Store Node";

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-full pb-32">
      <div className="flex items-center gap-4 px-1 pt-2">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 shadow-sm"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">Select Supplier<span className="text-blue-600">.</span></h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">{storeName}</p>
        </div>
      </div>

      <div className="space-y-4">
        {protocols.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-10">
            <p className="text-xs text-slate-400 font-medium italic">No active surveys assigned for this store.</p>
          </div>
        ) : (
          protocols.map(protocol => (
            <button
              key={protocol.id}
              onClick={() => onSelectSupplier(protocol.id)}
              className="w-full text-left bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all flex justify-between items-center group relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-inner">
                  <i className="fa-solid fa-industry"></i>
                </div>
                <div>
                  <h3 className="font-black tracking-tight leading-tight" style={{ color: '#000', fontSize: '18px' }}>
                    {protocol.name}
                  </h3>
                  <p className="font-bold text-slate-500 uppercase tracking-tighter text-[11px]">
                    {protocol.taskCount} Active Survey{protocol.taskCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-blue-500 transition-colors"></i>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierSelectionScreen;