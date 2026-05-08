import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  Gift,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  TrendingUp,
  ChevronDown
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/portfolio', label: 'Carteira', icon: <Briefcase size={20} /> },
  { path: '/operations', label: 'Operações', icon: <ArrowLeftRight size={20} /> },
  { path: '/dividends', label: 'Dividendos', icon: <Gift size={20} /> },
  { path: '/reports', label: 'Relatórios', icon: <BarChart3 size={20} /> },
  { path: '/alerts', label: 'Alertas', icon: <Bell size={20} /> },
  { path: '/settings', label: 'Configurações', icon: <Settings size={20} /> },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-sidebar text-white
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-mint rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold text-white">Meu Portfólio</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors duration-200
                      ${isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/40 text-center">
            Meu Portfólio v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;