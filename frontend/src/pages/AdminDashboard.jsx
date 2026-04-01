import React, { useState, useEffect } from 'react';
import { Users, Building2, CheckCircle, XCircle, Plus, Edit2, Shield, Globe, Activity, Loader2, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    handleUpdateUser(userId, { is_active: !currentActive });
  };

  const handleRoleUpdate = (userId, newRole) => {
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
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
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
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Node', value: users.filter(u => u.is_active).length, icon: Shield, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Integrated Company', value: companies.length, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Request Pending', value: users.filter(u => !u.is_active).length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Uptime Metrics', value: '100%', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft"
          >
            <div className={`p-3 w-fit rounded-2xl mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

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
    </div>
  );
};

export default AdminDashboard;
