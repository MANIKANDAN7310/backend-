import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Image as ImageIcon, FileArchive, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const categories = [
  'Enamel Pin', 'Medals', 'Ornament Design', 'Keychain Design', 'Coins Design', 'Embroidery Design'
];

const UploadProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;

  const [form, setForm] = useState({
    title: '', category: categories[0],
    price: '', originalPrice: '', tags: '', description: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extraFiles, setExtraFiles] = useState([null, null, null]);
  const [extraPreviews, setExtraPreviews] = useState(['', '', '']);
  const [digitalFile, setDigitalFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing product for edit
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setFetching(true);
      try {
        const res = await fetch(`${API}/api/products/${editId}`);
        const data = await res.json();
        if (data.success) {
          const p = data.product;
          setForm({
            title: p.title, category: p.category,
            price: p.price, originalPrice: p.originalPrice || '',
            tags: p.tags || '', description: p.description || '',
          });
          if (p.image) setImagePreview(`${API}/${p.image}`);
          if (p.file) setFileName(p.file.split('/').pop());
          if (p.extraImages?.length) {
            setExtraPreviews([0, 1, 2].map(i => p.extraImages[i] ? `${API}/${p.extraImages[i]}` : ''));
          }
        }
      } catch { setError('Could not load product.'); }
      finally { setFetching(false); }
    };
    load();
  }, [isEdit, editId]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleExtraImage = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const nf = [...extraFiles]; nf[idx] = file;
    const np = [...extraPreviews]; np[idx] = URL.createObjectURL(file);
    setExtraFiles(nf); setExtraPreviews(np);
  };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setDigitalFile(file); setFileName(file.name);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price) { setError('Title and price are required.'); return; }
    setError(''); setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);
    if (digitalFile) fd.append('file', digitalFile);
    extraFiles.forEach(f => { if (f) fd.append('extraImages', f); });

    try {
      const url = isEdit ? `${API}/api/products/${editId}` : `${API}/api/products`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (data.success) {
        setSuccess(isEdit ? 'Product updated!' : 'Product published!');
        setTimeout(() => navigate('/products'), 1500);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Server error. Is backend running?');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64 gap-3 text-[var(--text-dim)]">
      <Loader2 size={22} className="animate-spin" /> Loading product...
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/products" className="flex items-center gap-2 text-[var(--text-dim)] hover:text-white transition-colors mb-4 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Link>
        <h2 className="text-3xl font-bold mb-2">{isEdit ? 'Edit Product' : 'Upload New Product'}</h2>
        <p className="text-[var(--text-dim)]">{isEdit ? 'Update your digital asset.' : 'Add a new digital asset to your marketplace store.'}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
          <Check size={16} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="card space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-dim)]">Product Name *</label>
              <input name="title" value={form.title} onChange={handleChange}
                type="text" placeholder="e.g. Vintage Enamel Pin Design"
                className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-dim)]">Category</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] transition-all">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-dim)]">Price ($) *</label>
                <input name="price" value={form.price} onChange={handleChange}
                  type="number" placeholder="25.00"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-dim)]">Original Price ($)</label>
                <input name="originalPrice" value={form.originalPrice} onChange={handleChange}
                  type="number" placeholder="19.99"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--text-dim)]">Tags</label>
                <input name="tags" value={form.tags} onChange={handleChange}
                  type="text" placeholder="vintage, pin, vector"
                  className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text-dim)]">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows="4" placeholder="Tell clients more about this product..."
                className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] transition-all resize-none" />
            </div>
          </div>

          {/* Digital File */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Digital File (Downloadable)</h3>
            <label className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-[var(--primary)]/50 transition-all cursor-pointer bg-white/[0.01]">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
                <FileArchive size={24} />
              </div>
              {fileName ? (
                <>
                  <p className="font-semibold text-green-400 mb-1">{fileName}</p>
                  <p className="text-xs text-[var(--text-dim)]">Click to change file</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-[var(--text-dim)]">ZIP, PDF or SVG (MAX. 50MB)</p>
                </>
              )}
              <input type="file" accept=".zip,.pdf,.svg" className="hidden" onChange={handleFile} />
            </label>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Product Image</h3>
            <label className="aspect-square border-2 border-dashed border-[var(--border)] rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-[var(--primary)]/50 transition-all cursor-pointer bg-white/[0.01] overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
                    <ImageIcon size={24} />
                  </div>
                  <p className="font-semibold mb-1 text-sm">Main Thumbnail</p>
                  <p className="text-xs text-[var(--text-dim)]">PNG, JPG up to 10MB</p>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[0, 1, 2].map(idx => (
                <label key={idx} className="aspect-square border border-[var(--border)] rounded-lg flex items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10 transition-colors overflow-hidden">
                  {extraPreviews[idx]
                    ? <img src={extraPreviews[idx]} alt={`extra-${idx}`} className="w-full h-full object-cover" />
                    : <Plus size={16} className="text-slate-500" />
                  }
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleExtraImage(e, idx)} />
                </label>
              ))}
            </div>
          </div>

          <div className="card bg-violet-600/10 border-violet-600/20">
            <h4 className="text-sm font-bold text-violet-400 mb-2">Publishing Tips</h4>
            <ul className="text-xs space-y-2 text-violet-200/70">
              <li className="flex gap-2"><Check size={14} className="flex-shrink-0" /><span>High quality images sell 2x better.</span></li>
              <li className="flex gap-2"><Check size={14} className="flex-shrink-0" /><span>Use descriptive names for SEO.</span></li>
              <li className="flex gap-2"><Check size={14} className="flex-shrink-0" /><span>Add a file to enable downloads.</span></li>
            </ul>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60">
            {loading
              ? <><Loader2 size={20} className="animate-spin" /> {isEdit ? 'Updating...' : 'Publishing...'}</>
              : <><Check size={20} /> {isEdit ? 'Update Product' : 'Publish Product'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadProduct;

