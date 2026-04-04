import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Users, Database, MessageSquare, TrendingUp, Search, Plus, Filter, Loader2, Edit2, Trash2, Globe, Heart, Activity, BarChart3, ChevronRight, X, LayoutGrid, Laptop, Sparkles, FileText, Upload, CheckCircle2, AlertCircle, Home, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    company_name: 'NEURAL NEXUS',
    total_products: 0,
    total_team_members: 0,
    pending_queries: 0,
    resolved_queries: 0,
    escalated_queries: 0,
    products_missing_docs: 0,
    high_priority_pending: 0
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'home';
  const [assetSearch, setAssetSearch] = useState('');

  const [negotiations, setNegotiations] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [negotiationResponse, setNegotiationResponse] = useState('');
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', base_price: 0, max_discount_pct: 0 });
  const [provisionFile, setProvisionFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  
  const fileInputRefs = useRef({});
  const provisionFileInputRef = useRef(null);

  const API_BASE = 'http://127.0.0.1:8000/api/v1/owner';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes, historyRes, negRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/history`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/negotiations`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!statsRes.ok || !productsRes.ok || !historyRes.ok || !negRes.ok) {
        throw new Error(`Company node synchronization failed. Status codes: Stats:${statsRes.status}, Products:${productsRes.status}, History:${historyRes.status}, Neg:${negRes.status}`);
      }

      const [statsData, productsData, historyData, negData] = await Promise.all([
        statsRes.json(),
        productsRes.json(),
        historyRes.json(),
        negRes.json()
      ]);

      setStats(statsData);
      setProducts(productsData);
      setHistory(historyData);
      setNegotiations(negData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      
      if (!response.ok) throw new Error('Asset provisioning failed');
      const createdProduct = await response.json();

      if (provisionFile) {
        const formData = new FormData();
        formData.append('file', provisionFile);
        
        await fetch(`${API_BASE}/products/${createdProduct.id}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      await fetchData();
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: '', base_price: 0, max_discount_pct: 0 });
      setProvisionFile(null);
      alert("SUCCESS: Core Asset Provisioned & Knowledge Base Initialized");
    } catch (err) {
      alert(`PROVISION ERROR: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedProduct)
      });
      if (!response.ok) throw new Error('Asset update failed');
      await fetchData();
      setShowEditProduct(false);
      setSelectedProduct(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("CRITICAL: Final neutralization of asset node. Proceed?")) return;
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Neutralization failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("CRITICAL: Final neutralization of knowledge document. Proceed?")) return;
    try {
      const response = await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Neutralization failed');
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveNegotiation = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/negotiations/${selectedNegotiation.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          final_answer: negotiationResponse,
          status: 'resolved'
        })
      });
      if (!response.ok) throw new Error('Resolution delivery failed');
      await fetchData();
      setSelectedNegotiation(null);
      setNegotiationResponse('');
      alert("SUCCESS: Negotiated Price Dispatched via Secure Terminal");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSLA = (deadline) => {
    const remaining = new Date(deadline) - new Date();
    if (remaining < 0) return { text: 'EXPIRED', color: 'text-red-500', expired: true };
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${minutes}m`, color: hours < 12 ? 'text-red-400' : 'text-emerald-400', hours };
  };

  const handleFileUpload = async (productId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingId(productId);
      const response = await fetch(`${API_BASE}/products/${productId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Neural sync failed');
      }

      const data = await response.json();
      alert(`SUCCESS: Neural Indexing Complete\n${data.message}`);
      await fetchData();
    } catch (err) {
      alert(`ERROR: ${err.message}`);
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[productId]) {
        fileInputRefs.current[productId].value = "";
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <div className="absolute inset-0 blur-2xl bg-accent-secondary/20 rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Establishing Root Entity Link...</p>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-full">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg text-center">
        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Synchronization Failure</h3>
        <p className="text-red-400 font-mono text-sm">{error}</p>
      </div>
    </div>
  );

  const viewTitles = {
    home: { title: "Executive Command", subtitle: "Platform entity oversight and corporate asset orchestration" },
    assets: { title: "Asset Repository", subtitle: "Manage Corporate Assets" },
    negotiations: { title: "Negotiation Queue", subtitle: "Adjudicate Standard Signals" },
    negotiations: { title: "Negotiation Queue", subtitle: "Adjudicate Standard Signals" },
    critical: { title: "Critical Signals", subtitle: "Urgent SLA Escalations" },
    history: { title: "Platform Audit Log", subtitle: "Chronological Modification History" }
  };
  const { title, subtitle } = viewTitles[currentView] || viewTitles.home;

  const renderHome = () => (
    <div className="space-y-12">
      {/* Welcome Hero Section */}
      <div className="bg-amethyst-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-12 flex flex-col justify-between min-h-[420px] relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
             <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/20">System Healthy</span>
             <div className="w-12 h-[1px] bg-white/10"></div>
             <span className="text-slate-600 font-mono text-[9px] tracking-widest">{stats.company_name}</span>
          </div>
          <h3 className="text-6xl font-black text-white tracking-tighter italic mb-8">Executive <span className="text-accent-secondary">Overview</span></h3>
          <p className="text-slate-300 font-medium max-w-xl leading-loose text-[15px]">Welcome to your control center. Key metrics and actionable intelligence regarding assets, escalations, and personnel are consolidated here.</p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { 
            label: 'Corporate Assets', value: stats.total_products, subtitle: 'Digital product nodes', icon: Database, color: 'text-sky-400', bg: 'bg-sky-500/10',
            onClick: () => setSearchParams({ view: 'assets' }) 
          },
          { 
            label: 'Escalated Signals', value: stats.escalated_queries, subtitle: 'Standard adjudication', icon: Activity, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', alert: stats.escalated_queries > 0,
            onClick: () => setSearchParams({ view: 'negotiations' })
          },
          { 
            label: 'Critical / Breached', value: stats.high_priority_pending, subtitle: 'Action required immediately', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', alert: stats.high_priority_pending > 0,
            onClick: () => setSearchParams({ view: 'critical' })
          },
          { 
            label: 'Audit Events', value: history.length, subtitle: 'System modifications', icon: History, color: 'text-amber-400', bg: 'bg-amber-500/10',
            onClick: () => setSearchParams({ view: 'history' })
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={stat.onClick}
            className={`cursor-pointer bg-amethyst-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border group hover:border-accent-primary/30 relative overflow-hidden transition-all shadow-xl ${stat.alert ? 'border-red-500/40 shadow-red-500/10' : 'border-white/5'}`}
          >
            <div className={`p-4 w-fit rounded-2xl mb-6 ${stat.bg} ${stat.color} ${stat.alert ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`}>
              <Icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <p className={`text-4xl font-black tracking-tighter ${stat.alert ? 'text-red-400' : 'text-white group-hover:text-accent-secondary transition-colors'}`}>{stat.value}</p>
              <span className="text-[10px] font-bold text-slate-600 italic">{stat.subtitle}</span>
            </div>
          </motion.div>
        )})}
      </div>
    </div>
  );

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(assetSearch.toLowerCase()));

  // Filter negotiations. If finding "critical", look for priority === high OR SLA expired/breached (<0 or <12h based on strict interpretation, but let's use the calculateSLA to find if it's expired or high).
  const criticalNegotiations = negotiations.filter(neg => neg.priority === 'high' || calculateSLA(neg.deadline_at).expired);
  const standardNegotiations = negotiations.filter(neg => neg.priority !== 'high' && !calculateSLA(neg.deadline_at).expired);

  const renderNegotiationList = (negList, emptyMessage) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        {negList.length === 0 ? (
            <div className="py-20 text-center bg-amethyst-900/20 rounded-[3rem] border border-white/5">
              <p className="text-slate-600 font-black uppercase tracking-widest italic">{emptyMessage}</p>
            </div>
        ) : negList.map(neg => (
            <motion.div 
              key={neg.id}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-8 bg-amethyst-900/40 backdrop-blur-3xl rounded-[2.5rem] border transition-all cursor-pointer group ${selectedNegotiation?.id === neg.id ? 'border-accent-secondary shadow-fuchsia-glow/20 bg-amethyst-900' : 'border-white/5 hover:border-white/10'}`}
              onClick={() => setSelectedNegotiation(neg)}
            >
              <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border ${neg.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary'}`}>
                        {neg.priority === 'high' ? '!' : '?'}
                    </div>
                    <div>
                        <p className="text-lg font-black text-white italic">#{neg.complaint_id}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Escalated Priority: <span className={neg.priority === 'high' ? 'text-red-400' : 'text-accent-secondary'}>{neg.priority}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Time Remaining</p>
                    <p className={`text-lg font-mono font-black ${calculateSLA(neg.deadline_at).color}`}>{calculateSLA(neg.deadline_at).text}</p>
                  </div>
              </div>
              <p className="text-sm font-medium text-slate-400 line-clamp-2 italic mb-4">"{neg.query_text}"</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{neg.complainant_email}</span>
                  <ChevronRight size={18} className="text-slate-700 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
        ))}
      </div>

      <div className="relative">
        {selectedNegotiation ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="sticky top-12 p-10 bg-amethyst-950 border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amethyst-gradient"></div>
              <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-accent-secondary/10 text-accent-secondary flex items-center justify-center border border-accent-secondary/20">
                    <Activity size={28} />
                  </div>
                  <h4 className="text-2xl font-black text-white italic">Executive <span className="text-accent-secondary">Terminal</span></h4>
              </div>

              <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Signal Content</p>
                    <div className="p-6 bg-amethyst-900/60 rounded-2xl border border-white/5 italic text-slate-300 text-sm leading-relaxed">
                        {selectedNegotiation.query_text}
                    </div>
                  </div>

                  <form onSubmit={handleResolveNegotiation} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resolution Protocol (Price/Special Features)</label>
                        <textarea 
                          required
                          value={negotiationResponse}
                          onChange={(e) => setNegotiationResponse(e.target.value)}
                          placeholder="Set definitive price or specific value additions..."
                          className="w-full h-40 bg-amethyst-900 border border-white/5 rounded-2xl p-6 text-white text-sm outline-none focus:ring-4 focus:ring-accent-secondary/10 transition-all font-bold placeholder:text-slate-700 resize-none shadow-inner"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-6 bg-amethyst-gradient rounded-2xl text-white font-black text-[11px] uppercase tracking-[.3em] shadow-fuchsia-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Resolve & Notify Client</>}
                    </button>
                  </form>
              </div>
            </motion.div>
        ) : (
            <div className="h-full flex items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[3.5rem] opacity-30 italic font-black text-slate-700 uppercase tracking-widest text-center">
              Select a signal from the queue to initialize negotiation terminal
            </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Dynamic Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Root Access: {stats.company_name}</span>
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
        {currentView === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {renderHome()}
          </motion.div>
        )}

        {currentView === 'assets' && (
          <motion.div 
            key="assets"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-12"
          >
            <div className="xl:col-span-12 flex flex-col space-y-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-accent-primary/10 rounded-lg">
                        <Laptop size={24} className="text-accent-primary" />
                     </div>
                     <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Asset Repository</h3>
                  </div>
                  <div className="flex items-center gap-4 flex-1 max-w-sm ml-auto">
                    <div className="relative group flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type="text" 
                        placeholder="Search assets..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="w-full bg-amethyst-950/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
                      />
                    </div>
                    <button 
                      onClick={() => setShowAddProduct(true)}
                      className="px-6 py-3 bg-amethyst-gradient rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-amethyst-glow hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0"
                    >
                      <Plus size={16} /> Provision Asset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                   {filteredProducts.map((product, i) => (
                     <motion.div 
                       key={product.id}
                       initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                       className="bg-amethyst-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 group hover:border-accent-secondary/30 transition-all shadow-2xl relative overflow-hidden flex flex-col h-full"
                     >
                       <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-amethyst-950 rounded-2xl border border-white/5 text-accent-secondary">
                             <Database size={24} />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setSelectedProduct(product); setShowEditProduct(true); }}
                              className="p-3 bg-white/5 text-slate-400 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-accent-primary hover:text-white transition-all shadow-xl"
                            >
                               <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                            >
                               <Trash2 size={16} />
                            </button>
                          </div>
                       </div>

                       <div className="flex-grow">
                         <h4 className="text-xl font-black text-white mb-2 italic uppercase tracking-tight">{product.name}</h4>
                         <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-2">{product.description}</p>
                         
                         <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-amethyst-950 rounded-xl border border-white/5 text-center">
                               <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Mkt Price</p>
                               <p className="text-sm font-black text-white italic">${product.price}</p>
                            </div>
                            <div className="p-3 bg-amethyst-950 rounded-xl border border-white/5 text-center">
                               <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Max Disc</p>
                               <p className="text-sm font-black text-accent-secondary italic">{product.max_discount_pct}%</p>
                            </div>
                         </div>
                       </div>

                       <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                          <div className="flex flex-col gap-3">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Knowledge Library</span>
                                <span className="px-2 py-0.5 bg-amethyst-950 text-accent-primary text-[8px] font-black rounded-md">{product.documents?.length || 0} Nodes</span>
                             </div>
                             <div className="space-y-2">
                                {product.documents?.map(doc => (
                                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group/doc">
                                     <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText size={14} className="text-accent-secondary flex-shrink-0" />
                                        <span className="text-[9px] font-bold text-slate-400 truncate">{doc.filename}</span>
                                     </div>
                                     <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 text-slate-700 hover:text-red-500 transition-colors"><X size={12}/></button>
                                  </div>
                                ))}
                             </div>
                          </div>

                          <input type="file" className="hidden" ref={el => fileInputRefs.current[product.id] = el} onChange={(e) => handleFileUpload(product.id, e)} accept=".pdf,.txt,image/*" />
                          <button 
                            onClick={() => fileInputRefs.current[product.id]?.click()}
                            disabled={uploadingId === product.id}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[.2em] transition-all border ${uploadingId === product.id ? 'bg-amethyst-900 border-accent-secondary text-accent-secondary cursor-wait' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-accent-secondary/10 hover:border-accent-secondary/30 hover:text-white'}`}
                          >
                             {uploadingId === product.id ? <><Loader2 size={16} className="animate-spin" /><span className="animate-pulse">Neural Indexing...</span></> : <><Upload size={16} /><span>Append Knowledge</span></>}
                          </button>
                       </div>
                     </motion.div>
                   ))}
                </div>
            </div>
          </motion.div>
        )}

        {currentView === 'negotiations' && (
          <motion.div 
            key="negotiations"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col space-y-8"
          >
             <div className="flex items-center gap-4 px-2">
                <div className="p-2 bg-accent-secondary/10 rounded-lg"><Sparkles size={24} className="text-accent-secondary" /></div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Escalated Negotiation Queue</h3>
             </div>
             {renderNegotiationList(standardNegotiations, "All standard signals clear. No pending adjudications.")}
          </motion.div>
        )}

        {currentView === 'critical' && (
          <motion.div 
            key="critical"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col space-y-8"
          >
             <div className="flex items-center justify-between gap-4 px-2 tracking-widest">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-500/10 rounded-lg"><ShieldAlert size={24} className="text-red-500 animate-pulse" /></div>
                  <h3 className="text-xl font-black uppercase text-white italic">Critical / Breached Signals</h3>
                </div>
             </div>
             {renderNegotiationList(criticalNegotiations, "No critical escalations at this time.")}
          </motion.div>
        )}

        {currentView === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col space-y-8"
          >
             <div className="flex items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg"><History size={24} className="text-amber-500" /></div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Platform Audit Log</h3>
                </div>
             </div>

             <div className="bg-amethyst-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white/5">
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Action Type</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Node</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Detailed Telemetry</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {history.length === 0 ? (
                       <tr>
                         <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium italic">
                           No platform modifications have been recorded.
                         </td>
                       </tr>
                     ) : (
                       history.map((log) => (
                         <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className="text-sm font-mono text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-white/10 text-slate-300">
                               {log.action}
                             </span>
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <Database size={14} className="text-accent-secondary" />
                               <span className="text-sm font-black text-white italic tracking-tight">{log.entity_name}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <span className="text-sm text-slate-500">{log.details || '-'}</span>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Edit Asset Modal */}
        {showEditProduct && selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className="w-full max-w-xl bg-amethyst-950 border border-white/10 rounded-[3.5rem] p-12 z-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient"></div>
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black text-white tracking-widest italic uppercase">Edit Node <span className="text-accent-primary">Parameters</span></h3>
                 <button onClick={() => setShowEditProduct(false)} className="p-3 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all"><X /></button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Market Price (Display)</label>
                    <input value={selectedProduct.price} onChange={e => setSelectedProduct({...selectedProduct, price: e.target.value})} className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-accent-primary/10 transition-all text-white font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Base Cost (Internal)</label>
                       <input type="number" value={selectedProduct.base_price} onChange={e => setSelectedProduct({...selectedProduct, base_price: parseInt(e.target.value)})} className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-accent-primary/10 transition-all text-white font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Standard Max Disc%</label>
                       <input type="number" value={selectedProduct.max_discount_pct} onChange={e => setSelectedProduct({...selectedProduct, max_discount_pct: parseInt(e.target.value)})} className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-accent-primary/10 transition-all text-white font-bold" />
                    </div>
                 </div>
                 <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-amethyst-gradient rounded-2xl text-white font-black text-[11px] uppercase tracking-widest shadow-amethyst-glow transition-all">
                       {isSubmitting ? 'Synchronizing Node...' : 'Commit Meta-Data'}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Provision Asset Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-amethyst-950 border border-white/10 rounded-[3.5rem] p-10 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient"></div>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
                    <Database size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight italic">Provision <span className="text-accent-primary">New Asset</span></h3>
                </div>
                <button onClick={() => setShowAddProduct(false)} className="p-4 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all"><X /></button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Asset Name</label>
                    <input required autoFocus value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. OMEGA CORE v2" className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-accent-primary/10 focus:bg-amethyst-900 focus:border-accent-primary/30 outline-none transition-all placeholder:text-slate-700 text-sm font-bold text-white shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Market Price (Display)</label>
                    <input required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="99.00" className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-accent-primary/10 focus:bg-amethyst-900 focus:border-accent-primary/30 outline-none transition-all placeholder:text-slate-700 text-sm font-bold text-white shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Base Cost (Numerical)</label>
                    <input type="number" value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: parseInt(e.target.value)})} placeholder="10000" className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Max Pre-Auth Disc%</label>
                    <input type="number" value={newProduct.max_discount_pct} onChange={e => setNewProduct({...newProduct, max_discount_pct: parseInt(e.target.value)})} placeholder="15" className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none bg-transparent" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Technical Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Context for RAG intelligence..." className="w-full h-24 bg-amethyst-950 border border-white/5 rounded-[1.5rem] py-4 px-6 focus:ring-4 focus:ring-accent-primary/10 focus:bg-amethyst-900 focus:border-accent-primary/30 outline-none transition-all resize-none text-sm leading-relaxed font-bold text-slate-400 shadow-inner" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Neural Sync (PDF/TXT/IMG)</label>
                  <div 
                    onClick={() => provisionFileInputRef.current?.click()}
                    className={`relative w-full h-32 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer group ${provisionFile ? 'border-accent-secondary bg-accent-secondary/5' : 'border-white/10 bg-amethyst-950 hover:border-accent-primary/40 hover:bg-white/[0.02]'}`}
                  >
                     <input type="file" className="hidden" ref={provisionFileInputRef} accept=".pdf,.txt,image/*" onChange={(e) => setProvisionFile(e.target.files[0])} />
                     
                     {provisionFile ? (
                       <div className="text-center space-y-2">
                          <div className="w-10 h-10 bg-accent-secondary/10 rounded-xl flex items-center justify-center text-accent-secondary mx-auto animate-float">
                             <FileText size={20} />
                          </div>
                          <p className="text-[10px] font-black text-white italic truncate max-w-[150px] mx-auto">{provisionFile.name}</p>
                          <button onClick={(e) => {e.stopPropagation(); setProvisionFile(null)}} className="text-[8px] font-black text-red-500 uppercase hover:underline">Remove Node</button>
                       </div>
                     ) : (
                       <div className="text-center space-y-2">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-600 mx-auto group-hover:text-accent-primary group-hover:scale-110 transition-all">
                             <Upload size={20} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grounding Doc</p>
                          <p className="text-[8px] font-medium text-slate-700">Optional RAG Node</p>
                       </div>
                     )}
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-5 bg-amethyst-gradient rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] text-white shadow-fuchsia-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin" /><span>Initializing Knowledge Base...</span></> : <><Sparkles size={18}/> Provision & Connect Asset</>}
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
