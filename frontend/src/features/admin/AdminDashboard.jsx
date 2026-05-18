"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Loader2 } from "lucide-react";
import { useAdminData } from "./hooks/useAdminData";
import { HomeView } from "./views/HomeView";
import { PersonnelView } from "./views/PersonnelView";
import { EntitiesView } from "./views/EntitiesView";
import { AddCompanyModal } from "./modals/AddCompanyModal";
import { AddUserModal } from "./modals/AddUserModal";
import { CompanyDetailModal } from "./modals/CompanyDetailModal";

const VIEW_TITLES = {
  home: { title: "Admin Home", subtitle: "Overview of your platform" },
  personnel: { title: "Manage Users", subtitle: "View and update user accounts" },
  entities: { title: "Manage Companies", subtitle: "All companies on your platform" },
};

export function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "home";

  const { users, companies, stats, auditLogs, neuralStats, loading, refetch } = useAdminData();

  const [userSearch, setUserSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const navigate = (view) => router.push(view === "home" ? "/admin" : `/admin?view=${view}`);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 size={64} className="text-accent-secondary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
          Loading...
        </p>
      </div>
    );

  const { title, subtitle } = VIEW_TITLES[currentView] || VIEW_TITLES.home;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-glow" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              All systems online
            </span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
            {title.split(" ")[0]}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              {title.split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refetch}
            className="p-4 bg-amethyst-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
            title="Refresh"
          >
            <Activity size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentView === "home" && (
            <HomeView
              stats={stats}
              users={users}
              companies={companies}
              auditLogs={auditLogs}
              neuralStats={neuralStats}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              onClickPending={() => {
                setUserFilter("pending");
                navigate("personnel");
              }}
            />
          )}
          {currentView === "personnel" && (
            <PersonnelView
              users={users}
              companies={companies}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              onAddUser={() => setShowAddUser(true)}
              onChanged={refetch}
            />
          )}
          {currentView === "entities" && (
            <EntitiesView
              companies={companies}
              companySearch={companySearch}
              setCompanySearch={setCompanySearch}
              onAddCompany={() => setShowAddCompany(true)}
              onOpenCompany={setSelectedCompany}
              onManageTeam={(companyName) => {
                setUserSearch(companyName);
                navigate("personnel");
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showAddCompany && (
          <AddCompanyModal
            onClose={() => setShowAddCompany(false)}
            onCreated={async () => {
              setShowAddCompany(false);
              await refetch();
            }}
          />
        )}
        {showAddUser && (
          <AddUserModal
            companies={companies}
            onClose={() => setShowAddUser(false)}
            onCreated={async () => {
              setShowAddUser(false);
              await refetch();
            }}
          />
        )}
        {selectedCompany && (
          <CompanyDetailModal
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
            onChanged={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
