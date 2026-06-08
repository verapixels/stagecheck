import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, doc, updateDoc, getDoc, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import { Radio, ChevronRight, ChevronLeft, CheckCircle2, Mic2, Clock, Loader2, Users } from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

type LiveStatus = 'waiting' | 'upnext' | 'onstage' | 'done'

interface Performer {
  id: string
  name: string
  email: string
  song?: string
  category?: string
  liveStatus: LiveStatus
  orderIndex?: number
}

const COLUMNS: { id: LiveStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { id: 'waiting', label: 'Waiting',  color: 'rgba(255,255,255,0.3)', icon: <Clock size={15} />        },
  { id: 'upnext',  label: 'Up Next',  color: '#F59E0B',               icon: <ChevronRight size={15} /> },
  { id: 'onstage', label: 'On Stage', color: '#22C55E',               icon: <Mic2 size={15} />         },
  { id: 'done',    label: 'Done',     color: 'rgba(255,255,255,0.2)', icon: <CheckCircle2 size={15} /> },
]

export default function LiveControlPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [performers, setPerformers] = useState<Performer[]>([])
  const [loading, setLoading]       = useState(true)
  const [moving, setMoving]         = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
   
    // Watch approved submissions
    const unsub = onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const approved = docs
        .filter((d: any) => d.status === 'approved')
        .map((d: any) => ({
          id: d.id,
          name: d.groupName || d.performerName || d.speakerName || d.teamName || d.ministerName || d.awardeeName || d.entryName || d.email || 'Unknown',
          email: d.email || '',
          song: d.songSearch || d.actTitle || d.topic || '',
          category: d.category || d.actType || '',
          liveStatus: (d.liveStatus as LiveStatus) || 'waiting',
          orderIndex: d.orderIndex || 0,
        }))
      setPerformers(approved)
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

  const movePerformer = async (id: string, toStatus: LiveStatus) => {
    if (!eventId) return
    setMoving(id)
    try {
      await updateDoc(doc(db, 'events', eventId, 'submissions', id), { liveStatus: toStatus })
    } finally {
      setMoving(null)
    }
  }

  const getColumn = (status: LiveStatus) => performers.filter(p => p.liveStatus === status)

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', animation: 'livePulse 1.5s infinite' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Live Stage Control
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {performers.length} approved performers · Real-time stage management
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22C55E', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '6px 14px', borderRadius: 8 }}>
          <Radio size={12} /> LIVE
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading stage...
        </div>
      ) : performers.length === 0 ? (
        <div style={{ ...cardStyle, padding: '60px 24px', textAlign: 'center' }}>
          <Users size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 8 }}>No approved performers</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
            Approve submissions in the Submissions page to add them to the live board.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="live-grid">
          {COLUMNS.map(col => {
            const colPerformers = getColumn(col.id)
            return (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                  background: col.id === 'onstage'
                    ? 'rgba(34,197,94,0.1)' : col.id === 'upnext'
                    ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${col.id === 'onstage' ? 'rgba(34,197,94,0.25)' : col.id === 'upnext' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                }}>
                  <span style={{ color: col.color }}>{col.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: col.color, fontFamily: 'var(--font-display)' }}>
                    {col.label}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 4 }}>
                    {colPerformers.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                  {colPerformers.length === 0 ? (
                    <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, padding: '20px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                      Empty
                    </div>
                  ) : colPerformers.map(p => (
                    <PerformerCard
                      key={p.id}
                      performer={p}
                      colId={col.id}
                      isMoving={moving === p.id}
                      onMove={movePerformer}
                      accentColor={col.color}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes livePulse { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { opacity:0.8; box-shadow: 0 0 0 6px rgba(34,197,94,0); } }
        @media (max-width: 900px) { .live-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 540px) { .live-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}

function PerformerCard({
  performer, colId, isMoving, onMove, accentColor,
}: {
  performer: Performer
  colId: LiveStatus
  isMoving: boolean
  onMove: (id: string, to: LiveStatus) => void
  accentColor: string
}) {
  const ORDER: LiveStatus[] = ['waiting', 'upnext', 'onstage', 'done']
  const idx = ORDER.indexOf(colId)
  const canForward = idx < ORDER.length - 1
  const canBack    = idx > 0

  return (
    <div style={{
      background: colId === 'onstage' ? 'rgba(34,197,94,0.08)' : 'rgba(19,26,46,0.8)',
      border: `1px solid ${colId === 'onstage' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, padding: '12px 14px',
      opacity: isMoving ? 0.6 : 1, transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{performer.name}</div>
      {performer.song && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{performer.song}</div>}
      {performer.category && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{performer.category}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {canBack && (
          <button
            onClick={() => onMove(performer.id, ORDER[idx - 1])}
            disabled={isMoving}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '6px', borderRadius: 7,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <ChevronLeft size={12} /> Back
          </button>
        )}
        {canForward && (
          <button
            onClick={() => onMove(performer.id, ORDER[idx + 1])}
            disabled={isMoving}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '6px', borderRadius: 7,
              background: accentColor === '#22C55E' || accentColor === '#F59E0B' ? `${accentColor}15` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${accentColor}30`,
              color: accentColor, cursor: 'pointer', fontSize: 11,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
          >
            {isMoving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <><ChevronRight size={12} /> Next</>}
          </button>
        )}
      </div>
    </div>
  )
}