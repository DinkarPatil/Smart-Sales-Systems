"use client";

import { motion } from "framer-motion";
import { Building2, ChevronRight, Plus, Search, Shield, Users } from "lucide-react";

export function EntitiesView({
  companies,
  companySearch,
  setCompanySearch,
  onAddCompany,
  onOpenCompany,
  onManageTeam,
}) {
  const filtered = companies.filter(
    (c) =>
      c.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.id?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.manager_name?.toLowerCase().includes(companySearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent-primary/10 rounded-lg">
            <Building2 size={24} className="text-accent-primary" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white">Companies</h3>
        </div>
        <div className="relative flex-1 max-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search companies..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            className="w-full bg-amethyst-950/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
          />
        </div>
        <button
          onClick={onAddCompany}
          className="px-6 py-3 bg-amethyst-gradient rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-amethyst-glow hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Add Company
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((company) => (
          <motion.div
            layout
            key={company.id}
            onClick={() => onOpenCompany(company)}
            className="bg-amethyst-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 group hover:border-accent-secondary/30 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amethyst-950 border border-white/5 rounded-2xl flex items-center justify-center text-accent-secondary shadow-inner">
                  <Building2 size={28} />
                </div>
                <div>
                  <p className="text-xl font-black text-white italic group-hover:text-accent-secondary transition-colors">
                    {company.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Manager:</span>
                    <span
                      className={`text-[10px] font-bold ${
                        company.manager_name === "Unassigned" ? "text-rose-500/60" : "text-accent-primary"
                      }`}
                    >
                      {company.manager_name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amethyst-950 rounded-xl border border-white/5 text-slate-600 group-hover:bg-accent-secondary group-hover:text-amethyst-950 transition-all">
                <ChevronRight size={18} />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-6 lg:mt-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
              <div className="flex flex-col gap-1 p-3 bg-amethyst-950/40 rounded-xl border border-white/5">
                <span>This Week</span>
                <span className="text-sm font-black text-accent-secondary">
                  {company.weekly_tokens?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-amethyst-950/40 rounded-xl border border-white/5">
                <span>This Month</span>
                <span className="text-sm font-black text-accent-secondary">
                  {company.monthly_tokens?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-amethyst-950/40 rounded-xl border border-white/5 col-span-2 lg:col-span-1">
                <span>All Time</span>
                <span className="text-sm font-black text-accent-primary">
                  {company.total_tokens?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-amethyst-950/40 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">
                  Sales Reps
                </p>
                <p className="text-lg font-black text-white">{company.sales_rep_count || 0}</p>
              </div>
              <div className="p-4 bg-amethyst-950/40 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Total Team</p>
                <p className="text-lg font-black text-white">{company.user_count || 0}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amethyst-950 rounded-lg border border-white/5">
                  <Shield size={12} className="text-accent-primary" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                  Admin Tools
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManageTeam(company.name);
                }}
                className="px-4 py-2 bg-amethyst-950 hover:bg-accent-primary/10 border border-white/5 hover:border-accent-primary/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-accent-primary transition-all flex items-center gap-2 shadow-inner"
              >
                Manage Team <Users size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
