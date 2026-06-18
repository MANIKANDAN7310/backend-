import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Database,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  ShoppingBag,
  Palette,
  Calendar,
  ChevronRight,
  X,
  Eye,
  BarChart,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

import { API_URL as API } from '../config';
import { fetchWithRetry } from '../utils/api';


const Settings = () => {
  const [settings, setSettings] = useState({ isStoreEnabled: true, currency: 'USD ($)' });
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Month selection state for summary card
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedSummaryYear, setSelectedSummaryYear] = useState(new Date().getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/api/settings`);
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMonthStats = async (month, year) => {
    setLoading(true);
    try {
      const data = await fetchWithRetry(`${API}/api/stats/summary?month=${month + 1}&year=${year}`);
      if (data && data.success) {
        setMonthlyStats({
          totalClients: data.totalClients || 0,
          totalOrders: data.totalOrders || 0,
          customOrders: data.customDesigns || 0,
          totalRevenue: data.revenue || 0
        });
      }
    } catch (e) {
      console.error("Settings Stats Error:", e);
      setMonthlyStats({ totalClients: 0, totalOrders: 0, customOrders: 0, totalRevenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchModalData = async (y, filterMonth) => {
    setModalLoading(true);
    let rawData = [];
    try {
      const res = await fetch(`${API}/api/stats/all-months-detail?year=${y}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          rawData = data.data || [];
        }
      }
    } catch (e) {
      console.error("[DEBUG] Modal Fetch Failed, falling back to empty months:", e);
    } finally {
      const fullMonths = months.map((monthName, idx) => {
        const existing = rawData.find(d => d.month === monthName || d.monthIndex === idx + 1);
        
        if (existing) {
          return {
            month: existing.month || monthName,
            monthIndex: existing.monthIndex || idx + 1,
            totalClients: existing.totalClients || existing.clients || 0,
            totalOrders: existing.totalOrders || existing.orders || 0,
            customDesigns: existing.customDesigns || existing.customOrders || 0,
            revenue: existing.revenue || 0,
            clientList: existing.clientList || []
          };
        }

        return {
          month: monthName,
          monthIndex: idx + 1,
          totalClients: 0,
          totalOrders: 0,
          customDesigns: 0,
          revenue: 0,
          clientList: []
        };
      });

      if (filterMonth !== undefined) {
        const filtered = fullMonths.filter(d => d.monthIndex === filterMonth + 1);
        setModalData(filtered);
      } else {
        setModalData(fullMonths);
      }
      setModalLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchSettings(), fetchMonthStats(selectedMonth, selectedSummaryYear)]);
      } catch (e) {
        console.error("[DEBUG] Initialization failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Re-fetch stats when month/year selection changes
  useEffect(() => {
    fetchMonthStats(selectedMonth, selectedSummaryYear);
  }, [selectedMonth, selectedSummaryYear]);

  const refreshAnalytics = () => {
    fetchModalData(selectedYear);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showNotify("Settings updated successfully");
      }
    } catch (e) {
      showNotify("Failed to update settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonth = async (monthIndex) => {
    if (!window.confirm(`Are you sure you want to delete all data for ${months[monthIndex - 1]} ${selectedYear}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API}/api/stats/month/${selectedYear}/${monthIndex}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotify(`${months[monthIndex - 1]} data deleted`);
        fetchModalData(selectedYear, selectedMonth);
        fetchMonthStats(selectedMonth, selectedSummaryYear);
      }
    } catch (e) {
      showNotify("Failed to delete month data", "error");
    }
  };

  const handleDeleteEntry = async (type, id, monthIndex) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`${API}/api/stats/entry/${type}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotify("Entry deleted");
        fetchModalData(selectedYear, selectedMonth);
        fetchMonthStats(selectedMonth, selectedSummaryYear);
      }
    } catch (e) {
      showNotify("Failed to delete entry", "error");
    }
  };

  const toggleMonth = (month) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openDetailedAnalytics = () => {
    setIsModalOpen(true);
    setSelectedYear(selectedSummaryYear);
    fetchModalData(selectedSummaryYear);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <RefreshCw className="animate-spin text-violet-500 mb-4" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Settings...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          } backdrop-blur-md animate-in slide-in-from-right-10`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-bold">{notification.msg}</p>
        </div>
      )}

      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Settings</h2>
          <p className="text-slate-500 font-medium">Global configurations and performance analytics.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-slate-800 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-8">

          {/* Store Visibility Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl border-l-4 border-l-violet-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Store Page Status</h3>
                <p className="text-xs text-slate-500">Control public visibility of your marketplace</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.02] border border-slate-800 transition-all hover:bg-white/[0.04]">
              <div>
                <p className="font-bold text-white text-lg">{settings.isStoreEnabled ? 'Store is Live' : 'Store is Hidden'}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {settings.isStoreEnabled
                    ? 'Users can browse products and make purchases normally.'
                    : 'The store page will show an "Unavailable" message to all visitors.'}
                </p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, isStoreEnabled: !prev.isStoreEnabled }))}
                className={`shrink-0 w-16 h-8 rounded-full transition-all relative p-1 flex items-center ${settings.isStoreEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all transform ${settings.isStoreEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Account Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Profile Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Name</label>
                <input type="text" defaultValue="Octoink Admin" className="w-full bg-white/5 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 text-white font-bold transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input type="email" defaultValue="admin@octoink.com" className="w-full bg-white/5 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 text-white font-bold transition-all" />
              </div>
            </div>
          </div>

          {/* Security */}
          {/* <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Security & Access</h3>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-slate-800">
              <div>
                <p className="font-bold text-white">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500">Protect your account with an extra security layer.</p>
              </div>
              <button className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Setup 2FA</button>
            </div>
          </div> */}

          <div className="flex justify-end gap-3">
            <button className="px-8 py-4 rounded-2xl border border-slate-800 text-sm font-bold text-slate-400 hover:bg-white/5 transition-all">Discard</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-violet-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
              <span>Update Configurations</span>
            </button>
          </div>
        </div>

        {/* Right Column - Analytics Summary */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp size={120} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Calendar size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Snapshot</span>
            </div>

            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{months[selectedMonth]} Summary</h4>
            <p className="text-[10px] text-violet-400/80 mb-4 font-bold tracking-wide">Showing data for {months[selectedMonth]} {selectedSummaryYear} only</p>

            {/* Month & Year Selectors */}
            <div className="flex gap-2 mb-8">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={selectedSummaryYear}
                onChange={(e) => setSelectedSummaryYear(Number(e.target.value))}
                className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center items-start w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              <div className="min-w-[50px]">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Clients</p>
                <p className="text-base font-black text-white">{monthlyStats?.totalClients || 0}</p>
              </div>
              <div className="min-w-[80px]">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Store Downloads</p>
                <p className="text-base font-black text-white">{monthlyStats?.totalOrders || 0}</p>
              </div>
              <div className="min-w-[80px]">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Custom Designs</p>
                <p className="text-base font-black text-white">{monthlyStats?.customOrders || 0}</p>
              </div>
              <div className="min-w-[70px]">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Income</p>
                <p className="text-base font-black text-emerald-500">${(monthlyStats?.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={openDetailedAnalytics}
              className="w-full mt-10 flex items-center justify-center gap-2 py-4 bg-white/5 border border-slate-800 group-hover:bg-violet-600 group-hover:border-violet-600 rounded-2xl text-slate-400 group-hover:text-white font-black text-xs uppercase tracking-widest transition-all duration-300"
            >
              Detailed Monthly View <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Monthly View Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0B1120]">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-violet-600 text-white rounded-[1.5rem] shadow-lg shadow-violet-600/30">
                  <BarChart size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Performance Analytics</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Historical store metrics for {selectedYear} ({modalData.length} {modalData.length === 1 ? 'month' : 'months'} loaded)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const yr = Number(e.target.value);
                    setSelectedYear(yr);
                    fetchModalData(yr);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button
                  onClick={refreshAnalytics}
                  disabled={modalLoading}
                  className="p-3 bg-violet-500/10 text-violet-500 rounded-xl border border-violet-500/20 hover:bg-violet-500 hover:text-white transition-all ml-4"
                  title="Refresh Analytics"
                >
                  <RefreshCw className={modalLoading ? "animate-spin" : ""} size={20} />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all ml-4"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8">
              {modalLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="animate-spin mx-auto text-violet-500 mb-6" size={48} />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Aggregating Global Data...</p>
                </div>
              ) : modalData && modalData.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {modalData.map((monthData, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 rounded-[2.5rem] overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-[200px_1fr_180px] items-center gap-8">
                        {/* Column 1: Month Identity */}
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 font-extrabold text-lg shrink-0">
                            {monthData.month.substring(0, 3)}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-white leading-tight">{monthData.month}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedYear}</p>
                          </div>
                        </div>

                        {/* Column 2: Metrics Grid */}
                        <div className="grid grid-cols-4 gap-2 lg:gap-6 px-2 lg:px-4 text-center md:text-left w-full items-start">
                          <div className="min-w-[50px]">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Clients</p>
                            <p className="text-base font-black text-white">{monthData.totalClients || 0}</p>
                          </div>
                          <div className="min-w-[80px]">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Store Downloads</p>
                            <p className="text-base font-black text-white">{monthData.totalOrders || 0}</p>
                          </div>
                          <div className="min-w-[80px]">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Custom Designs</p>
                            <p className="text-base font-black text-white">{monthData.customDesigns || 0}</p>
                          </div>
                          <div className="min-w-[70px]">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Income</p>
                            <p className="text-lg font-black text-emerald-500">${(monthData.revenue || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Column 3: Actions */}
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleMonth(monthData.month)}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                          >
                            {expandedMonths[monthData.month] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMonth(monthData.monthIndex)}
                            className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all"
                            title="Delete all data for this month"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {expandedMonths[monthData.month] && (
                        <div className="px-8 pb-8 pt-0 animate-in slide-in-from-top-4 duration-300">
                          <div className="border-t border-slate-800 mt-2 mb-6" />
                          <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users size={14} /> Client Activity Details
                          </h5>

                          <div className="bg-black/20 rounded-2xl overflow-hidden border border-slate-800">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  <th className="px-6 py-4">Client Identity</th>
                                  <th className="px-6 py-4">Email</th>
                                  <th className="px-6 py-4 text-center">Status</th>
                                  <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {monthData.clientList.length > 0 ? monthData.clientList.map((client, cIdx) => (
                                  <tr key={cIdx} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="px-6 py-4">
                                      <p className="font-bold text-white group-hover:text-violet-400 transition-colors uppercase text-xs">{client.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                      <p className="text-xs font-medium text-slate-500">{client.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${client.type === 'Customer' ? 'bg-emerald-500/10 text-emerald-500' :
                                        client.type === 'Inquiry' ? 'bg-amber-500/10 text-amber-500' :
                                          'bg-slate-700/30 text-slate-500'
                                        }`}>
                                        {client.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <button
                                        onClick={() => handleDeleteEntry(client.type, client.id, monthData.monthIndex)}
                                        className="p-1.5 bg-slate-800 text-slate-500 hover:text-rose-500 transition-all rounded-lg"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center">
                                      <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">No activity recorded</p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-700">
                  <AlertTriangle size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No analytics data available for {selectedYear}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
