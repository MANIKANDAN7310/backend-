import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Invoice.css';

const Invoice = () => {
  const [images, setImages] = useState([]);
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

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF", error);
    }
  };

  const renderInvoiceContent = () => {
    return (
      <div className="invoice-document" ref={finalInvoiceRef}>
        <div className="invoice-top-bar"></div>
        <div className="invoice-content-wrapper">
          <header className="invoice-header">
            <div className="header-left">
              <h1>OCTOINK<span>.STUDIOS</span></h1>
              <p className="subtitle">CREATIVE DESIGN AGENCY</p>
              <div className="company-info mt-4">
                {/* <p>84 Design District, Suite 400</p>
                <p>Creative Quarter, NY 10013</p> */}
                <p>hello@octoinkstudios.com</p>
                <p>www.octoinkstudios.com</p>
              </div>
            </div>
            <div className="header-right">
              <h1 className="invoice-title-big"> INVOICE</h1>
              <div className="invoice-meta mt-4">
                <div className="meta-row">
                  <span className="meta-label">INVOICE NO:</span>
                  <span className="meta-value">#INV-2026-0412-FIN</span>
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
                  [PAYMENT STATUS: COMPLETED]
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
              <br />
              <p><strong>Digital Stripe Gateway link:</strong></p>
              <p>payments.octoinkstudios.com/invoice-0412</p>
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
                <span>TOTAL AMOUNT DUE</span>
                <span className="grand-total-amount">$8,354.50</span>
              </div>
            </div>
          </div>

          <div className="invoice-footer">
            <div className="terms">
              <h3 className="terms-title">TERMS & CONDITIONS / POLICY</h3>
              <ul>
                <li>Full payment is due within the agreed payment window.</li>
                <li>All deliverables and source files are provided upon final approval.</li>
                <li>Any additional revisions or extra work outside the agreed scope may incur additional charges.</li>
                <li>Ownership of artwork and final deliverables transfers only after full payment is received.</li>
              </ul>
            </div>
            <div className="signature-section">
              <div className="signature-name">OctoInk Agency</div>
              <div className="signature-line"></div>
              <div className="signature-title">AUTHORIZED SIGNEE</div>
              <div className="signature-subtitle">OctoInk Studios Design Lead</div>
            </div>
          </div>

          {/* Work Completion Images Section */}
          {images.length > 0 && (
            <div className="work-completion-section">
              <h3 className="terms-title mb-3">WORK COMPLETION PROOFS</h3>
              <div className="images-grid">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="completion-image-wrapper">
                    <img src={imgUrl} alt={`Completion proof ${idx + 1}`} className="completion-image" />
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
      <div className="invoice-actions-top">
        <div className="final-invoice-actions">
          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-btn">
              Upload Completion Images
            </label>
          </div>
          <button className="download-btn" onClick={() => downloadPDF(finalInvoiceRef, 'Final_Invoice.pdf')}>
            Download Final Invoice PDF
          </button>
        </div>
      </div>

      {images.length > 0 && (
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
          {renderInvoiceContent()}
        </div>
      </div>
    </div>
  );
};

export default Invoice;
