import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Send, Search, Filter, Loader2, Sparkles, ChevronRight, User, MoreVertical, LayoutGrid, Database, PieChart, Tag, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SalesRepDashboard = () => {
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({
    active_queries: 0,
    resolved_queries: 0,
    efficiency_score: 0,
    avg_response_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPct, setDiscountPct] = useState(0);

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE = 'http://127.0.0.1:8000/api/v1/sales';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queriesRes, statsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!queriesRes.ok || !statsRes.ok || !productsRes.ok) throw new Error('Operative data link failed');

      const [queriesData, statsData, productsData] = await Promise.all([
        queriesRes.json(),
        statsRes.json(),
        productsRes.json()
      ]);

      setQueries(queriesData);
      setStats(statsData);
      setProducts(productsData);
      
      // Update selectedQuery if it exists in new data
      if (selectedQuery) {
        const updatedSelected = queriesData.find(q => q.id === selectedQuery.id);
        if (updatedSelected) setSelectedQuery(updatedSelected);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async (queryId, priority = 'normal') => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}/escalate?priority=${priority}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Escalation signal failed');
      alert(`SUCCESS: Signal escalated to Owner with ${priority.toUpperCase()} priority.`);
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyDiscount = async (queryId) => {
    if (!selectedProductId) return alert("Select a product node first");
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}/apply-discount`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          product_id: selectedProductId,
          discount_pct: parseInt(discountPct)
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Discount application failed');
      }
      await fetchData();
      setDiscountPct(0);
      setSelectedProductId('');
      alert("SUCCESS: Discount applied and price adjusted per corporate policy.");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (queryId) => {
    if (!resolutionText.trim()) return alert("Enter a resolution response first.");
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ resolution: resolutionText })
      });
      if (!response.ok) throw new Error('Failed to dispatch resolution signal');
      alert(`SUCCESS: Resolution dispatched to node.`);
      await fetchData();
      setResolutionText('');
      setSelectedQuery(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQueries = queries.filter(q => {
    const matchesSearch = q.query_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.customer_metadata?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && q.status === activeTab;
  });

  if (loading && queries.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-accent-secondary/20 rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Synchronizing Operative Node...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-h-screen max-w-[1800px] mx-auto p-6 overflow-hidden">
      {/* Optimization: Keep header compact for CRM feel */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/5 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Operative Access: Sales Rep</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-white italic leading-none">
             Resolution <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">Terminal</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-amethyst-900/60 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-inner">
              <div className="text-center">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Efficiency</p>
                 <p className="text-xl font-black text-accent-secondary tracking-tighter leading-none">{stats.efficiency_score}%</p>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="text-center">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Resp Time</p>
                 <p className="text-xl font-black text-white tracking-tighter leading-none">{stats.avg_response_time}m</p>
              </div>
           </div>
        </div>
      </div>

      {/* 3-Pane CRM Layout */}
      <div className="flex-1 min-h-0 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Pane 1: Queue (Left Sidebar) */}
          <div className="lg:col-span-3 flex flex-col bg-amethyst-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
             {/* Tabs Header */}
             <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-2 bg-amethyst-900/50 p-1 rounded-xl">
                   {['Pending', 'Escalated', 'Resolved', 'All'].map(tab => (
                     <button 
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
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
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-amethyst-900/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white focus:ring-2 focus:ring-accent-primary/20 outline-none transition-all placeholder:text-slate-600"
                   />
                </div>
             </div>

             {/* Queue List */}
             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <AnimatePresence>
                  {filteredQueries.map((query, i) => (
                    <motion.div 
                      layout
                      key={query.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedQuery(query)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                        selectedQuery?.id === query.id 
                        ? 'bg-amethyst-800/80 border-accent-secondary/50 shadow-fuchsia-glow/20' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="text-xs font-black text-white italic tracking-tight">{query.customer_metadata?.full_name || 'Anonymous User'}</h4>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                           query.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                           query.status === 'Escalated' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                           'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20'
                         }`}>
                           {query.status}
                         </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{query.query_text}</p>
                      
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-slate-600" />
                            <span className="text-[9px] font-bold text-slate-500 italic">
                               {new Date(query.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                            ID: {query.id}
                         </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredQueries.length === 0 && (
                     <div className="text-center py-10 px-4 text-slate-500 text-xs font-medium">
                        No operative signals match your filters.
                     </div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* Pane 2: Communication View (Center) */}
          <div className="lg:col-span-6 flex flex-col bg-amethyst-950/20 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
             {selectedQuery ? (
               <>
                 {/* Comm Header */}
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
                             <span>Signal Node #{selectedQuery.id}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                             <span>{new Date(selectedQuery.created_at).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Chat History Flow */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90">
                    
                    {/* Arrival Node (Customer Message) */}
                    <div className="flex flex-col items-start max-w-[85%]">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-4">Inbound Signal</span>
                       <div className="bg-amethyst-900/60 backdrop-blur-xl border border-white/10 text-white text-sm leading-relaxed p-6 rounded-[2rem] rounded-tl-sm shadow-xl">
                          {selectedQuery.query_text}
                          
                          {/* Any applied discounts would ideally appear here in a robust system */}
                       </div>
                    </div>

                    {/* Pending System Node Indicator */}
                    {selectedQuery.status === 'Pending' && (
                       <div className="flex flex-col items-end max-w-[85%] ml-auto mt-4 opacity-50">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 mr-4">Awaiting Dispatch</span>
                          <div className="bg-white/5 border border-white/10 border-dashed text-slate-400 text-sm italic font-medium p-6 rounded-[2rem] rounded-tr-sm">
                             No resolution active. Awaiting operator input...
                          </div>
                       </div>
                    )}
                    
                    {/* Resolved Node Indicator (if already resolved) */}
                    {selectedQuery.status === 'Resolved' && selectedQuery.resolution && (
                       <div className="flex flex-col items-end max-w-[85%] ml-auto mt-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2 mr-4">Dispatched Resolution</span>
                          <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-50 text-sm leading-relaxed p-6 rounded-[2rem] rounded-tr-sm shadow-xl">
                             {selectedQuery.resolution}
                          </div>
                          <div className="mt-2 mr-4 flex items-center gap-1.5 opacity-60">
                             <CheckCircle size={10} className="text-emerald-500" />
                             <span className="text-[9px] font-black italic text-emerald-500">Delivered</span>
                          </div>
                       </div>
                    )}

                 </div>

                 {/* Compose Box Area */}
                 <div className="p-6 bg-amethyst-950/40 border-t border-white/5">
                    {selectedQuery.status === 'Resolved' ? (
                        <div className="h-16 flex items-center justify-center border border-emerald-500/10 bg-emerald-500/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                           <CheckCircle size={14} className="mr-2" /> Signal chain finalized. No further actions required.
                        </div>
                    ) : (
                      <div className="relative">
                         <textarea 
                           value={resolutionText}
                           onChange={(e) => setResolutionText(e.target.value)}
                           placeholder="Construct response dispatch..."
                           className="w-full h-32 bg-amethyst-900/60 border border-white/10 rounded-[1.5rem] p-5 text-sm focus:ring-2 focus:ring-accent-secondary/50 focus:border-accent-secondary/50 outline-none transition-all resize-none text-white placeholder:text-slate-500 custom-scrollbar"
                         />
                         <div className="absolute bottom-4 right-4 flex items-center gap-2">
                             {/* AI Gen Button Placeholder */}
                             <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-accent-secondary hover:bg-accent-secondary/10 transition-colors" title="AI Auto-draft (Coming Soon)">
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
                 <p className="text-xs text-slate-500 font-medium max-w-xs">Select an operative signal from the queue to review customer history and dispatch resolution.</p>
               </div>
             )}
          </div>

          {/* Pane 3: Deal Context & Action Suite (Right Sidebar) */}
          <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
             {selectedQuery ? (
               <>
                 {/* Customer Context Mini-card */}
                 <div className="bg-amethyst-950/40 rounded-[2rem] border border-white/5 p-6 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <Database size={12} /> Meta Protocol
                    </h4>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email</span>
                          <span className="text-xs font-medium text-white truncate max-w-[120px]" title={selectedQuery.customer_metadata?.email}>{selectedQuery.customer_metadata?.email || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phone</span>
                          <span className="text-xs font-medium text-white">{selectedQuery.customer_metadata?.phone || 'N/A'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Price Negotiation Suite */}
                 <div className="bg-amethyst-900/20 rounded-[2rem] border border-white/5 p-6 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 blur-3xl rounded-full"></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-6">
                       <Tag size={12} /> Leverage Suite
                    </h4>
                    
                    <div className="space-y-5 relative z-10">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Selection</label>
                          <select 
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full bg-amethyst-950/60 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:ring-2 focus:ring-accent-secondary/40"
                          >
                             <option value="">Select Asset Target...</option>
                             {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                          </select>
                       </div>
                       
                       <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                             <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Discount Allocation</label>
                             <span className="text-[10px] font-black text-accent-secondary">{discountPct}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="50" step="1"
                            value={discountPct}
                            onChange={(e) => setDiscountPct(e.target.value)}
                            className="w-full h-1.5 bg-amethyst-950 rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                          />
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

                 {/* Executive Escalation */}
                 <div className="bg-red-950/10 rounded-[2rem] border border-red-500/10 p-6 flex flex-col">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                       <AlertTriangle size={12} /> Executive Escalation
                    </h4>
                    <p className="text-[9px] text-slate-400 mb-5 leading-relaxed">
                       Transfer ownership of this signal node to management for final adjudication.
                    </p>
                    <div className="flex flex-col gap-3 mt-auto">
                       <button 
                         onClick={() => handleEscalate(selectedQuery.id, 'normal')}
                         disabled={actionLoading || selectedQuery.status === 'Resolved'}
                         className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-black text-[9px] uppercase tracking-widest hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/40 transition-all disabled:opacity-30"
                       >
                          Standard Transfer
                       </button>
                       <button 
                         onClick={() => handleEscalate(selectedQuery.id, 'high')}
                         disabled={actionLoading || selectedQuery.status === 'Resolved'}
                         className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/30 hover:text-red-300 hover:border-red-500/50 transition-all shadow-lg disabled:opacity-30"
                       >
                          SLA Breach Priority
                       </button>
                    </div>
                 </div>
               </>
             ) : (
               <div className="h-full bg-amethyst-950/10 rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center p-8 text-center">
                  <LayoutGrid size={24} className="text-slate-600 mb-4 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Signal Context</p>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SalesRepDashboard;
