import React from 'react';
import { useApp } from '../store';
import { UserRole } from '../types';
import { DEV_MODE_ENABLED } from '../api';

const SettingsScreen: React.FC = () => {
  const { user, logout, roleOverride, setRoleOverride } = useApp();

  if (!user) return null;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full pb-32">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tighter italic" style={{ color: '#000' }}>Account Settings<span className="text-blue-600">.</span></h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#000' }}>User Profile & Preferences</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-user"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{user.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {roleOverride ? `Overridden as ${roleOverride.replace('_', ' ')}` : user.role.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50 flex flex-col gap-4">
           <button 
             onClick={() => logout()}
             className="w-full bg-red-50 text-red-600 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             <i className="fa-solid fa-right-from-bracket"></i>
             Sign Out of Session
           </button>
        </div>
      </div>

      {DEV_MODE_ENABLED && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-slate-900 flex items-center justify-center text-sm shadow-lg shadow-yellow-400/20">
              <i className="fa-solid fa-bug"></i>
            </div>
            <div>
              <h4 className="text-yellow-400 font-black uppercase text-[10px] tracking-widest leading-none mb-1">Developer Tools</h4>
              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest leading-none">Internal Role Overrides</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 gap-2">
              {[UserRole.ADMIN, UserRole.TEAM_LEADER, UserRole.FIELD_REP].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleOverride(role === roleOverride ? null : role)}
                  className={`w-full py-4 px-6 rounded-2xl text-left text-[11px] font-black uppercase tracking-widest transition-all border ${
                    roleOverride === role 
                      ? 'bg-yellow-400 text-slate-900 border-yellow-400 shadow-xl shadow-yellow-400/10' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{role.replace('_', ' ')}</span>
                    {roleOverride === role && <i className="fa-solid fa-check"></i>}
                  </div>
                </button>
              ))}
            </div>

            {roleOverride && (
              <button
                onClick={() => setRoleOverride(null)}
                className="w-full py-3 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors bg-red-400/10 rounded-2xl border border-red-400/20"
              >
                Clear Role Override
              </button>
            )}

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest leading-relaxed text-center">
                This feature is for development only. Role overrides are stored locally and do not affect backend permissions or token validity.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-8 opacity-20">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Sirius Field Ops v2.1.4</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Platform Engine Ready</p>
      </div>
    </div>
  );
};

export default SettingsScreen;