// ─── TicketingHeader.tsx ───────────────────────────────────────────────────
// Breadcrumb + hero image card (left) + title/badges/meta block (right),
// matching the reference layout: image card, "LIVE IN CONCERT" tag, title
// + verified badge, then date/time/venue/going/rating row, then share row.

import {
  RiCalendarLine, RiTimeLine, RiMapPin2Line, RiShareLine, RiVerifiedBadgeFill,
  RiGroupLine, RiStarFill,
} from 'react-icons/ri'
import type { EventData } from './ticketingTypes'
import { formatDate, formatTime } from '../event-detail/eventDetailHelpers'

interface Props {
  event: EventData
  onShare: () => void
  copied: boolean
}

export default function TicketingHeader({ event, onShare, copied }: Props) {
  const heroImg = (event as any).coverImage || event.media?.find(m => m.type === 'image')?.url || ''
  const category = (event as any).category || (event as any).type || ''
  const goingCount = (event as any).goingCount
  const rating = (event as any).rating
  const reviewCount = (event as any).reviewCount

  return (
    <div className="tk-fade-in">
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, marginTop: 35, 
        flexWrap: 'wrap',
      }}>
        <a href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <a href="/events" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Events</a>
        <span>›</span>
        <a href={`/events/${event.id}`} style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
          {event.name}
        </a>
        <span>›</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>Get Tickets</span>
      </div>

      {/* Hero image + title block row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
        {heroImg && (
          <div style={{
            width: 160, height: 110, borderRadius: 14, overflow: 'hidden',
            flexShrink: 0, background: 'rgba(255,255,255,0.05)',
          }}>
            <img src={heroImg} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 220 }}>
          {category && (
            <span style={{
              display: 'inline-block', background: 'var(--green-soft)', color: 'var(--green)',
              fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 6, marginBottom: 8,
            }}>
              {category}
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              {event.name}
            </h1>
            <RiVerifiedBadgeFill size={20} color="var(--green)" />
          </div>

          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
            fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 12,
          }}>
            {event.date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiCalendarLine size={15} color="var(--green)" /> {formatDate(event.date)}
              </span>
            )}
            {event.startTime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiTimeLine size={15} color="var(--green)" /> {formatTime(event.startTime)}
              </span>
            )}
            {(event.venue || event.address) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiMapPin2Line size={15} color="var(--green)" /> {event.venue || event.address}
                {event.address && (
                  <a href={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--green)', fontWeight: 600, marginLeft: 2 }}>
                    View on Map
                  </a>
                )}
              </span>
            )}
          </div>

          {/* Social proof row + share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {goingCount != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-muted)' }}>
                <RiGroupLine size={15} /> {goingCount.toLocaleString()}+ Going
              </span>
            )}
            {rating != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-muted)' }}>
                <RiStarFill size={15} color="var(--gold)" /> {rating}
                {reviewCount != null && ` (${reviewCount} Reviews)`}
              </span>
            )}
            <button onClick={onShare} className="tk-btn-outline" style={{ padding: '6px 13px', fontSize: 13 }}>
              <RiShareLine size={13} /> {copied ? 'Link Copied!' : 'Share Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}