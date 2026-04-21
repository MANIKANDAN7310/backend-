import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, ExternalLink, Plus, Loader2, AlertCircle, Check, Search, Package, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { fetchWithRetry } from '../utils/api';

import { API_URL as API } from '../config';


const Products = () => {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProducts = async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchWithRetry(`${API}/api/products`);
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.success) {
        setProducts(data.products);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError(`Cannot connect to server: ${err.message}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const data = await fetchWithRetry(`${API}/api/products/${deleteId}`, { method: 'DELETE' });
      if (data.success) {
        setProducts(prev => prev.filter(p => p._id !== deleteId));
        setSuccessMsg('Product deleted!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) { 
      setError(`Delete failed: ${err.message}`); 
    } finally  { setDeleting(false); setDeleteId(null); }
  };

  const filtered = products.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalDownloads = products.reduce((sum, p) => sum + (p.downloads || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Products</h2>
          <p className="text-[var(--text-dim)]">Manage your digital assets and store inventory.</p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center justify-center gap-2 group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Upload New Product
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text" placeholder="Search by name or category..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[var(--primary)] transition-all"
          />
        </div>
      </div>

      <div className="card overflow-x-auto p-0 hover:border-[var(--primary)]/30 transition-colors">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[var(--text-dim)]">
            <Loader2 size={22} className="animate-spin" /> Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-dim)]">
            <Package size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-semibold">No products found</p>
            <p className="text-sm mt-1">Upload your first product to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Product</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Offer</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Downloads</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(product => (
                <tr key={product._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                        <Link 
                          to={`/products/analytics/${product._id}`}
                          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all group"
                        >
                          {product.image ? (
                            <img src={product.image && product.image.startsWith('http') ? product.image : `${API}/${product.image}`} alt={product.title || 'Product'}
                              className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] group-hover:border-[var(--primary)]/50 transition-all shadow-lg shadow-[var(--primary)]/0 group-hover:shadow-[var(--primary)]/10" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-[var(--border)] flex items-center justify-center text-slate-500 group-hover:border-[var(--primary)]/50 transition-all">
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors">{product.title || 'Untitled'}</p>
                            <p className="text-xs text-[var(--text-dim)]">{product.category || '—'}</p>
                          </div>
                        </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/5 border border-[var(--border)] rounded-full text-xs font-medium">
                      {product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">${Number(product.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {product.originalPrice
                      ? <span className="text-emerald-500 font-bold">${Number(product.originalPrice).toFixed(2)}</span>
                      : <span className="text-[var(--text-dim)]">—</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/products/analytics/${product._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[var(--primary)]/10 border border-[var(--border)] hover:border-[var(--primary)]/30 rounded-lg text-xs font-black text-white hover:text-[var(--primary)] transition-all group tabular-nums"
                    >
                      <Download size={14} className="text-[var(--text-dim)] group-hover:text-[var(--primary)] transition-colors" />
                      {(product.downloads || 0).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/upload?edit=${product._id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Edit">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => setDeleteId(product._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                        <Trash2 size={16} />
                      </button>
                      {product.file && (
                        <a href={`${API}/${product.file}`} target="_blank" rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-all" title="View File">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div className="px-6 py-4 border-t border-[var(--border)] bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-6">
               <span className="text-xs text-[var(--text-dim)] font-medium">Showing {filtered.length} of {products.length} products</span>
               <div className="hidden sm:block h-4 w-[1px] bg-[var(--border)]" />
               <div className="flex items-center gap-3 bg-[var(--primary)]/10 px-4 py-2 rounded-xl border border-[var(--primary)]/20 shadow-lg shadow-[var(--primary)]/5 transition-all hover:bg-[var(--primary)]/20 group">
                 <span className="text-[10px] sm:text-xs font-black text-[var(--text-dim)] uppercase tracking-widest group-hover:text-white transition-colors">Total Downloads</span>
                 <span className="text-lg sm:text-xl font-black text-[var(--primary)] tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                   {totalDownloads.toLocaleString()}
                 </span>
               </div>
            </div>
            <button onClick={fetchProducts} className="text-xs font-bold text-[var(--text-dim)] hover:text-white transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-[var(--border)]">
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
               REFRESH DATA
            </button>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold">Delete Product?</h3>
                <p className="text-xs text-[var(--text-dim)]">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] hover:bg-white/5 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-sm font-medium text-white flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

