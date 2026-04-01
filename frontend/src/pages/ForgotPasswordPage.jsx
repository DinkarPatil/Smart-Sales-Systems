import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
          <h2 className="text-3xl font-black text-white tracking-tight">Sales<span className="text-aurora italic">RAG</span> Interface</h2>
          <p className="text-midnight-400 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Reset your password</p>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-aurora/50 to-transparent group-hover:via-accent-aurora transition-all duration-1000"></div>
          
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold text-white tracking-tight">
               Forgot Password
            </h3>
            <p className="text-midnight-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Enter your email to receive a reset link...</p>
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

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-accent-aurora/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-aurora/30">
                  <CheckCircle2 size={40} className="text-accent-aurora" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3 tracking-tight">Email Sent</h4>
                <p className="text-midnight-200 text-sm leading-relaxed mb-10">
                  A verification link has been sent to your email address. Please check your inbox.
                </p>
                <button 
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 text-accent-aurora font-black text-[10px] uppercase tracking-[0.3em] hover:gap-3 transition-all"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              </motion.div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span>Send Reset Link</span>
                        <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="mt-10 text-center pt-8 border-t border-white/5">
                    <Link 
                      to="/login"
                      className="text-midnight-400 hover:text-accent-aurora text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={14} />
                      Back to Login
                    </Link>
                  </div>
                </form>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );

};

export default ForgotPasswordPage;
