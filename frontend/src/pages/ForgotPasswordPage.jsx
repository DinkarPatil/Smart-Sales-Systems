import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const API_BASE = 'http://127.0.0.1:8000/api/v1/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/password-recovery/${email}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Recovery request failure');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen bg-[#020617] flex items-center justify-center p-6 overflow-hidden font-sans relative">
      {/* Soft Background Accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-accent-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-accent-secondary/20 rounded-full blur-[100px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-20"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amethyst-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
             <ShieldCheck size={30} className="text-accent-secondary" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sales<span className="text-accent-secondary italic">RAG</span> Interface</h2>
          <p className="text-slate-500 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Recovery Protocol Active</p>
        </div>

        <div className="bg-amethyst-950/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amethyst-gradient"></div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Access Recovery
            </h3>
            <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">Identify your node for credentials reset...</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-emerald-glow">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2 italic">Instructions Dispatched</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  A verification link has been sent to your registered terminal. Please check your clearing inbox.
                </p>
                <button 
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 text-accent-secondary font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Return to Portal
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Enterprise Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-amethyst-900/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-accent-secondary/10 focus:bg-amethyst-900 focus:border-accent-secondary/30 outline-none transition-all text-sm font-bold text-white placeholder:text-slate-600 shadow-inner"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="group w-full py-4 bg-amethyst-gradient rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] text-white shadow-fuchsia-glow transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Initialize Reset
                      <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-slate-500 hover:text-accent-secondary text-[9px] font-black uppercase tracking-[0.25em] transition-all"
                  >
                    Cancel Recovery Operation
                  </button>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
