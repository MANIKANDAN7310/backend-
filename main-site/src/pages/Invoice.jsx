import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Invoice.css';

const Invoice = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [images, setImages] = useState([]);
  const invoiceRef = useRef(null);
  const finalInvoiceRef = useRef(null);

  const handleImageUpload = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages((prevImages) => prevImages.concat(filesArray));
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const downloadPDF = async (ref, filename) => {
    const element = ref.current;
    if (!element) return;

    // We add a class during capture if needed, or adjust styles, but here we just capture the element directly.
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF", error);
    }
  };

  const renderInvoiceContent = (isFinal = false) => {
    return (
      <div className="invoice-document" ref={isFinal ? finalInvoiceRef : invoiceRef}>
        <div className="invoice-top-bar"></div>
        <div className="invoice-content-wrapper">
          <header className="invoice-header">
            <div className="header-left">
              <h1>OCTOINK<span>.STUDIOS</span></h1>
              <p className="subtitle">CREATIVE DESIGN AGENCY</p>
              <div className="company-info mt-4">
                <p>84 Design District, Suite 400</p>
                <p>Creative Quarter, NY 10013</p>
                <p>hello@octoinkstudios.com</p>
                <p>www.octoinkstudios.com</p>
              </div>
            </div>
            <div className="header-right">
              <h1 className="invoice-title-big">INVOICE</h1>
              <div className="invoice-meta mt-4">
                <div className="meta-row">
                  <span className="meta-label">INVOICE NO:</span>
                  <span className="meta-value">#INV-2026-0412</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">DATE:</span>
                  <span className="meta-value">June 30, 2026</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">DUE DATE:</span>
                  <span className="meta-value">July 14, 2026</span>
                </div>
                <div className="payment-status">
                  [PAYMENT STATUS: PENDING]
                </div>
              </div>
            </div>
          </header>

          <div className="invoice-parties">
            <div className="bill-to">
              <h3>BILL TO</h3>
              <p className="fw-bold">[Client Contact Name]</p>
              <p>[Client Company Name]</p>
              <p>[Client Street Address]</p>
              <p>[City, State, Zip Code]</p>
              <p>[client.email@example.com]</p>
            </div>
            <div className="project-scope">
              <h3>PROJECT SCOPE SUMMARY</h3>
              <p><strong>Project Ref:</strong> [e.g., Brand Identity Overhaul]</p>
              <p><strong>Service Window:</strong> Q3 2026 Campaign</p>
              <p><strong>Account Manager:</strong> Creative Director</p>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th className="text-left">SERVICE DETAILS</th>
                <th className="text-center">QTY</th>
                <th className="text-right">UNIT PRICE</th>
                <th className="text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="service-name"><span className="orange-bar"></span>BRAND IDENTITY</div>
                  <p className="service-desc">Comprehensive typography system, premium color guidelines, brand book asset curation, and cross-platform collateral templates.</p>
                </td>
                <td className="text-center">1</td>
                <td className="text-right">$3,500.00</td>
                <td className="text-right">$3,500.00</td>
              </tr>
              <tr>
                <td>
                  <div className="service-name"><span className="orange-bar"></span>UI/UX DESIGN</div>
                  <p className="service-desc">High-fidelity website interactive prototypes, responsive layout mockups for desktop/mobile views, and handoff assets.</p>
                </td>
                <td className="text-center">1</td>
                <td className="text-right">$4,200.00</td>
                <td className="text-right">$4,200.00</td>
              </tr>
              <tr>
                <td>
                  <div className="service-name"><span className="orange-bar"></span>CUSTOM DESIGN SERVICE</div>
                  <p className="service-desc">[Placeholder: Add extra service details here, e.g., Packaging Design, Motion Graphics, or Social Media Kits as required].</p>
                </td>
                <td className="text-center">0</td>
                <td className="text-right">$0.00</td>
                <td className="text-right">$0.00</td>
              </tr>
            </tbody>
          </table>

          <div className="invoice-summary-section">
            <div className="payment-options">
              <h3>PAYMENT METHOD OPTIONS</h3>
              <p><strong>Bank Transfer (ACH / Wire):</strong></p>
              <p>Bank Name: Premium Tier Trust Bank</p>
              <p>Account Name: OctoInk Studios LLC</p>
              <p>Account Number: XXXX-XXXX-4590</p>
              <p>Routing Number: XXXXX0210</p>
              <br/>
              <p><strong>Digital Stripe Gateway link:</strong></p>
              <p>payments.octoinkstudios.com/invoice-placeholder</p>
            </div>
            <div className="totals">
              <div className="total-row">
                <span>Subtotal</span>
                <strong>$7,700.00</strong>
              </div>
              <div className="total-row">
                <span>Discount (0%)</span>
                <strong>-$0.00</strong>
              </div>
              <div className="total-row">
                <span>Estimated Tax/GST (8.5%)</span>
                <strong>$654.50</strong>
              </div>
              <div className="grand-total-row">
                <span>GRAND TOTAL</span>
                <span className="grand-total-amount">$8,354.50</span>
              </div>
            </div>
          </div>

          <div className="invoice-footer">
            <div className="terms">
              <h3 className="terms-title">TERMS & CONDITIONS / POLICY</h3>
              <ul>
                <li>This invoice serves as a quotation and work agreement.</li>
                <li>Work will commence only after the client accepts this invoice and pays a 20% advance payment.</li>
                <li>The 20% advance is non-refundable once the project has started.</li>
                <li>The remaining 80% balance must be paid before the final files are delivered.</li>
                <li>The 20% advance amount will be deducted from the final invoice, meaning the client will only pay the remaining balance.</li>
                <li>Any additional revisions or extra work outside the agreed scope may incur additional charges.</li>
                <li>Final deliverables will be shared only after full payment is received.</li>
              </ul>
            </div>
            <div className="signature-section">
              <div className="signature-name">OctoInk Agency</div>
              <div className="signature-line"></div>
              <div className="signature-title">AUTHORIZED SIGNEE</div>
              <div className="signature-subtitle">OctoInk Studios Design Lead</div>
            </div>
          </div>
          
          {/* Work Completion Images Section (Only for Final Invoice) */}
          {isFinal && images.length > 0 && (
            <div className="work-completion-section">
              <h3 className="terms-title mb-3">WORK COMPLETION PROOFS</h3>
              <div className="images-grid">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="completion-image-wrapper">
                    <img src={imgUrl} alt={`Completion proof ${idx+1}`} className="completion-image" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="invoice-page-wrapper">
      <div className="invoice-tabs">
        <button 
          className={`tab-button ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          Invoice
        </button>
        <button 
          className={`tab-button ${activeTab === 'final' ? 'active' : ''}`}
          onClick={() => setActiveTab('final')}
        >
          Final Invoice
        </button>
      </div>

      <div className="invoice-actions-top">
        {activeTab === 'invoice' ? (
          <button className="download-btn" onClick={() => downloadPDF(invoiceRef, 'Invoice.pdf')}>
            Download PDF
          </button>
        ) : (
          <div className="final-invoice-actions">
            <div>
                <input 
                  type="file" 
                  id="file-upload" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{display: 'none'}} 
                />
                <label htmlFor="file-upload" className="upload-btn">
                  Upload Completion Images
                </label>
            </div>
            <button className="download-btn" onClick={() => downloadPDF(finalInvoiceRef, 'Final_Invoice.pdf')}>
              Download Final Invoice PDF
            </button>
          </div>
        )}
      </div>

      {activeTab === 'final' && images.length > 0 && (
        <div className="uploaded-images-preview">
          <h4>Uploaded Images (Preview before generation):</h4>
          <div className="preview-grid">
            {images.map((src, index) => (
              <div key={index} className="preview-item">
                <img src={src} alt={`preview ${index}`} />
                <button className="remove-img-btn" onClick={() => removeImage(index)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="invoice-container-outer">
        <div className="invoice-scroll-area">
          {activeTab === 'invoice' ? renderInvoiceContent(false) : renderInvoiceContent(true)}
        </div>
      </div>
    </div>
  );
};

export default Invoice;
