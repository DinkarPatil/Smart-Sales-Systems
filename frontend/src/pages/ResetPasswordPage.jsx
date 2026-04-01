import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, Key } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const API_BASE = 'http://127.0.0.1:8000/api/v1/auth';

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing security token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Password tokens do not match');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Reset operation failed');
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden font-sans">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary-100/40 rounded-full blur-[80px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/30 rounded-full blur-[80px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-20"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
             <Key size={30} className="text-primary-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access <span className="text-primary-600 italic">Override</span></h2>
          <p className="text-slate-500 mt-1 text-[10px] font-black uppercase tracking-[0.3em]">Credentials Override Mode</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-elevated p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-indigo-500 to-primary-600"></div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Reset Security Key
            </h3>
            <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Override existing access protocols...</p>
          </div>

          <AnimatePresence mode="wait">
            {error && !success && (
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

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Protocol Updated</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  Credentials have been successfully overwritten.
                </p>
                <p className="text-primary-600 text-[9px] font-black uppercase tracking-[0.25em] animate-pulse">Redirecting to Authorization Portal...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Protocol Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="New Security Protocol"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Verify Override</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Security Protocol"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading || !token}
                    className="group w-full py-4 bg-primary-600 hover:bg-primary-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] text-white shadow-lg shadow-primary-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Overwrite Credentials
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-slate-400 hover:text-primary-600 text-[9px] font-black uppercase tracking-[0.25em] transition-all"
                  >
                    Abort Override Request
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

export default ResetPasswordPage;
