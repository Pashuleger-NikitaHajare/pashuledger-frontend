import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API } from '../context/AuthContext';

// FIX #8: Only allow non-negative numbers
const onlyPositiveNum = v => v.replace(/[^0-9.]/g, '');

export default function AddVisit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [farmers, setFarmers] = useState([]);
  const [form, setForm] = useState({
    farmer_id: '', visit_date: today,
    animals_count: 0, treatment: '',
    medicines: '', amount: '', payment_status: 'PENDING', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  useEffect(() => {
    axios.get(`${API}/farmers`).then(r => setFarmers(r.data)).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.farmer_id) e.farmer_id = 'Select a farmer';
    if (!form.treatment.trim()) e.treatment = 'Treatment is required';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) < 0) e.amount = 'Enter valid non-negative amount';
    // FIX #14: Visit date cannot be future
    if (form.visit_date > today) e.visit_date = 'Visit date cannot be in the future';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/visits`, { ...form, amount: parseFloat(form.amount) });
      toast.success('Visit saved!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error saving visit');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="card">
        <div className="form-group">
          <label className="form-label">{t('farmer')} *</label>
          <select className={`form-input${errors.farmer_id ? ' input-error' : ''}`}
            value={form.farmer_id} onChange={e => set('farmer_id', e.target.value)}>
            <option value="">Select farmer...</option>
            {farmers.map(f => <option key={f.id} value={f.id}>{f.name}{f.village ? ` (${f.village})` : ''}</option>)}
          </select>
          {errors.farmer_id && <span className="error-msg">{errors.farmer_id}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('date')} *</label>
          {/* FIX #14: max date = today, no future dates */}
          <input className={`form-input${errors.visit_date ? ' input-error' : ''}`}
            type="date" value={form.visit_date} max={today}
            onChange={e => set('visit_date', e.target.value)} />
          {errors.visit_date && <span className="error-msg">{errors.visit_date}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('animals')}</label>
          <input className="form-input" type="text" inputMode="numeric" value={form.animals_count}
            onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); set('animals_count', v === '' ? 0 : parseInt(v)); }} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('treatment')} *</label>
          <input className={`form-input${errors.treatment ? ' input-error' : ''}`}
            placeholder="e.g. Injection, Deworming, Vaccination"
            value={form.treatment} onChange={e => set('treatment', e.target.value)} />
          {errors.treatment && <span className="error-msg">{errors.treatment}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('medicines')}</label>
          <input className="form-input" placeholder="Medicine names used"
            value={form.medicines} onChange={e => set('medicines', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('amount')} *</label>
          {/* FIX #8: Only non-negative numeric */}
          <input className={`form-input${errors.amount ? ' input-error' : ''}`}
            type="text" inputMode="decimal" placeholder="0"
            value={form.amount} onChange={e => set('amount', onlyPositiveNum(e.target.value))} />
          {errors.amount && <span className="error-msg">{errors.amount}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('paymentStatus')}</label>
          <select className="form-input" value={form.payment_status} onChange={e => set('payment_status', e.target.value)}>
            <option value="PENDING">{t('pending')}</option>
            <option value="PAID">{t('paid')}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('notes')}</label>
          <textarea className="form-input" rows={3} placeholder="Any additional notes..."
            value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        {/* FIX #5: Back / Save navigation */}
        <div className="nav-btns">
          <button className="btn btn-outline btn-sm-nav" onClick={() => navigate('/farmers')}>← {t('back')}</button>
          <button className="btn btn-primary" onClick={save} disabled={loading} style={{ flex: 2 }}>
            {loading ? '...' : t('saveVisit')}
          </button>
          <button className="btn btn-outline btn-sm-nav" onClick={() => navigate('/report')}>{t('next')} →</button>
        </div>
      </div>
    </>
  );
}
