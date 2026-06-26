// src/components/invitations/AcceptedInvitationsList.tsx
import { Link } from 'react-router-dom'
import type { InvitationDoc } from '../../lib/useUserInvitations'
import { ScanLine, Shield } from 'lucide-react'

const ACCENT = '#6366F1'

export default function AcceptedInvitationsList({
  invitations,
  emptyLabel,
}: {
  invitations: InvitationDoc[]
  emptyLabel: string
}) {
  if (invitations.length === 0) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
      {invitations.map(inv => (
        <div key={inv.id} style={{
          display: 'flex', gap: 12, alignItems: 'center', padding: 14, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(19,26,46,0.5)',
        }}>
          {inv.eventImage
            ? <img src={inv.eventImage} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            : (
              <div style={{ width: 48, height: 48, borderRadius: 10, background: `${ACCENT}18`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} color={ACCENT} />
              </div>
            )
          }

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{inv.eventName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Check-in Admin</div>
          </div>

          <Link
            to={`/accept-invitation/${inv.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, color: '#22C55E',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0,
            }}
          >
            <ScanLine size={12} /> Open Check-in
          </Link>
        </div>
      ))}
    </div>
  )
}