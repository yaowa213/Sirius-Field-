import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TeamLeaderAnalytics, UserRole, SystemHealth, GeneratedReport } from '../types';
import { useApp } from '../store';

const SupervisorDashboard: React.FC = () => {
  const { user, systemHealth, stores, generatedReports, addGeneratedReport, refreshGeneratedReports } = useApp();
  const [analytics, setAnalytics] = useState<TeamLeaderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | 'evidence' | null>(null);
  const [drStatus, setDrStatus] = useState<{verified: boolean, issues: number} | null>(null);
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null);
  
  const [exportScope, setExportScope] = useState<'all' | 'specific'>('all');
  const [selectedExportStoreId, setSelectedExportStoreId] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      try {
        const [a, dr] = await Promise.all([
          api.getTeamLeaderAnalytics(user.id),
          user.role === UserRole.ADMIN ? api.verifyDataIntegrity(user) : Promise.resolve(null),
          refreshGeneratedReports()
        ]);
        setAnalytics(a);
        setDrStatus(dr);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleExportCSV = async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    setExporting('csv');
    setTimeout(async () => {
      try {
        const filters = exportScope === 'specific' ? { regionId: selectedExportStoreId } : {};
        await api.generateExcelAuditExport(user, filters);
        // Note: Excel export still uses direct download as per instructions
      } catch (err: any) {
        alert(err.message || "Excel Export failed.");
      } finally {
        setExporting(null);
      }
    }, 100);
  };

  const handleExportPDF = async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    setExporting('pdf');
    setTimeout(async () => {
      try {
        const filters = exportScope === 'specific' ? { regionId: selectedExportStoreId } : {};
        const dataUrl = await api.generatePdfExecutiveSummary(user, filters);
        
        const storeName = exportScope === 'specific' ? stores.find(s => s.id === selectedExportStoreId)?.name : 'Global Portfolio';
        
        const newReport: GeneratedReport = {
          id: `REP-${Date.now()}`,
          name: `Executive Summary - ${new Date().toLocaleDateString()}`,
          type: 'PDF',
          createdAt: Date.now(),
          dataUrl,
          storeName
        };

        await addGeneratedReport(newReport);
        alert("PDF generated successfully. Access it in the Document Vault below.");
      } catch (err: any) {
        alert(err.message || "PDF Generation failed.");
      } finally {
        setExporting(null);
      }
    }, 100);
  };

  const handleExportEvidencePdf = async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    setExporting('evidence');
    setTimeout(async () => {
      try {
        const filters = exportScope === 'specific' ? { regionId: selectedExportStoreId } : {};
        const dataUrl = await api.generateEvidencePdf(user, filters);
        
        const storeName = exportScope === 'specific' ? stores.find(s => s.id === selectedExportStoreId)?.name : 'Global Portfolio';
        const timestamp = new Date().toISOString().split('T')[0];

        const newReport: GeneratedReport = {
          id: `EVI-${Date.now()}`,
          name: `Evidence_${storeName?.replace(/\s/g, '_')}_${timestamp}`,
          type: 'PDF',
          createdAt: Date.now(),
          dataUrl,
          storeName
        };

        await addGeneratedReport(newReport);
        alert("Evidence PDF generated successfully. Visual nodes indexed in vault.");
      } catch (err: any) {
        alert(err.message || "Evidence PDF Generation failed.");
      } finally {
        setExporting(null);
      }
    }, 100);
  };

  const toggleLegalHold = async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    const current = systemHealth?.isLegalHoldActive;
    await api.setLegalHold(user, !current);
    window.location.reload();
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying Data Integrity</p>
    </div>
  );

  const hasBoardData = (analytics?.kpis.surveysCompleted || 0) > 0;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">Operations Hub</h2>
          <div className="flex items-center gap-2 mt-1">
             <i className="fa-solid fa-shield-check text-green-500 text-[10px]"></i>
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Production Environment Verified</p>
          </div>
        </div>
      </div>

      {user?.role === UserRole.ADMIN && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6 border border-white/5">
           <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Boardroom Export Engine</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Export Scope</label>
                  <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button onClick={() => setExportScope('all')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${exportScope === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40'}`}>All Stores</button>
                    <button onClick={() => setExportScope('specific')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${exportScope === 'specific' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40'}`}>Targeted</button>
                  </div>
                </div>

                <div className={`space-y-2 transition-opacity duration-300 ${exportScope === 'all' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Store Target Selection</label>
                  <div className="relative">
                    <select value={selectedExportStoreId} onChange={(e) => setSelectedExportStoreId(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-[12px] font-black text-white outline-none appearance-none focus:border-blue-500/50 transition-all">
                      <option value="" disabled className="text-slate-900">Select Target Node...</option>
                      {stores.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-4 pt-4">
              <div className="flex gap-4">
                <button 
                    onClick={handleExportCSV} 
                    disabled={!!exporting || (exportScope === 'specific' && !selectedExportStoreId)} 
                    className="flex-1 py-5 bg-white text-slate-900 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                >
                    {exporting === 'csv' ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-file-excel"></i>}
                    {exporting === 'csv' ? 'CSV...' : 'EXCEL (XLSX)'}
                </button>
                <button 
                    onClick={handleExportPDF} 
                    disabled={!!exporting || !hasBoardData || (exportScope === 'specific' && !selectedExportStoreId)} 
                    className={`flex-1 py-5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${hasBoardData ? 'bg-blue-600 text-white active:scale-95' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}
                >
                    {exporting === 'pdf' ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
                    {exporting === 'pdf' ? 'SUMMARY' : 'PDF SUMMARY'}
                </button>
              </div>
              <button 
                onClick={handleExportEvidencePdf} 
                disabled={!!exporting || !hasBoardData || (exportScope === 'specific' && !selectedExportStoreId)} 
                className={`w-full py-5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${hasBoardData ? 'bg-indigo-600 text-white active:scale-95 shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}
              >
                 {exporting === 'evidence' ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-camera-retro"></i>}
                 {exporting === 'evidence' ? 'DEVELOPING EVIDENCE...' : 'EVIDENCE PDF (PHOTOS)'}
              </button>
           </div>
           {!hasBoardData && (
              <p className="text-[9px] text-white/30 text-center uppercase font-black tracking-widest mt-2 animate-pulse">
                <i className="fa-solid fa-circle-info mr-1"></i> No approved audits found for export
              </p>
           )}
        </div>
      )}

      {/* Generated Reports Vault */}
      {user?.role === UserRole.ADMIN && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
           <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none italic">Document Vault</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">In-App Distribution</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                <i className="fa-solid fa-folder-tree"></i>
              </div>
           </div>

           <div className="space-y-3">
              {generatedReports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 ${report.id.startsWith('EVI') ? 'text-indigo-600' : 'text-red-500'}`}>
                        <i className={`fa-solid ${report.id.startsWith('EVI') ? 'fa-camera-retro' : 'fa-file-pdf'}`}></i>
                      </div>
                      <div className="max-w-[150px]">
                        <h4 className="text-[10px] font-black text-slate-800 leading-tight mb-0.5 truncate">{report.name}</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{report.storeName || 'General Portfolio'}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setViewingReport(report)}
                     className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                   >
                     View
                   </button>
                </div>
              ))}
              {generatedReports.length === 0 && (
                <div className="py-8 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Document Vault is Empty</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Report Viewer Overlay */}
      {viewingReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="w-full h-full max-w-4xl bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
              <header className="px-8 py-6 border-b flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-inner ${viewingReport.id.startsWith('EVI') ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                       <i className={`fa-solid ${viewingReport.id.startsWith('EVI') ? 'fa-camera-retro' : 'fa-file-pdf'}`}></i>
                    </div>
                    <div>
                       <h3 className="font-black text-slate-800 tracking-tight leading-none italic" style={{fontSize: '18px'}}>{viewingReport.name}</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{viewingReport.storeName}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setViewingReport(null)}
                   className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                 >
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </header>
              <div className="flex-1 bg-slate-800 p-2 overflow-hidden relative">
                 <iframe 
                   src={viewingReport.dataUrl} 
                   className="w-full h-full border-none rounded-2xl" 
                   title="PDF Viewer"
                 />
              </div>
              <footer className="p-8 border-t flex gap-4 bg-white shrink-0">
                 <button 
                   onClick={() => {
                     const link = document.createElement('a');
                     link.href = viewingReport.dataUrl;
                     link.download = viewingReport.name + ".pdf";
                     link.click();
                   }}
                   className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                    Download Local Copy
                 </button>
                 <button 
                   onClick={() => setViewingReport(null)}
                   className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                 >
                    Dismiss Viewer
                 </button>
              </footer>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${systemHealth?.status === 'OPTIMAL' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Integrity Engine</span>
          </div>
        </div>
        <div className="p-8">
           <div className="grid grid-cols-2 gap-8 mb-8">
              <HealthMetric icon="fa-fingerprint" label="Integrity" value={drStatus?.issues === 0 ? 'VERIFIED' : 'ISSUES'} color={drStatus?.issues === 0 ? 'green' : 'red'} />
              <HealthMetric icon="fa-cloud-arrow-up" label="RPO Target" value="REAL-TIME" color="blue" />
              <HealthMetric icon="fa-gavel" label="Legal Hold" value={systemHealth?.isLegalHoldActive ? 'ACTIVE' : 'INACTIVE'} color={systemHealth?.isLegalHoldActive ? 'red' : 'slate'} />
              <HealthMetric icon="fa-recycle" label="Retention" value="30D/5Y/7Y" color="slate" />
           </div>
           
           {user?.role === UserRole.ADMIN && (
             <div className="pt-6 border-t border-slate-50 flex gap-3">
                <button onClick={toggleLegalHold} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${systemHealth?.isLegalHoldActive ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                  {systemHealth?.isLegalHoldActive ? 'Release Legal Hold' : 'Initiate Legal Hold'}
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Approved Audits" value={analytics?.kpis.surveysCompleted || 0} icon="fa-clipboard-check" />
        <MetricCard label="OSA Health" value={`${Math.round(analytics?.kpis.stockAvailability || 0)}%`} icon="fa-box-open" />
        <MetricCard label="Reach Index" value={`${Math.round(analytics?.kpis.coverage || 0)}%`} icon="fa-map-location-dot" />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Audit Sample Velocity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.dailyTrend}>
              <XAxis dataKey="date" hide />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: '800'}} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const HealthMetric: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: any = { green: 'text-green-600', red: 'text-red-600', blue: 'text-blue-600', slate: 'text-slate-400' };
  return (
    <div className="flex items-center gap-3">
       <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-xs ${colors[color]}`}><i className={`fa-solid ${icon}`}></i></div>
       <div>
          <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{label}</p>
          <p className={`text-[10px] font-black uppercase leading-none ${colors[color]}`}>{value}</p>
       </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: string; color?: string }> = ({ label, value, icon, color = 'blue' }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center shadow-sm">
    <div className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center mb-3 bg-${color === 'red' ? 'red' : 'blue'}-50 text-${color === 'red' ? 'red' : 'blue'}-600 text-xs shadow-inner`}><i className={`fa-solid ${icon}`}></i></div>
    <div className="text-xl font-black text-slate-800 tracking-tighter leading-none mb-1">{value}</div>
    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</div>
  </div>
);

export default SupervisorDashboard;
