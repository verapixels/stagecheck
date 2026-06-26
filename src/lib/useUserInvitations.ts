import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export interface InvitationDoc {
  id: string
  eventId: string
  eventName: string
  eventImage: string
  eventDate: string
  eventLocation: string
  organizerName: string
  accessType: string
  role: string
  scope: any
  scopeNames: string[]
  status: 'pending' | 'accepted' | 'declined'
  invitedEmail?: string
  invitedUserId?: string
  invitedAt?: { seconds: number }
}

export function useUserInvitations(uid?: string, email?: string | null) {
  const [byEmail, setByEmail] = useState<InvitationDoc[]>([])
  const [byUid, setByUid]     = useState<InvitationDoc[]>([])
  const [loading, setLoading] = useState(true)

  // Query 1 — by email
  useEffect(() => {
    if (!email) { setByEmail([]); setLoading(false); return }

    const q = query(
      collection(db, 'invitations'),
      where('invitedEmail', '==', email.toLowerCase()),
    )

    return onSnapshot(
      q,
      snap => {
        setByEmail(snap.docs.map(d => ({ id: d.id, ...d.data() } as InvitationDoc)))
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [email])

  // Query 2 — by uid
  useEffect(() => {
    if (!uid) { setByUid([]); return }

    const q = query(
      collection(db, 'invitations'),
      where('invitedUserId', '==', uid),
    )

    return onSnapshot(
      q,
      snap => {
        setByUid(snap.docs.map(d => ({ id: d.id, ...d.data() } as InvitationDoc)))
      },
      () => {}
    )
  }, [uid])

  // Merge & deduplicate
  const invitations = (() => {
    const seen = new Set<string>()
    const merged: InvitationDoc[] = []
    ;[...byEmail, ...byUid].forEach(inv => {
      if (!seen.has(inv.id)) { seen.add(inv.id); merged.push(inv) }
    })
    return merged.sort((a, b) => (b.invitedAt?.seconds ?? 0) - (a.invitedAt?.seconds ?? 0))
  })()

  return {
    invitations,
    pending:  invitations.filter(i => i.status === 'pending'),
    accepted: invitations.filter(i => i.status === 'accepted'),
    declined: invitations.filter(i => i.status === 'declined'),
    loading,
  }
}