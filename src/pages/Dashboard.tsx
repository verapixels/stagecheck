import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, Shield, Plus,
  TrendingUp, Clock, ArrowRight, Loader2,
  MapPin, Hash
} from 'lucide-react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Authcontext'
import DashboardLayout from '../components/DashboardLayout'

interface EventDoc {
  id: string
  name: string
  date: string
  location: string
  eventType: string
  joinCode: string
  status: string
  maxPerformers: number
  enabledModules: string[]
  createdAt?: { seconds: number }
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Organizer'

  const [events, setEvents] = useState<EventDoc[]>([])
  const [loading, setLoading] = useState(true)
const currentEventType = events.length > 0 ? events[0].eventType : 'choir'


  // Load all events for this organizer from Firestore in real time
  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDoc))
      setEvents(data)
      setLoading(false)
    }, () => {
      setLoading(false)
    })

    return () => unsub()
  }, [user?.uid])

  const activeEvents = events.filter(e => e.status === 'active')
  const upcomingEvent = events.find(e => e.date >= new Date().toISOString().split('T')[0])

  const stats = [
    {
      label: 'Active Events',
      value: loading ? '—' : String(activeEvents.length),
      sub: loading ? '' : `${5 - activeEvents.length} remaining on plan`,
      icon: <CalendarDays size={20} />,
      color: '#22C55E',
    },
    {
      label: 'Total Performers',
      value: loading ? '—' : String(events.reduce((sum, e) => sum + (e.maxPerformers || 0), 0)),
      sub: 'across all events',
      icon: <Users size={20} />,
      color: '#3B82F6',
    },
    {
      label: 'Clashes Detected',
      value: '0',
      sub: 'All clear',
      icon: <Shield size={20} />,
      color: '#22C55E',
    },
    {
      label: 'Next Event',
      value: loading ? '—' : upcomingEvent
        ? new Date(upcomingEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'None',
      sub: upcomingEvent ? upcomingEvent.name : 'Create your first event',
      icon: <Clock size={20} />,
      color: '#F59E0B',
    },
  ]

  return (
   <DashboardLayout plan="starter" eventType={currentEventType}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.8px', marginBottom: 6,
        }}>
          Organizer Dashboard
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>
          Welcome back, <strong style={{ color: '#fff', fontWeight: 600 }}>{displayName}</strong>.
          {loading ? ' Loading your events...' : events.length === 0 ? ' Create your first event to get started.' : ` You have ${activeEvents.length} active event${activeEvents.length !== 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: '2rem',
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${s.color}15`, border: `1px solid ${s.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
              }}>
                {s.icon}
              </div>
              <TrendingUp size={14} color="rgba(255,255,255,0.2)" />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
                color: '#fff', letterSpacing: '-1px',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: s.color, marginTop: 4, opacity: 0.8 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Events list + create card */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 1fr',
        gap: 16, marginBottom: '2rem',
      }} className="dash-grid">

        {/* Events list */}
        <div style={{
          background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>
              Your Events
            </h3>
            <Link to="/onboarding" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              color: '#22C55E', padding: '6px 12px', borderRadius: 8,
              textDecoration: 'none', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-body)',
            }}>
              <Plus size={13} /> New Event
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.3)', padding: '20px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                No events yet
              </div>
              <Link to="/onboarding" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#22C55E', color: '#0B1020', padding: '10px 20px',
                borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-body)',
              }}>
                <Plus size={14} /> Create Your First Event
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/dashboard/event/${event.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {event.date && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarDays size={11} />
                          {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {event.location && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: event.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
                      color: event.status === 'active' ? '#22C55E' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${event.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      {event.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                    <ArrowRight size={14} color="rgba(255,255,255,0.25)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create new event card */}
        <div style={{
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 18, padding: '28px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 18, marginBottom: 10, color: '#fff',
          }}>
            Create a New Event
          </h3>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.7, marginBottom: 22, fontWeight: 300,
          }}>
            Choose your event type, set the details, and enable only the modules you need.
            Takes less than 2 minutes.
          </p>
          <Link to="/onboarding" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#22C55E', color: '#0B1020', padding: '12px 20px',
            borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-body)', transition: 'background 0.2s',
            alignSelf: 'flex-start',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1da34a'}
            onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
          >
            <Plus size={16} /> Create New Event
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}