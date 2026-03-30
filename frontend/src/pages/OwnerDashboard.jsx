import React, { useState } from 'react';
import { Package, FileText, Settings, Plus, Download } from 'lucide-react';

const OwnerDashboard = () => {
  const [products, setProducts] = useState([
    { id: 'p1', name: 'Smart Router Pro', description: 'Enterprise-grade router', manualStatus: 'Uploaded' },
    { id: 'p2', name: 'Cloud Hub X', description: 'Next-gen cloud connectivity', manualStatus: 'Pending' },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Company Owner Dashboard</h2>
        <div className="flex gap-4">
          <button className="px-6 py-2 glass-dark rounded-lg flex items-center gap-2 hover:bg-white/5 transition-all">
            <Settings size={20} />
            <span>Config</span>
          </button>
          <button className="px-6 py-2 bg-primary-600 rounded-lg flex items-center gap-2 hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/10">
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product List */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="text-primary-400" size={24} />
            <h3 className="text-lg font-semibold">My Products</h3>
          </div>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                    product.manualStatus === 'Uploaded' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {product.manualStatus}
                  </span>
                  <button className="p-2 text-slate-400 hover:bg-white/10 rounded-lg transition-all" title="Upload Manual">
                    <FileText size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Integration Details */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Download className="text-primary-400" size={24} />
            <h3 className="text-lg font-semibold">Integration Guide</h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-sm space-y-4">
            <p className="text-slate-300 font-medium italic">"Connect your Google Forms to our dashboard via your Hashed Company ID."</p>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Your Webhook Endpoint:</p>
              <code className="block p-3 bg-black/40 rounded-lg text-primary-300 font-mono text-xs overflow-x-auto">
                https://api.salesrag.com/v1/webhook/google-forms
              </code>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Your Company ID:</p>
              <code className="block p-3 bg-black/40 rounded-lg text-indigo-300 font-mono text-xs">
                hash123-your-secure-id
              </code>
            </div>
            <button className="text-primary-400 text-xs font-semibold hover:underline">Download full integration script (.gs)</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OwnerDashboard;
