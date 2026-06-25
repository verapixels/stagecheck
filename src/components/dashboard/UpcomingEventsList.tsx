// src/components/dashboard/UpcomingEventsList.tsx
import { Link } from 'react-router-dom'
import type { TicketDoc } from '../../lib/useUserTickets'

function formatMonthDay(dateStr: string) {
  const d = new Date(dateStr)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
  }
}

function formatDateTime(dateStr: string, timeStr?: string) {
  const d = new Date(dateStr)
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (!timeStr) return datePart
  return `${datePart} • ${timeStr}`
}

function getCategoryColor(category?: string) {
  const map: Record<string, string> = {
    graduation: '#a855f7',
    conference: '#a855f7',
    concert: '#0dc75e',
    festival: '#f59e0b',
    workshop: '#3b82f6',
    meetup: '#ec4899',
  }
  const key = (category || '').toLowerCase()
  return map[key] || '#a855f7'
}

export default function UpcomingEventsList({ tickets, loading }: { tickets: TicketDoc[]; loading: boolean }) {
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
          Upcoming Events
        </h3>
        <Link to="/dashboard/tickets" style={{
          fontSize: 12,
          color: '#0dc75e',
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          View all →
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: '0 12px 12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                height: 72,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
            padding: '28px 10px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
          }}>
            No upcoming events yet.{' '}
            <Link to="/events" style={{ color: '#0dc75e', textDecoration: 'none' }}>Browse events</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tickets.slice(0, 5).map(t => {
              const dt = t.eventDate ? formatMonthDay(t.eventDate) : null
              const catColor = getCategoryColor(t.eventCategory)
              return (
                <div key={t.id} style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: 12,
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)',
                  }}>
                    {t.eventImage ? (
                      <img
                        src={t.eventImage}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #0dc75e22, #3b82f622)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        🎪
                      </div>
                    )}
                  </div>

                  {/* Date column */}
                  {dt && (
                    <div style={{
                      width: 38,
                      flexShrink: 0,
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#0dc75e',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.5px',
                        lineHeight: 1,
                      }}>
                        {dt.month}
                      </div>
                      <div style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.1,
                        letterSpacing: '-0.5px',
                      }}>
                        {dt.day}
                      </div>
                      <div style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.35)',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.3px',
                      }}>
                        {dt.weekday}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {t.eventCategory && (
                      <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: catColor,
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.3px',
                        marginBottom: 3,
                        textTransform: 'capitalize',
                      }}>
                        {t.eventCategory}
                      </div>
                    )}
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      fontFamily: 'Inter, sans-serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 4,
                    }}>
                      {t.eventName}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}>
                      {t.eventLocation && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.4)',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {t.eventLocation}
                        </div>
                      )}
                      {t.eventDate && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.4)',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {formatDateTime(t.eventDate, t.eventTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Ticket button */}
                  <Link
                    to={`/event/${t.eventId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 11,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      textDecoration: 'none',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View Ticket
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    </svg>
                  </Link>

                  {/* ⋮ menu placeholder */}
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <Link
              to="/dashboard/tickets"
              style={{
                fontSize: 12,
                color: '#0dc75e',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
            >
              View all upcoming events →
            </Link>
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