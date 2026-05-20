import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BrainCircuit, BookOpen, Swords, BarChart3,
  Settings, Sun, Moon, ChevronLeft, ChevronRight, Zap, Menu, X, LogOut,
  History, Calendar
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyzer', label: 'AI Analyzer', icon: BrainCircuit },
  { path: '/submissions', label: 'Submissions', icon: History },
  { path: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { path: '/upcoming', label: 'Upcoming', icon: Calendar },
  { path: '/contests', label: 'Contests', icon: Swords },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-5 mb-1 overflow-hidden whitespace-nowrap">
        <motion.div
          className="flex items-center justify-center w-8 h-8 min-w-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-lg"
          whileHover={{ rotate: 180, scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <Zap size={18} />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="text-[15px] font-bold tracking-tight text-[var(--text-primary)] overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              ApexCode
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2.5 px-2.5 py-[9px] rounded-[var(--radius-md)] text-[13px] font-medium transition-all duration-150 overflow-hidden whitespace-nowrap no-underline
                ${isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary-light)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="overflow-hidden whitespace-nowrap"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-1 pt-3 border-t border-[var(--border-primary)] mt-2">
        <button
          className="flex items-center gap-2.5 px-2.5 py-2 border-none bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] cursor-pointer font-sans text-[13px] font-medium transition-colors duration-150 overflow-hidden whitespace-nowrap"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          className="flex items-center gap-2.5 px-2.5 py-2 border-none bg-transparent text-[var(--text-tertiary)] hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger-light)] rounded-[var(--radius-md)] cursor-pointer font-sans text-[13px] font-medium transition-colors duration-150 overflow-hidden whitespace-nowrap"
          onClick={logout}
          title="Logout"
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Logout</motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          className="hidden md:flex items-center justify-center p-1.5 border-none bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] cursor-pointer transition-colors duration-150"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-3 left-3 z-[200] w-9 h-9 flex items-center justify-center glass-panel text-[var(--text-primary)] cursor-pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-screen bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col px-3 py-4 z-[100] transition-[width,transform] duration-200 overflow-hidden
          ${collapsed ? 'w-[60px]' : 'w-[220px]'}
          ${mobileOpen ? 'max-md:translate-x-0 shadow-xl' : 'max-md:-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
