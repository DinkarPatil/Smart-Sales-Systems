import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Loader2, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  const API_BASE = 'http://127.0.0.1:8000/api/v1/auth';

  const fetchUserData = async (token) => {
    const response = await fetch(`${API_BASE}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Authorization sequence failure');
    return await response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Incorrect credentials');
        }

        const { access_token } = await response.json();
        localStorage.setItem('token', access_token);
        
        const userData = await fetchUserData(access_token);
        setUser(userData);

        const roleRedirects = {
          'Admin': '/admin',
          'Manager': '/manager',
          'Owner': '/owner',
          'SalesRep': '/sales'
        };
        navigate(roleRedirects[userData.role] || '/login');
      } else {
        const response = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            admin_secret_key: adminSecret || null
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Registration encountered an error');
        }

        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden font-sans">
      {/* Soft Background Accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary-100/40 rounded-full blur-[80px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/30 rounded-full blur-[80px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-20"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft group hover:shadow-elevated transition-all">
             <ShieldCheck size={30} className="text-primary-600 group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sales<span className="text-primary-600 italic">RAG</span> Interface</h2>
          <p className="text-slate-500 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Secure Enterprise Intelligence</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-elevated p-8 lg:p-10 relative overflow-hidden">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-indigo-500 to-primary-600"></div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isLogin ? 'Security Portal Access' : 'Create Access Token'}
            </h3>
            <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Awaiting clearing signals...</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
              >
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Legal Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Enter Profile Name"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Enterprise Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Access Protocol</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  required
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pr-2">
                  <button 
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-primary-600/60 hover:text-primary-600 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Recover Access Credentials
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Admin Validation Secret</label>
                <div className="relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                    placeholder="Enter Security Secret"
                    className="w-full bg-slate-50/50 border-dashed border-slate-300 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="group w-full py-4 bg-primary-600 hover:bg-primary-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] text-white shadow-lg shadow-primary-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {isLogin ? 'Grant Access' : 'Initialize Profile'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-50">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-primary-600 text-[9px] font-black uppercase tracking-[0.25em] transition-all cursor-pointer"
            >
              {isLogin ? "Requirement: New Clearance" : "Existing Credentials Match"}
            </button>
          </div>
        </div>

        <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300/60">
          Secure Node 2.0.4 • 2026-03-31
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
