import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Building2, CheckCircle, XCircle, Plus, Edit2, Shield, Globe, Activity, Loader2, ChevronRight, Search, Trash2, Sparkles, X, Settings, ShieldAlert, Database, Laptop, Terminal, Home, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'home';
  
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_companies: 0,
    total_products: 0,
    total_queries: 0,
    pending_queries: 0,
    resolved_queries: 0
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [neuralStats, setNeuralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [userSearch, setUserSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'pending'
  
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState({ name: '', description: '', config: {} });
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', password: '', role: 'SalesRep', company_id: '' });

  const API_BASE = 'http://127.0.0.1:8000/api/v1/admin';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, companiesRes, statsRes, auditRes, neuralRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/companies`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/audit-logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/neural-diagnostics`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!usersRes.ok || !companiesRes.ok || !statsRes.ok || !auditRes.ok || !neuralRes.ok) throw new Error('System heartbeat signal loss');

      const [usersData, companiesData, statsData, auditData, neuralData] = await Promise.all([
        usersRes.json(),
        companiesRes.json(),
        statsRes.json(),
        auditRes.json(),
        neuralRes.json()
      ]);

      setUsers(usersData);
      setCompanies(companiesData);
      setStats(statsData);
      setAuditLogs(auditData);
      setNeuralStats(neuralData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Node synchronization failure');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompanyAssignment = async (userId, companyId, user) => {
    try {
      setIsSubmitting(true);
      const assignedIds = user.assigned_companies?.map(c => c.id) || [];
      const updatedIds = assignedIds.includes(companyId)
        ? assignedIds.filter(id => id !== companyId)
        : [...assignedIds, companyId];

      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ company_ids: updatedIds })
      });
      if (!response.ok) throw new Error('Authorization sync failure');
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUser = async (userId, currentActive) => {
    const action = currentActive ? "DEACTIVATE" : "AUTHORIZE";
    if (window.confirm(`Are you sure you want to ${action} this user's node access?`)) {
      handleUpdateUser(userId, { is_active: !currentActive });
    }
  };

  const handleRoleUpdate = (userId, newRole) => {
    if (window.confirm(`CAUTION: Reassign user to ${newRole} personnel class? Clearance levels will be adjusted immediately.`)) {
      handleUpdateUser(userId, { role: newRole });
    }
  };

  const handleCompanyUpdate = (userId, newCompanyId) => {
    handleUpdateUser(userId, { company_id: newCompanyId || null });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("CRITICAL: Permanent deletion of user node. Operation cannot be reversed. Proceed?")) return;
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Deletion request failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("WARNING: Destroying this entity will cascade delete ALL associated documents and analytics. Neutralize?")) return;
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Entity neutralization failed');
      setSelectedCompany(null);
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCompany)
      });
      if (!response.ok) throw new Error('Entity provisioning failed');
      await fetchData();
      setShowAddCompany(false);
      setNewCompany({ name: '', description: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (!response.ok) throw new Error('Personnel provisioning failed');
      await fetchData();
      setShowAddUser(false);
      setNewUser({ email: '', full_name: '', password: '', role: 'SalesRep', company_id: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdminSuspension = async (companyId, currentVal) => {
    const action = currentVal ? "AUTHORIZE" : "INITIATE SUSPENSION";
    if (window.confirm(`Are you sure you want to ${action} this organization from the Admin side?`)) {
        try {
          setIsSubmitting(true);
          const response = await fetch(`${API_BASE}/companies/${companyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ admin_suspended: !currentVal })
          });
          if (!response.ok) throw new Error('Authorization update failed');
          await fetchData();
          const updated = companies.find(c => c.id === companyId);
          if (updated) setSelectedCompany({ ...updated, admin_suspended: !currentVal });
        } catch (err) {
          alert(err.message);
        } finally {
          setIsSubmitting(false);
        }
    }
  };

  const handleSaveCompany = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedCompany)
      });
      if (!response.ok) throw new Error('Configuration sync failure');
      const updatedCompany = await response.json();
      setSelectedCompany(updatedCompany);
      await fetchData();
      setIsEditingCompany(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCompanyDetail = (company) => {
    setSelectedCompany(company);
    setEditedCompany({ name: company.name, description: company.description || '', config: company.config || {} });
    setIsEditingCompany(false);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(userSearch.toLowerCase());
    
    if (userFilter === 'pending') return matchesSearch && !u.is_active;
    return matchesSearch;
  });

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(companySearch.toLowerCase()) || 
    c.id?.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.manager_name?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(l => 
    l.event?.toLowerCase().includes(auditSearch.toLowerCase()) || 
    l.actor?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const renderHome = () => (
    <div className="space-y-12">
      {/* Welcome Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-amethyst-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3.5rem] p-6 lg:p-12 flex flex-col justify-between min-h-[320px] lg:min-h-[420px] relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
               <span className="px-3 lg:px-4 py-1 lg:py-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/20">System Healthy</span>
               <div className="hidden sm:block h-[1px] w-8 lg:w-12 bg-white/10"></div>
               <span className="text-slate-600 font-mono text-[8px] lg:text-[9px] tracking-widest">v2.4.0-STABLE</span>
            </div>
            <h3 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tighter italic mb-4 lg:mb-8">Admin <span className="text-accent-secondary">Overview</span></h3>
            <p className="text-slate-300 font-medium max-w-xl leading-relaxed lg:leading-loose text-xs lg:text-[15px]">Welcome to your control center. All platform nodes are operational. Key metrics and activity logs are consolidated below.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-6 mt-8 lg:mt-12 relative z-10">
             <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Nodes Synchronized</span>
             </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* System Health Widget */}
        <div className="bg-amethyst-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-10 flex lg:flex-col items-center lg:justify-center gap-6 lg:gap-10 relative overflow-hidden group">
           <div className="flex items-center gap-4 lg:gap-6">
              <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-xl lg:rounded-[2rem] bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20 shadow-amethyst-glow/20 transition-transform group-hover:scale-110 duration-500">
                 <Settings className="w-8 h-8 lg:w-10 lg:h-10" />
              </div>
              <div>
                 <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1 lg:mb-2 text-nowrap">Global Health</p>
                 <h4 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter">Optimal</h4>
              </div>
           </div>
           
           <div className="hidden lg:block space-y-6 w-full">
              {[
                { label: 'Active Models', value: neuralStats?.active_models?.join(' • ') || 'Llama-3', color: 'text-sky-400' },
                { label: 'Latency', value: `${neuralStats?.avg_latency_ms}ms`, color: 'text-emerald-400' },
                { label: 'Node Load', value: neuralStats?.node_load || 'Normal', color: 'text-accent-secondary' },
              ].map((m, i) => (
                <div key={i} className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{m.label}</span>
                   <span className={`text-[12px] font-black uppercase tracking-widest ${m.color}`}>{m.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
            {/* Metrics Summary Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
         {[
           { label: 'Users', value: stats.total_users, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
           { label: 'Pending Approval', value: users.filter(u => !u.is_active).length, icon: ShieldAlert, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', alert: users.some(u => !u.is_active) },
           { label: 'Companies', value: stats.total_companies, icon: Building2, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
           { label: 'Operations', value: stats.total_queries, icon: Sparkles, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10' },
           { label: 'AI Throughput', value: (companies.reduce((sum, c) => sum + (c.total_tokens || 0), 0) / 1000).toFixed(1) + 'k', icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/10' },
         ].map((item, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
             onClick={() => item.label === 'Pending Approval' ? (setSearchParams({ view: 'personnel' }), setUserFilter('pending')) : null}
             className={`bg-amethyst-900/20 backdrop-blur-xl p-5 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border transition-all flex items-center justify-between group shadow-xl cursor-pointer ${item.alert ? 'border-accent-secondary/30' : 'border-white/5 hover:border-white/10'}`}
           >
              <div>
                <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1 lg:mb-2">{item.label}</p>
                <p className={`text-xl lg:text-3xl font-black tracking-tighter transition-colors ${item.alert ? 'text-accent-secondary' : 'text-white group-hover:text-accent-secondary'}`}>{item.value}</p>
              </div>
              <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform ${item.alert ? 'animate-pulse' : ''}`}><item.icon className="w-5 h-5 lg:w-6 lg:h-6"/></div>
           </motion.div>
         ))}
      </div>

      {/* Recent Activity Feed Section */}
      <div className="bg-amethyst-950/20 backdrop-blur-3xl rounded-[4rem] border border-white/5 p-12 shadow-2xl relative overflow-hidden">
         <div className="flex items-center justify-between mb-12 px-2">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-accent-secondary/10 rounded-2xl"><Activity size={28} className="text-accent-secondary" /></div>
               <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter">Recent Activity</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Latest platform updates</p>
               </div>
            </div>
            <div className="relative group min-w-[280px]">
               <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
               <input 
                  type="text" 
                  placeholder="Trace audit signature..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full bg-amethyst-900/60 border border-white/5 rounded-xl py-2.5 pl-12 pr-6 text-[10px] text-white outline-none focus:ring-4 focus:ring-accent-secondary/10 transition-all font-bold placeholder:text-slate-700"
               />
            </div>
         </div>

         <div className="space-y-4 lg:space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {filteredAuditLogs.length === 0 ? (
               <div className="py-20 text-center text-slate-700 font-black uppercase tracking-widest italic">No matching signatures found in the log stream.</div>
            ) : filteredAuditLogs.slice(0, 10).map((log, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={log.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 p-5 lg:p-8 bg-amethyst-900/40 rounded-2xl lg:rounded-[2.5rem] border border-white/5 group hover:bg-amethyst-900/60 transition-all cursor-default"
              >
                 <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center text-xs lg:text-sm font-black border uppercase relative shadow-inner flex-shrink-0 ${
                    log.event.includes('DELETION') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                    log.event.includes('PROVISION') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-sky-500/10 text-sky-400 border-sky-500/20'
                 }`}>
                    {log.event.charAt(0)}
                    <div className={`absolute -right-0.5 -top-0.5 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 border-amethyst-900 ${
                       log.event.includes('DELETION') ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}></div>
                 </div>
                 
                 <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 items-center gap-4 lg:gap-8 w-full sm:w-auto">
                    <div>
                       <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 lg:mb-1">Activity</p>
                       <p className="text-[11px] lg:text-[13px] font-black text-white italic tracking-tight truncate">
                         {log.event.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                       </p>
                    </div>
                    <div className="lg:block">
                       <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 lg:mb-1">User</p>
                       <p className="text-[11px] lg:text-[13px] font-bold text-slate-400 truncate">{log.actor}</p>
                    </div>
                    <div className="text-right hidden lg:block">
                       <p className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 lg:mb-1">Time</p>
                       <p className="text-[9px] lg:text-[11px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-700 group-hover:text-white transition-colors hidden sm:block" />
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-accent-secondary/20 rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Communicating with server...</p>
    </div>
  );

  const renderPersonnel = () => (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent-primary/10 rounded-lg">
             <Shield size={24} className="text-accent-primary" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white">User Management</h3>
        </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
             <div className="flex bg-amethyst-900/40 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setUserFilter('all')}
                  className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${userFilter === 'all' ? 'bg-accent-primary text-white shadow-amethyst-glow' : 'text-slate-600 hover:text-white'}`}
                >
                   All Personnel
                </button>
                <button 
                  onClick={() => setUserFilter('pending')}
                  className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${userFilter === 'pending' ? 'bg-accent-secondary text-white shadow-fuchsia-glow' : 'text-slate-600 hover:text-accent-secondary'}`}
                >
                   Awaiting Approval {users.filter(u => !u.is_active).length > 0 && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                </button>
             </div>
             <div className="relative group min-w-[350px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="Filter personnel registry..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-amethyst-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
                />
             </div>
          </div>
          <button 
            onClick={() => setShowAddUser(true)}
            className="px-6 py-3 bg-amethyst-gradient rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-amethyst-glow hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add User
          </button>
      </div>

      <div className="bg-amethyst-900/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amethyst-950/60 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">FullName</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Role & Company</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="px-8 py-20 text-center text-midnight-600 font-bold uppercase tracking-widest italic">No personnel detected.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amethyst-900 border border-white/5 flex items-center justify-center font-black text-xs text-accent-primary shadow-inner uppercase">
                            {user.full_name?.charAt(0)}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="text-[11px] font-black text-white">{user.full_name}</p>
                               {user.created_at && (new Date() - new Date(user.created_at)) < 86400000 && (
                                 <span className="px-1.5 py-0.5 bg-accent-secondary/10 text-accent-secondary text-[7px] font-black uppercase rounded-md border border-accent-secondary/20">New</span>
                               )}
                            </div>
                            <p className="text-[9px] text-slate-600 font-bold tracking-wider">{user.email}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                         <select 
                            value={user.role} 
                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                            className="bg-amethyst-950 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 rounded-lg outline-none focus:border-accent-primary focus:text-accent-primary transition-all w-fit cursor-pointer"
                         >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                            <option value="SalesRep">SalesRep</option>
                         </select>
                         
                         <div className="flex flex-wrap gap-2 max-w-[200px]">
                            {user.assigned_companies?.length > 0 ? (
                               user.assigned_companies.map(c => (
                                 <span key={c.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent-secondary/10 text-accent-secondary text-[8px] font-black uppercase rounded-md border border-accent-secondary/20">
                                    {c.name}
                                    <button onClick={() => handleCompanyUpdate(user.id, c.id)} className="hover:text-red-500 transition-colors"><X size={8}/></button>
                                 </span>
                               ))
                            ) : (
                               <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Unassigned</span>
                            )}
                            
                            <select 
                               value=""
                               onChange={(e) => handleCompanyUpdate(user.id, e.target.value)}
                               className="bg-amethyst-950 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500 px-2 py-0.5 rounded-md outline-none hover:border-accent-secondary transition-all w-fit cursor-pointer"
                            >
                               <option value="">+ Assign</option>
                               {companies.filter(c => !user.assigned_companies?.some(ac => ac.id === c.id)).map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                               ))}
                            </select>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                           user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                         }`}>
                           {user.is_active ? 'Active' : 'Inactive'}
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleToggleUser(user.id, user.is_active)}
                            className={`p-2 rounded-lg border shadow-xl transition-all ${user.is_active ? 'bg-red-500/5 text-red-500 border-red-500/20' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'}`}
                          >
                             {user.is_active ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg shadow-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEntities = () => (
    <div className="flex flex-col space-y-8">
       <div className="flex items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
               <Building2 size={24} className="text-accent-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white">Company Directory</h3>
          </div>
          <div className="relative group flex-1 max-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input 
              type="text" 
              placeholder="Filter entities..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full bg-amethyst-950/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowAddCompany(true)}
            className="px-6 py-3 bg-amethyst-gradient rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-amethyst-glow hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Company
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {filteredCompanies.map(company => (
           <motion.div 
             layout
             key={company.id}
             className="bg-amethyst-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 group hover:border-accent-secondary/30 transition-all cursor-pointer relative overflow-hidden"
             onClick={() => openCompanyDetail(company)}
           >
             <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amethyst-950 border border-white/5 rounded-2xl flex items-center justify-center text-accent-secondary shadow-inner">
                        <Building2 size={28} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-white italic group-hover:text-accent-secondary transition-colors">{company.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Mgr:</span>
                        <span className={`text-[10px] font-bold ${company.manager_name === 'Unassigned' ? 'text-rose-500/60' : 'text-accent-primary'}`}>
                          {company.manager_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="p-3 bg-amethyst-950 rounded-xl border border-white/5 text-slate-600 group-hover:bg-accent-secondary group-hover:text-amethyst-950 transition-all">
                        <ChevronRight size={18} />
                    </div>
                  </div>
                </div>              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-6 lg:mt-8 relative z-10 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <div className="flex flex-col gap-1 p-3 bg-amethyst-950/40 rounded-xl border border-white/5">
                   <span>Weekly Tokens</span>
                   <span className="text-sm font-black text-accent-secondary">{company.weekly_tokens?.toLocaleString() || 0}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-amethyst-950/40 rounded-xl border border-white/5">
                   <span>Monthly Tokens</span>
                   <span className="text-sm font-black text-accent-secondary">{company.monthly_tokens?.toLocaleString() || 0}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-amethyst-950/40 rounded-xl border border-white/5 col-span-2 lg:col-span-1">
                   <span>Lifetime Tokens</span>
                   <span className="text-sm font-black text-accent-primary">{company.total_tokens?.toLocaleString() || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                <div className="p-4 bg-amethyst-950/40 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Sales Reps</p>
                   <p className="text-lg font-black text-white">{company.sales_rep_count || 0}</p>
                </div>
                <div className="p-4 bg-amethyst-950/40 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Total Team</p>
                   <p className="text-lg font-black text-white">{company.user_count || 0}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amethyst-950 rounded-lg border border-white/5">
                       <Shield size={12} className="text-accent-primary" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Administrative Control</span>
                 </div>
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchParams({ view: 'personnel' });
                    setUserSearch(company.name);
                  }}
                  className="px-4 py-2 bg-amethyst-950 hover:bg-accent-primary/10 border border-white/5 hover:border-accent-primary/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-accent-primary transition-all flex items-center gap-2 shadow-inner"
                 >
                    Manage Team <Users size={12} />
                 </button>
              </div>
             
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </motion.div>
         ))}
       </div>
    </div>
  );


  const viewTitles = {
    home: { title: "Admin Home", subtitle: "General Dashboard" },
    personnel: { title: "User Management", subtitle: "User Roles & Access" },
    entities: { title: "Companies", subtitle: "Manage Organizations" }
  };

  const { title, subtitle } = viewTitles[currentView] || viewTitles.home;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Dynamic Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">System Healthy</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
             {title.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">{title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchData()}
            className="p-4 bg-amethyst-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
            title="Refresh State"
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
           transition={{ duration: 0.3 }}
        >
          {currentView === 'home' && renderHome()}
          {currentView === 'personnel' && renderPersonnel()}
          {currentView === 'entities' && renderEntities()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {/* Provision Company Modal */}
        {showAddCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-amethyst-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient"></div>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-amethyst-glow/20 border border-accent-primary/20">
                    <Building2 size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight italic">Add <span className="text-accent-primary">Company</span></h3>
                </div>
                <button onClick={() => setShowAddCompany(false)} className="p-4 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all"><X /></button>
              </div>

              <form onSubmit={handleAddCompany} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Entity Name</label>
                  <input 
                    required autoFocus
                    value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                    placeholder="e.g. ULTRA NEXUS CORE"
                    className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-amethyst-800 focus:border-accent-primary/30 outline-none transition-all placeholder:text-slate-700 text-base font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Context/Description</label>
                  <textarea 
                    value={newCompany.description} onChange={e => setNewCompany({...newCompany, description: e.target.value})}
                    placeholder="Tactical overview of company operations..."
                    className="w-full h-32 bg-amethyst-900 border border-white/5 rounded-[2rem] py-6 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-amethyst-800 focus:border-accent-primary/30 outline-none transition-all resize-none text-sm leading-relaxed font-medium text-slate-400 shadow-inner"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-6 bg-amethyst-gradient rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-fuchsia-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Sparkles size={20}/> Save Company</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Provision Personnel Modal */}
        {showAddUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-amethyst-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient"></div>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-amethyst-glow/20 border border-accent-primary/20">
                    <Users size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight italic">Add <span className="text-accent-primary">User</span></h3>
                </div>
                <button onClick={() => setShowAddUser(false)} className="p-4 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all"><X /></button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Full Name</label>
                    <input 
                      required autoFocus
                      value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Email Address</label>
                    <input 
                      required type="email"
                      value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                      placeholder="john@nexus.com"
                      className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Secure Password</label>
                  <input 
                    required type="password"
                    value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Personnel Role</label>
                    <select 
                      value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-[10px] font-black uppercase tracking-widest text-white shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Owner">Owner</option>
                      <option value="SalesRep">SalesRep</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Entity Assignment</label>
                    <select 
                      required
                      value={newUser.company_id} onChange={e => setNewUser({...newUser, company_id: e.target.value})}
                      className="w-full bg-amethyst-900 border border-white/5 rounded-xl py-3 px-5 focus:ring-4 focus:ring-accent-primary/10 outline-none text-[10px] font-black uppercase tracking-widest text-white shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-4 bg-amethyst-gradient rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] text-white shadow-amethyst-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18}/> Create User</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Company Drilldown / Intelligence Report Modal */}
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-5xl bg-amethyst-950 border border-white/10 rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-16 z-10 shadow-[0_0_150px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-6 lg:gap-8">
                   <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[2rem] bg-amethyst-900 flex items-center justify-center text-accent-secondary border border-white/5 shadow-inner">
                      <Building2 className="w-8 h-8 lg:w-10 lg:h-10" />
                   </div>
                   <div>
                     <h3 className="text-2xl lg:text-4xl font-black text-white tracking-tighter italic flex items-center gap-4">
                        {selectedCompany.name}
                        <span className={`text-[10px] uppercase not-italic tracking-[0.3em] px-3 py-1 rounded-full border ${selectedCompany.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20'}`}>
                           {selectedCompany.is_active ? 'Operational' : 'Suspended'}
                        </span>
                     </h3>
                     <div className="flex items-center gap-4 mt-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">UUID: <span className="text-accent-secondary italic">{selectedCompany.id}</span></p>
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Registry: <span className="text-white italic">{new Date(selectedCompany.created_at).toLocaleDateString()}</span></p>
                     </div>
                   </div>
                 </div>
                 <button onClick={() => setSelectedCompany(null)} className="p-4 lg:p-5 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all shadow-xl"><X /></button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
                 {[
                    { label: 'Products', value: selectedCompany.product_count || 0, icon: Laptop, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10' },
                    { label: 'Personnel', value: selectedCompany.user_count || 0, icon: Users, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
                    { label: 'Sales Reps', value: selectedCompany.sales_rep_count || 0, icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Total Tokens', value: (selectedCompany.total_tokens / 1000).toFixed(1) + 'k', icon: Sparkles, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10' },
                 ].map((s, i) => (
                   <div key={i} className="p-6 bg-amethyst-900/60 border border-white/5 rounded-3xl shadow-inner group hover:bg-amethyst-900 transition-colors">
                     <div className={`p-2.5 w-fit rounded-xl mb-3 ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}><s.icon size={18} /></div>
                     <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">{s.label}</p>
                     <p className="text-2xl font-black text-white">{s.value}</p>
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Security Authorization (Dual-Lock)</label>
                    <div className="flex flex-col gap-4">
                       <button 
                          onClick={() => handleToggleAdminSuspension(selectedCompany.id, selectedCompany.admin_suspended)}
                          className={`p-6 border rounded-[2rem] flex items-center justify-between group transition-all ${selectedCompany.admin_suspended ? 'bg-accent-secondary/10 border-accent-secondary/30' : 'bg-emerald-500/5 border-emerald-500/20'}`}
                       >
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCompany.admin_suspended ? 'bg-accent-secondary/20 text-accent-secondary' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {selectedCompany.admin_suspended ? <ShieldAlert size={20} /> : <Shield size={20} />}
                             </div>
                             <div className="text-left">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Admin Authorization</p>
                                <p className={`text-[11px] font-black italic ${selectedCompany.admin_suspended ? 'text-accent-secondary' : 'text-emerald-400'}`}>
                                   {selectedCompany.admin_suspended ? 'Suspension Initiated' : 'Node Authorized'}
                                </p>
                             </div>
                          </div>
                          <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${selectedCompany.admin_suspended ? 'bg-accent-secondary text-white' : 'bg-amethyst-950 text-slate-500'}`}>
                             {selectedCompany.admin_suspended ? 'Cancel' : 'Initiate'}
                          </div>
                       </button>

                       <div className={`p-6 border rounded-[2rem] flex items-center justify-between transition-opacity ${selectedCompany.manager_suspended ? 'bg-accent-secondary/10 border-accent-secondary/30' : 'bg-amethyst-950 border-white/5 opacity-60'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCompany.manager_suspended ? 'bg-accent-secondary/20 text-accent-secondary' : 'bg-amethyst-900 text-slate-600'}`}>
                                <Users size={20} />
                             </div>
                             <div className="text-left">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Manager Concurrence</p>
                                <p className={`text-[11px] font-black italic ${selectedCompany.manager_suspended ? 'text-accent-secondary' : 'text-slate-500'}`}>
                                   {selectedCompany.manager_suspended ? 'Manager Suspended' : 'Waiting Reference'}
                                </p>
                             </div>
                          </div>
                          <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex items-center gap-2 ${selectedCompany.manager_suspended ? 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30' : 'bg-white/5 text-slate-700'}`}>
                             {selectedCompany.manager_suspended ? <><CheckCircle size={10} /> Signed</> : 'Pending'}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Consumption Velocity</label>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-amethyst-950/60 border border-white/5 rounded-[2rem] flex flex-col justify-center">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Weekly Tokens</p>
                          <p className="text-xl font-black text-white italic">{selectedCompany.weekly_tokens?.toLocaleString() || 0}</p>
                       </div>
                       <div className="p-6 bg-amethyst-950/60 border border-white/5 rounded-[2rem] flex flex-col justify-center">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Monthly Tokens</p>
                          <p className="text-xl font-black text-white italic">{selectedCompany.monthly_tokens?.toLocaleString() || 0}</p>
                       </div>
                    </div>
                    <div className="p-6 bg-amethyst-950/60 border border-white/5 rounded-[2rem] mt-4">
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Network Consensus</span>
                          <span className={`text-[10px] font-black italic ${selectedCompany.is_active ? 'text-emerald-400' : 'text-accent-secondary'}`}>
                             {selectedCompany.is_active ? 'Active Node' : 'Terminated'}
                          </span>
                       </div>
                       <div className="w-full h-2 bg-amethyst-900 rounded-full overflow-hidden">
                          <div 
                             className={`h-full transition-all duration-1000 ${selectedCompany.is_active ? 'bg-accent-primary' : 'bg-accent-secondary'}`}
                             style={{ width: `${(selectedCompany.admin_suspended ? 50 : 0) + (selectedCompany.manager_suspended ? 50 : 0) || 5}%` }}
                          ></div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 mb-10">
                 <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Strategic Description</label>
                 <textarea 
                    value={editedCompany.description}
                    onChange={(e) => setEditedCompany({...editedCompany, description: e.target.value})}
                    placeholder="Specify entity context for RAG processing..."
                    className="w-full h-32 bg-amethyst-950/40 border border-white/5 rounded-[2.5rem] py-6 px-8 focus:ring-4 focus:ring-accent-secondary/10 focus:border-accent-secondary/30 outline-none transition-all resize-none text-[13px] leading-relaxed font-medium text-slate-300 shadow-inner"
                 />
              </div>

              <div className="mt-auto flex flex-col sm:flex-row gap-4 lg:gap-6 pt-6 border-t border-white/5">
                 <button 
                   onClick={() => handleDeleteCompany(selectedCompany.id)}
                   className="w-full sm:w-auto px-10 py-5 bg-amethyst-900 hover:bg-accent-secondary/10 border border-white/5 hover:border-accent-secondary/20 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent-secondary transition-all flex items-center justify-center gap-3"
                 >
                   <Trash2 size={16} /> Delete Record
                 </button>
                 <div className="flex-1"></div>
                 <button 
                  onClick={handleSaveCompany} disabled={isSubmitting}
                  className="w-full sm:w-auto px-12 py-5 bg-amethyst-gradient rounded-[2rem] text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-fuchsia-glow active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                 >
                   {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18}/> Update Intelligence</>}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
