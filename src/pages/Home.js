import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../context/AuthContext';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ earnings_15d: 0, pending_amount: 0, total_farmers: 0, today_visits: 0 });
  const [recentVisits, setRecentVisits] = useState([]);
  const [setupDone, setSetupDone] = useState({ dairy: false, farmer: false, visit: false });

  useEffect(() => {
    axios.get(`${API}/visits/summary`).then(r => {
      setSummary(r.data);
      setSetupDone(s => ({ ...s, visit: r.data.today_visits > 0, farmer: r.data.total_farmers > 0 }));
    }).catch(() => {});
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    axios.get(`${API}/visits?from=${from}&to=${to}`).then(r => setRecentVisits(r.data.slice(0, 5))).catch(() => {});
    axios.get(`${API}/dairies`).then(r => setSetupDone(s => ({ ...s, dairy: r.data.length > 0 }))).catch(() => {});
  }, []);

  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

  // FIX #4: Step-by-step guided flow
  const steps = [
    { num: 1, label: t('step1'), done: setupDone.dairy, path: '/dairies', icon: '🏭' },
    { num: 2, label: t('step2'), done: setupDone.farmer, path: '/farmers', icon: '👨‍🌾' },
    { num: 3, label: t('step3'), done: setupDone.visit, path: '/visits/add', icon: '🐄' },
    { num: 4, label: t('step4'), done: false, path: '/report', icon: '📊' },
    { num: 5, label: t('step5'), done: false, path: '/report', icon: '💬' }
  ];

  return (
    <>
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">{t('earnings15d')}</div><div className="stat-value green">{fmt(summary.earnings_15d)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('pendingAmount')}</div><div className="stat-value amber">{fmt(summary.pending_amount)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('totalFarmers')}</div><div className="stat-value">{summary.total_farmers}</div></div>
        <div className="stat-card"><div className="stat-label">{t('todayVisits')}</div><div className="stat-value">{summary.today_visits}</div></div>
      </div>

      {/* FIX #4: Guided Steps Banner */}
      <div className="steps-banner">
        <div className="steps-banner-title">📋 {t('gettingStarted')}</div>
        <div className="steps-list">
          {steps.map(step => (
            <div key={step.num} className={`step-item${step.done ? ' step-done' : ''}`} onClick={() => navigate(step.path)}>
              <div className="step-num">{step.done ? '✓' : step.num}</div>
              <div className="step-label">{step.icon} {step.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-header">{t('quickActions')}</div>
      <div className="action-grid">
        <button className="action-card" onClick={() => navigate('/visits/add')}>
          <span className="action-icon">🐄</span>
          <span className="action-title">{t('addVisit')}</span>
          <span className="action-sub">{t('recordNewVisit')}</span>
        </button>
        <button className="action-card" onClick={() => navigate('/dairies')}>
          <span className="action-icon">🏭</span>
          <span className="action-title">{t('dairyOwners')}</span>
          <span className="action-sub">{t('addManage')}</span>
        </button>
        <button className="action-card" onClick={() => navigate('/farmers')}>
          <span className="action-icon">👨‍🌾</span>
          <span className="action-title">{t('farmers')}</span>
          <span className="action-sub">{t('viewAllFarmers')}</span>
        </button>
        <button className="action-card" onClick={() => navigate('/report')}>
          <span className="action-icon">📊</span>
          <span className="action-title">{t('reports')}</span>
          <span className="action-sub">{t('dayReport')}</span>
        </button>
      </div>

      <div className="section-header">{t('recentVisits')}</div>
      {recentVisits.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p className="empty-text">{t('noVisitsYet')}<br />{t('tapToStart')}</p>
        </div>
      ) : (
        recentVisits.map(v => (
          <div className="visit-item" key={v.id}>
            <div className="visit-main">
              <div className="visit-name">{v.farmer_name}</div>
              <div className="visit-detail">{v.dairy_name || '—'} · {v.treatment}</div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge badge-${v.payment_status.toLowerCase()}`}>{v.payment_status}</span>
              </div>
            </div>
            <div className="visit-right">
              <div className="visit-amount">{fmt(v.amount)}</div>
              <div className="visit-date">{new Date(v.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
