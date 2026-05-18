"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ownerApi } from "@/lib/api/owner";
import { extractError } from "@/lib/api/client";

export function EditProductModal({ product, onClose, onSaved }) {
  const [draft, setDraft] = useState(product);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ownerApi.updateProduct(draft.id, {
        price: draft.price,
        base_price: draft.base_price,
        max_discount_pct: draft.max_discount_pct,
      });
      await onSaved();
    } catch (err) {
      alert(extractError(err, "Couldn't save changes. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl bg-amethyst-950 border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-8 md:p-12 z-10 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-amethyst-gradient" />
        <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-widest italic uppercase pr-4">
            Edit <span className="text-accent-primary">Product</span>
          </h3>
          <button
            onClick={onClose}
            className="p-3 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">
              Price
            </label>
            <input
              value={draft.price || ""}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 focus:ring-4 focus:ring-accent-primary/10 text-white font-bold outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">
                Base Cost (cents)
              </label>
              <input
                type="number"
                value={draft.base_price || 0}
                onChange={(e) => setDraft({ ...draft, base_price: parseInt(e.target.value || 0, 10) })}
                className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 focus:ring-4 focus:ring-accent-primary/10 text-white font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">
                Max Discount %
              </label>
              <input
                type="number"
                value={draft.max_discount_pct || 0}
                onChange={(e) => setDraft({ ...draft, max_discount_pct: parseInt(e.target.value || 0, 10) })}
                className="w-full bg-amethyst-900 border border-white/5 rounded-2xl py-3 sm:py-4 px-5 sm:px-6 focus:ring-4 focus:ring-accent-primary/10 text-white font-bold outline-none"
              />
            </div>
          </div>
          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 sm:py-5 bg-amethyst-gradient rounded-2xl text-white font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-amethyst-glow transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
