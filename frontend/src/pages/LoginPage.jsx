import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

const LoginPage = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Mocking a successful login/auth
    setTimeout(() => {
      // Temporary mock user
      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        role: 'Admin',
        fullName: 'System Admin'
      };
      setUser(mockUser);
      setLoading(false);
      navigate('/admin');
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-dark rounded-3xl z-10 mx-4"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Join Sales RAG'}
          </h2>
          <p className="text-slate-400 mt-2">Enter your credentials to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                placeholder="name@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm text-slate-300 ml-1">Admin Secret Key (Optional)</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="Only for Admins"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all border-dashed"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold shadow-lg shadow-primary-900/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-400 ml-2 hover:underline font-medium"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
