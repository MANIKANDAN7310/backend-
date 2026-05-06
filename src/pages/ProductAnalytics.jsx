import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Users, 
  Calendar, 
  Package, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Mail,
  Clock,
  User,
  HelpCircle,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';

import { API_URL as API } from '../config';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20 group-hover:scale-110 transition-all`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const ProductAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/products/analytics/${id}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
        <p className="text-[var(--text-dim)] font-bold animate-pulse">Analyzing product data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-sm mx-auto text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-2">
          <AlertCircle size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Oops!</h2>
          <p className="text-[var(--text-dim)]">{error || 'Product not found'}</p>
        </div>
        <button onClick={() => navigate('/products')} className="btn-primary w-full">
          Back to Products
        </button>
      </div>
    );
  }

  const { product, totalDownloads, users } = data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/products')} 
            className="p-3 bg-white/5 border border-[var(--border)] rounded-2xl text-[var(--text-dim)] hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-[var(--primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Product Analytics</span>
            </div>
            <h1 className="text-3xl font-black text-white">{product.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-dim)]">
            ID: <span className="text-white ml-1">{product._id}</span>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-2.5 bg-white/5 border border-[var(--border)] rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 flex items-center gap-2 group"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Refresh Stats</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Product Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Preview Card */}
          <div className="card overflow-hidden">
            <div className="relative aspect-video mb-6 rounded-2xl overflow-hidden border border-[var(--border)] bg-black/40">
              {product.image ? (
                <img 
                  src={`${product.image.startsWith('http') ? '' : API + '/'}${product.image}`} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                  <Package size={48} className="opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-40">No Image Preview</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Category</span>
                <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full text-xs font-black uppercase">
                  {product.category || 'Uncategorized'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Price</span>
                <span className="text-lg font-black text-white">₹{Number(product.price || 0).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">{product.description || 'No description available for this product.'}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4">
            <StatCard title="Total Downloads" value={totalDownloads.toLocaleString()} icon={Download} color="amber" />
            <StatCard title="Unique Downloaders" value={new Set(users.map(u => u.email)).size.toLocaleString()} icon={Users} color="violet" />
          </div>
        </div>

        {/* Right Col - Detailed User List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card !p-0 overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-[var(--border)] bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xl font-bold text-white">Download Activity</h2>
              </div>
              <span className="text-[10px] font-black px-3 py-1 bg-white/5 border border-[var(--border)] rounded-full text-slate-400 uppercase tracking-widest leading-none">
                {users.length} Unique User Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              {users.length === 0 ? (
                <div className="py-24 px-8 text-center bg-white/[0.01]">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:bg-white/10 transition-colors">
                     <Download size={32} className="text-slate-700" />
                   </div>
                   <p className="text-white font-bold uppercase tracking-widest text-sm mb-2">No Detailed User Logs</p>
                   <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                     While this product has <span className="text-[var(--primary)] font-bold">{totalDownloads} total downloads</span>, they were tracked before email-level analytics were enabled.
                   </p>
                   <div className="mt-8 p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-2xl max-w-md mx-auto text-left flex items-start gap-4">
                     <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
                       <HelpCircle size={16} />
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mb-1">PRO TIP: Tracking Emails</p>
                       <p className="text-[10px] text-slate-400 leading-normal">
                         Update your website to send the user's email when they download. Future downloads will then appear here with full client details.
                       </p>
                     </div>
                   </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-8 py-5">Client Information</th>
                      <th className="px-8 py-5 text-center">Download Count</th>
                      <th className="px-8 py-5 text-right">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {users.sort((a,b) => new Date(b.lastDownload) - new Date(a.lastDownload)).map((user, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-[var(--border)] flex items-center justify-center text-slate-400 group-hover:border-[var(--primary)]/30 group-hover:text-[var(--primary)] transition-all">
                              <User size={18} />
                            </div>
                            <div>
                               <p className="font-bold text-white transition-colors uppercase leading-none mb-1">
                                 {user.email && user.email !== 'Anonymous' ? user.email.split('@')[0] : 'Guest Client'}
                               </p>
                               <div className="flex items-center gap-1.5 mt-0.5">
                                 <Mail size={10} className="text-slate-500" />
                                 <p className="text-[10px] text-slate-500 font-medium lowercase tracking-tight">{user.email || 'N/A'}</p>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-sm font-black tabular-nums">
                            {user.count}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex flex-col items-end">
                             <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                               <Clock size={12} className="text-slate-500" />
                               {new Date(user.lastDownload).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                               {new Date(user.lastDownload).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="px-8 py-6 border-t border-[var(--border)] bg-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource Path:</p>
                  <code className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-slate-300 truncate max-w-[200px]">
                    {product.file || 'N/A'}
                  </code>
                </div>
                {product.file && (
                  <a 
                    href={product.file.startsWith('http') ? product.file : `${API}/${product.file}`} 
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Test Download Path <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;

