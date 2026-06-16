import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, orderBy, limit,
  where, Timestamp, getCountFromServer,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiCalendarEventLine, RiGroupLine, RiTicketLine, RiAlertLine,
  RiArrowRightLine, RiLoader4Line,
  RiStarLine, RiBarChartLine, RiShieldLine, RiCheckLine,
  RiTimeLine,
} from 'react-icons/ri'

interface RecentEvent {
  id: string; name: string; date: any; status: string; eventType: string; attendingCount: number
}
interface RecentUser {
  id: string; displayName: string; email: string; createdAt: any; role: string; suspended?: boolean
}
interface RecentReport {
  id: string; eventName: string; reason: string; createdAt: any; status: string
}

function toDate(val: any): Date {
  if (!val) return new Date(0)
  if (val?.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}
function timeAgo(val: any) {
  const d = toDate(val)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Overview() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ events: 0, users: 0, tickets: 0, reports: 0 })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Counts
        const [evSnap, usSnap] = await Promise.all([
          getCountFromServer(collection(db, 'events')),
          getCountFromServer(collection(db, 'users')),
        ])

        let reportsCount = 0
        try {
          const rSnap = await getCountFromServer(collection(db, 'reports'))
          reportsCount = rSnap.data().count
        } catch { }

        let ticketCount = 0
        try {
          const tkSnap = await getCountFromServer(collection(db, 'tickets'))
          ticketCount = tkSnap.data().count
        } catch { }

        // Recent events
        let evList: RecentEvent[] = []
        try {
          const q = query(collection(db, 'events'), orderBy('date', 'desc'), limit(5))
          const snap = await getDocs(q)
          evList = snap.docs.map(d => ({
            id: d.id, name: d.data().name ?? 'Unnamed',
            date: d.data().date, status: d.data().status ?? 'active',
            eventType: d.data().eventType ?? 'custom',
            attendingCount: d.data().attendingCount ?? 0,
          }))
        } catch {
          const q = query(collection(db, 'events'), limit(5))
          const snap = await getDocs(q)
          evList = snap.docs.map(d => ({
            id: d.id, name: d.data().name ?? 'Unnamed',
            date: d.data().date, status: d.data().status ?? 'active',
            eventType: d.data().eventType ?? 'custom',
            attendingCount: d.data().attendingCount ?? 0,
          }))
        }

        // Recent users
        let usList: RecentUser[] = []
        try {
          const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5))
          const snap = await getDocs(q)
          usList = snap.docs.map(d => ({
            id: d.id, displayName: d.data().displayName ?? d.data().name ?? 'Unknown',
            email: d.data().email ?? '', createdAt: d.data().createdAt,
            role: d.data().role ?? 'user', suspended: d.data().suspended ?? false,
          }))
        } catch {
          const q = query(collection(db, 'users'), limit(5))
          const snap = await getDocs(q)
          usList = snap.docs.map(d => ({
            id: d.id, displayName: d.data().displayName ?? d.data().name ?? 'Unknown',
            email: d.data().email ?? '', createdAt: d.data().createdAt,
            role: d.data().role ?? 'user', suspended: d.data().suspended ?? false,
          }))
        }

        // Recent reports
        let rList: RecentReport[] = []
        try {
          const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(5))
          const snap = await getDocs(q)
          rList = snap.docs.map(d => ({
            id: d.id, eventName: d.data().eventName ?? 'Unknown Event',
            reason: d.data().reason ?? d.data().message ?? '',
            createdAt: d.data().createdAt, status: d.data().status ?? 'pending',
          }))
        } catch { }

        if (!cancelled) {
          setCounts({
            events: evSnap.data().count,
            users: usSnap.data().count,
            tickets: ticketCount,
            reports: reportsCount,
          })
          setRecentEvents(evList)
          setRecentUsers(usList)
          setRecentReports(rList)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const tiles = [
    { label: 'Total Events', val: counts.events, icon: <RiCalendarEventLine />, color: '#0dc75e', delta: 'All time' },
    { label: 'Registered Users', val: counts.users, icon: <RiGroupLine />, color: '#60a5fa', delta: 'All time' },
    { label: 'Tickets Issued', val: counts.tickets, icon: <RiTicketLine />, color: '#a78bfa', delta: 'Across all events' },
    { label: 'Open Reports', val: counts.reports, icon: <RiAlertLine />, color: '#f87171', delta: 'Need attention' },
  ]

  const quickActions = [
    { label: 'Manage Events', icon: <RiCalendarEventLine />, to: '/superadmin/events', color: '#0dc75e' },
    { label: 'Manage Users', icon: <RiGroupLine />, to: '/superadmin/users', color: '#60a5fa' },
    { label: 'View Reports', icon: <RiAlertLine />, to: '/superadmin/reports', color: '#f87171' },
    { label: 'Testimonials', icon: <RiStarLine />, to: '/superadmin/testimonials', color: '#fbbf24' },
    { label: 'Analytics', icon: <RiBarChartLine />, to: '/superadmin/analytics', color: '#a78bfa' },
    { label: 'Settings', icon: <RiShieldLine />, to: '/superadmin/settings', color: '#2dd4bf' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--muted)' }}>
      <RiLoader4Line size={22} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />
      Loading dashboard...
    </div>
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Control Panel</h1>
        <p className="page-sub">Full overview of StageCheck platform activity</p>
      </div>

      {/* Stat Tiles */}
      <div className="stat-grid">
        {tiles.map(t => (
          <div key={t.label} className="stat-tile" style={{ '--tc': t.color } as React.CSSProperties}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="stat-tile-icon">{t.icon}</div>
              <span className="stat-tile-delta" style={{ color: t.color }}>{t.delta}</span>
            </div>
            <div>
              <div className="stat-tile-val">{t.val.toLocaleString()}</div>
              <div className="stat-tile-lbl">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-head">
          <span className="card-title">Quick Actions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
          {quickActions.map((a, i) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '20px 12px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', borderRight: i < 5 ? '1px solid var(--border)' : 'none',
                transition: 'all .18s', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,.03)'
                el.style.color = a.color
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'none'
                el.style.color = 'var(--muted)'
              }}
            >
              <span style={{ fontSize: 22, color: a.color }}>{a.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3-column grid: recent events, recent users, recent reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

        {/* Recent Events */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Events</span>
            <button className="btn btn-ghost-sm" onClick={() => navigate('/superadmin/events')}>
              View all <RiArrowRightLine size={12} />
            </button>
          </div>
          <div>
            {recentEvents.length === 0 ? (
              <div className="empty-state"><RiCalendarEventLine size={28} />No events yet</div>
            ) : recentEvents.map(ev => (
              <div key={ev.id} style={{
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.04)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'var(--green-dim)', border: '1px solid var(--border-g)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--green)', fontSize: 15, flexShrink: 0,
                }}>
                  <RiCalendarEventLine />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{ev.attendingCount} attending</div>
                </div>
                <span className={`badge ${ev.status === 'suspended' ? 'badge-red' : 'badge-green'}`}>
                  {ev.status === 'suspended' ? 'Suspended' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Users</span>
            <button className="btn btn-ghost-sm" onClick={() => navigate('/superadmin/users')}>
              View all <RiArrowRightLine size={12} />
            </button>
          </div>
          <div>
            {recentUsers.length === 0 ? (
              <div className="empty-state"><RiGroupLine size={28} />No users yet</div>
            ) : recentUsers.map(u => {
              const initials = (u.displayName || u.email || 'U').slice(0, 2).toUpperCase()
              return (
                <div key={u.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.04)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #0dc75e, #0a9444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#000',
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.displayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted2)' }}>
                    <RiTimeLine size={11} />{timeAgo(u.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Reports</span>
            <button className="btn btn-ghost-sm" onClick={() => navigate('/superadmin/reports')}>
              View all <RiArrowRightLine size={12} />
            </button>
          </div>
          <div>
            {recentReports.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <RiCheckLine size={28} style={{ color: 'var(--green)' }} />
                <span>No reports filed</span>
              </div>
            ) : recentReports.map(r => (
              <div key={r.id} style={{
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.04)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--red)', fontSize: 15,
                }}><RiAlertLine /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.eventName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</div>
                </div>
                <span className={`badge ${r.status === 'resolved' ? 'badge-green' : r.status === 'dismissed' ? 'badge-gray' : 'badge-red'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .overview-3col { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 700px) {
          .overview-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}