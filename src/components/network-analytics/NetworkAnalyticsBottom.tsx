import { CheckCircle, UserPlus } from 'lucide-react'

// ── Attendance Heatmap ────────────────────────────────────────────────────────

interface HeatmapProps {
  data: Record<string, number> // key: "Mon-10AM", value: count
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['8 AM', '12 PM', '4 PM', '8 PM']

export function AttendanceHeatmap({ data }: HeatmapProps) {
  const values = Object.values(data)
  const max = Math.max(...values, 1)

  const cellColor = (v: number) => {
    if (v === 0) return 'rgba(255,255,255,0.04)'
    const intensity = v / max
    if (intensity < 0.25) return 'rgba(34,197,94,0.15)'
    if (intensity < 0.5)  return 'rgba(34,197,94,0.35)'
    if (intensity < 0.75) return 'rgba(34,197,94,0.6)'
    return '#22C55E'
  }

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Attendance Heatmap</div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Today</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: '2px', minWidth: 200 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              {DAYS.map(d => <th key={d} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, textAlign: 'center', paddingBottom: 4 }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(h => (
              <tr key={h}>
                <td style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', paddingRight: 6, whiteSpace: 'nowrap' }}>{h}</td>
                {DAYS.map(d => {
                  const key = `${d}-${h}`
                  const v = data[key] ?? 0
                  return (
                    <td key={d} title={`${d} ${h}: ${v}`}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: cellColor(v) }} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Top Referrers ─────────────────────────────────────────────────────────────

interface ReferrerEntry { source: string; pct: number }

interface TopReferrersProps { referrers: ReferrerEntry[] }

export function TopReferrers({ referrers }: TopReferrersProps) {
  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Top Referrers</div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>This Week</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {referrers.map((r, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{r.source}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.pct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${r.pct}%`, background: 'linear-gradient(90deg,#6366F1,#22C55E)', borderRadius: 4 }} />
            </div>
          </div>
        ))}
        {referrers.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No referrer data yet</div>}
      </div>
    </div>
  )
}

// ── Recent Check-ins ──────────────────────────────────────────────────────────

interface CheckinEntry { name: string; time: string; initials: string }

interface RecentCheckinsProps { items: CheckinEntry[] }

export function RecentCheckins({ items }: RecentCheckinsProps) {
  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Recent Check-ins</div>
        <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>View All</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {item.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.time}</div>
            </div>
            <CheckCircle size={14} color="#22C55E" />
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>No check-ins yet</div>}
      </div>
    </div>
  )
}

// ── Latest Registrations ──────────────────────────────────────────────────────

interface RegEntry { name: string; time: string; initials: string }

interface LatestRegistrationsProps { items: RegEntry[] }

export function LatestRegistrations({ items }: LatestRegistrationsProps) {
  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Latest Registrations</div>
        <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>View All</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {item.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.time}</div>
            </div>
            <UserPlus size={14} color="#818CF8" />
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>No registrations yet</div>}
      </div>
    </div>
  )
}