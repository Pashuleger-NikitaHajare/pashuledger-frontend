import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API } from '../context/AuthContext';

const onlyDigits = v => v.replace(/\D/g, '').slice(0, 10);

// FIX #6: Modal supports both add AND edit
function DairyModal({ onClose, onSave, existing, t }) {
  const [form, setForm] = useState(existing ? { name: existing.name, phone: existing.phone || '', address: existing.address || '' } : { name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Dairy name is required';
    if (!form.phone.trim()) e.phone = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be exactly 10 digits';
    if (!form.address.trim()) e.address = 'Location/Village is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let res;
      if (existing) {
        res = await axios.put(`${API}/dairies/${existing.id}`, form);
        toast.success('Dairy owner updated!');
      } else {
        res = await axios.post(`${API}/dairies`, form);
        toast.success('Dairy owner added!');
      }
      onSave(res.data, !!existing);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error saving');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{existing ? t('editDairyOwner') : t('addDairyOwner')}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">{t('dairyOwnerName')} *</label>
          <input className={`form-input${errors.name ? ' input-error' : ''}`} placeholder={t('dairyNamePlaceholder')}
            value={form.name} onChange={e => set('name', e.target.value)} />
          {errors.name && <span className="error-msg">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('mobileNumber2')} *</label>
          <input className={`form-input${errors.phone ? ' input-error' : ''}`} placeholder="10-digit number"
            value={form.phone} onChange={e => set('phone', onlyDigits(e.target.value))} type="tel" maxLength={10} />
          {errors.phone && <span className="error-msg">{errors.phone}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('locationVillage')} *</label>
          <input className={`form-input${errors.address ? ' input-error' : ''}`} placeholder={t('villageTown')} value={form.address} onChange={e => set('address', e.target.value)} />
          {errors.address && <span className="error-msg">{errors.address}</span>}
        </div>
        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ marginBottom: 10 }}>
          {loading ? '...' : existing ? t('updateDairyOwner') : t('saveDairyOwner')}
        </button>
        <button className="btn btn-outline" onClick={onClose}>{t('cancel')}</button>
      </div>
    </div>
  );
}

export default function Dairies() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dairies, setDairies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    axios.get(`${API}/dairies`).then(r => setDairies(r.data)).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dairy owner?')) return;
    await axios.delete(`${API}/dairies/${id}`);
    setDairies(d => d.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  // FIX #6: onSave handles both add and edit
  const handleSave = (dairy, isEdit) => {
    if (isEdit) {
      setDairies(d => d.map(x => x.id === dairy.id ? { ...x, ...dairy } : x));
    } else {
      setDairies(d => [...d, { ...dairy, farmer_count: 0 }]);
    }
  };

  return (
    <>
      {dairies.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🏭</span>
          <p className="empty-text">{t('noDairies')}<br />{t('tapBelow')}</p>
        </div>
      )}
      {dairies.map(d => (
        <div className="list-item" key={d.id}>
          <div className="list-avatar">{d.name[0].toUpperCase()}</div>
          <div className="list-info">
            <div className="list-name">{d.name}</div>
            <div className="list-sub">{d.address || ''}{d.phone ? ` · ${d.phone}` : ''}</div>
            <div className="list-sub">{d.farmer_count} {t('farmers').toLowerCase()}</div>
          </div>
          {/* FIX #6: Edit button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <button className="btn-icon" onClick={() => { setEditItem(d); setShowModal(true); }} title="Edit" style={{ fontSize: 16 }}>✏️</button>
            <button className="btn-icon" onClick={() => handleDelete(d.id)} style={{ color: '#A32D2D', fontSize: 16 }}>🗑</button>
          </div>
        </div>
      ))}

      {/* FIX #5: Back/Next navigation */}
      <div className="nav-btns">
        <button className="btn btn-outline btn-sm-nav" onClick={() => navigate(-1)}>← {t('back')}</button>
        <button className="btn btn-primary btn-sm-nav" onClick={() => { setEditItem(null); setShowModal(true); }}>
          {t('addDairyBtn')}
        </button>
        <button className="btn btn-outline btn-sm-nav" onClick={() => navigate('/farmers')}>{t('next')} →</button>
      </div>

      {showModal && (
        <DairyModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
          existing={editItem}
          t={t}
        />
      )}
    </>
  );
}
