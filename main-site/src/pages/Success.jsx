import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/api';
import './Success.css';

const Success = () => {
    const { token } = useAuth();
    const location = useLocation();
    const order = location.state?.order;

    const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';
    const DASHBOARD_API = API;

    const notifyDashboard = React.useCallback(async (item) => {
        try {
            const ci = order?.clientInfo || {};
            const email = ci.email || order?.email || "guest@example.com";

            const locationParts = [ci.city, ci.state, ci.country].filter(Boolean);
            const locationStr = locationParts.join(', ') || 'N/A';

            const productId = item?.productId?._id || item?.productId || item?._id;
            const productName = item?.title || item?.productId?.title || 'Product';
            const fileUrl = item?.productId?.file || item?.file || '';

            const res = await fetch(`${DASHBOARD_API}/api/payments/success`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: ci.name || email.split('@')[0],
                    companyName: ci.companyName || 'N/A',
                    location: locationStr,
                    email: email,
                    productId: productId,
                    productName: productName,
                    fileUrl: fileUrl,
                    paymentId: order?.razorpayPaymentId || ('manual_' + Date.now()),
                    amount: item?.price || 0,
                })
            });
            const data = await res.json();
            console.log('✅ Dashboard notified:', data);
        } catch (err) {
            console.error('Dashboard notify failed:', err);
        }
    }, [DASHBOARD_API, order]);

    const trackDownload = React.useCallback(async (productId, item) => {
        if (!productId) return;
        try {
            const id = typeof productId === 'object' ? (productId._id || productId) : productId;
            const ci = order?.clientInfo || {};
            const email = ci.email || order?.email || "guest@example.com";
            const paymentId = order?.razorpayPaymentId || ('manual_' + Date.now());

            await fetch(`${API}/api/products/${id}/download`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ email, paymentId })
            });

            console.log('✅ Download tracked:', id);
        } catch (err) {
            console.error('Failed to track download:', err);
        }
    }, [API, order, token]);

    const downloadFile = React.useCallback(async (fileUrl, fileName, productId, item) => {
        if (!fileUrl) return;

        await notifyDashboard(item);
        await trackDownload(productId, item);

        try {
            const fullUrl = getImageUrl(fileUrl);
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || fileUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error('Download failed:', error);
            const link = document.createElement('a');
            const fullUrl = getImageUrl(fileUrl);
            link.href = fullUrl;
            link.download = fileName || fileUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [API, trackDownload, notifyDashboard]);

    const downloadsTriggered = React.useRef(false);

    React.useEffect(() => {
        if (order && order.items && !downloadsTriggered.current) {
            const itemsWithFiles = order.items.filter(item => {
                const file = item.productId?.file || item.file;
                return !!file;
            });

            if (itemsWithFiles.length > 0) {
                downloadsTriggered.current = true;

                itemsWithFiles.forEach((item, index) => {
                    const fileUrl = item.productId?.file || item.file;
                    const fileName = item.title || item.productId?.title || 'file';
                    const productId = item.productId?._id || item.productId || item._id;

                    setTimeout(() => {
                        downloadFile(fileUrl, fileName, productId, item);
                    }, index * 1000);
                });
            }
        }
    }, [order, downloadFile]);

    return (
        <div className="success-page">
            <header className="header">
                <div className="logo">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="Logo" width="50px" height="40px" />
                        Octoink Studio
                    </Link>
                </div>
            </header>

            <div className="success-container">
                <div className="success-card">
                    {location.state?.type === 'custom' || location.state?.type === 'custom_submission' ? (
                        <>
                            <h1>Your Custom Design Order Submitted</h1>
                            <p>Thank you for your order. The OctoInk Studios team will contact you shortly regarding your design.</p>
                        </>
                    ) : (
                        <>
                            <h1>Payment Successful!</h1>
                            <p>Your files are being downloaded automatically.</p>
                        </>
                    )}

                    <div className="success-actions">
                        <Link to="/store" className="btn-primary">Return to Store</Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Success;