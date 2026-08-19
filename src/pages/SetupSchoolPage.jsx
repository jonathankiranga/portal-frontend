import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setupSchool } from '../utils/api.js';

const DEFAULT_CLASSES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

export default function SetupSchoolPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    school_name: '',
    region: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    headteacher_name: '',
    headteacher_phone: '',
    headteacher_email: '',
    academic_year: new Date().getFullYear(),
    premium_payment_model: 'parent',
    class_names: DEFAULT_CLASSES.join(', ')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body = {
        ...form,
        academic_year: parseInt(form.academic_year),
        class_names: form.class_names.split(',').map(s => s.trim()).filter(Boolean)
      };
      const data = await setupSchool(body);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to setup school');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/schools" className="text-sm" style={{ color: '#7B4F9B' }}>← All schools</Link>
      <h1 className="text-xl font-bold mt-1 mb-1">Setup School (Rapid Start)</h1>
      <p className="text-sm mb-6" style={{ color: '#888' }}>
        Creates the school, sales rep, headteacher, classes, learning areas, terms, rubric, and fee structures in one step.
        The headteacher only needs to import students.
      </p>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}

      {result ? (
        <div className="card p-6">
          <div className="mb-4 p-4 rounded-lg text-sm" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
            School created successfully!
          </div>
          <div className="space-y-2 text-sm">
            <div><b>School:</b> {result.school_name} ({result.school_id})</div>
            <div><b>Headteacher ID:</b> {result.headteacher_id}</div>
            <div><b>Headteacher email:</b> {result.headteacher_email || '—'}</div>
            <div><b>Sales rep:</b> {result.sales_rep_id}</div>
            <div><b>Classes:</b> {result.classes.map(c => c.class_name).join(', ')}</div>
            <div className="pt-2 text-sm" style={{ color: '#666' }}>
              The headteacher can now log in via email or phone OTP and import students from the teacher app.
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate(`/schools/${result.school_id}`)} className="btn-primary !w-auto px-6">Open School</button>
            <button onClick={() => { setResult(null); setForm({ ...form, school_name: '', contact_name: '', contact_phone: '', contact_email: '' }); }} className="btn-secondary">
              Setup Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">School</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>School name *</label>
                <input required value={form.school_name} onChange={set('school_name')} className="input-field" placeholder="e.g. Greenfield Academy" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Region</label>
                <input value={form.region} onChange={set('region')} className="input-field" placeholder="e.g. Nairobi" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Academic year</label>
                <input type="number" value={form.academic_year} onChange={set('academic_year')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Contact name</label>
                <input value={form.contact_name} onChange={set('contact_name')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Contact phone</label>
                <input value={form.contact_phone} onChange={set('contact_phone')} className="input-field" placeholder="2547..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Contact email</label>
                <input type="email" value={form.contact_email} onChange={set('contact_email')} className="input-field" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4">Headteacher</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Full name *</label>
                <input required value={form.headteacher_name} onChange={set('headteacher_name')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Phone *</label>
                <input required value={form.headteacher_phone} onChange={set('headteacher_phone')} className="input-field" placeholder="2547..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Email (for OTP login)</label>
                <input type="email" value={form.headteacher_email} onChange={set('headteacher_email')} className="input-field" placeholder="head@school.com" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4">Classes & Premium</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Classes (comma separated)</label>
                <input value={form.class_names} onChange={set('class_names')} className="input-field" />
                <p className="text-xs mt-1" style={{ color: '#999' }}>Learning areas are auto-seeded per class level.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Premium payment model</label>
                <select value={form.premium_payment_model} onChange={set('premium_payment_model')} className="input-field">
                  <option value="parent">Parents pay per child</option>
                  <option value="school">School pays for all parents</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating school…' : 'Create School'}
          </button>
        </form>
      )}
    </div>
  );
}