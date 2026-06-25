// src/components/invitations/InvitationCard.tsx
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { InvitationDoc } from '../../lib/useUserInvitations'

export default function InvitationCard({ invitation }: { invitation: InvitationDoc }) {
  const respond = async (status: 'accepted' | 'declined') => {
    await updateDoc(doc(db, 'invitations', invitation.id), { status, respondedAt: serverTimestamp() })
  }

  return (
    <div style={{
      display: 'flex', gap: 16, padding: 18, borderRadius: 16,
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <img src={invitation.eventImage} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '2px 8px',
        }}>
          {invitation.accessType}
        </span>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '6px 0 4px' }}>{invitation.eventName}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
          {invitation.organizerName} invited you as {invitation.role}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => respond('declined')} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>
            Decline
          </button>
          <button onClick={() => respond('accepted')} style={{
            background: '#22C55E', border: 'none', color: '#0B1020',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}