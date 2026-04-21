import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  Mail,
  CreditCard,
  TrendingUp,
  Package,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { API_URL as API } from '../config';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('clients');
  const [allDownloads, setAllDownloads] = useState([]);
  const [viewDetail, setViewDetail] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, downloadsRes] = await Promise.all([
        fetch(`${API}/api/clients`),
        fetch(`${API}/api/downloads/history`)
      ]);
      const clientsData = clientsRes.ok ? await clientsRes.json() : {};
      const downloadsData = downloadsRes.ok ? await downloadsRes.json() : {};

      if (clientsData.success) {
        setClients(clientsData.clients);
      }
      if (downloadsData && downloadsData.success) {
        setAllDownloads(downloadsData.downloads);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const locations = ['All Locations', ...new Set(clients.map(c => c.location).filter(l => l && l !== 'N/A'))];

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (client.client_name?.toLowerCase() || '').includes(search) ||
      (client.email?.toLowerCase() || '').includes(search) ||
      (client.company_name?.toLowerCase() || '').includes(search);

    const matchesLocation = selectedLocation === 'All Locations' || client.location === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  const handleClientClick = async (client) => {
    try {
      console.log("[DEBUG] Fetching details for client ID:", client._id);
      const res = await fetch(`${API}/api/clients/${client._id}`);
      const data = await res.json();
      console.log("[DEBUG] Received Client Data:", data);
      if (data.success) {
        setSelectedClient(data.client);
        setViewDetail(true);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  const downloadPDF = () => {
    if (clients.length === 0) {
      showNotify("No client data to export", "error");
      return;
    }

    try {
      const doc = new jsPDF();
      const columns = [
        { header: 'Client Name', dataKey: 'name' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Company', dataKey: 'company' },
        { header: 'Location', dataKey: 'location' },
        { header: 'Joined Date', dataKey: 'joined' },
        { header: 'Purchases', dataKey: 'purchases' }
      ];

      const data = clients.map(c => ({
        name: c.client_name || "Unknown",
        email: c.email || "N/A",
        company: c.company_name || "Individual",
        location: c.location || "N/A",
        joined: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
        purchases: c.totalDownloads || 0
      }));

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("Clients Report", 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Total Records: ${clients.length}`, 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

      autoTable(doc, {
        columns: columns,
        body: data,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9 }
      });

      const today = new Date().toISOString().split('T')[0];
      doc.save(`clients-report-${today}.pdf`);
      showNotify("Clients report exported", "success");
    } catch (err) {
      console.error(err);
      showNotify("PDF Error", "error");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete ALL client records, custom designs, and downloads. This cannot be undone.")) return;

    setLoading(true);
    console.log("[DEBUG] Initiating Delete All request to:", `${API}/api/clients/delete-all`);

    try {
      const res = await fetch(`${API}/api/clients/delete-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("[DEBUG] Delete Response Status:", res.status);
      const data = await res.json();
      console.log("[DEBUG] Delete Response Data:", data);

      if (data.success) {
        setClients([]);
        showNotify("All records deleted successfully", "success");
        // Also refresh data to ensure stats are 0
        fetchData();
      } else {
        showNotify(data.message || "Deletion failed", "error");
      }
    } catch (e) {
      console.error("[DEBUG] Delete All Error:", e);
      showNotify("Connection error or server timeout", "error");
    } finally {
      setLoading(false);
    }
  };

  if (viewDetail && selectedClient) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewDetail(false)}
              className="p-3 bg-white/5 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">{selectedClient.client_name}</h1>
              <p className="text-slate-500 font-bold flex items-center gap-2">
                <Mail size={14} className="text-violet-500" /> {selectedClient.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Total Revenue</p>
              <p className="text-xl font-black text-white leading-none">${selectedClient.purchases?.reduce((s, p) => s + (p.amount || 0), 0) || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="card bg-slate-900 border border-slate-800 rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-white mb-6 relative z-10">Client Information</h3>
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400"><Building2 size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company</p>
                    <p className="font-bold text-white">{selectedClient.company_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><MapPin size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</p>
                    <p className="font-bold text-white">{selectedClient.location || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><Calendar size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined Date</p>
                    <p className="font-bold text-white">
                      {selectedClient.createdAt && !isNaN(new Date(selectedClient.createdAt).getTime())
                        ? new Date(selectedClient.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-10 p-6 bg-white/[0.02] border border-slate-800 rounded-2xl relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-400">Activity Level</p>
                  <TrendingUp size={16} className="text-emerald-500" />
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: Math.min(100, (selectedClient.purchases?.length || 0) * 20) + '%' }}
                  ></div>
                </div>
                <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {selectedClient.purchases?.length || 0} Total Purchases
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 bg-white/[0.01] flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Downloaded Files</h3>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-400">{selectedClient.purchases?.length || 0} Files</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-8 py-5">Product</th>
                      <th className="px-8 py-5">Details</th>
                      <th className="px-8 py-5">Amount</th>
                      <th className="px-8 py-5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(selectedClient.purchases || []).map((purchase, index) => (
                      <tr key={purchase.id || index} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400"><Package size={16} /></div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors uppercase">{purchase.productName || purchase.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Type: {purchase.type || 'Download'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-800">{purchase.paymentId || purchase.info || 'N/A'}</span>
                        </td>
                        <td className="px-8 py-5"><p className="text-sm font-black text-white">${purchase.amount || 0}</p></td>
                        <td className="px-8 py-5 text-right text-xs font-bold text-slate-500">
                          {purchase.downloadedAt || purchase.date ? new Date(purchase.downloadedAt || purchase.date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20 overflow-y-auto">

      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'} backdrop-blur-md animate-in slide-in-from-right-10`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-bold">{notification.msg}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Clients</h1>
              <p className="text-slate-500 font-medium mt-1">Manage and track your customer database.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDeleteAll}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white shadow-lg shadow-rose-500/5'}`}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? 'Processing...' : 'Delete All'}
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-slate-800 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-black/20"
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards - Aligned 1 2 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8 flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-violet-500/30 transition-all shadow-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all"></div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Active Clients</p>
            <h3 className="text-4xl font-black text-white">{clients.length}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Across all channels</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8 flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Reach</p>
            <h3 className="text-4xl font-black text-white">
              {Math.max(0, locations.length - 1)}<span className="text-sm text-slate-500 font-bold ml-2">Cities</span>
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Worldwide presence</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8 flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div>
            <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-1 font-bold">New Registrations</p>
            <h3 className="text-4xl font-black text-white">
              {clients.filter(c => {
                const date = new Date(c.createdAt || c.date);
                return !isNaN(date.getTime()) && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
              }).length}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current billing cycle</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-5 px-2 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'clients' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Directory
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`pb-5 px-2 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'downloads' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          History
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-[1.5rem] py-5 pl-16 pr-8 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all placeholder:text-slate-700 shadow-inner"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-[1.5rem] py-5 pl-12 pr-10 text-sm font-bold text-white outline-none appearance-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all shadow-inner"
            >
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <button
            onClick={fetchData}
            className="p-5 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] text-slate-400 hover:text-white transition-all hover:bg-white/5 active:scale-95 shadow-lg"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="card bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-32 text-center"><RefreshCw className="animate-spin mx-auto text-violet-500 mb-4" size={40} /><p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading...</p></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-8 py-6">Customer</th>
                  <th className="px-8 py-6">Company</th>
                  <th className="px-8 py-6 text-center">Stats</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredClients.map(client => (
                  <tr key={client._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => handleClientClick(client)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform">{(client.client_name || 'U').charAt(0).toUpperCase()}</div>
                        <div><p className="font-black text-white group-hover:text-violet-400 uppercase tracking-tight">{client.client_name}</p><p className="text-[11px] text-slate-500 font-bold">{client.email}</p></div>
                      </div>
                    </td>
                    <td className="px-8 py-6"><p className="text-sm font-bold text-slate-300">{client.company_name || 'Individual'}</p><p className="text-[11px] font-bold text-slate-500 uppercase">{client.location || 'N/A'}</p></td>
                    <td className="px-8 py-6 text-center text-sm font-black text-white">{client.totalDownloads || 0} Downloads</td>
                    <td className="px-8 py-6 text-right"><button className="p-3 bg-slate-800 group-hover:bg-violet-600 text-slate-400 group-hover:text-white rounded-xl transition-all shadow-xl"><ChevronRight size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
