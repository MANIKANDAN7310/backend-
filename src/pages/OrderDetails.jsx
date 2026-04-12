import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Package, CreditCard, Clock, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { mockOrders } from '../utils/mockData';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Check if it's a mock order
        const mock = mockOrders.find(o => o.id === id);
        if (mock) {
          setOrder(mock);
          setLoading(false);
          return;
        }

        // 2. Try fetching as custom design order
        let res = await fetch(`${API}/api/custom-design/${id}`);
        let data = await res.json();
        if (data.success) {
          const raw = data.order;
          // Map MongoDB schema to what the UI expects
          setOrder({
            id: raw._id,
            clientName: raw.email ? raw.email.split('@')[0].toUpperCase() : 'CLIENT',
            email: raw.email || 'N/A',
            productName: raw.category || 'Custom Design',
            price: 0, // Custom designs might not have a price in this schema
            date: new Date(raw.createdAt).toLocaleDateString(),
            time: new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: raw.status || 'Pending',
            purchasedFiles: raw.designFile ? [raw.designFile.split('/').pop()] : [],
            designFile: raw.designFile,
            paymentStatus: raw.status === 'Completed' ? 'Paid' : 'Processing',
            timeline: [
              { status: 'Request Received', date: new Date(raw.createdAt).toLocaleString() },
              ...(raw.status && raw.status !== 'Pending' ? [{ status: raw.status, date: 'Updated Recently' }] : [])
            ],
            isCustomDesign: true,
            raw: raw
          });
          setLoading(false);
          return;
        }

        // 3. Try fetching as product download order
        res = await fetch(`${API}/api/downloads/${id}`);
        data = await res.json();
        if (data.success) {
          const raw = data.order;
          setOrder({
            id: raw._id,
            clientName: 'Customer',
            email: 'N/A',
            productName: raw.productName,
            price: raw.price || 0,
            date: new Date(raw.date).toLocaleDateString(),
            time: new Date(raw.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Completed',
            purchasedFiles: raw.fileUrl ? [raw.fileUrl.split('/').pop()] : [],
            fileUrl: raw.fileUrl,
            paymentStatus: 'Paid',
            timeline: [
              { status: 'Purchased', date: new Date(raw.date).toLocaleString() }
            ],
            isProductDownload: true,
            raw: raw
          });
          setLoading(false);
          return;
        }

        setError("Order not found");
      } catch (e) {
        console.error("Order fetch error:", e);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[var(--text-dim)] font-bold">Fetching order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">{error || "Order Not Found"}</h2>
        <button 
          onClick={() => navigate('/orders')}
          className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary)]/90 transition-all"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-main)] mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        <span>Back to Orders</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold">{order.id}</h2>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {order.status}
            </span>
          </div>
          <p className="text-[var(--text-dim)]">Placed on {order.date} at {order.time}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
            Print Invoice
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} />
            <span>Download All Files</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                <Package size={20} />
              </div>
              <h3 className="text-lg font-bold">Purchased Items</h3>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-500/[0.02] border border-[var(--border)]">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-[var(--border)]">
                  {order.raw?.productImage ? (
                    <img src={order.raw.productImage} className="w-full h-full object-cover rounded-lg" alt="" />
                  ) : order.designFile ? (
                    <img src={`${API}/${order.designFile}`} className="w-full h-full object-cover rounded-lg" alt="" />
                  ) : (
                    <Package className="text-[var(--text-dim)]" size={32} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-[var(--text-main)]">{order.productName}</p>
                  <p className="text-sm text-[var(--text-dim)] mt-1">{order.isCustomDesign ? 'Custom Submission' : 'Digital Download · Full License'}</p>
                </div>
              </div>
              <p className="font-bold text-lg">${(order.price || 0).toFixed(2)}</p>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-[var(--text-dim)]">Files</h4>
              <div className="space-y-3">
                {order.purchasedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <Download size={16} className="text-[var(--primary)]" />
                      <span className="text-sm font-medium">{file}</span>
                    </div>
                    <button className="text-[var(--primary)] text-xs font-bold hover:underline flex items-center gap-1">
                      Download <ExternalLink size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold">Order Timeline</h3>
            </div>

            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border)]">
              {order.timeline.map((step, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[29px] top-1 w-6 h-6 rounded-full border-4 border-[var(--bg-card)] flex items-center justify-center ${i === 0 ? 'bg-emerald-500' : 'bg-[var(--primary)] text-white'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wide">{step.status}</p>
                    <p className="text-xs text-[var(--text-dim)] mt-1">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client History & Details */}
          <div className="card shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold">Client History</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-500/5 border border-[var(--border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xl font-bold">
                  {order.clientName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold">{order.clientName}</p>
                  <p className="text-xs text-[var(--text-dim)]">{order.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Purchases</p>
                  <p className="text-lg font-black">12</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Total Spent</p>
                  <p className="text-lg font-black text-emerald-500">$542.50</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-dim)] font-medium">Customer Since</span>
                  <span className="font-bold">Oct 12, 2025</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-dim)] font-medium">Last Active</span>
                  <span className="font-bold">Today, 14:30</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-dim)] font-medium">Avg. Order Value</span>
                  <span className="font-bold">$45.20</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <button className="w-full py-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--primary)]/20 transition-all border border-[var(--primary)]/20 shadow-sm">
                  View Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CreditCard size={20} />
              </div>
              <h3 className="text-lg font-bold">Payment Status</h3>
            </div>
            
            <div className={`p-4 rounded-xl border mb-6 ${order.paymentStatus === 'Paid' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-dim)] uppercase">Status</span>
                <span className={`text-xs font-bold uppercase ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-2xl font-bold">${(order.price || 0).toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[var(--text-dim)]">Subtotal</span>
                <span>${(order.price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[var(--text-dim)]">Transaction Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold pt-3 border-t border-[var(--border)]">
                <span>Total Amount</span>
                <span>${(order.price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

