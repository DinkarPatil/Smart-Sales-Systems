import React, { useState, useEffect } from 'react';
import { Package, FileText, Settings, Plus, Download, Trash2, X, Save, Loader2, AlertCircle, Sparkles, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OwnerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    if (!window.confirm('Delete this unit and all its RAG context?')) return;
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

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
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

           {loading ? (
             <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                <Loader2 size={40} className="text-primary-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning Node Assets...</p>
             </div>
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

        {/* Integration Module */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
           <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                 <Download size={20} />
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

      {/* Modals */}
      <AnimatePresence>
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
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Augment Intel</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Entity: <span className="text-indigo-600 font-black italic">{selectedProduct?.name}</span></p>
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
