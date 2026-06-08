import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import { Music2, Mic2, Presentation, Search, Loader2, AlertTriangle } from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

interface SongEntry {
  title: string
  performer: string
  email: string
  submissionId: string
  category?: string
  status: string
}

export default function SongsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [entries, setEntries]     = useState<SongEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')

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
      })).filter(e => e.title !== '—')
      setEntries(mapped)
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

const { pageTitle, itemLabel, icon } = getPageMeta(eventType ?? 'custom')

  // Group by category if applicable
  const categories = [...new Set(entries.map(e => e.category).filter(Boolean))]
  const filtered = entries.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.performer.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || e.category === filter || e.status === filter
    return matchSearch && matchFilter
  })

  // Detect clashes
  const titleCounts: Record<string, number> = {}
  entries.forEach(e => { titleCounts[e.title.toLowerCase()] = (titleCounts[e.title.toLowerCase()] || 0) + 1 })

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
<div style={{ marginBottom: 28 }}>
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label={`Total ${itemLabel}s`} value={entries.length} color="#fff" />
        <StatCard label="Clashes" value={Object.values(titleCounts).filter(v => v > 1).length} color="#F87171" />
        <StatCard label="Approved" value={entries.filter(e => e.status === 'approved').length} color="#22C55E" />
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 14px' }}>
          <Search size={13} color="rgba(255,255,255,0.3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${itemLabel}s...`}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)' }} />
        </div>
        {categories.length > 0 && (
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', padding: '9px 14px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
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
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr 0.8fr', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[itemLabel, 'Performer / Group', 'Category', 'Status'].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</div>
            ))}
          </div>
          {filtered.map((entry, i) => {
            const isClash = titleCounts[entry.title.toLowerCase()] > 1
            return (
              <div key={entry.submissionId} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr 0.8fr', gap: 12,
                padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: isClash ? 'rgba(248,113,113,0.04)' : 'transparent',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: isClash ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isClash
                      ? <AlertTriangle size={12} color="#F87171" />
                      : <Music2 size={12} color="#22C55E" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: isClash ? '#F87171' : '#fff' }}>{entry.title}</div>
                    {isClash && <div style={{ fontSize: 11, color: '#F87171' }}>⚠ Clash detected</div>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{entry.performer}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{entry.email}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{entry.category || '—'}</div>
                <StatusPill status={entry.status} />
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
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
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 5, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}