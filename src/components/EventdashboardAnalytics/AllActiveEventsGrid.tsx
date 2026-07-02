// src/components/EventAnalytics/AllActiveEventsGrid.tsx
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { EventStats } from './Types'
import { formatNaira, formatShortDate } from './Analytics.utils'

interface Props {
  stats: EventStats[]
}

export default function AllActiveEventsGrid({ stats }: Props) {
  const navigate = useNavigate()
  const active = stats.filter(s => s.event.status === 'active')

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>
          All Active Events ({active.length})
        </h3>
      </div>

      {active.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No active events right now.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {active.map(s => (
            <div
              key={s.event.id}
              onClick={() => navigate(`/manage/event/${s.event.id}/analytics`)}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              }}
            >
              <div style={{
                height: 100, position: 'relative',
                background: s.event.coverImage
                  ? `url(${s.event.coverImage}) center/cover`
                  : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))',
              }}>
                <span style={{
                  position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 700,
                  background: 'rgba(34,197,94,0.9)', color: '#0B1020', padding: '3px 8px', borderRadius: 6,
                }}>
                  Active
                </span>
              </div>
              <div style={{ padding: 13 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.event.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 1 }}>
                  {formatShortDate(s.event.date)}
                </div>
                {s.event.location && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <MapPin size={10} /> {s.event.location}
                  </div>
                )}

                <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, s.soldPercent)}%`, background: '#22C55E', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  <span>{s.ticketsSold} / {s.ticketCapacity || '—'} Sold</span>
                  <span>{formatNaira(s.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}