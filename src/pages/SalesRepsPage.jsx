import React, { useEffect, useState } from 'react';
import { getSalesReps, createSalesRep, updateSalesRep, deleteSalesRep, getRevenueBySalesRep } from '../utils/api.js';

const EMPTY = { full_name: '', phone: '', email: '', commission_type: 'percent', commission_value: '' };

export default function SalesRepsPage() {
  const [reps, setReps] = useState([]);
  const [rev, setRev] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [r, v] = await Promise.all([getSalesReps(), getRevenueBySalesRep()]);
      setReps(r.sales_reps || []);
      setRev(v.sales_rep_revenue || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sales reps');
    }
    setLoading(false);
  }

  function set(field) { return (e) => setForm({ ...form, [field]: e.target.value }); }

  function startEdit(rep) {
    setEditing(rep);
    setForm({ full_name: rep.full_name, phone: rep.phone || '', email: rep.email || '', commission_type: rep.commission_type || 'percent', commission_value: rep.commission_value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, commission_value: parseFloat(form.commission_value) || 0 };
      if (editing) await updateSalesRep(editing.rep_id, body);
      else await createSalesRep(body);
      setForm(EMPTY);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save sales rep');
    }
    setSaving(false);
  }

  async function handleDelete(rep) {
    if (confirmDel !== rep.rep_id) { setConfirmDel(rep.rep_id); return; }
    setError('');
    try {
      await deleteSalesRep(rep.rep_id);
      setConfirmDel(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete sales rep');
      setConfirmDel(null);
    }
  }

  function commissionLabel(rep) {
    if (rep.commission_type === 'flat') return `KSh ${Number(rep.commission_value || 0).toLocaleString()}/sub`;
    return `${rep.commission_value || 0}%`;
  }

  function estimatedCommission(rep) {
    const revRow = rev.find(r => r.rep_id === rep.rep_id);
    const revenue = Number(revRow?.revenue || 0);
    const count = Number(revRow?.transactions || 0);
    if (rep.commission_type === 'flat') return (rep.commission_value || 0) * count;
    return revenue * ((rep.commission_value || 0) / 100);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Sales Reps</h1>
      <p className="text-sm mb-6" style={{ color: '#888' }}>Add sales reps and define their commission on premium subscription revenue</p>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card p-5 h-fit">
          <h3 className="font-semibold mb-4">{editing ? `Edit ${editing.full_name}` : 'Add sales rep'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Full name *</label>
              <input required value={form.full_name} onChange={set('full_name')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Phone</label>
              <input value={form.phone} onChange={set('phone')} className="input-field" placeholder="2547..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Commission type</label>
              <select value={form.commission_type} onChange={set('commission_type')} className="input-field">
                <option value="percent">Percent of premium revenue</option>
                <option value="flat">Flat per subscription</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>
                {form.commission_type === 'flat' ? 'Amount per subscription (KSh)' : 'Percentage (%)'}
              </label>
              <input type="number" min="0" step="0.5" value={form.commission_value} onChange={set('commission_value')} className="input-field" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Rep')}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="btn-secondary">Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rep</th>
                  <th>Contact</th>
                  <th>Commission</th>
                  <th>Schools</th>
                  <th>Premium revenue</th>
                  <th>Est. commission</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reps.map(rep => {
                  const revRow = rev.find(r => r.rep_id === rep.rep_id);
                  return (
                    <tr key={rep.rep_id}>
                      <td>
                        <div className="font-medium">{rep.full_name}</div>
                        <div className="text-xs font-mono" style={{ color: '#999' }}>{rep.rep_id}</div>
                      </td>
                      <td className="text-xs">
                        <div>{rep.phone || '—'}</div>
                        <div style={{ color: '#888' }}>{rep.email || '—'}</div>
                      </td>
                      <td><span className="badge" style={{ backgroundColor: '#F4F0F6', color: '#5C3D76' }}>{commissionLabel(rep)}</span></td>
                      <td>{rep.schools_count || 0}</td>
                      <td>KSh {Number(revRow?.revenue || 0).toLocaleString()}</td>
                      <td className="font-medium" style={{ color: '#2E7D32' }}>KSh {Number(estimatedCommission(rep)).toLocaleString()}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(rep)} className="btn-secondary !py-1 !px-2 text-xs">Edit</button>
                          <button onClick={() => handleDelete(rep)} className={confirmDel === rep.rep_id ? 'btn-danger !py-1 !px-2 text-xs' : 'btn-secondary !py-1 !px-2 text-xs'}>
                            {confirmDel === rep.rep_id ? 'Sure?' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reps.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-8" style={{ color: '#999' }}>No sales reps yet. Add your first one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}