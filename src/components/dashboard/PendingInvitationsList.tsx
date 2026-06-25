// src/components/dashboard/PendingInvitationsList.tsx
import { Link } from 'react-router-dom'
import type { InvitationDoc } from '../../lib/useUserInvitations'

export default function PendingInvitationsList({
  invitations,
  loading,
  onAccept,
  onDecline,
}: {
  invitations: InvitationDoc[]
  loading: boolean
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
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
          Pending Invitations
        </h3>
        <Link to="/dashboard/invitations" style={{
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
      <div style={{ padding: '0 12px 12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                height: 68,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
            padding: '28px 10px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
          }}>
            No pending invitations.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {invitations.map(inv => (
              <div key={inv.id} style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '10px',
                borderRadius: 12,
              }}>
                {/* Event image */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                }}>
                  {inv.eventImage ? (
                    <img
                      src={inv.eventImage}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #a855f722, #3b82f622)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      📨
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 3,
                  }}>
                    {inv.eventName || 'Event Invitation'}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {inv.organizerName
                      ? `${inv.organizerName} invited you as`
                      : 'You were invited as'}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                  }}>
                    {inv.role || 'Attendee'}
                  </div>
                </div>

                {/* Accept / Decline */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => onAccept?.(inv.id)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#0dc75e',
                      color: '#000',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                    title="Accept"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDecline?.(inv.id)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    title="Decline"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
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