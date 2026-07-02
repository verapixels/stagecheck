// src/components/EventAnalytics/TicketSalesDonut.tsx
import type { EventStats } from './Types'
import { pct } from './Analytics.utils'

interface Props {
  stats: EventStats[]
}

const PALETTE = ['#22C55E', '#3B82F6', '#8B5CF6', '#6366F1', '#F59E0B', '#EC4899', '#14B8A6']

export default function TicketSalesDonut({ stats }: Props) {
  const sorted = [...stats].filter(s => s.ticketsSold > 0).sort((a, b) => b.ticketsSold - a.ticketsSold)
  const top = sorted.slice(0, 5)
  const othersTotal = sorted.slice(5).reduce((s, e) => s + e.ticketsSold, 0)
  const total = sorted.reduce((s, e) => s + e.ticketsSold, 0)

  const slices = [
    ...top.map((s, i) => ({ label: s.event.name, value: s.ticketsSold, color: PALETTE[i % PALETTE.length] })),
    ...(othersTotal > 0 ? [{ label: 'Others', value: othersTotal, color: 'rgba(255,255,255,0.15)' }] : []),
  ]

  const radius = 70
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: '0 0 18px' }}>
        Ticket Sales by Event
      </h3>

      {total === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No tickets sold yet.
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
            <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {slices.map((s, i) => {
                const dash = (s.value / total) * circumference
                const el = (
                  <circle
                    key={i}
                    cx={90} cy={90} r={radius}
                    fill="none" stroke={s.color} strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                  />
                )
                offset += dash
                return el
              })}
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#fff' }}>
                {total.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Total Tickets</div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slices.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}
                </span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{pct(s.value, total)}%</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', minWidth: 40, textAlign: 'right' }}>{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}