// src/pages/SavedEvents.tsx
import { useState, useMemo } from 'react'
import {
  Heart, Search, MapPin, Calendar, Bookmark,
  X, Share2, Ticket, Bell, ChevronRight, ExternalLink,
} from 'lucide-react'
import UserDashboardLayout from '../components/UserDashboardLayout'
import { useAuth } from '../context/Authcontext'
import { useUserSavedEvents, type SavedEvent } from '../lib/useUserSavedEvents'
import { useUserInvitations } from '../lib/useUserInvitations'
import { Link } from 'react-router-dom'

type TabKey = 'all' | 'upcoming' | 'past'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Concert:          { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
  'Music Festival': { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  'Award Show':     { bg: 'rgba(250,204,21,0.15)',  color: '#fbbf24' },
  Workshop:         { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  Conference:       { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  Comedy:           { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc' },
  default:          { bg: 'rgba(255,255,255,0.1)',  color: 'rgba(255,255,255,0.6)' },
}

function getCategoryStyle(cat?: string) {
  return CATEGORY_COLORS[cat || ''] || CATEGORY_COLORS.default
}

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SavedEvents() {
  const { user } = useAuth()
  const { savedEvents, loading, upcoming, past, removeSavedEvent } = useUserSavedEvents(user?.uid)
  const { pending } = useUserInvitations(user?.uid, user?.email)

  const [activeTab, setActiveTab]   = useState<TabKey>('all')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<SavedEvent | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [reminderSet, setReminderSet] = useState<Set<string>>(new Set())

  const tabList: { key: TabKey; label: string }[] = [
    { key: 'all',      label: 'All Saved' },
    { key: 'upcoming', label: 'Upcoming'  },
    { key: 'past',     label: 'Past'      },
  ]

  const tabData: Record<TabKey, SavedEvent[]> = { all: savedEvents, upcoming, past }

  const filtered = useMemo(() => {
    const base = tabData[activeTab]
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(e =>
      e.eventName?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.eventType?.toLowerCase().includes(q)
    )
  }, [activeTab, savedEvents, search])

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    await removeSavedEvent(id)
    if (selected?.id === id) setSelected(null)
    setRemovingId(null)
  }

  const toggleReminder = (id: string) => {
    setReminderSet(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <style>{`
        .saved-grid { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
        .saved-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; cursor: pointer; border: 1px solid transparent; transition: all 0.18s; }
        .saved-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
        .saved-row.active { background: rgba(13,199,94,0.06); border-color: rgba(13,199,94,0.25); }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 16px; border-radius: 0; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.45); transition: all 0.15s; white-space: nowrap; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: #0dc75e; border-bottom-color: #0dc75e; }
        .tab-btn:hover:not(.active) { color: rgba(255,255,255,0.75); }
        .se-action-btn { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; flex: 1; }
        .se-action-btn:hover { background: rgba(255,255,255,0.09); }
        .se-action-btn.primary { background: #0dc75e; border-color: #0dc75e; color: #000; font-weight: 600; }
        .se-action-btn.primary:hover { background: #0ab350; }
        @media (max-width: 960px) { .saved-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .tab-btn { padding: 10px 10px; font-size: 13px; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Heart size={26} color="#0dc75e" />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', color: '#fff', margin: 0 }}>
            Saved Events
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
          Events you've saved for later.
        </p>
      </div>

      {/* Main card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {tabList.map(t => (
              <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', minWidth: 200 }}>
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search saved events..."
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif', width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="saved-grid" style={{ minHeight: 400 }}>
          {/* Left: list */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', padding: '14px 0' }}>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 70, height: 70, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
                    <div style={{ height: 12, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                {search ? 'No saved events match your search.' : "You haven't saved any events yet."}
              </div>
            ) : (
              <>
                {filtered.map(ev => {
                  const catStyle = getCategoryStyle(ev.eventType)
                  return (
                    <div key={ev.id} className={`saved-row ${selected?.id === ev.id ? 'active' : ''}`} onClick={() => setSelected(ev)}>
                      {ev.eventImage ? (
                        <img src={ev.eventImage} alt={ev.eventName} style={{ width: 70, height: 70, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 70, height: 70, borderRadius: 10, background: 'rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={22} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {ev.eventType && (
                          <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, marginBottom: 5, background: catStyle.bg, color: catStyle.color }}>
                            {ev.eventType}
                          </span>
                        )}
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Syne, sans-serif' }}>
                          {ev.eventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
                          <MapPin size={11} /> {ev.venue}{ev.city ? `, ${ev.city}` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                          <Calendar size={11} /> {formatDate(ev.eventDate)}{ev.eventTime ? ` • ${ev.eventTime}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ev.status === 'upcoming' ? 'rgba(13,199,94,0.12)' : 'rgba(255,255,255,0.07)', color: ev.status === 'upcoming' ? '#0dc75e' : 'rgba(255,255,255,0.4)' }}>
                          {ev.status === 'upcoming' ? 'Upcoming' : 'Past'}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); handleRemove(ev.id) }}
                          disabled={removingId === ev.id}
                          title="Remove from saved"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
                        >
                          <Bookmark size={14} fill="rgba(255,255,255,0.25)" />
                        </button>
                        <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
                      </div>
                    </div>
                  )
                })}
                <div style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                  Showing 1 to {filtered.length} of {filtered.length} saved event{filtered.length !== 1 ? 's' : ''}
                </div>
              </>
            )}
          </div>

          {/* Right: detail panel */}
          <div style={{ background: 'rgba(0,0,0,0.1)' }}>
            {!selected ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '60px 20px' }}>
                <Heart size={40} strokeWidth={1} />
                <p style={{ fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Select a saved event to view details</p>
              </div>
            ) : (
              <SavedEventDetail
                event={selected}
                onClose={() => setSelected(null)}
                onRemove={() => handleRemove(selected.id)}
                removing={removingId === selected.id}
                reminderSet={reminderSet.has(selected.id)}
                onToggleReminder={() => toggleReminder(selected.id)}
              />
            )}
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  )
}

// ─── Detail panel (fixed: was lowercase `userSavedEventDetail`) ──────────────
function SavedEventDetail({ event, onClose, onRemove, removing, reminderSet, onToggleReminder }: {
  event: SavedEvent
  onClose: () => void
  onRemove: () => void
  removing: boolean
  reminderSet: boolean
  onToggleReminder: () => void
}) {
  const catStyle = getCategoryStyle(event.eventType)

  const details = [
    { label: 'Event Type',      value: event.eventType      || '—' },
    { label: 'Organizer',       value: event.organizer      || '—' },
    { label: 'Age Restriction', value: event.ageRestriction || 'All Ages' },
    { label: 'Website',         value: event.website        || null, isLink: true },
  ]

  return (
    <div>
      {/* Hero image */}
      <div style={{ position: 'relative' }}>
        {event.eventImage ? (
          <img src={event.eventImage} alt={event.eventName} style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: 190, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={40} color="rgba(255,255,255,0.1)" />
          </div>
        )}
        <button
          onClick={onRemove}
          disabled={removing}
          style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(6px)' }}
        >
          <X size={12} /> {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>

      <div style={{ padding: '18px 20px' }}>
        {event.eventType && (
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 10, background: catStyle.bg, color: catStyle.color }}>
            {event.eventType}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Syne, sans-serif', lineHeight: 1.2 }}>
            {event.eventName}
          </h2>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0, background: event.status === 'upcoming' ? 'rgba(13,199,94,0.12)' : 'rgba(255,255,255,0.07)', color: event.status === 'upcoming' ? '#0dc75e' : 'rgba(255,255,255,0.45)' }}>
            {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
          <Calendar size={13} /> {formatDate(event.eventDate)}{event.eventTime ? ` • ${event.eventTime}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
          <MapPin size={13} /> {event.venue}{event.city ? `, ${event.city}` : ''}
        </div>

        {event.description && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 18, fontFamily: 'DM Sans, sans-serif' }}>
            {event.description}
          </p>
        )}

          {/* Actions */}
<div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
  <Link
    to={event.eventType === 'network'
      ? `/event/${event.eventId}/network/tickets`
      : `/event/${event.eventId}/tickets`}
    style={{ textDecoration: 'none', flex: 1 }}
  >
    <button className="se-action-btn primary" style={{ width: '100%' }}>
      <Ticket size={15} /> Get Tickets
    </button>
  </Link>
  <button className="se-action-btn" style={{ flex: 'none', padding: '10px 14px' }}>
    <Share2 size={15} />
  </button>
  <Link to={`/events/${event.eventId}`} style={{ textDecoration: 'none' }}>
    <button className="se-action-btn" style={{ flex: 'none', padding: '10px 14px' }} title="View Details">
      <ExternalLink size={15} />
    </button>
  </Link>
</div>

        {/* Event details */}
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>Event Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {details.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{d.label}</span>
              {d.isLink && d.value ? (
                <a href={d.value.startsWith('http') ? d.value : `https://${d.value}`} target="_blank" rel="noreferrer" style={{ color: '#0dc75e', fontSize: 13, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
                  {d.value}
                </a>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>{d.value || '—'}</span>
              )}
            </div>
          ))}
        </div>

        {/* Set reminder */}
        <div style={{ padding: '14px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={16} color="#a78bfa" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Set Reminder</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>Get notified before this event starts.</div>
            </div>
          </div>
          <button
            onClick={onToggleReminder}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.4)', background: reminderSet ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
          >
            {reminderSet ? 'Reminder Set ✓' : 'Set Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}