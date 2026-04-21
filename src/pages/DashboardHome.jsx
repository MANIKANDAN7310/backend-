import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Download, Mail, ShoppingCart, ArrowUpRight, Users, ChevronRight, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { fetchWithRetry } from '../utils/api';
import { API_URL as API } from '../config';

const SummaryCard = ({ title, value, icon: Icon, color, prefix = "", suffix = "", pulse = false }) => (
  <div className="card group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          {pulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>
        <h3 className="text-3xl font-black text-white">{prefix}{value}{suffix}</h3>
      </div>
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20 group-hover:scale-110 transition-all shadow-lg`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 relative z-10">
      <span className="flex items-center text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <ArrowUpRight size={12} className="mr-1" /> LIVE
      </span>
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{pulse ? 'Auto-Refresh' : 'Live DB Sync'}</span>
    </div>
  </div>
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    products: 0,
    totalDownloads: 0,
    customOrders: 0,
    totalClients: 0,
    totalRevenue: 0
  });
  const [recentCustomOrders, setRecentCustomOrders] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, ordRes, purchRes, clientRes] = await Promise.allSettled([
        fetchWithRetry(`${API}/api/products`),
        fetchWithRetry(`${API}/api/orders`),
        fetchWithRetry(`${API}/api/purchases`),
        fetchWithRetry(`${API}/api/clients`)
      ]);

      let products = [];
      if (prodRes.status === 'fulfilled' && prodRes.value) {
        const data = prodRes.value;
        products = data.success ? (Array.isArray(data.products) ? data.products : []) : (Array.isArray(data) ? data : []);
      } else if (prodRes.status === 'rejected') {
        console.warn("Products failed:", prodRes.reason);
      }

      let customOrders = [];
      if (ordRes.status === 'fulfilled' && ordRes.value) {
        const data = ordRes.value;
        customOrders = data.success ? (Array.isArray(data.orders) ? data.orders : []) : (Array.isArray(data) ? data : []);
      }

      let purchases = [];
      if (purchRes.status === 'fulfilled' && purchRes.value) {
        const data = purchRes.value;
        purchases = data.success ? (Array.isArray(data.purchases) ? data.purchases : []) : (Array.isArray(data) ? data : []);
      }

      let clients = [];
      if (clientRes.status === 'fulfilled' && clientRes.value) {
        const data = clientRes.value;
        clients = data.success ? (Array.isArray(data.clients) ? data.clients : []) : (Array.isArray(data) ? data : []);
      }

      // Check if we got any data at all
      if (products.length === 0 && customOrders.length === 0 && purchases.length === 0 && clients.length === 0) {
          // If all are empty, maybe the backend is returning the wrong format (like the stats summary)
          const someRes = [prodRes, ordRes, purchRes, clientRes].find(r => r.status === 'fulfilled');
          if (someRes && someRes.value && someRes.value.totalClients !== undefined) {
              // This is the stats summary JSON!
              const d = someRes.value;
              setStats({
                products: 0,
                totalDownloads: d.totalOrders || 0,
                customOrders: d.customDesigns || 0,
                totalClients: d.totalClients || 0,
                totalRevenue: d.revenue || 0,
              });
              setLoading(false);
              return;
          }
      }

      // Compute accurate stats from real data
      const totalRevenue = purchases.reduce((sum, p) => sum + (Number(p.totalAmount || p.amount) || 0), 0);
      const totalDownloads = products.reduce((sum, p) => sum + (Number(p.downloads) || 0), 0);

      setStats({
        products: products.length,
        totalDownloads,
        customOrders: customOrders.length,
        totalClients: clients.length,
        totalRevenue,
      });

      setRecentCustomOrders(customOrders.slice(0, 5));

      const topDownloaded = [...products]
        .filter(p => p.downloads > 0)
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 5);
      setRecentPurchases(topDownloaded);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthMap = {};
      customOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          const key = months[d.getMonth()];
          monthMap[key] = (monthMap[key] || 0) + 1;
        }
      });
      const chart = months
        .filter(m => monthMap[m])
        .map(m => ({ name: m, orders: monthMap[m] }));
      setChartData(chart.length ? chart : [{ name: 'No data', orders: 0 }]);

    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
      setError("Failed to sync with server. Check connection.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-[var(--text-main)] to-[var(--text-dim)] bg-clip-text text-transparent uppercase tracking-tight">Overview</h2>
          <p className="text-[var(--text-dim)] font-medium">Live data from your store and customer database.</p>
        </div>
        {error && (
          <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold animate-bounce">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold shadow-lg hover:bg-white/5 transition-all active:scale-95">
            <RefreshCw size={16} className={`text-[var(--primary)] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Revenue" value={loading ? '...' : stats.totalRevenue.toLocaleString()} prefix="$" icon={ShoppingCart} color="emerald" pulse={true} />
        <SummaryCard title="Total Clients" value={loading ? '...' : stats.totalClients.toLocaleString()} icon={Users} color="violet" />
        <SummaryCard title="Total Downloads" value={loading ? '...' : stats.totalDownloads.toLocaleString()} icon={Download} color="amber" />
        <SummaryCard title="Custom Orders" value={loading ? '...' : stats.customOrders.toLocaleString()} icon={Mail} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Custom Orders Table */}
          <div className="card !p-0 overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 rounded-[2rem]">
            <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Recent Custom Orders</h3>
              <button onClick={() => navigate('/custom-orders')} className="text-[var(--primary)] text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                All Orders <ChevronRight size={14} />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs">
                <RefreshCw size={20} className="animate-spin mr-3 text-violet-500" />
                Synchronizing...
              </div>
            ) : recentCustomOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <Mail size={40} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                      <th className="px-8 py-5">Client</th>
                      <th className="px-8 py-5 text-center">Category</th>
                      <th className="px-8 py-5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {recentCustomOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => navigate('/custom-orders')}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center text-xs font-black border border-violet-500/20 group-hover:scale-110 transition-transform shadow-lg shadow-violet-600/10">
                              {order.email?.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{order.email}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase border bg-violet-500/10 text-violet-400 border-violet-500/20">
                            {order.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-500 font-bold text-right">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="card bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl"></div>
            <div className="flex items-center justify-between mb-10 relative z-10">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Order Volume Analysis</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Real-time</span>
              </div>
            </div>
            <div className="h-[280px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131722', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#a78bfa' }}
                    cursor={{ stroke: '#7c3aed', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#7c3aed" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Top Products */}
        <div className="card bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl h-fit border-l-violet-500/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Product Performance</h3>
            <Download size={18} className="text-amber-500" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="animate-spin text-violet-500" size={24} />
            </div>
          ) : recentPurchases.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle size={32} className="mx-auto mb-4 text-slate-800" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No activity data</p>
            </div>
          ) : (
            <div className="space-y-5">
              {recentPurchases.map((product, i) => (
                <div key={product._id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/products')}>
                  <div className="relative">
                    {product.image ? (
                      <img src={`${product.image.startsWith('http') ? '' : API + '/'}${product.image}`} alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-white/5 shadow-md group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-bold border border-white/5">
                        {i + 1}
                      </div>
                    )}
                    <div className="absolute -right-1 -top-1 w-5 h-5 bg-amber-500 text-black text-[9px] font-black rounded-lg flex items-center justify-center border-2 border-slate-900">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-violet-400 transition-colors uppercase tracking-tight">{product.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{product.downloads}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Hits</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/products')}
            className="w-full mt-10 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-violet-600 hover:border-violet-500 transition-all shadow-xl active:scale-95"
          >
            Insights & Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

