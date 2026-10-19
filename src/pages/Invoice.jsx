import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Download, 
  Printer, 
  Upload as UploadIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  X as XIcon,
  Sparkles
} from 'lucide-react';
import './Invoice.css';
import logo from '../assets/logo.png';

const BASE_A4_WIDTH = 794; // 210mm at 96 DPI
const BASE_A4_HEIGHT = 1123; // 297mm at 96 DPI

const Invoice = () => {
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const invoiceRef = useRef(null);
  const previewContainerRef = useRef(null);
  
  // Responsive zoom & scale states
  const [scale, setScale] = useState(1);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' | '100' | 'custom'
  const [customZoom, setCustomZoom] = useState(1);
  const [measuredHeight, setMeasuredHeight] = useState(BASE_A4_HEIGHT);

  const [formData, setFormData] = useState({
    companyName: 'OCTOINK STUDIOS',
    companyAddress: '84 Design District, Suite 400\nCreative Quarter, NY 10013\nhello@octoinkstudios.com | www.octoinkstudios.com',
    invoiceNo: '#INV-2026-0412',
    date: 'June 30, 2026',
    dueDate: 'July 14, 2026',
    completionDate: 'July 24, 2026',
    deliveryDate: 'July 24, 2026',
    projectStatus: 'Completed & Approved',
    paymentStatus: 'Payment Due', // 'Payment Due', 'Paid in Full', 'Partially Paid'
    clientName: 'Sarah Jenkins (VP of Marketing)',
    clientCompany: 'Acme Corporation',
    clientAddress: '1221 Avenue of the Americas, 42nd Floor\nNew York, NY 10020\nsarah.jenkins@acmecorp-example.com',
    projectRef: 'Brand Identity & UI/UX Overhaul',
    serviceWindow: 'Q3 2026 Campaign',
    accountManager: 'Creative Director',
    discount: 0,
    taxPercent: 8.5,
    amountPaid: 0,
    deliveredFormats: 'AI, EPS, PDF, PNG, JPG, DST, EMB',
    paymentOptions: 'Bank Transfer (ACH / Wire):\nBank Name: Premium Tier Trust Bank\nAccount Name: OctoInk Studios LLC\nAccount Number: XXXX-XXXX-4590 | Routing: XXXXX0210\nStripe Secure Link: payments.octoinkstudios.com/invoice-0412',
    terms: '• Full payment is due within the agreed payment terms.\n• All final deliverables and vector source assets are released upon receipt of payment.\n• Additional revisions or extra work outside the agreed project scope may incur additional fees.\n• Ownership of artwork and final deliverables transfers upon full settlement.\n• For billing inquiries or tax invoice assistance, contact hello@octoinkstudios.com.'
  });

  const [serviceItems, setServiceItems] = useState([
    { 
      id: 1, 
      name: 'BRAND IDENTITY', 
      desc: 'Comprehensive typography system, premium color guidelines, brand book asset curation, and cross-platform collateral templates.', 
      qty: 1, 
      price: 3500 
    },
    { 
      id: 2, 
      name: 'UI/UX DESIGN', 
      desc: 'High-fidelity website interactive prototypes, responsive layout mockups for desktop/mobile views, and handoff assets.', 
      qty: 1, 
      price: 4200 
    }
  ]);

  // Responsive scaling handler to guarantee zero horizontal overflow and true A4 proportions
  const updateScale = useCallback(() => {
    if (!previewContainerRef.current) return;
    const containerWidth = previewContainerRef.current.clientWidth;
    // Responsive padding based on container size
    const pad = containerWidth < 450 ? 16 : 32;
    const availableWidth = Math.max(260, containerWidth - pad);
    const fitScale = Math.min(1, availableWidth / BASE_A4_WIDTH);

    if (zoomMode === 'fit') {
      setScale(fitScale);
    } else if (zoomMode === '100') {
      setScale(1);
    } else {
      setScale(customZoom);
    }

    if (invoiceRef.current) {
      setMeasuredHeight(Math.max(BASE_A4_HEIGHT, invoiceRef.current.offsetHeight));
    }
  }, [zoomMode, customZoom]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    if (previewContainerRef.current) {
      ro.observe(previewContainerRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [updateScale]);

  // Track height of invoice document when content changes
  useEffect(() => {
    if (invoiceRef.current) {
      setMeasuredHeight(Math.max(BASE_A4_HEIGHT, invoiceRef.current.offsetHeight));
    }
  }, [serviceItems, formData, images]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setServiceItems(items => 
      items.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const addItem = () => {
    setServiceItems(prev => [
      ...prev, 
      { id: Date.now(), name: '', desc: '', qty: 1, price: 0 }
    ]);
  };

  const removeItem = (id) => {
    setServiceItems(items => items.filter(item => item.id !== id));
  };

  const handleImageUpload = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
      setImages((prevImages) => prevImages.concat(filesArray));
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = serviceItems.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.price || 0)), 0);
  const discountAmount = Math.max(0, parseFloat(formData.discount || 0));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * Math.max(0, parseFloat(formData.taxPercent || 0))) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const amountPaid = Math.max(0, parseFloat(formData.amountPaid || 0));
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const getCleanInvoiceNo = (baseNo) => {
    let clean = (baseNo || '').replace(/-ADV$/i, '').replace(/-FIN$/i, '').trim();
    return clean.endsWith('-FIN') ? clean : `${clean}-FIN`;
  };

  const finalInvoiceNumber = getCleanInvoiceNo(formData.invoiceNo);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomMode('custom');
    setCustomZoom(Math.min(1.5, Math.round((scale + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setCustomZoom(Math.max(0.25, Math.round((scale - 0.15) * 100) / 100));
  };

  const handleZoomFit = () => {
    setZoomMode('fit');
  };

  const handleZoom100 = () => {
    setZoomMode('100');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution A4 PDF Generator
  const downloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    setGenerating(true);

    try {
      // Temporarily reset CSS scale transform to generate full 300DPI equivalent quality
      const originalTransform = element.style.transform;
      const originalPosition = element.style.position;
      const originalLeft = element.style.left;
      const originalTop = element.style.top;
      
      element.style.transform = 'none';
      element.style.position = 'static';
      element.style.left = '0';
      element.style.top = '0';

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff', 
        width: BASE_A4_WIDTH,
        windowWidth: BASE_A4_WIDTH
      });

      // Restore responsive styles
      element.style.transform = originalTransform;
      element.style.position = originalPosition;
      element.style.left = originalLeft;
      element.style.top = originalTop;

      const imgData = canvas.toDataURL('image/png');
      
      // Standard A4: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`${finalInvoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="invoice-page-wrapper">
      {/* Top Header Bar */}
      <div className="invoice-header-top no-print">
        <div className="invoice-title-badge-group">
          <div className="invoice-main-heading flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Final Invoice</h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  A4 Printable Standard
                </span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Generate, preview, print, and export official A4 commercial invoices
              </p>
            </div>
          </div>
        </div>

        <div className="invoice-top-actions">
          <button 
            type="button"
            className="action-btn print-btn" 
            onClick={handlePrint}
            title="Print genuine A4 invoice"
          >
            <Printer size={18} />
            <span>Print Invoice</span>
          </button>

          <button 
            type="button"
            className="action-btn download-btn" 
            onClick={downloadPDF}
            disabled={generating}
            title="Download true A4 PDF document"
          >
            {generating ? <Loader2 className="animate-spin" size={18}/> : <Download size={18} />}
            <span>{generating ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Form & Live A4 Preview */}
      <div className="invoice-layout-split">
        
        {/* Left: Input Form Controls */}
        <div className="invoice-form-section no-print">
          
          {/* Card: Invoice Details */}
          <div className="form-card">
            <div className="form-card-title flex items-center justify-between">
              <span>Invoice Details</span>
              <span className="text-xs font-normal text-violet-400">Official Record</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Invoice Number</label>
                <input 
                  className="form-input" 
                  name="invoiceNo" 
                  value={formData.invoiceNo} 
                  onChange={handleChange} 
                  placeholder="#INV-2026-0412"
                />
              </div>
              <div className="form-group">
                <label>Invoice Date</label>
                <input 
                  className="form-input" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  placeholder="June 30, 2026"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Due Date</label>
                <input 
                  className="form-input" 
                  name="dueDate" 
                  value={formData.dueDate} 
                  onChange={handleChange} 
                  placeholder="July 14, 2026"
                />
              </div>
              <div className="form-group">
                <label>Completion Date</label>
                <input 
                  className="form-input" 
                  name="completionDate" 
                  value={formData.completionDate} 
                  onChange={handleChange} 
                  placeholder="July 24, 2026"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Status</label>
                <select 
                  className="form-input" 
                  name="paymentStatus" 
                  value={formData.paymentStatus} 
                  onChange={handleChange}
                >
                  <option value="Payment Due">Payment Due</option>
                  <option value="Paid in Full">Paid in Full</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Completed & Approved">Completed & Approved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Client Details */}
          <div className="form-card">
            <div className="form-card-title">Client Details</div>
            <div className="form-row">
              <div className="form-group">
                <label>Client Contact Name</label>
                <input 
                  className="form-input" 
                  name="clientName" 
                  value={formData.clientName} 
                  onChange={handleChange} 
                  placeholder="Sarah Jenkins"
                />
              </div>
              <div className="form-group">
                <label>Client Company Name</label>
                <input 
                  className="form-input" 
                  name="clientCompany" 
                  value={formData.clientCompany} 
                  onChange={handleChange} 
                  placeholder="Acme Corporation"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Client Billing Address & Email</label>
              <textarea 
                className="form-input" 
                name="clientAddress" 
                value={formData.clientAddress} 
                onChange={handleChange} 
                rows={3}
                placeholder="1221 Avenue of the Americas, New York..."
              />
            </div>
          </div>

          {/* Card: Project Scope */}
          <div className="form-card">
            <div className="form-card-title">Project Scope</div>
            <div className="form-row">
              <div className="form-group">
                <label>Project Reference</label>
                <input 
                  className="form-input" 
                  name="projectRef" 
                  value={formData.projectRef} 
                  onChange={handleChange} 
                  placeholder="Brand Identity & UI/UX Overhaul"
                />
              </div>
              <div className="form-group">
                <label>Service Window</label>
                <input 
                  className="form-input" 
                  name="serviceWindow" 
                  value={formData.serviceWindow} 
                  onChange={handleChange} 
                  placeholder="Q3 2026 Campaign"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Account Manager</label>
                <input 
                  className="form-input" 
                  name="accountManager" 
                  value={formData.accountManager} 
                  onChange={handleChange} 
                  placeholder="Creative Director"
                />
              </div>
              <div className="form-group">
                <label>Delivery Date</label>
                <input 
                  className="form-input" 
                  name="deliveryDate" 
                  value={formData.deliveryDate} 
                  onChange={handleChange} 
                  placeholder="July 24, 2026"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Project Status Label</label>
              <input 
                className="form-input" 
                name="projectStatus" 
                value={formData.projectStatus} 
                onChange={handleChange} 
                placeholder="Completed & Approved"
              />
            </div>
          </div>

          {/* Card: Service Items */}
          <div className="form-card">
            <div className="form-card-title flex items-center justify-between">
              <span>Service Items</span>
              <span className="text-xs text-[var(--text-dim)]">{serviceItems.length} items</span>
            </div>
            
            {serviceItems.map((item) => (
              <div className="service-item-row" key={item.id}>
                <div className="service-item-inputs">
                  <input 
                    placeholder="Service Name (e.g., Brand Identity)" 
                    className="form-input font-semibold" 
                    value={item.name} 
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} 
                  />
                  <textarea 
                    placeholder="Description of deliverables..." 
                    className="form-input" 
                    style={{ minHeight: '60px' }} 
                    value={item.desc} 
                    onChange={(e) => handleItemChange(item.id, 'desc', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Qty</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-input text-center" 
                    value={item.qty} 
                    onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="form-input text-right" 
                    value={item.price} 
                    onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} 
                  />
                </div>
                <button 
                  type="button"
                  className="remove-btn" 
                  onClick={() => removeItem(item.id)} 
                  title="Remove Item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="add-btn" onClick={addItem}>
              <Plus size={16} className="inline mr-1" /> Add Service Item
            </button>

            {/* Calculations & Discounts */}
            <div className="form-row mt-4">
              <div className="form-group">
                <label>Discount Amount ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  className="form-input" 
                  name="discount" 
                  value={formData.discount} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Tax / GST Rate (%)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.1"
                  className="form-input" 
                  name="taxPercent" 
                  value={formData.taxPercent} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount Already Paid ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  className="form-input" 
                  name="amountPaid" 
                  value={formData.amountPaid} 
                  onChange={handleChange} 
                  placeholder="0.00"
                />
                <span className="text-[11px] text-[var(--text-dim)]">Leave 0 if full balance is due</span>
              </div>
            </div>
          </div>

          {/* Card: Settings & Policy */}
          <div className="form-card">
            <div className="form-card-title">Settings & Policy</div>
            <div className="form-group mb-3">
              <label>Company Address & Contact</label>
              <textarea 
                className="form-input" 
                rows={3} 
                name="companyAddress" 
                value={formData.companyAddress} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group mb-3">
              <label>Payment Options (Bank / Stripe Link)</label>
              <textarea 
                className="form-input" 
                style={{ minHeight: '110px' }} 
                name="paymentOptions" 
                value={formData.paymentOptions} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label>Terms & Conditions</label>
              <textarea 
                className="form-input" 
                style={{ minHeight: '90px' }} 
                name="terms" 
                value={formData.terms} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Card: Deliverables & Proof Images */}
          <div className="form-card">
            <div className="form-card-title">Deliverables & Showcase</div>
            <div className="form-group mb-3">
              <label>Delivered File Formats (comma separated)</label>
              <input 
                className="form-input" 
                name="deliveredFormats" 
                value={formData.deliveredFormats} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label>Final Delivery Proof Images (Optional)</label>
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
              />
              <label 
                htmlFor="file-upload" 
                className="upload-btn mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadIcon size={18} /> Select Artwork Images
              </label>
              {images.length > 0 && (
                <div className="images-preview-row">
                  {images.map((src, index) => (
                    <div key={index} className="img-thumbnail-wrapper">
                      <img src={src} className="img-thumbnail" alt={`Proof ${index + 1}`} />
                      <button 
                        type="button"
                        className="remove-img-btn" 
                        onClick={() => removeImage(index)}
                        title="Remove image"
                      >
                        <XIcon size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right: Live A4 Document Preview Section */}
        <div className="invoice-preview-section">
          
          {/* Preview Toolbar with Zoom & A4 Indicator */}
          <div className="preview-toolbar no-print">
            <div className="preview-title-wrap flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-sm text-white">Live A4 Document Preview</span>
              <span className="text-[11px] text-[var(--text-dim)] hidden sm:inline">(210mm × 297mm)</span>
            </div>

            {/* Responsive Zoom Controls */}
            <div className="zoom-controls">
              <button 
                type="button"
                className={`zoom-btn ${zoomMode === 'fit' ? 'active' : ''}`}
                onClick={handleZoomFit}
                title="Fit A4 invoice proportionally to preview width"
              >
                <Maximize2 size={13} />
                <span>Fit</span>
              </button>
              <button 
                type="button"
                className={`zoom-btn ${zoomMode === '100' ? 'active' : ''}`}
                onClick={handleZoom100}
                title="View invoice at 100% standard size"
              >
                100%
              </button>
              <div className="zoom-divider" />
              <button 
                type="button"
                className="zoom-btn icon-only" 
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="zoom-level-text">{Math.round(scale * 100)}%</span>
              <button 
                type="button"
                className="zoom-btn icon-only" 
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>

          {/* Scroll Area & Responsive Stage */}
          <div className="invoice-scroll-area" ref={previewContainerRef}>
            <div 
              className="invoice-preview-stage"
              style={{
                width: `${Math.round(BASE_A4_WIDTH * scale)}px`,
                height: `${Math.round(measuredHeight * scale)}px`
              }}
            >
              {/* Actual Printable A4 Invoice Sheet */}
              <div 
                className="invoice-document" 
                ref={invoiceRef}
                style={{
                  width: `${BASE_A4_WIDTH}px`,
                  minHeight: `${BASE_A4_HEIGHT}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left'
                }}
              >
                {/* Centered Watermark Logo */}
                <img src={logo} className="invoice-watermark" alt="" />
                
                <div className="invoice-content-inner">
                  
                  {/* Document Header */}
                  <header className="invoice-header">
                    <div className="header-left">
                      <div className="invoice-logo-container">
                        <img src={logo} alt="OctoInk Studios" className="invoice-logo-img" />
                      </div>
                      <p className="subtitle">CREATIVE DESIGN & DIGITAL SOLUTIONS</p>
                      <div className="company-info">
                        {formData.companyAddress.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>

                    <div className="header-right">
                      <h1 className="invoice-title-big">FINAL INVOICE</h1>
                      <div className="invoice-meta">
                        <div className="meta-row">
                          <span className="meta-label">INVOICE NO:</span>
                          <span className="meta-value">{finalInvoiceNumber}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">DATE:</span>
                          <span className="meta-value">{formData.date}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">DUE DATE:</span>
                          <span className="meta-value">{formData.dueDate}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">COMPLETION:</span>
                          <span className="meta-value">{formData.completionDate}</span>
                        </div>
                      </div>

                      <div className="payment-status-container">
                        <span className={`payment-status-badge ${balanceDue === 0 ? 'completed' : 'pending'}`}>
                          {balanceDue === 0 ? 'STATUS: PAID IN FULL' : `STATUS: ${formData.paymentStatus.toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                  </header>

                  {/* Parties & Project Scope Grid */}
                  <div className="invoice-parties">
                    <div className="invoice-info-box bill-to">
                      <div className="info-box-title">BILL TO</div>
                      <p className="client-company">{formData.clientCompany || 'Client Company'}</p>
                      {formData.clientName && <p className="client-attn">Attn: {formData.clientName}</p>}
                      {formData.clientAddress.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>

                    <div className="invoice-info-box project-details">
                      <div className="info-box-title">PROJECT DETAILS</div>
                      <p><strong>Project Ref:</strong> {formData.projectRef}</p>
                      <p><strong>Service Window:</strong> {formData.serviceWindow}</p>
                      <p><strong>Account Manager:</strong> {formData.accountManager}</p>
                      <p><strong>Project Status:</strong> {formData.projectStatus}</p>
                      <p><strong>Delivery Date:</strong> {formData.deliveryDate}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th className="text-left" style={{ width: '48%' }}>SERVICE DETAILS</th>
                        <th className="text-center" style={{ width: '12%' }}>QTY</th>
                        <th className="text-right" style={{ width: '20%' }}>UNIT PRICE</th>
                        <th className="text-right" style={{ width: '20%' }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="service-name">{item.name || 'Service Item'}</div>
                            {item.desc && <p className="service-desc">{item.desc}</p>}
                          </td>
                          <td className="text-center">{item.qty || 1}</td>
                          <td className="text-right">{formatCurrency(item.price)}</td>
                          <td className="text-right">{formatCurrency((item.qty || 0) * (item.price || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Deliverables, Payment Methods & Totals Grid */}
                  <div className="invoice-bottom-grid">
                    
                    {/* Left Column: Deliverables & Payment Methods */}
                    <div className="invoice-left-summary space-y-3">
                      <div className="invoice-info-box completed-preview">
                        <div className="info-box-title">COMPLETED WORK & DELIVERABLES</div>
                        <p><strong>Project Status:</strong> {formData.projectStatus} by Client</p>
                        <p className="mt-2.5"><strong>Delivered File Formats:</strong></p>
                        <div className="file-formats-container">
                          {formData.deliveredFormats.split(',').map((fmt, idx) => (
                            <span key={idx} className="file-format-badge">{fmt.trim()}</span>
                          ))}
                        </div>
                      </div>

                      <div className="invoice-info-box payment-methods">
                        <div className="info-box-title">PAYMENT METHOD OPTIONS</div>
                        {formData.paymentOptions.split('\n').map((line, i) => {
                          if (line.toLowerCase().includes('link:') || line.toLowerCase().includes('gateway:')) {
                            const pivotIndex = line.indexOf(':');
                            const label = line.substring(0, pivotIndex + 1);
                            const url = line.substring(pivotIndex + 1).trim();
                            return (
                              <p key={i} className="payment-line">
                                <strong>{label}</strong>{' '}
                                <a 
                                  href={url.startsWith('http') ? url : `https://${url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="payment-link"
                                >
                                  {url}
                                </a>
                              </p>
                            );
                          }
                          return <p key={i} className="payment-line">{line}</p>;
                        })}
                      </div>
                    </div>
                    
                    {/* Right Column: Complete Totals & GST Calculations */}
                    <div className="totals-box">
                      <div className="total-row">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="total-row deduction">
                          <span>Discount</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="total-row">
                        <span>Estimated Tax / GST ({formData.taxPercent}%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="total-row grand-total">
                        <span>Total Project Cost</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                      {amountPaid > 0 && (
                        <>
                          <div className="total-row deduction">
                            <span>Amount Paid</span>
                            <span>-{formatCurrency(amountPaid)}</span>
                          </div>
                          <div className="total-row">
                            <span>Remaining Balance</span>
                            <span>{formatCurrency(balanceDue)}</span>
                          </div>
                        </>
                      )}
                      <div className="total-row-highlight purple-row">
                        <span>Balance Due</span>
                        <span>{formatCurrency(balanceDue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Design Proofs Showcase */}
                  <div className="design-preview-container">
                    {images.length > 0 ? (
                      <div className="final-preview-images-grid">
                        {images.map((src, idx) => (
                          <div key={idx} className="preview-image-wrapper">
                            <img src={src} alt={`Approved Proof ${idx + 1}`} className="preview-image" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="design-preview-placeholder">
                        <div className="placeholder-main flex items-center justify-center gap-1.5">
                          <Sparkles size={14} className="text-violet-500" />
                          <span>Approved Deliverables Verified</span>
                        </div>
                        <div className="placeholder-sub">
                          Final Approved Assets & Collateral — {formData.projectRef}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Appreciation Note */}
                  <div className="note-banner final-note">
                    "Thank you for choosing OctoInk Studios. We appreciate your business and look forward to partnering on future creative initiatives."
                  </div>

                  {/* Terms & Footer Signature Section */}
                  <div className="invoice-bottom-meta">
                    <div className="terms-section">
                      <div className="terms-title">TERMS & CONDITIONS</div>
                      <ul className="terms-list">
                        {formData.terms.split('\n').map((term, i) => (
                          <li key={i}>{term.replace(/^[•\-*]\s*/, '')}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="invoice-footer-signature">
                      <div className="signature-line-wrapper">
                        <div className="sig-line" />
                        <div className="sig-label">AUTHORIZED SIGNATURE</div>
                        <div className="sig-sub">OctoInk Studios LLC — Accounts & Design Lead</div>
                      </div>
                      <div className="seal-placeholder">
                        OCTOINK OFFICIAL SEAL
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Invoice;
