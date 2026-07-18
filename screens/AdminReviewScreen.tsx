
import React, { useState } from 'react';
import { useApp } from '../store';

interface AdminReviewScreenProps {
  onSelectAssignment: (id: string) => void;
}

const AdminReviewScreen: React.FC<AdminReviewScreenProps> = ({ onSelectAssignment }) => {
  const { pendingReviewAssignments, refreshPendingReviews } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPendingReviews();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="p-4 space-y-6 pb-24 bg-slate-50 min-h-full">
      <div className="flex justify-between items-end px-1 pt-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic text-indigo-900">Governance Review<span className="text-blue-600">.</span></h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">
            Verification Protocol Alpha
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all shadow-sm ${refreshing ? 'animate-spin text-blue-500' : ''}`}
        >
          <i className="fa-solid fa-arrows-rotate text-xs"></i>
        </button>
      </div>

      {pendingReviewAssignments.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3.5rem] border border-slate-100 px-10 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-shield-halved text-3xl text-slate-200"></i>
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Zero Pending Audits</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
            "Boardroom data integrity is currently at 100%. All submitted field nodes have been processed."
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="px-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pendingReviewAssignments.length} Surveys Awaiting Final Approval</span>
          </div>
          
          {pendingReviewAssignments.map((asgn) => (
            <button
              key={asgn.id}
              onClick={() => onSelectAssignment(asgn.id)}
              className="w-full text-left bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-blue-100 text-blue-700 w-fit mb-1">
                    PENDING REVIEW
                  </span>
                  <h3 className="font-black text-lg text-slate-800 tracking-tight leading-tight">{asgn.surveyName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                     Submitted by: <span className="text-indigo-600 font-black">{asgn.teamLeaderName}</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <i className="fa-solid fa-magnifying-glass-plus text-sm"></i>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[10px]"><i className="fa-solid fa-shop"></i></div>
                    <span className="text-xs font-bold text-slate-600">{asgn.storeName}</span>
                 </div>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    {new Date(asgn.submittedAt || asgn.lastModifiedAt).toLocaleDateString()}
                 </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="py-12 px-12 text-center opacity-30">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
           Sirius Ops Console: Governance<br/>
           Review Pipeline Connected
        </p>
      </div>
    </div>
  );
};

export default AdminReviewScreen;
