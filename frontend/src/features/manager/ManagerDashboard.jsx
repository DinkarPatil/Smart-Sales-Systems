"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Database,
  Loader2,
  MessageSquare,
  MoreVertical,
  Search,
  Users,
} from "lucide-react";
import { managerApi } from "@/lib/api/manager";
import { extractError } from "@/lib/api/client";
import { useManagerData } from "./hooks/useManagerData";

export function ManagerDashboard() {
  const { stats, team, queries, companyStatus, loading, refetch } = useManagerData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssign = async (queryId, repId) => {
    try {
      setIsAssigning(true);
      await managerApi.assignQuery(queryId, repId);
      await refetch();
    } catch (err) {
      alert(extractError(err, "Couldn't assign the query. Please try again."));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleToggleSuspension = async () => {
    const action = companyStatus.manager_suspended ? "reactivate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} ${companyStatus.name}?`))
      return;
    try {
      setIsSubmitting(true);
      await managerApi.toggleSuspension();
      await refetch();
    } catch (err) {
      alert(extractError(err, "Couldn't update. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQueries = queries.filter((q) =>
    q.query_text?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
          Loading your dashboard...
        </p>
      </div>
    );

  const resolutionRate = stats.total_queries
    ? Math.round((stats.resolved_queries / stats.total_queries) * 100)
    : 0;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse shadow-fuchsia-glow" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              Manager
            </span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
            Team{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Dashboard
            </span>
          </h2>
          <p className="text-slate-400 font-medium">
            Manage queries and assign them to your team
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
          <div
            className={`px-6 py-4 rounded-2xl border flex items-center gap-6 shadow-xl transition-all ${
              !companyStatus.is_active
                ? "bg-accent-secondary/10 border-accent-secondary/30"
                : "bg-amethyst-900/60 border-white/5"
            }`}
          >
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Suspension Status
              </p>
              <div className="flex gap-1.5 items-center justify-center">
                <div
                  className={`w-2.5 h-1 rounded-full ${
                    companyStatus.admin_suspended ? "bg-accent-secondary" : "bg-emerald-500"
                  }`}
                />
                <div
                  className={`w-2.5 h-1 rounded-full ${
                    companyStatus.manager_suspended ? "bg-accent-secondary shadow-fuchsia-glow" : "bg-emerald-500"
                  }`}
                />
              </div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <button
              onClick={handleToggleSuspension}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                companyStatus.manager_suspended
                  ? "bg-accent-secondary text-white shadow-fuchsia-glow hover:scale-105"
                  : "bg-amethyst-950 text-slate-500 hover:text-white hover:bg-amethyst-900"
              }`}
            >
              {companyStatus.manager_suspended ? "Reactivate" : "Suspend"}
            </button>
          </div>

          <div className="px-8 py-4 bg-amethyst-900/60 border border-white/5 rounded-2xl flex items-center gap-6 shadow-xl">
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Customer Sentiment
              </p>
              <p
                className={`text-xl font-black tracking-tighter ${
                  stats.sentiment_score > 70 ? "text-emerald-400" : "text-accent-secondary"
                }`}
              >
                {stats.sentiment_score}%
              </p>
            </div>
            <div className="w-[1px] h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Active Team
              </p>
              <p className="text-xl font-black text-white tracking-tighter">
                {stats.active_sales_reps}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Total Queries", val: stats.total_queries, icon: MessageSquare, sub: "All time" },
          {
            label: "Resolved",
            val: `${resolutionRate}%`,
            icon: CheckCircle,
            sub: `${stats.resolved_queries} resolved`,
          },
          {
            label: "Unassigned",
            val: queries.filter((q) => !q.sales_rep_id).length,
            icon: AlertCircle,
            sub: "Needs to be assigned",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-amethyst-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 hover:border-accent-secondary/30 transition-all shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-amethyst-950 rounded-2xl border border-white/5 text-accent-secondary">
                <stat.icon size={24} />
              </div>
              <MoreVertical size={18} className="text-slate-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">
              {stat.label}
            </p>
            <p className="text-4xl font-black text-white tracking-tighter mb-2">{stat.val}</p>
            <p className="text-[10px] font-bold text-slate-600 italic tracking-wide">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-12 2xl:col-span-4 flex flex-col space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Users size={24} className="text-accent-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white italic">
              Your Team
            </h3>
          </div>

          <div className="space-y-6">
            {team.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-amethyst-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2rem] hover:border-accent-primary/40 transition-all shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amethyst-950 border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-inner">
                      {member.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{member.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      member.is_active ? "bg-emerald-500 shadow-emerald-glow" : "bg-slate-700"
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-amethyst-950/60 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Active</p>
                    <p className="text-base font-black text-white">{member.active_queries || 0}</p>
                  </div>
                  <div className="p-3 bg-amethyst-950/60 rounded-xl border border-white/5 text-accent-secondary">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Resolved</p>
                    <p className="text-base font-black">{member.resolved_queries || 0}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-12 2xl:col-span-8 flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent-secondary/10 rounded-lg">
                <Database size={24} className="text-accent-secondary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white italic">
                All Queries
              </h3>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-amethyst-950/40 border border-white/5 rounded-[2rem] py-4 pl-14 pr-8 text-xs text-white focus:ring-4 focus:ring-accent-secondary/10 transition-all outline-none w-[350px] shadow-2xl"
              />
            </div>
          </div>

          <div className="bg-amethyst-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amethyst-950/60 border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      From
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Question
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Assigned To
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredQueries.map((query) => (
                    <tr key={query.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-[11px] font-black text-white">{query.complainant_email}</p>
                        <p className="text-[9px] font-bold text-slate-600 tracking-wider">
                          #{query.complaint_id}
                        </p>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
                          &ldquo;{query.query_text}&rdquo;
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <select
                            value={query.sales_rep_id || ""}
                            onChange={(e) => handleAssign(query.id, e.target.value)}
                            disabled={isAssigning}
                            className="bg-amethyst-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 rounded-xl outline-none focus:border-accent-primary focus:text-accent-primary transition-all shadow-inner"
                          >
                            <option value="">Not assigned</option>
                            {team.map((rep) => (
                              <option key={rep.id} value={rep.id}>
                                {rep.full_name}
                              </option>
                            ))}
                          </select>
                          {query.sales_rep_id && <CheckCircle size={14} className="text-emerald-500" />}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span
                          className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                            query.status === "Resolved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20"
                          }`}
                        >
                          {query.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
