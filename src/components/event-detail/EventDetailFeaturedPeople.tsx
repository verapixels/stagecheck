// ─── EventDetailFeaturedPeople.tsx ───────────────────────────────────────────
// "Featured People" card — circular artist avatars in a horizontal scroll row
// with name + role label below each (Headliner / Artist / etc.)
// Matches screenshot: Burna Boy (Headliner), Ayra Starr, Rema, Asake — all Artist

import { useRef } from 'react'
import { RiMusicLine, RiArrowRightLine, RiArrowLeftLine } from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'

interface Props {
  event: EventData
}

export default function EventDetailFeaturedPeople({ event }: Props) {
  const artists = event.featuredArtists || []
  const rowRef = useRef<HTMLDivElement>(null)

  if (artists.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: dir === 'right' ? 180 : -180, behavior: 'smooth' })
    }
  }

  return (
    <div className="ed-card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="ed-section-label" style={{ marginBottom: 0 }}>
          Featured People
        </div>
        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}>
          View All
        </span>
      </div>

      {/* Scrollable artist row */}
      <div style={{ position: 'relative' }}>
        <div
          ref={rowRef}
          style={{
            display: 'flex', gap: 18,
            overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {artists.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 10,
                flexShrink: 0, width: 80, cursor: 'pointer',
              }}
            >
              {/* Circular avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                overflow: 'hidden',
                border: '2.5px solid rgba(13,199,94,0.25)',
                background: 'rgba(168,139,250,0.08)',
                flexShrink: 0,
              }}>
                {a.image && !a.image.includes('2a96cbd8b46e442fc41c2b86b821562f') ? (
                  <img
                    src={a.image} alt={a.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      const img = e.currentTarget
                      img.onerror = null
                      // Try Wikipedia fallback
                      fetch(
                        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.name)}`,
                        { headers: { Accept: 'application/json' } }
                      )
                        .then(r => r.json())
                        .then(d => { if (d?.thumbnail?.source) img.src = d.thumbnail.source })
                        .catch(() => { img.style.display = 'none' })
                    }}
                  />
                ) : (
                  <div style={{
                    height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RiMusicLine size={22} color="rgba(168,139,250,0.4)" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                textAlign: 'center', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', maxWidth: 80,
              }}>
                {a.name}
              </div>

              {/* Role */}
              <div style={{
                fontSize: 11, color: 'var(--text-tertiary)',
                textAlign: 'center', marginTop: -6,
              }}>
                {a.role || 'Artist'}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll arrow (right) */}
        {artists.length > 4 && (
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute', right: -12, top: '30%',
              transform: 'translateY(-50%)',
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(13,199,94,0.12)',
              border: '1px solid rgba(13,199,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--green)',
            }}
          >
            <RiArrowRightLine size={15} />
          </button>
        )}
      </div>
    </div>
  )
}