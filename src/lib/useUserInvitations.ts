// src/lib/useUserInvitations.ts
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from './firebase'

export interface InvitationDoc {
  id: string; eventId: string; eventName: string; eventImage: string
  eventDate: string; eventLocation: string; organizerName: string
  accessType: string; role: string; status: 'pending' | 'accepted' | 'declined'
  invitedAt?: { seconds: number }
}

export function useUserInvitations(uid?: string, email?: string | null) {
  const [invitations, setInvitations] = useState<InvitationDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid && !email) { setLoading(false); return }
    const field = uid ? 'invitedUserId' : 'invitedEmail'
    const value = uid ?? email
    const q = query(collection(db, 'invitations'), where(field, '==', value), orderBy('invitedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() } as InvitationDoc)))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [uid, email])

  return {
    invitations,
    pending: invitations.filter(i => i.status === 'pending'),
    accepted: invitations.filter(i => i.status === 'accepted'),
    declined: invitations.filter(i => i.status === 'declined'),
    loading,
  }
}