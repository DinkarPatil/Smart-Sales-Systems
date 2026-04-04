import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Sparkles, Database, Plus, Search, Filter, Loader2, ChevronRight, BarChart3, Clock, AlertCircle, Edit2, CheckCircle, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    total_queries: 0,
    resolved_queries: 0,
    active_sales_reps: 0,
    sentiment_score: 0
  });
  const [team, setTeam] = useState([]);
  const [queries, setQueries] = useState([]);
  const [companyStatus, setCompanyStatus] = useState({ name: '', admin_suspended: false, manager_suspended: false, is_active: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tactical Mode State
  const [selectedRep, setSelectedRep] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const API_BASE = 'http://127.0.0.1:8000/api/v1/manager';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, teamRes, queriesRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/team`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/company/status`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!statsRes.ok || !teamRes.ok || !queriesRes.ok || !statusRes.ok) throw new Error('Tactical link failure');

      const [statsData, teamData, queriesData, statusData] = await Promise.all([
        statsRes.json(),
        teamRes.json(),
        queriesRes.json(),
        statusRes.json()
      ]);

      setStats(statsData);
      setTeam(teamData);
      setQueries(queriesData);
      setCompanyStatus(statusData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (queryId, repId) => {
    try {
      setIsAssigning(true);
      const response = await fetch(`${API_BASE}/queries/${queryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assigned_to: repId })
      });
      if (!response.ok) throw new Error('Assignment signal lost');
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleToggleSuspension = async () => {
    const action = companyStatus.manager_suspended ? "REACTIVATE" : "AUTHORIZE SUSPENSION";
    if (!window.confirm(`CRITICAL: Are you sure you want to ${action} operations for ${companyStatus.name}? This will contribute to a dual-lock deactivation.`)) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/company/suspend`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Authorization update failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
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
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Establishing Tactical Link...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse shadow-fuchsia-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Corporate Clearance Active</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
             Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">Control</span>
          </h2>
          <p className="text-slate-400 font-medium">Tactical inquiry management and personnel orchestration portal</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
           <div className={`px-6 py-4 rounded-2xl border flex items-center gap-6 shadow-xl transition-all ${!companyStatus.is_active ? 'bg-accent-secondary/10 border-accent-secondary/30' : 'bg-amethyst-900/60 border-white/5'}`}>
              <div className="text-center">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dual-Lock Consensus</p>
                 <div className="flex gap-1.5 items-center justify-center">
                    <div className={`w-2.5 h-1 rounded-full ${companyStatus.admin_suspended ? 'bg-accent-secondary' : 'bg-emerald-500'}`}></div>
                    <div className={`w-2.5 h-1 rounded-full ${companyStatus.manager_suspended ? 'bg-accent-secondary shadow-fuchsia-glow' : 'bg-emerald-500'}`}></div>
                 </div>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <button 
                onClick={handleToggleSuspension} disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                   companyStatus.manager_suspended 
                   ? 'bg-accent-secondary text-white shadow-fuchsia-glow hover:scale-105' 
                   : 'bg-amethyst-950 text-slate-500 hover:text-white hover:bg-amethyst-900'
                }`}
              >
                 {companyStatus.manager_suspended ? 'Awaiting Reactivation' : 'Sign Suspension'}
              </button>
           </div>

           <div className="px-8 py-4 bg-amethyst-900/60 border border-white/5 rounded-2xl flex items-center gap-6 shadow-xl">
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Company Sentiment</p>
                 <p className={`text-xl font-black tracking-tighter ${stats.sentiment_score > 70 ? 'text-emerald-400' : 'text-accent-secondary'}`}>{stats.sentiment_score}%</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10"></div>
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Personnel</p>
                 <p className="text-xl font-black text-white tracking-tighter">{stats.active_sales_reps}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { label: 'Total Inquiries', val: stats.total_queries, icon: MessageSquare, sub: 'All-time volume' },
           { label: 'Resolution Rate', val: `${Math.round((stats.resolved_queries / stats.total_queries) * 100 || 0)}%`, icon: CheckCircle, sub: `${stats.resolved_queries} finalized` },
           { label: 'Unassigned Nodes', val: queries.filter(q => !q.assigned_to).length, icon: AlertCircle, sub: 'Immediate triage required' },
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-amethyst-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 group hover:border-accent-secondary/30 transition-all shadow-2xl relative overflow-hidden"
           >
             <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-amethyst-950 rounded-2xl border border-white/5 text-accent-secondary">
                   <stat.icon size={24} />
                </div>
                <MoreVertical size={18} className="text-slate-600" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{stat.label}</p>
             <p className="text-4xl font-black text-white tracking-tighter mb-2">{stat.val}</p>
             <p className="text-[10px] font-bold text-slate-600 italic tracking-wide">{stat.sub}</p>
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Personnel Pulse Section */}
        <div className="xl:col-span-12 2xl:col-span-4 flex flex-col space-y-8">
           <div className="flex items-center gap-4 px-2">
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                 <Users size={24} className="text-accent-primary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Personnel Pulse</h3>
           </div>

           <div className="space-y-6">
              {team.map((member, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={member.id}
                  className="bg-amethyst-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2rem] group hover:border-accent-primary/40 transition-all cursor-pointer shadow-xl"
                  onClick={() => setSelectedRep(member)}
                >
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amethyst-950 border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-inner">
                           {member.full_name?.charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-black text-white tracking-tight">{member.full_name}</p>
                           <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">{member.email}</p>
                        </div>
                     </div>
                     <span className={`w-2.5 h-2.5 rounded-full ${member.is_active ? 'bg-emerald-500 shadow-emerald-glow' : 'bg-slate-700'}`}></span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-amethyst-950/60 rounded-xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Active Load</p>
                        <p className="text-base font-black text-white">{member.active_queries || 0}</p>
                     </div>
                     <div className="p-3 bg-amethyst-950/60 rounded-xl border border-white/5 text-accent-secondary">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Resolved</p>
                        <p className="text-base font-black">{member.resolved_queries || 0}</p>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Global Inquiry Stream */}
        <div className="xl:col-span-12 2xl:col-span-8 flex flex-col space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-accent-secondary/10 rounded-lg">
                    <Database size={24} className="text-accent-secondary" />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Tactical Signal Stream</h3>
              </div>
              <div className="relative group">
                 <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                 <input 
                   type="text" 
                   placeholder="Filter company signals..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="bg-amethyst-950/40 border border-white/5 rounded-[2rem] py-4 pl-14 pr-8 text-xs text-white focus:ring-4 focus:ring-accent-secondary/10 transition-all outline-none w-[350px] shadow-2xl"
                 />
              </div>
            </div>

            <div className="bg-amethyst-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-amethyst-950/60 border-b border-white/5">
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Inquiry Origin</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Context</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Orchestration</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {filteredQueries.map(query => (
                        <tr key={query.id} className="group hover:bg-white/[0.02] transition-colors">
                           <td className="px-8 py-6">
                              <p className="text-[11px] font-black text-white">{query.customer_metadata?.full_name || 'Anonymous'}</p>
                              <p className="text-[9px] font-bold text-slate-600 tracking-wider">{query.customer_metadata?.phone || 'SMS CHANNEL'}</p>
                           </td>
                           <td className="px-8 py-6 max-w-xs">
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">"{query.query_text}"</p>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <select 
                                   value={query.assigned_to || ''}
                                   onChange={(e) => handleAssign(query.id, e.target.value)}
                                   disabled={isAssigning}
                                   className="bg-amethyst-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 rounded-xl outline-none focus:border-accent-primary focus:text-accent-primary transition-all shadow-inner"
                                 >
                                    <option value="">Pending Assignment</option>
                                    {team.map(rep => <option key={rep.id} value={rep.id}>{rep.full_name}</option>)}
                                 </select>
                                 {query.assigned_to && <CheckCircle size={14} className="text-emerald-500" />}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                                query.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-glow/20' : 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20'
                              }`}>
                                {query.status}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
