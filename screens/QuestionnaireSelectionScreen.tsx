import React, { useMemo } from 'react';
import { useApp } from '../store';
import { Assignment, AssignmentStatus } from '../types';

interface QuestionnaireSelectionScreenProps {
  storeId: string;
  supplierId: string;
  onBack: () => void;
  onSelectAssignment: (assignmentId: string) => void;
}

const QuestionnaireSelectionScreen: React.FC<QuestionnaireSelectionScreenProps> = ({ 
  storeId, 
  supplierId, 
  onBack, 
  onSelectAssignment 
}) => {
  const { assignments, stores } = useApp();

  const storeObj = useMemo(() => stores.find(s => s.id === storeId), [stores, storeId]);

  const displayItems = useMemo(() => assignments.filter((a: Assignment) => 
    a.storeId === storeId && a.supplierId === supplierId
  ), [assignments, storeId, supplierId]);

  const supplierName = displayItems[0]?.supplierName || "Supplier";
  const storeName = storeObj?.name || "Store Node";

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-full pb-32">
      <div className="flex items-center gap-4 px-1 pt-2">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all shadow-sm">
          <i className="fa-solid fa-arrow-left text-xs"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">Select Protocol<span className="text-blue-600">.</span></h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">
            {supplierName} @ {storeName}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {displayItems.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-10">
            <p className="text-xs text-slate-400 font-medium italic">No protocols found.</p>
          </div>
        ) : (
          displayItems.map(asgn => (
            <button
              key={asgn.id}
              onClick={() => onSelectAssignment(asgn.id)}
              className="w-full text-left bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm w-fit ${
                      asgn.status === AssignmentStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                      (asgn.status === AssignmentStatus.PENDING_REVIEW ? 'bg-blue-100 text-blue-700' : 
                      (asgn.status === AssignmentStatus.REJECTED ? 'bg-red-600 text-white' : 
                      (asgn.status === AssignmentStatus.IN_PROGRESS ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-500')))
                    }`}>
                      {asgn.status.replace('_', ' ')}
                    </span>
                    <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {asgn.assignmentType}
                    </span>
                  </div>
                  <h3 className="font-black tracking-tight leading-tight" style={{ color: '#000', fontSize: '16px' }}>
                    {asgn.surveyName}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <i className="fa-solid fa-clipboard-check text-xs"></i>
                </div>
              </div>

              {asgn.briefMessage && (
                <div className="mt-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                  <p className="font-bold leading-relaxed italic line-clamp-2 text-slate-600 text-sm">
                    "{asgn.briefMessage}"
                  </p>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionnaireSelectionScreen;