// ─── EventDetailHero.tsx ─────────────────────────────────────────────────────
import {
  RiCalendarEventLine, RiTimeLine, RiMapPinLine,
  RiGroupLine, RiShareLine, RiHeartLine, RiHeartFill,
  RiStarFill, RiVerifiedBadgeLine,
} from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'
import { formatDateShort, formatTime, getEventTypeLabel, formatAttendingCount } from './eventDetailHelpers'

interface Props {
  event: EventData
  heroImg: string
  liked: boolean
  copied: boolean
  onLike: () => void
  onShare: () => void
}

export default function EventDetailHero({
  event, heroImg, liked, copied, onLike, onShare,
}: Props) {
  const eventTypeLabel = getEventTypeLabel(event.eventType || '')

  return (
    <div style={{
      position: 'relative',
      borderRadius: 18,
      overflow: 'hidden',
      minHeight: 500,
      height: '100%',
    }}>
      {/* Cover image */}
      {heroImg ? (
        <img
          src={heroImg}
          alt={event.name}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            position: 'absolute', inset: 0,
            minHeight: 500,
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0a1628 0%, #1a0a2e 50%, #0a1a0a 100%)',
        }} />
      )}

      {/* Dark gradient overlay — heavy at bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(6,8,16,1) 0%, rgba(6,8,16,0.55) 40%, rgba(6,8,16,0.05) 100%)',
      }} />

      {/* Spacer so the card has height */}
      <div style={{ minHeight: 500, position: 'relative' }} />

      {/* Top-left event type badges */}
      <div
        className="ed-hero-anim ed-delay-1"
        style={{
          position: 'absolute', top: 20, left: 24,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(13,199,94,0.18)',
          border: '1px solid rgba(13,199,94,0.35)',
          borderRadius: 100, padding: '5px 12px 5px 8px',
        }}>
          <span className="live-dot" />
          <span style={{
            fontSize: 11, color: 'var(--green)', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {eventTypeLabel}
          </span>
        </div>
        {event.eventType && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 100, padding: '5px 12px',
          }}>
            <span style={{ fontSize: 10 }}>🎵</span>
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Music Concert
            </span>
          </div>
        )}
      </div>

      {/* Top-right: Save button */}
      <button
        onClick={onLike}
        style={{
          position: 'absolute', top: 20, right: 20,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 100, padding: '8px 16px',
          color: liked ? '#f87171' : '#fff',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {liked ? <RiHeartFill size={14} /> : <RiHeartLine size={14} />}
        {liked ? 'Saved' : 'Save Event'}
      </button>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 clamp(20px,5%,32px) 32px',
      }}>
        {/* Event name */}
        <h1
          className="ed-hero-title ed-hero-anim ed-delay-2"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(28px,4.5vw,54px)',
            fontWeight: 900, lineHeight: 1.02,
            letterSpacing: '-1.5px', marginBottom: 10,
            color: '#fff',
          }}
        >
          {event.name}
          {event.status === 'active' && (
            <RiVerifiedBadgeLine
              size={26} color="var(--green)"
              style={{ marginLeft: 10, verticalAlign: 'middle' }}
            />
          )}
        </h1>

        {/* Subtitle / summary */}
        {event.summary && (
          <p
            className="ed-hero-anim ed-delay-2"
            style={{
              fontSize: 14, color: 'rgba(255,255,255,0.7)',
              marginBottom: 16, lineHeight: 1.5,
            }}
          >
            {event.summary}
          </p>
        )}

        {/* Date / Time / Venue pills */}
        <div
          className="ed-hero-anim ed-delay-3"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginBottom: 18 }}
        >
          {event.date && (
            <span className="ed-tag-pill">
              <RiCalendarEventLine size={13} color="var(--green)" />
              {formatDateShort(event.date)}
            </span>
          )}
          {event.startTime && (
            <span className="ed-tag-pill">
              <RiTimeLine size={13} color="var(--green)" />
              {formatTime(event.startTime)} GMT+1
            </span>
          )}
          {event.venue && (
            <span className="ed-tag-pill">
              <RiMapPinLine size={13} color="var(--green)" />
              {event.venue}
              {event.address ? `, ${event.address.split(',').slice(-1)[0].trim()}` : ''}
            </span>
          )}
        </div>

        {/* Attending + Rating + Share */}
        <div
          className="ed-hero-anim ed-delay-4"
          style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}
        >
          {(event.attendingCount || 0) > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 13, color: 'var(--text-secondary)',
            }}>
              <RiGroupLine size={15} color="var(--green)" />
              <span style={{ fontWeight: 700, color: '#fff' }}>
                {formatAttendingCount(event.attendingCount!)}+
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>Going</span>
            </div>
          )}

          {event.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <RiStarFill size={14} color="#fbbf24" />
              <span style={{ fontWeight: 700, color: '#fff' }}>
                {event.rating.toFixed(1)}
              </span>
              {event.reviewCount && (
                <span style={{ color: 'var(--text-tertiary)' }}>
                  ({event.reviewCount.toLocaleString()} Reviews)
                </span>
              )}
            </div>
          )}

          <button
            onClick={onShare}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, padding: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          >
            <RiShareLine size={15} />
            {copied ? 'Copied!' : 'Share Event'}
          </button>
        </div>
      </div>
    </div>
  )
}