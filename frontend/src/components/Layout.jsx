import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, PieChart, Briefcase, MessageSquare, LogOut, Search, Bell, Menu, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Admin', path: '/admin', icon: Users, show: user?.role === 'Admin' },
    { name: 'Manager', path: '/manager', icon: PieChart, show: user?.role === 'Manager' },
    { name: 'Owner', path: '/owner', icon: Briefcase, show: user?.role === 'Owner' },
    { name: 'Sales Rep', path: '/sales', icon: MessageSquare, show: user?.role === 'SalesRep' },
  ];

  return (
    <div className="flex min-h-screen bg-midnight-950 text-midnight-200 selection:bg-accent-aurora/30 selection:text-white">
      {/* Sidebar - Midnight Panel */}
      <aside className="w-80 bg-midnight-950 border-r border-white/5 h-screen sticky top-0 z-20 flex flex-col shadow-2xl">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent-primary/20">
                <LayoutGrid size={28} />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tight text-white leading-none">
                  Sales<span className="text-aurora italic">RAG</span>
                </h1>
                <p className="text-[9px] font-bold text-midnight-500 uppercase tracking-[0.3em] mt-1">Intelligence Node</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-10 overflow-y-auto">
          <p className="px-6 text-[10px] font-black uppercase tracking-[0.4em] text-midnight-600 mb-6">Navigation</p>
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 relative ${
                location.pathname === item.path 
                ? 'bg-accent-primary/10 text-accent-aurora font-bold' 
                : 'text-midnight-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {location.pathname === item.path && (
                <motion.div 
                   layoutId="active-pill-aurora"
                   className="absolute left-0 w-1.5 h-6 bg-accent-aurora rounded-r-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={22} className={`${location.pathname === item.path ? 'text-accent-aurora' : 'group-hover:text-accent-primary'} transition-colors duration-500`} />
              <span className="tracking-wide text-sm font-semibold">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-8 px-2">
             <div className="w-12 h-12 rounded-2xl bg-midnight-900 border border-white/10 flex items-center justify-center text-accent-aurora font-black text-lg shadow-inner">
                {user?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-white truncate leading-none">{user?.full_name || 'Operator'}</p>
                <p className="text-[10px] font-bold text-midnight-500 uppercase tracking-widest mt-2">{user?.role || 'Access'}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-midnight-900 hover:bg-red-500/10 text-midnight-400 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 hover:border-red-500/20 shadow-lg active:scale-95"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-midnight-950">
        <header className="h-24 bg-midnight-950/60 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-12 border-b border-white/5 shadow-2xl">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 bg-midnight-900/50 border border-white/5 px-6 py-3 rounded-2xl w-[480px] group focus-within:bg-midnight-900 focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary/40 transition-all duration-500">
              <Search size={20} className="text-midnight-500 group-focus-within:text-accent-aurora transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-midnight-600 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
            <button className="p-3 rounded-2xl hover:bg-white/5 text-midnight-400 transition-all relative group">
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-accent-aurora rounded-full border-2 border-midnight-950 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
            </button>
            <div className="flex items-center gap-4 bg-midnight-900/80 py-2.5 px-6 rounded-2xl border border-white/5 shadow-inner">
               <div className="w-2.5 h-2.5 bg-accent-aurora rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.4)]"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-aurora/80">System Online</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-12 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
