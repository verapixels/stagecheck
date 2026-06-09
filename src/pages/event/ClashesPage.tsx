import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import { Shield, AlertTriangle, CheckCircle2, Mail, Loader2 } from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

interface ClashGroup {
  title: string
  entries: { name: string; email: string; submissionId: string; status: string }[]
}

export default function ClashesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [clashes, setClashes]     = useState<ClashGroup[]>([])
  const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [loading, setLoading]     = useState(true)
  const [totalSubs, setTotalSubs] = useState(0)

  // ── Wait for eventType to be ready before subscribing ──────────────────
  useEffect(() => {
    if (!eventId || metaLoading) return

    const unsub = onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      setTotalSubs(docs.length)

      const groups: Record<string, ClashGroup> = {}

      docs.forEach(d => {
        // Get all clash titles for this submission (may have multiple songs)
        const titles = getClashTitles(d, eventType ?? 'custom')
        titles.forEach(title => {
          if (!title.trim()) return
          const key = title.trim().toLowerCase()
          if (!groups[key]) groups[key] = { title: title.trim(), entries: [] }

          // Avoid duplicate entries for same submission
          const alreadyAdded = groups[key].entries.some(e => e.submissionId === d.id)
          if (!alreadyAdded) {
            groups[key].entries.push({
              submissionId: d.id,
              name:  d.groupName || d.performerName || d.speakerName || d.teamName
                  || d.ministerName || d.awardeeName || d.entryName || d.email || 'Unknown',
              email:  d.email || '',
              status: d.status || 'pending',
            })
          }
        })
      })

      setClashes(Object.values(groups).filter(g => g.entries.length > 1))
      setLoading(false)
    })

    return () => unsub()
  }, [eventId, metaLoading, eventType])

  // ── Get all song/topic titles from a submission ─────────────────────────
  function getClashTitles(d: any, type: string): string[] {
    // For choir/worship — check songs array first, then songSearch fallback
    if (type === 'choir' || type === 'worship') {
      if (Array.isArray(d.songs) && d.songs.length > 0) {
        return d.songs.map((s: any) => s.title || '').filter(Boolean)
      }
      return [d.songSearch || ''].filter(Boolean)
    }
    if (type === 'conference') return [d.topic || ''].filter(Boolean)
    if (type === 'drama')      return [d.dramaTitle || ''].filter(Boolean)
    // Generic fallback — try all known title fields
    if (Array.isArray(d.songs) && d.songs.length > 0) {
      return d.songs.map((s: any) => s.title || '').filter(Boolean)
    }
    return [d.actTitle || d.topic || d.songSearch || ''].filter(Boolean)
  }

  const clashLabel = (() => {
    if (eventType === 'choir' || eventType === 'worship') return 'song'
    if (eventType === 'conference') return 'session topic'
    if (eventType === 'drama') return 'drama title'
    return 'act'
  })()

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
  }

  const isPageLoading = metaLoading || loading

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
            <Shield size={20} color="#F87171" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Clash Detection
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Duplicate {clashLabel}s flagged for resolution
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 2 }}>{totalSubs}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total submissions</div>
        </div>
        <div style={{
          background: clashes.length > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(19,26,46,0.7)',
          border: `1px solid ${clashes.length > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: clashes.length > 0 ? '#F87171' : '#22C55E', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
            {clashes.length}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Clashes detected</div>
        </div>
        <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
            {clashes.reduce((acc, c) => acc + c.entries.length - 1, 0)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Entries need resolution</div>
        </div>
      </div>

      {/* Content */}
      {isPageLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Scanning submissions...
        </div>
      ) : clashes.length === 0 ? (
        <div style={{ ...cardStyle, padding: '60px 24px', textAlign: 'center' }}>
          <CheckCircle2 size={40} color="#22C55E" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            No clashes detected
          </h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            All {clashLabel}s are unique.{totalSubs > 0 ? ` Checked ${totalSubs} submission${totalSubs !== 1 ? 's' : ''}.` : ' No submissions yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {clashes.map((clash, i) => (
            <div key={i} style={{ ...cardStyle, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.03)' }}>

              {/* Clash header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(248,113,113,0.1)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} color="#F87171" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#F87171' }}>{clash.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    {clash.entries.length} entries with this {clashLabel}
                  </div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: 11,
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                  color: '#F87171', padding: '3px 10px', borderRadius: 6, fontWeight: 600,
                }}>
                  CLASH
                </span>
              </div>

              {/* Entries */}
              <div
                className="clash-entries"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(clash.entries.length, 2)}, 1fr)`,
                  gap: 12,
                  padding: '16px 20px',
                }}
              >
                {clash.entries.map((entry, j) => (
                  <div key={j} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{entry.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                      <Mail size={11} /> {entry.email || 'No email'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <StatusPill status={entry.status} />
                      {entry.email && (
                        <a
                          href={`mailto:${entry.email}?subject=Clash Notice: ${encodeURIComponent(clash.title)}&body=Hi%2C%20we%20noticed%20another%20group%20has%20also%20chosen%20%22${encodeURIComponent(clash.title)}%22.%20Please%20get%20in%20touch%20to%20resolve%20this%20clash.`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 12, color: '#22C55E',
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                            padding: '4px 10px', borderRadius: 6, textDecoration: 'none',
                          }}
                        >
                          <Mail size={11} /> Contact
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .clash-entries { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
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
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 5, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}