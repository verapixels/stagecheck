import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from '../context/Authcontext'

export type TeamScope = 'all' | string[] // 'all' or array of nodeIds

export interface TeamMemberDoc {
  uid: string
  email: string
  displayName?: string
  role: 'checkin_admin' | string
  scope: TeamScope
  scopeNames: string[]   // human-readable node names
  status: 'active' | 'pending'
  addedAt?: { seconds: number }
}

export function useTeamRole(eventId?: string) {
  const { user } = useAuth()
  const [member, setMember]   = useState<TeamMemberDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId || !user?.uid) { setLoading(false); return }

    const ref = doc(db, 'events', eventId, 'teamMembers', user.uid)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setMember({ uid: user.uid, ...snap.data() } as TeamMemberDoc)
      } else {
        setMember(null)
      }
      setLoading(false)
    }, () => { setLoading(false) })

    return unsub
  }, [eventId, user?.uid])

  const isOrganizer   = !member                        // no teamMember doc = they are the owner
  const isCheckinAdmin = member?.role === 'checkin_admin'
  const scopedNodeIds: string[] | null =
    member && Array.isArray(member.scope) ? member.scope : null  // null = all access

  return { member, loading, isOrganizer, isCheckinAdmin, scopedNodeIds }
}