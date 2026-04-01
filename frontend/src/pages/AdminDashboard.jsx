import React, { useState, useEffect } from 'react';
import { Users, Building2, CheckCircle, XCircle, Plus, Edit2, Shield, Globe, Activity, Loader2, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState({ name: '', description: '', config: {} });

  const API_BASE = 'http://127.0.0.1:8000/api/v1/admin';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, companiesRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/companies`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!usersRes.ok || !companiesRes.ok) throw new Error('Data signal lost');

      const [usersData, companiesData] = await Promise.all([
        usersRes.json(),
        companiesRes.json()
      ]);

      setUsers(usersData);
      setCompanies(companiesData);
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
      if (!response.ok) throw new Error('Update failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleUser = (userId, currentActive) => {
    const action = currentActive ? "DEACTIVATE" : "AUTHORIZE";
    if (window.confirm(`Are you sure you want to ${action} this user's node access?`)) {
      handleUpdateUser(userId, { is_active: !currentActive });
    }
  };

  const handleRoleUpdate = (userId, newRole) => {
    if (window.confirm(`CAUTION: Are you sure you want to reassign this user to the ${newRole} personnel class? This will immediately change their system clearance.`)) {
      handleUpdateUser(userId, { role: newRole });
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
      if (!response.ok) throw new Error('Failed to create company');
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
      if (!response.ok) throw new Error('Data sync failure');
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
    setEditedCompany({ name: company.name, description: company.description, config: company.config || {} });
    setIsEditingCompany(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, ease: "easeOut" } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-aurora-400 animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-aurora-500/20 rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Loading system data...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white mb-2 flex items-center gap-4">
             <div className="p-3 bg-accent-primary/20 rounded-2xl border border-accent-primary/30">
                <Shield className="text-accent-aurora" size={36} />
             </div>
             Admin Dashboard
          </h2>
          <p className="text-midnight-400 text-lg font-medium max-w-2xl">Manage users, roles, and company entities with high-level clearance.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => alert("Accessing secure signal logs... (Feature coming in v2.1)")}
            className="btn-secondary px-8"
          >
             System Logs
          </button>
          <button 
            onClick={() => setShowAddCompany(true)}
            className="btn-primary px-8"
          >
            <Plus size={18} />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Active Users', value: users.filter(u => u.is_active).length, icon: Shield, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
          { label: 'Companies', value: companies.length, icon: Globe, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/20' },
          { label: 'Pending Approval', value: users.filter(u => !u.is_active).length, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'System Status', value: '100%', icon: CheckCircle, color: 'text-accent-aurora', bg: 'bg-accent-aurora/10', border: 'border-accent-aurora/20' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-8 relative overflow-hidden group hover:border-accent-aurora/30`}
          >
            <div className={`p-4 w-fit rounded-3xl mb-6 ${stat.bg} ${stat.color} shadow-inner`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2 group-hover:text-midnight-300 transition-colors">{stat.label}</p>
            <p className="text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={80} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12">
        {/* User Management */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 shadow-inner">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-[0.4em] text-white">User Management</h3>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {users.length === 0 ? (
              <div className="p-32 text-center text-slate-600 font-bold uppercase tracking-[0.5em] text-xs animate-pulse">Scanning system signals...</div>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map(user => (
                  <motion.div 
                    variants={itemVariants}
                    key={user.id} 
                    className="group p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-500"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${user.is_active ? 'bg-accent-primary/10 text-accent-aurora border border-accent-aurora/20' : 'bg-midnight-900 text-midnight-500 border border-white/5'}`}>
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <p className="font-black text-white text-base leading-none tracking-tight">{user.full_name}</p>
                          <select 
                            value={user.role}
                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                            className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl border outline-none cursor-pointer transition-all ${
                              user.role === 'Admin' ? 'bg-aurora-500/10 text-aurora-300 border-aurora-500/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-aurora-400/50'
                            }`}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                            <option value="SalesRep">SalesRep</option>
                          </select>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleToggleUser(user.id, user.is_active)}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${
                          user.is_active 
                          ? 'bg-red-500/5 text-red-500 hover:bg-red-500/10 border border-red-500/20' 
                          : 'bg-aurora-500/5 text-aurora-400 hover:bg-aurora-500/10 border border-aurora-400/20'
                        }`}
                        title={user.is_active ? 'Deactivate Account' : 'Grant Clearance'}
                      >
                        {user.is_active ? <XCircle size={22} /> : <CheckCircle size={22} />}
                      </button>
                      <button className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-lg">
                        <Edit2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* Company Overview */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 shadow-inner">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-[0.4em] text-white">Company Directory</h3>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6"
          >
            {companies.map(company => (
              <motion.div 
                variants={itemVariants}
                key={company.id} 
                className="glass-card p-8 flex flex-col gap-8 group hover:border-accent-aurora/30 relative overflow-hidden"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                      <Building2 size={32} />
                    </div>
                    <div>
                      <p className="font-black text-white text-xl leading-tight tracking-tight">{company.name}</p>
                      <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.3em] mt-2">Identifier: {company.id}</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => openCompanyDetail(company)}
                    className="w-12 h-12 rounded-full bg-midnight-900 flex items-center justify-center text-midnight-500 group-hover:bg-accent-aurora group-hover:text-midnight-950 transition-all duration-700 shadow-lg cursor-pointer"
                  >
                    <ChevronRight size={24} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-midnight-900/50 rounded-3xl p-6 border border-white/5 group-hover:bg-midnight-900 transition-all duration-500">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2">Endpoint Distribution</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{company.products || 0} Managed Items</p>
                  </div>
                  <div className="bg-midnight-900/50 rounded-3xl p-6 border border-white/5 group-hover:bg-midnight-900 transition-all duration-500">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2">Personnel Strength</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{company.salesReps || 0} Operatives</p>
                  </div>
                </div>

                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[100%] bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddCompany(false)}
            className="absolute inset-0 bg-midnight-950/80 backdrop-blur-xl"
          ></motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg glass-panel p-10 rounded-[3rem] relative z-[110] shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Initialize Company</h3>
            <p className="text-midnight-400 text-[10px] font-bold uppercase tracking-widest mb-8">Deploy a new corporate entity to the platform</p>
            
            <form onSubmit={handleAddCompany} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-midnight-500 ml-1">Entity Name</label>
                <input 
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                  placeholder="e.g. Acme Corporation"
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-midnight-500 ml-1">Description</label>
                <textarea 
                  value={newCompany.description}
                  onChange={e => setNewCompany({...newCompany, description: e.target.value})}
                  placeholder="Brief overview of company operations..."
                  className="input-field min-h-[120px] resize-none py-4"
                />
              </div>
              
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAddCompany(false)}
                  className="btn-secondary flex-1"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Deploy'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedCompany(null)}
            className="absolute inset-0 bg-midnight-950/90 backdrop-blur-2xl"
          ></motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl glass-panel p-12 rounded-[3.5rem] relative z-[110] shadow-[0_0_150px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-3xl bg-accent-primary/20 flex items-center justify-center text-accent-primary border border-accent-primary/30 shadow-inner">
                  <Building2 size={40} />
                </div>
                <div>
                  {isEditingCompany ? (
                    <input 
                      type="text"
                      value={editedCompany.name}
                      onChange={e => setEditedCompany({...editedCompany, name: e.target.value})}
                      className="bg-midnight-900/50 border border-accent-primary/30 rounded-xl px-4 py-2 text-2xl font-black text-white w-full outline-none focus:border-accent-primary"
                    />
                  ) : (
                    <h3 className="text-3xl font-black text-white tracking-tighter mb-2">{selectedCompany.name}</h3>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-aurora px-3 py-1 bg-accent-aurora/10 rounded-full border border-accent-aurora/20">Active Node</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-midnight-500">ID: {selectedCompany.id}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {setSelectedCompany(null); setIsEditingCompany(false);}}
                className="p-4 bg-midnight-900 border border-white/5 rounded-2xl text-midnight-500 hover:text-white transition-all shadow-lg"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-midnight-900/50 p-8 rounded-[2rem] border border-white/5 group hover:border-accent-aurora/30 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-midnight-500 mb-4">Total Assets</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white">{selectedCompany.products || 0}</p>
                  <p className="text-xs font-bold text-midnight-400">Products</p>
                </div>
              </div>
              <div className="bg-midnight-900/50 p-8 rounded-[2rem] border border-white/5 group hover:border-accent-primary/30 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-midnight-500 mb-4">Personnel Cluster</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white">{selectedCompany.salesReps || 0}</p>
                  <p className="text-xs font-bold text-midnight-400">Sales Reps</p>
                </div>
              </div>
              <div className="bg-midnight-900/50 p-8 rounded-[2rem] border border-white/5 group hover:border-amber-400/30 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-midnight-500 mb-4">System Uptime</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white">99.9</p>
                  <p className="text-xs font-bold text-midnight-400">% Stability</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-midnight-500 ml-1">Entity Intelligence Overview</label>
                 {isEditingCompany ? (
                   <textarea 
                    value={editedCompany.description}
                    onChange={e => setEditedCompany({...editedCompany, description: e.target.value})}
                    className="w-full p-8 rounded-[2.5rem] bg-midnight-900 border border-accent-primary/30 text-white leading-relaxed font-medium min-h-[160px] outline-none"
                   />
                 ) : (
                   <div className="p-8 rounded-[2.5rem] bg-midnight-900/40 border border-white/5 text-midnight-300 leading-relaxed font-medium">
                     {selectedCompany.description || "No tactical description provides for this node. Ensure manuals are uploaded to enable RAG intelligence."}
                   </div>
                 )}
               </div>
            </div>
            
            <div className="mt-12 pt-10 border-t border-white/5 flex justify-end gap-5">
              {isEditingCompany ? (
                <>
                  <button 
                    onClick={() => setIsEditingCompany(false)}
                    className="btn-secondary px-8"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSaveCompany}
                    disabled={isSubmitting}
                    className="btn-primary px-10 shadow-indigo-glow border-2 border-accent-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Configuration'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditingCompany(true)}
                    className="btn-secondary px-8"
                  >
                    Advanced Config
                  </button>
                  <button 
                    onClick={() => {setSelectedCompany(null); setIsEditingCompany(false);}}
                    className="btn-primary px-10"
                  >
                    Secure Dashboard
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
