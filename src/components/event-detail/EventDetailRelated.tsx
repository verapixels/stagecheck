// ─── EventDetailRelated.tsx ───────────────────────────────────────────────────
// "You May Also Like" — horizontal scrolling cards with:
// Cover image (top, full-width) + heart icon overlay + event type badge
// Event name, date, venue, "From ₦X,XXX" price line below image

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiCalendarEventLine, RiMapPinLine,
  RiHeartLine, RiArrowRightLine,
} from 'react-icons/ri'
import type { EventData, TicketType } from './eventDetailTypes'
import { formatDateShort, getEventTypeLabel } from './eventDetailHelpers'

interface Props {
  events: EventData[]
  getMinPrice?: (eventId: string) => number | null
}

export default function EventDetailRelated({ events, getMinPrice }: Props) {
  const navigate = useNavigate()
  const rowRef = useRef<HTMLDivElement>(null)

  if (events.length === 0) return null

  const scrollRight = () => {
    rowRef.current?.scrollBy({ left: 240, behavior: 'smooth' })
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 3,
          }}>
            You May Also Like
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            More events you may enjoy
          </div>
        </div>
        <span style={{
          fontSize: 12, color: 'var(--green)',
          fontWeight: 600, cursor: 'pointer',
        }}>
          View All
        </span>
      </div>

      {/* Scrollable row */}
      <div style={{ position: 'relative' }}>
        <div
          ref={rowRef}
          style={{
            display: 'flex', gap: 14,
            overflowX: 'auto', paddingBottom: 6,
            scrollbarWidth: 'none',
          }}
        >
          {events.map(ev => {
            const minP = getMinPrice?.(ev.id)

            return (
              <div
                key={ev.id}
                className="ed-related-card"
                onClick={() => navigate(`/event/${ev.id}`)}
              >
                {/* Cover image */}
                <div style={{
                  width: '100%', height: 130, position: 'relative',
                  background: ev.coverImage
                    ? 'transparent'
                    : 'linear-gradient(135deg, #1a0a2e, #3b1d7a)',
                  overflow: 'hidden',
                }}>
                  {ev.coverImage ? (
                    <img
                      src={ev.coverImage} alt={ev.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <RiCalendarEventLine size={28} color="rgba(255,255,255,0.1)" />
                    </div>
                  )}

                  {/* Gradient overlay at bottom */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 60,
                    background: 'linear-gradient(to top, rgba(13,18,32,0.95), transparent)',
                  }} />

                  {/* Event type badge */}
                  {ev.eventType && (
                    <div style={{
                      position: 'absolute', bottom: 8, left: 10,
                      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
                      fontSize: 9, fontWeight: 700, color: 'var(--green)',
                      padding: '3px 8px', borderRadius: 5,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {getEventTypeLabel(ev.eventType)}
                    </div>
                  )}

                  {/* Heart */}
                  <button
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: 9, right: 9,
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#fff',
                    }}
                  >
                    <RiHeartLine size={14} />
                  </button>
                </div>

                {/* Text content */}
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    marginBottom: 8, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {ev.name}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: 'rgba(255,255,255,0.45)',
                    marginBottom: 5,
                  }}>
                    <RiCalendarEventLine size={11} color="var(--green)" />
                    {formatDateShort(ev.date)}
                  </div>

                  {ev.venue && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12, color: 'rgba(255,255,255,0.38)',
                      marginBottom: 10,
                    }}>
                      <RiMapPinLine size={11} color="var(--green)" />
                      <span style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ev.venue}
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  {minP !== null && minP !== undefined && (
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: minP === 0 ? 'var(--green)' : '#fff',
                    }}>
                      {minP === 0 ? 'Free' : `From ₦${minP.toLocaleString()}`}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Scroll arrow */}
        {events.length > 2 && (
          <button
            onClick={scrollRight}
            style={{
              position: 'absolute', right: -6, top: '35%',
              transform: 'translateY(-50%)',
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(13,199,94,0.12)',
              border: '1px solid rgba(13,199,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--green)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <RiArrowRightLine size={16} />
          </button>
        )}
      </div>
    </div>
  )
}