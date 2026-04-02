import React, { useState, useEffect } from 'react';
import { Users, Building2, CheckCircle, XCircle, Plus, Edit2, Shield, Globe, Activity, Loader2, ChevronRight, Search, Trash2, Sparkles, X, Settings, ShieldAlert, Database, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
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
<<<<<<< Updated upstream
=======
  
  const [userSearch, setUserSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState({ name: '', description: '', config: {} });
>>>>>>> Stashed changes

  const API_BASE = 'http://127.0.0.1:8000/api/v1/admin';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, companiesRes, statsRes, auditRes] = await Promise.all([
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

  const handleToggleUser = (userId, currentActive) => {
    handleUpdateUser(userId, { is_active: !currentActive });
  };

  const handleRoleUpdate = (userId, newRole) => {
<<<<<<< Updated upstream
    handleUpdateUser(userId, { role: newRole });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <Loader2 size={48} className="text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Accessing System Registry...</p>
=======
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

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(companySearch.toLowerCase()) || 
    c.id?.toLowerCase().includes(companySearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-accent-aurora animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-accent-aurora/20 rounded-full animate-pulse"></div>
      </div>
      <p className="text-midnight-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Syncing Administrative Nodes...</p>
>>>>>>> Stashed changes
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
<<<<<<< Updated upstream
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
             <Shield className="text-primary-600" size={32} />
             Root Administration
          </h2>
          <p className="text-slate-500 text-sm font-medium">Manage multi-tenant permissions and entity integrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
             Global Logs
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span>Provision Entity</span>
=======
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500">Root Access Active</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
             Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora">Terminal</span>
          </h2>
          <p className="text-midnight-400 font-medium">Platform orchestration and entity oversight protocol v4.2.0</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => document.getElementById('audit-terminal').scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-midnight-900 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-midnight-800 hover:border-white/10 transition-all flex items-center gap-3"
          >
             <Activity size={18} className="text-accent-aurora" /> System Audit
          </button>
          <button 
            onClick={() => setShowAddCompany(true)}
            className="px-8 py-4 bg-aurora-gradient rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-aurora-glow hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={18} /> Provision Entity
>>>>>>> Stashed changes
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Node', value: users.filter(u => u.is_active).length, icon: Shield, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Integrated Company', value: companies.length, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Request Pending', value: users.filter(u => !u.is_active).length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Uptime Metrics', value: '100%', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
=======
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Platform Nodes', value: stats.total_users, subtitle: `${users.filter(u => !u.is_active).length} pending clearance`, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Corporate Entities', value: stats.total_companies, subtitle: `${stats.total_products} digital assets`, icon: Building2, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
          { label: 'Resolved Signals', value: stats.resolved_queries, subtitle: `${stats.pending_queries} in queue`, icon: Sparkles, color: 'text-accent-aurora', bg: 'bg-accent-aurora/10' },
          { label: 'System Uptime', value: '99.99%', subtitle: 'Optimal Performance', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
>>>>>>> Stashed changes
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
<<<<<<< Updated upstream
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft"
          >
            <div className={`p-3 w-fit rounded-2xl mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
=======
            className="bg-midnight-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 group hover:border-accent-primary/30 relative overflow-hidden"
          >
            <div className={`p-4 w-fit rounded-2xl mb-6 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
              <span className="text-[10px] font-bold text-midnight-600 italic">{stat.subtitle}</span>
>>>>>>> Stashed changes
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

<<<<<<< Updated upstream
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* User Approval */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">Operator Access</h3>
            </div>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-[2rem] border border-slate-200 shadow-soft overflow-hidden"
          >
            {users.length === 0 ? (
              <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Awaiting signals...</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map(user => (
                  <motion.div 
                    variants={itemVariants}
                    key={user.id} 
                    className="group p-6 flex items-center justify-between hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.is_active ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm leading-none">{user.full_name}</p>
                          <select 
                            value={user.role}
                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border outline-none cursor-pointer transition-all ${
                              user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary-400'
                            }`}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                            <option value="SalesRep">SalesRep</option>
                          </select>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleToggleUser(user.id, user.is_active)}
                        className={`p-3 rounded-xl transition-all ${
                          user.is_active 
                          ? 'text-red-500 hover:bg-red-50' 
                          : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.is_active ? 'Deactivate' : 'Approve'}
                      >
                        {user.is_active ? <XCircle size={20} /> : <CheckCircle size={20} />}
                      </button>
                      <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* Company Overview */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Building2 size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">Entity Registry</h3>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4"
          >
            {companies.map(company => (
              <motion.div 
                variants={itemVariants}
                key={company.id} 
                className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col gap-6 shadow-soft group hover:border-primary-100 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg leading-tight">{company.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {company.id}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white transition-all">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Endpoints</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">{company.products || 0} Managed</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white transition-all">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Personnel</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">{company.salesReps || 0} Operatives</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
=======
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* User Management Section */}
        <div className="xl:col-span-12 2xl:xl:col-span-7 flex flex-col space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-accent-primary/10 rounded-lg">
                   <Shield size={24} className="text-accent-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Personnel Management</h3>
              </div>
              <div className="relative group min-w-[350px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-600" />
                <input 
                  type="text" 
                  placeholder="Filter personnel registry..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-midnight-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="bg-midnight-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-midnight-950/60 border-b border-white/5">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Personnel Node</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Class & Entity</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-right">Actions</th>
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
                               <div className="w-10 h-10 rounded-xl bg-midnight-900 border border-white/5 flex items-center justify-center font-black text-xs text-accent-primary shadow-inner uppercase">
                                  {user.full_name?.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-[11px] font-black text-white">{user.full_name}</p>
                                 <p className="text-[9px] text-midnight-600 font-bold tracking-wider">{user.email}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-2">
                               <select 
                                  value={user.role} 
                                  onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                  className="bg-midnight-950 border border-white/5 text-[9px] font-black uppercase tracking-widest text-midnight-400 px-3 py-1 rounded-lg outline-none focus:border-accent-primary focus:text-accent-primary transition-all"
                               >
                                  <option value="Admin">Admin</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Owner">Owner</option>
                                  <option value="SalesRep">SalesRep</option>
                               </select>
                               <select 
                                  value={user.company_id || ''} 
                                  onChange={(e) => handleCompanyUpdate(user.id, e.target.value)}
                                  className="bg-midnight-950 border border-white/5 text-[9px] font-black uppercase tracking-widest text-midnight-400 px-3 py-1 rounded-lg outline-none focus:border-accent-aurora focus:text-accent-aurora transition-all"
                               >
                                  <option value="">No Entity</option>
                                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex justify-center">
                               <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                                 user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                               }`}>
                                 {user.is_active ? 'Authorized' : 'Restricted'}
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

        {/* Company Directory Section */}
        <div className="xl:col-span-12 2xl:col-span-5 flex flex-col space-y-8">
           <div className="flex items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-accent-aurora/10 rounded-lg">
                   <Building2 size={24} className="text-accent-aurora" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Entity Directory</h3>
              </div>
              <div className="relative group flex-1 max-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-600" />
                <input 
                  type="text" 
                  placeholder="Filter entities..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full bg-midnight-950/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] text-white focus:ring-4 focus:ring-accent-aurora/10 outline-none transition-all"
                />
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
             {filteredCompanies.map(company => (
               <motion.div 
                 layout
                 key={company.id}
                 className="bg-midnight-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 group hover:border-accent-aurora/30 transition-all cursor-pointer relative overflow-hidden"
                 onClick={() => openCompanyDetail(company)}
               >
                 <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-midnight-950 border border-white/5 rounded-2xl flex items-center justify-center text-accent-aurora shadow-inner">
                         <Building2 size={28} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-white italic group-hover:text-accent-aurora transition-colors">{company.name}</p>
                        <p className="text-[10px] font-black text-midnight-600 uppercase tracking-widest mt-1">ID: {company.id}</p>
                      </div>
                   </div>
                   <div className="p-3 bg-midnight-950 rounded-xl border border-white/5 text-midnight-600 group-hover:bg-accent-aurora group-hover:text-midnight-950 transition-all">
                      <ChevronRight size={18} />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                   <div className="p-4 bg-midnight-950/40 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-midnight-600 mb-1">Managed Nodes</p>
                      <p className="text-lg font-black text-white">{company.product_count || 0}</p>
                   </div>
                   <div className="p-4 bg-midnight-950/40 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-midnight-600 mb-1">Linked Personnel</p>
                      <p className="text-lg font-black text-white">{company.user_count || 0}</p>
                   </div>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-32 h-32 bg-accent-aurora/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
               </motion.div>
             ))}
           </div>
        </div>
      </div>

      {/* Audit Signal Terminal Section */}
      <section id="audit-terminal" className="space-y-8 pt-10 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-red-500/10 rounded-lg">
                <Activity size={24} className="text-rose-500" />
             </div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-widest text-white italic tracking-tighter">Audit Signal <span className="text-rose-500">Terminal</span></h3>
               <p className="text-[10px] text-midnight-500 font-bold uppercase tracking-[0.4em] mt-1">Real-time Platform Trace</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 bg-midnight-900/50 border border-white/5 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-glow"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Sync Optimal</span>
             </div>
          </div>
        </div>

        <div className="bg-midnight-950/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-midnight-950/60 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Event Class</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Target Node</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Clearance Actor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map(log => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                       <span className={`text-[9px] font-black px-2 py-1 rounded border tracking-widest uppercase ${
                         log.event.includes('DELETION') ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-glow/20' : 
                         log.event.includes('PROVISION') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                         'bg-sky-500/10 text-sky-400 border-sky-500/20'
                       }`}>
                         {log.event}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-black text-white">{log.target}</td>
                    <td className="px-8 py-6 text-[11px] text-midnight-400 font-bold">{log.actor}</td>
                    <td className="px-8 py-6 text-right text-[10px] font-mono text-midnight-600 italic">
                      {new Date(log.timestamp).toLocaleTimeString()} <span className="mx-2 opacity-50">•</span> {new Date(log.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Neural Activity Terminal */}
      <section className="space-y-8 pt-10 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-accent-aurora/10 rounded-lg">
                <Globe size={24} className="text-accent-aurora" />
             </div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Neural <span className="text-accent-aurora">Activity</span> Monitor</h3>
               <p className="text-[10px] text-midnight-500 font-bold uppercase tracking-[0.4em] mt-1">Global AI Throughput & Efficiency</p>
             </div>
          </div>
          {neuralStats && (
            <div className="flex items-center gap-4">
               <div className="px-5 py-3 bg-midnight-900 border border-white/5 rounded-2xl flex items-center gap-4">
                  <div className="flex flex-col items-end">
                     <p className="text-[8px] font-black text-midnight-500 uppercase tracking-widest">Active Models</p>
                     <p className="text-[10px] font-bold text-white uppercase">{neuralStats.active_models.join(' • ')}</p>
                  </div>
                  <div className="w-[1px] h-6 bg-white/10"></div>
                  <div className="flex flex-col">
                     <p className="text-[8px] font-black text-midnight-500 uppercase tracking-widest">Load Factor</p>
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{neuralStats.node_load}</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-midnight-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-12 shadow-2xl relative overflow-hidden flex flex-col justify-end min-h-[400px]">
              <div className="absolute top-12 left-12">
                 <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.4em] mb-2 text-accent-aurora animate-pulse">CORTEX SIGNAL FLOW (24H)</p>
                 <h4 className="text-3xl font-black text-white italic">Operational Pulse</h4>
              </div>
              
              <div className="flex items-end justify-between gap-3 h-48 mt-12">
                 {neuralStats?.hourly_signals.map((val, i) => (
                   <motion.div 
                     key={i}
                     initial={{ height: 0 }}
                     animate={{ height: `${val}%` }}
                     transition={{ delay: i * 0.02, duration: 1 }}
                     className="flex-1 bg-midnight-800 rounded-t-lg group relative"
                   >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-midnight-900 px-2 py-1 rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}
                     </div>
                     <div className="absolute inset-0 bg-accent-aurora opacity-0 group-hover:opacity-20 transition-opacity rounded-t-lg"></div>
                   </motion.div>
                 ))}
              </div>
           </div>

           <div className="bg-midnight-950/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 shadow-2xl space-y-10">
              <div className="space-y-8">
                 {[
                   { label: 'Avg Latency', value: `${neuralStats?.avg_latency_ms}ms`, icon: Activity, color: 'text-rose-400' },
                   { label: 'Token Vol (24h)', value: (neuralStats?.token_throughput_24h / 1000).toFixed(1) + 'k', icon: Laptop, color: 'text-sky-400' },
                   { label: 'Cache Efficiency', value: `${(neuralStats?.cache_hit_rate * 100).toFixed(0)}%`, icon: Database, color: 'text-emerald-400' },
                 ].map((metric, i) => (
                   <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className={`p-3 bg-midnight-900 rounded-2xl border border-white/5 ${metric.color}`}>
                            <metric.icon size={18} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-midnight-500 uppercase tracking-widest">{metric.label}</p>
                            <p className="text-xl font-black text-white">{metric.value}</p>
                         </div>
                      </div>
                      <ChevronRight size={16} className="text-midnight-700 group-hover:text-white transition-colors" />
                   </div>
                 ))}
              </div>

              <div className="p-6 bg-midnight-900/60 rounded-3xl border border-white/5 shadow-inner">
                 <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={16} className="text-accent-aurora animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Core Reasoning Ready</span>
                 </div>
                 <p className="text-[11px] font-medium text-midnight-400 leading-relaxed">
                    AI Nodes are currently optimized. Cache hit rate is within optimal parameters. Re-prioritizing Llama-3 nodes for high-complexity queries.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {/* Provision Company Modal */}
        {showAddCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-midnight-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-aurora-gradient"></div>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-indigo-glow/20 border border-accent-primary/20">
                    <Building2 size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight italic">Provision <span className="text-accent-primary">Entity</span></h3>
                </div>
                <button onClick={() => setShowAddCompany(false)} className="p-4 bg-midnight-900 rounded-full text-midnight-400 hover:text-white transition-all"><X /></button>
              </div>

              <form onSubmit={handleAddCompany} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Entity Name</label>
                  <input 
                    required autoFocus
                    value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                    placeholder="e.g. ULTRA NEXUS CORE"
                    className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all placeholder:text-midnight-700 text-base font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Context/Description</label>
                  <textarea 
                    value={newCompany.description} onChange={e => setNewCompany({...newCompany, description: e.target.value})}
                    placeholder="Tactical overview of company operations..."
                    className="w-full h-32 bg-midnight-900 border border-white/5 rounded-[2rem] py-6 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all resize-none text-sm leading-relaxed font-medium text-midnight-400 shadow-inner"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-6 bg-aurora-gradient rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-aurora-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Sparkles size={20}/> Deploy Entity Node</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Company Drilldown / Advanced Config Modal */}
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-4xl bg-midnight-950 border border-white/10 rounded-[4rem] p-16 z-10 shadow-[0_0_150px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-8">
                   <div className="w-20 h-20 rounded-[2rem] bg-midnight-900 flex items-center justify-center text-accent-aurora border border-white/5 shadow-inner">
                      <Building2 size={40} />
                   </div>
                   <div>
                     <h3 className="text-4xl font-black text-white tracking-tighter italic">Entity <span className="text-accent-aurora">Config</span></h3>
                     <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.4em] mt-2">Identifier: <span className="text-accent-aurora italic">{selectedCompany.id}</span></p>
                   </div>
                 </div>
                 <button onClick={() => setSelectedCompany(null)} className="p-5 bg-midnight-900 rounded-full text-midnight-400 hover:text-white transition-all shadow-xl"><X /></button>
              </div>

              <div className="grid grid-cols-3 gap-8 mb-12">
                {[
                  { label: 'Tactical Assets', value: selectedCompany.product_count || 0, icon: Laptop, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                  { label: 'Operative Pool', value: selectedCompany.user_count || 0, icon: Users, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
                  { label: 'Sync Status', value: 'OPTIMAL', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((s, i) => (
                  <div key={i} className="p-8 bg-midnight-900 border border-white/5 rounded-[2.5rem] shadow-inner">
                    <div className={`p-3 w-fit rounded-xl mb-4 ${s.bg} ${s.color}`}><s.icon size={20} /></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-midnight-600 mb-1">{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-12">
                 <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Intelligence Context</label>
                 <textarea 
                    value={editedCompany.description}
                    onChange={(e) => setEditedCompany({...editedCompany, description: e.target.value})}
                    placeholder="Specify entity context for RAG processing..."
                    className="w-full h-40 bg-midnight-900 border border-white/5 rounded-[2.5rem] py-8 px-10 focus:ring-4 focus:ring-accent-aurora/10 focus:border-accent-aurora/30 outline-none transition-all resize-none text-[13px] leading-loose font-medium text-midnight-300 shadow-inner"
                 />
              </div>

              <div className="flex gap-6">
                 <button 
                   onClick={() => handleDeleteCompany(selectedCompany.id)}
                   className="px-10 py-5 bg-red-500/5 text-red-500 border border-red-500/20 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl"
                 >
                   Neutralize Entity
                 </button>
                 <div className="flex-1"></div>
                 <button 
                  onClick={handleSaveCompany} disabled={isSubmitting}
                  className="px-12 py-5 bg-aurora-gradient rounded-[2.5rem] text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-aurora-glow active:scale-95 transition-all flex items-center gap-4"
                 >
                   {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Settings size={18}/> Commit Config</>}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
>>>>>>> Stashed changes
    </div>
  );
};

export default AdminDashboard;
