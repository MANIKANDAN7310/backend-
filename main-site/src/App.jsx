import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Quote from './pages/Quote';
import Store from './pages/Store';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import Success from './pages/Success';
import Failure from './pages/Failure';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import { useEffect } from 'react';

function App() {
  // Background wake-up ping for Render free tier
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';
    fetch(API).catch(() => {}); // Fire and forget
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
          <Route path="/quote/:id" element={<Quote />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/success" element={<Success />} />
          <Route path="/failure" element={<Failure />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
