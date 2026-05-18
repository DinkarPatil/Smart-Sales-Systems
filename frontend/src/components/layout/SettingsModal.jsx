"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Monitor, Moon, Settings, Sun, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const THEMES = [
  { id: "system", label: "Auto", Icon: Monitor },
  { id: "amethyst", label: "Dark", Icon: Moon },
  { id: "white", label: "Light", Icon: Sun },
];

export function SettingsModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleTheme = async (theme) => {
    try {
      setBusy(true);
      await updateProfile({ theme });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-amethyst-950 border border-white/10 rounded-[2.5rem] p-10 z-10 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
              <Settings size={24} />
            </div>
            <h3 className="text-2xl font-black text-white italic">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Appearance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEMES.map(({ id, label, Icon }) => {
                const active = user?.theme === id || (!user?.theme && id === "system");
                return (
                  <button
                    key={id}
                    onClick={() => handleTheme(id)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                      active
                        ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                  </button>
                );
              })}
            </div>
            {busy && (
              <p className="text-[10px] font-black uppercase tracking-widest text-accent-secondary mt-4 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Saving...
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
