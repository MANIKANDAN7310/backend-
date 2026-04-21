import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CustomDesignForm.css';

const CustomDesignForm = () => {
    // Main design file state
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    // Reference files state
    const [refFiles, setRefFiles] = useState([]);

    const [formData, setFormData] = useState({
        fileName: '',
        category: 'Enamel Pin',
        width: '',
        height: '',
        colors: '',
        requirement: '',
        email: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const navigate = useNavigate();
    const { user, token } = useAuth();

    // Refs
    const fileInputRef = useRef(null);
    const refFileInputRef = useRef(null);
    const fileNameInputRef = useRef(null);
    const colorsInputRef = useRef(null);

    // Cleanup object URLs on unmount to avoid memory leaks
    useEffect(() => {
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [filePreview]);

    // MAIN FILE HANDLERS
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
            setStatus({ type: 'error', message: 'Only PNG and JPG files are allowed for the main design' });
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'Main design file size must be less than 10MB' });
            return;
        }

        setFile(selectedFile);

        // Create preview
        if (filePreview) URL.revokeObjectURL(filePreview);
        setFilePreview(URL.createObjectURL(selectedFile));

        if (!formData.fileName) {
            setFormData(prev => ({ ...prev, fileName: selectedFile.name }));
        }
        setStatus({ type: '', message: '' });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
            e.dataTransfer.clearData();
        }
    };

    const removeFile = (e) => {
        if (e) e.stopPropagation();
        setFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // REFERENCE FILE HANDLERS
    const handleRefFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // Add new files to existing ones
        setRefFiles(prev => [...prev, ...selectedFiles]);

        // Reset input so the same file can be selected again if needed
        if (refFileInputRef.current) refFileInputRef.current.value = '';
    };

    const handleRefDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setRefFiles(prev => [...prev, ...droppedFiles]);
            e.dataTransfer.clearData();
        }
    };

    const removeRefFile = (indexToRemove) => {
        setRefFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // FORM HANDLERS
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Numeric validation for colors only
        if (name === 'colors') {
            if (value !== '' && !/^\d+$/.test(value)) return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const focusEdit = (field) => {
        if (field === 'fileName' && fileNameInputRef.current) fileNameInputRef.current.focus();
        if (field === 'colors' && colorsInputRef.current) colorsInputRef.current.focus();
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setStatus({ type: 'error', message: 'Main design file is required' });
            return;
        }

        if (!formData.email || !validateEmail(formData.email)) {
            setStatus({ type: 'error', message: 'A valid email is required' });
            return;
        }

        setStatus({ type: 'loading', message: 'Submitting...' });

        const submitData = new FormData();
        // Append main file
        submitData.append('file', file);

        // Append reference files (using a different field name 'refFiles' to distinguish on backend if needed, 
        // though for email attachments they can all just be attachments)
        refFiles.forEach((refFile, index) => {
            submitData.append('refFiles', refFile);
        });

        Object.keys(formData).forEach(key => {
            submitData.append(key, formData[key]);
        });

        const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';

        try {
            const res = await fetch(`${API}/api/orders/custom-design`, {
                method: 'POST',
                body: submitData
            });

            const data = await res.json();

            if (data.success) {
                // Navigate to success page directly (Payment bypassed or handled after)
                navigate('/success', { state: { type: 'custom_submission', customDesignId: data.customDesignId } });
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to submit.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error connecting to the server. Please ensure backend is running.' });
        }
    };

    const handlePayment = async (customDesignId, email) => {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';
        setStatus({ type: 'loading', message: 'Initializing payment...' });

        try {
            // 1. Create Order
            const res = await fetch(`${API}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    amount: 500, // Fixed amount for custom designs
                    currency: 'INR',
                    items: [{
                        title: `Custom Design: ${formData.fileName || "N/A"}`,
                        price: 500,
                        quantity: 1
                    }],
                    clientInfo: {
                        name: user?.name || email.split('@')[0],
                        email: email
                    },
                    orderType: 'Custom',
                    customDesignId: customDesignId
                })
            });

            const data = await res.json();
            if (!data.success) {
                setStatus({ type: 'error', message: data.message || "Payment initialization failed." });
                return;
            }

            // 2. Open Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.amount, // in paisa (INR)
                currency: data.currency, // INR
                display_currency: "USD",
                display_amount: 500, // The USD amount to show
                name: "Octoink Studio",
                description: "Custom Design Submission Fee",
                order_id: data.orderId,
                handler: async function (response) {
                    setStatus({ type: 'loading', message: 'Verifying payment...' });
                    try {
                        const verifyRes = await fetch(`${API}/api/payment/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : ''
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            navigate('/success', { state: { type: 'custom', order: verifyData.order } });
                        } else {
                            navigate('/failure');
                        }
                    } catch (err) {
                        navigate('/failure');
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: email
                },
                theme: {
                    color: "#7c3aed"
                },
                modal: {
                    ondismiss: function () {
                        setStatus({ type: 'error', message: 'Payment cancelled. Your design was saved but needs payment to proceed.' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment Error:", error);
            setStatus({ type: 'error', message: "Failed to connect to payment gateway." });
        }
    };

    return (
        <div className="custom-design-container">
            <h1 className="cd-title">Custom Design</h1>
            <p className="cd-subtitle">Submit Your Custom Design Files & Details Below</p>

            <form className="cd-card" onSubmit={handleSubmit}>
                {status.message && (
                    <div className={`cd-status cd-status-${status.type}`}>
                        {status.message}
                    </div>
                )}

                <div className="cd-main-grid">
                    {/* LEFT COLUMN: UPLOADS */}
                    <div className="cd-left-col">
                        <div className="cd-upload-box">
                            <span className="cd-upload-label">Upload Your Design *</span>
                            <div
                                className={`cd-dropzone ${filePreview ? 'has-image' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => !filePreview && fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept=".png,.jpg,.jpeg"
                                    onChange={handleFileChange}
                                />

                                {filePreview ? (
                                    <div className="cd-preview-container">
                                        <img src={filePreview} alt="Design Preview" className="cd-preview-img" />
                                        <div className="cd-preview-overlay">
                                            <button
                                                type="button"
                                                className="cd-preview-btn change"
                                                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                                            >
                                                Change
                                            </button>
                                            <button
                                                type="button"
                                                className="cd-preview-btn remove"
                                                onClick={removeFile}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="cd-dropzone-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="cd-plus">+</div>
                                        <span className="cd-dropzone-text">PNG, JPG up to 10MB</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="cd-upload-box cd-ref-box">
                            <span className="cd-upload-label">Reference File (Optional)</span>
                            <div
                                className="cd-dropzone cd-dropzone-small"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleRefDrop}
                                onClick={() => refFileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    ref={refFileInputRef}
                                    onChange={handleRefFileChange}
                                />
                                <div className="cd-small-upload-content">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Upload References</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FIELDS */}
                    <div className="cd-right-col">
                        <div className="cd-fields-grid">
                            <div className="cd-input-group">
                                <label>Category</label>
                                <div className="cd-select-wrapper">
                                    <select name="category" value={formData.category} onChange={handleChange}>
                                        <option value="Enamel Pin">Enamel Pin</option>
                                        <option value="Medals">Medals</option>
                                        <option value="Ornament Design">Ornament Design</option>
                                        <option value="Keychain Design">Keychain Design</option>
                                        <option value="Coins Design">Coins Design</option>
                                        <option value="Embroidery Design">Embroidery Design</option>
                                        <option value="Vector Design">Vector Design</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="cd-input-group">
                                <label>File Name</label>
                                <input
                                    type="text"
                                    name="fileName"
                                    value={formData.fileName}
                                    onChange={handleChange}
                                    ref={fileNameInputRef}
                                    placeholder="Enter file name"
                                />
                            </div>

                            {/* Moved Reference Files List */}
                            {refFiles.length > 0 && (
                                <div className="cd-input-group cd-full-width">
                                    <label>Reference Files</label>
                                    <div className="cd-ref-list">
                                        {refFiles.map((rf, idx) => (
                                            <div key={idx} className="cd-ref-item">
                                                <div className="cd-ref-info">
                                                    <span>📄</span>
                                                    <span className="cd-ref-name" title={rf.name}>{rf.name}</span>
                                                    <span className="cd-ref-size">({formatFileSize(rf.size)})</span>
                                                </div>
                                                <button type="button" className="cd-icon-btn delete-btn cd-ref-delete" onClick={() => removeRefFile(idx)}>
                                                    <span>❌</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="cd-input-group">
                                <label>Width</label>
                                <input
                                    type="text"
                                    name="width"
                                    value={formData.width}
                                    onChange={handleChange}
                                    placeholder="e.g. 2.5"
                                />
                            </div>

                            <div className="cd-input-group">
                                <label>Height</label>
                                <input
                                    type="text"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="e.g. 3.0"
                                />
                            </div>

                            <div className="cd-input-group cd-full-width">
                                <label>Colors</label>
                                <input
                                    type="text"
                                    name="colors"
                                    value={formData.colors}
                                    onChange={handleChange}
                                    ref={colorsInputRef}
                                    placeholder="Number of colors (e.g. 7)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {file && (
                    <div className="cd-files-table">
                        <div className="cd-table-header">
                            <div className="cd-col name">File Name</div>
                            <div className="cd-col size">Size</div>
                            <div className="cd-col colors">Colors</div>
                        </div>
                        <div className="cd-table-row">
                            <div className="cd-col name">
                                <span>{formData.fileName || file.name}</span>
                                <button type="button" className="cd-icon-btn edit-btn" onClick={() => focusEdit('fileName')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11 4H4A2 2 0 0 0 2 6V20A2 2 0 0 0 4 22H18A2 2 0 0 0 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="cd-col size">{formatFileSize(file.size)}</div>
                            <div className="cd-col colors">
                                <span>{formData.colors || 'N/A'}</span>
                                <div className="cd-row-actions">
                                    <button type="button" className="cd-icon-btn edit-btn" onClick={() => focusEdit('colors')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11 4H4A2 2 0 0 0 2 6V20A2 2 0 0 0 4 22H18A2 2 0 0 0 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button type="button" className="cd-icon-btn delete-btn" onClick={removeFile}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M19 6V20A2 2 0 0 1 17 22H7A2 2 0 0 1 5 20V6M8 6V4A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="cd-requirement-box">
                    <label>REQUIREMENT</label>
                    <textarea
                        name="requirement"
                        value={formData.requirement}
                        onChange={handleChange}
                        placeholder="Your message / requirements..."
                    ></textarea>
                </div>

                <div className="cd-email-box">
                    <label>Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        required
                    />
                </div>

                <div className="cd-submit-container">
                    <button type="submit" className="cd-submit-btn" disabled={status.type === 'loading'}>
                        {status.type === 'loading' ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomDesignForm;
