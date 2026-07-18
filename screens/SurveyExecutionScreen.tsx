import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../store';
import { AssignmentStatus, Questionnaire, QuestionResponse, Assignment } from '../types';
import { api, compressImage } from '../api';

interface SurveyExecutionScreenProps {
  assignmentId: string;
  onBack: () => void;
}

const SurveyExecutionScreen: React.FC<SurveyExecutionScreenProps> = React.memo(({ assignmentId, onBack }) => {
  const { assignments, saveAssignmentExecution } = useApp();
  
  const [localAssignment, setLocalAssignment] = useState<Assignment | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);

  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Use a ref to track the latest responses for the auto-save logic
  const responsesRef = useRef(responses);
  const commentRef = useRef(comment);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    commentRef.current = comment;
  }, [comment]);

  useEffect(() => {
    const loadData = async () => {
      let found = assignments.find(a => a.id === assignmentId);

      if (!found) {
        setLoading(false);
        return;
      }
      
      setLocalAssignment(found);
      const q = await api.getQuestionnaire(found.surveyId);
      setQuestionnaire(q);
      
      if (found.status === AssignmentStatus.ASSIGNED) {
        saveAssignmentExecution(assignmentId, { status: AssignmentStatus.IN_PROGRESS });
      }

      if (found.executionData) {
        const initialResponses: Record<string, QuestionResponse> = {};
        found.executionData.responses.forEach((r: QuestionResponse) => {
          initialResponses[r.questionId] = r;
        });
        setResponses(initialResponses);
        setComment(found.executionData.comment || '');
      } else if (q) {
        const initialResponses: Record<string, QuestionResponse> = {};
        q.questions.forEach(qItem => {
          initialResponses[qItem.id] = { questionId: qItem.id, result: null };
        });
        setResponses(initialResponses);
      }
      
      // Expand all questions by default for non-linear visibility
      if (q) {
        setExpandedIds(new Set(q.questions.map(qItem => qItem.id)));
      }
      
      setLoading(false);
    };
    loadData();
  }, [assignmentId, assignments, saveAssignmentExecution]);

  // Persistent Auto-save helper
  const persistProgress = useCallback(async (updatedResponses: Record<string, QuestionResponse>, updatedComment: string) => {
    if (!assignmentId || isSaving) return;
    const executionData = { 
      responses: Object.values(updatedResponses) as QuestionResponse[], 
      comment: updatedComment 
    };
    await saveAssignmentExecution(assignmentId, { 
      executionData, 
      status: AssignmentStatus.IN_PROGRESS,
      lastModifiedAt: Date.now()
    });
  }, [assignmentId, saveAssignmentExecution, isSaving]);

  const isLocked = localAssignment?.status === AssignmentStatus.PENDING_REVIEW || localAssignment?.status === AssignmentStatus.APPROVED;

  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePhotoCapture = useCallback((questionId: string) => {
    if (isLocked) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const rawBase64 = reader.result as string;
          const compressedBase64 = await compressImage(rawBase64);
          const nextResponses = {
            ...responsesRef.current,
            [questionId]: { ...responsesRef.current[questionId], photoBase64: compressedBase64 }
          };
          setResponses(nextResponses);
          // Persist photo immediately
          persistProgress(nextResponses, commentRef.current);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [isLocked, persistProgress]);

  const handleToggleYesNo = useCallback((questionId: string, val: boolean, requiresPhoto: boolean) => {
    if (isLocked) return;
    
    const nextResponses = {
      ...responsesRef.current,
      [questionId]: { 
        ...responsesRef.current[questionId], 
        result: val,
        // Keep existing photo if toggling back and forth? Usually Yes opens camera.
        // If Yes is pressed, we want the camera to open.
        photoBase64: val === false ? undefined : responsesRef.current[questionId].photoBase64
      }
    };
    setResponses(nextResponses);
    
    // Persist basic result immediately
    persistProgress(nextResponses, commentRef.current);

    if (val === true && requiresPhoto) {
      setTimeout(() => handlePhotoCapture(questionId), 150);
    }
  }, [isLocked, handlePhotoCapture, persistProgress]);

  const handleCommentChange = (val: string) => {
    setComment(val);
    // Auto-save comment
    persistProgress(responses, val);
  };

  const handleSubmit = async () => {
    if (isLocked || !questionnaire) return;

    for (const q of questionnaire.questions) {
      const res = responses[q.id] as QuestionResponse | undefined;
      if (!res || res.result === null) {
        return alert(`Incomplete: Please audit ${q.productName}`);
      }
      if (q.requiresPhotoOnYes && res.result === true && !res.photoBase64) {
        return alert(`Photo Required: Evidence missing for ${q.productName}`);
      }
    }

    setIsSaving(true);
    const executionData = { responses: Object.values(responses) as QuestionResponse[], comment };

    try {
      await saveAssignmentExecution(assignmentId, { 
        executionData, 
        status: AssignmentStatus.PENDING_REVIEW,
        submittedAt: Date.now()
      });
      alert("Survey finalized and synced successfully.");
      onBack();
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !localAssignment || !questionnaire) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialising Survey Session</p>
      </div>
    );
  }

  const answeredCount = (Object.values(responses) as QuestionResponse[]).filter(r => r.result !== null).length;
  const isAllAnswered = answeredCount === questionnaire.questions.length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95 transition-all border border-slate-100">
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight italic">{questionnaire.title}</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-0.5">
              {localAssignment.storeName} • <span className="text-blue-600">{localAssignment.supplierName}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Audit Flow</span>
           <span className="text-[11px] font-black text-slate-400 mt-1">{answeredCount}/{questionnaire.questions.length} DONE</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
        <div className="space-y-4">
          {questionnaire.questions.map((q) => {
            const isExpanded = expandedIds.has(q.id);
            const response = responses[q.id] as QuestionResponse | undefined;
            const hasResponse = response?.result !== null;
            const hasPhoto = !!response?.photoBase64;

            return (
              <div key={q.id} className={`bg-white rounded-[2rem] border transition-all shadow-sm overflow-hidden ${hasResponse ? 'border-green-100' : 'border-slate-100'}`}>
                {/* Accordion Header */}
                <button 
                  onClick={() => toggleAccordion(q.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left active:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-inner transition-colors ${
                      hasResponse 
                        ? (response?.result === true ? (hasPhoto ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600') : 'bg-red-50 text-red-600')
                        : 'bg-slate-50 text-slate-300'
                    }`}>
                      <i className={`fa-solid ${
                        hasResponse 
                          ? (response?.result === true ? 'fa-check' : 'fa-xmark') 
                          : 'fa-circle-question'
                      }`}></i>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 tracking-tight leading-tight" style={{ fontSize: '15px' }}>
                        {q.productName}
                      </h3>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${hasResponse ? 'text-green-600' : 'text-slate-400'}`}>
                        {hasResponse ? 'Audited' : 'Awaiting Data'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasPhoto && (
                      <div className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-[10px]">
                        <i className="fa-solid fa-camera"></i>
                      </div>
                    )}
                    <i className={`fa-solid fa-chevron-down text-[10px] text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px bg-slate-50 mb-2" />
                    <p className="font-black text-slate-800 leading-tight" style={{ fontSize: '18px' }}>
                      {q.questionText}
                    </p>
                    
                    <div className="flex gap-3">
                      <button 
                        disabled={isLocked}
                        onClick={() => handleToggleYesNo(q.id, true, q.requiresPhotoOnYes)}
                        className={`flex-1 py-4 rounded-2xl font-black text-[11px] tracking-widest transition-all active:scale-95 border-2 ${response?.result === true ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-50 border-slate-50 text-slate-600'}`}
                      >
                        <i className="fa-solid fa-check mr-2"></i> YES
                      </button>
                      <button 
                        disabled={isLocked}
                        onClick={() => handleToggleYesNo(q.id, false, q.requiresPhotoOnYes)}
                        className={`flex-1 py-4 rounded-2xl font-black text-[11px] tracking-widest transition-all active:scale-95 border-2 ${response?.result === false ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                      >
                        <i className="fa-solid fa-xmark mr-2"></i> NO
                      </button>
                    </div>

                    {response?.photoBase64 && (
                      <div className="relative rounded-2xl overflow-hidden h-48 border border-slate-100 group shadow-inner">
                        <img src={response.photoBase64} className="w-full h-full object-cover" alt="Audit Evidence" />
                        <button 
                          onClick={() => handlePhotoCapture(q.id)}
                          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"
                        >
                          <i className="fa-solid fa-rotate"></i> Replace Photo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Auditor Commentary */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
           <label className="font-black uppercase tracking-widest ml-1 text-slate-900" style={{ fontSize: '13px' }}>Auditor Notes</label>
           <textarea 
             disabled={isLocked}
             value={comment}
             onChange={e => handleCommentChange(e.target.value)}
             rows={3}
             placeholder="Log final observations..."
             className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 font-medium outline-none shadow-inner"
             style={{ color: '#000', fontSize: '15px' }}
           />
        </div>
      </main>

      {!isLocked && (
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t safe-bottom flex flex-col gap-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-[60]">
          <div className="flex justify-between items-center px-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Progress</span>
             <span className={`text-[11px] font-black uppercase ${isAllAnswered ? 'text-green-600' : 'text-blue-600'}`}>
                {isAllAnswered ? 'Ready for Sync' : `${answeredCount}/${questionnaire.questions.length} Complete`}
             </span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className={`w-full py-5 rounded-[2rem] text-white font-black text-base uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isAllAnswered ? 'bg-blue-600' : 'bg-slate-900'}`}
          >
            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
            {isSaving ? 'Finalizing...' : 'Finalize Audit'}
          </button>
        </footer>
      )}
    </div>
  );
});

export default SurveyExecutionScreen;