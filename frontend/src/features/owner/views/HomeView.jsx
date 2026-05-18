"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, Database, History } from "lucide-react";

export function HomeView({ stats, historyCount, onNavigate }) {
  const cards = [
    {
      label: "Your Products",
      value: stats.total_products,
      subtitle: "In your catalog",
      icon: Database,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      onClick: () => onNavigate("assets"),
    },
    {
      label: "Pending Escalations",
      value: stats.escalated_queries,
      subtitle: "Waiting for your review",
      icon: Activity,
      color: "text-accent-secondary",
      bg: "bg-accent-secondary/10",
      alert: stats.escalated_queries > 0,
      onClick: () => onNavigate("negotiations"),
    },
    {
      label: "Urgent Issues",
      value: stats.high_priority_pending,
      subtitle: "Need attention now",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      alert: stats.high_priority_pending > 0,
      onClick: () => onNavigate("critical"),
    },
    {
      label: "Recent Changes",
      value: historyCount,
      subtitle: "Activity in your account",
      icon: History,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      onClick: () => onNavigate("history"),
    },
  ];

  return (
    <div className="space-y-12">
      <div className="bg-amethyst-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/20">
              Online
            </span>
            <div className="w-12 h-[1px] bg-white/10" />
            <span className="text-slate-600 font-mono text-[9px] tracking-widest">
              {stats.company_name}
            </span>
          </div>
          <h3 className="text-6xl font-black text-white tracking-tighter italic mb-8">
            Welcome <span className="text-accent-secondary">back</span>
          </h3>
          <p className="text-slate-300 font-medium max-w-xl leading-loose text-[15px]">
            Here's what's happening with your products, team, and pending customer queries.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={stat.onClick}
            className={`cursor-pointer bg-amethyst-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border group hover:border-accent-primary/30 relative overflow-hidden transition-all shadow-xl ${
              stat.alert ? "border-red-500/40 shadow-red-500/10" : "border-white/5"
            }`}
          >
            <div
              className={`p-4 w-fit rounded-2xl mb-6 ${stat.bg} ${stat.color} ${
                stat.alert ? "animate-pulse" : ""
              } group-hover:scale-110 transition-transform`}
            >
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-3">
              <p
                className={`text-4xl font-black tracking-tighter ${
                  stat.alert
                    ? "text-red-400"
                    : "text-white group-hover:text-accent-secondary transition-colors"
                }`}
              >
                {stat.value}
              </p>
              <span className="text-[10px] font-bold text-slate-600 italic">{stat.subtitle}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
