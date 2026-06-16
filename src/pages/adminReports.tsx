import { useEffect, useState } from 'react'
import {
  collection, getDocs, query, orderBy, doc,
  updateDoc, deleteDoc, addDoc, serverTimestamp, setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiSearchLine, RiLoader4Line, RiAlertLine, RiCheckLine,
  RiCloseLine, RiEyeLine, RiDeleteBin2Line, RiTimeLine, RiAddLine,
} from 'react-icons/ri'

interface Report {
  id: string; eventId: string; eventName: string
  reporterName: string; reporterEmail: string
  reason: string; message: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: any
}

function toDate(val: any): Date {
  if (!val) return new Date(0)
  if (val?.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}
function fmtDate(val: any) {
  if (!val) return 'N/A'
  try { return toDate(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return 'N/A' }
}

const REASON_OPTIONS = [
  'Misleading information', 'Inappropriate content', 'Scam or fraud',
  'Cancelled without notice', 'Safety concern', 'Other',
]

export default function ReportsAdmin() {
  const [reports, setReports] = useState<Report[]>([])
  const [filtered, setFiltered] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detail, setDetail] = useState<Report | null>(null)
  const [actionLoading, setActionLoading] = useState('')
  const [toast, setToast] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [newReport, setNewReport] = useState({ eventName: '', reporterName: '', reporterEmail: '', reason: '', message: '' })

  useEffect(() => { loadReports() }, [])

  async function loadReports() {
    setLoading(true)
    try {
      let snap
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
        snap = await getDocs(q)
      } catch {
        snap = await getDocs(collection(db, 'reports'))
      }
      const list: Report[] = snap.docs.map(d => ({
        id: d.id,
        eventId: d.data().eventId ?? '',
        eventName: d.data().eventName ?? 'Unknown Event',
        reporterName: d.data().reporterName ?? d.data().name ?? 'Anonymous',
        reporterEmail: d.data().reporterEmail ?? d.data().email ?? '',
        reason: d.data().reason ?? '',
        message: d.data().message ?? d.data().description ?? '',
        status: d.data().status ?? 'pending',
        createdAt: d.data().createdAt,
      }))
      setReports(list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let list = [...reports]
    if (search) list = list.filter(r =>
      r.eventName.toLowerCase().includes(search.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.message.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    setFiltered(list)
  }, [reports, search, statusFilter])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function updateStatus(id: string, status: 'resolved' | 'dismissed') {
    setActionLoading(id + status)
    try {
      await updateDoc(doc(db, 'reports', id), { status, resolvedAt: serverTimestamp() })
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      showToast(status === 'resolved' ? 'Report marked as resolved' : 'Report dismissed')
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : null)
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading('') }
  }

  async function deleteReport(id: string) {
    setActionLoading(id + 'del')
    try {
      await deleteDoc(doc(db, 'reports', id))
      setReports(prev => prev.filter(r => r.id !== id))
      showToast('Report deleted')
      if (detail?.id === id) setDetail(null)
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading('') }
  }

  async function addReport() {
    if (!newReport.eventName || !newReport.reason) return
    try {
      const ref = await addDoc(collection(db, 'reports'), {
        ...newReport, status: 'pending', createdAt: serverTimestamp(),
      })
      const r: Report = { id: ref.id, eventId: '', ...newReport, status: 'pending', createdAt: new Date() }
      setReports(prev => [r, ...prev])
      setAddModal(false)
      setNewReport({ eventName: '', reporterName: '', reporterEmail: '', reason: '', message: '' })
      showToast('Report added')
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  const counts = {
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">User-submitted reports about events</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>
          <RiAddLine size={14} /> Add Report
        </button>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Pending', count: counts.pending, color: '#f87171' },
          { label: 'Resolved', count: counts.resolved, color: '#0dc75e' },
          { label: 'Dismissed', count: counts.dismissed, color: 'var(--muted)' },
        ].map(s => (
          <div key={s.label} className="stat-tile" style={{ '--tc': s.color } as React.CSSProperties}>
            <div className="stat-tile-icon"><RiAlertLine /></div>
            <div>
              <div className="stat-tile-val">{s.count}</div>
              <div className="stat-tile-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <RiSearchLine size={14} color="var(--muted2)" />
            <input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state"><RiLoader4Line size={24} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <RiCheckLine size={32} style={{ color: 'var(--green)' }} />
            {reports.length === 0 ? 'No reports filed yet. All clear.' : 'No reports match your filters.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Filed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{r.eventName}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{r.reporterName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.reporterEmail}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted2)' }}>
                        <RiTimeLine size={11} />{fmtDate(r.createdAt)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'pending' ? 'badge-red' : r.status === 'resolved' ? 'badge-green' : 'badge-gray'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost-sm" onClick={() => setDetail(r)} title="View"><RiEyeLine size={12} /></button>
                        {r.status === 'pending' && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}
                              onClick={() => updateStatus(r.id, 'resolved')}
                              disabled={actionLoading === r.id + 'resolved'}>
                              {actionLoading === r.id + 'resolved' ? <RiLoader4Line size={12} style={{ animation: 'spin .8s linear infinite' }} /> : <RiCheckLine size={12} />}
                            </button>
                            <button className="btn btn-ghost-sm" onClick={() => updateStatus(r.id, 'dismissed')}
                              disabled={actionLoading === r.id + 'dismissed'}>
                              <RiCloseLine size={12} />
                            </button>
                          </>
                        )}
                        <button className="btn btn-danger" onClick={() => deleteReport(r.id)}
                          disabled={actionLoading === r.id + 'del'}>
                          <RiDeleteBin2Line size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">Report Detail</span>
              <button className="btn btn-ghost-sm" onClick={() => setDetail(null)}>Close</button>
            </div>
            <div className="modal-body">
              {[
                ['Event', detail.eventName],
                ['Reporter', detail.reporterName],
                ['Email', detail.reporterEmail || 'N/A'],
                ['Reason', detail.reason],
                ['Filed', fmtDate(detail.createdAt)],
                ['Status', detail.status],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: 12, fontSize: 13, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ color: 'var(--muted)', minWidth: 80, fontWeight: 600 }}>{k}</span>
                  <span>{String(v)}</span>
                </div>
              ))}
              {detail.message && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Full Message</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    {detail.message}
                  </div>
                </div>
              )}
            </div>
            {detail.status === 'pending' && (
              <div className="modal-foot">
                <button className="btn btn-primary" onClick={() => updateStatus(detail.id, 'resolved')}>
                  <RiCheckLine size={13} /> Resolve
                </button>
                <button className="btn btn-ghost-sm" onClick={() => updateStatus(detail.id, 'dismissed')}>
                  <RiCloseLine size={13} /> Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Report Modal */}
      {addModal && (
        <div className="modal-backdrop" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">Add Report</span>
              <button className="btn btn-ghost-sm" onClick={() => setAddModal(false)}>Cancel</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input className="form-input" placeholder="Event name" value={newReport.eventName} onChange={e => setNewReport(p => ({ ...p, eventName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Reporter Name</label>
                <input className="form-input" placeholder="Reporter name" value={newReport.reporterName} onChange={e => setNewReport(p => ({ ...p, reporterName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Reporter Email</label>
                <input className="form-input" type="email" placeholder="reporter@email.com" value={newReport.reporterEmail} onChange={e => setNewReport(p => ({ ...p, reporterEmail: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <select className="form-input filter-select" value={newReport.reason} onChange={e => setNewReport(p => ({ ...p, reason: e.target.value }))}>
                  <option value="">Select reason...</option>
                  {REASON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" placeholder="Describe the issue..." value={newReport.message} onChange={e => setNewReport(p => ({ ...p, message: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={addReport}>Add Report</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: 'var(--bg-card)',
          border: '1px solid var(--border-g)', borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, color: 'var(--green)', zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'slideIn .3s ease',
        }}>
          <RiCheckLine size={15} />{toast}
        </div>
      )}
    </>
  )
}