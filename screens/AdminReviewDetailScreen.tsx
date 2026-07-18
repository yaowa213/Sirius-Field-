
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { AssignmentStatus, Questionnaire, QuestionResponse } from '../types';
import { api } from '../api';

interface AdminReviewDetailScreenProps {
  assignmentId: string;
  onBack: () => void;
}

const AdminReviewDetailScreen: React.FC<AdminReviewDetailScreenProps> = ({ assignmentId, onBack }) => {
  const { pendingReviewAssignments, reviewAssignment } = useApp();
  const assignment = pendingReviewAssignments.find(a => a.id === assignmentId);
  
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadProtocol = async () => {
      if (assignment) {
        const q = await api.getQuestionnaire(assignment.surveyId);
        setQuestionnaire(q);
      }
      setLoading(false);
    };
    loadProtocol();
  }, [assignment]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Evidence</p>
      </div>
    );
  }

  if (!assignment || !questionnaire) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><i className="fa-solid fa-circle-exclamation text-xl"></i></div>
        <p className="text-slate-400 font-black uppercase tracking-widest">Protocol mismatch or Record expired</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-black uppercase text-sm tracking-widest">Return to Console</button>
      </div>
    );
  }

  const executionData = assignment.executionData || { responses: [], comment: '' };
  const responsesMap: Record<string, QuestionResponse> = {};
  executionData.responses.forEach((r: QuestionResponse) => {
    responsesMap[r.questionId] = r;
  });

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await reviewAssignment(assignmentId, AssignmentStatus.APPROVED);
      alert("Survey Approved. Record moved to board-ready state.");
      onBack();
    } catch (err) {
      alert("Approval failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return alert("Feedback is mandatory for rejections.");
    setIsProcessing(true);
    try {
      await reviewAssignment(assignmentId, AssignmentStatus.REJECTED, rejectionReason);
      alert("Survey Rejected. Auditor notified for revision.");
      onBack();
    } catch (err) {
      alert("Rejection failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight italic">Audit Review<span className="text-indigo-600">.</span></h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-0.5">
               {questionnaire.title}
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
           <i className="fa-solid fa-gavel text-xs"></i>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-40">
        {/* Context Information */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Governance Context</span>
           <h2 className="text-xl font-black text-slate-800 leading-tight mb-4">{assignment.storeName}</h2>
           
           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Assigned Auditor</p>
                 <p className="text-xs font-bold text-slate-700">{assignment.teamLeaderName}</p>
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Submission Date</p>
                 <p className="text-xs font-bold text-slate-700">{new Date(assignment.submittedAt || 0).toLocaleDateString()}</p>
              </div>
           </div>
        </div>

        {/* Dynamic Question Responses */}
        <div className="space-y-4">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Field Evidence</h3>
           
           {questionnaire.questions.map((q) => {
             const res = responsesMap[q.id];
             return (
               <div key={q.id} className="space-y-4">
                  {/* Status Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{q.productName}</p>
                        <p className="text-sm font-black text-slate-800">{q.questionText}</p>
                        <p className="text-[11px] font-black text-indigo-600 mt-1 uppercase tracking-tighter">
                          Result: {res?.result === true ? "YES" : (res?.result === false ? "NO" : "UNANSWERED")}
                        </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${res?.result === true ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <i className={`fa-solid ${res?.result === true ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                    </div>
                  </div>

                  {/* Photo Evidence */}
                  {q.requiresPhotoOnYes && res?.result === true && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Mandatory Visual Verification</p>
                      {res.photoBase64 ? (
                          <div className="rounded-3xl overflow-hidden h-64 border-2 border-slate-50">
                            <img src={res.photoBase64} className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <p className="text-red-500 font-bold text-xs uppercase italic p-4 bg-red-50 rounded-2xl">Critical failure: Photo not captured</p>
                      )}
                    </div>
                  )}

                  {/* Reason Evidence */}
                  {q.requiresReasonOnNo && res?.result === false && (
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">OOS Exception Reason</p>
                      <p className="text-sm font-black text-slate-800">{res.oosReason || "No context provided"}</p>
                    </div>
                  )}
               </div>
             );
           })}

           {/* Global Commentary */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Final Observations</p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{executionData.comment || "No commentary recorded by auditor."}"</p>
           </div>
        </div>
      </main>

      {/* Rejection Form Overlay */}
      {showRejectionForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-ban text-2xl"></i></div>
             <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight tracking-tight">Reject Audit</h3>
             <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Please provide specific corrective feedback for the field auditor.</p>
             
             <textarea 
               value={rejectionReason}
               onChange={e => setRejectionReason(e.target.value)}
               placeholder="e.g. Photo evidence is insufficient. Please retake to show full shelf facings."
               className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-sm font-medium focus:border-red-500/20 transition-all outline-none mb-6"
               rows={3}
             />

             <div className="flex gap-3">
                <button onClick={() => setShowRejectionForm(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">CANCEL</button>
                <button 
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 active:scale-95 transition-all disabled:opacity-30"
                >
                  REJECT AUDIT
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Boardroom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t safe-bottom flex gap-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-[60]">
        <button 
          onClick={() => setShowRejectionForm(true)}
          disabled={isProcessing}
          className="flex-1 py-5 rounded-[2rem] bg-red-50 text-red-600 font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all border border-red-100"
        >
          REJECT
        </button>
        <button 
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex-[2] py-5 rounded-[2rem] bg-indigo-900 text-white font-black text-base uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-shield-check"></i>}
          APPROVE AUDIT
        </button>
      </footer>
    </div>
  );
};

export default AdminReviewDetailScreen;
