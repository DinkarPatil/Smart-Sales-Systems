import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, CheckCircle, Clock, AlertTriangle, Send, Search,
  Loader2, Sparkles, User, LayoutGrid, Database, Tag, ArrowUpRight,
  RefreshCw, TrendingUp, Activity, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Toast notification system ─────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl text-sm font-medium max-w-sm ${
            t.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
              : t.type === 'error'
              ? 'bg-red-950/80 border-red-500/30 text-red-200'
              : 'bg-amethyst-900/80 border-white/10 text-white'
          }`}
        >
          <span className="flex-1 leading-relaxed">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, toast: add, removeToast: remove };
};

// ── Escalation modal ──────────────────────────────────────────────────────────
const EscalateModal = ({ onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('normal');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-amethyst-950 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-lg font-black italic text-white mb-1">Escalate to Owner</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-6">
          This will notify the company owner with an email alert.
        </p>

        <div className="space-y-5">
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">
              Escalation Reason *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe why this requires owner intervention..."
              className="w-full h-28 bg-amethyst-900/60 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-accent-secondary/50 resize-none placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">
              Priority Level
            </label>
            <div className="flex gap-3">
              {['normal', 'high'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-accent-secondary/20 border-accent-secondary/50 text-accent-secondary'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {p === 'high' ? '🔴 High (12h SLA)' : '🟡 Normal (48h SLA)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason, priority)}
            disabled={!reason.trim() || loading}
            className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Escalate Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main dashboard ─────────────────────────────────────────────────────────────
const SalesRepDashboard = () => {
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({
    active_queries: 0,
    resolved_queries: 0,
    escalated_queries: 0,
    efficiency_score: 0,
    avg_response_time: 0
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPct, setDiscountPct] = useState(0);

  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const { toasts, toast, removeToast } = useToast();
  const pollingRef = useRef(null);

  const API_BASE = 'http://127.0.0.1:8000/api/v1/sales';
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [queriesRes, statsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/queries`, { headers }),
        fetch(`${API_BASE}/stats`, { headers }),
        fetch(`${API_BASE}/products`, { headers })
      ]);

      if (!queriesRes.ok || !statsRes.ok || !productsRes.ok)
        throw new Error('Failed to fetch operative data');

      const [queriesData, statsData, productsData] = await Promise.all([
        queriesRes.json(), statsRes.json(), productsRes.json()
      ]);

      setQueries(queriesData);
      setStats(statsData);
      setProducts(productsData);

      setSelectedQuery(prev =>
        prev ? (queriesData.find(q => q.id === prev.id) ?? prev) : prev
      );
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds (silent — no loading spinner)
    pollingRef.current = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(pollingRef.current);
  }, [fetchData]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleResolve = async (queryId) => {
    if (!resolutionText.trim()) return toast('Enter a resolution response first.', 'error');
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/queries/${queryId}/resolve`, {
        method: 'POST', headers,
        body: JSON.stringify({ resolution: resolutionText })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Resolution failed');
      toast('Resolution dispatched successfully.', 'success');
      setResolutionText('');
      setSelectedQuery(null);
      await fetchData(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (reason, priority) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/queries/${selectedQuery.id}/escalate`, {
        method: 'POST', headers,
        body: JSON.stringify({ reason, priority })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Escalation failed');
      toast(`Escalated to owner with ${priority.toUpperCase()} priority.`, 'success');
      setShowEscalateModal(false);
      await fetchData(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyDiscount = async (queryId) => {
    if (!selectedProductId) return toast('Select a product first.', 'error');
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/queries/${queryId}/apply-discount`, {
        method: 'POST', headers,
        body: JSON.stringify({ product_id: selectedProductId, discount_pct: parseInt(discountPct) })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Discount application failed');
      toast('Discount applied per corporate policy.', 'success');
      setDiscountPct(0);
      setSelectedProductId('');
      await fetchData(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filteredQueries = queries.filter(q => {
    const matchesSearch =
      q.query_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer_metadata?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && q.status === activeTab;
  });

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading && queries.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-accent-secondary/20 rounded-full animate-pulse" />
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
        Synchronizing Operative Node...
      </p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-red-400">
      <AlertTriangle size={40} />
      <p className="font-black uppercase tracking-widest text-xs">{error}</p>
      <button
        onClick={() => { setError(null); fetchData(); }}
        className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
      >
        Retry
      </button>
    </div>
  );

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />

      <AnimatePresence>
        {showEscalateModal && (
          <EscalateModal
            onConfirm={handleEscalate}
            onClose={() => setShowEscalateModal(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-screen max-h-screen max-w-[1800px] mx-auto p-6 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Operative Access: Sales Rep
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-white italic leading-none">
              Resolution{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                Terminal
              </span>
            </h2>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3">
            <div className="bg-amethyst-900/60 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-inner">
              <StatPill label="Active" value={stats.active_queries} color="text-accent-secondary" icon={<Activity size={12} />} />
              <Divider />
              <StatPill label="Resolved" value={stats.resolved_queries} color="text-emerald-400" icon={<CheckCircle size={12} />} />
              <Divider />
              <StatPill label="Escalated" value={stats.escalated_queries} color="text-red-400" icon={<AlertTriangle size={12} />} />
              <Divider />
              <StatPill label="Efficiency" value={`${stats.efficiency_score}%`} color="text-accent-secondary" icon={<TrendingUp size={12} />} />
              <Divider />
              <StatPill label="Avg Resp" value={`${stats.avg_response_time}m`} color="text-white" icon={<Clock size={12} />} />
            </div>

            {/* Manual refresh */}
            <button
              onClick={() => fetchData(true)}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ── 3-Pane Layout ── */}
        <div className="flex-1 min-h-0 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

            {/* Pane 1: Queue */}
            <div className="lg:col-span-3 flex flex-col bg-amethyst-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-1 bg-amethyst-900/50 p-1 rounded-xl">
                  {['Pending', 'Escalated', 'Resolved', 'All'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === tab
                          ? 'bg-accent-secondary/20 text-accent-secondary shadow-sm'
                          : 'text-slate-500 hover:text-white hover:bg-white/5'
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
                    placeholder="Filter signals..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-amethyst-900/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white focus:ring-2 focus:ring-accent-primary/20 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <AnimatePresence>
                  {filteredQueries.map(query => (
                    <motion.div
                      layout
                      key={query.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => { setSelectedQuery(query); setResolutionText(''); }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedQuery?.id === query.id
                          ? 'bg-amethyst-800/80 border-accent-secondary/50 shadow-fuchsia-glow/20'
                          : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-black text-white italic tracking-tight">
                          {query.customer_metadata?.full_name || 'Anonymous User'}
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
                            {new Date(query.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                          #{query.id}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {filteredQueries.length === 0 && (
                    <p className="text-center py-10 px-4 text-slate-500 text-xs font-medium">
                      No signals match your filters.
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Pane 2: Communication view */}
            <div className="lg:col-span-6 flex flex-col bg-amethyst-950/20 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
              {selectedQuery ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/5 bg-amethyst-900/20 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent-secondary/10 border border-accent-secondary/20 rounded-xl flex items-center justify-center text-accent-secondary">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white italic tracking-tight leading-none mb-1">
                          {selectedQuery.customer_metadata?.full_name || 'Anonymous User'}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>Signal #{selectedQuery.id}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span>{new Date(selectedQuery.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat thread */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Customer message */}
                    <div className="flex flex-col items-start max-w-[85%]">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-4">
                        Inbound Signal
                      </span>
                      <div className="bg-amethyst-900/60 backdrop-blur-xl border border-white/10 text-white text-sm leading-relaxed p-6 rounded-[2rem] rounded-tl-sm shadow-xl">
                        {selectedQuery.query_text}
                      </div>
                    </div>

                    {/* Escalation notice */}
                    {selectedQuery.is_escalated && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-400">
                          <AlertTriangle size={10} />
                          Escalated · {selectedQuery.escalation_reason}
                        </div>
                      </div>
                    )}

                    {/* Pending placeholder */}
                    {selectedQuery.status === 'Pending' && (
                      <div className="flex flex-col items-end max-w-[85%] ml-auto mt-4 opacity-50">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 mr-4">
                          Awaiting Dispatch
                        </span>
                        <div className="bg-white/5 border border-white/10 border-dashed text-slate-400 text-sm italic font-medium p-6 rounded-[2rem] rounded-tr-sm">
                          No resolution active. Awaiting operator input...
                        </div>
                      </div>
                    )}

                    {/* Resolved response — field is final_answer */}
                    {selectedQuery.status === 'Resolved' && selectedQuery.final_answer && (
                      <div className="flex flex-col items-end max-w-[85%] ml-auto mt-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2 mr-4">
                          Dispatched Resolution
                        </span>
                        <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-50 text-sm leading-relaxed p-6 rounded-[2rem] rounded-tr-sm shadow-xl">
                          {selectedQuery.final_answer}
                        </div>
                        <div className="mt-2 mr-4 flex items-center gap-1.5 opacity-60">
                          <CheckCircle size={10} className="text-emerald-500" />
                          <span className="text-[9px] font-black italic text-emerald-500">Delivered</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compose box */}
                  <div className="p-6 bg-amethyst-950/40 border-t border-white/5">
                    {selectedQuery.status === 'Resolved' ? (
                      <div className="h-16 flex items-center justify-center border border-emerald-500/10 bg-emerald-500/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                        <CheckCircle size={14} className="mr-2" /> Signal chain finalised. No further actions required.
                      </div>
                    ) : (
                      <div className="relative">
                        <textarea
                          value={resolutionText}
                          onChange={e => setResolutionText(e.target.value)}
                          placeholder="Construct response dispatch..."
                          className="w-full h-32 bg-amethyst-900/60 border border-white/10 rounded-[1.5rem] p-5 text-sm focus:ring-2 focus:ring-accent-secondary/50 focus:border-accent-secondary/50 outline-none transition-all resize-none text-white placeholder:text-slate-500 custom-scrollbar"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                          <button
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-accent-secondary hover:bg-accent-secondary/10 transition-colors"
                            title="AI Auto-draft (Coming Soon)"
                          >
                            <Sparkles size={16} />
                          </button>
                          <button
                            onClick={() => handleResolve(selectedQuery.id)}
                            disabled={actionLoading || !resolutionText.trim()}
                            className="px-6 py-2.5 bg-accent-secondary hover:bg-accent-primary rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-fuchsia-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Dispatch
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
                  <h3 className="text-xl font-black italic text-white mb-2">No Active Context</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs">
                    Select a signal from the queue to review customer history and dispatch resolution.
                  </p>
                </div>
              )}
            </div>

            {/* Pane 3: Deal context & action suite */}
            <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
              {selectedQuery ? (
                <>
                  {/* Customer meta */}
                  <div className="bg-amethyst-950/40 rounded-[2rem] border border-white/5 p-6 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Database size={12} /> Meta Protocol
                    </h4>
                    <div className="space-y-3">
                      {[
                        ['Email', selectedQuery.customer_metadata?.email],
                        ['Phone', selectedQuery.customer_metadata?.phone],
                        ['Created', new Date(selectedQuery.created_at).toLocaleDateString()],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                          <span className="text-xs font-medium text-white truncate max-w-[130px]" title={value}>
                            {value || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discount / Price negotiation */}
                  <div className="bg-amethyst-900/20 rounded-[2rem] border border-white/5 p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 blur-3xl rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-6">
                      <Tag size={12} /> Leverage Suite
                    </h4>

                    <div className="space-y-5 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Asset Selection
                        </label>
                        <select
                          value={selectedProductId}
                          onChange={e => setSelectedProductId(e.target.value)}
                          className="w-full bg-amethyst-950/60 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:ring-2 focus:ring-accent-secondary/40"
                        >
                          <option value="">Select Asset Target...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.price}) — max {p.max_discount_pct}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            Discount Allocation
                          </label>
                          <span className="text-[10px] font-black text-accent-secondary">{discountPct}%</span>
                        </div>
                        <input
                          type="range" min="0" max="50" step="1"
                          value={discountPct}
                          onChange={e => setDiscountPct(e.target.value)}
                          className="w-full h-1.5 bg-amethyst-950 rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                        />
                        {/* Live price preview */}
                        {selectedProductId && discountPct > 0 && (() => {
                          const p = products.find(p => p.id === selectedProductId);
                          if (!p) return null;
                          const capped = Math.min(discountPct, p.max_discount_pct);
                          const price = parseFloat(p.price) || 0;
                          return (
                            <div className="text-[9px] text-slate-400 font-medium px-1">
                              Preview: <span className="text-accent-secondary font-black">
                                ${(price * (1 - capped / 100)).toFixed(2)}
                              </span>
                              {discountPct > p.max_discount_pct && (
                                <span className="text-amber-400 ml-2">(capped at {p.max_discount_pct}%)</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <button
                        onClick={() => handleApplyDiscount(selectedQuery.id)}
                        disabled={actionLoading || !selectedProductId || selectedQuery.status === 'Resolved'}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black text-[9px] uppercase tracking-widest hover:bg-accent-secondary/20 hover:border-accent-secondary/50 hover:text-accent-secondary transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                      >
                        Apply Leverage Policy <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Escalation */}
                  <div className="bg-red-950/10 rounded-[2rem] border border-red-500/10 p-6 flex flex-col">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                      <AlertTriangle size={12} /> Executive Escalation
                    </h4>
                    <p className="text-[9px] text-slate-400 mb-5 leading-relaxed">
                      Transfer ownership to management for final adjudication. You'll be asked for a reason and SLA priority.
                    </p>
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      disabled={actionLoading || selectedQuery.status === 'Resolved' || selectedQuery.is_escalated}
                      className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/30 hover:text-red-300 hover:border-red-500/50 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={12} />
                      {selectedQuery.is_escalated ? 'Already Escalated' : 'Escalate to Owner'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full bg-amethyst-950/10 rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center p-8 text-center">
                  <LayoutGrid size={24} className="text-slate-600 mb-4 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Awaiting Signal Context
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

// ── Small helper components ───────────────────────────────────────────────────

const StatPill = ({ label, value, color, icon }) => (
  <div className="text-center">
    <div className={`flex items-center justify-center gap-1 text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ${color}`}>
      {icon} {label}
    </div>
    <p className={`text-xl font-black tracking-tighter leading-none ${color}`}>{value}</p>
  </div>
);

const Divider = () => <div className="w-[1px] h-8 bg-white/10" />;

const StatusBadge = ({ status }) => {
  const map = {
    Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Escalated: 'bg-red-500/10 text-red-400 border-red-500/20',
    Pending: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${map[status] || map.Pending}`}>
      {status}
    </span>
  );
};

export default SalesRepDashboard;
