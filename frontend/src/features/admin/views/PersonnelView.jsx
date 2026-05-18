"use client";

import { CheckCircle, Plus, Search, Shield, Trash2, X, XCircle } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { extractError } from "@/lib/api/client";

export function PersonnelView({
  users,
  companies,
  userSearch,
  setUserSearch,
  userFilter,
  setUserFilter,
  onAddUser,
  onChanged,
}) {
  const filtered = users.filter((u) => {
    const matches =
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(userSearch.toLowerCase());
    if (userFilter === "pending") return matches && !u.is_active;
    return matches;
  });

  const handleUpdate = async (id, data) => {
    try {
      await adminApi.updateUser(id, data);
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't update the user. Please try again."));
    }
  };

  const handleToggle = (id, isActive) => {
    const action = isActive ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this user?`))
      handleUpdate(id, { is_active: !isActive });
  };

  const handleRole = (id, role) => {
    if (window.confirm(`Change this user's role to ${role}?`)) handleUpdate(id, { role });
  };

  const handleCompany = (id, companyId) => handleUpdate(id, { company_id: companyId || null });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This can't be undone.")) return;
    try {
      await adminApi.deleteUser(id);
      await onChanged();
    } catch (err) {
      alert(extractError(err, "Couldn't delete the user. Please try again."));
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent-primary/10 rounded-lg">
            <Shield size={24} className="text-accent-primary" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white">Users</h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex bg-amethyst-900/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setUserFilter("all")}
              className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                userFilter === "all" ? "bg-accent-primary text-white" : "text-slate-600 hover:text-white"
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setUserFilter("pending")}
              className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
                userFilter === "pending" ? "bg-accent-secondary text-white" : "text-slate-600 hover:text-accent-secondary"
              }`}
            >
              Awaiting Approval{" "}
              {users.filter((u) => !u.is_active).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>
          <div className="relative min-w-[350px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-amethyst-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-6 text-xs text-white focus:ring-4 focus:ring-accent-primary/10 outline-none transition-all"
            />
          </div>
        </div>
        <button
          onClick={onAddUser}
          className="px-6 py-3 bg-amethyst-gradient rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-amethyst-glow hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-amethyst-900/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amethyst-950/60 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Name
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Role &amp; Company
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-slate-600 font-bold uppercase tracking-widest italic">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amethyst-900 border border-white/5 flex items-center justify-center font-black text-xs text-accent-primary shadow-inner uppercase">
                          {user.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white">{user.full_name}</p>
                          <p className="text-[9px] text-slate-600 font-bold tracking-wider">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRole(user.id, e.target.value)}
                          className="bg-amethyst-950 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 rounded-lg outline-none focus:border-accent-primary focus:text-accent-primary transition-all w-fit cursor-pointer"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Owner">Owner</option>
                          <option value="SalesRep">SalesRep</option>
                        </select>

                        <div className="flex flex-wrap gap-2 max-w-[200px]">
                          {user.assigned_companies?.length > 0 ? (
                            user.assigned_companies.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent-secondary/10 text-accent-secondary text-[8px] font-black uppercase rounded-md border border-accent-secondary/20"
                              >
                                {c.name}
                                <button
                                  onClick={() => handleCompany(user.id, null)}
                                  className="hover:text-red-500 transition-colors"
                                >
                                  <X size={8} />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
                              Not assigned
                            </span>
                          )}
                          <select
                            value=""
                            onChange={(e) => handleCompany(user.id, e.target.value)}
                            className="bg-amethyst-950 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500 px-2 py-0.5 rounded-md outline-none hover:border-accent-secondary transition-all w-fit cursor-pointer"
                          >
                            <option value="">+ Assign</option>
                            {companies
                              .filter((c) => !user.assigned_companies?.some((ac) => ac.id === c.id))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span
                          className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                            user.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggle(user.id, user.is_active)}
                          className={`p-2 rounded-lg border shadow-xl transition-all ${
                            user.is_active
                              ? "bg-red-500/5 text-red-500 border-red-500/20"
                              : "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {user.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg shadow-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
