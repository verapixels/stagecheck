// ─── TicketingHeader.tsx ───────────────────────────────────────────────────
// Breadcrumb ("Home > Events > [Event] > Get Tickets") + event title block
// with date/time/venue meta row and share. Only uses fields confirmed to
// exist on the real EventData (name, date, startTime, venue, address) —
// no eventType/goingCount/rating/reviewCount, since those aren't on the
// schema used by EventDetailPage.tsx. Add them back here later if/when you
// add those fields to Firestore.

import {
  RiCalendarLine, RiTimeLine, RiMapPin2Line, RiShareLine, RiVerifiedBadgeFill,
} from 'react-icons/ri'
import type { EventData } from './ticketingTypes'
import { formatDate, formatTime } from '../event-detail/eventDetailHelpers'

interface Props {
  event: EventData
  onShare: () => void
  copied: boolean
}

export default function TicketingHeader({ event, onShare, copied }: Props) {
  return (
    <div className="tk-fade-in">
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: 'var(--text-dim)', marginBottom: 20,
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

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
          {event.name}
        </h1>
        <RiVerifiedBadgeFill size={22} color="var(--green)" />
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap',
        fontSize: 14.5, color: 'var(--text-muted)', marginBottom: 18,
      }}>
        {event.date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <RiCalendarLine size={16} color="var(--green)" /> {formatDate(event.date)}
          </span>
        )}
        {event.startTime && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <RiTimeLine size={16} color="var(--green)" /> {formatTime(event.startTime)}
          </span>
        )}
        {(event.venue || event.address) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <RiMapPin2Line size={16} color="var(--green)" /> {event.venue || event.address}
            {event.address && (
              <a href={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--green)', fontWeight: 600, marginLeft: 4 }}>
                View on Map
              </a>
            )}
          </span>
        )}
      </div>

      {/* Share */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <button onClick={onShare} className="tk-btn-outline" style={{ padding: '7px 14px', fontSize: 13.5 }}>
          <RiShareLine size={14} /> {copied ? 'Link Copied!' : 'Share Event'}
        </button>
      </div>
    </div>
  )
}