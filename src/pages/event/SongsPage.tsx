import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Music2, Mic2, Presentation, Search, Loader2, AlertTriangle,
  Link2, UserPlus, X, Check, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, FolderOpen, Play,
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'
import SubmissionFormModal from './SubmissionFormModal'

interface SongEntry {
  title: string
  performer: string
  email: string
  submissionId: string
  category?: string
  status: string
  songs?: any[]
  minutesAllocated?: number
}

export default function SongsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules } = useEvent()
  const [entries, setEntries]               = useState<SongEntry[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [filter, setFilter]                 = useState('all')
  const [showFormModal, setShowFormModal]   = useState(false)
  const [showAddManual, setShowAddManual]   = useState(false)
  const [eventMeta, setEventMeta]           = useState<any>(null)
  const [submissionConfig, setSubmissionConfig] = useState<any>(null)
  const [copySuccess, setCopySuccess]       = useState(false)
  const [expandedRows, setExpandedRows]     = useState<Set<string>>(new Set())
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Manual add state
  const [manualName, setManualName]     = useState('')
  const [manualEmail, setManualEmail]   = useState('')
  const [manualChoir, setManualChoir]   = useState('')
  const [manualSong, setManualSong]     = useState('')
  const [addingManual, setAddingManual] = useState(false)

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const mapped: SongEntry[] = docs.map((d: any) => ({
        submissionId: d.id,
        title:     d.songSearch || d.actTitle || d.topic || d.actType || d.dramaTitle || d.award || d.details || '—',
        performer: d.groupName || d.performerName || d.speakerName || d.teamName || d.ministerName || d.awardeeName || d.entryName || d.email || 'Unknown',
        email:     d.email || '',
        category:  d.category || d.actType || '',
        status:    d.status || 'pending',
        songs:     d.songs || [],
        minutesAllocated: d.minutesAllocated,
      })).filter(e => e.title !== '—')
      setEntries(mapped)
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) setEventMeta({ id: snap.id, ...snap.data() })
    })
    const unsub = onSnapshot(doc(db, 'events', eventId, 'config', 'submissionForm'), snap => {
      if (snap.exists()) setSubmissionConfig(snap.data())
    })
    return () => unsub()
  }, [eventId])

  const { pageTitle, itemLabel, icon } = getPageMeta(eventType ?? 'custom')
  const buttonLabel = getButtonLabel(eventType ?? 'custom')

  const categories = [...new Set(entries.map(e => e.category).filter(Boolean))]
  const filtered = entries.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.performer.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || e.category === filter || e.status === filter
    return matchSearch && matchFilter
  })

  const titleCounts: Record<string, number> = {}
  entries.forEach(e => { titleCounts[e.title.toLowerCase()] = (titleCounts[e.title.toLowerCase()] || 0) + 1 })

  const getSubmissionLink = () => {
    const base = window.location.hostname === 'localhost'
      ? `http://localhost:${window.location.port}`
      : 'https://stagecheck-699c7.web.app'
    const slug = eventMeta?.name
      ? eventMeta.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : eventId
    return `${base}/submit/${slug}/${eventId}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getSubmissionLink())
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

 const handleStatus = async (
  submissionId: string,
  newStatus: 'approved' | 'rejected' | 'pending'
) => {
  if (!eventId) return
  setUpdatingStatus(submissionId)
  try {
    await updateDoc(doc(db, 'events', eventId, 'submissions', submissionId), { status: newStatus })

    // ── fire approval / rejection email ────────────────────────────────────
    if (newStatus === 'approved' || newStatus === 'rejected') {
      const entry = entries.find(e => e.submissionId === submissionId)
      if (entry?.email) {
        const BASE = window.location.hostname === 'localhost'
          ? `http://localhost:5001/stagecheck-699c7/us-central1`
          : 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

        fetch(`${BASE}/sendSubmissionEmails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: newStatus,
            eventId,
            eventName: eventMeta?.name || '',
            performerName: entry.performer,
            performerEmail: entry.email,
            organizerEmail: submissionConfig?.contactEmail || undefined,
            songs: entry.songs || [],
          }),
        }).catch(() => {})
      }
    }
  } catch (e) { console.error(e) }
  setUpdatingStatus(null)
}

  const handleAddManual = async () => {
    if (!manualName.trim() || !eventId) return
    setAddingManual(true)
    try {
      await addDoc(collection(db, 'events', eventId, 'submissions'), {
        groupName: manualChoir || manualName,
        performerName: manualName,
        email: manualEmail,
        songSearch: manualSong || '(Manual entry)',
        status: 'pending',
        addedManually: true,
        createdAt: serverTimestamp(),
      })
      setManualName(''); setManualEmail(''); setManualChoir(''); setManualSong('')
      setShowAddManual(false)
    } catch (e) { console.error(e) }
    setAddingManual(false)
  }

  return (
    <DashboardLayout plan="starter" eventType={eventType ?? 'custom'} eventId={eventId} enabledModules={enabledModules}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ color: '#22C55E' }}>{icon}</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              {pageTitle}
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {entries.length} {itemLabel}{entries.length !== 1 ? 's' : ''} submitted
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddManual(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 500 }}>
            <UserPlus size={14} /> Add Manually
          </button>
          {submissionConfig && (
            <button onClick={handleCopyLink}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#22C55E', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 500 }}>
              {copySuccess ? <><Check size={14} /> Copied!</> : <><Link2 size={14} /> Copy Link</>}
            </button>
          )}
          <button onClick={() => setShowFormModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
            <Link2 size={14} /> {buttonLabel}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label={`Total ${itemLabel}s`} value={entries.length} color="#fff" />
        <StatCard label="Clashes" value={Object.values(titleCounts).filter(v => v > 1).length} color="#F87171" />
        <StatCard label="Approved" value={entries.filter(e => e.status === 'approved').length} color="#22C55E" />
      </div>

      {/* Link bar */}
      {submissionConfig && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, flexWrap: 'wrap' }}>
          <Link2 size={13} color="#22C55E" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getSubmissionLink()}
          </span>
          <button onClick={handleCopyLink} style={{ fontSize: 11, color: '#22C55E', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 14px' }}>
          <Search size={13} color="rgba(255,255,255,0.3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${itemLabel}s...`}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', padding: '9px 14px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '32px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          No {itemLabel}s found.
        </div>
      ) : (
        <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1.4fr 1fr 120px', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['', itemLabel, 'Performer / Group', 'Status', 'Actions'].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</div>
            ))}
          </div>

          {filtered.map((entry, i) => {
            const isClash    = titleCounts[entry.title.toLowerCase()] > 1
            const isExpanded = expandedRows.has(entry.submissionId)
            const hasSongs   = entry.songs && entry.songs.length > 0
            const isUpdating = updatingStatus === entry.submissionId

            return (
              <div key={entry.submissionId} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isClash ? 'rgba(248,113,113,0.03)' : 'transparent' }}>

                {/* Main row */}
                <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1.4fr 1fr 120px', gap: 12, padding: '12px 16px', alignItems: 'center' }}>

                  {/* Expand toggle */}
                  <button
                    onClick={() => hasSongs && toggleExpand(entry.submissionId)}
                    style={{ background: 'none', border: 'none', cursor: hasSongs ? 'pointer' : 'default', color: hasSongs ? 'rgba(255,255,255,0.4)' : 'transparent', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {hasSongs ? (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}
                  </button>

                  {/* Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: isClash ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isClash ? <AlertTriangle size={12} color="#F87171" /> : <Music2 size={12} color="#22C55E" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isClash ? '#F87171' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
                      {entry.songs && entry.songs.length > 1 && (
                        <div style={{ fontSize: 11, color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }} onClick={() => toggleExpand(entry.submissionId)}>
                          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          {isExpanded ? 'Hide songs' : `+${entry.songs.length - 1} more song${entry.songs.length > 2 ? 's' : ''}`}
                        </div>
                      )}
                      {isClash && (
                        <div style={{ fontSize: 10, color: '#F87171', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <AlertTriangle size={9} /> Clash detected
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performer */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.performer}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.email}</div>
                  </div>

                  {/* Status pill */}
                  <StatusPill status={entry.status} />

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {isUpdating ? (
                      <Loader2 size={14} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        {entry.status !== 'approved' && (
                          <button
                            onClick={() => handleStatus(entry.submissionId, 'approved')}
                            title="Approve"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(34,197,94,0.12)', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <CheckCircle size={14} color="#22C55E" />
                          </button>
                        )}
                        {entry.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatus(entry.submissionId, 'rejected')}
                            title="Reject"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(248,113,113,0.12)', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <XCircle size={14} color="#F87171" />
                          </button>
                        )}
                        {entry.status !== 'pending' && (
                          <button
                            onClick={() => handleStatus(entry.submissionId, 'pending')}
                            title="Reset to pending"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(245,158,11,0.12)', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Clock size={14} color="#F59E0B" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded songs list */}
                {isExpanded && hasSongs && (
                  <div style={{ padding: '0 16px 14px 60px', display: 'grid', gap: 6 }}>
                    {entry.songs!.map((s: any, si: number) => {
                      const isOriginal = s.source === 'original'
                      return (
                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                          {s.thumbnail && <img src={s.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.artist || s.singerName || '—'}</div>
                          </div>
                          {/* Source badge — icon only, no emoji */}
                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                            {isOriginal
                              ? <><FolderOpen size={11} color="rgba(255,255,255,0.35)" /> Original</>
                              : <><Play size={11} color="#F87171" /> YouTube</>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Manual Add Modal — portal */}
      {showAddManual && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Add Participant</h3>
              <button onClick={() => setShowAddManual(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
            </div>
            {[
              { label: 'Full Name *', value: manualName, set: setManualName, placeholder: 'e.g. John Doe' },
              { label: 'Choir / Group Name', value: manualChoir, set: setManualChoir, placeholder: 'e.g. Grace Choir' },
              { label: 'Email', value: manualEmail, set: setManualEmail, placeholder: 'e.g. john@example.com' },
              { label: 'Song / Act Title', value: manualSong, set: setManualSong, placeholder: 'e.g. Amazing Grace' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button onClick={handleAddManual} disabled={!manualName.trim() || addingManual}
              style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: manualName.trim() ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'rgba(255,255,255,0.08)', color: manualName.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: manualName.trim() ? 'pointer' : 'default', marginTop: 4 }}>
              {addingManual ? 'Adding...' : 'Add Participant'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Submission Form Modal */}
      {showFormModal && eventMeta && (
        <SubmissionFormModal
          eventMeta={eventMeta}
          eventId={eventId!}
          existingConfig={submissionConfig}
          submissionLink={getSubmissionLink()}
          onClose={() => setShowFormModal(false)}
          onCreated={(config) => { setSubmissionConfig(config); setShowFormModal(false) }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}

function getButtonLabel(eventType: string) {
  if (['choir', 'worship'].includes(eventType)) return 'Open Song Submissions'
  if (['conference'].includes(eventType)) return 'Open Topic Submissions'
  if (['talent show', 'open mic'].includes(eventType)) return 'Open Act Submissions'
  return 'Open Submissions'
}

function getPageMeta(eventType: string) {
  if (['choir', 'worship'].includes(eventType)) return { pageTitle: 'Songs', itemLabel: 'song', icon: <Music2 size={22} /> }
  if (['conference'].includes(eventType)) return { pageTitle: 'Session Topics', itemLabel: 'topic', icon: <Presentation size={22} /> }
  return { pageTitle: 'Acts', itemLabel: 'act', icon: <Mic2 size={22} /> }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
    approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)'   },
    rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  }
  const s = map[status] ?? map.pending
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 5, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}