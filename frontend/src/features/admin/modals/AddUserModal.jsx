"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Users, X } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { extractError } from "@/lib/api/client";

export function AddUserModal({ companies, onClose, onCreated }) {
  const [data, setData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "SalesRep",
    company_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminApi.createUser(data);
      await onCreated();
    } catch (err) {
      alert(extractError(err, "Couldn't create the user. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl bg-amethyst-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient" />
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
              <Users size={32} />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight italic">
              New <span className="text-accent-primary">User</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-4 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
                Full Name
              </label>
              <input
                required
                autoFocus
                value={data.full_name}
                onChange={(e) => setData({ ...data, full_name: e.target.value })}
                placeholder="Jane Smith"
                className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
                Email Address
              </label>
              <input
                required
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="jane@company.com"
                className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Password
            </label>
            <input
              required
              type="password"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
                Role
              </label>
              <select
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-[10px] font-black uppercase tracking-widest text-white shadow-inner cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Owner">Owner</option>
                <option value="SalesRep">SalesRep</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
                Company
              </label>
              <select
                required
                value={data.company_id}
                onChange={(e) => setData({ ...data, company_id: e.target.value })}
                className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-[10px] font-black uppercase tracking-widest text-white shadow-inner cursor-pointer"
              >
                <option value="">Choose a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-amethyst-gradient rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] text-white shadow-amethyst-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" /> : (<><CheckCircle size={18} /> Create User</>)}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
