"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api/auth";
import { extractError } from "@/lib/api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [adminSecret, setAdminSecret] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await authApi.register({ email, password, fullName, adminSecret });
        setIsLogin(true);
        setError("Account created. An admin needs to approve you before you can sign in.");
      }
    } catch (err) {
      setError(extractError(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen bg-amethyst-950 flex items-center justify-center p-6 overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 rounded-full blur-[120px] animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-20"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-amethyst-900/50 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-amethyst-glow">
            <ShieldCheck size={32} className="text-accent-secondary" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Sales<span className="text-accent-primary italic">RAG</span>
          </h2>
          <p className="text-slate-500 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">
            Smart sales dashboard
          </p>
        </div>

        <div className="bg-amethyst-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50" />

          <div className="mb-10 text-center">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h3>
            <p className="text-slate-500 text-[9px] mt-1.5 font-bold uppercase tracking-widest">
              {isLogin ? "Sign in to continue" : "Sign up to get started"}
            </p>
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
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
                  required
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pr-2">
                  <Link
                    href="/forgot-password"
                    className="text-accent-secondary/60 hover:text-accent-secondary text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Admin Code (optional)
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Leave blank if you don't have one"
                    className="w-full bg-white/5 border-dashed border-white/20 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-accent-primary/20 focus:bg-white/10 focus:border-accent-primary/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium text-white"
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group w-full py-4 bg-accent-primary hover:bg-accent-primary/90 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] text-white shadow-xl shadow-accent-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-slate-500 hover:text-accent-secondary text-[9px] font-black uppercase tracking-[0.25em] transition-all"
            >
              {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300/60">
          Version 2.1.0
        </div>
      </motion.div>
    </div>
  );
}
