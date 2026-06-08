import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, doc, updateDoc, orderBy, query
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Users, Search, Filter, ChevronDown, X, CheckCircle2,
  Clock, XCircle, Mail, Calendar, ChevronRight,
  Loader2, Eye, Check, AlertCircle, Download
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

const STATUS_META: Record<Status, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   icon: <Clock size={11} />,       label: 'Pending'  },
  approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    icon: <CheckCircle2 size={11} />, label: 'Approved' },
  rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.1)',  icon: <XCircle size={11} />,      label: 'Rejected' },
}

export default function SubmissionsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [selected, setSelected]       = useState<Submission | null>(null)
  const [updating, setUpdating]       = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    const q = query(collection(db, 'events', eventId, 'submissions'), orderBy('submittedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)))
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

  const updateStatus = async (subId: string, status: Status) => {
    if (!eventId) return
    setUpdating(subId)
    try {
      await updateDoc(doc(db, 'events', eventId, 'submissions', subId), { status })
      if (selected?.id === subId) setSelected(prev => prev ? { ...prev, status } : null)
    } finally {
      setUpdating(null)
    }
  }

  // Get primary display name from submission
  const getPrimaryName = (sub: Submission) =>
    sub.groupName || sub.performerName || sub.speakerName || sub.teamName ||
    sub.dramaTitle || sub.ministerName || sub.awardeeName || sub.entryName ||
    sub.email || 'Unknown'

  const getSecondaryInfo = (sub: Submission) =>
    sub.songSearch || sub.actTitle || sub.topic || sub.category ||
    sub.actType || sub.award || sub.details || ''

  const filtered = submissions.filter(s => {
    const name = getPrimaryName(s).toLowerCase()
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

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12,
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
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', padding: '9px 16px', borderRadius: 10,
            cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)',
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }} className="sub-stats">
        {([
          { label: 'Total', value: counts.total,    color: '#fff'     },
          { label: 'Pending',  value: counts.pending,  color: '#F59E0B' },
          { label: 'Approved', value: counts.approved, color: '#22C55E' },
          { label: 'Rejected', value: counts.rejected, color: '#F87171' },
        ] as const).map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }} className="sub-layout">

        {/* Table */}
        <div style={cardStyle}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
              <Search size={13} color="rgba(255,255,255,0.3)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search submissions..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'var(--font-body)' }} />
            </div>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(s => {
              const meta = s !== 'all' ? STATUS_META[s] : null
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid',
                  cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
                  borderColor: statusFilter === s ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
                  background: statusFilter === s ? 'rgba(34,197,94,0.1)' : 'transparent',
                  color: statusFilter === s ? '#22C55E' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.15s', textTransform: 'capitalize',
                }}>
                  {s}
                </button>
              )
            })}
          </div>

          {/* Table head */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 40px', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              {submissions.length === 0 ? 'No submissions yet.' : 'No submissions match your search.'}
            </div>
          ) : filtered.map(sub => {
            const meta = STATUS_META[sub.status] ?? STATUS_META.pending
            const isSelected = selected?.id === sub.id
            const date = sub.submittedAt?.toDate
              ? sub.submittedAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : '—'
            return (
              <div
                key={sub.id}
                onClick={() => setSelected(isSelected ? null : sub)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 40px', gap: 12,
                  padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', transition: 'background 0.1s',
                  background: isSelected ? 'rgba(34,197,94,0.05)' : 'transparent',
                  alignItems: 'center',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getPrimaryName(sub)}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.email || ''}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getSecondaryInfo(sub) || '—'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{date}</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: meta.bg, color: meta.color, padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center' }}>
                  <ChevronRight size={13} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ ...cardStyle, position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={sectionLabel}>Submission Detail</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                {getPrimaryName(selected)}
              </div>
              {selected.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                  <Mail size={12} /> {selected.email}
                </div>
              )}

              {/* All fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {Object.entries(selected)
                  .filter(([k]) => !['id', 'status', 'submittedAt', 'eventId', 'eventType'].includes(k))
                  .map(([key, val]) => (
                    <div key={key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize', marginBottom: 3 }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: 13, color: '#fff' }}>{String(val)}</div>
                    </div>
                  ))
                }
              </div>

              {/* Status actions */}
              <div style={sectionLabel}>Change Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['approved', 'pending', 'rejected'] as Status[]).map(s => {
                  const meta = STATUS_META[s]
                  const isActive = selected.status === s
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={isActive || updating === selected.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                        border: `1px solid ${isActive ? meta.color + '50' : 'rgba(255,255,255,0.08)'}`,
                        background: isActive ? meta.bg : 'transparent',
                        cursor: isActive ? 'default' : 'pointer',
                        transition: 'all 0.15s', width: '100%', textAlign: 'left',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? meta.color : 'rgba(255,255,255,0.55)' }}>
                        {meta.label}
                      </span>
                      {isActive && <Check size={12} color={meta.color} style={{ marginLeft: 'auto' }} />}
                      {updating === selected.id && !isActive && (
                        <Loader2 size={12} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .sub-layout { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .sub-stats { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </DashboardLayout>
  )
}