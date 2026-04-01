import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Users, TrendingUp, AlertCircle, Calendar, Download, Filter, Search, ChevronRight, Activity, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalQueries: 0,
    resolvedQueries: 0,
    avgResponseTime: "0m",
    conversionRate: "0%",
    pendingQueries: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/v1/manager/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalQueries: data.total_queries,
            resolvedQueries: data.resolved_queries,
            avgResponseTime: "1.2m", // Mock or from API if added
            conversionRate: `${Math.round((data.resolved_queries / (data.total_queries || 1)) * 100)}%`,
            pendingQueries: data.pending_queries
          });
        }
      } catch (err) {
        setError("System link failed to aggregate metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-32 gap-6 bg-midnight-950/20 rounded-[3rem] border border-white/5 backdrop-blur-xl">
      <div className="relative">
        <Loader2 size={48} className="text-accent-aurora animate-spin" />
        <div className="absolute inset-0 blur-xl bg-accent-aurora/20 animate-pulse"></div>
      </div>
      <p className="text-midnight-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Operational Data...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-accent-aurora animate-pulse shadow-aurora-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500">Analytics Active</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-4">
             <BarChart3 className="text-accent-primary" size={36} />
             Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora italic">Metrics</span>
          </h2>
          <p className="text-midnight-400 text-sm font-medium max-w-xl">Comprehensive oversight of customer inquiries, resolution efficiency, and automated system performance.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-midnight-900 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-midnight-800 hover:border-white/10 transition-all flex items-center gap-3">
             <Download size={18} className="text-accent-aurora" /> Generate Report
          </button>
          <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
          <button className="p-4 bg-midnight-900 border border-white/5 rounded-2xl text-midnight-400 hover:text-white transition-all shadow-xl hover:border-white/10">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {[
          { label: 'Total Inquiries', value: stats.totalQueries, icon: TrendingUp, color: 'text-accent-primary', bg: 'bg-accent-primary/10', pct: '+12%', shadow: 'shadow-indigo-glow/10' },
          { label: 'AI Resolved', value: stats.resolvedQueries, icon: Activity, color: 'text-accent-aurora', bg: 'bg-accent-aurora/10', pct: '+8%', shadow: 'shadow-aurora-glow/10' },
          { label: 'Conversion', value: stats.conversionRate, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10', pct: '+2%', shadow: 'shadow-indigo-glow/5' },
          { label: 'Awaiting Review', value: stats.pendingQueries, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10', pct: '-5%', shadow: 'shadow-amber-900/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className={`bg-midnight-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 ${stat.shadow} relative overflow-hidden group hover:border-white/10 transition-all`}
          >
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${
                stat.pct.startsWith('+') 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {stat.pct}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2 relative z-10">{stat.label}</p>
            <p className="text-4xl font-black text-white tracking-tight relative z-10">{stat.value}</p>
            
            {/* Subtle background decoration */}
            <div className="absolute top-[-1rem] right-[-1rem] text-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
               <stat.icon size={100} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Main Analytics Visual */}
        <section className="xl:col-span-2 space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
               <Activity className="text-accent-primary" size={24} />
            </div>
            <h3 className="text-xl font-black tracking-widest uppercase text-white">Daily Volume Flow</h3>
          </div>
          
          <div className="bg-midnight-950/20 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-12 min-h-[480px] shadow-2xl relative overflow-hidden flex flex-col justify-end group border-l-accent-primary/20">
            <div className="absolute top-12 left-12 flex items-center gap-6">
               {[
                 { label: 'Inquiry Volume', color: 'bg-accent-primary shadow-indigo-glow' },
                 { label: 'AI Managed', color: 'bg-accent-aurora shadow-aurora-glow' },
                 { label: 'Manual Action', color: 'bg-midnight-700' }
               ].map((dot, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className={`w-2.5 h-2.5 rounded-full ${dot.color}`}></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-midnight-400">{dot.label}</span>
                 </div>
               ))}
            </div>

            <div className="flex items-end justify-between h-64 gap-5 relative z-10">
               {[55, 35, 75, 45, 95, 65, 85, 40, 60, 50, 70, 90].map((val, i) => (
                 <motion.div 
                   key={i}
                   initial={{ height: 0 }}
                   animate={{ height: `${val}%` }}
                   transition={{ delay: i * 0.05, duration: 1.2, ease: 'easeOut' }}
                   className={`flex-1 rounded-t-2xl relative overflow-hidden group/bar transition-all ${
                     i === 11 ? 'bg-accent-aurora shadow-aurora-glow' : 'bg-midnight-800 hover:bg-midnight-700'
                   }`}
                 >
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                 </motion.div>
               ))}
            </div>
            
            <div className="flex items-center justify-between mt-10 text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500 pt-8 border-t border-white/5">
               <span>JAN</span>
               <span>APR</span>
               <span>JUL</span>
               <span>OCT</span>
               <span className="text-accent-aurora animate-pulse italic">REALTIME SIGNAL</span>
            </div>
          </div>
        </section>

        {/* Priority Segments */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="p-2 bg-accent-aurora/10 rounded-lg">
               <PieChart className="text-accent-aurora" size={24} />
            </div>
            <h3 className="text-xl font-black tracking-widest uppercase text-white">Segment Health</h3>
          </div>

          <div className="bg-midnight-950/20 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-10 shadow-2xl flex flex-col space-y-12">
             <div className="flex justify-center p-6 relative">
                <div className="w-64 h-64 rounded-full border-[20px] border-midnight-900 border-t-accent-primary border-l-accent-aurora shadow-inner flex flex-col items-center justify-center relative bg-midnight-950/40">
                   <p className="text-5xl font-black text-white tracking-tighter shadow-indigo-glow">88%</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mt-2">Precision</p>
                   
                   <div className="absolute top-4 right-4 p-3 bg-midnight-900 rounded-2xl shadow-xl shadow-black/40 text-accent-aurora border border-white/5">
                      <Star size={18} />
                   </div>
                </div>
             </div>

             <div className="space-y-6">
               {[
                 { name: 'Lead Acquisition', val: '42%', color: 'bg-accent-primary' },
                 { name: 'Technical Support', val: '28%', color: 'bg-accent-aurora' },
                 { name: 'Member Services', val: '18%', color: 'bg-indigo-400' },
                 { name: 'Miscellaneous', val: '12%', color: 'bg-midnight-700' },
               ].map((item, i) => (
                 <div key={i} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-midnight-400 group-hover:text-white transition-colors">{item.name}</span>
                       <span className="text-[10px] font-bold font-mono text-white">{item.val}</span>
                    </div>
                    <div className="h-2 w-full bg-midnight-900 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: item.val }}
                         transition={{ duration: 1.5, delay: i * 0.1 }}
                         className={`h-full ${item.color} rounded-full shadow-lg`}
                       />
                    </div>
                 </div>
               ))}
             </div>

             <button className="w-full py-5 bg-midnight-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-midnight-400 hover:text-white hover:bg-midnight-800 transition-all flex items-center justify-center gap-4">
                Full Network Details <ChevronRight size={16} className="text-accent-aurora" />
             </button>
          </div>
        </section>
      </div>

      {/* Activity Monitor */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-400/10 rounded-lg">
               <Calendar className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-xl font-black tracking-widest uppercase text-white">System Heartbeat</h3>
          </div>
          <button className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-aurora hover:text-white transition-colors">Archive View</button>
        </div>

        <div className="bg-midnight-950/20 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
           <div className="divide-y divide-white/5">
              {[
                { user: 'Admin Alpha', activity: 'Validated 4 Operator Credentials', time: '12m AGO', status: 'SYNCHRONIZED' },
                { user: 'Node: TechCorp', activity: 'Injected 2 Product Vector Sets', time: '1h AGO', status: 'STABLE' },
                { user: 'Unit: Sales Delta', activity: 'Resolved Inquiry Conflict ID #902', time: '2h AGO', status: 'SUCCESS' },
                { user: 'System Kernel', activity: 'Knowledge Base Synchronization Finalized', time: 'BOOT', status: 'SYSTEM_READY' },
              ].map((log, i) => (
                <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-midnight-900/50 flex items-center justify-center text-midnight-500 group-hover:bg-midnight-900 group-hover:text-accent-aurora group-hover:border group-hover:border-white/5 transition-all shadow-inner">
                         <Search size={24} />
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500">{log.user}</span>
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                              log.status.includes('READY') || log.status.includes('STABLE') || log.status.includes('SUCCESS')
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-midnight-800 text-midnight-400 border-white/5'
                            }`}>{log.status}</span>
                         </div>
                         <p className="font-bold text-white text-base tracking-tight">{log.activity}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <span className="text-xs font-mono font-black text-midnight-600">{log.time}</span>
                      <button className="w-10 h-10 rounded-full bg-midnight-900 flex items-center justify-center text-midnight-400 hover:bg-accent-primary hover:text-white transition-all shadow-xl border border-white/5">
                         <ChevronRight size={20} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default ManagerDashboard;
