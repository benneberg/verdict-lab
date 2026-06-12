import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Beaker, FlaskConical, History as HistoryIcon, User, LogOut, TestTubeDiagonal, Globe, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/realtime';

import { useStore } from '../store/useStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useStore();

  const navItems = [
    { label: 'ARENA', path: '/', icon: Beaker },
    { label: 'TEST_LAB', path: '/lab', icon: FlaskConical },
    { label: 'REGISTRY', path: '/registry', icon: Globe },
    { label: 'HISTORY', path: '/history', icon: HistoryIcon },
    { label: 'DRESSING_ROOM', path: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (_) {}
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (_) {}
    }
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col shadow-2xl z-50 lg:relative lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-[0.23, 1, 0.32, 1]",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <TestTubeDiagonal size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">Verdict Lab</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">v1.4.2_alpha</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-1 overflow-y-auto">
          <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Laboratory Menu</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-200",
                location.pathname === item.path 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={16} className={cn(location.pathname === item.path ? "text-indigo-600" : "text-slate-400/80")} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          >
            <LogOut size={16} />
            SHUTDOWN_SESSION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-8 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 focus:outline-none"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-50"></span>
              <span className="hidden sm:inline">JDay Engine v1.4.2 [Online]</span>
              <span className="sm:hidden">ONLINE</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="opacity-50 hidden sm:inline">SYSTEM_TIME:</span> {new Date().toISOString().split('T')[1].slice(0, 5)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-6xl mx-auto relative z-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
