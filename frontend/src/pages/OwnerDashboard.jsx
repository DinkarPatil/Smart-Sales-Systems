import React, { useState, useEffect } from 'react';
import { Package, FileText, Settings, Plus, Download, Trash2, X, Save, Loader2, AlertCircle, Sparkles, ChevronRight, LayoutGrid, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OwnerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({ name: '', description: '', manual_content: '' });

  const API_BASE = 'http://127.0.0.1:8000/api/v1/owner';
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Catalog connection failure');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      if (!response.ok) throw new Error('Registration failed');
      await fetchProducts();
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
      await fetchProducts();
      setShowEditModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product and its documentation?')) return;
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Deletion failed');
      await fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, manual_content: product.manual_content || '' });
    setShowEditModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-indigo-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500">Live Inventory</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-4">
             <LayoutGrid className="text-accent-primary" size={36} />
             Injected <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-aurora italic">Products</span>
          </h2>
          <p className="text-midnight-400 text-sm font-medium">Manage your product catalog and train the AI on specific documentation.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-midnight-900 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-midnight-800 hover:border-white/10 transition-all flex items-center gap-3">
             <Settings size={18} className="text-accent-aurora" /> Portal Settings
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-4 bg-aurora-gradient rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-aurora-glow hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={20} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Product Catalog */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-accent-primary/10 rounded-lg">
                   <Package size={24} className="text-accent-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Inventory Management</h3>
              </div>
              <span className="text-[10px] font-black text-midnight-500 uppercase tracking-widest">{products.length} Products Active</span>
           </div>

           {loading ? (
             <div className="flex flex-col items-center justify-center p-32 bg-midnight-950/20 rounded-[3rem] border border-white/5 backdrop-blur-xl">
                <div className="relative mb-6">
                  <Loader2 size={48} className="text-accent-aurora animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-accent-aurora/20 animate-pulse"></div>
                </div>
                <p className="text-midnight-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Product Database...</p>
             </div>
           ) : products.length === 0 ? (
             <div 
               onClick={() => setShowAddModal(true)}
               className="flex flex-col items-center justify-center p-32 bg-midnight-950/20 rounded-[3rem] border border-white/5 border-dashed group cursor-pointer hover:bg-midnight-900/40 transition-all duration-500"
             >
                <div className="w-24 h-24 bg-midnight-900 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-2xl border border-white/5">
                  <Package className="text-midnight-700 group-hover:text-accent-primary transition-colors" size={48} />
                </div>
                <h4 className="text-2xl font-black text-white tracking-tight">Empty Catalog</h4>
                <p className="text-midnight-500 text-xs font-bold uppercase tracking-widest mt-3">Inject your first product to train the AI engine</p>
                <button className="mt-8 px-6 py-3 bg-midnight-900 border border-white/5 rounded-xl text-accent-aurora text-[10px] font-black uppercase tracking-widest hover:bg-midnight-800 transition-all">Initialize Injection</button>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               {products.map(product => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   key={product.id} 
                   className="bg-midnight-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl group hover:border-accent-primary/30 transition-all duration-500 relative overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   
                   <div className="flex items-center justify-between mb-8 relative z-10">
                     <div className="w-14 h-14 rounded-[1.25rem] bg-midnight-950 flex items-center justify-center text-accent-primary border border-white/5 shadow-inner">
                        <Package size={28} />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                       product.manual_content ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-glow/20'
                     }`}>
                        {product.manual_content ? 'AI Trained' : 'Needs Doc'}
                     </span>
                   </div>
                   
                   <div className="mb-8 relative z-10">
                     <p className="font-black text-white text-2xl leading-tight tracking-tight group-hover:text-accent-primary transition-colors">{product.name}</p>
                     <p className="text-sm text-midnight-400 font-medium mt-3 line-clamp-2 leading-relaxed">{product.description || 'No description provided.'}</p>
                   </div>

                   <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-3 bg-midnight-950 text-midnight-500 hover:text-white hover:bg-midnight-800 rounded-2xl border border-white/5 transition-all shadow-xl" 
                          title="Edit Documentation"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-3 bg-midnight-950 text-midnight-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl border border-white/5 transition-all shadow-xl" 
                          title="Remove Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="p-2 bg-midnight-950 rounded-xl border border-white/5 group-hover:bg-accent-primary group-hover:text-white transition-all shadow-lg">
                        <ChevronRight size={18} />
                      </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

        {/* Integration Module */}
        <div className="lg:col-span-4 flex flex-col space-y-8">
           <div className="flex items-center gap-4 px-2">
              <div className="p-2 bg-accent-aurora/10 rounded-lg">
                 <Download size={24} className="text-accent-aurora" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Setup & Sync</h3>
           </div>
           
           <div className="bg-midnight-950/20 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-10 shadow-2xl space-y-10 border-t-accent-aurora/20">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.3em]">Webhook Endpoint</p>
                    <button onClick={() => copyToClipboard("http://127.0.0.1:8000/api/v1/webhook/google-forms")}>
                      {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} className="text-midnight-500 hover:text-white" />}
                    </button>
                  </div>
                  <div className="group relative">
                    <code className="block p-5 bg-midnight-900 border border-white/5 rounded-2xl text-accent-primary font-mono text-[10px] break-all group-hover:bg-midnight-800 transition-all shadow-inner">
                      http://127.0.0.1:8000/api/v1/webhook/google-forms
                    </code>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-midnight-500 uppercase tracking-[0.3em] ml-1">Your Company ID</p>
                  <div className="group relative">
                    <code className="block p-5 bg-midnight-900 border border-white/5 rounded-2xl text-white font-mono text-[10px] group-hover:bg-indigo-500/10 group-hover:text-accent-aurora transition-all shadow-inner">
                      {products.length > 0 ? products[0].company_id : 'NO_DATA_LINK'}
                    </code>
                  </div>
                  <p className="text-[9px] text-midnight-600 font-bold italic leading-relaxed px-1">Use this ID in your Google Forms to map responses to your company.</p>
                </div>
              </div>
              
              <div className="p-8 bg-midnight-900/40 rounded-[2rem] border border-white/5 text-center shadow-inner relative overflow-hidden group">
                 <div className="absolute inset-0 bg-accent-aurora/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
                 <div className="w-14 h-14 rounded-full bg-accent-aurora/20 text-accent-aurora flex items-center justify-center mx-auto mb-6 border border-accent-aurora/30 relative z-10">
                    <Sparkles size={24} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500 mb-2 relative z-10">Neural Engine V2</p>
                 <p className="text-sm font-black text-white relative z-10 italic">Llama-3 High Latency Active</p>
              </div>

              <button className="w-full py-5 bg-midnight-900 border border-white/5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-midnight-400 hover:text-white hover:bg-midnight-800 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl border-b-accent-aurora/40">
                Setup Instructions <ChevronRight size={18} className="text-accent-aurora" />
              </button>
           </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotateX: 10 }} animate={{ scale: 1, opacity: 1, rotateX: 0 }} exit={{ scale: 0.9, opacity: 0, rotateX: 10 }}
              className="w-full max-w-xl bg-midnight-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-aurora-gradient opacity-50"></div>
              
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-indigo-glow/20 border border-accent-primary/20">
                    <Plus size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight italic">Provision <span className="text-accent-primary">Unit</span></h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-4 bg-midnight-900 hover:bg-midnight-800 rounded-full text-midnight-400 transition-all border border-white/5 shadow-xl"><X /></button>
              </div>
              
              <form onSubmit={handleCreateProduct} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Product Name</label>
                  <input 
                    required autoFocus
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. ULTRA NEXUS CORE"
                    className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all placeholder:text-midnight-700 text-base font-bold text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Short Description</label>
                  <input 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe what this is..."
                    className="w-full bg-midnight-900 border border-white/5 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all placeholder:text-midnight-700 text-sm font-medium text-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-midnight-500 ml-2">Product Manual (AI Context)</label>
                  <textarea 
                    value={formData.manual_content} onChange={e => setFormData({...formData, manual_content: e.target.value})}
                    placeholder="Paste documentation or manual content here. This is used by the AI to answer customer questions."
                    className="w-full h-48 bg-midnight-900 border border-white/5 rounded-[2rem] py-6 px-8 focus:ring-4 focus:ring-accent-primary/10 focus:bg-midnight-800 focus:border-accent-primary/30 outline-none transition-all resize-none text-sm leading-relaxed font-medium text-midnight-400 shadow-inner"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" disabled={actionLoading}
                    className="w-full py-6 bg-aurora-gradient rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-aurora-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Commit Injection</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl bg-midnight-950 border border-white/10 rounded-[4rem] p-16 z-10 shadow-[0_0_150px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-aurora/5 rounded-full blur-[100px]"></div>
              
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-midnight-900 text-accent-aurora flex items-center justify-center border border-white/5 shadow-inner">
                    <FileText size={36} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter italic">Augment <span className="text-accent-aurora">Context</span></h3>
                    <p className="text-[12px] font-black text-midnight-500 uppercase tracking-[0.5em] mt-2">Target Unit: <span className="text-accent-aurora italic">{selectedProduct?.name}</span></p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-5 bg-midnight-900 hover:bg-midnight-800 rounded-full text-midnight-400 border border-white/5 shadow-2xl transition-all"><X /></button>
              </div>
              
              <form onSubmit={handleUpdateManual} className="space-y-12 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[12px] font-black uppercase tracking-[0.5em] text-midnight-400">Knowledge Vector Source</label>
                    <span className="text-[10px] text-midnight-600 font-bold uppercase tracking-widest">Marked for high-priority indexing</span>
                  </div>
                  <textarea 
                    required autoFocus
                    value={formData.manual_content} onChange={e => setFormData({...formData, manual_content: e.target.value})}
                    placeholder="Specify the documentation text..."
                    className="w-full h-[500px] bg-midnight-900 border border-white/5 rounded-[3rem] py-10 px-12 focus:ring-8 focus:ring-accent-aurora/5 focus:bg-midnight-800 focus:border-accent-aurora/30 outline-none transition-all resize-none text-base leading-loose font-medium text-white shadow-inner"
                  />
                </div>
                <div className="flex gap-6">
                  <button 
                    type="button" onClick={() => setShowEditModal(false)}
                    className="flex-1 py-6 bg-midnight-900 border border-white/5 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] text-midnight-400 hover:text-white transition-all shadow-xl"
                  >
                    Abort Update
                  </button>
                  <button 
                    type="submit" disabled={actionLoading}
                    className="flex-[2] py-6 bg-aurora-gradient rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] text-white shadow-aurora-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Save size={24}/> Finalize Injection</>}
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
