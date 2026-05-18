"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle,
  Loader2,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { extractError } from "@/lib/api/client";

export function CompanyDetailModal({ company, onClose, onChanged }) {
  const [draft, setDraft] = useState({
    name: company.name,
    description: company.description || "",
    config: company.config || {},
  });
  const [current, setCurrent] = useState(company);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const updated = await adminApi.updateCompany(current.id, draft);
      setCurrent(updated);
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't save. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this company? All its products, queries, and history will be deleted too. This can't be undone."))
      return;
    try {
      setSubmitting(true);
      await adminApi.deleteCompany(current.id);
      onClose();
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't delete the company. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAdminSuspension = async () => {
    const action = current.admin_suspended ? "reactivate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} this company?`)) return;
    try {
      setSubmitting(true);
      const updated = await adminApi.updateCompany(current.id, {
        admin_suspended: !current.admin_suspended,
      });
      setCurrent({ ...current, admin_suspended: updated.admin_suspended });
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't update. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-5xl bg-amethyst-950 border border-white/10 rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-16 z-10 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[2rem] bg-amethyst-900 flex items-center justify-center text-accent-secondary border border-white/5 shadow-inner">
              <Building2 className="w-8 h-8 lg:w-10 lg:h-10" />
            </div>
            <div>
              <h3 className="text-2xl lg:text-4xl font-black text-white tracking-tighter italic flex items-center gap-4">
                {current.name}
                <span
                  className={`text-[10px] uppercase not-italic tracking-[0.3em] px-3 py-1 rounded-full border ${
                    current.is_active
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20"
                  }`}
                >
                  {current.is_active ? "Active" : "Suspended"}
                </span>
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
                  ID: <span className="text-accent-secondary italic">{current.id}</span>
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 lg:p-5 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all shadow-xl">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          {[
            { label: "Products", value: current.product_count || 0 },
            { label: "Team Members", value: current.user_count || 0 },
            { label: "Sales Reps", value: current.sales_rep_count || 0 },
            { label: "Tokens Used", value: `${((current.total_tokens || 0) / 1000).toFixed(1)}k` },
          ].map((s) => (
            <div key={s.label} className="p-6 bg-amethyst-900/60 border border-white/5 rounded-3xl shadow-inner">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">{s.label}</p>
              <p className="text-2xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Suspension (needs both Admin &amp; Manager)
            </label>
            <button
              onClick={handleToggleAdminSuspension}
              disabled={submitting}
              className={`w-full p-6 border rounded-[2rem] flex items-center justify-between transition-all ${
                current.admin_suspended
                  ? "bg-accent-secondary/10 border-accent-secondary/30"
                  : "bg-emerald-500/5 border-emerald-500/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    current.admin_suspended ? "bg-accent-secondary/20 text-accent-secondary" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {current.admin_suspended ? <ShieldAlert size={20} /> : <Shield size={20} />}
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">
                    Admin
                  </p>
                  <p
                    className={`text-[11px] font-black italic ${
                      current.admin_suspended ? "text-accent-secondary" : "text-emerald-400"
                    }`}
                  >
                    {current.admin_suspended ? "Suspended by admin" : "Active"}
                  </p>
                </div>
              </div>
              <div
                className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${
                  current.admin_suspended ? "bg-accent-secondary text-white" : "bg-amethyst-950 text-slate-500"
                }`}
              >
                {current.admin_suspended ? "Undo" : "Suspend"}
              </div>
            </button>

            <div
              className={`p-6 border rounded-[2rem] flex items-center justify-between transition-opacity ${
                current.manager_suspended
                  ? "bg-accent-secondary/10 border-accent-secondary/30"
                  : "bg-amethyst-950 border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    current.manager_suspended ? "bg-accent-secondary/20 text-accent-secondary" : "bg-amethyst-900 text-slate-600"
                  }`}
                >
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">
                    Manager
                  </p>
                  <p
                    className={`text-[11px] font-black italic ${
                      current.manager_suspended ? "text-accent-secondary" : "text-slate-500"
                    }`}
                  >
                    {current.manager_suspended ? "Suspended by manager" : "Waiting on manager"}
                  </p>
                </div>
              </div>
              <div
                className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex items-center gap-2 ${
                  current.manager_suspended
                    ? "bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30"
                    : "bg-white/5 text-slate-700"
                }`}
              >
                {current.manager_suspended ? (<><CheckCircle size={10} /> Done</>) : "Pending"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Usage
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-amethyst-950/60 border border-white/5 rounded-[2rem]">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">This Week</p>
                <p className="text-xl font-black text-white italic">
                  {current.weekly_tokens?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-6 bg-amethyst-950/60 border border-white/5 rounded-[2rem]">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">This Month</p>
                <p className="text-xl font-black text-white italic">
                  {current.monthly_tokens?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
            Description
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="What does this company do? Helps the AI answer questions."
            className="w-full h-32 bg-amethyst-950/40 border border-white/5 rounded-[2.5rem] py-6 px-8 focus:ring-4 focus:ring-accent-secondary/10 focus:border-accent-secondary/30 outline-none resize-none text-[13px] leading-relaxed font-medium text-slate-300 shadow-inner"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 pt-6 border-t border-white/5">
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="w-full sm:w-auto px-10 py-5 bg-amethyst-900 hover:bg-accent-secondary/10 border border-white/5 hover:border-accent-secondary/20 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent-secondary transition-all flex items-center justify-center gap-3"
          >
            <Trash2 size={16} /> Delete Company
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={submitting}
            className="w-full sm:w-auto px-12 py-5 bg-amethyst-gradient rounded-[2rem] text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-fuchsia-glow active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : (<><Sparkles size={18} /> Save Changes</>)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
