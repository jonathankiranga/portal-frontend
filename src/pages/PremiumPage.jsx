import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, getSchoolPremium, updateSchoolPremiumSettings, paySchoolPremium } from '../utils/api.js';

export default function PremiumPage() {
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [data, setData] = useState(null);
  const [paymentModel, setPaymentModel] = useState('parent');
  const [feePerTerm, setFeePerTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [payPhone, setPayPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchools()
      .then(s => {
        const list = s.schools || [];
        setSchools(list);
        if (list.length > 0) setSchoolId(list[0].school_id);
        else setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load schools');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  async function load() {
    setLoading(true);
    setError('');
    setFlash('');
    setPayResult('');
    try {
      const d = await getSchoolPremium(schoolId);
      setData(d);
      setPaymentModel(d.settings?.premium_payment_model || 'parent');
      setFeePerTerm(d.settings?.premium_fee_per_term?.toString() || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load premium data');
    }
    setLoading(false);
  }

  const locked = data?.settings?.locked || false;
  const totalStudents = data?.total_students || 0;
  const term = data?.term || '';
  const year = data?.year || new Date().getFullYear();
  const totalFee = (parseFloat(feePerTerm || data?.settings?.premium_fee_per_term || 100)) * totalStudents;
  const dirty = data && (
    paymentModel !== (data.settings?.premium_payment_model || 'parent') ||
    (feePerTerm || '') !== (data.settings?.premium_fee_per_term?.toString() || '')
  );

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await updateSchoolPremiumSettings(schoolId, {
        premium_payment_model: paymentModel,
        premium_fee_per_term: feePerTerm === '' ? null : parseFloat(feePerTerm)
      });
      setFlash('Premium settings saved');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    }
    setSaving(false);
  }

  async function handleUnlock() {
    if (!window.confirm('Unlock the payment model for this school? The model can then be changed.')) return;
    setUnlocking(true);
    setError('');
    try {
      await updateSchoolPremiumSettings(schoolId, { unlock: true });
      setFlash('Payment model unlocked');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unlock');
    }
    setUnlocking(false);
  }

  async function handlePay() {
    if (!payPhone) { setPayResult('Enter the M-Pesa phone number'); return; }
    setPaying(true);
    setPayResult('');
    try {
      const r = await paySchoolPremium(schoolId, payPhone);
      if (r.response_code === '0') {
        setPayResult(`STK push sent to ${payPhone}. Total: KES ${Number(r.amount).toLocaleString()} for ${r.total_students} students. Enter PIN on the phone.`);
      } else {
        setPayResult(r.message || 'Payment initiation failed');
      }
      load();
    } catch (err) {
      setPayResult(err.response?.data?.error || 'Payment failed');
    }
    setPaying(false);
  }

  const schoolName = schools.find(s => s.school_id === schoolId)?.school_name || schoolId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold mb-1">Premium</h1>
          <p className="text-sm" style={{ color: '#888' }}>per-school parent subscription settings, bulk payments and history</p>
        </div>
        <select value={schoolId} onChange={e => setSchoolId(e.target.value)} className="input-field !w-auto !py-2">
          {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name} ({s.school_id})</option>)}
        </select>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}
      {flash && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>{flash}</div>}

      {loading ? (
        <div className="text-center py-16" style={{ color: '#888' }}>Loading…</div>
      ) : !schoolId ? (
        <div className="text-center py-16" style={{ color: '#888' }}>No schools yet.</div>
      ) : (
        <>
          {locked && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFE082' }}>
              <p className="text-sm font-semibold" style={{ color: '#B26A00' }}>Payment model locked</p>
              <p className="text-xs mt-1" style={{ color: '#8D6E00' }}>{data.settings.lock_reason}</p>
              <button onClick={handleUnlock} disabled={unlocking} className="btn-secondary !py-1.5 !px-3 text-xs mt-2">
                {unlocking ? 'Unlocking…' : 'Unlock model change'}
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <div className="card p-5">
              <h3 className="font-semibold mb-3">Payment settings — {schoolName}</h3>
              <label className="block text-xs mb-1" style={{ color: '#555' }}>Who pays for premium?</label>
              <p className="text-xs mb-2" style={{ color: '#999' }}>
                {locked ? 'Locked — unlock above to change the model.' : 'Warning: once set to "School pays", the model locks until the term ends.'}
              </p>
              <div className="flex gap-4 mt-1 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="pm" value="parent" checked={paymentModel === 'parent'}
                    onChange={e => setPaymentModel(e.target.value)} disabled={locked} />
                  Parents pay individually
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="pm" value="school" checked={paymentModel === 'school'}
                    onChange={e => setPaymentModel(e.target.value)} disabled={locked} />
                  School pays bulk
                </label>
              </div>
              <label className="block text-xs mb-1" style={{ color: '#555' }}>Fee per student per term (KES)</label>
              <input type="number" value={feePerTerm} onChange={e => setFeePerTerm(e.target.value)}
                className="input-field !py-2 mb-3" style={{ maxWidth: 200 }} min="0" step="10" />
              <div>
                <button onClick={handleSave} disabled={saving || !dirty} className={dirty ? 'btn-primary !w-auto px-6' : 'btn-secondary !w-auto px-6'}>
                  {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                </button>
              </div>
            </div>

            {paymentModel === 'school' && (
              <div className="card p-5">
                <h3 className="font-semibold mb-3">Bulk payment via M-Pesa</h3>
                <p className="text-xs mb-3" style={{ color: '#888' }}>
                  One payment covers {totalStudents} active students for {term} {year}.
                  Total due: <strong>KES {totalFee.toLocaleString()}</strong>
                </p>
                <label className="block text-xs mb-1" style={{ color: '#555' }}>M-Pesa phone number</label>
                <div className="flex gap-2 items-end">
                  <input type="text" value={payPhone} onChange={e => setPayPhone(e.target.value)}
                    className="input-field !py-2 flex-1" placeholder="254712345678" />
                  <button onClick={handlePay} disabled={paying} className="btn-primary !w-auto px-5">
                    {paying ? 'Sending…' : 'Pay'}
                  </button>
                </div>
                {payResult && (
                  <div className="text-sm mt-3 p-3 rounded" style={{
                    backgroundColor: /fail|error/i.test(payResult) ? '#FFEBEE' : '#E8F5E9',
                    color: /fail|error/i.test(payResult) ? '#C62828' : '#2E7D32'
                  }}>{payResult}</div>
                )}
              </div>
            )}
          </div>

          {(data?.payments?.length > 0) && (
            <div className="card p-5 mb-4">
              <h3 className="font-semibold mb-3">Bulk payment history</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Term</th><th>Amount</th><th>Students</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {data.payments.map(p => (
                      <tr key={p.payment_id}>
                        <td>{p.term} {p.year}</td>
                        <td>KES {Number(p.amount).toLocaleString()}</td>
                        <td>{p.total_students}</td>
                        <td>{p.payment_status}</td>
                        <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold mb-3">Subscriptions — {term} {year}</h3>
            {!(data?.subscriptions?.length > 0) ? (
              <p className="text-sm" style={{ color: '#888' }}>No subscriptions yet for this term.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Parent</th><th>Children</th><th>Paid by</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.subscriptions.map(sub => (
                      <tr key={sub.subscription_id}>
                        <td className="font-mono text-xs">{sub.parent_phone}</td>
                        <td>{sub.children}</td>
                        <td>{sub.payment_model === 'school' ? 'School' : 'Parent'}</td>
                        <td>{sub.payment_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs mt-3" style={{ color: '#999' }}>
              <Link to={`/schools/${schoolId}`} style={{ color: '#7B4F9B' }}>Open {schoolName}</Link> for full school detail.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
