import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Authcontext'
import DashboardLayout from '../components/DashboardLayout'
import {
  Plus, CalendarDays, MapPin, Users, ChevronRight,
  Music2, Star, Presentation, Trophy, Heart, Mic2,
  GraduationCap, Sparkles, Loader2, Search, Filter,
  Clock, CheckCircle2, XCircle, LayoutGrid, List
} from 'lucide-react'

const EVENT_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  choir:       { label: 'Choir Concert',       color: '#22C55E', icon: <Music2 size={14} />       },
  talent:      { label: 'Talent Show',         color: '#F59E0B', icon: <Star size={14} />          },
  conference:  { label: 'Conference',          color: '#3B82F6', icon: <Presentation size={14} />  },
  competition: { label: 'School Competition',  color: '#8B5CF6', icon: <Trophy size={14} />        },
  drama:       { label: 'Drama / Theatre',     color: '#EC4899', icon: <Star size={14} />          },
  worship:     { label: 'Worship Night',       color: '#14B8A6', icon: <Heart size={14} />         },
  openmic:     { label: 'Open Mic',            color: '#F97316', icon: <Mic2 size={14} />          },
  graduation:  { label: 'Award / Graduation',  color: '#06B6D4', icon: <GraduationCap size={14} /> },
  custom:      { label: 'Custom Event',        color: '#A78BFA', icon: <Sparkles size={14} />      },
}

type ViewMode = 'grid' | 'list'

export default function EventsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'ended'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data(), _subCount: 0 }))
      setEvents(docs)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Filter
  const filtered = events.filter(ev => {
    const matchSearch = ev.name?.toLowerCase().includes(search.toLowerCase()) ||
      ev.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (ev.status ?? 'active') === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: events.length,
    active: events.filter(e => (e.status ?? 'active') === 'active').length,
    draft:  events.filter(e => e.status === 'draft').length,
    ended:  events.filter(e => e.status === 'ended').length,
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
  }

  return (
    <DashboardLayout plan="starter" eventType="custom">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.5px', color: '#fff', marginBottom: 4,
          }}>
            My Events
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Manage all your events in one place
          </p>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#22C55E', border: 'none', color: '#0B1020',
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
            transition: 'background 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1da34a'}
          onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} className="stats-row">
        {[
          { label: 'Total Events', value: stats.total,  color: '#fff' },
          { label: 'Active',       value: stats.active, color: '#22C55E' },
          { label: 'Draft',        value: stats.draft,  color: '#F59E0B' },
          { label: 'Ended',        value: stats.ended,  color: 'rgba(255,255,255,0.35)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{
          flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '9px 14px',
        }}>
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)' }}
          />
        </div>

        {/* Status filter */}
        {(['all', 'active', 'draft', 'ended'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '9px 16px', borderRadius: 10, border: '1px solid',
              cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
              borderColor: statusFilter === s ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
              background: statusFilter === s ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: statusFilter === s ? '#22C55E' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
          {(['grid', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                padding: '9px 12px', border: 'none', cursor: 'pointer',
                background: viewMode === v ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === v ? '#fff' : 'rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', transition: 'all 0.15s',
              }}
            >
              {v === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading events...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasEvents={events.length > 0} onNew={() => navigate('/onboarding')} />
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(ev => (
            <EventCard key={ev.id} event={ev} onClick={() => navigate(`/manage/event/${ev.id}`)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(ev => (
            <EventRow key={ev.id} event={ev} onClick={() => navigate(`/manage/event/${ev.id}`)} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) { .stats-row { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </DashboardLayout>
  )
}

// ── Event Card (grid view) ─────────────────────────────────────────
function EventCard({ event, onClick }: { event: any; onClick: () => void }) {
  const meta = EVENT_TYPE_META[event.eventType] ?? EVENT_TYPE_META.custom
  const status = event.status ?? 'active'
  const date = event.date
    ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const daysUntil = event.date
    ? Math.ceil((new Date(event.date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${meta.color}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Color bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}50)` }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Type + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
            padding: '3px 9px', borderRadius: 6, fontSize: 11, color: meta.color, fontWeight: 600,
          }}>
            {meta.icon} {meta.label}
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Name */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 10, lineHeight: 1.3 }}>
          {event.name}
        </h3>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
          {date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <CalendarDays size={11} /> {date}
              {daysUntil !== null && daysUntil > 0 && (
                <span style={{ marginLeft: 4, color: daysUntil < 7 ? '#F87171' : 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  ({daysUntil}d away)
                </span>
              )}
            </span>
          )}
          {event.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <MapPin size={11} /> {event.location}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            <Users size={11} /> {event.submissionCount ?? 0} submissions
          </span>
          <ChevronRight size={14} color={meta.color} />
        </div>
      </div>
    </div>
  )
}

// ── Event Row (list view) ──────────────────────────────────────────
function EventRow({ event, onClick }: { event: any; onClick: () => void }) {
  const meta = EVENT_TYPE_META[event.eventType] ?? EVENT_TYPE_META.custom
  const status = event.status ?? 'active'
  const date = event.date
    ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${meta.color}30`; e.currentTarget.style.background = 'rgba(19,26,46,0.9)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(19,26,46,0.7)' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.name}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{event.location || '—'}</div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <CalendarDays size={11} /> {date}
      </div>
      <div style={{ flexShrink: 0 }}><StatusBadge status={status} /></div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Users size={11} /> {event.submissionCount ?? 0}
      </div>
      <ChevronRight size={14} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
    active: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  icon: <CheckCircle2 size={10} /> },
    draft:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={10} />        },
    ended:  { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)', icon: <XCircle size={10} /> },
  }
  const s = map[status] ?? map.active
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {s.icon} {status}
    </span>
  )
}

// ── Empty state ───────────────────────────────────────────────────
function EmptyState({ hasEvents, onNew }: { hasEvents: boolean; onNew: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
        {hasEvents ? 'No events match your search' : 'No events yet'}
      </h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
        {hasEvents ? 'Try adjusting your search or filter.' : 'Create your first event to get started.'}
      </p>
      {!hasEvents && (
        <button
          onClick={onNew}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#22C55E', border: 'none', color: '#0B1020',
            padding: '11px 22px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}
        >
          <Plus size={15} /> Create your first event
        </button>
      )}
    </div>
  )
}