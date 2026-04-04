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
    <div className="fixed inset-0 w-full min-h-screen bg-amethyst-950 flex items-center justify-center p-6 overflow-hidden font-sans">
      {/* Deep Amethyst Ambient Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 rounded-full blur-[120px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-20"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-amethyst-900/50 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-amethyst-glow group hover:shadow-fuchsia-glow transition-all duration-500">
             <ShieldCheck size={32} className="text-accent-secondary group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Sales<span className="text-accent-primary italic">RAG</span></h2>
          <p className="text-slate-500 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Secure Enterprise Intelligence</p>
        </div>

        <div className="bg-amethyst-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8 lg:p-12 relative overflow-hidden">
          {/* Neon Top Bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50"></div>
          
          <div className="mb-10 text-center">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {isLogin ? 'Security Portal Access' : 'Create Access Token'}
            </h3>
            <p className="text-slate-500 text-[9px] mt-1.5 font-bold uppercase tracking-widest">Awaiting clearing signals...</p>
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
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
                  required
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pr-2">
                  <button 
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-accent-secondary/60 hover:text-accent-secondary text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
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
                    className="w-full bg-white/5 border-dashed border-white/20 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="group w-full py-4 bg-accent-primary hover:bg-accent-primary/90 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] text-white shadow-xl shadow-accent-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
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
              className="text-slate-500 hover:text-accent-secondary text-[9px] font-black uppercase tracking-[0.25em] transition-all cursor-pointer"
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
