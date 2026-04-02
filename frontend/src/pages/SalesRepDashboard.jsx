import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Send, Search, Filter, History, Sparkles, User, Mail, ChevronRight, Loader2, RefreshCw, BookOpen, Layers, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SalesRepDashboard = () => {
  const [queries, setQueries] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    resolved_count: 0,
    pending_count: 0,
    assigned_count: 0,
    avg_resolution_time: 0.0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProductToolkit, setShowProductToolkit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  // Bulk selection
  const [bulkSelection, setBulkSelection] = useState([]);
  
  const [resolutionText, setResolutionText] = useState('');

  const API_BASE = 'http://127.0.0.1:8000/api/v1/sales';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queriesRes, productsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!queriesRes.ok) throw new Error('Sync connection failed');
      
      const [queriesData, productsData, statsData] = await Promise.all([
        queriesRes.json(),
        productsRes.json(),
        statsRes.json()
      ]);
      
      setQueries(queriesData);
      setProducts(productsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuery = (query) => {
    setSelectedQuery(query);
    setResolutionText(query.ai_generated_answer || '');
  };

  const handleBulkAssign = async () => {
    if (bulkSelection.length === 0) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query_ids: bulkSelection })
      });
      if (!response.ok) throw new Error('Bulk assignment failed');
      await fetchData();
      setBulkSelection([]);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (queryId) => {
<<<<<<< Updated upstream
=======
    if (!window.confirm("FINAL DISPATCH: Respond to customer?")) return;
>>>>>>> Stashed changes
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
<<<<<<< Updated upstream
        }
=======
        },
        body: JSON.stringify({ final_answer: resolutionText })
>>>>>>> Stashed changes
      });
      if (!response.ok) throw new Error('Resolution signal lost');
      await fetchData();
      setSelectedQuery(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBulkSelect = (id) => {
    setBulkSelection(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredQueries = queries.filter(q => 
    q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.complainant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.query_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <Loader2 size={48} className="text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Syncing Resolution Channels...</p>
    </div>
  );

  return (
<<<<<<< Updated upstream
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
             <MessageSquare className="text-primary-600" size={32} />
             Query Resolver Core
          </h2>
          <p className="text-slate-500 text-sm font-medium">Operator-assisted intelligence for high-conversion customer support.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchQueries} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
             <RefreshCw size={16} /> Update Sync
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
          <div className="flex items-center gap-3 bg-white border border-slate-200 py-2 px-4 rounded-xl shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Status: Active</span>
=======
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header & KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-accent-aurora/10 text-accent-aurora text-[10px] font-black uppercase tracking-widest border border-accent-aurora/20 rounded-lg">Operational Mode</span>
             <span className="text-[10px] font-black uppercase tracking-widest text-midnight-500">Sales Representative</span>
>>>>>>> Stashed changes
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white italic">
             Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora">Resolver</span>
          </h2>
        </div>

        <div className="flex gap-6">
          {[
            { label: 'Personal Closed', value: stats.resolved_count, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Assigned Pool', value: stats.assigned_count, icon: Clock, color: 'text-amber-400' },
            { label: 'Available Pending', value: stats.pending_count, icon: AlertCircle, color: 'text-sky-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-midnight-900/40 border border-white/5 rounded-3xl p-6 min-w-[180px] shadow-xl">
               <div className="flex items-center justify-between mb-2">
                 <stat.icon size={16} className={stat.color} />
                 <span className="text-[9px] font-black uppercase tracking-widest text-midnight-600">{stat.label}</span>
               </div>
               <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden">
        {/* Inbox Section */}
        <div className="lg:col-span-5 flex flex-col space-y-6 overflow-hidden">
          <div className="flex items-center justify-between px-2">
<<<<<<< Updated upstream
            <div className="flex items-center gap-3 text-slate-800">
              <History size={20} className="text-slate-400" />
              <h3 className="text-lg font-black tracking-tight uppercase tracking-widest">Inbound Queue</h3>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{queries.filter(q => q.status === 'Pending').length} Pending</span>
          </div>

          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 overflow-y-auto custom-scrollbar p-3 shadow-soft space-y-2">
             {queries.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-50">
                 <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-slate-300" />
                 </div>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs tracking-[0.2em]">Queue Channel Cleared</p>
               </div>
             ) : (
               <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-1"
               >
                 {queries.map((query) => (
                   <motion.div 
                      variants={itemVariants}
                      key={query.id} 
                      onClick={() => setSelectedQuery(query)}
                      className={`group p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden ${
                        selectedQuery?.id === query.id 
                        ? 'bg-primary-50 border-primary-200 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                   >
                     {query.status === 'Pending' && (
                       <div className="absolute top-6 right-6 w-2 h-2 bg-primary-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.3)]"></div>
                     )}
                     <div className="flex flex-col gap-4">
                       <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            query.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'
                          }`}>
                             {query.status === 'Resolved' ? <CheckCircle2 size={16} /> : <MessageSquare size={16} />}
                          </div>
                          <div>
                             <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                               selectedQuery?.id === query.id ? 'text-primary-700' : 'text-slate-400'
                             }`}>{query.complainant_email}</p>
                             <p className="text-[10px] text-slate-400 mt-1 font-mono font-medium">{new Date(query.created_at).toLocaleTimeString()}</p>
                          </div>
                       </div>
                       <p className={`text-sm font-bold leading-relaxed line-clamp-2 ${
                         selectedQuery?.id === query.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                       }`}>{query.query_text}</p>
                       
                       <div className="flex items-center justify-between pt-2">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                           query.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                         }`}>{query.status}</span>
                         <div className={`transition-all duration-300 ${selectedQuery?.id === query.id ? 'translate-x-1 text-primary-600 opacity-100' : 'opacity-0 active:opacity-100'}`}>
                           <ChevronRight size={18} />
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </motion.div>
             )}
=======
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Signal Queue</h3>
              <p className="text-[10px] text-midnight-500 font-bold uppercase tracking-widest">Inbound customer inquiries</p>
            </div>
            {bulkSelection.length > 0 && (
              <button 
                onClick={handleBulkAssign}
                className="px-6 py-3 bg-aurora-gradient rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-aurora-glow active:scale-95 transition-all flex items-center gap-2"
              >
                <Layers size={14} /> Bulk Assign ({bulkSelection.length})
              </button>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-600" size={16} />
            <input 
              type="text" 
              placeholder="Search queue signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all placeholder:text-midnight-700"
            />
          </div>

          <div className="flex-1 glass-card overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
               {filteredQueries.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-20 opacity-30 text-center">
                    <History size={48} className="text-midnight-400 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Zero signals detected</p>
                 </div>
               ) : (
                filteredQueries.map((query) => (
                  <div 
                    key={query.id}
                    onClick={() => handleSelectQuery(query)}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group ${
                      selectedQuery?.id === query.id 
                      ? 'bg-accent-primary/10 border-accent-primary/30 shadow-indigo-glow/5' 
                      : 'bg-midnight-900/40 border-transparent hover:border-white/10 hover:bg-midnight-800'
                    }`}
                  >
                    <div className="flex gap-4">
                      {query.status === 'PENDING' && (
                        <div className="pt-1">
                          <input 
                            type="checkbox" 
                            checked={bulkSelection.includes(query.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleBulkSelect(query.id);
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-midnight-900 checked:bg-accent-aurora accent-accent-aurora transition-all"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[11px] font-black text-white">{query.customer_name}</p>
                            <p className="text-[9px] text-midnight-500 font-bold uppercase tracking-widest">{query.complainant_email}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[8px] font-black border ${
                            query.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {query.status}
                          </span>
                        </div>
                        <p className="text-xs text-midnight-300 line-clamp-2 leading-relaxed font-medium">{query.query_text}</p>
                        <div className="flex items-center justify-between text-[8px] font-black text-midnight-600 uppercase tracking-widest">
                          <span>{query.product_name}</span>
                          <span>{new Date(query.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
               )}
            </div>
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Console Section */}
        <div className="lg:col-span-7 flex flex-col space-y-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedQuery ? (
              <motion.div 
                key={selectedQuery.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col space-y-6 overflow-hidden"
              >
<<<<<<< Updated upstream
                <div className="flex items-center justify-between px-2 text-slate-800">
=======
                <div className="flex items-center justify-between px-2">
>>>>>>> Stashed changes
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-accent-aurora" size={20} />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Resolution Console</h3>
                  </div>
                  <button 
                    onClick={() => setShowProductToolkit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-midnight-900 border border-white/5 rounded-xl text-[10px] font-black text-accent-aurora uppercase tracking-widest hover:bg-midnight-800 transition-all shadow-xl"
                  >
                    <BookOpen size={14} /> Intelligence Toolkit
                  </button>
                </div>

<<<<<<< Updated upstream
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-elevated p-10 flex flex-col overflow-hidden">
                   <div className="flex-1 space-y-12 overflow-y-auto custom-scrollbar pr-4">
                      {/* Customer Inquiry */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                              <User size={20} />
                           </div>
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">User Signal</p>
                             <div className="flex items-center gap-2">
                               <Mail size={12} className="text-slate-300" />
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedQuery.complainant_email}</span>
                             </div>
                           </div>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 text-slate-700 font-medium leading-loose shadow-inner italic">
                          "{selectedQuery.query_text}"
                        </div>
                      </div>

                      {/* AI Assisted Component */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-200">
                              <Sparkles size={20} />
                           </div>
                           <div className="flex-1 flex items-center justify-between">
                             <p className="text-[10px] font-black uppercase tracking-widest text-primary-700 leading-none">Intelligent Resolution Draft</p>
                             <div className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-400">Node v.2.4.0</div>
                           </div>
                        </div>
                        <div className="p-10 rounded-[2.5rem] border-2 border-primary-50 bg-white ring-1 ring-primary-100 text-slate-800 font-light leading-loose shadow-md relative group transition-all">
                           <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                              <Sparkles size={80} className="text-primary-600" />
                           </div>
                           <div className="relative z-10 space-y-4">
                              <p>{selectedQuery.ai_response || 'Neural link failed to provide a suggested response.'}</p>
                           </div>
=======
                <div className="flex-1 glass-card p-10 flex flex-col space-y-10 overflow-hidden">
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 space-y-12">
                      {/* Customer Inquiry */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-midnight-900 border border-white/5 flex items-center justify-center text-midnight-500 shadow-inner">
                              <User size={24} />
                           </div>
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-midnight-500 mb-1">Signal Input</p>
                             <p className="text-sm font-black text-white">{selectedQuery.customer_name} <span className="mx-2 text-midnight-700">|</span> <span className="text-accent-primary tracking-wider">{selectedQuery.complainant_email}</span></p>
                           </div>
                        </div>
                        <div className="p-10 bg-midnight-950/40 rounded-[3rem] border border-white/5 text-midnight-200 font-medium leading-loose shadow-inner relative italic">
                           <div className="absolute top-6 left-6 opacity-5"><MessageSquare size={40} /></div>
                           "{selectedQuery.query_text}"
                        </div>
                      </div>

                      {/* AI Draft Editor */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-accent-primary text-white flex items-center justify-center shadow-indigo-glow/20">
                              <Sparkles size={24} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-aurora italic leading-none">Draft Resolution</p>
                          </div>
                          <button 
                            onClick={() => setResolutionText(selectedQuery.ai_generated_answer)}
                            className="px-4 py-2 bg-midnight-900 border border-white/5 rounded-xl text-[9px] font-black text-midnight-500 hover:text-white transition-colors"
                          >
                            Reset to AI Draft
                          </button>
                        </div>

                        <div className="relative group">
                          <div className="absolute -inset-1 bg-aurora-gradient rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                          <textarea 
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            className="relative w-full h-[320px] bg-midnight-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 text-white font-light leading-[2] focus:ring-8 focus:ring-accent-primary/5 focus:border-accent-primary/30 outline-none transition-all shadow-2xl custom-scrollbar resize-none"
                            placeholder="Draft your resolution here..."
                          />
>>>>>>> Stashed changes
                        </div>
                      </div>
                   </div>

<<<<<<< Updated upstream
                   <div className="mt-10 pt-10 border-t border-slate-100">
                      {selectedQuery.status === 'Pending' ? (
                        <div className="flex gap-4">
                           <button onClick={() => setSelectedQuery(null)} className="btn-glass px-8">Dismiss</button>
                           <button 
                             onClick={() => handleResolve(selectedQuery.id)}
                             disabled={actionLoading}
                             className="btn-primary flex-1 py-5 flex items-center justify-center gap-4 group"
                           >
                              {actionLoading ? <Loader2 className="animate-spin" /> : (
                                <>
                                  <span className="font-black uppercase tracking-widest text-[11px] group-hover:mr-2 transition-all">Finalize & Dispatch Resolution</span>
                                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                              )}
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] text-emerald-600 gap-3">
                           <CheckCircle2 size={24} />
                           <span className="font-black uppercase tracking-widest text-[11px]">Inquiry Resolution Finalized</span>
=======
                   <div className="pt-8 border-t border-white/5 flex gap-6">
                      <button 
                        onClick={() => setSelectedQuery(null)}
                        className="px-10 py-5 bg-midnight-900 border border-white/5 rounded-[2rem] text-[11px] font-black text-midnight-500 uppercase tracking-widest hover:text-white transition-all shadow-xl active:scale-95"
                      >
                         Suspend
                      </button>
                      {selectedQuery.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleResolve(selectedQuery.id)}
                          disabled={actionLoading}
                          className="flex-1 py-5 bg-aurora-gradient rounded-[2rem] text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-aurora-glow flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 transition-all group"
                        >
                          {actionLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                              Deploy Resolution <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 py-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center gap-4 text-emerald-400">
                          <CheckCircle2 size={24} />
                          <span className="text-[11px] font-black uppercase tracking-widest">Resolution Dispatched Successfully</span>
>>>>>>> Stashed changes
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
<<<<<<< Updated upstream
                animate={{ opacity: 1 }} 
                className="flex-1 flex flex-col items-center justify-center space-y-6 text-center opacity-40 bg-slate-50/50 rounded-[3rem] border border-slate-100 border-dashed m-10"
              >
                 <div className="w-32 h-32 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <MessageSquare size={48} className="text-slate-200" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-300 tracking-tight uppercase">Select Signal Logic</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Awaiting Operator Interaction</p>
=======
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8 text-center opacity-30 bg-midnight-900/30 rounded-[4rem] border border-white/5 border-dashed m-10"
              >
                 <div className="w-40 h-40 bg-midnight-950 border border-white/5 rounded-full flex items-center justify-center shadow-inner">
                    <Layers size={64} className="text-midnight-500" />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white italic tracking-widest uppercase">Signal Standby</h4>
                    <p className="text-[10px] font-black text-midnight-600 uppercase tracking-[0.4em]">Awaiting logical interaction with signal queue.</p>
>>>>>>> Stashed changes
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
<<<<<<< Updated upstream
=======

      {/* Intelligence Toolkit Overlay */}
      <AnimatePresence>
        {showProductToolkit && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ x: 500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 500, opacity: 0 }}
              className="w-full max-w-xl h-full bg-midnight-950 border-l border-white/10 p-12 shadow-[-40px_0_100px_rgba(0,0,0,0.5)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-accent-aurora/10 text-accent-aurora flex items-center justify-center rounded-[1.25rem] border border-accent-aurora/20 shadow-indigo-glow/10">
                      <BookOpen size={28} />
                   </div>
                   <h3 className="text-3xl font-black text-white tracking-tighter italic">Entity <span className="text-accent-aurora text-glow-aurora">Toolkit</span></h3>
                 </div>
                 <button onClick={() => setShowProductToolkit(false)} className="p-4 bg-midnight-900 hover:bg-midnight-800 rounded-full text-midnight-400 border border-white/5 transition-all shadow-xl"><X /></button>
              </div>

              <div className="relative mb-10 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-600" size={16} />
                <input 
                  type="text" 
                  placeholder="Knowledge Search..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:ring-4 focus:ring-accent-aurora/10 outline-none transition-all placeholder:text-midnight-700"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="p-8 bg-midnight-900 rounded-[2.5rem] border border-white/5 space-y-6 hover:border-white/10 transition-all shadow-xl">
                    <div className="flex items-center justify-between">
                       <p className="text-xl font-black text-white italic">{product.name}</p>
                       <div className="w-10 h-10 bg-midnight-950 flex items-center justify-center rounded-xl text-accent-aurora border border-white/5 shadow-inner">
                          <Package size={20} />
                       </div>
                    </div>
                    <div className="p-6 bg-midnight-950/60 rounded-2xl border border-white/5 text-midnight-400 text-xs font-medium leading-[1.8] line-clamp-6">
                       {product.manual_content || "No intelligence context provided for this unit."}
                    </div>
                    <button className="w-full py-4 bg-midnight-950 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-midnight-600 hover:text-accent-aurora transition-all flex items-center justify-center gap-2">
                       <Layers size={14} /> Full Manual
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
>>>>>>> Stashed changes
    </div>
  );
};

const Package = ({ size, className }) => <Layers size={size} className={className} />;

export default SalesRepDashboard;
