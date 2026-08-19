import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, getSalesReps } from '../utils/api.js';

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [reps, setReps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [s, r] = await Promise.all([getSchools(), getSalesReps()]);
      setSchools(s.schools || []);
      setReps(r.sales_reps || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load schools');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Schools</h1>
          <p className="text-sm" style={{ color: '#888' }}>{schools.length} registered</p>
        </div>
        <Link to="/schools/setup" className="btn-primary !w-auto px-5 py-2.5">+ Setup School</Link>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}
      {loading && <p className="text-center py-12" style={{ color: '#888' }}>Loading…</p>}

      {!loading && (
        <div className="card overflow-hidden">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>School ID</th>
                  <th>Name</th>
                  <th>Region</th>
                  <th>Sales Rep</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schools.map(s => {
                  const rep = reps.find(r => r.rep_id === s.sales_rep_id);
                  return (
                    <tr key={s.school_id}>
                      <td className="font-mono text-xs">{s.school_id}</td>
                      <td className="font-medium">{s.school_name}</td>
                      <td>{s.region || '—'}</td>
                      <td>{rep ? rep.full_name : (s.sales_rep_id ? s.sales_rep_id : '—')}</td>
                      <td className="text-xs" style={{ color: '#888' }}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-right">
                        <Link to={`/schools/${s.school_id}`} className="btn-secondary">Open</Link>
                      </td>
                    </tr>
                  );
                })}
                {schools.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-8" style={{ color: '#999' }}>No schools yet. Setup your first school.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}