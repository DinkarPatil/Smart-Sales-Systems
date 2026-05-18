"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Database,
  LayoutGrid,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";
import { salesApi } from "@/lib/api/sales";
import { extractError } from "@/lib/api/client";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { EscalateModal } from "./components/EscalateModal";

const TABS = ["Pending", "Escalated", "Resolved", "All"];

function StatPill({ label, value, color, icon }) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ${color}`}>
        {icon} {label}
      </div>
      <p className={`text-xl font-black tracking-tighter leading-none ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Escalated: "bg-red-500/10 text-red-400 border-red-500/20",
    Pending: "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${map[status] || map.Pending}`}>
      {status}
    </span>
  );
}

const Divider = () => <div className="w-[1px] h-8 bg-white/10" />;

export function SalesRepDashboard() {
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({
    active_queries: 0,
    resolved_queries: 0,
    escalated_queries: 0,
    efficiency_score: 0,
    avg_response_time: 0,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const { toasts, toast, removeToast } = useToast();
  const pollingRef = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [q, s, p] = await Promise.all([
        salesApi.queries(),
        salesApi.stats(),
        salesApi.listProducts(),
      ]);
      setQueries(q);
      setStats(s);
      setProducts(p);
      setSelectedQuery((prev) => (prev ? q.find((x) => x.id === prev.id) ?? prev : prev));
    } catch (err) {
      setError(extractError(err, "Couldn't load your queries. Please refresh."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollingRef.current = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(pollingRef.current);
  }, [fetchData]);

  const handleResolve = async (queryId) => {
    if (!resolutionText.trim()) return toast("Please type a reply first.", "error");
    try {
      setActionLoading(true);
      await salesApi.resolveQuery(queryId, resolutionText);
      toast("Reply sent.", "success");
      setResolutionText("");
      setSelectedQuery(null);
      await fetchData(true);
    } catch (err) {
      toast(extractError(err, "Couldn't send the reply. Please try again."), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (reason, priority) => {
    try {
      setActionLoading(true);
      await salesApi.escalateQuery(selectedQuery.id, { reason, priority });
      toast(`Sent to owner${priority === "high" ? " (urgent)" : ""}.`, "success");
      setShowEscalateModal(false);
      await fetchData(true);
    } catch (err) {
      toast(extractError(err, "Couldn't escalate. Please try again."), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyDiscount = async (queryId) => {
    if (!selectedProductId) return toast("Pick a product first.", "error");
    try {
      setActionLoading(true);
      await salesApi.applyDiscount(queryId, {
        product_id: selectedProductId,
        discount_pct: parseInt(discountPct, 10),
      });
      toast("Discount applied.", "success");
      setDiscountPct(0);
      setSelectedProductId("");
      await fetchData(true);
    } catch (err) {
      toast(extractError(err, "Couldn't apply the discount. Please try again."), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    const matchesSearch = q.query_text?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "All") return matchesSearch;
    return matchesSearch && q.status === activeTab;
  });

  if (loading && queries.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
          Loading your queries...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-red-400">
        <AlertTriangle size={40} />
        <p className="font-black uppercase tracking-widest text-xs">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchData();
          }}
          className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <AnimatePresence>
        {showEscalateModal && (
          <EscalateModal
            onConfirm={handleEscalate}
            onClose={() => setShowEscalateModal(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-[calc(100vh-9rem)] max-w-[1800px] mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Sales Rep
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-white italic leading-none">
              My{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                Queries
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amethyst-900/60 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-inner">
              <StatPill label="Open" value={stats.active_queries} color="text-accent-secondary" icon={<Activity size={12} />} />
              <Divider />
              <StatPill label="Resolved" value={stats.resolved_queries} color="text-emerald-400" icon={<CheckCircle size={12} />} />
              <Divider />
              <StatPill label="Escalated" value={stats.escalated_queries} color="text-red-400" icon={<AlertTriangle size={12} />} />
              <Divider />
              <StatPill label="Score" value={`${stats.efficiency_score}%`} color="text-accent-secondary" icon={<TrendingUp size={12} />} />
              <Divider />
              <StatPill label="Avg Time" value={`${stats.avg_response_time}m`} color="text-white" icon={<Clock size={12} />} />
            </div>

            <button
              onClick={() => fetchData(true)}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-3 flex flex-col bg-amethyst-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-1 bg-amethyst-900/50 p-1 rounded-xl">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === tab
                          ? "bg-accent-secondary/20 text-accent-secondary shadow-sm"
                          : "text-slate-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-amethyst-900/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white focus:ring-2 focus:ring-accent-primary/20 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <AnimatePresence>
                  {filteredQueries.map((query) => (
                    <motion.div
                      layout
                      key={query.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setSelectedQuery(query);
                        setResolutionText("");
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedQuery?.id === query.id
                          ? "bg-amethyst-800/80 border-accent-secondary/50"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-black text-white italic tracking-tight truncate max-w-[160px]">
                          {query.complainant_email}
                        </h4>
                        <StatusBadge status={query.status} />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {query.query_text}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} className="text-slate-600" />
                          <span className="text-[9px] font-bold text-slate-500 italic">
                            {new Date(query.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                          #{query.complaint_id}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {filteredQueries.length === 0 && (
                    <p className="text-center py-10 px-4 text-slate-500 text-xs font-medium">
                      No queries here.
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col bg-amethyst-950/20 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
              {selectedQuery ? (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-white/5 bg-amethyst-900/20 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent-secondary/10 border border-accent-secondary/20 rounded-xl flex items-center justify-center text-accent-secondary">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white italic tracking-tight leading-none mb-1">
                          {selectedQuery.complainant_email}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>#{selectedQuery.complaint_id}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span>{new Date(selectedQuery.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="flex flex-col items-start max-w-[85%]">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-4">
                        Customer asked
                      </span>
                      <div className="bg-amethyst-900/60 backdrop-blur-xl border border-white/10 text-white text-sm leading-relaxed p-6 rounded-[2rem] rounded-tl-sm shadow-xl">
                        {selectedQuery.query_text}
                      </div>
                    </div>

                    {selectedQuery.is_escalated && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-400">
                          <AlertTriangle size={10} />
                          Escalated · {selectedQuery.escalation_reason}
                        </div>
                      </div>
                    )}

                    {selectedQuery.status === "Resolved" && selectedQuery.final_answer && (
                      <div className="flex flex-col items-end max-w-[85%] ml-auto mt-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2 mr-4">
                          Your reply
                        </span>
                        <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-50 text-sm leading-relaxed p-6 rounded-[2rem] rounded-tr-sm shadow-xl">
                          {selectedQuery.final_answer}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-amethyst-950/40 border-t border-white/5">
                    {selectedQuery.status === "Resolved" ? (
                      <div className="h-16 flex items-center justify-center border border-emerald-500/10 bg-emerald-500/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                        <CheckCircle size={14} className="mr-2" /> This query is closed.
                      </div>
                    ) : (
                      <div className="relative">
                        <textarea
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          placeholder="Type your reply..."
                          className="w-full h-32 bg-amethyst-900/60 border border-white/10 rounded-[1.5rem] p-5 text-sm focus:ring-2 focus:ring-accent-secondary/50 focus:border-accent-secondary/50 outline-none transition-all resize-none text-white placeholder:text-slate-500 custom-scrollbar"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                          <button
                            onClick={() => handleResolve(selectedQuery.id)}
                            disabled={actionLoading || !resolutionText.trim()}
                            className="px-6 py-2.5 bg-accent-secondary hover:bg-accent-primary rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-fuchsia-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={32} className="text-slate-500" />
                  </div>
                  <h3 className="text-xl font-black italic text-white mb-2">Pick a query to start</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs">
                    Select a query from the list to read it and send a reply.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
              {selectedQuery ? (
                <>
                  <div className="bg-amethyst-950/40 rounded-[2rem] border border-white/5 p-6 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Database size={12} /> Customer Info
                    </h4>
                    <div className="space-y-3">
                      {[
                        ["Email", selectedQuery.complainant_email],
                        ["Query #", selectedQuery.complaint_id],
                        ["Date", new Date(selectedQuery.created_at).toLocaleDateString()],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {label}
                          </span>
                          <span className="text-xs font-medium text-white truncate max-w-[130px]">
                            {value || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amethyst-900/20 rounded-[2rem] border border-white/5 p-6 shadow-inner">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-6">
                      <Tag size={12} /> Offer a Discount
                    </h4>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Product
                        </label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full bg-amethyst-950/60 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:ring-2 focus:ring-accent-secondary/40"
                        >
                          <option value="">Pick a product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.price}) — max {p.max_discount_pct}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            Discount
                          </label>
                          <span className="text-[10px] font-black text-accent-secondary">{discountPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          value={discountPct}
                          onChange={(e) => setDiscountPct(e.target.value)}
                          className="w-full h-1.5 bg-amethyst-950 rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                        />
                      </div>

                      <button
                        onClick={() => handleApplyDiscount(selectedQuery.id)}
                        disabled={actionLoading || !selectedProductId || selectedQuery.status === "Resolved"}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black text-[9px] uppercase tracking-widest hover:bg-accent-secondary/20 hover:border-accent-secondary/50 hover:text-accent-secondary transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                      >
                        Apply Discount <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-950/10 rounded-[2rem] border border-red-500/10 p-6 flex flex-col">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                      <AlertTriangle size={12} /> Escalate
                    </h4>
                    <p className="text-[9px] text-slate-400 mb-5 leading-relaxed">
                      Send this query to your owner if it needs their decision.
                    </p>
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      disabled={actionLoading || selectedQuery.status === "Resolved" || selectedQuery.is_escalated}
                      className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/30 hover:text-red-300 hover:border-red-500/50 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={12} />
                      {selectedQuery.is_escalated ? "Already Escalated" : "Escalate to Owner"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full bg-amethyst-950/10 rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center p-8 text-center">
                  <LayoutGrid size={24} className="text-slate-600 mb-4 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Pick a query to see details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
