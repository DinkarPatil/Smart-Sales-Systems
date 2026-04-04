import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, PieChart, Briefcase, MessageSquare, LogOut, Search, Bell, Menu, LayoutGrid, Terminal, Building2, Activity, Globe, Home, Settings, Monitor, Moon, Sun, Loader2, X, Database, Sparkles, AlertTriangle, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = ({ user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = React.useState(false);
  const [ownerStats, setOwnerStats] = React.useState(null);

  React.useEffect(() => {
    if (user?.role === 'Owner') {
      fetch('http://127.0.0.1:8000/api/v1/owner/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => setOwnerStats(data))
      .catch(console.error);
    }
  }, [user, location.pathname, location.search]); // Re-fetch on navigation

  const handleThemeChange = async (newTheme) => {
    setIsUpdatingTheme(true);
    
    // Optimistic UI update for immediate feedback
    if(setUser) {
      setUser({ ...user, theme: newTheme });
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ theme: newTheme })
      });
      
      if (!response.ok) {
        console.error('Failed to update theme on server');
      }
    } catch (e) {
      console.error('Failed to update theme', e);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  // Close sidebar on navigation (for mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, location.search]);

  const notifications = [
    { id: 1, title: 'Security Clearance', message: 'Admin access level synchronized.', time: '2m ago', type: 'system' },
    { id: 2, title: 'Neural Signal', message: 'AI Training node "Alpha" completed indexing.', time: '15m ago', type: 'info' },
    { id: 3, title: 'Inquiry Assigned', message: 'New high-priority lead assigned to Sales Unit.', time: '1h ago', type: 'action' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isAdmin = user?.role === 'Admin';
  
  const navItems = isAdmin ? [
    { name: 'Home', path: '/admin', icon: Home, show: true },
    { name: 'Users', path: '/admin?view=personnel', icon: Users, show: true },
    { name: 'Companies', path: '/admin?view=entities', icon: Building2, show: true },
  ] : user?.role === 'Owner' ? [
    { name: 'Home', path: '/owner', icon: Home, show: true },
    { name: 'Assets', path: '/owner?view=assets', icon: Database, show: true },
    { name: 'Negotiations', path: '/owner?view=negotiations', icon: Sparkles, show: true },
    { name: 'Critical Signals', path: '/owner?view=critical', icon: AlertTriangle, show: ownerStats?.high_priority_pending > 0, alert: true, count: ownerStats?.high_priority_pending },
    { name: 'History', path: '/owner?view=history', icon: History, show: true },
  ] : [
    { name: 'Manager', path: '/manager', icon: PieChart, show: user?.role === 'Manager' },
    { name: 'Sales Rep', path: '/sales', icon: MessageSquare, show: user?.role === 'SalesRep' },
  ];

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    // Default to Home if it's strictly /admin and no search params
    if (path === '/admin' && location.pathname === '/admin' && location.search === '') {
      return true;
    }
    if (path === '/owner' && location.pathname === '/owner' && location.search === '') {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-amethyst-950 text-slate-200 selection:bg-accent-primary/30 selection:text-white font-sans">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[25] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Amethyst Panel */}
      <aside className={`fixed lg:sticky top-0 left-0 w-80 bg-amethyst-950 border-r border-white/5 h-screen z-[30] flex flex-col transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 pb-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent-primary/20 group hover:shadow-aurora-glow transition-all duration-500">
                <LayoutGrid size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
                  Sales<span className="text-accent-secondary italic">RAG</span>
                </h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Intelligence Node</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-3 mt-12 overflow-y-auto border-t border-white/5 pt-12">
          <p className="px-6 text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 mb-8">Main Grid</p>
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 relative overflow-hidden ${
                isActive(item.path) 
                ? 'bg-accent-primary/10 text-white font-bold' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive(item.path) && (
                <motion.div 
                   layoutId="active-pill-amethyst"
                   className={`absolute left-0 w-1.5 h-6 rounded-r-full shadow-fuchsia-glow ${item.alert ? 'bg-red-500' : 'bg-accent-secondary'}`}
                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={22} className={`${isActive(item.path) ? (item.alert ? 'text-red-500' : 'text-accent-secondary') : 'group-hover:text-accent-primary'} ${item.alert && !isActive(item.path) ? 'text-red-500/80 animate-pulse' : ''} transition-colors duration-500`} />
              <div className="flex items-center justify-between flex-1">
                 <span className={`tracking-wide text-sm font-semibold ${item.alert && !isActive(item.path) ? 'text-red-500/80' : ''}`}>{item.name}</span>
                 {item.alert && (
                   <span className="w-5 h-5 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center text-[9px] font-black">{item.count}</span>
                 )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-10 mt-auto border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-8 px-2">
             <div className="w-14 h-14 rounded-2xl bg-amethyst-900 border border-white/10 flex items-center justify-center text-accent-secondary font-black text-xl shadow-inner">
                {user?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-white truncate leading-none">{user?.full_name || 'Operator'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2.5">{user?.role || 'Access'}</p>
             </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-xl bg-white/5 hover:bg-accent-primary/10 text-slate-400 hover:text-accent-primary transition-all font-black text-[9px] uppercase tracking-[0.3em] border border-white/5 hover:border-accent-primary/20 shadow-sm active:scale-95"
          >
            <Settings size={16} />
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all font-black text-[9px] uppercase tracking-[0.3em] border border-white/5 hover:border-red-500/20 shadow-sm active:scale-95"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-amethyst-950 overflow-hidden">
        <header className="h-20 lg:h-24 bg-amethyst-950/60 backdrop-blur-3xl sticky top-0 z-10 flex items-center justify-between px-6 lg:px-12 border-b border-white/5">
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 rounded-xl bg-midnight-900 border border-white/5 text-midnight-400 hover:text-white transition-all shadow-xl"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex items-center gap-4 bg-white/5 border border-white/5 px-4 lg:px-6 py-2.5 lg:py-3 rounded-2xl flex-1 max-w-[480px] group focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary/40 transition-all duration-500">
              <Search size={20} className="text-slate-500 group-focus-within:text-accent-secondary transition-colors" />
              <input 
                type="text" 
                placeholder="Secure Database Search..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-2xl hover:bg-white/5 text-slate-400 transition-all relative group"
            >
              <Bell size={22} className={`${showNotifications ? 'text-accent-secondary' : ''} group-hover:rotate-12 transition-transform`} />
              <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-accent-secondary rounded-full border-2 border-amethyst-950 shadow-fuchsia-glow animate-pulse"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setShowNotifications(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute top-20 right-0 w-96 bg-amethyst-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[50] overflow-hidden"
                  >
                    <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">System Alerts</h3>
                       <span className="text-[10px] font-black py-1 px-3 bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20">3 Active Signals</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                       {notifications.map(n => (
                         <div key={n.id} className="p-8 hover:bg-white/[0.02] transition-colors border-b border-white/5 group cursor-pointer">
                            <div className="flex items-start gap-4">
                               <div className="w-2 h-2 rounded-full bg-accent-secondary mt-1.5 shadow-fuchsia-glow group-hover:scale-125 transition-transform"></div>
                               <div className="flex-1">
                                  <div className="flex items-center justify-between gap-4 mb-2">
                                     <p className="text-[11px] font-black text-white uppercase tracking-widest">{n.title}</p>
                                     <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap italic">{n.time}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{n.message}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                    <div className="p-6 bg-black/20 text-center">
                       <button className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors">Clear Signal History</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            <div className="hidden md:flex items-center gap-4 bg-white/[0.02] py-2.5 px-6 rounded-2xl border border-white/5 shadow-inner">
               <div className="w-3 h-3 rounded-full bg-accent-primary animate-pulse shadow-amethyst-glow"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary/80">System Secure</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-amethyst-950 border border-white/10 rounded-[2.5rem] p-10 z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
                    <Settings size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-white italic">User Settings</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-3 bg-amethyst-900 rounded-full text-slate-400 hover:text-white transition-all"><X size={20}/></button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Interface Theme</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button 
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${user?.theme === 'system' || !user?.theme ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      <Monitor size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">System</span>
                    </button>
                    <button 
                      onClick={() => handleThemeChange('amethyst')}
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${user?.theme === 'amethyst' ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      <Moon size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Amethyst Noir</span>
                    </button>
                    <button 
                      onClick={() => handleThemeChange('white')}
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${user?.theme === 'white' ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      <Sun size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">White</span>
                    </button>
                  </div>
                  {isUpdatingTheme && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-secondary mt-4 flex items-center gap-2">
                       <Loader2 size={12} className="animate-spin"/> Syncing preferences...
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
