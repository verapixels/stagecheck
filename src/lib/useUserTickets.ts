// src/lib/useUserTickets.ts
import { useEffect, useState } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  doc, getDoc, setDoc, serverTimestamp,   // ← all static imports, no dynamic import
} from 'firebase/firestore'
import { db } from './firebase'             // ← single shared db instance

export interface TicketDoc {
  id: string
  eventId: string
  eventName: string
  eventImage?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventCategory?: string
  ticketType?: string
  ticketCode?: string
  qty?: number
  attendeeName?: string
  attendeeEmail?: string
  purchasedAt?: string
}

export function useUserTickets(uid?: string) {
  const [tickets, setTickets] = useState<TicketDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setTickets([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'users', uid, 'tickets')

    // ── FIX 1: removed orderBy('purchasedAt') — it requires a Firestore
    // composite index that may not exist, causing the listener to silently
    // return 0 results. We sort client-side instead (see below).
    const q = query(ref)

    const unsub = onSnapshot(
      q,
      async snap => {
        const raw = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<TicketDoc, 'id'>),
        }))

        // Hydrate any ticket missing display fields from its event doc
        const hydrated = await Promise.all(
          raw.map(async t => {
            if (t.eventName && t.eventDate) return t
            try {
              const evSnap = await getDoc(doc(db, 'events', t.eventId))
              if (!evSnap.exists()) return t
              const ev = evSnap.data()
              let dateStr = t.eventDate || ''
              if (!dateStr && ev.date) {
                try {
                  const d = ev.date?.toDate ? ev.date.toDate() : new Date(ev.date)
                  dateStr = d.toISOString().split('T')[0]
                } catch { /* ignore */ }
              }
              return {
                ...t,
                eventName:     t.eventName     || ev.name      || 'Untitled Event',
                eventImage:    t.eventImage    || ev.coverImage || '',
                eventDate:     dateStr,
                eventTime:     t.eventTime     || ev.startTime  || '',
                eventLocation: t.eventLocation || ev.venue      || ev.address || '',
                eventCategory: t.eventCategory || ev.type       || ev.category || '',
              }
            } catch {
              return t
            }
          })
        )

        // ── FIX 2: sort client-side by purchasedAt descending so newest tickets
        // appear first, without needing a Firestore index.
        hydrated.sort((a, b) => {
          const aTime = (a as any).purchasedAt?.seconds ?? 0
          const bTime = (b as any).purchasedAt?.seconds ?? 0
          return bTime - aTime
        })

        setTickets(hydrated)
        setLoading(false)
      },
      err => {
        // ── FIX 3: log the actual error so you can see it in the console
        console.error('[useUserTickets] Firestore error:', err)
        setLoading(false)
      }
    )

    return unsub
  }, [uid])

  return { tickets, loading }
}

/**
 * Saves a ticket to users/{uid}/tickets after a successful payment.
 *
 * ── FIX 4: replaced dynamic `await import(...)` with the static imports at the
 * top of this file. The dynamic import created a second firebase app instance
 * that didn't carry the user's auth state, so setDoc() would hit a permissions
 * error and silently fail.
 */
export async function saveTicketToUser(
  uid: string,
  data: {
    eventId: string
    eventName: string
    eventImage?: string
    eventDate?: string
    eventTime?: string
    eventLocation?: string
    eventCategory?: string
    ticketCode: string
    ticketType?: string
    qty?: number
    attendeeName?: string
    attendeeEmail?: string
  }
) {
  const ref = doc(db, 'users', uid, 'tickets', data.ticketCode)
  await setDoc(ref, {
    ...data,
    purchasedAt: serverTimestamp(),
  })
}