// src/components/invitations/AcceptedInvitationsList.tsx
import { Link } from 'react-router-dom'
import type { InvitationDoc } from '../../lib/useUserInvitations'

export default function AcceptedInvitationsList({ invitations, emptyLabel }: { invitations: InvitationDoc[]; emptyLabel: string }) {
  if (invitations.length === 0) {
    return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>{emptyLabel}</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
      {invitations.map(inv => (
        <div key={inv.id} style={{
          display: 'flex', gap: 12, alignItems: 'center', padding: 14, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(19,26,46,0.5)',
        }}>
          <img src={inv.eventImage} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{inv.eventName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>You're a {inv.role}</div>
          </div>
          <Link to={`/event/${inv.eventId}`} style={{ fontSize: 12, color: '#22C55E', textDecoration: 'none' }}>View Event</Link>
        </div>
      ))}
    </div>
  )
}