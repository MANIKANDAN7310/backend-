import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Edit,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const HeroBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    mainHeading: '',
    subHeading: '',
    description: '',
    button1Text: '',
    button1Link: '',
    button2Text: '',
    button2Link: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Drag and Drop ordering
  const dragPerson = useRef(0);
  const draggedOverPerson = useRef(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/banners`);
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners.sort((a, b) => a.order - b.order));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch banners.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        mainHeading: banner.heading || '',
        subHeading: banner.subHeading || '',
        description: banner.description || '',
        button1Text: banner.button1Text || '',
        button1Link: banner.button1Link || '',
        button2Text: banner.button2Text || '',
        button2Link: banner.button2Link || '',
        image: null
      });
      const imgSrc = banner.image
        ? `${API}/${banner.image}`
        : banner.imageUrl || null;
      setImagePreview(imgSrc);
    } else {
      setEditingBanner(null);
      setFormData({
        mainHeading: '',
        subHeading: '',
        description: '',
        button1Text: '',
        button1Link: '',
        button2Text: '',
        button2Link: '',
        image: null
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('mainHeading', formData.mainHeading);
      submitData.append('subHeading', formData.subHeading || '');
      submitData.append('description', formData.description || '');
      submitData.append('button1Text', formData.button1Text || '');
      submitData.append('button1Link', formData.button1Link || '');
      submitData.append('button2Text', formData.button2Text || '');
      submitData.append('button2Link', formData.button2Link || '');
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      if (!editingBanner) {
        submitData.append('order', banners.length);
      }

      const url = editingBanner
        ? `${API}/api/banners/${editingBanner._id}`
        : `${API}/api/banners`;

      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: submitData
      });

      const data = await res.json();
      if (data.success) {
        fetchBanners();
        closeModal();
      } else {
        alert(data.message || 'Error saving banner');
      }
    } catch (err) {
      alert('Error saving banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        const res = await fetch(`${API}/api/banners/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          fetchBanners();
        } else {
          alert(data.message || 'Error deleting banner');
        }
      } catch (err) {
        alert('Error deleting banner');
      }
    }
  };

  const handleSort = () => {
    const bannersClone = [...banners];
    const temp = bannersClone[dragPerson.current];
    bannersClone[dragPerson.current] = bannersClone[draggedOverPerson.current];
    bannersClone[draggedOverPerson.current] = temp;

    const reorderedBanners = bannersClone.map((b, index) => ({ ...b, order: index }));
    setBanners(reorderedBanners);
    saveOrder(reorderedBanners);
  };

  const saveOrder = async (reorderedBanners) => {
    try {
      const res = await fetch(`${API}/api/banners/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: reorderedBanners })
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Failed to save reorder");
      }
    } catch (e) {
      console.error("Error saving reorder", e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Hero Banners
          </h1>
          <p className="text-[var(--text-dim)]">Manage your website's homepage sliding banners.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          <span>Add New Banner</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-violet-500/10 text-violet-400 rounded-full flex items-center justify-center mb-4">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No banners found</h3>
          <p className="text-[var(--text-dim)] mb-6 max-w-md">You haven't added any hero banners yet. Click the button above to create your first banner.</p>
          <button
            onClick={() => openModal()}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Banner</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner, index) => {
            const displayImg = banner.image
              ? `${API}/${banner.image}`
              : banner.imageUrl || null;

            return (
              <div
                key={banner._id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col md:flex-row gap-6 items-center"
                draggable
                onDragStart={() => (dragPerson.current = index)}
                onDragEnter={() => (draggedOverPerson.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="cursor-grab p-2 text-slate-500 hover:text-white shrink-0 hidden md:block">
                  <GripVertical size={24} />
                </div>

                <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900 flex items-center justify-center relative group">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-slate-600" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded pointer-events-none">Slide {index + 1}</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <h3 className="font-semibold text-lg text-white truncate">{banner.heading || '(No Heading)'}</h3>
                  <p className="text-sm text-[var(--text-dim)] line-clamp-2">{banner.subHeading || '(No Subheading)'}</p>

                  <div className="flex gap-2 mt-2">
                    {banner.button1Text && (
                      <span className="px-2 py-1 text-xs rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {banner.button1Text}
                      </span>
                    )}
                    {banner.button2Text && (
                      <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 border border-slate-600">
                        {banner.button2Text}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => openModal(banner)}
                    className="p-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg transition-colors border border-violet-500/20"
                    title="Edit Banner"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                    title="Delete Banner"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1e1e2d] border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#1e1e2d] z-10 border-b border-slate-700/50 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Image */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Banner Image</label>
                  <div className="relative group rounded-xl border-2 border-dashed border-slate-600 bg-black/20 hover:bg-black/40 hover:border-violet-500/50 transition-all text-center overflow-hidden"
                    style={{ aspectRatio: '16/9' }}>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required={!editingBanner}
                    />

                    {imagePreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col">
                          <Upload size={32} className="text-white mb-2" />
                          <p className="text-white text-sm font-medium">Click or drag to replace image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-colors">
                          <Upload size={24} className="text-slate-400 group-hover:text-violet-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Click or drag banner image here</p>
                        <p className="text-xs text-slate-500 mt-2">Recommended size: 1920x1080px (16:9 ratio)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Text Data */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Main Heading</label>
                    <input
                      type="text"
                      name="mainHeading"
                      value={formData.mainHeading}
                      onChange={handleInputChange}
                      className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                      placeholder="e.g., Transform Your Brand..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sub Heading (Optional)</label>
                    <input
                      type="text"
                      name="subHeading"
                      value={formData.subHeading}
                      onChange={handleInputChange}
                      className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
                      placeholder="Add a brief description..."
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 border border-slate-700/50 rounded-xl p-4 bg-black/10">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Button</h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Text</label>
                        <input
                          type="text"
                          name="button1Text"
                          value={formData.button1Text}
                          onChange={handleInputChange}
                          className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                          placeholder="e.g., Shop Now"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Link</label>
                        <input
                          type="text"
                          name="button1Link"
                          value={formData.button1Link}
                          onChange={handleInputChange}
                          className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                          placeholder="e.g., /store"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 border border-slate-700/50 rounded-xl p-4 bg-black/10">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Secondary Button</h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Text</label>
                        <input
                          type="text"
                          name="button2Text"
                          value={formData.button2Text}
                          onChange={handleInputChange}
                          className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                          placeholder="e.g., View Portfolio"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Link</label>
                        <input
                          type="text"
                          name="button2Link"
                          value={formData.button2Link}
                          onChange={handleInputChange}
                          className="w-full bg-black/20 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                          placeholder="e.g., #portfolio"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-violet-500/20"
                >
                  <Save size={18} />
                  <span>{editingBanner ? 'Update Banner' : 'Save Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBanners;

