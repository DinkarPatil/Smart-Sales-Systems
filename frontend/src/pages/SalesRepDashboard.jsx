import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Send, Search, Filter, History, Sparkles, User, Mail, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SalesRepDashboard = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE = 'http://127.0.0.1:8000/api/v1/sales';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/queries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Query node signal lost');
      const data = await response.json();
      setQueries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (queryId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/resolve-query/${queryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          final_answer: selectedQuery.ai_generated_answer // Sending AI answer as final for now or let user edit
        })
      });
      if (!response.ok) throw new Error('Resolution signal failed');
      await fetchQueries();
      setSelectedQuery(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <Loader2 size={48} className="text-accent-aurora animate-spin" />
      <p className="text-midnight-400 font-bold uppercase tracking-[0.2em] text-xs">Syncing Resolution Channels...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-3">
             <MessageSquare className="text-accent-aurora" size={32} />
             Query Resolver Core
          </h2>
          <p className="text-midnight-400 text-sm font-medium">Operator-assisted intelligence for high-conversion customer support.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchQueries} className="btn-secondary px-5 py-2.5">
             <RefreshCw size={16} /> Update Sync
          </button>
          <div className="h-8 w-[1px] bg-white/5 mx-1"></div>
          <div className="flex items-center gap-3 bg-midnight-900/50 border border-white/5 py-2 px-4 rounded-xl shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-midnight-400">Node Status: Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden">
        {/* Inbox Section */}
        <div className="lg:col-span-5 flex flex-col space-y-6 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-white">
              <History size={20} className="text-midnight-400" />
              <h3 className="text-lg font-black tracking-tight uppercase tracking-widest">Inbound Queue</h3>
            </div>
            <span className="text-[10px] font-black text-midnight-400 uppercase tracking-widest">{queries.filter(q => q.status === 'Pending').length} Pending</span>
          </div>

          <div className="flex-1 glass-panel rounded-[2.5rem] overflow-y-auto custom-scrollbar p-3 space-y-2">
             {queries.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-50">
                 <div className="w-16 h-16 rounded-full bg-midnight-900 border border-white/5 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-midnight-400" />
                 </div>
                 <p className="text-midnight-400 font-bold uppercase tracking-widest text-xs tracking-[0.2em]">Queue Channel Cleared</p>
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
                        ? 'bg-accent-primary/10 border-accent-aurora/30 shadow-sm' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                      }`}
                   >
                     {query.status === 'Pending' && (
                       <div className="absolute top-6 right-6 w-2 h-2 bg-accent-aurora rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.3)]"></div>
                     )}
                     <div className="flex flex-col gap-4">
                       <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            query.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-midnight-900 text-midnight-400 border-white/5'
                          }`}>
                             {query.status === 'Resolved' ? <CheckCircle2 size={16} /> : <MessageSquare size={16} />}
                          </div>
                          <div>
                             <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                               selectedQuery?.id === query.id ? 'text-accent-aurora' : 'text-midnight-400'
                             }`}>{query.complainant_email}</p>
                             <p className="text-[10px] text-midnight-500 mt-1 font-mono font-medium">{new Date(query.created_at).toLocaleTimeString()}</p>
                          </div>
                       </div>
                       <p className={`text-sm font-bold leading-relaxed line-clamp-2 ${
                         selectedQuery?.id === query.id ? 'text-white' : 'text-midnight-200 group-hover:text-white'
                       }`}>{query.query_text}</p>
                       
                       <div className="flex items-center justify-between pt-2">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                           query.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-midnight-900 text-midnight-400 border-white/5'
                         }`}>{query.status}</span>
                         <div className={`transition-all duration-300 ${selectedQuery?.id === query.id ? 'translate-x-1 text-accent-aurora opacity-100' : 'opacity-0 active:opacity-100'}`}>
                           <ChevronRight size={18} />
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </motion.div>
             )}
          </div>
        </div>

        {/* Resolution Console */}
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
                <div className="flex items-center justify-between px-2 text-white">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-amber-500" />
                    <h3 className="text-lg font-black tracking-tight uppercase tracking-widest">Resolution Console</h3>
                  </div>
                </div>

                <div className="flex-1 glass-card p-10 flex flex-col overflow-hidden">
                   <div className="flex-1 space-y-12 overflow-y-auto custom-scrollbar pr-4">
                      {/* Customer Inquiry */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-midnight-900 border border-white/5 flex items-center justify-center text-midnight-400 shadow-sm">
                              <User size={20} />
                           </div>
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-midnight-400 block mb-0.5">User Signal</p>
                             <div className="flex items-center gap-2">
                               <Mail size={12} className="text-midnight-500" />
                               <span className="text-[10px] font-bold text-midnight-500 uppercase tracking-widest">{selectedQuery.complainant_email}</span>
                             </div>
                           </div>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-midnight-900/50 border border-white/5 text-midnight-200 font-medium leading-loose shadow-inner italic">
                          "{selectedQuery.query_text}"
                        </div>
                      </div>

                      {/* AI Assisted Component */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-accent-primary text-white flex items-center justify-center shadow-lg shadow-accent-primary/20">
                              <Sparkles size={20} />
                           </div>
                           <div className="flex-1 flex items-center justify-between">
                             <p className="text-[10px] font-black uppercase tracking-widest text-accent-aurora leading-none">Intelligent Resolution Draft</p>
                             <div className="px-2 py-0.5 bg-midnight-900 border border-white/5 rounded-md text-[9px] font-black uppercase tracking-widest text-midnight-400">Node v.2.4.0</div>
                           </div>
                        </div>
                        <div className="p-10 rounded-[2.5rem] border-2 border-accent-primary/10 bg-midnight-900/40 backdrop-blur-xl text-white font-light leading-loose shadow-md relative group transition-all">
                           <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                              <Sparkles size={80} className="text-accent-primary" />
                           </div>
                           <div className="relative z-10 space-y-4">
                              <p>{selectedQuery.ai_generated_answer || 'Neural link failed to provide a suggested response.'}</p>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="mt-10 pt-10 border-t border-white/5">
                      {selectedQuery.status === 'Pending' ? (
                        <div className="flex gap-4">
                           <button onClick={() => setSelectedQuery(null)} className="btn-secondary px-8">Dismiss</button>
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
                        <div className="flex items-center justify-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-emerald-400 gap-3">
                           <CheckCircle2 size={24} />
                           <span className="font-black uppercase tracking-widest text-[11px]">Inquiry Resolution Finalized</span>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex-1 flex flex-col items-center justify-center space-y-6 text-center opacity-40 bg-midnight-900/50 rounded-[3rem] border border-white/5 border-dashed m-10"
              >
                 <div className="w-32 h-32 rounded-full bg-midnight-950 border border-white/5 flex items-center justify-center shadow-sm">
                    <MessageSquare size={48} className="text-midnight-400" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-xl font-black text-midnight-300 tracking-tight uppercase">Select Signal Logic</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-midnight-400">Awaiting Operator Interaction</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

  );
};

export default SalesRepDashboard;
