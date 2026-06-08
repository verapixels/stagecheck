import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import { BarChart3, TrendingUp, Users, CheckCircle2, Clock, CalendarDays, Loader2 } from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

interface Submission {
  id: string
  status: string
  submittedAt?: any
  category?: string
  actType?: string
  [key: string]: any
}

export default function AnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>()
const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [eventData, setEventData]     = useState<any>(null)
  const [loading, setLoading]         = useState(true)


  // ── Derived stats ──────────────────────────────────────────────
  const total    = submissions.length
  const approved = submissions.filter(s => s.status === 'approved').length
  const pending  = submissions.filter(s => s.status === 'pending').length
  const rejected = submissions.filter(s => s.status === 'rejected').length
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  // Days until event
  const daysUntil = eventData?.date
    ? Math.max(0, Math.ceil((new Date(eventData.date).getTime() - Date.now()) / 86400000))
    : null

  // Submissions per day (last 14 days)
  const now = Date.now()
  const days14: { label: string; count: number }[] = Array.from({ length: 14 }, (_, i) => {
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

  // Category breakdown
  const catMap: Record<string, number> = {}
  submissions.forEach(s => {
    const cat = s.category || s.actType || s.eventType || 'Other'
    catMap[cat] = (catMap[cat] || 0) + 1
  })
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const maxCat = Math.max(...categories.map(c => c[1]), 1)

  // Status breakdown for donut
  const statusData = [
    { label: 'Approved', value: approved, color: '#22C55E' },
    { label: 'Pending',  value: pending,  color: '#F59E0B' },
    { label: 'Rejected', value: rejected, color: '#F87171' },
  ]

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 22px',
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14,
  }

  const BAR_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  return (
     <DashboardLayout
  plan="starter"
  eventType={eventType ?? 'custom'}
  eventId={eventId}
  enabledModules={enabledModules}
>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <BarChart3 size={20} color="#06B6D4" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
            Analytics
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          Event performance and submission metrics
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }} className="kpi-grid">
        {[
          { label: 'Total Submissions', value: total,           icon: <Users size={16} />,        color: '#fff'    },
          { label: 'Approval Rate',     value: `${approvalRate}%`, icon: <TrendingUp size={16} />, color: '#22C55E' },
          { label: 'Pending Review',    value: pending,          icon: <Clock size={16} />,        color: '#F59E0B' },
          { label: 'Days to Event',     value: daysUntil !== null ? daysUntil : '—', icon: <CalendarDays size={16} />, color: '#06B6D4' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ color: k.color, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '32px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading analytics...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="charts-grid">

          {/* Submissions over time */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Submissions over time (14 days)</div>
            {total === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '24px 0' }}>No submissions yet.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                {days14.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', background: d.count > 0 ? '#22C55E' : 'rgba(255,255,255,0.06)', borderRadius: '3px 3px 0 0', height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? 4 : 0, transition: 'height 0.3s' }} title={`${d.label}: ${d.count}`} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{days14[0]?.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{days14[days14.length - 1]?.label}</span>
            </div>
          </div>

          {/* Status breakdown */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Status breakdown</div>
            {total === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '24px 0' }}>No submissions yet.</div>
            ) : (
              <>
                {statusData.map((s, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>({total > 0 ? Math.round((s.value / total) * 100) : 0}%)</span></span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${total > 0 ? (s.value / total) * 100 : 0}%`, background: s.color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Overall approval rate</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-display)' }}>{approvalRate}%</div>
                </div>
              </>
            )}
          </div>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div style={cardStyle}>
              <div style={sectionLabel}>Category breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map(([cat, count], i) => (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{cat}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: BAR_COLORS[i % BAR_COLORS.length] }}>{count}</span>
                    </div>
                    <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${(count / maxCat) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion rate */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Submission completion</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Submissions received', value: total,    max: eventData?.maxPerformers ?? 50, color: '#22C55E' },
                { label: 'Spots remaining',      value: Math.max(0, (eventData?.maxPerformers ?? 50) - total), max: eventData?.maxPerformers ?? 50, color: '#3B82F6' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}/{item.max}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${(item.value / item.max) * 100}%`, background: item.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 4, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Capacity used</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {eventData?.maxPerformers ? Math.round((total / eventData.maxPerformers) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}