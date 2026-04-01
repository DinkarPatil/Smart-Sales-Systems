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
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-midnight-900/50 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl group hover:border-accent-aurora/50 transition-all">
             <Key size={32} className="text-accent-aurora group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora italic">Override</span></h2>
          <p className="text-midnight-400 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Credentials Override Mode</p>
        </div>

        <div className="bg-midnight-950/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8 lg:p-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-aurora/50 to-transparent group-hover:via-accent-aurora transition-all duration-1000"></div>
          
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Reset Password
            </h3>
            <p className="text-midnight-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Enter your new password below</p>
          </div>

          <AnimatePresence mode="wait">
            {error && !success && (
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

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-accent-aurora/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-aurora/30">
                  <CheckCircle2 size={40} className="text-accent-aurora" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3 tracking-tight">Password Reset</h4>
                <p className="text-midnight-300 text-sm leading-relaxed mb-6">
                  Your password has been updated successfully.
                </p>
                <p className="text-accent-aurora text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Redirecting to login...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-400 ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                    <input 
                      type="password" 
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-midnight-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-accent-aurora/20 focus:bg-midnight-900 focus:border-accent-aurora/40 outline-none transition-all placeholder:text-midnight-700 text-sm font-medium text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-400 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-500" />
                    <input 
                      type="password" 
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-midnight-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-accent-aurora/20 focus:bg-midnight-900 focus:border-accent-aurora/40 outline-none transition-all placeholder:text-midnight-700 text-sm font-medium text-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading || !token}
                    className="group w-full py-4 bg-accent-primary hover:bg-accent-secondary rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] text-white shadow-xl shadow-accent-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Update Password
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-accent-aurora" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-midnight-400 hover:text-accent-aurora text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                  >
                    Cancel
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
