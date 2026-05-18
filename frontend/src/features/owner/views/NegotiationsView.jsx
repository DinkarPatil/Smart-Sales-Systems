"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, ChevronRight, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { ownerApi } from "@/lib/api/owner";
import { extractError } from "@/lib/api/client";
import { calculateSLA } from "../hooks/useOwnerData";

export function NegotiationsView({ negotiations, mode = "standard", onChanged }) {
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ownerApi.resolveNegotiation(selected.id, {
        final_answer: response,
        status: "Resolved",
      });
      setSelected(null);
      setResponse("");
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't send the reply. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const list = mode === "critical"
    ? negotiations.filter((n) => n.priority === "high" || calculateSLA(n.deadline_at).expired)
    : negotiations.filter((n) => n.priority !== "high" && !calculateSLA(n.deadline_at).expired);

  const emptyMessage = mode === "critical"
    ? "No urgent issues right now."
    : "All caught up! No pending escalations.";

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center gap-4 px-2">
        <div className={`p-2 ${mode === "critical" ? "bg-red-500/10" : "bg-accent-secondary/10"} rounded-lg`}>
          {mode === "critical" ? (
            <ShieldAlert size={24} className="text-red-500 animate-pulse" />
          ) : (
            <Sparkles size={24} className="text-accent-secondary" />
          )}
        </div>
        <h3 className="text-xl font-black uppercase tracking-widest text-white italic">
          {mode === "critical" ? "Urgent Issues" : "Pending Escalations"}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {list.length === 0 ? (
            <div className="py-20 text-center bg-amethyst-900/20 rounded-[3rem] border border-white/5">
              <p className="text-slate-600 font-black uppercase tracking-widest italic">{emptyMessage}</p>
            </div>
          ) : (
            list.map((neg) => {
              const sla = calculateSLA(neg.deadline_at);
              return (
                <motion.div
                  key={neg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelected(neg)}
                  className={`p-8 bg-amethyst-900/40 backdrop-blur-3xl rounded-[2.5rem] border transition-all cursor-pointer group ${
                    selected?.id === neg.id
                      ? "border-accent-secondary bg-amethyst-900"
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border ${
                          neg.priority === "high"
                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                            : "bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary"
                        }`}
                      >
                        {neg.priority === "high" ? "!" : "?"}
                      </div>
                      <div>
                        <p className="text-lg font-black text-white italic">#{neg.complaint_id}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                          Priority:{" "}
                          <span className={neg.priority === "high" ? "text-red-400" : "text-accent-secondary"}>
                            {neg.priority}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">
                        Time Left
                      </p>
                      <p className={`text-lg font-mono font-black ${sla.color}`}>{sla.text}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-400 line-clamp-2 italic mb-4">
                    &ldquo;{neg.query_text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                      {neg.complainant_email}
                    </span>
                    <ChevronRight size={18} className="text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div>
          {selected ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-12 p-10 bg-amethyst-950 border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amethyst-gradient" />
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-accent-secondary/10 text-accent-secondary flex items-center justify-center border border-accent-secondary/20">
                  <Activity size={28} />
                </div>
                <h4 className="text-2xl font-black text-white italic">
                  Your <span className="text-accent-secondary">Reply</span>
                </h4>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Customer Question
                  </p>
                  <div className="p-6 bg-amethyst-900/60 rounded-2xl border border-white/5 italic text-slate-300 text-sm leading-relaxed">
                    {selected.query_text}
                  </div>
                </div>

                <form onSubmit={handleResolve} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Your Response (price or special offer)
                    </label>
                    <textarea
                      required
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your final price or offer here..."
                      className="w-full h-40 bg-amethyst-900 border border-white/5 rounded-2xl p-6 text-white text-sm outline-none focus:ring-4 focus:ring-accent-secondary/10 font-bold placeholder:text-slate-700 resize-none shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-6 bg-amethyst-gradient rounded-2xl text-white font-black text-[11px] uppercase tracking-[.3em] shadow-fuchsia-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={18} /> Send Reply to Customer
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[3.5rem] opacity-30 italic font-black text-slate-700 uppercase tracking-widest text-center">
              Pick a query from the list to reply
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
