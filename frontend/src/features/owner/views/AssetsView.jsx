"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Edit2,
  FileText,
  Laptop,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ownerApi } from "@/lib/api/owner";
import { extractError } from "@/lib/api/client";
import { AddProductModal } from "../modals/AddProductModal";
import { EditProductModal } from "../modals/EditProductModal";

export function AssetsView({ products, onChanged }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This can't be undone.")) return;
    try {
      await ownerApi.deleteProduct(id);
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't delete the product. Please try again."));
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await ownerApi.deleteDocument(docId);
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't delete the document. Please try again."));
    }
  };

  const handleFileUpload = async (productId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingId(productId);
      const data = await ownerApi.uploadProductDoc(productId, file);
      alert(`Document added\n${data.message}`);
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't upload the file. Please try again."));
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[productId]) fileInputRefs.current[productId].value = "";
    }
  };

  return (
    <>
      <div className="xl:col-span-12 flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Laptop size={24} className="text-accent-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white italic">
              Your Products
            </h3>
          </div>
          <div className="flex items-center gap-4 flex-1 max-w-sm ml-auto">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-amethyst-950/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-amethyst-gradient rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-amethyst-glow hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-amethyst-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 group hover:border-accent-secondary/30 transition-all shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-amethyst-950 rounded-2xl border border-white/5 text-accent-secondary">
                  <Database size={24} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
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
                <h4 className="text-xl font-black text-white mb-2 italic uppercase tracking-tight">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-2">
                  {product.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-amethyst-950 rounded-xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">
                      Price
                    </p>
                    <p className="text-sm font-black text-white italic">${product.price}</p>
                  </div>
                  <div className="p-3 bg-amethyst-950 rounded-xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">
                      Max Discount
                    </p>
                    <p className="text-sm font-black text-accent-secondary italic">
                      {product.max_discount_pct}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                      Documents
                    </span>
                    <span className="px-2 py-0.5 bg-amethyst-950 text-accent-primary text-[8px] font-black rounded-md">
                      {product.documents?.length || 0} Files
                    </span>
                  </div>
                  <div className="space-y-2">
                    {product.documents?.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText size={14} className="text-accent-secondary flex-shrink-0" />
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            {doc.filename}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-slate-700 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <input
                  type="file"
                  className="hidden"
                  ref={(el) => (fileInputRefs.current[product.id] = el)}
                  onChange={(e) => handleFileUpload(product.id, e)}
                  accept=".pdf,.txt,image/*"
                />
                <button
                  onClick={() => fileInputRefs.current[product.id]?.click()}
                  disabled={uploadingId === product.id}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
                    uploadingId === product.id
                      ? "bg-amethyst-900 border-accent-secondary text-accent-secondary cursor-wait"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-accent-secondary/10 hover:border-accent-secondary/30 hover:text-white"
                  }`}
                >
                  {uploadingId === product.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="animate-pulse">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Add Document</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await onChanged();
          }}
        />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={async () => {
            setEditingProduct(null);
            await onChanged();
          }}
        />
      )}
    </>
  );
}
