import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API } from '../context/AuthContext';

const onlyDigits = v => v.replace(/\D/g, '').slice(0, 10);

// FIX #6: Modal supports both add AND edit
function FarmerModal({ onClose, onSave, dairies, existing, t }) {
  const [form, setForm] = useState(existing
    ? { name: existing.name, phone: existing.phone || '', village: existing.village || '', dairy_id: existing.dairy_id || '' }
    : { name: '', phone: '', village: '', dairy_id: '' }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Farmer name is required';
    if (!form.phone.trim()) e.phone = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be exactly 10 digits';
    if (!form.village.trim()) e.village = 'Location/Village is required';
    if (!form.dairy_id) e.dairy_id = 'Linked Dairy Owner is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let res;
      if (existing) {
        res = await axios.put(`${API}/farmers/${existing.id}`, form);
        toast.success('Farmer updated!');
      } else {
        res = await axios.post(`${API}/farmers`, form);
        toast.success('Farmer added!');
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
          <span className="modal-title">{existing ? t('editFarmer') : t('addFarmer')}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">{t('farmerFullName')} *</label>
          <input className={`form-input${errors.name ? ' input-error' : ''}`} placeholder={t('farmerNamePlaceholder')}
            value={form.name} onChange={e => set('name', e.target.value)} />
          {errors.name && <span className="error-msg">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('farmerPhone')} *</label>
          <input className={`form-input${errors.phone ? ' input-error' : ''}`} placeholder="10-digit number"
            value={form.phone} onChange={e => set('phone', onlyDigits(e.target.value))} type="tel" maxLength={10} />
          {errors.phone && <span className="error-msg">{errors.phone}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('farmerVillage')} *</label>
          <input className={`form-input${errors.village ? ' input-error' : ''}`} placeholder={t('villageTown')} value={form.village} onChange={e => set('village', e.target.value)} />
          {errors.village && <span className="error-msg">{errors.village}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">{t('linkedDairy')} *</label>
          <select className={`form-input${errors.dairy_id ? ' input-error' : ''}`} value={form.dairy_id} onChange={e => set('dairy_id', e.target.value)}>
            <option value="">{t('none')}</option>
            {dairies.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {errors.dairy_id && <span className="error-msg">{errors.dairy_id}</span>}
        </div>
        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ marginBottom: 10 }}>
          {loading ? '...' : existing ? t('updateFarmer') : t('saveFarmer')}
        </button>
        <button className="btn btn-outline" onClick={onClose}>{t('cancel')}</button>
      </div>
    </div>
  );
}

export default function Farmers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [dairies, setDairies] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    axios.get(`${API}/farmers`).then(r => setFarmers(r.data)).catch(() => {});
    axios.get(`${API}/dairies`).then(r => setDairies(r.data)).catch(() => {});
  }, []);

  const filtered = farmers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.village || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this farmer?')) return;
    await axios.delete(`${API}/farmers/${id}`);
    setFarmers(f => f.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  // FIX #6: handle save for add + edit
  const handleSave = (farmer, isEdit) => {
    const dairy = dairies.find(d => d.id === parseInt(farmer.dairy_id));
    if (isEdit) {
      setFarmers(f => f.map(x => x.id === farmer.id ? { ...x, ...farmer, dairy_name: dairy?.name } : x));
    } else {
      setFarmers(f => [...f, { ...farmer, dairy_name: dairy?.name }]);
    }
  };

  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <>
      <input className="search-input" placeholder={t('searchFarmer')} value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">👨‍🌾</span>
          <p className="empty-text">{t('noFarmers')}</p>
        </div>
      )}
      {filtered.map(f => (
        <div className="list-item" key={f.id}>
          <div className="list-avatar">{f.name[0].toUpperCase()}</div>
          <div className="list-info">
            <div className="list-name">{f.name}</div>
            <div className="list-sub">{f.village || ''}{f.dairy_name ? ` · ${f.dairy_name}` : ''}</div>
            {parseFloat(f.pending_amount) > 0 && (
              <div style={{ marginTop: 4 }}>
                <span className="badge badge-pending">Due: {fmt(f.pending_amount)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {f.phone && <div style={{ fontSize: 12, color: '#666' }}>{f.phone}</div>}
            {/* FIX #6: Edit button */}
            <button className="btn-icon" onClick={() => { setEditItem(f); setShowModal(true); }} title="Edit" style={{ fontSize: 16 }}>✏️</button>
            <button className="btn-icon" onClick={() => handleDelete(f.id)} style={{ color: '#A32D2D', fontSize: 16 }}>🗑</button>
          </div>
        </div>
      ))}

      {/* FIX #5: Back/Next navigation */}
      <div className="nav-btns">
        <button className="btn btn-outline btn-sm-nav" onClick={() => navigate('/dairies')}>← {t('back')}</button>
        <button className="btn btn-primary btn-sm-nav" onClick={() => { setEditItem(null); setShowModal(true); }}>
          + {t('addFarmer')}
        </button>
        <button className="btn btn-outline btn-sm-nav" onClick={() => navigate('/visits/add')}>{t('next')} →</button>
      </div>

      {showModal && (
        <FarmerModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
          dairies={dairies}
          existing={editItem}
          t={t}
        />
      )}
    </>
  );
}
