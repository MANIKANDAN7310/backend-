import React, { useState, useEffect } from 'react';
import { Download, Calendar, ShoppingCart, RefreshCw, AlertCircle, CheckCircle2, Search, ExternalLink, Package, User, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { API_URL as API } from '../config';

const Orders = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/purchases`);
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases);
      }
    } catch (e) {
      console.error("Purchases Fetch Error:", e);
      showNotify("Error fetching purchases", "error");
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

  const filtered = purchases.filter(p => 
    (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.clientEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.paymentId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadPDF = () => {
    try {
      console.log("[PDF] Starting export for", filtered.length, "items");
      if (filtered.length === 0) {
        showNotify("No data to export", "error");
        return;
      }

      const doc = new jsPDF();
      
      const columns = [
        { header: 'Product Name', dataKey: 'product' },
        { header: 'Customer', dataKey: 'customer' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Payment ID', dataKey: 'id' },
        { header: 'Date/Time', dataKey: 'date' }
      ];

      const data = filtered.map(p => {
        const dateObj = p.downloadedAt ? new Date(p.downloadedAt) : new Date();
        const dateStr = dateObj.toLocaleDateString() === 'Invalid Date' ? 'N/A' : `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        return {
          product: p.productName || "Digital Product",
          customer: p.clientName || "Unknown",
          email: p.clientEmail || "N/A",
          amount: `$${p.amount || 0}`,
          status: 'PAID',
          id: p.paymentId || "N/A",
          date: dateStr
        };
      });

      const totalRevenue = filtered.reduce((s, p) => s + (p.amount || 0), 0);

      // PDF Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Violet
      doc.text("Store Purchases Report", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Sales: ${filtered.length}`, 14, 38);
      doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 14, 46);

      autoTable(doc, {
        columns: columns,
        body: data,
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 245, 255] }
      });
      
      const today = new Date().toISOString().split('T')[0];
      doc.save(`store-purchases-report-${today}.pdf`);
      console.log("[PDF] Export successful");
      showNotify("PDF downloaded successfully", "success");
    } catch (err) {
      console.error("[PDF ERROR]", err);
      showNotify("Failed to generate PDF. Check console.", "error");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete ALL purchase data. This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/purchases/delete-all`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPurchases([]);
        showNotify("All purchase data deleted successfully", "success");
      } else {
        showNotify(data.message || "Delete failed", "error");
      }
    } catch (e) {
      console.error("Delete All Error:", e);
      showNotify("Connection error during deletion", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
          notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
        } backdrop-blur-md animate-in slide-in-from-right-10`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-bold">{notification.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                 <ShoppingCart size={24} />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">Store Purchases</h1>
           </div>
           <p className="text-slate-500 font-medium">Tracking all digital product sales and client payments.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-5 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            <Trash2 size={16} /> Delete All
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-slate-800 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Sales</p>
            <h3 className="text-3xl font-black text-white">{purchases.length}</h3>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-3xl font-black text-emerald-500">${purchases.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}</h3>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Uniques</p>
            <h3 className="text-3xl font-black text-violet-400">{new Set(purchases.map(p => p.clientEmail)).size}</h3>
         </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-500 transition-colors" size={20} />
         <input 
            type="text"
            placeholder="Search by product, client, email or payment id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
         />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 text-center">
               <RefreshCw className="animate-spin mx-auto text-violet-500 mb-4" size={32} />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing checkout data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
               <Package size={48} className="mx-auto text-slate-800 mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No purchase records found</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-8 py-5">Customer Info</th>
                  <th className="px-8 py-5">Payment & Tracking</th>
                  <th className="px-8 py-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform shadow-lg shadow-violet-600/10">
                             <Package size={18} />
                          </div>
                          <div>
                             <p className="font-black text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight">{p.productName}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Digital License</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3 mb-1">
                          <User size={14} className="text-slate-600" />
                          <p className="text-sm font-bold text-slate-300">{p.clientName}</p>
                       </div>
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-6">{p.clientEmail}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-emerald-500">${p.amount}</span>
                             <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase border border-emerald-500/20">PAID</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">{p.paymentId}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <p className="text-sm font-black text-white uppercase">{new Date(p.downloadedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{new Date(p.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
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

export default Orders;
