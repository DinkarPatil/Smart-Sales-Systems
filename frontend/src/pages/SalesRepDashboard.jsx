import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Send, Search, Filter, Loader2, Sparkles, ChevronRight, User, MoreVertical, LayoutGrid, Database, PieChart } from 'lucide-react';
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
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE = 'http://127.0.0.1:8000/api/v1/sales';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queriesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!queriesRes.ok || !statsRes.ok) throw new Error('Operative data link failed');

      const [queriesData, statsData] = await Promise.all([
        queriesRes.json(),
        statsRes.json()
      ]);

      setQueries(queriesData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (queryId) => {
    if (!resolutionText.trim()) return;
    if (!window.confirm("FINAL DISPATCH: Respond to customer?")) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'Resolved',
          resolution: resolutionText 
        })
      });

      if (!response.ok) throw new Error('Resolution signal lost');
      
      await fetchData();
      setSelectedQuery(null);
      setResolutionText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQueries = queries.filter(q => 
    q.query_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.customer_metadata?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-accent-secondary/20 rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Synchronizing Operative Node...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Operative Access: Sales Rep</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
             Resolution <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">Command</span>
          </h2>
          <p className="text-slate-400 font-medium">Customer inquiry triage and signal orchestration protocols</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-amethyst-900/60 border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                 <p className="text-lg font-black text-accent-secondary tracking-tighter">{stats.efficiency_score}%</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10"></div>
              <div className="text-left">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resp Time</p>
                 <p className="text-lg font-black text-white tracking-tighter">{stats.avg_response_time}m</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Signal List Panel */}
        <div className="xl:col-span-12 2xl:col-span-5 flex flex-col space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-accent-primary/10 rounded-lg">
                    <MessageSquare size={24} className="text-accent-primary" />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Inquiry Pool</h3>
              </div>
              <div className="bg-amethyst-900/40 p-2 rounded-xl border border-white/5">
                 <span className="px-3 py-1 bg-accent-secondary/10 text-accent-secondary rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {queries.filter(q => q.status === 'Pending').length} Active
                 </span>
              </div>
            </div>

            <div className="relative group">
               <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="Filter signals by text or node..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-amethyst-950/20 border border-white/5 rounded-[2rem] py-5 pl-14 pr-8 text-sm text-white focus:ring-4 focus:ring-accent-primary/10 transition-all outline-none"
               />
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
               <AnimatePresence>
                 {filteredQueries.map((query, i) => (
                   <motion.div 
                     layout
                     key={query.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.05 }}
                     onClick={() => setSelectedQuery(query)}
                     className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${
                       selectedQuery?.id === query.id 
                       ? 'bg-amethyst-900 border-accent-secondary shadow-fuchsia-glow/10' 
                       : 'bg-amethyst-900/40 border-white/5 hover:border-white/10'
                     }`}
                   >
                     <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex flex-col gap-1">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Node: {query.id}</p>
                           <h4 className="text-sm font-black text-white italic tracking-tight">{query.customer_metadata?.full_name || 'Anonymous User'}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
                          query.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-glow/10' : 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20 shadow-fuchsia-glow/10'
                        }`}>
                          {query.status}
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 relative z-10">{query.query_text}</p>
                     
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-slate-600" />
                           <span className="text-[9px] font-bold text-slate-600 italic">{new Date(query.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {query.assigned_to && (
                           <div className="flex items-center gap-2 px-2 py-1 bg-amethyst-950 rounded-lg border border-white/5">
                              <User size={10} className="text-accent-secondary" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest tracking-tighter">Assigned: Me</span>
                           </div>
                        )}
                     </div>
                     
                     <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
        </div>

        {/* Triage Panel */}
        <div className="xl:col-span-12 2xl:col-span-7">
           <AnimatePresence mode="wait">
             {selectedQuery ? (
               <motion.div 
                 key="details"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="bg-amethyst-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-12 shadow-2xl relative overflow-hidden min-h-[700px] flex flex-col"
               >
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-amethyst-900 border border-white/5 rounded-[1.5rem] flex items-center justify-center text-accent-secondary shadow-inner">
                          <MessageSquare size={32} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Signal Inspection</p>
                          <h4 className="text-3xl font-black text-white tracking-tighter italic">Process Node <span className="text-accent-secondary">#{selectedQuery.id}</span></h4>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedQuery(null)}
                      className="px-6 py-3 bg-amethyst-900/60 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white border border-white/5 transition-all"
                    >
                      Deselect
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="p-8 bg-amethyst-900/40 border border-white/5 rounded-[2.5rem] shadow-inner">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Customer Intelligence</p>
                       <div className="space-y-4">
                          {[
                            { label: 'Identifier', val: selectedQuery.customer_metadata?.full_name || 'N/A' },
                            { label: 'Origin', val: selectedQuery.customer_metadata?.company || 'External Entity' },
                            { label: 'Channel', val: 'SMS Gateway Sync' },
                          ].map((data, i) => (
                            <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-[10px] font-bold text-slate-600">{data.label}</span>
                               <span className="text-[11px] font-black text-white italic">{data.val}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="p-8 bg-amethyst-900/40 border border-white/5 rounded-[2.5rem] shadow-inner">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Temporal Sync</p>
                       <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-amethyst-950 rounded-2xl border border-white/5">
                             <Clock className="text-rose-400" size={18} />
                             <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Entry Timestamp</p>
                                <p className="text-xs font-bold text-white">{new Date(selectedQuery.created_at).toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-amethyst-950 rounded-2xl border border-white/5">
                             <Clock className="text-emerald-400" size={18} />
                             <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Response SLA Status</p>
                                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">OPTIMAL</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mb-12">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2 mb-4 block">Original Signal Text</label>
                    <div className="p-8 bg-amethyst-900/60 rounded-[2rem] border border-white/5 shadow-inner text-sm leading-relaxed text-slate-200 italic font-medium">
                       "{selectedQuery.query_text}"
                    </div>
                 </div>

                 <div className="mt-auto space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2 block">Resolution Dispatch</label>
                    <div className="relative">
                       <textarea 
                         value={resolutionText}
                         onChange={(e) => setResolutionText(e.target.value)}
                         placeholder="Construct resolution signal for node dispatch..."
                         className="w-full h-48 bg-amethyst-900 border border-white/10 rounded-[2.5rem] p-8 text-sm focus:ring-4 focus:ring-accent-secondary/10 focus:border-accent-secondary/40 outline-none transition-all resize-none text-white shadow-2xl"
                       />
                       <button 
                         onClick={() => handleResolve(selectedQuery.id)}
                         disabled={actionLoading || !resolutionText.trim()}
                         className="absolute bottom-6 right-6 p-5 bg-amethyst-gradient rounded-2xl text-white shadow-fuchsia-glow hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all z-10"
                       >
                         {actionLoading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                       </button>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                       <AlertTriangle size={14} className="text-slate-600" />
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Response will be neutralized and dispatched to customer node immediately.</p>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="h-full flex flex-col items-center justify-center bg-amethyst-950/10 rounded-[3rem] border border-dashed border-white/5 p-20 min-h-[700px]"
               >
                 <div className="relative mb-10">
                    <div className="w-24 h-24 bg-amethyst-900 border border-white/5 rounded-[2rem] flex items-center justify-center text-slate-600">
                       <Sparkles size={48} />
                    </div>
                    <div className="absolute inset-0 bg-accent-secondary/10 blur-3xl opacity-50"></div>
                 </div>
                 <h3 className="text-2xl font-black text-white italic tracking-tighter mb-4 uppercase">No Node Selected</h3>
                 <p className="text-xs text-slate-600 font-bold uppercase tracking-widest text-center max-w-sm leading-relaxed">Select an active signal node from the pool to construct a priority resolution dispatch.</p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SalesRepDashboard;
