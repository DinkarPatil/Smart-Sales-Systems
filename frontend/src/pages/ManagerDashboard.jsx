import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Users, TrendingUp, AlertCircle, Calendar, Download, Filter, Search, ChevronRight, Activity, Loader2, Star, Target, Shield, BookOpen, Send, UserCheck, HeartPulse, Sparkles, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
<<<<<<< Updated upstream
    totalQueries: 482,
    resolvedQueries: 438,
    avgResponseTime: "1.2m",
    conversionRate: "68%",
    pendingQueries: 44
=======
    company_name: '',
    total_queries: 0,
    pending_queries: 0,
    resolved_queries: 0,
    positive_sentiment_pct: 0,
    team_count: 0
>>>>>>> Stashed changes
  });
  const [team, setTeam] = useState([]);
  const [queries, setQueries] = useState([]);
  const [products, setProducts] = useState([]);
  
<<<<<<< Updated upstream
  const [loading, setLoading] = useState(false);
=======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', manual_content: '' });

  const API_BASE = 'http://127.0.0.1:8000/api/v1/manager';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);
>>>>>>> Stashed changes

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, teamRes, queriesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/team`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!statsRes.ok) throw new Error('Operational link failure');
      
      const [statsData, teamData, queriesData, productsData] = await Promise.all([
        statsRes.json(),
        teamRes.json(),
        queriesRes.json(),
        productsRes.json()
      ]);
      
      setStats(statsData);
      setTeam(teamData);
      setQueries(queriesData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRep = async (queryId, repId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}?sales_rep_id=${repId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Assignment signal lost');
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingProduct ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
      const method = editingProduct ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });
      
      if (!response.ok) throw new Error('Intelligence injection failed');
      await fetchData();
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', manual_content: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQueries = queries.filter(q => 
    q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.query_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) return (
<<<<<<< Updated upstream
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <Loader2 size={48} className="text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Aggregating Global Analytics...</p>
=======
    <div className="flex flex-col items-center justify-center h-full py-32 gap-6 bg-midnight-950/20 rounded-[3rem] border border-white/5 backdrop-blur-xl">
      <Loader2 size={48} className="text-accent-aurora animate-spin" />
      <p className="text-midnight-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Tactical Metrics...</p>
>>>>>>> Stashed changes
    </div>
  );

  return (
<<<<<<< Updated upstream
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
=======
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
>>>>>>> Stashed changes
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
<<<<<<< Updated upstream
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
             <BarChart3 className="text-primary-600" size={32} />
             Business Intelligence Suite
          </h2>
          <p className="text-slate-500 text-sm font-medium">Real-time oversight of conversion metrics and machine-assisted resolution.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
             <Download size={18} /> Export Analytics
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
          <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Inbound', value: stats.totalQueries, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', pct: '+12%' },
          { label: 'AI Resolution', value: stats.resolvedQueries, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', pct: '+8%' },
          { label: 'Conversion', value: stats.conversionRate, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', pct: '+2%' },
          { label: 'Pending Cycle', value: stats.pendingQueries, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', pct: '-5%' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-soft relative overflow-hidden group hover:border-primary-100 transition-all"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                stat.pct.startsWith('+') 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {stat.pct}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 relative z-10">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight relative z-10">{stat.value}</p>
            
            {/* Subtle background decoration */}
            <div className="absolute top-[-1rem] right-[-1rem] text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
               <stat.icon size={80} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Main Analytics Visual */}
        <section className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Activity className="text-primary-600" size={24} />
            <h3 className="text-xl font-black tracking-tight uppercase tracking-widest text-slate-800">Operational Flow</h3>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 min-h-[420px] shadow-soft relative overflow-hidden flex flex-col justify-end group">
            <div className="absolute top-10 left-10 flex items-center gap-3">
               {[
                 { label: 'Query Volume', color: 'bg-primary-600' },
                 { label: 'AI Assistance', color: 'bg-indigo-600' },
                 { label: 'Direct Response', color: 'bg-slate-200' }
               ].map((dot, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${dot.color}`}></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dot.label}</span>
                 </div>
               ))}
            </div>

            <div className="flex items-end justify-between h-56 gap-4 relative z-10">
               {[55, 35, 75, 45, 95, 65, 85, 40, 60, 50, 70, 90].map((val, i) => (
                 <motion.div 
                   key={i}
                   initial={{ height: 0 }}
                   animate={{ height: `${val}%` }}
                   transition={{ delay: i * 0.05, duration: 1.2, ease: 'easeOut' }}
                   className={`flex-1 rounded-t-2xl relative overflow-hidden group/bar transition-all ${
                     i === 11 ? 'bg-primary-600 shadow-lg shadow-primary-100' : 'bg-slate-100 hover:bg-primary-100'
                   }`}
                 >
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/[0.03] to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                 </motion.div>
               ))}
            </div>
            
            <div className="flex items-center justify-between mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 pt-6 border-t border-slate-100">
               <span>P-NODE 01</span>
               <span>P-NODE 04</span>
               <span>P-NODE 08</span>
               <span>P-NODE 12</span>
               <span>REALTIME SIGNAL</span>
            </div>
          </div>
        </section>

        {/* Priority Segments */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <PieChart className="text-indigo-600" size={24} />
            <h3 className="text-xl font-black tracking-tight uppercase tracking-widest text-slate-800">Domain Metrics</h3>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-soft flex flex-col space-y-10">
             <div className="flex justify-center p-6 relative">
                <div className="w-56 h-56 rounded-full border-[15px] border-slate-50 border-t-primary-600 border-l-indigo-600 shadow-inner flex flex-col items-center justify-center relative">
                   <p className="text-4xl font-black text-slate-900 tracking-tighter">88%</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Consistency</p>
                   
                   <div className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-soft text-primary-600">
                      <Star size={14} />
                   </div>
                </div>
             </div>

             <div className="space-y-5">
               {[
                 { name: 'Direct Sales', val: '42%', color: 'bg-primary-600' },
                 { name: 'Hardware Support', val: '28%', color: 'bg-indigo-600' },
                 { name: 'General Support', val: '18%', color: 'bg-violet-600' },
                 { name: 'Miscellaneous', val: '12%', color: 'bg-slate-200' },
               ].map((item, i) => (
                 <div key={i} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">{item.name}</span>
                       <span className="text-[10px] font-bold font-mono text-slate-800">{item.val}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: item.val }}
                         transition={{ duration: 1.5, delay: i * 0.1 }}
                         className={`h-full ${item.color} rounded-full`}
                       />
                    </div>
                 </div>
               ))}
             </div>

             <button className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                Full Segmentation Details <ChevronRight size={14} />
             </button>
          </div>
        </section>
      </div>

      {/* Activity Monitor */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Calendar className="text-emerald-600" size={24} />
            <h3 className="text-xl font-black tracking-tight uppercase tracking-widest text-slate-800">Operational Log</h3>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">Full System History</button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-soft overflow-hidden">
           <div className="divide-y divide-slate-100">
              {[
                { user: 'Identity: Admin Alpha', activity: 'Validated 4 Operator Credentials', time: '12m AGO', status: 'COMPLETED' },
                { user: 'Node: TechCorp', activity: 'Injected 2 Intelligence Vectors', time: '1h AGO', status: 'COMPLETED' },
                { user: 'Unit: Sales Delta', activity: 'Resolved Vector Conflict ID #902', time: '2h AGO', status: 'SUCCESS' },
                { user: 'System Core', activity: 'Temporal RAG Indexing Finalized', time: 'BOOT PHASE', status: 'SYSTEM_OK' },
              ].map((log, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary-600 group-hover:border group-hover:border-slate-200 transition-all">
                         <Search size={20} />
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.user}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              log.status.includes('OK') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>{log.status}</span>
                         </div>
                         <p className="font-bold text-slate-900 text-sm">{log.activity}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono font-black text-slate-300">{log.time}</span>
                      <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                         <ChevronRight size={16} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
=======
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-indigo-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500">Node: {stats.company_name}</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
             Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora">Control</span>
          </h2>
          <p className="text-midnight-400 font-medium max-w-xl">Operational lead console for team orchestration and regional performance oversight.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', description: '', manual_content: '' });
              setShowProductModal(true);
            }}
            className="px-8 py-4 bg-midnight-900 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-midnight-800 hover:border-white/10 transition-all flex items-center gap-3"
          >
             <Plus size={18} className="text-accent-aurora" /> Provision Item
          </button>
          <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
          <div className="flex items-center gap-3 bg-midnight-900 border border-white/5 py-3 px-6 rounded-2xl">
             <HeartPulse size={18} className="text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-emerald-glow">System Stable</span>
          </div>
        </div>
      </div>

      {/* Operations KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Signal Volume', value: stats.total_queries, sub: 'Inquiries recorded', icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Neural Resolution', value: stats.resolved_queries, sub: 'Closed cases', icon: Sparkles, color: 'text-accent-aurora', bg: 'bg-accent-aurora/10' },
          { label: 'Company Sentiment', value: `${stats.positive_sentiment_pct}%`, sub: 'Positive lead trace', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Operative Pool', value: stats.team_count, sub: 'Active Sales Reps', icon: Users, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-midnight-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all"
          >
             <div className={`p-4 rounded-2xl mb-6 w-fit ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2">{stat.label}</p>
             <div className="flex items-baseline gap-3">
               <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
               <span className="text-[10px] font-bold text-midnight-600 italic whitespace-nowrap">{stat.sub}</span>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Mission Control: Inquiry Oversight */}
        <section className="xl:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                 <Target className="text-accent-primary" size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Inquiry Oversight</h3>
            </div>
            <div className="relative group min-w-[350px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-600" />
              <input 
                type="text" 
                placeholder="Global signal filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-midnight-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-white focus:ring-4 focus:ring-accent-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="bg-midnight-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-midnight-950/60 border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 whitespace-nowrap">Customer Trace</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-center">Neural Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Clearance Actor</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-right">Orchestration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {filteredQueries.length === 0 ? (
                     <tr><td colSpan="4" className="px-8 py-20 text-center text-midnight-600 font-bold uppercase tracking-widest italic text-[11px]">No active signals matching filter parameters.</td></tr>
                   ) : (
                     filteredQueries.map(query => (
                       <tr key={query.id} className="group hover:bg-white/[0.02] transition-colors">
                         <td className="px-8 py-6">
                            <p className="text-[11px] font-black text-white leading-tight">{query.customer_name}</p>
                            <p className="text-[9px] text-midnight-500 font-bold uppercase tracking-widest mt-1">{query.complainant_email}</p>
                            <p className="text-[10px] text-midnight-600 mt-2 line-clamp-1 italic">"{query.query_text}"</p>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex justify-center">
                               <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                                 query.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                               }`}>
                                 {query.status}
                               </span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-midnight-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-accent-primary uppercase">
                                  {query.sales_rep_id ? team.find(r => r.id === query.sales_rep_id)?.full_name?.charAt(0) || 'U' : 'None'}
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-white">{query.sales_rep_id ? team.find(r => r.id === query.sales_rep_id)?.full_name : 'Unassigned Pool'}</p>
                                  <p className="text-[9px] text-midnight-600 font-bold uppercase tracking-widest">{query.sales_rep_id ? 'Active Assent' : 'Awaiting Assignment'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className="flex justify-end group/select gap-2">
                               <select 
                                 onChange={(e) => handleAssignRep(query.id, e.target.value)}
                                 value={query.sales_rep_id || ''}
                                 className="bg-midnight-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-midnight-400 px-3 py-2 rounded-xl outline-none focus:border-accent-primary focus:text-accent-primary transition-all opacity-0 group-hover:opacity-100 group-hover/select:translate-x-0 translate-x-2"
                               >
                                  <option value="">Reassign Operative</option>
                                  {team.map(rep => <option key={rep.id} value={rep.id}>{rep.full_name}</option>)}
                               </select>
                               <div className="p-2 bg-midnight-900 rounded-lg group-hover:bg-accent-primary group-hover:text-white transition-all text-midnight-500">
                                  <UserCheck size={16} />
                               </div>
                            </div>
                         </td>
                       </tr>
                     ))
                   )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Tactical Overview: Team & Sentiment */}
        <div className="xl:col-span-4 space-y-12">
            {/* Team Registry */}
            <section className="space-y-8">
               <div className="flex items-center gap-4 px-2">
                  <div className="p-2 bg-accent-aurora/10 rounded-lg">
                     <Users className="text-accent-aurora" size={24} />
                  </div>
                  <h3 className="text-xl font-black tracking-widest uppercase text-white">Personnel Pulse</h3>
               </div>

               <div className="bg-midnight-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 shadow-2xl space-y-6 border-t-accent-aurora/20">
                  <div className="space-y-4">
                     {team.map(rep => (
                       <div key={rep.id} className="p-6 bg-midnight-900/60 rounded-[2rem] border border-white/5 hover:border-accent-aurora/30 transition-all group">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-2xl bg-midnight-950 border border-white/5 flex items-center justify-center text-accent-aurora text-xs font-black shadow-inner">
                                  {rep.full_name?.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-[11px] font-black text-white">{rep.full_name}</p>
                                  <p className="text-[9px] text-midnight-600 font-bold uppercase tracking-widest">{rep.role}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-glow"></span>
                               <span className="text-[9px] font-black text-midnight-600 uppercase tracking-widest">Active</span>
                            </div>
                         </div>
                         <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                            <div className="flex-1 text-center">
                               <p className="text-[8px] font-black uppercase tracking-widest text-midnight-600 mb-1">Load</p>
                               <p className="text-lg font-black text-white">{rep.active_queries}</p>
                            </div>
                            <div className="w-[1px] h-6 bg-white/5"></div>
                            <div className="flex-1 text-center">
                               <p className="text-[8px] font-black uppercase tracking-widest text-midnight-600 mb-1">Resolved</p>
                               <p className="text-lg font-black text-white">{rep.resolved_queries}</p>
                            </div>
                         </div>
                       </div>
                     ))}
                  </div>
               </div>
            </section>

            {/* Knowledge Vault: Product Mini-Registry */}
            <section className="space-y-8">
               <div className="flex items-center gap-4 px-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                     <BookOpen className="text-indigo-400" size={24} />
                  </div>
                  <h3 className="text-xl font-black tracking-widest uppercase text-white">Knowledge Vault</h3>
               </div>

               <div className="bg-midnight-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 shadow-2xl space-y-6">
                  <div className="space-y-3">
                     {products.slice(0, 3).map(product => (
                        <div 
                          key={product.id} 
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm({ name: product.name, description: product.description || '', manual_content: product.manual_content || '' });
                            setShowProductModal(true);
                          }}
                          className="flex items-center justify-between p-5 bg-midnight-900 border border-white/5 rounded-2xl cursor-pointer hover:bg-midnight-800 hover:border-indigo-500/30 transition-all group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-midnight-950 rounded-xl text-indigo-400 group-hover:text-white transition-colors">
                                 <Shield size={18} />
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-white">{product.name}</p>
                                 <p className="text-[9px] text-midnight-600 font-bold uppercase tracking-widest">{product.manual_content ? 'AI Trained' : 'Incomplete'}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className="text-midnight-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                     ))}
                  </div>
                  <button 
                    onClick={() => {
                       setEditingProduct(null);
                       setProductForm({ name: '', description: '', manual_content: '' });
                       setShowProductModal(true);
                    }}
                    className="w-full py-4 bg-midnight-900/40 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-midnight-500 hover:text-white hover:bg-midnight-800 transition-all flex items-center justify-center gap-3"
                  >
                     Review Intelligence Pool <Search size={14} />
                  </button>
               </div>
            </section>
>>>>>>> Stashed changes
        </div>
      </div>

      {/* Intelligence Ingestion Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-midnight-950 border border-white/10 rounded-[4rem] p-12 z-10 shadow-[0_0_150px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[100px]"></div>
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-midnight-900 text-accent-aurora flex items-center justify-center border border-white/5 shadow-inner">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter italic">Knowledge <span className="text-accent-aurora">Injection</span></h3>
                    <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.4em] mt-2">Neural Link v.2.4 Active</p>
                  </div>
                </div>
                <button onClick={() => setShowProductModal(false)} className="p-4 bg-midnight-900 rounded-full text-midnight-400 hover:text-white transition-all shadow-xl"><X /></button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Product Protocol Name</label>
                  <input 
                    required autoFocus
                    value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                    placeholder="e.g. NEXUS CORE PLATFORM"
                    className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-aurora/10 outline-none transition-all placeholder:text-midnight-700 text-base font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Brief Intelligence Description</label>
                  <input 
                    value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Briefly overview the purpose for the AI context..."
                    className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all placeholder:text-midnight-700 text-sm font-medium text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Product Manual (AI Training Context)</label>
                  <textarea 
                    value={productForm.manual_content} onChange={e => setProductForm({...productForm, manual_content: e.target.value})}
                    placeholder="Paste full documentation text here. This will be vectorized for the RAG intelligence layer."
                    className="w-full h-56 bg-midnight-900 border border-white/5 rounded-[2.5rem] py-8 px-10 focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all resize-none text-[13px] leading-loose font-medium text-midnight-300 shadow-inner custom-scrollbar"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" disabled={actionLoading}
                    className="w-full py-6 bg-aurora-gradient rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-aurora-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Finalize Injection</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Plus = ({ size, className }) => <BookOpen size={size} className={className} />;

export default ManagerDashboard;
