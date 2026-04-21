import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API } from '../context/AuthContext';
import axios from 'axios';

// FIX #7: Only allow digits in mobile
const onlyDigits = (val) => val.replace(/\D/g, '').slice(0, 10);

export default function Login() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', mobile: '', password: '' });
  const [loading, setLoading] = useState(false);

  // FIX #2: Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1=enter mobile, 2=enter new password
  const [fpMobile, setFpMobile] = useState('');
  const [fpToken, setFpToken] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // FIX #7: Validate 10-digit mobile
  const validateMobile = (m) => /^\d{10}$/.test(m);

  const handleSubmit = async () => {
    if (!form.mobile || !form.password) { toast.error('Fill all required fields'); return; }
    if (!validateMobile(form.mobile)) { toast.error('Enter valid 10-digit mobile number'); return; }
    if (tab === 'register' && !form.name.trim()) { toast.error('Name is required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.mobile, form.password);
        navigate('/');
      } else {
        // FIX #1: After register → go to LOGIN page, not Home
        await register(form.name, form.mobile, form.password);
        toast.success('Registration successful! Please login.');
        setTab('login');
        setForm(f => ({ ...f, name: '', password: '' }));
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // FIX #2: Forgot password handlers
  const handleForgotSubmit = async () => {
    if (!validateMobile(fpMobile)) { toast.error('Enter valid 10-digit mobile'); return; }
    setFpLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { mobile: fpMobile });
      setFpToken(res.data.resetToken);
      setFpStep(2);
      toast.success('Mobile verified! Enter new password.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Mobile not registered');
    } finally { setFpLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!fpNewPassword || fpNewPassword.length < 6) { toast.error('Password must be at least 6 chars'); return; }
    setFpLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { resetToken: fpToken, newPassword: fpNewPassword });
      toast.success('Password reset! Please login.');
      setShowForgot(false);
      setFpStep(1);
      setFpMobile('');
      setFpToken('');
      setFpNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally { setFpLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <div className="login-logo-icon">🐄</div>
        <div className="login-logo-title">{t('appName')}</div>
        <div className="login-logo-sub">{t('tagline')}</div>
      </div>

      {/* FIX #2: Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForgot(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">🔒 {t('forgotPassword')}</span>
              <button className="modal-close" onClick={() => { setShowForgot(false); setFpStep(1); }}>✕</button>
            </div>
            {fpStep === 1 ? (
              <>
                <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>{t('forgotPasswordHint')}</p>
                <div className="form-group">
                  <label className="form-label">{t('mobileNumber')}</label>
                  <input className="form-input" placeholder="10-digit mobile" type="tel"
                    value={fpMobile} onChange={e => setFpMobile(onlyDigits(e.target.value))} maxLength={10} />
                </div>
                <button className="btn btn-primary" onClick={handleForgotSubmit} disabled={fpLoading}>
                  {fpLoading ? '...' : t('verifyMobile')}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>{t('enterNewPassword')}</p>
                <div className="form-group">
                  <label className="form-label">{t('newPassword')}</label>
                  <input className="form-input" type="password" placeholder="Min 6 characters"
                    value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleResetPassword} disabled={fpLoading}>
                  {fpLoading ? '...' : t('resetPassword')}
                </button>
              </>
            )}
            <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => { setShowForgot(false); setFpStep(1); }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="login-card">
        <div className="tab-switcher">
          <button className={`tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>{t('login')}</button>
          <button className={`tab-btn${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>{t('register')}</button>
        </div>

        {tab === 'register' && (
          <div className="form-group">
            <label className="form-label">{t('fullName')}</label>
            <input className="form-input" placeholder="Dr. Your Name" value={form.name}
              onChange={e => set('name', e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t('mobileNumber')}</label>
          {/* FIX #7: Only allow digits, 10 max */}
          <input className="form-input" placeholder={t('mobilePlaceholder')} type="tel"
            value={form.mobile} maxLength={10}
            onChange={e => set('mobile', onlyDigits(e.target.value))} />
          {form.mobile && form.mobile.length < 10 && (
            <span className="field-hint">{10 - form.mobile.length} more digits needed</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{t('password')}</label>
          <input className="form-input" type="password" placeholder={t('passwordPlaceholder')}
            value={form.password} onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
          style={{ marginTop: 8, borderRadius: 50, fontSize: 16, fontWeight: 700, padding: '14px' }}>
          {loading ? '...' : tab === 'login' ? t('loginBtn') : t('registerBtn')}
        </button>

        {/* FIX #2: Forgot password link */}
        {tab === 'login' && (
          <button className="forgot-link" onClick={() => setShowForgot(true)}>
            {t('forgotPassword')}?
          </button>
        )}
      </div>
    </div>
  );
}
