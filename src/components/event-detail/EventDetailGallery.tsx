// ─── EventDetailGallery.tsx ───────────────────────────────────────────────────
// Event Gallery: 2-column grid of images (2 large top, 3 smaller bottom)
// matching the screenshot layout. "View All" link top-right.

import { useState } from 'react'

interface Props {
  images: { url: string; type: string }[]
}

export default function EventDetailGallery({ images }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  // Need at least 2 images to show gallery
  if (images.length < 2) return null

  const top = images.slice(0, 2)
  const bottom = images.slice(2, 5)
  const hasBottom = bottom.length > 0

  return (
    <div className="ed-card" style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div className="ed-section-label" style={{ marginBottom: 0 }}>
          Event Gallery
        </div>
        <span style={{
          fontSize: 12, color: 'var(--green)',
          fontWeight: 600, cursor: 'pointer',
        }}>
          View All
        </span>
      </div>

      {/* Top row: 2 images */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: hasBottom ? 8 : 0 }}>
        {top.map((img, i) => (
          <div
            key={i}
            onClick={() => setLightbox(img.url)}
            style={{
              borderRadius: 10, overflow: 'hidden',
              aspectRatio: '16/10', cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <img
              src={img.url} alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block', transition: 'transform 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        ))}
      </div>

      {/* Bottom row: up to 3 images */}
      {hasBottom && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${bottom.length}, 1fr)`,
          gap: 8,
        }}>
          {bottom.map((img, i) => (
            <div
              key={i}
              onClick={() => setLightbox(img.url)}
              style={{
                borderRadius: 10, overflow: 'hidden',
                aspectRatio: '1', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                position: 'relative',
              }}
            >
              <img
                src={img.url} alt=""
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block', transition: 'transform 0.3s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
              {/* "+" overlay on last image if more */}
              {i === bottom.length - 1 && images.length > 5 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(6,8,16,0.65)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#fff',
                }}>
                  +{images.length - 5}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Simple lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 800,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <img
            src={lightbox} alt=""
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 12,
            }}
          />
        </div>
      )}
    </div>
  )
}