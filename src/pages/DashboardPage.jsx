import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../utils/api.js';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats');
    }
    setLoading(false);
  }

  const cards = stats ? [
    { label: 'Schools', value: stats.schools, to: '/schools' },
    { label: 'Sales Reps', value: stats.sales_reps || 0, to: '/sales-reps' },
    { label: 'Premium parents', value: stats.premium_parents, to: '/revenue' },
    { label: 'subscriptions', value: stats.premium_subscriptions, to: '/revenue' },
    { label: 'Premium revenue (KSh)', value: Number(stats.revenue || 0).toLocaleString(), to: '/revenue' },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm" style={{ color: '#888' }}>Overview of all schools</p>
        </div>
        <Link to="/schools/setup" className="btn-primary !w-auto px-5 py-2.5">+ Setup School</Link>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}

      {loading && <p className="text-center py-12" style={{ color: '#888' }}>Loading…</p>}

{!loading && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {cards.map(c => (
              <Link key={c.label} to={c.to} className="card p-5 hover:shadow-card-hover">
                <div className="text-sm mb-1" style={{ color: '#888' }}>{c.label}</div>
                <div className="text-2xl font-bold" style={{ color: '#7B4F9B' }}>{c.value}</div>
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/schools" className="card p-5 hover:shadow-card-hover">
              <div className="font-semibold mb-2">Manage Schools</div>
              <div className="text-sm" style={{ color: '#777' }}>
                View setup status, classes, fees, and who has paid / not paid for each school.
              </div>
            </Link>
            <Link to="/revenue" className="card p-5 hover:shadow-card-hover">
              <div className="font-semibold mb-2">Premium Revenue</div>
              <div className="text-sm" style={{ color: '#777' }}>
                Premium subscription collections by month and sales rep (school fees are handled by the headteacher and bursar).
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}