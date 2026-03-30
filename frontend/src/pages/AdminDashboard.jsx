import React, { useState } from 'react';
import { Users, Building2, CheckCircle, XCircle, Plus, Edit2 } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([
    { id: '1', name: 'John Doe', email: 'john@sales.com', role: 'SalesRep', active: false },
    { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Owner', active: true },
  ]);

  const [companies, setCompanies] = useState([
    { id: 'hash123', name: 'TechCorp', products: 5, salesReps: 2 },
    { id: 'hash456', name: 'SaaSify', products: 3, salesReps: 1 },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Management</h2>
        <button className="px-6 py-2 bg-primary-600 rounded-lg flex items-center gap-2 hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/10">
          <Plus size={20} />
          <span>New Company</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Approval List */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-primary-400" size={24} />
            <h3 className="text-lg font-semibold">User Management</h3>
          </div>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email} • {user.role}</p>
                </div>
                <div className="flex gap-2">
                  {!user.active ? (
                    <button className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-all" title="Approve">
                      <CheckCircle size={20} />
                    </button>
                  ) : (
                    <button className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Deactivate">
                      <XCircle size={20} />
                    </button>
                  )}
                  <button className="p-2 text-slate-400 hover:bg-white/10 rounded-lg transition-all">
                    <Edit2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Company Integration List */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="text-primary-400" size={24} />
            <h3 className="text-lg font-semibold">Integrated Companies</h3>
          </div>
          <div className="space-y-4">
            {companies.map(company => (
              <div key={company.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{company.name}</p>
                  <span className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-400 uppercase tracking-wider font-mono">
                    ID: {company.id}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{company.products} Products</span>
                  <span>{company.salesReps} Sales Reps</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
