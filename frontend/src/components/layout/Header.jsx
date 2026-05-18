"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, Search } from "lucide-react";

const NOTIFICATIONS = [
  { id: 1, title: "Account Updated", message: "Your access level was updated.", time: "2m ago" },
  { id: 2, title: "AI Update", message: "AI model finished training.", time: "15m ago" },
  { id: 3, title: "New Query", message: "A new high-priority query was assigned to your team.", time: "1h ago" },
];

export function Header({ onOpenSidebar }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-20 lg:h-24 bg-amethyst-950/60 backdrop-blur-3xl sticky top-0 z-10 flex items-center justify-between px-6 lg:px-12 border-b border-white/5">
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-3 rounded-xl bg-amethyst-900 border border-white/5 text-slate-400 hover:text-white transition-all shadow-xl"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-4 bg-white/5 border border-white/5 px-4 lg:px-6 py-2.5 lg:py-3 rounded-2xl flex-1 max-w-[480px] group focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary/40 transition-all duration-500">
          <Search size={20} className="text-slate-500 group-focus-within:text-accent-secondary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-600 text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 relative">
        <div className="h-10 w-[1px] bg-white/5 mx-2" />
        <button
          onClick={() => setOpen(!open)}
          className="p-3 rounded-2xl hover:bg-white/5 text-slate-400 transition-all relative group"
        >
          <Bell
            size={22}
            className={`${open ? "text-accent-secondary" : ""} group-hover:rotate-12 transition-transform`}
          />
          <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-accent-secondary rounded-full border-2 border-amethyst-950 shadow-fuchsia-glow animate-pulse" />
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute top-20 right-0 w-96 bg-amethyst-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[50] overflow-hidden"
              >
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Notifications</h3>
                  <span className="text-[10px] font-black py-1 px-3 bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20">
                    {NOTIFICATIONS.length} New
                  </span>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="p-8 hover:bg-white/[0.02] transition-colors border-b border-white/5 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-accent-secondary mt-1.5 shadow-fuchsia-glow" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">
                              {n.title}
                            </p>
                            <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap italic">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="hidden md:flex items-center gap-4 bg-white/[0.02] py-2.5 px-6 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-3 h-3 rounded-full bg-accent-primary animate-pulse shadow-amethyst-glow" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary/80">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}
