import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import { useEvent } from '../../context/Eventcontext'
import {
  BarChart3, Users, CheckCircle2, Clock, XCircle,
  TrendingUp, CalendarDays, Music2, Wallet, Star,
  Download, RefreshCw, Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  id: string
  performerName?: string
  status?: string
  submittedAt?: any
  category?: string
  actType?: string
  songSearch?: string
  songs?: any[]
  [key: string]: any
}

interface TicketDoc {
  name?: string
  price?: number
  quantity?: number
  sold?: number
  isFree?: boolean
  color?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const glass = (accent = 'rgba(255,255,255,0.07)'): React.CSSProperties => ({
  background: 'rgba(12,17,35,0.8)',
  border: `1px solid ${accent}`,
  borderRadius: 16,
  padding: '20px 22px',
})

const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
  letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14,
}

const BAR_COLORS = ['#22C55E', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4']

// Mini sparkline SVG
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Donut
function Donut({ segments, label, value }: { segments: { pct: number; color: string }[]; label: string; value: number }) {
  const r = 44, circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={13} />
        {segments.map((seg, i) => {
          const dash = seg.pct * circ
          const el = (
            <circle key={i} cx={55} cy={55} r={r} fill="none"
              stroke={seg.color} strokeWidth={13}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset * circ}
              transform="rotate(-90 55 55)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )
          offset += seg.pct
          return el
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{value}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading: metaLoading } = useEvent()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [tickets, setTickets]         = useState<TicketDoc[]>([])
  const [eventData, setEventData]     = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey]   = useState(0)

  // Load event doc
  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(s => {
      if (s.exists()) setEventData(s.data())
    })
  }, [eventId])

  // Real-time listeners
  useEffect(() => {
    if (!eventId) return
    setLoading(true)

    const u1 = onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)))
      setLastUpdated(new Date())
      setLoading(false)
    })

    const u2 = onSnapshot(collection(db, 'events', eventId, 'tickets'), snap => {
      setTickets(snap.docs.map(d => d.data() as TicketDoc))
    })

    return () => { u1(); u2() }
  }, [eventId, refreshKey])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const total    = submissions.length
  const approved = submissions.filter(s => s.status === 'approved').length
  const pending  = submissions.filter(s => s.status === 'pending').length
  const rejected = submissions.filter(s => s.status === 'rejected').length
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  // Revenue from tickets
  const totalRevenue = tickets.reduce((a, t) => a + (t.isFree ? 0 : (t.price ?? 0) * (t.sold ?? 0)), 0)
  const ticketsSold  = tickets.reduce((a, t) => a + (t.sold ?? 0), 0)
  const ticketCapacity = tickets.reduce((a, t) => a + (t.quantity ?? 0), 0)

  // Days until event
  const daysUntil = eventData?.date
    ? Math.max(0, Math.ceil((new Date(eventData.date).getTime() - Date.now()) / 86400000))
    : null

  // Submissions over last 14 days
  const now = Date.now()
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000)
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999)
    const count = submissions.filter(s => {
      if (!s.submittedAt?.toDate) return false
      const t = s.submittedAt.toDate().getTime()
      return t >= dayStart.getTime() && t <= dayEnd.getTime()
    }).length
    return { label, count }
  })
  const maxDay = Math.max(...days14.map(d => d.count), 1)

  // Song breakdown (most submitted songs)
  const songMap: Record<string, number> = {}
  submissions.forEach(s => {
    const title = s.songSearch || s.songs?.[0]?.title || null
    if (title) songMap[title] = (songMap[title] || 0) + 1
  })
  const topSongs = Object.entries(songMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxSong  = topSongs[0]?.[1] ?? 1

  // Performer breakdown by status
  const statusSegments = [
    { label: 'Approved', value: approved, color: '#22C55E' },
    { label: 'Pending',  value: pending,  color: '#F59E0B' },
    { label: 'Rejected', value: rejected, color: '#F87171' },
  ]
  const donutSegments = statusSegments.map(s => ({
    pct: total > 0 ? s.value / total : 0,
    color: s.color,
  }))

  // Recent submissions
  const recentSubs = [...submissions]
    .filter(s => s.submittedAt?.toDate)
    .sort((a, b) => (b.submittedAt?.seconds ?? 0) - (a.submittedAt?.seconds ?? 0))
    .slice(0, 6)

  const fmtTime = (ts: any) => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }

  const sparkline = days14.slice(-7).map(d => d.count)
  const secondsAgo = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000) : null

  const col2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,420px),1fr))', gap: 16 }

  return (
    <DashboardLayout
      eventType={eventType ?? 'custom'}
      eventId={eventId}
      enabledModules={enabledModules}
      metaLoading={metaLoading}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ background: 'rgba(6,182,212,0.12)', borderRadius: 12, padding: '8px 9px', display: 'flex' }}>
                <BarChart3 size={20} color="#06B6D4" />
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                Analytics
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Event performance and submission metrics
            </p>
            {secondsAgo !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  Last updated {secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.round(secondsAgo / 60)}m ago`}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <Download size={14} /> Export
            </button>
            <button onClick={() => setRefreshKey(k => k + 1)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,200px),1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Submissions', value: total,           icon: <Users size={16} />,          color: '#6366F1', bg: 'rgba(99,102,241,0.15)',  trend: `+${total}`, sparkline },
            { label: 'Approved',          value: approved,        icon: <CheckCircle2 size={16} />,   color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   trend: `${approvalRate}%`, sparkline: sparkline.map(v => Math.round(v * approvalRate / 100)) },
            { label: 'Pending Review',    value: pending,         icon: <Clock size={16} />,          color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  trend: undefined },
            { label: 'Rejected',          value: rejected,        icon: <XCircle size={16} />,        color: '#F87171', bg: 'rgba(248,113,113,0.15)', trend: undefined },
            { label: 'Approval Rate',     value: `${approvalRate}%`, icon: <TrendingUp size={16} />, color: '#14B8A6', bg: 'rgba(20,184,166,0.15)',  trend: undefined },
            { label: 'Tickets Sold',      value: ticketsSold,     icon: <Star size={16} />,           color: '#818CF8', bg: 'rgba(129,140,248,0.15)', trend: undefined },
            { label: 'Revenue',           value: `₦${totalRevenue.toLocaleString()}`, icon: <Wallet size={16} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', trend: undefined },
            { label: 'Days to Event',     value: daysUntil !== null ? daysUntil : '—', icon: <CalendarDays size={16} />, color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', trend: undefined },
          ].map((k, i) => (
            <div key={i} style={{ ...glass(), border: `1px solid ${k.color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                  {k.icon}
                </div>
                {k.sparkline && <Sparkline data={k.sparkline} color={k.color} />}
              </div>
              <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{k.label}</div>
              {k.trend && (
                <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, marginTop: 4 }}>↑ {k.trend}</div>
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', padding: '48px 0', justifyContent: 'center' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Loading analytics...
          </div>
        ) : (
          <>
            {/* ── Submissions over time + Status breakdown ── */}
            <div style={{ ...col2, marginBottom: 16 }}>

              {/* Bar chart */}
              <div style={glass()}>
                <div style={LABEL}>Submissions over time (14 days)</div>
                {total === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '24px 0' }}>No submissions yet.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 110 }}>
                      {days14.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                          title={`${d.label}: ${d.count}`}>
                          <div style={{
                            width: '100%',
                            background: d.count > 0 ? 'linear-gradient(180deg,#6366F1,#22C55E)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '3px 3px 0 0',
                            height: `${(d.count / maxDay) * 100}%`,
                            minHeight: d.count > 0 ? 4 : 2,
                            transition: 'height 0.4s ease',
                          }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{days14[0]?.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{days14[days14.length - 1]?.label}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Status donut */}
              <div style={glass()}>
                <div style={LABEL}>Status breakdown</div>
                {total === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '24px 0' }}>No submissions yet.</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <Donut segments={donutSegments} label="Total" value={total} />
                    <div style={{ flex: 1, minWidth: 120 }}>
                      {statusSegments.map(s => (
                        <div key={s.label} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                              {s.label}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                              {s.value} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>({total > 0 ? Math.round((s.value / total) * 100) : 0}%)</span>
                            </span>
                          </div>
                          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${total > 0 ? (s.value / total) * 100 : 0}%`, background: s.color, borderRadius: 4, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Approval rate</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-display)' }}>{approvalRate}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Song breakdown + Ticket performance ── */}
            <div style={{ ...col2, marginBottom: 16 }}>

              {/* Top songs */}
              <div style={glass()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Music2 size={14} color="#818CF8" />
                  <div style={LABEL}>Top submitted songs</div>
                </div>
                {topSongs.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '16px 0' }}>No songs submitted yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topSongs.map(([title, count], i) => (
                      <div key={title}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{title}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: BAR_COLORS[i % BAR_COLORS.length] }}>{count}</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round((count / maxSong) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket performance */}
              <div style={glass()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Wallet size={14} color="#F59E0B" />
                  <div style={LABEL}>Ticket performance</div>
                </div>
                {tickets.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '16px 0' }}>No tickets set up yet.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                      {tickets.map((t, i) => {
                        const pct = t.quantity ? Math.round(((t.sold ?? 0) / t.quantity) * 100) : 0
                        const rev = (t.isFree ? 0 : (t.price ?? 0)) * (t.sold ?? 0)
                        return (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color ?? BAR_COLORS[i % BAR_COLORS.length], display: 'inline-block' }} />
                                {t.name ?? `Ticket ${i + 1}`}
                              </span>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                {t.sold ?? 0}/{t.quantity ?? 0} sold · <span style={{ color: '#F59E0B', fontWeight: 700 }}>₦{rev.toLocaleString()}</span>
                              </span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: t.color ?? BAR_COLORS[i % BAR_COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{pct}% sold</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: '#F59E0B' },
                        { label: 'Tickets Sold',  value: `${ticketsSold} / ${ticketCapacity}`, color: '#22C55E' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Capacity + Recent submissions ── */}
            <div style={{ ...col2, marginBottom: 16 }}>

              {/* Capacity */}
              <div style={glass()}>
                <div style={LABEL}>Submission capacity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Submissions received', value: total, max: eventData?.maxPerformers ?? 50, color: '#22C55E' },
                    { label: 'Spots remaining', value: Math.max(0, (eventData?.maxPerformers ?? 50) - total), max: eventData?.maxPerformers ?? 50, color: '#6366F1' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}/{item.max}</span>
                      </div>
                      <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (item.value / item.max) * 100)}%`, background: item.color, borderRadius: 4, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Capacity used</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#6366F1', fontFamily: 'var(--font-display)' }}>
                      {eventData?.maxPerformers ? Math.round((total / eventData.maxPerformers) * 100) : 0}%
                    </div>
                  </div>
                  {daysUntil !== null && (
                    <div style={{ padding: '12px 14px', background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Days to event</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#06B6D4', fontFamily: 'var(--font-display)' }}>{daysUntil}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent submissions */}
              <div style={glass()}>
                <div style={LABEL}>Recent submissions</div>
                {recentSubs.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '16px 0' }}>No submissions yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentSubs.map((s, i) => {
                      const name = s.performerName ?? 'Performer'
                      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                      const statusColor = s.status === 'approved' ? '#22C55E' : s.status === 'rejected' ? '#F87171' : '#F59E0B'
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,#6366F1,#22C55E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.songSearch ?? s.songs?.[0]?.title ?? '—'}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: statusColor, fontWeight: 700, textTransform: 'capitalize',
                              background: `${statusColor}18`, borderRadius: 6, padding: '2px 7px' }}>
                              {s.status ?? 'pending'}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{fmtTime(s.submittedAt)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  )
}