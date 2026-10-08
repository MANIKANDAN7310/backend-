import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import DashboardHome from './pages/DashboardHome';
import Products from './pages/Products';
import UploadProduct from './pages/UploadProduct';
import HeroBanners from './pages/HeroBanners';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import CustomOrders from './pages/CustomOrders';
import ContactMails from './pages/ContactMails';
import ProductAnalytics from './pages/ProductAnalytics';
import Clients from './pages/Clients';
import Invoice from './pages/Invoice';
import EmailTrackMain from './pages/EmailTrack/EmailTrackMain';
import EmailTrackCampaigns from './pages/EmailTrack/EmailTrackCampaigns';
import EmailTrackFollowUp from './pages/EmailTrack/EmailTrackFollowUp';
import EmailTrackB2BClients from './pages/EmailTrack/EmailTrackB2BClients';
import EmailTrackLeads from './pages/EmailTrack/EmailTrackLeads';
import EmailTrackAnalytics from './pages/EmailTrack/EmailTrackAnalytics';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://octoink-backend.onrender.com';

const startKeepAlive = () => {
  setInterval(async () => {
    try {
      await fetch(`${BACKEND_URL}/health`);
    } catch (_) {}
  }, 10 * 60 * 1000);
};

function App() {
  useEffect(() => {
    startKeepAlive();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router basename="/dashboard">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout><Outlet /></Layout>}>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/custom-orders" element={<CustomOrders />} />
                <Route path="/mails" element={<ContactMails />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/analytics/:id" element={<ProductAnalytics />} />
                <Route path="/upload" element={<UploadProduct />} />
                <Route path="/hero-banners" element={<HeroBanners />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/invoice" element={<Invoice />} />

                {/* Email Track Module Routes */}
                <Route path="/email-track" element={<EmailTrackMain />} />
                <Route path="/email-track/campaigns" element={<EmailTrackCampaigns />} />
                <Route path="/email-track/history" element={<EmailTrackCampaigns />} />
                <Route path="/email-track/follow-up" element={<EmailTrackFollowUp />} />
                <Route path="/email-track/b2b-clients" element={<EmailTrackB2BClients />} />
                <Route path="/email-track/leads" element={<EmailTrackLeads />} />
                <Route path="/email-track/analytics" element={<EmailTrackAnalytics />} />

                {/* Redirect old Email Outreach routes */}
                <Route path="/email-outreach*" element={<Navigate to="/email-track" replace />} />

                <Route path="*" element={<Navigate to="/" replace />} />

              </Route>
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
