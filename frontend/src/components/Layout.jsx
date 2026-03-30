import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, PieChart, Briefcase, MessageSquare, LogOut, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { name: 'Admin', path: '/admin', icon: Users, show: user?.role === 'Admin' },
    { name: 'Manager', path: '/manager', icon: PieChart, show: user?.role === 'Manager' },
    { name: 'Owner', path: '/owner', icon: Briefcase, show: user?.role === 'Owner' },
    { name: 'Sales Rep', path: '/sales', icon: MessageSquare, show: user?.role === 'SalesRep' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 glass-dark border-r border-white/5 flex flex-col z-20">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
            SalesRAG
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' 
                : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name} Dashboard</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-lg">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium truncate">{user?.fullName || 'User Name'}</p>
                <p className="text-xs text-slate-500">{user?.role || 'Role'}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl w-96">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search data, queries, products..." 
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border border-slate-950"></span>
            </button>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};
