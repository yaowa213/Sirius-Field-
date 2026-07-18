import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Brief, UserRole } from '../types';

const BriefsScreen: React.FC = () => {
  const { user } = useApp();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  
  // Creation Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBrief, setNewBrief] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'normal' | 'urgent',
    context: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchBriefs = async () => {
    setLoading(true);
    try {
      const data = await api.getBriefs();
      setBriefs(data);
    } catch (err) {
      console.error("Failed to load briefs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  const sortedBriefs = useMemo(() => {
    return [...briefs].sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [briefs]);

  const handleCreateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBrief.title || !newBrief.message) return;
    
    setIsSubmitting(true);
    try {
      await api.createBrief(user, newBrief);
      setNewBrief({ title: '', message: '', priority: 'normal', context: '' });
      setShowCreateModal(false);
      await fetchBriefs();
    } catch (err) {
      alert("Failed to create brief.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (briefId: string) => {
    if (!user || !isAdmin) return;
    if (!window.confirm("Archive this brief? It will be removed from all field staff feeds.")) return;
    
    try {
      await api.updateBriefStatus(user, briefId, false);
      setSelectedBrief(null);
      await fetchBriefs();
    } catch (err) {
      alert("Failed to update brief status.");
    }
  };

  if (loading && briefs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Bulletins</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 relative min-h-full">
      <div className="flex justify-between items-center mb-2 px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">Operations Briefs</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
            {isAdmin ? 'Communication Console' : 'Field Instructions'}
          </p>
        </div>
        <button 
          onClick={fetchBriefs}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-transform shadow-sm"
        >
          <i className="fa-solid fa-arrows-rotate text-xs"></i>
        </button>
      </div>

      {sortedBriefs.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-10">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-envelope-open text-4xl text-slate-200"></i>
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">No active briefs</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            All clear! Updates from the operations center will be listed here as they arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-32">
          {sortedBriefs.map((brief) => (
            <button
              key={brief.id}
              onClick={() => setSelectedBrief(brief)}
              className={`w-full text-left bg-white p-6 rounded-[2.5rem] border transition-all active:scale-[0.98] shadow-sm hover:shadow-md relative overflow-hidden ${
                brief.priority === 'urgent' ? 'border-red-100' : 'border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {brief.priority === 'urgent' && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-lg shadow-red-200">
                      <i className="fa-solid fa-bolt-lightning text-[8px]"></i>
                      Critical
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    {new Date(brief.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {brief.context && (
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    {brief.context}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 4, marginBottom: 4 }}>
                {/* GLOBAL READABLE TEXT FIX: Black text, 16px font */}
                <h3 className="font-black leading-tight mb-2 tracking-tight" style={{ color: '#000', fontSize: '16px' }}>
                  {brief.title}
                </h3>
                <p className="font-bold line-clamp-2 leading-relaxed" style={{ color: '#000', fontSize: '14px' }}>
                  {brief.message}
                </p>
              </div>
              {brief.priority === 'urgent' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600"></div>}
            </button>
          ))}
        </div>
      )}

      {/* Admin Floating Action Button */}
      {isAdmin && (
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-6 w-16 h-16 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center justify-center text-2xl active:scale-90 transition-all z-50 hover:bg-slate-800"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      )}

      {/* Creation Modal (Admin Only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">New Brief<span className="text-blue-600">.</span></h3>
                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
             </div>

             <form onSubmit={handleCreateBrief} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Title</label>
                   <input 
                      type="text" 
                      required
                      placeholder="e.g. Redo Hasbro Audit"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold focus:border-blue-500/20 transition-all outline-none"
                      value={newBrief.title}
                      onChange={e => setNewBrief({...newBrief, title: e.target.value})}
                      style={{ color: '#000' }}
                   />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Message Body</label>
                   <textarea 
                      required
                      rows={4}
                      placeholder="Enter detailed instructions..."
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-medium focus:border-blue-500/20 transition-all outline-none"
                      value={newBrief.message}
                      onChange={e => setNewBrief({...newBrief, message: e.target.value})}
                      style={{ color: '#000' }}
                   />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Context</label>
                      <input 
                        type="text" 
                        placeholder="Sandton / Checkers"
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold focus:border-blue-500/20 transition-all outline-none"
                        value={newBrief.context}
                        onChange={e => setNewBrief({...newBrief, context: e.target.value})}
                        style={{ color: '#000' }}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</label>
                      <div className="flex bg-slate-50 rounded-2xl p-1 border-2 border-slate-50 h-[56px]">
                         <button 
                            type="button"
                            onClick={() => setNewBrief({...newBrief, priority: 'normal'})}
                            className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newBrief.priority === 'normal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                         >Normal</button>
                         <button 
                            type="button"
                            onClick={() => setNewBrief({...newBrief, priority: 'urgent'})}
                            className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newBrief.priority === 'urgent' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-slate-400'}`}
                         >Urgent</button>
                      </div>
                   </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                  {isSubmitting ? 'Distributing...' : 'Broadcast Brief'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Detail View Overlay */}
      {selectedBrief && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedBrief.priority === 'urgent' && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-red-100">Urgent Requirement</span>
                  )}
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(selectedBrief.createdAt).toLocaleString()}</span>
                </div>
                {/* GLOBAL READABLE TEXT FIX: Brief title on detail view */}
                <h2 className="font-black text-slate-900 tracking-tighter leading-tight italic" style={{ fontSize: '24px', color: '#000' }}>{selectedBrief.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedBrief(null)}
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-8 max-h-[35vh] overflow-y-auto border border-slate-100 shadow-inner">
              {/* GLOBAL READABLE TEXT FIX: Brief detailed message at 16px black */}
              <p className="font-bold leading-relaxed whitespace-pre-wrap" style={{ color: '#000', fontSize: '16px' }}>
                {selectedBrief.message}
              </p>
            </div>

            <div className="flex items-center justify-between mb-8 px-2">
               {selectedBrief.context ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xs shadow-inner"><i className="fa-solid fa-location-dot"></i></div>
                    <span className="text-[11px] font-black text-slate-500 tracking-[0.1em] uppercase">{selectedBrief.context}</span>
                  </div>
               ) : <div />}
               <div className="text-right">
                  <span className="text-[9px] font-black text-slate-300 uppercase block tracking-widest leading-none">Authority</span>
                  <span className="text-[10px] font-black text-slate-800 leading-none">OPS CENTRE</span>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={() => setSelectedBrief(null)}
                 className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg active:scale-95 transition-all shadow-xl shadow-slate-200"
               >
                 ACKNOWLEDGE
               </button>
               {isAdmin && (
                  <button 
                    onClick={() => handleDeactivate(selectedBrief.id)}
                    className="w-full bg-red-50 text-red-600 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
                  >
                    Archive Bulletin
                  </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefsScreen;