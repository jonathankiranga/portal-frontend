import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getSchoolDetails, deleteSchool,
  getSchoolMpesa, updateSchoolMpesa,
  addClass, updateClass, deleteClass,
  addLearningArea, updateLearningArea, deleteLearningArea,
  addSubArea, updateSubArea, deleteSubArea,
  addTeacher, updateTeacher, deleteTeacher
} from '../utils/api.js';

function EditableName({ value, onSave, onCancel, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (!editing) {
    return (
      <button onClick={() => { setVal(value); setEditing(true); }} className="hover:underline" style={{ color: 'inherit' }}>
        {value || placeholder}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input autoFocus value={val} onChange={e => setVal(e.target.value)} className="input-field !py-1 !w-40" />
      <button type="button" onClick={() => { onSave(val); setEditing(false); }} className="btn-primary !w-auto !px-2 !py-1 text-xs">Save</button>
      <button type="button" onClick={() => { setEditing(false); onCancel && onCancel(); }} className="btn-secondary !w-auto !px-2 !py-1 text-xs">X</button>
    </span>
  );
}

export default function SchoolDetailPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newAreas, setNewAreas] = useState({});
  const [expandedArea, setExpandedArea] = useState(null);
  const [newSubArea, setNewSubArea] = useState({});
  const [newTeacher, setNewTeacher] = useState({ full_name: '', phone: '', email: '', role: 'teacher' });
  const [editingTeacher, setEditingTeacher] = useState(null);

  // M-Pesa integration state
  const [mpesa, setMpesa] = useState(null);
  const [mpesaForm, setMpesaForm] = useState(null);   // editable copy
  const [revealSecret, setRevealSecret] = useState({ mpesa_consumer_secret: false, mpesa_passkey: false });
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    getSchoolMpesa(schoolId)
      .then(d => { setMpesa(d); setMpesaForm({
        mpesa_environment: d.mpesa_environment || 'sandbox',
        mpesa_paybill: d.mpesa_paybill || '',
        mpesa_consumer_key: d.mpesa_consumer_key || '',
        mpesa_consumer_secret: d.mpesa_consumer_secret || '',
        mpesa_passkey: d.mpesa_passkey || ''
      }); })
      .catch(() => {});
  }, [schoolId]);

  const mpesaDirty = mpesa && mpesaForm && (
    ['mpesa_environment', 'mpesa_paybill', 'mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_passkey']
      .some(f => (mpesaForm[f] || '') !== ((f === 'mpesa_environment' ? (mpesa.mpesa_environment || 'sandbox') : (mpesa[f] || ''))))
  );

  async function saveMpesa() {
    const body = {};
    for (const f of ['mpesa_environment', 'mpesa_paybill', 'mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_passkey']) {
      if ((mpesaForm[f] || '') !== (f === 'mpesa_environment' ? (mpesa.mpesa_environment || 'sandbox') : (mpesa[f] || ''))) body[f] = mpesaForm[f];
    }
    await updateSchoolMpesa(schoolId, body);
    const d = await getSchoolMpesa(schoolId);
    setMpesa(d);
    setMpesaForm({
      mpesa_environment: d.mpesa_environment || 'sandbox',
      mpesa_paybill: d.mpesa_paybill || '',
      mpesa_consumer_key: d.mpesa_consumer_key || '',
      mpesa_consumer_secret: d.mpesa_consumer_secret || '',
      mpesa_passkey: d.mpesa_passkey || ''
    });
  }

  async function copyValue(key, value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(k => (k === key ? '' : k)), 1500);
  }

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

  async function run(fn, successMsg) {
    setError('');
    setFlash('');
    try {
      await fn();
      setFlash(successMsg);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
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

  const { school, classes, learning_areas, sub_learning_areas, teachers, students, payment_summary } = data;
  const levels = [...new Set(learning_areas.map(a => a.level_name))];
  const subsByArea = {};
  (sub_learning_areas || []).forEach(s => { (subsByArea[s.area_id] = subsByArea[s.area_id] || []).push(s); });

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
      {flash && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>{flash}</div>}

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm" style={{ color: '#555' }}>Academic year</label>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field !w-36 !py-2">
          {[2026, 2027, 2025].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Who paid premium */}
      <h2 className="font-semibold mb-1">Parents — who paid premium</h2>
      <p className="text-sm mb-3" style={{ color: '#888' }}>Premium subscription revenue ({year}) — per active parent at this school, not school fees</p>
      <div className="card overflow-hidden mb-8">
        <div className="flex gap-4 px-5 py-3 text-sm" style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #EEE' }}>
          <span style={{ color: '#2E7D32' }}><b>{payment_summary.paid_parents}</b> premium</span>
          <span style={{ color: '#C62828' }}><b>{payment_summary.total_parents - payment_summary.paid_parents}</b> not premium</span>
          <span style={{ color: '#888' }}><b>{payment_summary.total_parents}</b> total</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Phone</th>
                <th>Children</th>
                <th>Premium</th>
                <th>Premium till</th>
              </tr>
            </thead>
            <tbody>
              {payment_summary.parents.map(p => (
                <tr key={p.parent_phone}>
                  <td className="font-medium">{p.parent_name}</td>
                  <td className="font-mono text-xs">{p.parent_phone}</td>
                  <td>{p.child_count}</td>
                  <td>
                    {p.premium
                      ? <span className="badge-paid">Premium {p.paid_terms && p.paid_terms.length ? `· ${p.paid_terms.join(', ')}` : ''}</span>
                      : <span className="badge-unpaid">Not premium {p.amount_due > 0 ? `· KSh ${Number(p.amount_due).toLocaleString()}` : ''}</span>}
                  </td>
                  <td className="text-xs" style={{ color: '#888' }}>
                    {p.premium_expires_at ? new Date(p.premium_expires_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {payment_summary.parents.length === 0 && (
                <tr><td colSpan="5" className="text-center py-6" style={{ color: '#999' }}>No parents linked yet — students must be imported first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* M-Pesa Integration */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">M-Pesa Integration</h3>
          {mpesa && (
            <span className="text-xs px-2 py-1 rounded-full" style={{
              backgroundColor: mpesa.readiness.production_ready ? '#E8F5E9' : mpesa.readiness.complete ? '#FFF8E1' : '#FFEBEE',
              color: mpesa.readiness.production_ready ? '#2E7D32' : mpesa.readiness.complete ? '#B26A00' : '#C62828'
            }}>
              {mpesa.readiness.production_ready ? '● Production ready'
                : mpesa.readiness.complete ? '● Sandbox mode'
                : `● Setup incomplete — missing: ${mpesa.readiness.missing.join(', ')}`}
            </span>
          )}
        </div>
        <p className="text-sm mb-4" style={{ color: '#888' }}>
          Per-school Daraja credentials. Payments for this school are collected to its own paybill using these keys.
        </p>

        {mpesa && mpesaForm ? (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Environment</label>
                <select value={mpesaForm.mpesa_environment} onChange={e => setMpesaForm({ ...mpesaForm, mpesa_environment: e.target.value })} className="input-field">
                  <option value="sandbox">Sandbox (test)</option>
                  <option value="production">Production (live money)</option>
                </select>
                <p className="text-xs mt-1" style={{ color: '#999' }}>Switching to production affects live payment collection.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>Paybill / Shortcode</label>
                <input value={mpesaForm.mpesa_paybill} onChange={e => setMpesaForm({ ...mpesaForm, mpesa_paybill: e.target.value.replace(/[^0-9]/g, '') })} className="input-field font-mono" placeholder="e.g. 123456" />
              </div>
            </div>

            {[
              { key: 'mpesa_consumer_key', label: 'Consumer Key', secret: false },
              { key: 'mpesa_consumer_secret', label: 'Consumer Secret', secret: true },
              { key: 'mpesa_passkey', label: 'Passkey', secret: true }
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: '#555' }}>{f.label}</label>
                <div className="flex gap-2">
                  <input
                    type={f.secret && !revealSecret[f.key] ? 'password' : 'text'}
                    value={mpesaForm[f.key]}
                    onChange={e => setMpesaForm({ ...mpesaForm, [f.key]: e.target.value })}
                    className="input-field font-mono flex-1"
                    autoComplete="off"
                  />
                  {f.secret && (
                    <button type="button" onClick={() => setRevealSecret(s => ({ ...s, [f.key]: !s[f.key] }))} className="btn-secondary !px-3" title={revealSecret[f.key] ? 'Hide' : 'Show'}>
                      {revealSecret[f.key] ? 'Hide' : 'Show'}
                    </button>
                  )}
                  <button type="button" onClick={() => copyValue(f.key, mpesaForm[f.key])} disabled={!mpesaForm[f.key]} className="btn-secondary !px-3" title="Copy">
                    {copiedKey === f.key ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => run(saveMpesa, 'M-Pesa settings saved')}
              disabled={!mpesaDirty}
              className={mpesaDirty ? 'btn-primary' : 'btn-secondary'}
              style={mpesaDirty ? { backgroundColor: '#2E7D32', color: '#fff' } : {}}
            >
              {mpesaDirty ? 'Save changes' : 'Saved'}
            </button>

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid #EEE' }}>
              <h4 className="font-semibold mb-1 text-sm">Callback & notification URLs</h4>
              <p className="text-xs mb-3" style={{ color: '#888' }}>
                Register the public URLs in the Safaricom Daraja portal for this paybill. The secret URLs are used internally by STK push — never share them.
              </p>
              {[
                { group: 'public', title: 'Public — register in Daraja (C2B)', rows: [['validation', 'Validation URL'], ['confirmation', 'Confirmation URL'], ['stk', 'STK Push callback']] },
                { group: 'secret', title: 'Secret — internal STK result callbacks', rows: [['validation', 'Validation (secret)'], ['confirmation', 'Confirmation (secret)'], ['stk', 'STK result (secret)']] }
              ].map(g => (
                <div key={g.group} className="mb-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: g.group === 'secret' ? '#C62828' : '#7B4F9B' }}>{g.title}</div>
                  {g.rows.map(([k, label]) => (
                    <div key={k} className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs w-40 shrink-0" style={{ color: '#888' }}>{label}</span>
                      <code className="text-xs flex-1 truncate px-2 py-1 rounded font-mono" style={{ backgroundColor: '#F5F5F5', color: '#444' }}>{mpesa.urls[g.group][k]}</code>
                      <button type="button" onClick={() => copyValue(`${g.group}.${k}`, mpesa.urls[g.group][k])} className="btn-secondary !px-2 !py-1 text-xs shrink-0">
                        {copiedKey === `${g.group}.${k}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm py-4" style={{ color: '#999' }}>Loading M-Pesa settings…</div>
        )}
      </div>

      {/* Classes CRUD */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Classes ({classes.length})</h3>
          <span className="text-xs" style={{ color: '#999' }}>Click a class name to rename · Delete removes its students & data</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {classes.map(c => (
            <span key={c.class_id} className="inline-flex items-center gap-2 badge-purple !px-3 !py-1.5">
              <EditableName value={c.class_name} onSave={name => name.trim() && run(() => updateClass(c.class_id, { class_name: name.trim() }), 'Class renamed')} />
              <button onClick={() => run(() => deleteClass(c.class_id), 'Class deleted')} className="text-xs font-bold" style={{ color: '#C62828' }} title="Delete class">×</button>
            </span>
          ))}
          {classes.length === 0 && <span style={{ color: '#999' }}>No classes</span>}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (newClassName.trim()) run(() => addClass(schoolId, { class_name: newClassName.trim(), academic_year: year }), 'Class added').then(() => setNewClassName('')); }} className="flex gap-2">
          <input value={newClassName} onChange={e => setNewClassName(e.target.value)} className="input-field !w-56" placeholder="New class e.g. Grade 7" />
          <button type="submit" className="btn-secondary">+ Add class</button>
        </form>
      </div>

      {/* Learning areas CRUD */}
      <h2 className="font-semibold mb-1">Learning areas ({learning_areas.length})</h2>
      <p className="text-sm mb-3" style={{ color: '#888' }}>
        One set per class level (e.g. Grade 4). Add, rename, or delete areas and their sub-areas. Click a name to rename.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {levels.map(level => (
          <div key={level} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold" style={{ color: '#7B4F9B' }}>{level || 'General'}</div>
              <span className="text-xs" style={{ color: '#999' }}>{learning_areas.filter(a => a.level_name === level).length} areas</span>
            </div>
            <div className="space-y-2 mb-3">
              {learning_areas.filter(a => a.level_name === level).map(a => (
                <div key={a.area_id} className="rounded-lg p-2" style={{ backgroundColor: '#F7F4F9' }}>
                  <div className="flex items-center justify-between gap-2">
                    <EditableName
                      value={a.area_name}
                      onSave={name => name.trim() && run(() => updateLearningArea(a.area_id, { area_name: name.trim() }), 'Area renamed')}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExpandedArea(expandedArea === a.area_id ? null : a.area_id)}
                        className="btn-secondary !py-1 !px-2 text-xs"
                      >
                        {expandedArea === a.area_id ? 'Hide sub-areas' : `Sub-areas (${(subsByArea[a.area_id] || []).length})`}
                      </button>
                      <button onClick={() => run(() => deleteLearningArea(a.area_id), 'Area deleted')} className="btn-secondary !py-1 !px-2 text-xs" style={{ color: '#C62828' }}>×</button>
                    </div>
                  </div>
                  {expandedArea === a.area_id && (
                    <div className="mt-2 pl-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(subsByArea[a.area_id] || []).map(s => (
                          <span key={s.sub_area_id} className="inline-flex items-center gap-1 badge" style={{ backgroundColor: '#fff', color: '#555', border: '1px solid #E6E0EB' }}>
                            <EditableName value={s.sub_area_name} onSave={name => name.trim() && run(() => updateSubArea(s.sub_area_id, { sub_area_name: name.trim() }), 'Sub-area renamed')} />
                            <button onClick={() => run(() => deleteSubArea(s.sub_area_id), 'Sub-area deleted')} className="text-xs font-bold" style={{ color: '#C62828' }}>×</button>
                          </span>
                        ))}
                        {!subsByArea[a.area_id]?.length && <span className="text-xs" style={{ color: '#999' }}>No sub-areas yet</span>}
                      </div>
                      <form onSubmit={e => { e.preventDefault(); if ((newSubArea[a.area_id] || '').trim()) run(() => addSubArea({ area_id: a.area_id, sub_area_name: newSubArea[a.area_id].trim() }), 'Sub-area added').then(() => setNewSubArea({ ...newSubArea, [a.area_id]: '' })); }} className="flex gap-2">
                        <input value={newSubArea[a.area_id] || ''} onChange={e => setNewSubArea({ ...newSubArea, [a.area_id]: e.target.value })} className="input-field !py-1 !w-48" placeholder="New sub-area" />
                        <button type="submit" className="btn-secondary !py-1 !px-2 text-xs">+ Add</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); if ((newAreas[level] || '').trim()) run(() => addLearningArea(schoolId, { level_name: level, area_name: newAreas[level].trim() }), 'Area added').then(() => setNewAreas({ ...newAreas, [level]: '' })); }} className="flex gap-2">
              <input value={newAreas[level] || ''} onChange={e => setNewAreas({ ...newAreas, [level]: e.target.value })} className="input-field !py-1.5 !w-56" placeholder={`New area for ${level}`} />
              <button type="submit" className="btn-secondary">+ Add area</button>
            </form>
          </div>
        ))}
        {levels.length === 0 && <p style={{ color: '#999' }}>No learning areas yet — add some above.</p>}
      </div>

      {/* Teachers CRUD */}
      <div className="card p-5 mb-8">
        <h3 className="font-semibold mb-3">Teachers ({teachers.length})</h3>
        <div className="table-wrap mb-4">
          <table className="data-table">
            <thead>
              <tr><th>Teacher</th><th>Phone</th><th>Email</th><th>Role</th><th></th></tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.teacher_id}>
                  <td className="font-medium">
                    {editingTeacher === t.teacher_id ? (
                      <input value={editingTeacher.full_name} onChange={e => setEditingTeacher({ ...editingTeacher, full_name: e.target.value })} className="input-field !py-1" />
                    ) : (
                      <button onClick={() => setEditingTeacher({ teacher_id: t.teacher_id, full_name: t.full_name, phone: t.phone || '', email: t.email || '', role: t.role || 'teacher' })} className="hover:underline">
                        {t.full_name}
                      </button>
                    )}
                  </td>
                  <td>
                    {editingTeacher === t.teacher_id
                      ? <input value={editingTeacher.phone} onChange={e => setEditingTeacher({ ...editingTeacher, phone: e.target.value })} className="input-field !py-1" />
                      : <span className="font-mono text-xs">{t.phone}</span>}
                  </td>
                  <td>
                    {editingTeacher === t.teacher_id
                      ? <input value={editingTeacher.email} onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })} className="input-field !py-1" />
                      : <span className="text-xs">{t.email || '—'}</span>}
                  </td>
                  <td>
                    {editingTeacher === t.teacher_id
                      ? <select value={editingTeacher.role} onChange={e => setEditingTeacher({ ...editingTeacher, role: e.target.value })} className="input-field !py-1">
                          <option value="teacher">teacher</option>
                          <option value="head">head</option>
                        </select>
                      : <span className="badge" style={{ backgroundColor: '#F4F0F6', color: '#5C3D76' }}>{t.role}</span>}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {editingTeacher === t.teacher_id ? (
                      <>
                        <button
                          onClick={() => run(() => updateTeacher(t.teacher_id, { full_name: editingTeacher.full_name, phone: editingTeacher.phone, email: editingTeacher.email, role: editingTeacher.role }), 'Teacher updated').then(() => setEditingTeacher(null))}
                          className="btn-primary !w-auto !px-3 !py-1 text-xs mr-1"
                        >Save</button>
                        <button onClick={() => setEditingTeacher(null)} className="btn-secondary !w-auto !px-3 !py-1 text-xs">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => run(() => deleteTeacher(t.teacher_id), 'Teacher removed')} className="btn-secondary !w-auto !px-3 !py-1 text-xs" style={{ color: '#C62828' }}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && <tr><td colSpan="5" className="text-center py-6" style={{ color: '#999' }}>No teachers yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (newTeacher.full_name && newTeacher.phone) run(() => addTeacher(schoolId, newTeacher), 'Teacher added').then(() => setNewTeacher({ full_name: '', phone: '', email: '', role: 'teacher' }));
          }}
          className="flex flex-wrap gap-2 items-end"
        >
          <div><label className="block text-xs mb-1" style={{ color: '#555' }}>Name</label><input required value={newTeacher.full_name} onChange={e => setNewTeacher({ ...newTeacher, full_name: e.target.value })} className="input-field !py-2 !w-48" /></div>
          <div><label className="block text-xs mb-1" style={{ color: '#555' }}>Phone</label><input required value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} className="input-field !py-2 !w-44" placeholder="2547..." /></div>
          <div><label className="block text-xs mb-1" style={{ color: '#555' }}>Email</label><input value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="input-field !py-2 !w-48" /></div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#555' }}>Role</label>
            <select value={newTeacher.role} onChange={e => setNewTeacher({ ...newTeacher, role: e.target.value })} className="input-field !py-2">
              <option value="teacher">teacher</option>
              <option value="head">head</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary">+ Add teacher</button>
        </form>
      </div>
    </div>
  );
}