import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './i18n';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Login from './pages/Login';
import Home from './pages/Home';
import Dairies from './pages/Dairies';
import Farmers from './pages/Farmers';
import AddVisit from './pages/AddVisit';
import Report from './pages/Report';
import Settings from './pages/Settings';

const pageTitleKeys = {
  '/': 'home',
  '/dairies': 'dairyOwners',
  '/farmers': 'farmers',
  '/visits/add': 'addVisit',
  '/report': 'reports',
  '/settings': 'settings'
};

// FIX #9: Reactive page title using useLocation hook
function PageTitle() {
  const location = useLocation();
  const { t } = useTranslation();
  useEffect(() => {
    const key = pageTitleKeys[location.pathname];
    document.title = key ? `${t(key)} | PashuLedger` : 'PashuLedger';
  }, [location.pathname, t]);
  return null;
}

// FIX #15: Language toggle moved to TopBar
function TopBar({ user }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const key = pageTitleKeys[location.pathname];
  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };
  return (
    <div className="topbar">
      <span className="topbar-title">{key ? t(key) : 'PashuLedger'}</span>
      <div className="topbar-right">
        <button className="lang-toggle-btn" onClick={toggleLang}>
          {i18n.language === 'en' ? 'मराठी' : 'EN'}
        </button>
        <span className="topbar-user">Dr. {user?.name}</span>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">🐄</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <PageTitle />
      <TopBar user={user} />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dairies" element={<Dairies />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/visits/add" element={<AddVisit />} />
          <Route path="/report" element={<Report />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <BottomNav />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 2500, style: { borderRadius: 10, fontFamily: 'inherit', fontSize: 14 } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
