"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, Sparkles, X } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { extractError } from "@/lib/api/client";

export function AddCompanyModal({ onClose, onCreated }) {
  const [data, setData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.name) return;
    try {
      setSubmitting(true);
      await adminApi.createCompany(data);
      await onCreated();
    } catch (err) {
      alert(extractError(err, "Couldn't create the company. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-amethyst-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient" />
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
              <Building2 size={32} />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight italic">
              New <span className="text-accent-primary">Company</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-4 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Company Name
            </label>
            <input
              required
              autoFocus
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 outline-none placeholder:text-slate-700 text-base font-bold text-white shadow-inner"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="What does this company do?"
              className="w-full h-32 bg-amethyst-900 border border-white/5 rounded-[2rem] py-6 px-8 focus:ring-4 focus:ring-accent-primary/10 outline-none resize-none text-sm leading-relaxed font-medium text-slate-400 shadow-inner"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-6 bg-amethyst-gradient rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-fuchsia-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" /> : (<><Sparkles size={20} /> Save Company</>)}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
