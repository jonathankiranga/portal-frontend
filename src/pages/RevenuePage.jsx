import React, { useEffect, useState } from 'react';
import { getRevenue, getRevenueBySalesRep, getPremiumRevenueByRep } from '../utils/api.js';

export default function RevenuePage() {
  const [data, setData] = useState(null);
  const [byRep, setByRep] = useState([]);
  const [premiumRep, setPremiumRep] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [r, rep, prem] = await Promise.all([
        getRevenue(),
        getRevenueBySalesRep(),
        getPremiumRevenueByRep()
      ]);
      setData(r);
      setByRep(rep.sales_rep_revenue || []);
      setPremiumRep(prem.premium_revenue_by_rep || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load revenue');
    }
    setLoading(false);
  }

  if (loading) return <div className="text-center py-16" style={{ color: '#888' }}>Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Premium Revenue</h1>
      <p className="text-sm mb-6" style={{ color: '#888' }}>Premium subscription revenue across schools — school fees are handled by the headteacher and bursar, not here</p>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-sm mb-1" style={{ color: '#888' }}>Premium revenue</div>
            <div className="text-2xl font-bold" style={{ color: '#7B4F9B' }}>KSh {Number(data.totals.amount || 0).toLocaleString()}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm mb-1" style={{ color: '#888' }}>Subscriptions</div>
            <div className="text-2xl font-bold">{data.totals.transactions || 0}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm mb-1" style={{ color: '#888' }}>Premium parents</div>
            <div className="text-2xl font-bold" style={{ color: '#7B4F9B' }}>{data.premiumParents || 0}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm mb-1" style={{ color: '#888' }}>Models</div>
            <div className="text-2xl font-bold">{data.byModel?.length || 0}</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {data?.monthly?.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Monthly subscriptions</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Month</th><th>Amount</th><th>Count</th></tr>
                </thead>
                <tbody>
                  {data.monthly.map(m => (
                    <tr key={m.month}>
                      <td className="font-medium">{m.month}</td>
                      <td>KSh {Number(m.total).toLocaleString()}</td>
                      <td>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data?.byModel?.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold mb-3">By payment model</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Model</th><th>Amount</th><th>Count</th></tr>
                </thead>
                <tbody>
                  {data.byModel.map(m => (
                    <tr key={m.payment_model}>
                      <td className="font-medium">{m.payment_model === 'school' ? 'School pays' : 'Parent pays'}</td>
                      <td>KSh {Number(m.total).toLocaleString()}</td>
                      <td>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {byRep.length > 0 && (
        <div className="card p-5 mb-8">
          <h3 className="font-semibold mb-3">Premium revenue by sales representative</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Rep</th><th>Phone</th><th>Revenue</th><th>Subs</th><th>Schools</th></tr>
              </thead>
              <tbody>
                {byRep.map(r => (
                  <tr key={r.rep_id}>
                    <td className="font-medium">{r.full_name}</td>
                    <td className="font-mono text-xs">{r.phone || '—'}</td>
                    <td>KSh {Number(r.revenue || 0).toLocaleString()}</td>
                    <td>{r.transactions || 0}</td>
                    <td>{r.schools_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {premiumRep.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Premium subscriptions by rep & school</h3>
          <div className="space-y-4">
            {premiumRep.map(r => (
              <div key={r.rep_id}>
                <div className="font-medium mb-1">{r.rep_name}</div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>School</th><th>Revenue</th><th>Transactions</th></tr>
                    </thead>
                    <tbody>
                      {r.schools.map(s => (
                        <tr key={s.school_id}>
                          <td>{s.school_name}</td>
                          <td>KSh {Number(s.revenue).toLocaleString()}</td>
                          <td>{s.transactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}