import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, PieChart, Briefcase, MessageSquare, LogOut, Search, Bell, Menu, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = [
    { id: 1, title: 'Security Clearance', message: 'Admin access level synchronized.', time: '2m ago', type: 'system' },
    { id: 2, title: 'Neural Signal', message: 'AI Training node "Alpha" completed indexing.', time: '15m ago', type: 'info' },
    { id: 3, title: 'Inquiry Assigned', message: 'New high-priority lead assigned to Sales Unit.', time: '1h ago', type: 'action' },
  ];

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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-700">
      {/* Sidebar - Clean White Panel */}
      <aside className="w-72 bg-white border-r border-slate-200 h-screen sticky top-0 z-20 flex flex-col shadow-sm">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                <LayoutGrid size={24} />
             </div>
             <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Sales<span className="text-primary-600 italic">RAG</span>
             </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-10 overflow-y-auto">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Operations Center</p>
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 relative ${
                location.pathname === item.path 
                ? 'bg-primary-50 text-primary-700 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-pill-light"
                  className="absolute left-[-1rem] w-1.5 h-6 bg-primary-600 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={20} className={`${location.pathname === item.path ? 'text-primary-600' : 'group-hover:text-slate-700'}`} />
              <span className="tracking-tight text-sm">{item.name} Portal</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200">
                {user?.fullName?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-slate-900 truncate leading-none">{user?.fullName || 'Operator'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.role || 'Access'}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:border-red-200"
          >
            <LogOut size={16} />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-10 border-b border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl w-96 group focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 transition-all duration-300">
              <Search size={18} className="text-slate-400 group-focus-within:text-primary-500" />
              <input 
                type="text" 
                placeholder="Secure Database Search..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

<<<<<<< Updated upstream
          <div className="flex items-center gap-4">
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all relative group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-600 rounded-full border-2 border-white shadow-[0_0_8px_rgba(37,99,235,0.4)]"></span>
            </button>
            <div className="flex items-center gap-3 bg-slate-50 py-2 px-4 rounded-xl border border-slate-200">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node: Secure</span>
=======
          <div className="flex items-center gap-6 relative">
            <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-2xl hover:bg-white/5 text-midnight-400 transition-all relative group"
            >
              <Bell size={22} className={`${showNotifications ? 'text-accent-aurora' : ''} group-hover:rotate-12 transition-transform`} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-accent-aurora rounded-full border-2 border-midnight-950 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setShowNotifications(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute top-20 right-0 w-96 bg-midnight-950 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.6)] z-[50] overflow-hidden"
                  >
                    <div className="p-8 border-b border-white/5 bg-midnight-900/40 flex items-center justify-between">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">System Alerts</h3>
                       <span className="text-[10px] font-black py-1 px-3 bg-accent-aurora/10 text-accent-aurora rounded-full border border-accent-aurora/20">3 Active</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                       {notifications.map(n => (
                         <div key={n.id} className="p-8 hover:bg-white/[0.02] transition-colors border-b border-white/5 group cursor-pointer">
                            <div className="flex items-start gap-4">
                               <div className="w-2 h-2 rounded-full bg-accent-aurora mt-1.5 shadow-aurora-glow group-hover:scale-125 transition-transform"></div>
                               <div className="flex-1">
                                  <div className="flex items-center justify-between gap-4 mb-2">
                                     <p className="text-[11px] font-black text-white uppercase tracking-widest">{n.title}</p>
                                     <span className="text-[9px] font-bold text-midnight-600 whitespace-nowrap italic">{n.time}</span>
                                  </div>
                                  <p className="text-xs text-midnight-400 font-medium leading-relaxed">{n.message}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                    <div className="p-6 bg-midnight-900/60 text-center">
                       <button className="text-[10px] font-black uppercase tracking-[0.4em] text-midnight-500 hover:text-white transition-colors">Clear Signal History</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-4 bg-midnight-900/80 py-2.5 px-6 rounded-2xl border border-white/5 shadow-inner">
               <div className="w-2.5 h-2.5 bg-accent-aurora rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.4)]"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-aurora/80">System Online</span>
>>>>>>> Stashed changes
            </div>
          </div>
        </header>

        <main className="flex-1 p-10 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
