"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/useTheme";
import { ownerApi } from "@/lib/api/owner";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SettingsModal } from "./SettingsModal";

export function DashboardShell({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ownerStats, setOwnerStats] = useState(null);

  useTheme(user?.theme);

  useEffect(() => {
    if (user?.role !== "Owner") return;
    ownerApi.stats().then(setOwnerStats).catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen bg-amethyst-950 text-slate-200 selection:bg-accent-primary/30 selection:text-white font-sans">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[25] lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
        ownerStats={ownerStats}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-amethyst-950 overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
