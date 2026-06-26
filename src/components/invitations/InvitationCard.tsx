import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { InvitationDoc } from '../../lib/useUserInvitations'
import { Shield, Globe, Check } from 'lucide-react'

const ACCENT = '#6366F1'

export default function InvitationCard({ invitation }: { invitation: InvitationDoc }) {
  const [responding, setResponding] = useState(false)

  const respond = async (status: 'accepted' | 'declined') => {
    setResponding(true)
    await updateDoc(doc(db, 'invitations', invitation.id), {
      status,
      respondedAt: serverTimestamp(),
    })
    setResponding(false)
  }

  const scopeLabel = (() => {
    if (!invitation.scope || invitation.scope === 'all') return 'Full Access'
    if (invitation.scopeNames?.length) return invitation.scopeNames.join(', ')
    return 'Scoped Access'
  })()

  const isFullAccess = !invitation.scope || invitation.scope === 'all'

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: 'rgba(19,26,46,0.7)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${ACCENT},#818CF8)` }} />
      <div style={{ display: 'flex', gap: 16, padding: 18 }}>
        {invitation.eventImage ? (
          <img src={invitation.eventImage} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: 12, background: `${ACCENT}18`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={28} color={ACCENT} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}28`, borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 6 }}>
            Check-in Admin
          </span>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{invitation.eventName || 'Event Invitation'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{invitation.organizerName} invited you to help manage this event</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14, fontSize: 11, fontWeight: 600, color: isFullAccess ? '#22C55E' : ACCENT, background: isFullAccess ? 'rgba(34,197,94,0.08)' : `${ACCENT}08`, border: `1px solid ${isFullAccess ? 'rgba(34,197,94,0.2)' : `${ACCENT}20`}`, padding: '3px 10px', borderRadius: 6 }}>
            {isFullAccess ? <Globe size={11} /> : <Shield size={11} />}
            {scopeLabel}
          </div>
          {invitation.status === 'pending' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => respond('declined')} disabled={responding} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, opacity: responding ? 0.5 : 1, fontFamily: 'var(--font-body)' }}>Decline</button>
              <button onClick={() => respond('accepted')} disabled={responding} style={{ background: ACCENT, border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: responding ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)' }}>
                <Check size={13} /> Accept
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: invitation.status === 'accepted' ? '#22C55E' : '#F87171', background: invitation.status === 'accepted' ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)', padding: '4px 12px', borderRadius: 6, display: 'inline-block' }}>
              {invitation.status === 'accepted' ? '✓ Accepted' : '✕ Declined'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}