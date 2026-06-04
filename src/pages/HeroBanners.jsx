import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Grid,
  Sparkles,
  Layers,
  Tag
} from 'lucide-react';

import { API_URL as API } from '../config';
import { fetchWithRetry } from '../utils/api';

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banners' },
  { value: 'collection', label: 'Collection Showcase' },
  { value: 'category', label: 'Featured Categories' },
  { value: 'promo', label: 'Promotional Image Cards' }
];

const HeroBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hero');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sectionType: 'hero',
    heading: '',
    subHeading: '',
    description: '',
    button1Text: '',
    button1Link: '',
    button2Text: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Drag and Drop ordering
  const dragItem = useRef(0);
  const draggedOverItem = useRef(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetchWithRetry(`${API}/api/banners`);
      if (res.success) {
        setBanners(res.banners.sort((a, b) => a.order - b.order));
      } else {
        setError(res.message);
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
        sectionType: banner.button2Link || 'hero',
        heading: banner.heading || '',
        subHeading: banner.subHeading || '',
        description: banner.description || '',
        button1Text: banner.button1Text || '',
        button1Link: banner.button1Link || '',
        button2Text: banner.button2Text || '',
        image: null
      });
      const imgSrc = banner.image
        ? (banner.image.startsWith('http') ? banner.image : `${API}/${banner.image}`)
        : banner.imageUrl || null;
      setImagePreview(imgSrc);
    } else {
      setEditingBanner(null);
      setFormData({
        sectionType: activeTab,
        heading: '',
        subHeading: '',
        description: '',
        button1Text: '',
        button1Link: '',
        button2Text: '',
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
      submitData.append('heading', formData.heading);
      submitData.append('subHeading', formData.subHeading || '');
      submitData.append('description', formData.description || '');
      submitData.append('button1Text', formData.button1Text || '');
      submitData.append('button1Link', formData.button1Link || '');
      submitData.append('button2Text', formData.button2Text || '');
      
      // Save type inside button2Link
      submitData.append('button2Link', formData.sectionType);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      if (!editingBanner) {
        // Count how many items in this specific section to get order
        const sectionCount = banners.filter(b => (b.button2Link || 'hero') === formData.sectionType).length;
        submitData.append('order', sectionCount);
      } else {
        submitData.append('order', editingBanner.order || 0);
      }

      const url = editingBanner
        ? `${API}/api/banners/${editingBanner._id}`
        : `${API}/api/banners`;

      const method = editingBanner ? 'PUT' : 'POST';

      const data = await fetchWithRetry(url, {
        method,
        body: submitData
      });

      if (data.success) {
        fetchBanners();
        closeModal();
      } else {
        alert(data.message || 'Error saving layout banner');
      }
    } catch (err) {
      alert('Error saving layout banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this image banner?')) {
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
    const sectionBanners = banners.filter(b => (b.button2Link || 'hero') === activeTab);
    const otherBanners = banners.filter(b => (b.button2Link || 'hero') !== activeTab);

    const reorderedSection = [...sectionBanners];
    const temp = reorderedSection[dragItem.current];
    reorderedSection[dragItem.current] = reorderedSection[draggedOverItem.current];
    reorderedSection[draggedOverItem.current] = temp;

    const updatedSection = reorderedSection.map((b, index) => ({ ...b, order: index }));
    const combined = [...updatedSection, ...otherBanners];
    
    setBanners(combined);
    saveOrder(combined);
  };

  const saveOrder = async (combinedBanners) => {
    try {
      const res = await fetch(`${API}/api/banners/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: combinedBanners })
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Failed to save reorder");
      }
    } catch (e) {
      console.error("Error saving reorder", e);
    }
  };

  const filteredBanners = banners.filter(b => (b.button2Link || 'hero') === activeTab);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Store Layout & Banners
          </h1>
          <p className="text-[var(--text-dim)]">Design the premium homepage layout with sections, banners, and showcases.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-violet-500/25 font-semibold text-sm"
        >
          <Plus size={18} />
          <span>Add Image to {SECTION_TYPES.find(t => t.value === activeTab)?.label}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px">
        {SECTION_TYPES.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
              activeTab === tab.value
                ? 'border-violet-500 text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-violet-500/10 text-violet-400 rounded-full flex items-center justify-center mb-4">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
          <p className="text-[var(--text-dim)] mb-6 max-w-md">
            You haven't uploaded any images for the <strong>{SECTION_TYPES.find(t => t.value === activeTab)?.label}</strong> section yet.
          </p>
          <button
            onClick={() => openModal()}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-semibold text-sm"
          >
            <Plus size={18} />
            <span>Upload First Image</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
            <GripVertical size={14} /> Drag handles on the left to rearrange. Order determines homepage arrangement.
          </p>
          {filteredBanners.map((banner, index) => {
            const displayImg = banner.image
              ? (banner.image.startsWith('http') ? banner.image : `${API}/${banner.image}`)
              : banner.imageUrl || null;

            return (
              <div
                key={banner._id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row gap-6 items-center hover:border-slate-700/50 transition-all"
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (draggedOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="cursor-grab p-2 text-slate-500 hover:text-white shrink-0 hidden md:block">
                  <GripVertical size={24} />
                </div>

                <div className="w-full md:w-56 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-905 flex items-center justify-center relative group">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-slate-650" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-semibold text-white px-2.5 py-1 bg-black/70 rounded-lg pointer-events-none">Item {index + 1}</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {activeTab}
                    </span>
                    <h3 className="font-semibold text-lg text-white truncate">{banner.heading || '(Untitled Item)'}</h3>
                  </div>
                  
                  {banner.subHeading && (
                    <p className="text-sm text-slate-400 line-clamp-1">{banner.subHeading}</p>
                  )}
                  {banner.description && (
                    <p className="text-xs text-[var(--text-dim)] line-clamp-2">{banner.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {banner.button1Link && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Link: {banner.button1Link}
                      </span>
                    )}
                    {banner.button1Text && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-850 text-slate-400 border border-slate-750">
                        Button: {banner.button1Text}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => openModal(banner)}
                    className="flex-1 md:flex-initial p-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl transition-colors border border-violet-500/20 flex justify-center"
                    title="Edit Item"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="flex-1 md:flex-initial p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20 flex justify-center"
                    title="Delete Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#12121a] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-[#12121a] z-10 border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-violet-400" />
                {editingBanner ? 'Edit Layout Item' : 'Add Store Layout Item'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Image Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-300">Layout Section Type</label>
                  <select
                    name="sectionType"
                    value={formData.sectionType}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-semibold"
                  >
                    {SECTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <label className="block text-sm font-semibold text-slate-300">Featured Image</label>
                  <div className="relative group rounded-2xl border-2 border-dashed border-slate-800 bg-slate-905 hover:bg-slate-900 hover:border-violet-500/40 transition-all text-center overflow-hidden flex items-center justify-center"
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
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col">
                          <Upload size={32} className="text-white mb-2" />
                          <p className="text-white text-sm font-medium">Change image file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-3 text-slate-400 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition-colors">
                          <Upload size={20} />
                        </div>
                        <p className="text-sm font-semibold text-slate-350">Click or drag image file here</p>
                        <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP, SVG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Text Data based on Tab */}
                <div className="space-y-4">
                  {/* Dynamic Labels based on Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">
                      {formData.sectionType === 'hero' && 'Heading (Title)'}
                      {formData.sectionType === 'collection' && 'Collection Name'}
                      {formData.sectionType === 'category' && 'Category Name'}
                      {formData.sectionType === 'promo' && 'Card Title'}
                    </label>
                    <input
                      type="text"
                      name="heading"
                      value={formData.heading}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                      placeholder="e.g. Luxury Enamel Pins"
                    />
                  </div>

                  {formData.sectionType !== 'category' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">
                        {formData.sectionType === 'hero' && 'Subheading (Brief Tagline)'}
                        {formData.sectionType === 'collection' && 'Collection Subtitle'}
                        {formData.sectionType === 'promo' && 'Promotional Text / Value'}
                      </label>
                      <input
                        type="text"
                        name="subHeading"
                        value={formData.subHeading}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        placeholder="e.g. Limited Premium Drop"
                      />
                    </div>
                  )}

                  {formData.sectionType === 'hero' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Banner Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                        placeholder="Detail the banner information..."
                      ></textarea>
                    </div>
                  )}

                  {/* Actions Links */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Action Button Text</label>
                      <input
                        type="text"
                        name="button1Text"
                        value={formData.button1Text}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        placeholder="e.g. Discover"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Action Link (URL)</label>
                      <input
                        type="text"
                        name="button1Link"
                        value={formData.button1Link}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        placeholder="e.g. /store?cat=Enamel%20Pin"
                      />
                    </div>
                  </div>

                  {formData.sectionType === 'hero' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Optional Badge/Secondary Tag</label>
                      <input
                        type="text"
                        name="button2Text"
                        value={formData.button2Text}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        placeholder="e.g. NEW RELEASE"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-450 hover:bg-slate-900 hover:text-white transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-violet-500/20 text-sm"
                >
                  <Save size={16} />
                  <span>{editingBanner ? 'Update Item' : 'Add Item'}</span>
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
