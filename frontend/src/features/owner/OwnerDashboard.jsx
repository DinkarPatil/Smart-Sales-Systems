"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { useOwnerData } from "./hooks/useOwnerData";
import { HomeView } from "./views/HomeView";
import { AssetsView } from "./views/AssetsView";
import { NegotiationsView } from "./views/NegotiationsView";
import { HistoryView } from "./views/HistoryView";

const VIEW_TITLES = {
  home: { title: "Owner Home", subtitle: "Your company at a glance" },
  assets: { title: "Your Products", subtitle: "Manage your product catalog" },
  negotiations: { title: "Pending Escalations", subtitle: "Queries that need your attention" },
  critical: { title: "Urgent Issues", subtitle: "Need immediate action" },
  history: { title: "Activity Log", subtitle: "Recent changes" },
};

export function OwnerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "home";
  const { stats, products, negotiations, history, loading, error, refetch } = useOwnerData();

  const navigate = (view) => router.push(view === "home" ? "/owner" : `/owner?view=${view}`);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
          Loading...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-red-400 font-mono text-sm">{error}</p>
        </div>
      </div>
    );

  const { title, subtitle } = VIEW_TITLES[currentView] || VIEW_TITLES.home;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              Owner · {stats.company_name}
            </span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
            {title.split(" ")[0]}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              {title.split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refetch}
            className="p-4 bg-amethyst-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
            title="Refresh"
          >
            <Activity size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {currentView === "home" && (
            <HomeView stats={stats} historyCount={history.length} onNavigate={navigate} />
          )}
          {currentView === "assets" && <AssetsView products={products} onChanged={refetch} />}
          {currentView === "negotiations" && (
            <NegotiationsView negotiations={negotiations} mode="standard" onChanged={refetch} />
          )}
          {currentView === "critical" && (
            <NegotiationsView negotiations={negotiations} mode="critical" onChanged={refetch} />
          )}
          {currentView === "history" && <HistoryView history={history} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
