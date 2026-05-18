"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

export function EscalateModal({ onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("normal");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-amethyst-950 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-lg font-black italic text-white mb-1">Escalate to Owner</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-6">
          Your owner will be notified by email.
        </p>

        <div className="space-y-5">
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this need your owner's attention?"
              className="w-full h-28 bg-amethyst-900/60 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-accent-secondary/50 resize-none placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">
              How urgent?
            </label>
            <div className="flex gap-3">
              {["normal", "high"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    priority === p
                      ? p === "high"
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-accent-secondary/20 border-accent-secondary/50 text-accent-secondary"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {p === "high" ? "Urgent — reply in 12h" : "Normal — reply in 48h"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason, priority)}
            disabled={!reason.trim() || loading}
            className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Escalate
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
