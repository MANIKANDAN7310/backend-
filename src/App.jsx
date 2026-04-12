import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './layouts/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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

function App() {
  console.log(">>> [DEBUG] App Component Rendering with /clients route");
  return (
    <AuthProvider>
      <Router>
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
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

