
import React from 'react';

const SurveyDetailScreen: React.FC<{ assignmentId: string; onBack: () => void }> = ({ assignmentId, onBack }) => {
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
          <i className="fa-solid fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Audit Protocol</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-0.5">
            Ref: {assignmentId}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
         <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
            <i className="fa-solid fa-vial-circle-check text-4xl"></i>
         </div>
         <h2 className="text-2xl font-black text-slate-900 tracking-tight italic mb-2">Audit Detail View<span className="text-blue-600">.</span></h2>
         <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
            This module is a placeholder for the high-fidelity survey execution engine. 
            All response nodes, logic gates, and photo capture hooks will be rendered here in the next build.
         </p>
         
         <div className="w-full p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Locked for Sync</span>
            </div>
            <div className="h-px bg-slate-200"></div>
            <div className="flex justify-between items-center text-left">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Assigned Context</p>
                  <p className="text-xs font-bold text-slate-800">{assignmentId}</p>
               </div>
               <i className="fa-solid fa-fingerprint text-slate-200 text-2xl"></i>
            </div>
         </div>
      </main>

      <footer className="p-6 safe-bottom border-t border-slate-50">
         <button 
           onClick={onBack}
           className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg active:scale-95 transition-all shadow-xl"
         >
           RETURN TO DASHBOARD
         </button>
      </footer>
    </div>
  );
};

export default SurveyDetailScreen;
