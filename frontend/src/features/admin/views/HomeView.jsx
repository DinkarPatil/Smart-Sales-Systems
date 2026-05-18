"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  ChevronRight,
  Globe,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

export function HomeView({
  stats,
  users,
  companies,
  auditLogs,
  neuralStats,
  auditSearch,
  setAuditSearch,
  onClickPending,
}) {
  const filteredLogs = auditLogs.filter(
    (l) =>
      l.event?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.actor?.toLowerCase().includes(auditSearch.toLowerCase()),
  );

  const tokenK = (companies.reduce((sum, c) => sum + (c.total_tokens || 0), 0) / 1000).toFixed(1);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-amethyst-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3.5rem] p-6 lg:p-12 flex flex-col justify-between min-h-[320px] lg:min-h-[420px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
              <span className="px-3 lg:px-4 py-1 lg:py-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/20">
                Online
              </span>
              <div className="hidden sm:block h-[1px] w-8 lg:w-12 bg-white/10" />
              <span className="text-slate-600 font-mono text-[8px] lg:text-[9px] tracking-widest">
                v2.4.0
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tighter italic mb-4 lg:mb-8">
              Welcome <span className="text-accent-secondary">back</span>
            </h3>
            <p className="text-slate-300 font-medium max-w-xl leading-relaxed lg:leading-loose text-xs lg:text-[15px]">
              Everything is running smoothly. Here's a quick look at what's happening across your platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-6 mt-8 lg:mt-12 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Everything is up to date
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amethyst-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-10 flex lg:flex-col items-center lg:justify-center gap-6 lg:gap-10">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-xl lg:rounded-[2rem] bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
              <Settings className="w-8 h-8 lg:w-10 lg:h-10" />
            </div>
            <div>
              <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1 lg:mb-2 text-nowrap">
                System Status
              </p>
              <h4 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter">All Good</h4>
            </div>
          </div>

          <div className="hidden lg:block space-y-6 w-full">
            {[
              {
                label: "AI Models",
                value: neuralStats?.active_models?.join(" • ") || "—",
                color: "text-sky-400",
              },
              { label: "Response Time", value: `${neuralStats?.avg_latency_ms ?? "—"}ms`, color: "text-emerald-400" },
              { label: "Server Load", value: neuralStats?.node_load || "—", color: "text-accent-secondary" },
            ].map((m) => (
              <div key={m.label} className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {m.label}
                </span>
                <span className={`text-[12px] font-black uppercase tracking-widest ${m.color}`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {[
          { label: "Users", value: stats.total_users, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10" },
          {
            label: "Awaiting Approval",
            value: users.filter((u) => !u.is_active).length,
            icon: ShieldAlert,
            color: "text-accent-secondary",
            bg: "bg-accent-secondary/10",
            alert: users.some((u) => !u.is_active),
            onClick: onClickPending,
          },
          { label: "Companies", value: stats.total_companies, icon: Building2, color: "text-accent-primary", bg: "bg-accent-primary/10" },
          { label: "Total Queries", value: stats.total_queries, icon: Sparkles, color: "text-accent-secondary", bg: "bg-accent-secondary/10" },
          { label: "Tokens Used", value: `${tokenK}k`, icon: Globe, color: "text-sky-400", bg: "bg-sky-500/10" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={item.onClick}
            className={`bg-amethyst-900/20 backdrop-blur-xl p-5 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border transition-all flex items-center justify-between group shadow-xl ${
              item.onClick ? "cursor-pointer" : ""
            } ${item.alert ? "border-accent-secondary/30" : "border-white/5 hover:border-white/10"}`}
          >
            <div>
              <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1 lg:mb-2">
                {item.label}
              </p>
              <p
                className={`text-xl lg:text-3xl font-black tracking-tighter transition-colors ${
                  item.alert ? "text-accent-secondary" : "text-white group-hover:text-accent-secondary"
                }`}
              >
                {item.value}
              </p>
            </div>
            <div
              className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform ${
                item.alert ? "animate-pulse" : ""
              }`}
            >
              <item.icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amethyst-950/20 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-12 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-accent-secondary/10 rounded-2xl">
              <Activity size={28} className="text-accent-secondary" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter">Recent Activity</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
                What's been happening lately
              </p>
            </div>
          </div>
          <div className="relative min-w-[280px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Search activity..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full bg-amethyst-900/60 border border-white/5 rounded-xl py-2.5 pl-12 pr-6 text-[10px] text-white outline-none focus:ring-4 focus:ring-accent-secondary/10 font-bold placeholder:text-slate-700"
            />
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-700 font-black uppercase tracking-widest italic">
              Nothing matches your search.
            </div>
          ) : (
            filteredLogs.slice(0, 10).map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 p-5 lg:p-8 bg-amethyst-900/40 rounded-2xl lg:rounded-[2.5rem] border border-white/5 hover:bg-amethyst-900/60 transition-all"
              >
                <div
                  className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center text-xs lg:text-sm font-black border uppercase shadow-inner ${
                    log.event.includes("DELETION")
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : log.event.includes("PROVISION")
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  }`}
                >
                  {log.event.charAt(0)}
                </div>

                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 items-center gap-4 lg:gap-8 w-full">
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 lg:mb-1">
                      What
                    </p>
                    <p className="text-[11px] lg:text-[13px] font-black text-white italic truncate">
                      {log.event.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 lg:mb-1">
                      Who
                    </p>
                    <p className="text-[11px] lg:text-[13px] font-bold text-slate-400 truncate">{log.actor}</p>
                  </div>
                  <div className="text-right hidden lg:block">
                    <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 lg:mb-1">
                      When
                    </p>
                    <p className="text-[9px] lg:text-[11px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-700 hidden sm:block" />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
