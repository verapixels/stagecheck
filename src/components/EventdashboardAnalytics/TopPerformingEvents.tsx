// src/components/EventAnalytics/TopPerformingEvents.tsx
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { EventStats } from './Types'
import { formatNaira, formatShortDate } from './Analytics.utils'

interface Props {
  stats: EventStats[]
}

export default function TopPerformingEvents({ stats }: Props) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const top = [...stats].sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px', position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>
          Top Performing Events
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => scroll('left')} style={navBtnStyle}><ChevronLeft size={15} /></button>
          <button onClick={() => scroll('right')} style={navBtnStyle}><ChevronRight size={15} /></button>
        </div>
      </div>

      {top.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No event data yet.
        </div>
      ) : (
        <div ref={scrollRef} style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}>
          {top.map(s => (
            <div key={s.event.id} style={{
              minWidth: 250, maxWidth: 250, scrollSnapAlign: 'start',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, overflow: 'hidden', flexShrink: 0,
            }}>
              <div style={{
                height: 110, background: s.event.coverImage
                  ? `url(${s.event.coverImage}) center/cover`
                  : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))',
              }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.event.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  {formatShortDate(s.event.date)}
                </div>
                {s.event.location && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                    <MapPin size={10} /> {s.event.location}
                  </div>
                )}

                <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, s.soldPercent)}%`, background: '#22C55E', borderRadius: 4 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
                  <span>{s.ticketsSold.toLocaleString()} Sold</span>
                  <span>{formatNaira(s.revenue)}</span>
                  <span>{s.checkInPercent}% In</span>
                </div>

                <button
                  onClick={() => navigate(`/manage/event/${s.event.id}/analytics`)}
                  style={{
                    width: '100%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                    color: '#22C55E', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  View Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}