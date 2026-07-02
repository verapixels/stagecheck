// src/components/EventAnalytics/RevenueByEvent.tsx
import type { EventStats } from './Types'
import { formatNaira } from './Analytics.utils'

interface Props {
  stats: EventStats[]
}

const BAR_COLOR = '#22C55E'

export default function RevenueByEvent({ stats }: Props) {
  const sorted = [...stats].filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 7)
  const max = Math.max(1, ...sorted.map(s => s.revenue))

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: '0 0 18px' }}>
        Revenue by Event
      </h3>

      {sorted.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No revenue yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sorted.map(s => (
            <div key={s.event.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                  {s.event.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{formatNaira(s.revenue)}</span>
              </div>
              <div style={{ height: 7, borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(s.revenue / max) * 100}%`,
                  background: BAR_COLOR, borderRadius: 5, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}