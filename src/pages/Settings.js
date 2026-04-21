import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(i18n.language);
  const [showLogout, setShowLogout] = useState(false);

  // FIX #15: Language also available in Settings (kept for completeness, primary is TopBar)
  const changeLanguage = (l) => {
    setLang(l);
    i18n.changeLanguage(l);
    localStorage.setItem('lang', l);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>
          {user?.name?.[0]?.toUpperCase() || 'D'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Dr. {user?.name}</div>
          <div style={{ color: '#666', fontSize: 14 }}>+91 {user?.mobile}</div>
        </div>
      </div>

      {/* FIX #15: Language toggle also in settings */}
      <div className="settings-row">
        <span className="settings-label">{t('language')}</span>
        <div className="lang-toggle">
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => changeLanguage('en')}>EN</button>
          <button className={`lang-btn${lang === 'mr' ? ' active' : ''}`} onClick={() => changeLanguage('mr')}>मराठी</button>
        </div>
      </div>

      <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <span className="settings-label">🐄 PashuLedger v2.0</span>
        <span style={{ fontSize: 13, color: '#888' }}>Veterinary Visit Tracker for rural doctors</span>
        <span style={{ fontSize: 12, color: '#aaa' }}>© NSN Technologies Pvt. Ltd., 2026</span>
      </div>

      {!showLogout ? (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-danger" onClick={() => setShowLogout(true)}>{t('logout')}</button>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 8, textAlign: 'center' }}>
          <p style={{ marginBottom: 14, fontWeight: 500 }}>{t('confirmLogout')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" onClick={handleLogout}>{t('yes')}</button>
            <button className="btn btn-outline" onClick={() => setShowLogout(false)}>{t('no')}</button>
          </div>
        </div>
      )}
    </>
  );
}
