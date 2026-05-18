"use client";

import { Database, History } from "lucide-react";

const ACTION_LABELS = {
  PRODUCT_PROVISIONED: "Product added",
  PRODUCT_MODIFIED: "Product updated",
  PRODUCT_NEUTRALIZED: "Product deleted",
  KNOWLEDGE_INDEXED: "Document added",
  KNOWLEDGE_REMOVED: "Document removed",
};

const formatAction = (action) =>
  ACTION_LABELS[action] ||
  action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

export function HistoryView({ history }) {
  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <History size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white italic">
            Activity Log
          </h3>
        </div>
      </div>

      <div className="bg-amethyst-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  When
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  What
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Item
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium italic">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-white/10 text-slate-300">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Database size={14} className="text-accent-secondary" />
                        <span className="text-sm font-black text-white italic tracking-tight">
                          {log.entity_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{log.details || "-"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
