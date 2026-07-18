import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Store, Supplier, Questionnaire, AssignmentType, Assignment } from '../types';

const AssignSurveyScreen: React.FC = () => {
  const { user, createAssignment, removeAssignment } = useApp();
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  
  const [selectedTL, setSelectedTL] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [selectedType, setSelectedType] = useState<AssignmentType>(AssignmentType.PROJECT);
  const [forceVisible, setForceVisible] = useState(false);
  const [briefMessage, setBriefMessage] = useState('');
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [isValidMapping, setIsValidMapping] = useState(true);

  const teamLeaders = [
    { id: 'tl1', name: 'Marc TL' },
    { id: 'tl2', name: 'Sarah TL' },
    { id: 'tl3', name: 'James TL' }
  ];

  const loadAssignments = async () => {
    if (!user) return;
    const all = await api.getAllAssignments(user);
    setActiveAssignments(all);
  };

  useEffect(() => {
    const load = async () => {
      const [sData, supData] = await Promise.all([
        api.getStores(),
        api.getSuppliers()
      ]);
      setStores(sData);
      setSuppliers(supData);
      await loadAssignments();
    };
    load();
  }, [user]);

  useEffect(() => {
    const fetchQuests = async () => {
      if (selectedSupplier) {
        const q = await api.getQuestionnairesBySupplier(selectedSupplier);
        setQuestionnaires(q);
        setSelectedSurvey('');
      } else {
        setQuestionnaires([]);
      }
    };
    fetchQuests();
  }, [selectedSupplier]);

  useEffect(() => {
    const checkMap = async () => {
      if (selectedStore && selectedSupplier) {
        const valid = await api.isSupplierAtStore(selectedStore, selectedSupplier);
        setIsValidMapping(valid);
      } else {
        setIsValidMapping(true);
      }
    };
    checkMap();
  }, [selectedStore, selectedSupplier]);

  const handleAssign = async () => {
    if (!selectedTL || !selectedSurvey || !selectedStore || !selectedSupplier || !user) {
      alert("Incomplete fields detected.");
      return;
    }

    if (!isValidMapping && !forceVisible) {
      alert("Constraint Error: This supplier is not listed at the selected store. Enable 'Override' to bypass.");
      return;
    }
    
    setIsAssigning(true);
    
    const tlName = teamLeaders.find(t => t.id === selectedTL)?.name || 'Unknown';
    const storeObj = stores.find(s => s.id === selectedStore);
    const supObj = suppliers.find(s => s.id === selectedSupplier);
    const questObj = questionnaires.find(q => q.id === selectedSurvey);

    const assignment = {
      teamLeaderId: selectedTL,
      teamLeaderName: tlName,
      storeId: selectedStore,
      storeName: storeObj?.name || 'Unknown',
      supplierId: selectedSupplier,
      supplierName: supObj?.name || 'Unknown',
      surveyId: selectedSurvey,
      surveyName: questObj?.title || 'Unknown',
      assignmentType: selectedType,
      forceVisible,
      briefMessage: briefMessage.trim(),
      assignedBy: user?.id,
      timestamp: Date.now()
    };

    try {
      await createAssignment(assignment);
      await loadAssignments();
      setIsAssigning(false);
      alert(`Success: Survey assigned to ${tlName}. Status synced.`);
      setSelectedTL('');
      setSelectedStore('');
      setSelectedSupplier('');
      setSelectedSurvey('');
      setBriefMessage('');
    } catch (err: any) {
      alert("Assignment failed: " + err.message);
      setIsAssigning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently remove this assignment? The Field Auditor will lose access immediately.")) {
      await removeAssignment(id);
      await loadAssignments();
    }
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full pb-32">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tighter italic" style={{ color: '#000' }}>Assign Survey<span className="text-blue-600">.</span></h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#000' }}>Operations Control Center</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-6">
        {/* TL Picker */}
        <div className="space-y-2">
          <label className="font-black uppercase tracking-widest ml-1" style={{ color: '#000', fontSize: '16px' }}>Team Leader</label>
          <select 
            value={selectedTL}
            onChange={(e) => setSelectedTL(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none appearance-none"
            style={{ color: '#000' }}
          >
            <option value="" disabled>Select Recipient</option>
            {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
          </select>
        </div>

        {/* Store Picker */}
        <div className="space-y-2">
          <label className="font-black uppercase tracking-widest ml-1" style={{ color: '#000', fontSize: '16px' }}>Store Node</label>
          <select 
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none"
            style={{ color: '#000' }}
          >
            <option value="" disabled>Select Store</option>
            {stores.map(st => <option key={st.id} value={st.id}>{st.name} ({st.region})</option>)}
          </select>
        </div>

        {/* Supplier Picker */}
        <div className="space-y-2">
          <label className="font-black uppercase tracking-widest ml-1" style={{ color: '#000', fontSize: '16px' }}>Supplier Portfolio</label>
          <select 
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className={`w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 text-sm font-bold outline-none ${!isValidMapping ? 'border-red-100 bg-red-50/50' : 'border-slate-50'}`}
            style={{ color: '#000' }}
          >
            <option value="" disabled>Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {!isValidMapping && (
            <p className="text-[11px] text-red-500 font-black uppercase mt-1 ml-1 tracking-tighter">
               <i className="fa-solid fa-triangle-exclamation mr-1"></i> Supplier is not listed at this store node.
            </p>
          )}
        </div>

        {/* Survey Picker */}
        <div className="space-y-2">
          <label className="font-black uppercase tracking-widest ml-1" style={{ color: '#000', fontSize: '16px' }}>Master Survey</label>
          <select 
            disabled={!selectedSupplier}
            value={selectedSurvey}
            onChange={(e) => setSelectedSurvey(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none disabled:opacity-30"
            style={{ color: '#000' }}
          >
            <option value="" disabled>Select Survey</option>
            {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>

        {/* Brief Input */}
        <div className="space-y-2">
          <label className="font-black uppercase tracking-widest ml-1" style={{ color: '#000', fontSize: '16px' }}>Field Brief / Instructions</label>
          <textarea 
            value={briefMessage}
            onChange={(e) => setBriefMessage(e.target.value)}
            placeholder="e.g. Ensure all gondola ends are photographed."
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-sm font-medium focus:border-blue-500/20 transition-all outline-none"
            rows={3}
            style={{ color: '#000', fontSize: '16px' }}
          />
        </div>

        {/* Assignment Type */}
        <div className="space-y-2">
           <label className="font-black uppercase tracking-widest ml-1" style={{ color: '#000', fontSize: '16px' }}>Priority Strategy</label>
           <div className="grid grid-cols-3 gap-2">
              {[AssignmentType.ROUTE, AssignmentType.PROJECT, AssignmentType.URGENT].map(type => (
                <button
                   key={type}
                   onClick={() => setSelectedType(type)}
                   className={`py-3 rounded-xl font-black uppercase tracking-widest border-2 transition-all ${selectedType === type ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 border-slate-50'}`}
                   style={{ fontSize: '11px', color: '#000' }}
                >
                   {type}
                </button>
              ))}
           </div>
        </div>

        {/* Override Toggle */}
        <div className="flex items-center justify-between px-2 bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs shadow-inner ${forceVisible ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
              <i className={`fa-solid ${forceVisible ? 'fa-bolt-lightning' : 'fa-shield-check'}`}></i>
            </div>
            <div>
              <p className="font-black uppercase leading-none mb-1" style={{ color: '#000', fontSize: '13px' }}>Constraint Override</p>
              <p className="font-bold uppercase tracking-tighter" style={{ color: '#000', fontSize: '10px' }}>Bypass Validation Rules</p>
            </div>
          </div>
          <button 
            onClick={() => setForceVisible(!forceVisible)}
            className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${forceVisible ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-slate-200'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${forceVisible ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <button 
          onClick={handleAssign}
          disabled={isAssigning}
          className="w-full bg-slate-900 py-6 rounded-[2.5rem] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 text-white"
          style={{ fontSize: '18px' }}
        >
          {isAssigning ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-plus-circle"></i>}
          {isAssigning ? 'COMMITTING NODE...' : 'CREATE ASSIGNMENT'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black tracking-tighter italic" style={{ color: '#000' }}>Active Pipeline<span className="text-blue-600">.</span></h3>
        <div className="space-y-3">
           {activeAssignments.map(a => (
             <div key={a.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{a.teamLeaderName}</span>
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{a.assignmentType}</span>
                  </div>
                  <h4 className="font-black text-slate-800 leading-none">{a.surveyName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">@ {a.storeName}</p>
               </div>
               <button 
                 onClick={() => handleDelete(a.id)}
                 className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100"
               >
                 <i className="fa-solid fa-trash-can text-xs"></i>
               </button>
             </div>
           ))}
           {activeAssignments.length === 0 && (
             <p className="text-xs text-slate-400 italic text-center py-10">No active survey assignments detected.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default AssignSurveyScreen;