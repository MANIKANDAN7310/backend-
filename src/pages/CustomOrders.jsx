import React, { useState, useEffect } from 'react';
import { Palette, Search, ChevronRight, Trash2, RefreshCw, X, Download, Image } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CustomOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/custom-design`);
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/custom-design/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.filter(o => o._id !== id));
        if (selectedOrder?._id === id) setSelectedOrder(null);
        setDeleteConfirm(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/api/custom-design/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
        if (selectedOrder?._id === id) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) { console.error(e); }
  };

  const filtered = orders.filter(o =>
    o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatDateTime = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-var(--header-height)-120px)] flex flex-col max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Custom Design Orders</h2>
          <p className="text-[var(--text-dim)]">
            {loading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} from website`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="w-full md:w-[350px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by email, category..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--primary)] text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--text-dim)]">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
              <Palette size={40} className="text-[var(--text-dim)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No orders yet</h3>
            <p className="text-[var(--text-dim)] max-w-xs mx-auto">
              When clients submit custom design orders from the website, they'll appear here.
            </p>
          </div>
        </div>
      )}

      {/* Main layout */}
      {!loading && orders.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">

          {/* Left: Order List */}
          <div className={`flex-1 lg:max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col ${selectedOrder ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-[var(--border)] bg-slate-500/[0.02]">
              <h3 className="font-bold">Inbox ({filtered.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
              {filtered.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-5 cursor-pointer transition-all hover:bg-slate-500/5 relative ${selectedOrder?._id === order._id ? 'bg-[var(--primary)]/[0.03] before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--primary)]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {order.designFile ? (
                      <img
                        src={`${API}/${order.designFile}`}
                        alt="design"
                        className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[var(--primary)] text-lg font-bold">
                          {order.email?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold truncate">{order.email}</p>
                        <p className="text-[10px] text-[var(--text-dim)] flex-shrink-0 ml-2">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-[var(--primary)] truncate">{order.category}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          order.status === 'Processing' ? 'bg-amber-500/10 text-amber-500' :
                          order.status === 'Confirmed' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-dim)] truncate">
                        {order.fileName || 'No file name'} {order.width && order.height ? `· ${order.width}×${order.height}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Detail */}
          <div className={`flex-[2] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden ${!selectedOrder ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
            {selectedOrder ? (
              <>
                <div className="p-4 border-b border-[var(--border)] bg-slate-500/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedOrder(null)} className="lg:hidden p-2 text-[var(--text-dim)] hover:text-[var(--text-main)]">
                      <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <h3 className="font-bold">Order Details</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOrder.status || 'Pending'}
                      onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none transition-all ${
                        selectedOrder.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        selectedOrder.status === 'Processing' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        selectedOrder.status === 'Confirmed' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-500'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button
                      onClick={() => setDeleteConfirm(selectedOrder._id)}
                      className="p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                  {/* Design Image */}
                  {selectedOrder.designFile && (
                    <div>
                      <p className="text-xs text-[var(--text-dim)] mb-2 font-semibold uppercase tracking-wider">Design File</p>
                      <div className="relative group rounded-xl overflow-hidden border border-[var(--border)]">
                        <img
                          src={`${API}/${selectedOrder.designFile}`}
                          alt="Design"
                          className="w-full max-h-64 object-contain bg-white/5"
                        />
                        <a
                          href={`${API}/${selectedOrder.designFile}`}
                          download={selectedOrder.designFileOriginalName || 'design'}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-3 right-3 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                      <p className="text-xs text-[var(--text-dim)] mt-1">{selectedOrder.designFileOriginalName}</p>
                    </div>
                  )}

                  {/* Info Table */}
                  <div>
                    <p className="text-xs text-[var(--text-dim)] mb-3 font-semibold uppercase tracking-wider">Order Info</p>
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      {[
                        { label: 'Client Email', value: selectedOrder.email },
                        { label: 'Category', value: selectedOrder.category },
                        { label: 'File Name', value: selectedOrder.fileName },
                        { label: 'Size', value: selectedOrder.width && selectedOrder.height ? `${selectedOrder.width} × ${selectedOrder.height}` : null },
                        { label: 'Colors', value: selectedOrder.colors },
                        { label: 'Status', value: <span className="font-bold">{selectedOrder.status || 'Pending'}</span> },
                        { label: 'Submitted', value: formatDateTime(selectedOrder.createdAt) },
                      ].map((row, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                          <div className="w-32 px-4 py-3 text-xs font-semibold text-[var(--text-dim)] flex-shrink-0 border-r border-[var(--border)]">
                            {row.label}
                          </div>
                          <div className="px-4 py-3 text-sm flex-1">
                            {row.value || <span className="text-[var(--text-dim)]">N/A</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedOrder.requirement && (
                    <div>
                      <p className="text-xs text-[var(--text-dim)] mb-2 font-semibold uppercase tracking-wider">Requirements</p>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] text-sm leading-relaxed">
                        {selectedOrder.requirement}
                      </div>
                    </div>
                  )}

                  {/* Reference Files */}
                  {selectedOrder.refFiles?.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--text-dim)] mb-3 font-semibold uppercase tracking-wider">
                        Reference Files ({selectedOrder.refFiles.length})
                      </p>
                      <div className="space-y-2">
                        {selectedOrder.refFiles.map((rf, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[var(--border)]">
                            <div className="flex items-center gap-3 min-w-0">
                              <Image size={16} className="text-[var(--text-dim)] flex-shrink-0" />
                              <span className="text-sm truncate">{rf.originalName}</span>
                            </div>
                            <a
                              href={`${API}/${rf.path}`}
                              download={rf.originalName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-[var(--text-dim)] hover:text-[var(--primary)] transition-colors flex-shrink-0"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-10">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
                  <Palette size={40} className="text-[var(--text-dim)]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Select an order to view</h3>
                <p className="text-[var(--text-dim)] max-w-xs mx-auto">Choose an order from the list to see all details and files.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Delete Order?</h3>
              <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[var(--text-dim)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-[var(--text-dim)] text-sm mb-6">This will permanently remove the order. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomOrders;

