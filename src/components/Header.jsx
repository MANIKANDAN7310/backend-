import React from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 h-[var(--header-height)] w-full lg:w-[calc(100%-var(--sidebar-width))] bg-[var(--bg-dark)]/80 backdrop-blur-md border-b border-[var(--border)] z-20 transition-all flex justify-center">
      <div className="max-w-7xl w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-[var(--text-dim)] hover:text-[var(--text-main)]"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">

          <button className="p-2 text-[var(--text-dim)] hover:text-[var(--text-main)] relative bg-white/5 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--bg-dark)]"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-[var(--text-dim)]">{user?.role || 'Super Admin'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/30 shadow-inner">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
