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
    <div className="fixed inset-0 w-full min-h-screen bg-midnight-950 flex items-center justify-center p-6 overflow-hidden font-sans">
      {/* Aurora Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-aurora/10 rounded-full blur-[120px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-20"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-midnight-900/50 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl group hover:border-accent-aurora/50 transition-all">
             <ShieldCheck size={32} className="text-accent-aurora group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Sales<span className="text-aurora italic">RAG</span></h2>
          <p className="text-midnight-400 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Your Intelligent Sales Assistant</p>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden group">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-aurora/50 to-transparent group-hover:via-accent-aurora transition-all duration-1000"></div>
          
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Login' : 'Sign Up'}
            </h3>
            <p className="text-midnight-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Sign in to continue to your dashboard</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-400 ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                  <input 
                    type="text" 
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                <input 
                  type="email" 
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                <input 
                  type="password" 
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-12"
                  required
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pr-2">
                  <button 
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-accent-aurora/60 hover:text-accent-aurora text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-400 ml-1">Admin Secret Key</label>
                <div className="relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                  <input 
                    type="password" 
                    value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                    placeholder="Enter secret key"
                    className="input-field pl-12 border-dashed border-white/10"
                  />
                </div>
              </div>
            )}

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-white/5">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-midnight-400 hover:text-accent-aurora text-[10px] font-black uppercase tracking-[0.3em] transition-all cursor-pointer"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">
          Midnight & Aurora v2.0 • Secured Data Node
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

