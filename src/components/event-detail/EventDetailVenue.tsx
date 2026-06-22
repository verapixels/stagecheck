// ─── EventDetailVenue.tsx ─────────────────────────────────────────────────────
// Venue card: venue name + address + transport links + embedded map
// Bottom: "Get Directions" + "Open in Google Maps" buttons

import {
  RiMapPin2Line, RiCarLine, RiBusLine, RiWalkLine, RiExternalLinkLine,
} from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'

interface Props {
  event: EventData
  mapsEmbedUrl: string
}

export default function EventDetailVenue({ event, mapsEmbedUrl }: Props) {
  if (!event.venue || event.locationType === 'online') return null

  const mapsQuery = encodeURIComponent(event.address || event.venue || '')
  const mapsLink = `https://maps.google.com?q=${mapsQuery}`

  return (
    <div className="ed-card" style={{ marginBottom: 14 }}>
      <div className="ed-section-label">
        <RiMapPin2Line size={13} /> Venue
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

        {/* ── Left: text info */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4,
          }}>
            {event.venue}
          </div>

          {event.address && (
            <div style={{
              fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.6, marginBottom: 18,
            }}>
              {event.address}
            </div>
          )}

          {/* Transport options */}
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: 10,
          }}>
            How to get there
          </div>

          {[
            { label: 'Driving',          icon: <RiCarLine size={14} />,  mode: 'driving' },
            { label: 'Public Transport', icon: <RiBusLine size={14} />,  mode: 'transit' },
            { label: 'Walking',          icon: <RiWalkLine size={14} />, mode: 'walking' },
          ].map(({ label, icon, mode }) => (
            <a
              key={label}
              href={`https://maps.google.com?q=${mapsQuery}&mode=${mode}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                fontSize: 13, color: 'var(--text-secondary)',
                textDecoration: 'none', marginBottom: 11,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <span style={{ color: 'var(--green)' }}>{icon}</span>
              {label}
            </a>
          ))}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <a
              href={mapsLink} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9, padding: '9px 16px',
                color: '#fff', fontSize: 12, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              Get Directions
            </a>
            <a
              href={mapsLink} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(13,199,94,0.08)',
                border: '1px solid rgba(13,199,94,0.22)',
                borderRadius: 9, padding: '9px 16px',
                color: 'var(--green)', fontSize: 12, fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <RiExternalLinkLine size={12} /> Open in Google Maps
            </a>
          </div>
        </div>

        {/* ── Right: embedded map */}
        <div style={{
          flex: 1, minWidth: 200,
          height: 230, borderRadius: 14,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(13,199,94,0.15)',
          position: 'relative',
        }}>
          {mapsEmbedUrl ? (
            <iframe
              className="ed-maps-iframe"
              src={mapsEmbedUrl}
              title={`Map of ${event.venue}`}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 10,
            }}>
              <RiMapPin2Line size={28} color="rgba(13,199,94,0.3)" />
              <div style={{
                fontSize: 12, color: 'rgba(255,255,255,0.3)',
                textAlign: 'center', padding: '0 20px',
              }}>
                {event.venue}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}