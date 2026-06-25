// src/components/dashboard/SavedEventsList.tsx
import { Link } from 'react-router-dom'
import type { SavedEventDoc } from '../../lib/useUserSavedEvents'

function formatEventDate(dateStr?: string) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function SavedEventsList({
  savedEvents,
  loading,
}: {
  savedEvents: SavedEventDoc[]
  loading: boolean
}) {
  return (
    <div style={{
      background: 'rgba(10, 14, 30, 0.7)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 22px 16px',
      }}>
        <h3 style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#fff',
          margin: 0,
        }}>
          Saved Events
        </h3>
        <Link to="/dashboard/saved" style={{
          fontSize: 12,
          color: '#0dc75e',
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
        }}>
          View all →
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: '0 12px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 12, overflowX: 'hidden' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: 140,
                flexShrink: 0,
              }}>
                <div style={{
                  width: '100%',
                  height: 88,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  marginBottom: 8,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <div style={{
                  height: 8,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
            ))}
          </div>
        ) : savedEvents.length === 0 ? (
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
            padding: '28px 10px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
          }}>
            You haven't saved any events yet.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}>
            {savedEvents.map(e => (
              <Link
                key={e.id}
                to={`/event/${e.eventId}`}
                style={{
                  width: 140,
                  flexShrink: 0,
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {/* Card image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: 88,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)',
                  marginBottom: 8,
                }}>
                  {e.eventImage ? (
                    <img
                      src={e.eventImage}
                      alt={e.eventName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #0dc75e22, #3b82f622)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28,
                    }}>
                      🎪
                    </div>
                  )}

                  {/* Bookmark icon overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0dc75e" stroke="#0dc75e" strokeWidth="1.5">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                    </svg>
                  </div>
                </div>

                {/* Event name */}
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 2,
                }}>
                  {e.eventName}
                </div>

                {/* Date & location */}
                {(e.eventDate || e.eventLocation) && (
                  <div style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {[formatEventDate(e.eventDate), e.eventLocation].filter(Boolean).join(' • ')}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}