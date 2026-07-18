import React, { useState } from 'react';
import { useApp } from '../store';

const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (e) {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30">
          <i className="fa-solid fa-route text-2xl"></i>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">
            Sirius Field<span className="text-blue-500">.</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Field operations. Simplified.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. j.doe@sirius.com"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-[11px] font-bold p-3 text-center">{error}</div>}

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="mt-12 text-slate-600 text-[10px] font-black uppercase tracking-widest text-center px-6 leading-relaxed">
          Access level is assigned by your administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;