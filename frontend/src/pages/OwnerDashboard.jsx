import React, { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { Package, FileText, Settings, Plus, Download, Trash2, X, Save, Loader2, AlertCircle, Sparkles, ChevronRight, LayoutGrid } from 'lucide-react';
=======
import { Package, FileText, Settings, Plus, Download, Trash2, X, Save, Loader2, AlertCircle, Sparkles, ChevronRight, LayoutGrid, Copy, CheckCircle2, Building2, Search } from 'lucide-react';
>>>>>>> Stashed changes
import { motion, AnimatePresence } from 'framer-motion';

const OwnerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [queries, setQueries] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [stats, setStats] = useState({
    company_name: '',
    total_products: 0,
    total_queries: 0,
    pending_queries: 0,
    resolved_queries: 0,
    total_personnel: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [productSearch, setProductSearch] = useState('');
  const [querySearch, setQuerySearch] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
<<<<<<< Updated upstream
=======
  const [copied, setCopied] = useState(false);
  const [needsCompany, setNeedsCompany] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({ name: '', description: '' });
>>>>>>> Stashed changes

  const [formData, setFormData] = useState({ name: '', description: '', manual_content: '' });

  const API_BASE = 'http://127.0.0.1:8000/api/v1/owner';
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsRes, queriesRes, personnelRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/personnel`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!productsRes.ok) {
        const errData = await productsRes.json();
        if (errData.detail === "Owner is not associated with any company") {
          setNeedsCompany(true);
          return;
        }
        throw new Error(errData.detail || 'Catalog connection failure');
      }
      
      const [productsData, queriesData, personnelData, statsData] = await Promise.all([
        productsRes.json(),
        queriesRes.json(),
        personnelRes.json(),
        statsRes.json()
      ]);
      
      setProducts(productsData);
      setQueries(queriesData);
      setPersonnel(personnelData);
      setStats(statsData);
      setCompanyFormData({ name: statsData.company_name, description: '' });
      setNeedsCompany(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupCompany = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/setup-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyFormData)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Company Provisioning Failed');
      }
      
      setNeedsCompany(false);
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
<<<<<<< Updated upstream
      if (!response.ok) throw new Error('Registration failed');
      await fetchProducts();
=======
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Unit Provisioning Failed');
      }
      
      const newProduct = await response.json();

      if (pendingFile) {
        const uploadData = new FormData();
        uploadData.append('file', pendingFile);
        const uploadRes = await fetch(`${API_BASE}/products/${newProduct.id}/upload-manual`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadData
        });
        
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(`Intelligence Extraction Failed: ${errData.detail || 'Unknown Signal Disruption'}`);
        }
      }

      await fetchData();
>>>>>>> Stashed changes
      setShowAddModal(false);
      setFormData({ name: '', description: '', manual_content: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateManual = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ manual_content: formData.manual_content })
      });
      if (!response.ok) throw new Error('Update signal failed');
      await fetchData();
      setShowEditModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this unit and all its RAG context?')) return;
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Deletion failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, manual_content: product.manual_content || '' });
    setShowEditModal(true);
  };

<<<<<<< Updated upstream
=======
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProduct) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${selectedProduct.id}/upload-manual`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      if (!response.ok) throw new Error('Intelligence extraction failed');
      const updatedProduct = await response.json();
      setFormData({ ...formData, manual_content: updatedProduct.manual_content });
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveQuery = async (queryId) => {
    try {
      const response = await fetch(`${API_BASE}/queries/${queryId}?status_update=RESOLVED`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Resolution signal failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/company`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyFormData)
      });
      if (!response.ok) throw new Error('Company update failed');
      await fetchData();
      setShowSettingsModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredQueries = queries.filter(q => 
    q.customer_name?.toLowerCase().includes(querySearch.toLowerCase()) || 
    q.product_name?.toLowerCase().includes(querySearch.toLowerCase()) || 
    q.query_text?.toLowerCase().includes(querySearch.toLowerCase())
  );

  if (needsCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-midnight-950 border border-white/10 rounded-[4rem] p-16 shadow-[0_0_150px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-aurora-gradient"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-primary/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10 text-center mb-12">
            <div className="w-24 h-24 bg-accent-primary/10 rounded-[2.5rem] flex items-center justify-center text-accent-primary mx-auto mb-8 border border-accent-primary/20 shadow-indigo-glow/20">
               <Building2 size={48} />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 italic">Initialize <span className="text-accent-primary text-glow-indigo">Entity</span></h2>
            <p className="text-midnight-400 font-medium leading-relaxed">
              Your account is currently a standalone node. You must provision your corporate entity to enable the AI Training systems and Product Catalogs.
            </p>
          </div>

          <form onSubmit={handleSetupCompany} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Company Name</label>
              <input 
                required autoFocus
                value={companyFormData.name} onChange={e => setCompanyFormData({...companyFormData, name: e.target.value})}
                placeholder="e.g. NEXUS GLOBAL SYSTEMS"
                className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all placeholder:text-midnight-700 text-base font-bold text-white shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Corporate Description</label>
              <textarea 
                value={companyFormData.description} onChange={e => setCompanyFormData({...companyFormData, description: e.target.value})}
                placeholder="Briefly overview your operations for the AI context..."
                className="w-full h-32 bg-midnight-900 border border-white/5 rounded-[2rem] py-6 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all resize-none text-sm leading-relaxed font-medium text-midnight-400 shadow-inner"
              />
            </div>
            <div className="pt-4">
              <button 
                type="submit" disabled={actionLoading}
                className="w-full py-6 bg-aurora-gradient rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-aurora-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={20}/> Deploy Corporate Node</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

>>>>>>> Stashed changes
  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
<<<<<<< Updated upstream
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
             <LayoutGrid className="text-indigo-600" size={32} />
             Asset & Intelligence Hub
          </h2>
          <p className="text-slate-500 text-sm font-medium">Provision assets and augment RAG intelligence vectors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-glass flex items-center gap-2">
            <Settings size={20} />
            <span>Manage Portal</span>
=======
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-indigo-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500">Node Status: Active</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-4">
             <LayoutGrid className="text-accent-primary" size={36} />
             Owner <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora italic">Dashboard</span>
          </h2>
          <p className="text-midnight-400 text-sm font-medium">Monitoring Node: <span className="text-accent-primary font-bold">{stats.company_name}</span> | Command clearance active.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="px-8 py-4 bg-midnight-900 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-midnight-800 hover:border-white/10 transition-all flex items-center gap-3"
          >
             <Settings size={18} className="text-accent-aurora" /> Profile Settings
>>>>>>> Stashed changes
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Provision New Asset</span>
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Unit Catalog */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                   <Package size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">Unit Catalog</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{products.length} Items Live</span>
           </div>
=======
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Live Inventory', value: stats.total_products, subtitle: 'Injected units', icon: Package, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Active Inquiries', value: stats.pending_queries, subtitle: 'Awaiting resolution', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Personnel Cluster', value: stats.total_personnel, subtitle: 'Linked operatives', icon: LayoutGrid, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
          { label: 'Total Volume', value: stats.total_queries, subtitle: 'Historical signals', icon: LayoutGrid, color: 'text-accent-aurora', bg: 'bg-accent-aurora/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-midnight-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 group hover:border-accent-primary/30 relative overflow-hidden"
          >
            <div className={`p-4 w-fit rounded-2xl mb-6 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-midnight-500 mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
              <span className="text-[10px] font-bold text-midnight-600 italic">{stat.subtitle}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Product Catalog */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-accent-primary/10 rounded-lg">
                   <Package size={24} className="text-accent-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Product Catalog</h3>
              </div>
              <div className="relative group min-w-[300px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-600" />
                <input 
                  type="text" 
                  placeholder="Filter inventory..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-midnight-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all placeholder:text-midnight-700"
                />
              </div>
            </div>
>>>>>>> Stashed changes

           {loading ? (
             <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                <Loader2 size={40} className="text-primary-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning Node Assets...</p>
             </div>
<<<<<<< Updated upstream
           ) : products.length === 0 ? (
             <div 
               onClick={() => setShowAddModal(true)}
               className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed group cursor-pointer hover:bg-slate-50 transition-all duration-300 shadow-sm"
             >
                <Package className="text-slate-200 group-hover:text-primary-300 transition-colors mb-4" size={56} />
                <h4 className="text-lg font-black text-slate-500">Zero Injected Assets</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Injection required to initialize resolution engine</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {products.map(product => (
=======
           ) : filteredProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-32 bg-midnight-950/20 rounded-[3rem] border border-white/5 border-dashed">
                <p className="text-midnight-600 font-bold uppercase tracking-widest text-sm italic">No matching products found.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               {filteredProducts.map(product => (
>>>>>>> Stashed changes
                 <motion.div 
                   layout
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   key={product.id} 
                   className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-soft group hover:shadow-elevated hover:border-primary-200 transition-all duration-300"
                 >
                   <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary-600 border border-slate-100">
                        <Package size={22} />
                     </div>
                     <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                       product.manual_content ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                     }`}>
                        {product.manual_content ? 'AI Vector Active' : 'RAG Pending'}
                     </span>
                   </div>
                   
                   <div className="mb-6">
                     <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-primary-600 transition-colors">{product.name}</p>
                     <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">{product.description || 'Description signal missing from registry'}</p>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" 
                          title="Augment Context"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                          title="Terminate Asset"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 group-hover:text-primary-400 transition-all" />
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

<<<<<<< Updated upstream
        {/* Integration Module */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
           <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                 <Download size={20} />
=======
        {/* Setup & Integration Module */}
        <div className="lg:col-span-4 flex flex-col space-y-8">
           <div className="flex items-center gap-4 px-2">
              <div className="p-2 bg-accent-aurora/10 rounded-lg">
                 <Download size={24} className="text-accent-aurora" />
>>>>>>> Stashed changes
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">Connectivity</h3>
           </div>
           
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-soft bg-gradient-to-br from-slate-50 to-white flex flex-col space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Global Webhook Endpoint</p>
                  <div className="group relative">
                    <code className="block p-4 bg-slate-100 rounded-2xl text-primary-700 font-mono text-[10px] break-all border border-slate-200 group-hover:bg-slate-200 transition-all">
                      http://127.0.0.1:8000/api/v1/webhook/google-forms
                    </code>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Company Hashed Signature</p>
                  <div className="group relative">
                    <code className="block p-4 bg-slate-100 rounded-2xl text-slate-600 font-mono text-[10px] border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      {products.length > 0 ? products[0].company_id : 'SIGNAL_INTERRUPTED'}
                    </code>
                  </div>
<<<<<<< Updated upstream
=======
                  <p className="text-[9px] text-midnight-600 font-bold italic leading-relaxed px-1">Mapping Node for Google Forms webhooks and customer inquiries.</p>
>>>>>>> Stashed changes
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                 <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.3em] ml-1">Personnel Strength</p>
                 <div className="space-y-3">
                   {personnel.length === 0 ? (
                     <p className="p-4 bg-midnight-900/50 rounded-xl text-[10px] text-midnight-600 font-bold border border-white/5 italic">No external reps detected.</p>
                   ) : (
                     personnel.map(user => (
                       <div key={user.id} className="p-4 bg-midnight-900/50 rounded-xl border border-white/5 flex items-center justify-between group hover:border-accent-primary/20 transition-all">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-midnight-800 flex items-center justify-center text-[10px] font-black text-accent-primary border border-white/5 shadow-inner">
                             {user.full_name?.charAt(0)}
                           </div>
                           <div>
                             <p className="text-[11px] font-black text-white">{user.full_name}</p>
                             <p className="text-[9px] text-midnight-600 font-bold">{user.role}</p>
                           </div>
                         </div>
                         <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-emerald-glow/50' : 'bg-midnight-700'}`}></div>
                       </div>
                     ))
                   )}
                 </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={20} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">RAG Engine V.02</p>
                 <p className="text-xs font-bold text-slate-600">Llama Node Active & Scaled</p>
              </div>

              <button className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                Download Integration Spec <ChevronRight size={14} />
              </button>
           </div>
        </div>
      </div>

      {/* Intelligence Monitor Section */}
      <section className="space-y-8 pt-8 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent-aurora/10 rounded-lg">
               <Sparkles size={24} className="text-accent-aurora" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white">Intelligence Monitor</h3>
          </div>
          <div className="relative group min-w-[400px]">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-600" />
             <input 
               type="text" 
               placeholder="Search inquiry history..."
               value={querySearch}
               onChange={(e) => setQuerySearch(e.target.value)}
               className="w-full bg-midnight-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-white focus:ring-4 focus:ring-accent-aurora/10 outline-none transition-all placeholder:text-midnight-700"
             />
          </div>
        </div>

        <div className="bg-midnight-950/20 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-midnight-950/40 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Target Product</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500">Inquiry Signal</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-midnight-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-[10px] font-bold text-midnight-600 tracking-widest uppercase italic">No inquiry signals detected in the current range.</td>
                  </tr>
                ) : (
                  filteredQueries.map(query => (
                    <tr key={query.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-[11px] font-black text-white">{query.customer_name}</p>
                        <p className="text-[9px] text-midnight-600 font-bold mt-1 tracking-wider">{query.customer_email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary bg-accent-primary/5 px-3 py-1 rounded-lg border border-accent-primary/10">
                          {query.product_name}
                        </span>
                      </td>
                      <td className="px-8 py-6 max-w-md">
                        <p className="text-[11px] text-midnight-300 line-clamp-2 leading-relaxed font-medium">{query.query_text}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                            query.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {query.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         {query.status === 'PENDING' && (
                           <button 
                            onClick={() => handleResolveQuery(query.id)}
                            className="p-3 bg-midnight-950 text-midnight-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-white/5 transition-all shadow-xl group-hover:scale-110 active:scale-95"
                            title="Resolve Manually"
                           >
                             <CheckCircle2 size={16} />
                           </button>
                         )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {/* Settings Modal (Company Profile) */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-midnight-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-aurora-gradient opacity-50"></div>
              
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-accent-aurora/10 text-accent-aurora flex items-center justify-center shadow-indigo-glow/20 border border-accent-aurora/20">
                    <Settings size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight italic">Node <span className="text-accent-aurora text-glow-aurora">Config</span></h3>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="p-4 bg-midnight-900 hover:bg-midnight-800 rounded-full text-midnight-400 transition-all border border-white/5 shadow-xl"><X /></button>
              </div>
              
              <form onSubmit={handleUpdateCompany} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Entity Name</label>
                  <input 
                    required autoFocus
                    value={companyFormData.name} onChange={e => setCompanyFormData({...companyFormData, name: e.target.value})}
                    placeholder="e.g. ULTRA NEXUS CORE"
                    className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-aurora/10 focus:bg-midnight-800 focus:border-accent-aurora/30 outline-none transition-all placeholder:text-midnight-700 text-base font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Entity Context/Description</label>
                  <textarea 
                    value={companyFormData.description} onChange={e => setCompanyFormData({...companyFormData, description: e.target.value})}
                    placeholder="Briefly overview your operations for the AI context..."
                    className="w-full h-32 bg-midnight-900 border border-white/5 rounded-[2rem] py-6 px-8 focus:ring-4 focus:ring-accent-aurora/10 focus:bg-midnight-800 focus:border-accent-aurora/30 outline-none transition-all resize-none text-sm leading-relaxed font-medium text-midnight-400 shadow-inner"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" onClick={() => setShowSettingsModal(false)}
                    className="flex-1 py-5 bg-midnight-900 border border-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-midnight-400 hover:text-white transition-all shadow-xl"
                  >
                    Abort Config
                  </button>
                  <button 
                    type="submit" disabled={actionLoading}
                    className="flex-[2] py-5 bg-aurora-gradient rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] text-white shadow-aurora-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Commit Config</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Provision Unit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-[3rem] border border-slate-200 p-10 z-10 shadow-elevated"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Plus size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provision Unit</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2.5 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><X /></button>
              </div>
              
              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Designation</label>
                  <input 
                    required autoFocus
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. SMART INTEGRATOR V10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all placeholder:text-slate-300 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Catalog Description</label>
                  <input 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Functionality overview"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intelligence Context (RAG Source)</label>
                  <textarea 
                    value={formData.manual_content} onChange={e => setFormData({...formData, manual_content: e.target.value})}
                    placeholder="Paste documentation content..."
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-primary-50 focus:bg-white focus:border-primary-400 outline-none transition-all resize-none text-xs leading-relaxed font-medium text-slate-500"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit" disabled={actionLoading}
                    className="btn-primary w-full py-5 flex items-center justify-center gap-3 tracking-widest uppercase text-[10px]"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Commit Asset Initialisation</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Augment Context Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-white rounded-[3.5rem] border border-slate-200 p-12 z-10 shadow-elevated"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <FileText size={30} />
                  </div>
                  <div>
<<<<<<< Updated upstream
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Augment Intel</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Entity: <span className="text-indigo-600 font-black italic">{selectedProduct?.name}</span></p>
=======
                    <h3 className="text-4xl font-black text-white tracking-tighter italic">Augment <span className="text-accent-aurora text-glow-aurora">Context</span></h3>
                    <p className="text-[12px] font-black text-midnight-500 uppercase tracking-[0.5em] mt-2">Target Unit: <span className="text-accent-aurora italic">{selectedProduct?.name}</span></p>
>>>>>>> Stashed changes
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><X /></button>
              </div>
              
              <form onSubmit={handleUpdateManual} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">RAG Context Vector (Full Textual Documentation)</label>
                  <textarea 
                    required autoFocus
                    value={formData.manual_content} onChange={e => setFormData({...formData, manual_content: e.target.value})}
                    placeholder="Update the intelligence vector signal..."
                    className="w-full h-96 bg-slate-50 border border-slate-200 rounded-[2.5rem] py-8 px-10 focus:ring-4 focus:ring-indigo-50 focus:bg-white outline-none transition-all resize-none text-[13px] leading-relaxed font-medium text-slate-600 shadow-inner"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" onClick={() => setShowEditModal(false)}
                    className="btn-glass flex-1 py-5 rounded-3xl"
                  >
                    Abort Edit
                  </button>
                  <button 
                    type="submit" disabled={actionLoading}
                    className="btn-primary flex-[2] py-5 flex items-center justify-center gap-3 tracking-widest uppercase text-[10px] rounded-3xl shadow-indigo-100"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Push Vector Update</>}
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

export default OwnerDashboard;
