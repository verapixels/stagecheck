import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from '../context/Authcontext'

// ── Scope types ───────────────────────────────────────────────────────────────
// Path 1 (Org Builder): organizer assigned specific org node IDs
export interface ScopeNodes {
  type: 'nodes'
  nodeIds: string[]
  nodeNames: string[]
}

// Path 2 (Custom Fields): organizer assigned specific field+value pairs
// e.g. [{ fieldId: 'abc', fieldLabel: 'Zone', value: 'Lagos Zone' }]
export interface ScopeCustomFields {
  type: 'customFields'
  pairs: { fieldId: string; fieldLabel: string; value: string }[]
}

export type TeamScope = 'all' | ScopeNodes | ScopeCustomFields

export interface TeamMemberDoc {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: 'checkin_admin' | string
  scope: TeamScope
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
      setMember(snap.exists() ? ({ uid: user.uid, ...snap.data() } as TeamMemberDoc) : null)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [eventId, user?.uid])

  const isOrganizer    = !member
  const isCheckinAdmin = member?.role === 'checkin_admin'

  // Derived helpers for the checkin page
  const scopeNodeIds: string[] | null =
    member && member.scope !== 'all' && (member.scope as ScopeNodes).type === 'nodes'
      ? (member.scope as ScopeNodes).nodeIds
      : member?.scope === 'all' ? null   // null = full access
      : !member ? null                   // organizer = full access
      : null

  const scopeCustomPairs: { fieldId: string; value: string }[] | null =
    member && member.scope !== 'all' && (member.scope as ScopeCustomFields).type === 'customFields'
      ? (member.scope as ScopeCustomFields).pairs.map(p => ({
          fieldId: p.fieldId,
          value: p.value === '*' ? '*' : p.value.toLowerCase(),
        }))
      : null

  // Human-readable label for the scope indicator
  const scopeLabel: string | null = (() => {
    if (!member || member.scope === 'all') return null
    const s = member.scope as ScopeNodes | ScopeCustomFields
    if (s.type === 'nodes') return s.nodeNames.join(', ')
    if (s.type === 'customFields') return s.pairs.map(p => `${p.fieldLabel}: ${p.value}`).join(', ')
    return null
  })()

  return {
    member, loading, isOrganizer, isCheckinAdmin,
    scopeNodeIds, scopeCustomPairs, scopeLabel,
  }
}