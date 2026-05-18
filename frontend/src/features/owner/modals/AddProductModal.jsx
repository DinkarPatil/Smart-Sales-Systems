"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Database, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { ownerApi } from "@/lib/api/owner";
import { extractError } from "@/lib/api/client";

export function AddProductModal({ onClose, onCreated }) {
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    base_price: 0,
    max_discount_pct: 0,
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await ownerApi.createProduct(data);
      if (file) await ownerApi.uploadProductDoc(created.id, file);
      await onCreated();
    } catch (err) {
      alert(extractError(err, "Couldn't create the product. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-amethyst-950 border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-8 md:p-10 z-10 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient" />
        <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20 shrink-0">
              <Database size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight italic">
              New <span className="text-accent-primary">Product</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-3 sm:p-4 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
                Product Name
              </label>
              <input
                required
                autoFocus
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="e.g. Premium Plan"
                className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
                Price
              </label>
              <input
                required
                value={data.price}
                onChange={(e) => setData({ ...data, price: e.target.value })}
                placeholder="99.00"
                className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 focus:ring-4 focus:ring-accent-primary/10 outline-none text-sm font-bold text-white shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                Base Cost (cents)
              </label>
              <input
                type="number"
                value={data.base_price}
                onChange={(e) => setData({ ...data, base_price: parseInt(e.target.value || 0, 10) })}
                placeholder="10000"
                className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                Max Discount %
              </label>
              <input
                type="number"
                value={data.max_discount_pct}
                onChange={(e) => setData({ ...data, max_discount_pct: parseInt(e.target.value || 0, 10) })}
                placeholder="15"
                className="w-full bg-amethyst-950 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="What is this product? Helps the AI answer customer questions."
              className="w-full h-20 sm:h-24 bg-amethyst-950 border border-white/5 rounded-[1.5rem] py-3 sm:py-4 px-5 sm:px-6 focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all resize-none text-sm leading-relaxed font-bold text-slate-400 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">
              Product Manual (PDF, text or image)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative w-full h-24 sm:h-32 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center p-3 sm:p-4 transition-all cursor-pointer ${
                file
                  ? "border-accent-secondary bg-accent-secondary/5"
                  : "border-white/10 bg-amethyst-950 hover:border-accent-primary/40"
              }`}
            >
              <input
                type="file"
                className="hidden"
                ref={fileRef}
                accept=".pdf,.txt,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-secondary/10 rounded-xl flex items-center justify-center text-accent-secondary mx-auto animate-float">
                    <FileText size={18} />
                  </div>
                  <p className="text-[10px] font-black text-white italic truncate max-w-[150px] mx-auto">
                    {file.name}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-[8px] font-black text-red-500 uppercase hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-600 mx-auto">
                    <Upload size={18} />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Click to upload
                  </p>
                  <p className="text-[8px] font-medium text-slate-700">Optional — helps the AI</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 sm:pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 sm:py-5 bg-amethyst-gradient rounded-[1.5rem] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white shadow-fuchsia-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Save Product
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
