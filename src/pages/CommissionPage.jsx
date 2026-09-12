import React, { useEffect, useState, useCallback } from 'react';
import {
  getSalesReps, getCommissionPayments, requestCommissionPayment,
  approveCommissionPayment, rejectCommissionPayment, markCommissionPaid,
  getCommissionAuditLog, calculateCommission, getAllWallets, getRepWallet,
} from '../utils/api.js';

const SC = {
  pending:  { bg: '#FFF8E1', color: '#F57F17' },
  approved: { bg: '#E8F5E9', color: '#2E7D32' },
  rejected: { bg: '#FFEBEE', color: '#C62828' },
  paid:     { bg: '#E3F2FD', color: '#1565C0' },
  failed:   { bg: '#FCE4EC', color: '#880E4F' },
};

export default function CommissionPage() {
  const [tab, setTab]                   = useState('overview');
  const [reps, setReps]                 = useState([]);
  const [payments, setPayments]         = useState([]);
  const [auditLog, setAuditLog]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [filterRep, setFilterRep]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTerm, setFilterTerm]     = useState('');
  const [filterYear, setFilterYear]     = useState('');
  const [previewRep, setPreviewRep]     = useState('');
  const [previewTerm, setPreviewTerm]   = useState('');
  const [previewYear, setPreviewYear]   = useState('');
  const [preview, setPreview]           = useState(null);
  const [previewing, setPreviewing]     = useState(false);
  const [requesting, setRequesting]     = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [actionModal, setActionModal]   = useState(null);
  const [actionNote, setActionNote]     = useState('');
  const [actionRef, setActionRef]       = useState('');
  const [actioning, setActioning]       = useState(false);
  const [wallets, setWallets]           = useState([]);
  const [walletDetail, setWalletDetail] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [repsData, pmtsData] = await Promise.all([getSalesReps(), getCommissionPayments()]);
      setReps(repsData.sales_reps || []);
      setPayments(pmtsData.payments || []);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'audit')
      getCommissionAuditLog({}).then(d => setAuditLog(d.audit_log || [])).catch(() => {});
    if (tab === 'wallets')
      getAllWallets().then(d => setWallets(d.wallets || [])).catch(() => {});
  }, [tab]);

  async function handlePreview(e) {
    e.preventDefault();
    if (!previewRep || !previewTerm || !previewYear) return;
    setPreviewing(true); setError(''); setPreview(null);
    try {
      const data = await calculateCommission(previewRep, previewTerm, previewYear);
      setPreview(data);
    } catch (err) { setError(err.response?.data?.error || 'Calculation failed'); }
    setPreviewing(false);
  }

  async function handleRequest() {
    if (!preview) return;
    setRequesting(true); setError(''); setSuccess('');
    try {
      await requestCommissionPayment({
        rep_id: preview.rep_id, term: preview.term,
        year: preview.year, request_notes: requestNotes,
      });
      setSuccess('Payment request submitted successfully.');
      setPreview(null); setPreviewRep(''); setPreviewTerm(''); setPreviewYear(''); setRequestNotes('');
      await load(); setTab('payments');
    } catch (err) { setError(err.response?.data?.error || 'Request failed'); }
    setRequesting(false);
  }

  async function handleAction() {
    if (!actionModal) return;
    setActioning(true); setError('');
    try {
      const { type, payment } = actionModal;
      if (type === 'approve')
        await approveCommissionPayment(payment.payment_id, { approved_by: 'admin', payment_reference: actionRef || undefined });
      else if (type === 'reject')
        await rejectCommissionPayment(payment.payment_id, { rejected_by: 'admin', rejection_reason: actionNote || undefined });
      else if (type === 'mark-paid')
        await markCommissionPaid(payment.payment_id, { paid_by: 'admin', payment_reference: actionRef || undefined });
      setActionModal(null); setActionNote(''); setActionRef('');
      await load(); setSuccess('Payment status updated.');
    } catch (err) { setError(err.response?.data?.error || 'Action failed'); }
    setActioning(false);
  }

  const fp = payments.filter(p =>
    (!filterRep    || p.rep_id         === filterRep)    &&
    (!filterStatus || p.payment_status === filterStatus) &&
    (!filterTerm   || p.term           === filterTerm)   &&
    (!filterYear   || String(p.year)   === String(filterYear))
  );
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length;
  const totalPaid    = payments.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.commission_amount), 0);
  const totalPending = payments.filter(p => p.payment_status === 'pending').reduce((s, p) => s + Number(p.commission_amount), 0);

  if (loading) return <div className="text-center py-16" style={{ color: '#888' }}>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Commission Payments</h1>
      <p className="text-sm mb-6" style={{ color: '#888' }}>Manage sales rep commissions based on term revenue collected per school</p>

      {error   && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>{success}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending requests', value: pendingCount,                             color: '#F57F17' },
          { label: 'Pending amount',   value: 'KSh ' + totalPending.toLocaleString(),  color: '#F57F17' },
          { label: 'Total paid out',   value: 'KSh ' + totalPaid.toLocaleString(),     color: '#2E7D32' },
          { label: 'Sales reps',       value: reps.length,                              color: '#5C3D76' },
        ].map((c, i) => (
          <div key={i} className="card p-4">
            <div className="text-xs mb-1" style={{ color: '#888' }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: '#E0E0E0' }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'wallets',  label: 'Wallets' },
          { key: 'request',  label: 'Request Payment' },
          { key: 'payments', label: 'Payments' + (pendingCount ? ' (' + pendingCount + ')' : '') },
          { key: 'audit',    label: 'Audit Log' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setError(''); setSuccess(''); }}
            className="pb-2 px-1 text-sm font-medium border-b-2"
            style={{ borderColor: tab === t.key ? '#7B4F9B' : 'transparent', color: tab === t.key ? '#7B4F9B' : '#666' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card overflow-hidden">
          <div className="p-4 font-semibold border-b" style={{ borderColor: '#F0F0F0' }}>Commission summary by rep</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Rep</th><th>Rate</th><th>Paid requests</th><th>Total paid out</th><th>Pending</th></tr></thead>
              <tbody>
                {reps.map(rep => {
                  const rp   = payments.filter(p => p.rep_id === rep.rep_id);
                  const paid = rp.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.commission_amount), 0);
                  const pend = rp.filter(p => p.payment_status === 'pending').reduce((s, p) => s + Number(p.commission_amount), 0);
                  return (
                    <tr key={rep.rep_id}>
                      <td><div className="font-medium">{rep.full_name}</div><div className="text-xs font-mono" style={{ color: '#999' }}>{rep.rep_id}</div></td>
                      <td><span className="badge" style={{ backgroundColor: '#F4F0F6', color: '#5C3D76' }}>{rep.commission_type === 'flat' ? 'KSh ' + Number(rep.commission_value).toLocaleString() + '/sub' : rep.commission_value + '%'}</span></td>
                      <td>{rp.filter(p => p.payment_status === 'paid').length}</td>
                      <td className="font-medium" style={{ color: '#2E7D32' }}>KSh {paid.toLocaleString()}</td>
                      <td style={{ color: '#F57F17' }}>{pend > 0 ? 'KSh ' + pend.toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
                {reps.length === 0 && <tr><td colSpan="5" className="text-center py-8" style={{ color: '#999' }}>No sales reps found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'request' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Calculate and request commission payment</h3>
            <form onSubmit={handlePreview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Sales rep *</label>
                <select required value={previewRep} onChange={e => setPreviewRep(e.target.value)} className="input-field">
                  <option value="">Select rep...</option>
                  {reps.map(r => <option key={r.rep_id} value={r.rep_id}>{r.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Term *</label>
                <select required value={previewTerm} onChange={e => setPreviewTerm(e.target.value)} className="input-field">
                  <option value="">Select term...</option>
                  {['Term 1', 'Term 2', 'Term 3'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Year *</label>
                <select required value={previewYear} onChange={e => setPreviewYear(e.target.value)} className="input-field">
                  <option value="">Select year...</option>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button type="submit" disabled={previewing} className="btn-primary">{previewing ? 'Calculating...' : 'Calculate commission'}</button>
            </form>
          </div>
          {preview && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3">{preview.term} {preview.year} - {reps.find(r => r.rep_id === preview.rep_id)?.full_name}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F4F0F6' }}>
                  <div className="text-xs mb-1" style={{ color: '#888' }}>Revenue collected this term</div>
                  <div className="font-bold">KSh {Number(preview.revenue_base).toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
                  <div className="text-xs mb-1" style={{ color: '#888' }}>Commission due</div>
                  <div className="font-bold" style={{ color: '#2E7D32' }}>KSh {Number(preview.commission_amount).toLocaleString()}</div>
                </div>
              </div>
              {preview.breakdown?.length > 0 && (
                <div className="mb-4 table-wrap">
                  <table className="data-table">
                    <thead><tr><th>School</th><th>Revenue</th><th>Commission</th></tr></thead>
                    <tbody>
                      {preview.breakdown.map(b => (
                        <tr key={b.school_id}>
                          <td className="text-sm">{b.school_name}</td>
                          <td className="text-sm">KSh {Number(b.revenue).toLocaleString()}</td>
                          <td className="text-sm font-medium" style={{ color: '#2E7D32' }}>KSh {Number(b.commission).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Notes (optional)</label>
                <textarea value={requestNotes} onChange={e => setRequestNotes(e.target.value)} className="input-field" rows={2} placeholder="Any notes..." />
              </div>
              <button onClick={handleRequest} disabled={requesting || preview.commission_amount <= 0} className="btn-primary w-full">
                {requesting ? 'Submitting...' : 'Submit request - KSh ' + Number(preview.commission_amount).toLocaleString()}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          <div className="card p-4 mb-4 flex flex-wrap gap-3">
            <select value={filterRep} onChange={e => setFilterRep(e.target.value)} className="input-field !w-44"><option value="">All reps</option>{reps.map(r => <option key={r.rep_id} value={r.rep_id}>{r.full_name}</option>)}</select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field !w-36"><option value="">All statuses</option>{['pending','approved','rejected','paid','failed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="input-field !w-32"><option value="">All terms</option>{['Term 1','Term 2','Term 3'].map(t => <option key={t} value={t}>{t}</option>)}</select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="input-field !w-28"><option value="">All years</option>{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <div className="card overflow-hidden"><div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Rep</th><th>Term</th><th>Revenue base</th><th>Commission</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead>
              <tbody>
                {fp.map(p => {
                  const sc = SC[p.payment_status] || SC.pending;
                  return (
                    <tr key={p.payment_id}>
                      <td><div className="font-medium">{p.rep_name}</div><div className="text-xs" style={{ color: '#999' }}>{p.rep_phone || p.rep_email || ''}</div></td>
                      <td>{p.term} {p.year}</td>
                      <td>KSh {Number(p.revenue_base).toLocaleString()}</td>
                      <td className="font-medium" style={{ color: '#2E7D32' }}>KSh {Number(p.commission_amount).toLocaleString()}</td>
                      <td><span className="badge text-xs" style={{ backgroundColor: sc.bg, color: sc.color }}>{p.payment_status}</span></td>
                      <td className="text-xs" style={{ color: '#888' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
                      <td><div className="flex gap-1">
                        {p.payment_status === 'pending' && <>
                          <button onClick={() => setActionModal({ type: 'approve',   payment: p })} className="btn-primary !py-1 !px-2 text-xs">Approve</button>
                          <button onClick={() => setActionModal({ type: 'reject',    payment: p })} className="btn-danger  !py-1 !px-2 text-xs">Reject</button>
                        </>}
                        {p.payment_status === 'approved' && <button onClick={() => setActionModal({ type: 'mark-paid', payment: p })} className="btn-primary !py-1 !px-2 text-xs">Mark paid</button>}
                      </div></td>
                    </tr>
                  );
                })}
                {fp.length === 0 && <tr><td colSpan="7" className="text-center py-8" style={{ color: '#999' }}>No payment requests found.</td></tr>}
              </tbody>
            </table>
          </div></div>
        </div>
      )}

      {tab === 'wallets' && (
        <div>
          {walletDetail ? (
            <div>
              <button onClick={() => setWalletDetail(null)} className="btn-secondary mb-4">← Back to all wallets</button>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Balance',        value: 'KSh ' + Number(walletDetail.balance).toLocaleString(),         color: '#7B4F9B' },
                  { label: 'Total credited', value: 'KSh ' + Number(walletDetail.total_credited).toLocaleString(),  color: '#2E7D32' },
                  { label: 'Total withdrawn',value: 'KSh ' + Number(walletDetail.total_withdrawn).toLocaleString(), color: '#1565C0' },
                ].map((c, i) => (
                  <div key={i} className="card p-4">
                    <div className="text-xs mb-1" style={{ color: '#888' }}>{c.label}</div>
                    <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div className="card overflow-hidden mb-4">
                <div className="p-4 font-semibold border-b" style={{ borderColor: '#F0F0F0' }}>Transaction history</div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Balance after</th></tr></thead>
                    <tbody>
                      {walletDetail.transactions?.map(t => (
                        <tr key={t.txn_id}>
                          <td className="text-xs" style={{ color: '#888' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                          <td className="text-sm">{t.description}</td>
                          <td><span className="badge text-xs" style={{ backgroundColor: t.txn_type === 'credit' ? '#E8F5E9' : '#FFF8E1', color: t.txn_type === 'credit' ? '#2E7D32' : '#F57F17' }}>{t.txn_type}</span></td>
                          <td className="font-medium" style={{ color: t.txn_type === 'credit' ? '#2E7D32' : '#C62828' }}>{t.txn_type === 'credit' ? '+' : '-'}KSh {Number(t.amount).toLocaleString()}</td>
                          <td>KSh {Number(t.balance_after).toLocaleString()}</td>
                        </tr>
                      ))}
                      {walletDetail.transactions?.length === 0 && <tr><td colSpan="5" className="text-center py-8" style={{ color: '#999' }}>No transactions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="p-4 font-semibold border-b" style={{ borderColor: '#F0F0F0' }}>Withdrawal history</div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Amount</th><th>M-Pesa phone</th><th>Reference</th><th>Status</th></tr></thead>
                    <tbody>
                      {walletDetail.withdrawals?.map(w => {
                        const sc = { pending: { bg:'#FFF8E1',color:'#F57F17' }, processing:{ bg:'#E8EAF6',color:'#283593' }, completed:{ bg:'#E3F2FD',color:'#1565C0' }, failed:{ bg:'#FCE4EC',color:'#880E4F' } };
                        const s = sc[w.status] || sc.pending;
                        return (
                          <tr key={w.withdrawal_id}>
                            <td className="text-xs" style={{ color:'#888' }}>{new Date(w.requested_at).toLocaleDateString()}</td>
                            <td className="font-medium">KSh {Number(w.amount).toLocaleString()}</td>
                            <td className="text-sm">{w.mpesa_phone}</td>
                            <td className="text-xs font-mono">{w.mpesa_reference || '-'}</td>
                            <td><span className="badge text-xs" style={{ backgroundColor:s.bg, color:s.color }}>{w.status}</span></td>
                          </tr>
                        );
                      })}
                      {walletDetail.withdrawals?.length === 0 && <tr><td colSpan="5" className="text-center py-8" style={{ color:'#999' }}>No withdrawals yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Rep</th><th>Balance</th><th>Total Earned</th><th>Total Withdrawn</th><th></th></tr></thead>
                  <tbody>
                    {wallets.map(w => (
                      <tr key={w.rep_id}>
                        <td><div className="font-medium">{w.full_name}</div><div className="text-xs" style={{ color:'#999' }}>{w.phone || w.rep_id}</div></td>
                        <td className="font-bold" style={{ color: Number(w.balance) > 0 ? '#7B4F9B' : '#999' }}>KSh {Number(w.balance).toLocaleString()}</td>
                        <td style={{ color: '#2E7D32' }}>KSh {Number(w.total_credited).toLocaleString()}</td>
                        <td style={{ color: '#1565C0' }}>KSh {Number(w.total_withdrawn).toLocaleString()}</td>
                        <td>
                          <button className="btn-secondary !py-1 !px-3 text-xs" onClick={async () => {
                            setLoadingWallet(true);
                            try { const d = await getRepWallet(w.rep_id); setWalletDetail(d); } catch {}
                            setLoadingWallet(false);
                          }}>
                            {loadingWallet ? '...' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {wallets.length === 0 && <tr><td colSpan="5" className="text-center py-8" style={{ color:'#999' }}>No wallets found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="card overflow-hidden"><div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Action</th><th>Rep</th><th>Term</th><th>By</th><th>Date</th></tr></thead>
            <tbody>
              {auditLog.map(log => (
                <tr key={log.log_id}>
                  <td><span className="badge text-xs" style={{ backgroundColor: '#F4F0F6', color: '#5C3D76' }}>{log.action_type}</span></td>
                  <td className="text-sm">{log.rep_id}</td>
                  <td className="text-sm">{log.term} {log.year}</td>
                  <td className="text-sm">{log.performed_by || '-'}</td>
                  <td className="text-xs" style={{ color: '#888' }}>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {auditLog.length === 0 && <tr><td colSpan="5" className="text-center py-8" style={{ color: '#999' }}>No audit entries yet.</td></tr>}
            </tbody>
          </table>
        </div></div>
      )}

      {actionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold mb-1 capitalize">{actionModal.type === 'mark-paid' ? 'Mark as paid' : actionModal.type}</h3>
            <p className="text-sm mb-4" style={{ color: '#666' }}>
              {actionModal.payment.rep_name} - {actionModal.payment.term} {actionModal.payment.year} - <strong>KSh {Number(actionModal.payment.commission_amount).toLocaleString()}</strong>
            </p>
            {(actionModal.type === 'approve' || actionModal.type === 'mark-paid') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Payment reference (optional)</label>
                <input value={actionRef} onChange={e => setActionRef(e.target.value)} className="input-field" placeholder="e.g. MPESA ref..." />
              </div>
            )}
            {actionModal.type === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Rejection reason (optional)</label>
                <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} className="input-field" rows={2} />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleAction} disabled={actioning} className={actionModal.type === 'reject' ? 'btn-danger' : 'btn-primary'}>{actioning ? 'Processing...' : 'Confirm'}</button>
              <button onClick={() => { setActionModal(null); setActionNote(''); setActionRef(''); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}