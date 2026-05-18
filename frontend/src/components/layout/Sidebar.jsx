"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Database,
  History,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquare,
  PieChart,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

function getNavItems(role, ownerStats) {
  switch (role) {
    case "Admin":
      return [
        { name: "Home", path: "/admin", icon: Home, show: true },
        { name: "Users", path: "/admin?view=personnel", icon: Users, show: true },
        { name: "Companies", path: "/admin?view=entities", icon: Building2, show: true },
      ];
    case "Owner":
      return [
        { name: "Home", path: "/owner", icon: Home, show: true },
        { name: "Products", path: "/owner?view=assets", icon: Database, show: true },
        { name: "Escalations", path: "/owner?view=negotiations", icon: Sparkles, show: true },
        {
          name: "Urgent",
          path: "/owner?view=critical",
          icon: AlertTriangle,
          show: (ownerStats?.high_priority_pending || 0) > 0,
          alert: true,
          count: ownerStats?.high_priority_pending,
        },
        { name: "Activity", path: "/owner?view=history", icon: History, show: true },
      ];
    case "Manager":
      return [{ name: "Dashboard", path: "/manager", icon: PieChart, show: true }];
    case "SalesRep":
      return [{ name: "My Queries", path: "/sales", icon: MessageSquare, show: true }];
    default:
      return [];
  }
}

export function Sidebar({ isOpen, onClose, onOpenSettings, ownerStats }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  const isActive = (path) => {
    if (path.includes("?")) return fullPath === path;
    return pathname === path && (!searchParams || searchParams.toString() === "");
  };

  const navItems = getNavItems(user?.role, ownerStats);

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 w-80 bg-amethyst-950 border-r border-white/5 h-screen z-[30] flex flex-col transition-transform duration-500 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent-primary/20 group hover:shadow-aurora-glow transition-all duration-500">
            <LayoutGrid size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
              Sales<span className="text-accent-secondary italic">RAG</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">
              Dashboard
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-12 overflow-y-auto border-t border-white/5 pt-12">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 mb-6">
          Menu
        </p>
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 relative overflow-hidden ${
                isActive(item.path)
                  ? "bg-accent-primary/10 text-white font-bold"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {isActive(item.path) && (
                <motion.div
                  layoutId="active-pill-amethyst"
                  className={`absolute left-0 w-1 h-6 rounded-r-full shadow-fuchsia-glow ${
                    item.alert ? "bg-red-500" : "bg-accent-secondary"
                  }`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                size={20}
                className={`${
                  isActive(item.path)
                    ? item.alert
                      ? "text-red-500"
                      : "text-accent-secondary"
                    : "group-hover:text-accent-primary"
                } ${
                  item.alert && !isActive(item.path) ? "text-red-500/80 animate-pulse" : ""
                } transition-colors duration-500`}
              />
              <div className="flex items-center justify-between flex-1">
                <span
                  className={`tracking-wide text-sm font-semibold ${
                    item.alert && !isActive(item.path) ? "text-red-500/80" : ""
                  }`}
                >
                  {item.name}
                </span>
                {item.alert && (
                  <span className="w-5 h-5 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center text-[9px] font-black">
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 rounded-xl bg-amethyst-900 border border-white/10 flex items-center justify-center text-accent-secondary font-black text-lg shadow-inner shrink-0">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-sm text-white truncate leading-none">
              {user?.full_name || "User"}
            </p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
              {user?.role || "Member"}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-white/5 hover:bg-accent-primary/10 text-slate-400 hover:text-accent-primary transition-all font-black text-[9px] uppercase tracking-[0.3em] border border-white/5 hover:border-accent-primary/20 shadow-sm active:scale-95"
        >
          <Settings size={14} />
          Settings
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all font-black text-[9px] uppercase tracking-[0.3em] border border-white/5 hover:border-red-500/20 shadow-sm active:scale-95"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
