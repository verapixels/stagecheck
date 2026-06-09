import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Search, X, CheckCircle2, Clock, XCircle, Mail,
  ChevronRight, Loader2, Check, Download, User, Tag,
  CalendarDays, Info,
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

type Status = 'pending' | 'approved' | 'rejected'

interface Submission {
  id: string
  [key: string]: any
  status: Status
  submittedAt?: any
  email?: string
}

const STATUS_META: Record<Status, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: <Clock size={12} />,       label: 'Pending'  },
  approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   icon: <CheckCircle2 size={12} />, label: 'Approved' },
  rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', icon: <XCircle size={12} />,      label: 'Rejected' },
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function SubmissionModal({
  sub,
  onClose,
  onStatusChange,
  updating,
}: {
  sub: Submission
  onClose: () => void
  onStatusChange: (id: string, status: Status) => void
  updating: string | null
}) {
  const getPrimaryName = (s: Submission) =>
    s.groupName || s.performerName || s.speakerName || s.teamName ||
    s.dramaTitle || s.ministerName || s.awardeeName || s.entryName ||
    s.email || 'Unknown'

  const date = sub.submittedAt?.toDate
    ? sub.submittedAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const meta = STATUS_META[sub.status] ?? STATUS_META.pending

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const HIDDEN_KEYS = ['id', 'status', 'submittedAt', 'eventId', 'eventType', 'addedManually', 'createdAt']
  const fields = Object.entries(sub).filter(([k]) => !HIDDEN_KEYS.includes(k))

  return createPortal(
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 4vw, 32px)',
        overflowY: 'auto',
      }}
    >
      <div style={{
        background: '#0F1629',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        animation: 'modalIn 0.18s ease',
      }}>

        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            {/* Status badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: meta.bg, color: meta.color,
              border: `1px solid ${meta.border}`,
              padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              {meta.icon} {meta.label}
            </span>
            <div style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
              fontWeight: 800, color: '#fff',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.2, marginBottom: 6,
            }}>
              {getPrimaryName(sub)}
            </div>
            {sub.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                <Mail size={12} /> {sub.email}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              padding: 7, display: 'flex', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Submission date */}
          {date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              <CalendarDays size={13} /> Submitted {date}
            </div>
          )}

          {/* Fields */}
          {fields.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
                Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {fields.map(([key, val]) => {
                  // Skip arrays/objects that render ugly
                  if (typeof val === 'object' && val !== null) return null
                  return (
                    <div key={key} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10, padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize', marginBottom: 4, letterSpacing: '0.5px' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, wordBreak: 'break-word' }}>
                        {String(val) || '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Status actions */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
              Change Status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['approved', 'pending', 'rejected'] as Status[]).map(s => {
                const m = STATUS_META[s]
                const isActive = sub.status === s
                const isLoading = updating === sub.id && !isActive
                return (
                  <button
                    key={s}
                    onClick={() => !isActive && onStatusChange(sub.id, s)}
                    disabled={isActive || updating === sub.id}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 7,
                      padding: '14px 10px', borderRadius: 12,
                      border: `1px solid ${isActive ? m.color + '60' : 'rgba(255,255,255,0.08)'}`,
                      background: isActive ? m.bg : 'rgba(255,255,255,0.03)',
                      cursor: isActive ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-body)',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isActive && !updating) { e.currentTarget.style.border = `1px solid ${m.color}40`; e.currentTarget.style.background = m.bg } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
                  >
                    {isLoading
                      ? <Loader2 size={16} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite' }} />
                      : <span style={{ color: m.color }}>{m.icon}</span>
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? m.color : 'rgba(255,255,255,0.5)' }}>
                      {m.label}
                    </span>
                    {isActive && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 6, height: 6, borderRadius: '50%', background: m.color,
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubmissionsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules } = useEvent()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [selected, setSelected]       = useState<Submission | null>(null)
  const [updating, setUpdating]       = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(
      collection(db, 'events', eventId, 'submissions'),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission))
        docs.sort((a, b) => (b.submittedAt?.seconds ?? 0) - (a.submittedAt?.seconds ?? 0))
        setSubmissions(docs)
        setLoading(false)
      },
      err => {
        console.error('Firestore error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [eventId])

  const updateStatus = async (subId: string, status: Status) => {
    if (!eventId) return
    setUpdating(subId)
    try {
      await updateDoc(doc(db, 'events', eventId, 'submissions', subId), { status })
      setSelected(prev => prev?.id === subId ? { ...prev, status } : prev)
    } finally {
      setUpdating(null)
    }
  }

  const getPrimaryName = (sub: Submission) =>
    sub.groupName || sub.performerName || sub.speakerName || sub.teamName ||
    sub.dramaTitle || sub.ministerName || sub.awardeeName || sub.entryName ||
    sub.email || 'Unknown'

  const getSecondaryInfo = (sub: Submission) =>
    sub.songSearch || sub.actTitle || sub.topic || sub.category ||
    sub.actType || sub.award || sub.details || ''

  const filtered = submissions.filter(s => {
    const name  = getPrimaryName(s).toLowerCase()
    const email = (s.email ?? '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    total:    submissions.length,
    pending:  submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  return (
    <DashboardLayout
      plan="starter"
      eventType={eventType ?? 'custom'}
      eventId={eventId}
      enabledModules={enabledModules}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff', marginBottom: 4 }}>
            Submissions
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {counts.total} total · {counts.pending} pending review
          </p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)', padding: '9px 16px', borderRadius: 10,
          cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)',
          transition: 'all 0.15s',
        }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }} className="sub-stats">
        {([
          { label: 'Total',    value: counts.total,    color: '#fff'    },
          { label: 'Pending',  value: counts.pending,  color: '#F59E0B' },
          { label: 'Approved', value: counts.approved, color: '#22C55E' },
          { label: 'Rejected', value: counts.rejected, color: '#F87171' },
        ] as const).map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
            <Search size={13} color="rgba(255,255,255,0.3)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search submissions..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'var(--font-body)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid',
                cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
                borderColor: statusFilter === s ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
                background: statusFilter === s ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: statusFilter === s ? '#22C55E' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s', textTransform: 'capitalize', whiteSpace: 'nowrap',
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table — desktop head */}
        <div className="sub-table-head" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 40px', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {['Name', 'Song / Act / Topic', 'Submitted', 'Status', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '32px 20px' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            <Info size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
            <div>{submissions.length === 0 ? 'No submissions yet.' : 'No submissions match your search.'}</div>
          </div>
        ) : filtered.map((sub, i) => {
          const meta = STATUS_META[sub.status] ?? STATUS_META.pending
          const date = sub.submittedAt?.toDate
            ? sub.submittedAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : '—'
          return (
            <div
              key={sub.id}
              onClick={() => setSelected(sub)}
              className="sub-row"
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 40px', gap: 12,
                padding: '13px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'pointer', transition: 'background 0.12s',
                alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getPrimaryName(sub)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.email || ''}
                </div>
              </div>
              {/* Song / Act */}
              <div className="sub-col-hide" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getSecondaryInfo(sub) || '—'}
              </div>
              {/* Date */}
              <div className="sub-col-hide" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{date}</div>
              {/* Status */}
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: meta.bg, color: meta.color, padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              {/* Arrow */}
              <div style={{ color: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center' }}>
                <ChevronRight size={14} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <SubmissionModal
          sub={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
          updating={updating}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @media (max-width: 640px) {
          .sub-stats { grid-template-columns: repeat(2,1fr) !important; }
          .sub-table-head { display: none !important; }
          .sub-col-hide { display: none !important; }
          .sub-row { grid-template-columns: 1fr auto !important; gap: 8px !important; }
        }
        @media (max-width: 480px) {
          .sub-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}