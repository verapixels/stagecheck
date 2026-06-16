import { useEffect, useState, useCallback } from 'react'
import {
  collection, getDocs, query, where, orderBy,
  Timestamp, getCountFromServer, limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiLoader4Line, RiGroupLine, RiCalendarEventLine,
  RiBarChartLine, RiRefreshLine, RiTimeLine,
  RiArrowUpLine, RiArrowDownLine,
} from 'react-icons/ri'

type Range = '1h' | '3h' | '24h' | '7d' | '30d' | '1y' | 'custom'

interface DataPoint { label: string; value: number }

function getStart(range: Range, from?: string, to?: string): Date {
  const now = new Date()
  switch (range) {
    case '1h':  return new Date(now.getTime() - 3600000)
    case '3h':  return new Date(now.getTime() - 10800000)
    case '24h': return new Date(now.getTime() - 86400000)
    case '7d':  return new Date(now.getTime() - 604800000)
    case '30d': return new Date(now.getTime() - 2592000000)
    case '1y':  return new Date(now.getTime() - 31536000000)
    case 'custom': return from ? new Date(from) : new Date(now.getTime() - 86400000)
    default:    return new Date(now.getTime() - 86400000)
  }
}

function buildBuckets(range: Range, from?: string, to?: string): { starts: Date[]; labels: string[] } {
  const start = getStart(range, from, to)
  const end = to && range === 'custom' ? new Date(to) : new Date()
  const diff = end.getTime() - start.getTime()

  const starts: Date[] = []
  const labels: string[] = []

  let buckets: number
  let step: number

  if (range === '1h' || range === '3h') { buckets = 12; step = diff / 12 }
  else if (range === '24h') { buckets = 24; step = 3600000 }
  else if (range === '7d') { buckets = 7; step = 86400000 }
  else if (range === '30d') { buckets = 30; step = 86400000 }
  else { buckets = 12; step = diff / 12 }

  for (let i = 0; i < buckets; i++) {
    const d = new Date(start.getTime() + i * step)
    starts.push(d)
    if (range === '1h' || range === '3h' || range === '24h') {
      labels.push(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))
    } else if (range === '7d' || range === '30d') {
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    } else {
      labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
    }
  }
  return { starts, labels }
}

// Mini bar chart — pure SVG, no deps
function BarChart({ data, color = '#0dc75e', height = 160 }: { data: DataPoint[]; color?: string; height?: number }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 100
  const barW = W / data.length
  const pad = barW * 0.15

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
        <defs>
          <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 8)
          const x = i * barW + pad
          const y = height - barH
          const w = barW - pad * 2
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={w} height={barH}
                fill="url(#bgrad)" rx={w * 0.3}
                style={{ transition: 'height .4s cubic-bezier(.16,1,.3,1), y .4s cubic-bezier(.16,1,.3,1)' }}
              />
              <title>{d.label}: {d.value}</title>
            </g>
          )
        })}
        {/* Baseline */}
        <line x1="0" y1={height} x2={W} y2={height} stroke="rgba(255,255,255,.06)" strokeWidth="0.5" />
      </svg>
      {/* X labels — show every Nth */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, overflowX: 'hidden' }}>
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

const RANGES: { key: Range; label: string }[] = [
  { key: '1h', label: '1 Hour' },
  { key: '3h', label: '3 Hours' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '1y', label: '1 Year' },
  { key: 'custom', label: 'Custom' },
]

export default function AnalyticsAdmin() {
  const [range, setRange] = useState<Range>('24h')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(false)

  const [userSignups, setUserSignups] = useState<DataPoint[]>([])
  const [eventsCreated, setEventsCreated] = useState<DataPoint[]>([])
  const [totals, setTotals] = useState({ users: 0, events: 0, tickets: 0 })
  const [prevTotals, setPrevTotals] = useState({ users: 0, events: 0 })
  const [activeNow, setActiveNow] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const start = getStart(range, customFrom, customTo)
      const end = customTo && range === 'custom' ? new Date(customTo) : new Date()
      const { starts, labels } = buildBuckets(range, customFrom, customTo)
      const step = starts.length > 1 ? starts[1].getTime() - starts[0].getTime() : 3600000

      // Users who joined in range
      let userSnap
      try {
        const q = query(
          collection(db, 'users'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          orderBy('createdAt', 'asc')
        )
        userSnap = await getDocs(q)
      } catch {
        userSnap = await getDocs(collection(db, 'users'))
      }

      // Events created in range
      let evSnap
      try {
        const q = query(
          collection(db, 'events'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          orderBy('createdAt', 'asc')
        )
        evSnap = await getDocs(q)
      } catch {
        evSnap = await getDocs(collection(db, 'events'))
      }

      // Bucket user signups
      const userBuckets = starts.map((s, i) => {
        const bucketEnd = i < starts.length - 1 ? starts[i + 1].getTime() : end.getTime() + 1
        const count = userSnap.docs.filter(d => {
          const t = d.data().createdAt
          const dt = t?.toDate ? t.toDate().getTime() : t instanceof Date ? t.getTime() : 0
          return dt >= s.getTime() && dt < bucketEnd
        }).length
        return { label: labels[i], value: count }
      })

      const evBuckets = starts.map((s, i) => {
        const bucketEnd = i < starts.length - 1 ? starts[i + 1].getTime() : end.getTime() + 1
        const count = evSnap.docs.filter(d => {
          const t = d.data().createdAt
          const dt = t?.toDate ? t.toDate().getTime() : t instanceof Date ? t.getTime() : 0
          return dt >= s.getTime() && dt < bucketEnd
        }).length
        return { label: labels[i], value: count }
      })

      // Totals
      const [totalUsers, totalEvents] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'events')),
      ])

      let totalTickets = 0
      try {
        const ts = await getCountFromServer(collection(db, 'tickets'))
        totalTickets = ts.data().count
      } catch { }

      // Previous period for delta
      const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
      let prevUsersCount = 0, prevEventsCount = 0
      try {
        const q1 = query(collection(db, 'users'), where('createdAt', '>=', Timestamp.fromDate(prevStart)), where('createdAt', '<', Timestamp.fromDate(start)))
        const q2 = query(collection(db, 'events'), where('createdAt', '>=', Timestamp.fromDate(prevStart)), where('createdAt', '<', Timestamp.fromDate(start)))
        const [ps1, ps2] = await Promise.all([getDocs(q1), getDocs(q2)])
        prevUsersCount = ps1.size
        prevEventsCount = ps2.size
      } catch { }

      // Active "now" = users who logged activity in last 5 min (lastSeen field)
      let activeCount = 0
      try {
        const fiveMinAgo = new Date(Date.now() - 300000)
        const aq = query(collection(db, 'users'), where('lastSeen', '>=', Timestamp.fromDate(fiveMinAgo)))
        const aSnap = await getDocs(aq)
        activeCount = aSnap.size
      } catch { }

      setUserSignups(userBuckets)
      setEventsCreated(evBuckets)
      setTotals({ users: totalUsers.data().count, events: totalEvents.data().count, tickets: totalTickets })
      setPrevTotals({ users: prevUsersCount, events: prevEventsCount })
      setActiveNow(activeCount)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [range, customFrom, customTo])

  useEffect(() => { load() }, [load])

  const currentUsers = userSignups.reduce((a, b) => a + b.value, 0)
  const currentEvents = eventsCreated.reduce((a, b) => a + b.value, 0)

  function Delta({ current, prev }: { current: number; prev: number }) {
    if (prev === 0) return null
    const pct = Math.round(((current - prev) / prev) * 100)
    const up = pct >= 0
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: up ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 2 }}>
        {up ? <RiArrowUpLine size={11} /> : <RiArrowDownLine size={11} />}{Math.abs(pct)}% vs prev period
      </span>
    )
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Platform usage and growth trends</p>
        </div>
        <button className="btn btn-ghost-sm" onClick={load} disabled={loading}>
          <RiRefreshLine size={13} style={{ animation: loading ? 'spin .8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)} style={{
            padding: '7px 14px', borderRadius: 9, border: '1px solid',
            borderColor: range === r.key ? 'var(--border-g)' : 'var(--border)',
            background: range === r.key ? 'var(--green-dim)' : 'rgba(255,255,255,.03)',
            color: range === r.key ? 'var(--green)' : 'var(--muted)',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all .18s',
          }}>{r.label}</button>
        ))}
      </div>

      {/* Custom date picker */}
      {range === 'custom' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ width: 180 }} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ width: 180 }} />
          </div>
          <button className="btn btn-primary" onClick={load} disabled={!customFrom || !customTo}>Apply</button>
        </div>
      )}

      {/* Top tiles */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-tile" style={{ '--tc': '#0dc75e' } as React.CSSProperties}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-tile-icon"><RiGroupLine /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)' }}>
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.4s infinite', display: 'inline-block' }} />
              {activeNow} online now
            </div>
          </div>
          <div>
            <div className="stat-tile-val">{totals.users.toLocaleString()}</div>
            <div className="stat-tile-lbl">Total Users</div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>+{currentUsers} this period</span>
              <div><Delta current={currentUsers} prev={prevTotals.users} /></div>
            </div>
          </div>
        </div>

        <div className="stat-tile" style={{ '--tc': '#a78bfa' } as React.CSSProperties}>
          <div className="stat-tile-icon"><RiCalendarEventLine /></div>
          <div>
            <div className="stat-tile-val">{totals.events.toLocaleString()}</div>
            <div className="stat-tile-lbl">Total Events</div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>+{currentEvents} this period</span>
              <div><Delta current={currentEvents} prev={prevTotals.events} /></div>
            </div>
          </div>
        </div>

        <div className="stat-tile" style={{ '--tc': '#fbbf24' } as React.CSSProperties}>
          <div className="stat-tile-icon"><RiTimeLine /></div>
          <div>
            <div className="stat-tile-val">{totals.tickets.toLocaleString()}</div>
            <div className="stat-tile-lbl">Tickets Issued</div>
          </div>
        </div>

        <div className="stat-tile" style={{ '--tc': '#60a5fa' } as React.CSSProperties}>
          <div className="stat-tile-icon"><RiBarChartLine /></div>
          <div>
            <div className="stat-tile-val" style={{ fontSize: 22 }}>
              {totals.users > 0 ? ((currentUsers / totals.users) * 100).toFixed(1) : 0}%
            </div>
            <div className="stat-tile-lbl">User Growth This Period</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <RiLoader4Line size={28} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />
          Loading analytics...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* User signups chart */}
          <div className="card">
            <div className="card-head">
              <div>
                <span className="card-title">User Signups</span>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {currentUsers} new users in selected period
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--green)' }}>
                +{currentUsers}
              </span>
            </div>
            <div className="card-pad">
              <BarChart data={userSignups} color="#0dc75e" height={160} />
            </div>
          </div>

          {/* Events created chart */}
          <div className="card">
            <div className="card-head">
              <div>
                <span className="card-title">Events Created</span>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {currentEvents} new events in selected period
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#a78bfa' }}>
                +{currentEvents}
              </span>
            </div>
            <div className="card-pad">
              <BarChart data={eventsCreated} color="#a78bfa" height={160} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          .analytics-charts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}