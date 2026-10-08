import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Upload as UploadIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import './Invoice.css';
import logo from '../assets/logo.png';

const Invoice = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const invoiceRef = useRef(null);
  const previewContainerRef = useRef(null);
  const pageWidth = 800; // Base width of the invoice document
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        const pdfWidth = pageWidth; // Base width of the invoice document
        // Scale to fit available width with 32px total padding (16px per side)
        const newScale = (containerWidth - 32) / pdfWidth;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const [formData, setFormData] = useState({
    companyName: 'OCTOINK STUDIOS',
    companyAddress: '84 Design District, Suite 400\nCreative Quarter, NY 10013\nhello@octoinkstudios.com | www.octoinkstudios.com',
    invoiceNo: '#INV-2026-0412',
    date: 'June 30, 2026',
    dueDate: 'July 14, 2026',
    completionDate: 'July 24, 2026',
    deliveryDate: 'July 24, 2026',
    projectStatus: 'Completed & Approved',
    clientName: 'Sarah Jenkins (VP of Marketing)',
    clientCompany: 'Acme Corporation',
    clientAddress: '1221 Avenue of the Americas, 42nd Floor\nNew York, NY 10020\nsarah.jenkins@acmecorp-example.com',
    projectRef: 'Brand Identity & UI/UX Overhaul',
    serviceWindow: 'Q3 2026 Campaign',
    accountManager: 'Creative Director',
    discount: 0,
    taxPercent: 8.5,
    advancePercent: 20,
    deliveredFormats: 'AI, EPS, PDF, PNG, JPG, DST, EMB',
    paymentOptions: 'Bank Transfer (ACH / Wire):\nBank Name: Premium Tier Trust Bank\nAccount Name: OctoInk Studios LLC\nAccount Number: XXXX-XXXX-4590 | Routing: XXXXX0210\nStripe Secure Link: payments.octoinkstudios.com/invoice-0412-adv',
    terms: '• Work starts after receiving the 20% advance payment.\n• Remaining 80% balance must be paid before final deliverables are shared.\n• The 20% advance is non-refundable once the project has commenced.\n• Additional revisions or extra work outside the agreed scope may incur additional charges.\n• Ownership of artwork and final deliverables transfers only after full payment is received.'
  });

  const [serviceItems, setServiceItems] = useState([
    { id: 1, name: 'BRAND IDENTITY', desc: 'Comprehensive typography system, premium color guidelines, brand book asset curation, and cross-platform collateral templates.', qty: 1, price: 3500 },
    { id: 2, name: 'UI/UX DESIGN', desc: 'High-fidelity website interactive prototypes, responsive layout mockups for desktop/mobile views, and handoff assets.', qty: 1, price: 4200 }
  ]);

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
    setServiceItems([...serviceItems, { id: Date.now(), name: '', desc: '', qty: 1, price: 0 }]);
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
  const discountAmount = parseFloat(formData.discount || 0);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * parseFloat(formData.taxPercent || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const advancePercent = parseFloat(formData.advancePercent || 20);
  const advanceRequired = grandTotal * (advancePercent / 100);
  const remainingBalance = grandTotal - advanceRequired;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getInvoiceNo = (baseNo, type) => {
    let clean = baseNo.replace(/-ADV$/, '').replace(/-FIN$/, '');
    return `${clean}-${type === 'invoice' ? 'ADV' : 'FIN'}`;
  };

  const downloadPDF = async (filename) => {
    const element = invoiceRef.current;
    if (!element) return;
    setGenerating(true);

    try {
      // Temporarily remove zoom for full-quality PDF generation
      const originalZoom = element.style.zoom;
      element.style.zoom = 1;
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 800 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
      
      // Restore zoom
      element.style.zoom = originalZoom;
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setGenerating(false);
    }
  };

  const renderForm = () => (
    <div className="invoice-form-section">
      <div className="form-card">
        <div className="form-card-title">Invoice Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Invoice Number</label>
            <input className="form-input" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input className="form-input" name="date" value={formData.date} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Advance Due Date</label>
            <input className="form-input" name="dueDate" value={formData.dueDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Completion Date (Final)</label>
            <input className="form-input" name="completionDate" value={formData.completionDate} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Advance Percentage (%)</label>
            <input type="number" className="form-input" name="advancePercent" value={formData.advancePercent} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-title">Client Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Client Contact Name</label>
            <input className="form-input" name="clientName" value={formData.clientName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Client Company</label>
            <input className="form-input" name="clientCompany" value={formData.clientCompany} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Client Address & Details</label>
          <textarea className="form-input" name="clientAddress" value={formData.clientAddress} onChange={handleChange} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-title">Project Scope</div>
        <div className="form-row">
          <div className="form-group">
            <label>Project Ref</label>
            <input className="form-input" name="projectRef" value={formData.projectRef} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Service Window</label>
            <input className="form-input" name="serviceWindow" value={formData.serviceWindow} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Account Manager</label>
            <input className="form-input" name="accountManager" value={formData.accountManager} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Delivery Date (Final)</label>
            <input className="form-input" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Project Status (Final)</label>
            <input className="form-input" name="projectStatus" value={formData.projectStatus} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-title">Service Items</div>
        {serviceItems.map(item => (
          <div className="service-item-row" key={item.id}>
            <div className="service-item-inputs">
              <input placeholder="Service Name" className="form-input" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} />
              <textarea placeholder="Description" className="form-input" style={{minHeight:'60px'}} value={item.desc} onChange={(e) => handleItemChange(item.id, 'desc', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Qty</label>
              <input type="number" className="form-input" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input type="number" className="form-input" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} />
            </div>
            <button className="remove-btn" onClick={() => removeItem(item.id)} title="Remove Item"><Trash2 size={16} /></button>
          </div>
        ))}
        <button className="add-btn" onClick={addItem}><Plus size={16} className="inline mr-1"/> Add Item</button>

        <div className="form-row mt-4">
          <div className="form-group">
            <label>Discount Amount ($)</label>
            <input type="number" className="form-input" name="discount" value={formData.discount} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Tax (%)</label>
            <input type="number" className="form-input" name="taxPercent" value={formData.taxPercent} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-title">Settings & Policy</div>
        <div className="form-group mb-3">
          <label>Company Address</label>
          <textarea className="form-input" name="companyAddress" value={formData.companyAddress} onChange={handleChange} />
        </div>
        <div className="form-group mb-3">
          <label>Payment Options</label>
          <textarea className="form-input" style={{minHeight:'120px'}} name="paymentOptions" value={formData.paymentOptions} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Terms & Conditions</label>
          <textarea className="form-input" style={{minHeight:'100px'}} name="terms" value={formData.terms} onChange={handleChange} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-card-title">Final Invoice Settings</div>
        <div className="form-group mb-3">
          <label>Delivered File Formats (comma separated)</label>
          <input className="form-input" name="deliveredFormats" value={formData.deliveredFormats} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Final Delivery Proofs (Images)</label>
          <input 
            type="file" 
            id="file-upload" 
            multiple 
            accept="image/*" 
            onChange={handleImageUpload} 
            style={{display: 'none'}} 
          />
          <label htmlFor="file-upload" className="upload-btn mt-2" style={{justifyContent: 'center', width: '100%', cursor: 'pointer'}}>
            <UploadIcon size={18} /> Select Images
          </label>
          {images.length > 0 && (
            <div className="images-preview-row">
              {images.map((src, index) => (
                <div key={index} className="img-thumbnail-wrapper">
                  <img src={src} className="img-thumbnail" alt={`preview ${index}`} />
                  <button className="remove-img-btn" onClick={() => removeImage(index)}><X size={10}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="invoice-page-wrapper">
      <div className="invoice-header-top">
        <div className="invoice-tabs">
          <button 
            className={`tab-button ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            Advance Invoice
          </button>
          <button 
            className={`tab-button ${activeTab === 'final' ? 'active' : ''}`}
            onClick={() => setActiveTab('final')}
          >
            Final Invoice
          </button>
        </div>
        <button 
          className="download-btn" 
          onClick={() => downloadPDF(activeTab === 'invoice' ? `${getInvoiceNo(formData.invoiceNo, 'invoice')}.pdf` : `${getInvoiceNo(formData.invoiceNo, 'final')}.pdf`)}
          disabled={generating}
        >
          {generating ? <Loader2 className="animate-spin" size={18}/> : <Download size={18} />}
          {generating ? 'Generating PDF...' : `Download ${activeTab === 'invoice' ? 'Advance Invoice' : 'Final Invoice'} PDF`}
        </button>
      </div>

      <div className="invoice-layout-split">
        {renderForm()}
        
        <div className="invoice-preview-section">
          <div className="preview-title">Live PDF Preview</div>
          <div className="invoice-scroll-area" ref={previewContainerRef}>
            <div 
              className="invoice-document" 
              ref={invoiceRef}
              style={{
                zoom: scale,
                width: pageWidth,
                margin: '0 auto',
                position: 'relative',
                left: 0,
                right: 0,
                transform: 'none'
              }}
            >
              {/* Centered Watermark Logo */}
              <img src={logo} className="invoice-watermark" alt="" />
              
              <div className="invoice-content-inner">
                {activeTab === 'invoice' ? (
                  <>
                    {/* ADVANCE INVOICE LAYOUT */}
                    <header className="invoice-header">
                      <div className="header-left">
                        <div className="invoice-logo-container">
                          <img src={logo} alt="OctoInk Studios" className="invoice-logo-img" />
                        </div>
                        <p className="subtitle">CREATIVE DESIGN & DIGITAL SOLUTIONS</p>
                        <div className="company-info">
                          {formData.companyAddress.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                      <div className="header-right">
                        <h1 className="invoice-title-big">ADVANCE INVOICE</h1>
                        <div className="invoice-meta">
                          <div className="meta-row">
                            <span className="meta-label">INVOICE NO:</span>
                            <span className="meta-value">{getInvoiceNo(formData.invoiceNo, 'invoice')}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">DATE:</span>
                            <span className="meta-value">{formData.date}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">DUE DATE:</span>
                            <span className="meta-value">{formData.dueDate}</span>
                          </div>
                        </div>
                        <div className="payment-status-container">
                          <span className="payment-status-badge pending">
                            PAYMENT STATUS: PENDING ({formData.advancePercent}% ADVANCE)
                          </span>
                        </div>
                      </div>
                    </header>

                    <div className="invoice-parties">
                      <div className="invoice-info-box bill-to">
                        <div className="info-box-title">BILL TO</div>
                        <p className="client-company">{formData.clientCompany}</p>
                        {formData.clientName && <p className="client-attn">Attn: {formData.clientName}</p>}
                        {formData.clientAddress.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                      </div>
                      <div className="invoice-info-box project-scope">
                        <div className="info-box-title">PROJECT SCOPE SUMMARY</div>
                        <p><strong>Project Ref:</strong> {formData.projectRef}</p>
                        <p><strong>Service Window:</strong> {formData.serviceWindow}</p>
                        <p><strong>Account Manager:</strong> {formData.accountManager}</p>
                      </div>
                    </div>

                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th className="text-left" style={{ width: '50%' }}>SERVICE DETAILS</th>
                          <th className="text-center" style={{ width: '10%' }}>QTY</th>
                          <th className="text-right" style={{ width: '20%' }}>UNIT PRICE</th>
                          <th className="text-right" style={{ width: '20%' }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="service-name">{item.name || 'Service Name'}</div>
                              {item.desc && <p className="service-desc">{item.desc}</p>}
                            </td>
                            <td className="text-center">{item.qty}</td>
                            <td className="text-right">{formatCurrency(item.price)}</td>
                            <td className="text-right">{formatCurrency((item.qty || 0) * (item.price || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="invoice-bottom-grid">
                      <div className="invoice-info-box payment-methods">
                        <div className="info-box-title">PAYMENT METHOD OPTIONS</div>
                        {formData.paymentOptions.split('\n').map((line, i) => {
                          if (line.toLowerCase().includes('link:') || line.toLowerCase().includes('gateway:')) {
                            const pivotIndex = line.indexOf(':');
                            const label = line.substring(0, pivotIndex + 1);
                            const url = line.substring(pivotIndex + 1).trim();
                            return (
                              <p key={i} className="payment-line">
                                <strong>{label}</strong> <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="payment-link">{url}</a>
                              </p>
                            );
                          }
                          return <p key={i} className="payment-line">{line}</p>;
                        })}
                      </div>
                      
                      <div className="totals-box">
                        <div className="total-row">
                          <span>Subtotal</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="total-row">
                            <span>Discount</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        <div className="total-row">
                          <span>Estimated Tax/GST ({formData.taxPercent}%)</span>
                          <span>{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="total-row grand-total">
                          <span>Grand Total</span>
                          <span>{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="total-row-highlight purple-row">
                          <span>{formData.advancePercent}% Advance Required</span>
                          <span>{formatCurrency(advanceRequired)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="note-banner advance-note">
                      "Work will begin only after the {formData.advancePercent}% advance payment has been received and confirmed."
                    </div>

                    <div className="terms-section">
                      <div className="terms-title">TERMS & CONDITIONS / POLICY</div>
                      <ul className="terms-list">
                        {formData.terms.split('\n').map((term, i) => (
                          <li key={i}>{term.replace(/^•\s*/, '').replace(/^\s*-\s*/, '')}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {/* FINAL INVOICE LAYOUT */}
                    <header className="invoice-header">
                      <div className="header-left">
                        <div className="invoice-logo-container">
                          <img src={logo} alt="OctoInk Studios" className="invoice-logo-img" />
                        </div>
                        <p className="subtitle">CREATIVE DESIGN & DIGITAL SOLUTIONS</p>
                        <div className="company-info">
                          {formData.companyAddress.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                      <div className="header-right">
                        <h1 className="invoice-title-big">FINAL INVOICE</h1>
                        <div className="invoice-meta">
                          <div className="meta-row">
                            <span className="meta-label">INVOICE NO:</span>
                            <span className="meta-value">{getInvoiceNo(formData.invoiceNo, 'final')}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">DATE:</span>
                            <span className="meta-value">{formData.date}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">COMPLETION:</span>
                            <span className="meta-value">{formData.completionDate}</span>
                          </div>
                        </div>
                        <div className="payment-status-container">
                          <span className="payment-status-badge completed">
                            PROJECT COMPLETED & BALANCE DUE
                          </span>
                        </div>
                      </div>
                    </header>

                    <div className="invoice-parties">
                      <div className="invoice-info-box bill-to">
                        <div className="info-box-title">BILL TO</div>
                        <p className="client-company">{formData.clientCompany}</p>
                        {formData.clientName && <p className="client-attn">Attn: {formData.clientName}</p>}
                        {formData.clientAddress.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                      </div>
                      <div className="invoice-info-box project-details">
                        <div className="info-box-title">PROJECT DETAILS</div>
                        <p><strong>Project Ref:</strong> {formData.projectRef}</p>
                        <p><strong>Status:</strong> {formData.projectStatus}</p>
                        <p><strong>Delivery Date:</strong> {formData.deliveryDate}</p>
                      </div>
                    </div>

                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th className="text-left" style={{ width: '50%' }}>SERVICE DETAILS</th>
                          <th className="text-center" style={{ width: '10%' }}>QTY</th>
                          <th className="text-right" style={{ width: '20%' }}>UNIT PRICE</th>
                          <th className="text-right" style={{ width: '20%' }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="service-name">{item.name || 'Service Name'}</div>
                              {item.desc && <p className="service-desc">{item.desc}</p>}
                            </td>
                            <td className="text-center">{item.qty}</td>
                            <td className="text-right">{formatCurrency(item.price)}</td>
                            <td className="text-right">{formatCurrency((item.qty || 0) * (item.price || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="invoice-bottom-grid">
                      <div className="invoice-info-box completed-preview">
                        <div className="info-box-title">COMPLETED WORK PREVIEW & STATUS</div>
                        <p><strong>Project Status:</strong> {formData.projectStatus} by Client</p>
                        <p className="mt-4"><strong>Delivered File Formats:</strong></p>
                        <div className="file-formats-container">
                          {formData.deliveredFormats.split(',').map((fmt, idx) => (
                            <span key={idx} className="file-format-badge">{fmt.trim()}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="totals-box">
                        <div className="total-row">
                          <span>Total Project Cost</span>
                          <span>{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="total-row deduction">
                          <span>Advance Paid ({formData.advancePercent}%)</span>
                          <span>-{formatCurrency(advanceRequired)}</span>
                        </div>
                        <div className="total-row">
                          <span>Remaining Balance ({(100 - formData.advancePercent)}%)</span>
                          <span>{formatCurrency(remainingBalance)}</span>
                        </div>
                        <div className="total-row">
                          <span>Total Paid to Date</span>
                          <span>{formatCurrency(advanceRequired)}</span>
                        </div>
                        <div className="total-row-highlight purple-row">
                          <span>Balance Due</span>
                          <span>{formatCurrency(remainingBalance)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="design-preview-container">
                      {images.length > 0 ? (
                        <div className="final-preview-images-grid">
                          {images.map((src, idx) => (
                            <div key={idx} className="preview-image-wrapper">
                              <img src={src} alt={`Design Preview ${idx + 1}`} className="preview-image" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="design-preview-placeholder">
                          <div className="placeholder-main">[ Completed Design Preview Placeholder ]</div>
                          <div className="placeholder-sub">Final Approved Design — {formData.projectRef} Showcase</div>
                        </div>
                      )}
                    </div>

                    <div className="note-banner final-note">
                      "Thank you for choosing OctoInk Studios. We appreciate your business and look forward to working with you again."
                    </div>
                  </>
                )}
                

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple X icon for the thumbnail close button
const X = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default Invoice;
