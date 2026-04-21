import React, { useState, useEffect } from 'react';
import ContactMails from '../components/ContactMails';
import { LayoutDashboard, Mail, Settings, Users, ShoppingBag, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { fetchWithRetry } from '../utils/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const Dashboard = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalClients: 0,
        totalOrders: 0,
        customDesigns: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await fetchWithRetry(`${API}/api/stats/summary`);
                if (data.success) {
                    setStats(data);
                }
            } catch (err) {
                console.error('Error fetching stats after retries:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight text-white">Octoink Admin</span>
                </div>
                
                <nav className="flex-1 px-4 py-4 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-[var(--primary-color)] text-white rounded-xl shadow-lg shadow-violet-500/10 cursor-pointer">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Overview</span>
                    </div>
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer transition-all" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-[#1e293b]/50 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-white">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-slate-400">System Administrator</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] flex items-center justify-center font-bold text-white">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<Users className="text-blue-400" />} label="Total Clients" value={stats.totalClients} loading={loading} />
                        <StatCard icon={<ShoppingBag className="text-emerald-400" />} label="Monthly Orders" value={stats.totalOrders} loading={loading} />
                        <StatCard icon={<BarChart3 className="text-amber-400" />} label="Custom Designs" value={stats.customDesigns} loading={loading} />
                        <StatCard icon={<Mail className="text-violet-400" />} label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} loading={loading} />
                    </div>

                    {/* Messages Section */}
                    <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-8">
                        <ContactMails />
                    </div>
                </main>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, loading }) => (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-800 rounded-xl">
                {icon}
            </div>
            {loading && <div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>}
        </div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{loading ? '...' : value}</h3>
    </div>
);

export default Dashboard;
