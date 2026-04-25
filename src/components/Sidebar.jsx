import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  Image, 
  BarChart3, 
  Settings,
  LogOut,
  X,
  ShoppingCart,
  Palette,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/orders', icon: ShoppingCart, label: 'Purchases' },
  { path: '/custom-orders', icon: Palette, label: 'Custom Design Orders' },
  { path: '/mails', icon: Mail, label: 'Website Mails' },
  { path: '/clients', icon: BarChart3, label: 'Clients' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/upload', icon: Upload, label: 'Upload Product' },
  { path: '/hero-banners', icon: Image, label: 'Hero Banners' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar }) => {
  const { logout } = useAuth();
  const location = useLocation();

  // Auto-close sidebar on every route change (handles back/forward nav too)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  return (
    <>
      {/* Mobile/Tablet Overlay — clicking outside closes sidebar */}
      <div
        className={`fixed inset-0 bg-black/60 z-20 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-[var(--sidebar-width)] bg-[var(--bg-sidebar)] border-r border-[var(--border)] z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              OCTOINK STUDIOS
            </h1>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-violet-500/20'
                      : 'text-[var(--text-dim)] hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-[var(--border)] hidden lg:block">
              <p className="text-xs text-[var(--text-dim)] mb-2">Logged in as</p>
              <p className="text-sm font-semibold truncate">Admin User</p>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
