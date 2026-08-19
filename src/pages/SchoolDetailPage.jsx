import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSchoolDetails, deleteSchool } from '../utils/api.js';

const TERM_COLORS = { 'Term 1': '#7B4F9B', 'Term 2': '#1565C0', 'Term 3': '#E65100' };

export default function SchoolDetailPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { load(); }, [schoolId, year]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const d = await getSchoolDetails(schoolId, year);
      setData(d);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load school');
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setError('');
    try {
      await deleteSchool(schoolId);
      navigate('/schools');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete school');
      setConfirmDelete(false);
    }
  }

  if (loading) return <div className="text-center py-16" style={{ color: '#888' }}>Loading…</div>;

  if (!data) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>
      <Link to="/schools" className="btn-secondary mt-4 inline-block">← Back</Link>
    </div>
  );

  const { school, classes, learning_areas, fees, teachers, students, payment_summary } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link to="/schools" className="text-sm" style={{ color: '#7B4F9B' }}>← All schools</Link>
          <h1 className="text-xl font-bold mt-1">{school.school_name}</h1>
          <p className="text-sm" style={{ color: '#888' }}>
            {school.school_id} · {school.region || '—'} · {students} active students · {classes.length} classes · {teachers.length} teachers
          </p>
        </div>
        <button onClick={handleDelete} className={confirmDelete ? 'btn-danger' : 'btn-secondary'} style={confirmDelete ? { backgroundColor: '#C62828', color: '#fff' } : {}}>
          {confirmDelete ? 'Confirm delete?' : 'Delete school'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}

      {/* Year selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm" style={{ color: '#555' }}>Academic year</label>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field !w-36 !py-2">
          {[2026, 2027, 2025].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Payments across terms */}
      <h2 className="font-semibold mb-3">Payments across terms — {year}</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {payment_summary.terms.map(t => {
          const rate = Math.min(100, t.collection_rate || 0);
          return (
            <div key={t.term} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="badge" style={{ backgroundColor: TERM_COLORS[t.term] + '1A', color: TERM_COLORS[t.term] }}>{t.term}</span>
                <span className="text-xs" style={{ color: '#999' }}>{t.transactions} txns</span>
              </div>
              <div className="text-2xl font-bold">KSh {Number(t.paid || 0).toLocaleString()}</div>
              <div className="text-sm" style={{ color: '#888' }}>collected of KSh {Number(t.expected || 0).toLocaleString()}</div>
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EEE' }}>
                <div className="h-full" style={{ width: `${rate}%`, backgroundColor: TERM_COLORS[t.term] }} />
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: t.outstanding > 0 ? '#C62828' : '#2E7D32' }}>
                {t.outstanding > 0 ? `KSh ${Number(t.outstanding).toLocaleString()} outstanding` : 'Fully collected'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Who paid / not paid */}
      <h2 className="font-semibold mb-3">Parents — who has paid / not paid</h2>
      <div className="card overflow-hidden mb-8">
        <div className="flex gap-4 px-5 py-3 text-sm" style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #EEE' }}>
          <span><b>{payment_summary.paid_parents}</b> paid</span>
          <span style={{ color: '#C62828' }}><b>{payment_summary.total_parents - payment_summary.paid_parents}</b> not paid</span>
          <span style={{ color: '#888' }}><b>{payment_summary.total_parents}</b> total</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Phone</th>
                <th>Children</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payment_summary.parents.map(p => (
                <tr key={p.parent_phone}>
                  <td className="font-medium">{p.parent_name}</td>
                  <td className="font-mono text-xs">{p.parent_phone}</td>
                  <td>{p.child_count}</td>
                  <td>
                    {p.paid
                      ? <span className="badge-paid">Paid</span>
                      : <span className="badge-unpaid">Not paid</span>}
                  </td>
                </tr>
              ))}
              {payment_summary.parents.length === 0 && (
                <tr><td colSpan="4" className="text-center py-6" style={{ color: '#999' }}>No parents linked yet — students must be imported first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Fee structures */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Fee structures — {year}</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Term</th><th>Amount</th><th>Optional</th></tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.fee_id}>
                    <td className="font-medium">{f.fee_name}</td>
                    <td><span className="badge" style={{ backgroundColor: TERM_COLORS[f.term] + '1A', color: TERM_COLORS[f.term] }}>{f.term}</span></td>
                    <td>KSh {Number(f.amount).toLocaleString()}</td>
                    <td>{f.is_optional ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {fees.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-6" style={{ color: '#999' }}>No fee structures for this year.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classes */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Classes</h3>
          <div className="flex flex-wrap gap-2">
            {classes.map(c => (
              <span key={c.class_id} className="badge-purple !px-3 !py-1.5">{c.class_name}</span>
            ))}
            {classes.length === 0 && <span style={{ color: '#999' }}>No classes</span>}
          </div>
        </div>

        {/* Learning areas */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Learning areas seeded ({learning_areas.length})</h3>
          <div className="grid md:grid-cols-3 gap-2">
            {[...new Set(learning_areas.map(a => a.level_name))].map(level => (
              <div key={level} className="text-sm">
                <div className="font-medium mb-1" style={{ color: '#7B4F9B' }}>{level}</div>
                <div className="flex flex-wrap gap-1">
                  {learning_areas.filter(a => a.level_name === level).map(a => (
                    <span key={a.area_id} className="badge" style={{ backgroundColor: '#F4F0F6', color: '#5C3D76' }}>{a.area_name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}