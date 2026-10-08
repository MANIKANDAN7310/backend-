import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Mail,
  Send,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  MessageSquare,
  History,
  Layers
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackLayout = ({ children }) => {
  const [connection, setConnection] = useState({
    connected: false,
    loading: true,
    senderEmail: 'hello.octoinkstudios@gmail.com',
    message: ''
  });

  const fetchConnection = async () => {
    setConnection(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/connection`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnection({
        connected: Boolean(data.connected),
        loading: false,
        senderEmail: data.senderEmail || data.email || 'hello.octoinkstudios@gmail.com',
        message: data.message || ''
      });
    } catch (err) {
      setConnection({
        connected: false,
        loading: false,
        senderEmail: 'hello.octoinkstudios@gmail.com',
        message: 'Could not connect to backend service'
      });
    } finally {
      setConnection(prev => prev.loading ? { ...prev, loading: false } : prev);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  const navLinks = [
    { to: '/email-track', label: 'Overview & Send', icon: Send, end: true },
    { to: '/email-track/campaigns', label: 'Outreach History', icon: History },
    { to: '/email-track/follow-up', label: 'Follow-up Automation', icon: RotateCw },
    { to: '/email-track/b2b-clients', label: 'B2B Clients', icon: Users },
    { to: '/email-track/leads', label: 'Replies & Leads', icon: MessageSquare },
    { to: '/email-track/analytics', label: 'Email Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                <Mail size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Email Track</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Comprehensive outreach tracking, automated follow-ups, reply leads & B2B client management
                </p>
              </div>
            </div>
          </div>

          {/* Sender Connection Status Card */}
          <div className="flex items-center gap-4 bg-white/5 border border-[var(--border)] px-4 py-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Active Sender</span>
              <span className="text-sm font-semibold text-white truncate max-w-[220px]">
                {connection.senderEmail}
              </span>
            </div>

            <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
              {connection.loading ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RotateCw size={12} className="animate-spin" /> Checking...
                </span>
              ) : connection.connected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertCircle size={12} />
                  Disconnected
                </span>
              )}

              <button
                onClick={fetchConnection}
                title="Reconnect / Re-check"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-[var(--border)] mt-6 no-scrollbar">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${isActive
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <link.icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {React.Children.map(children, (child) =>
          React.isValidElement(child) ? React.cloneElement(child, { connection, fetchConnection }) : child
        )}
      </div>
    </div>
  );
};

export default EmailTrackLayout;
