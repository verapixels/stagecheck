// src/lib/useUserTickets.ts
import { useEffect, useState, useMemo } from 'react'
import {
  collection, query, onSnapshot,
  doc, getDoc, setDoc, serverTimestamp,
  collectionGroup, where, getDocs,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── TicketDoc: raw shape stored in Firestore ────────────────────────────────
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
  purchasedAt?: any
  status?: 'upcoming' | 'used' | 'cancelled'
}

// ─── UserTicket: richer shape expected by MyTickets.tsx ──────────────────────
export interface UserTicket {
  id: string
  eventId: string
  eventName: string
  eventImage?: string
  eventDate: string
  eventTime?: string
  venue?: string
  city?: string
  eventCategory?: string
  ticketType?: string
  ticketNumber: string
  ticketCode?: string
  quantity: number
  qty?: number
  attendeeName?: string
  attendeeEmail?: string
  purchasedAt?: any
  purchasedOn?: string
  orderId?: string
  paymentMethod?: string
  pricePaid?: number
  qrCode?: string
  status: 'upcoming' | 'used' | 'cancelled'
  source?: 'ticket' | 'network'
}

// ─── Derive status from eventDate ────────────────────────────────────────────
function deriveStatus(eventDate?: string): 'upcoming' | 'used' | 'cancelled' {
  if (!eventDate) return 'upcoming'
  const ev = new Date(eventDate)
  return ev >= new Date() ? 'upcoming' : 'used'
}

// ─── Map raw TicketDoc → UserTicket ─────────────────────────────────────────
function toUserTicket(t: TicketDoc): UserTicket {
  const purchasedOn = t.purchasedAt?.toDate
    ? t.purchasedAt.toDate().toISOString()
    : t.purchasedAt
      ? String(t.purchasedAt)
      : undefined

  return {
    ...t,
    eventDate:    t.eventDate    || '',
    venue:        t.eventLocation || '',
    ticketNumber: t.ticketCode   || t.id,
    quantity:     t.qty          || 1,
    purchasedOn,
    status:       t.status       || deriveStatus(t.eventDate),
    source:       'ticket',
  }
}

// ─── Map network registration → UserTicket ───────────────────────────────────
function networkRegToUserTicket(d: any, eventId: string, eventData: any): UserTicket {
  const purchasedOn = d.submittedAt?.toDate
    ? d.submittedAt.toDate().toISOString()
    : undefined

  const eventDateStr = eventData?.date
    ? (typeof eventData.date === 'string'
        ? eventData.date
        : eventData.date?.toDate
          ? eventData.date.toDate().toISOString().split('T')[0]
          : String(eventData.date))
    : ''

  return {
    id:            d.id,
    eventId,
    eventName:     eventData?.name      || eventData?.eventName || 'Network Event',
    eventImage:    eventData?.coverImage || '',
    eventDate:     eventDateStr,
    eventTime:     eventData?.startTime  || '',
    venue:         eventData?.venue      || eventData?.address   || '',
    ticketNumber:  d.ticketCode          || d.id,
    ticketCode:    d.ticketCode,
    ticketType:    d.ticketTypes?.[0]?.name || 'Network Ticket',
    quantity:      d.ticketTypes?.reduce((s: number, t: any) => s + (t.qty || 1), 0) || 1,
    attendeeName:  d.fullName            || d.name || '',
    attendeeEmail: d.email               || '',
    purchasedAt:   d.submittedAt,
    purchasedOn,
    orderId:       d.paymentRef          || '',
    pricePaid:     d.totalPaid           || 0,
    status:        deriveStatus(eventDateStr),
    source:        'network',
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useUserTickets(uid?: string, email?: string) {
  const [rawTickets, setRawTickets]   = useState<TicketDoc[]>([])
  const [networkTickets, setNetwork]  = useState<UserTicket[]>([])
  const [loading, setLoading]         = useState(true)

  // ── Regular tickets from users/{uid}/tickets ──
  useEffect(() => {
    if (!uid) {
      setRawTickets([])
      setLoading(false)
      return
    }

    const ref  = collection(db, 'users', uid, 'tickets')
    const q    = query(ref)

    const unsub = onSnapshot(
      q,
      async snap => {
        const raw = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<TicketDoc, 'id'>),
        }))

        const hydrated = await Promise.all(
          raw.map(async t => {
            // FIX: previously this returned early whenever eventName + eventDate
            // were present, even if eventImage was missing — so the banner
            // image never got backfilled for guest-linked tickets.
            if (t.eventName && t.eventDate && t.eventImage) return t
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

        hydrated.sort((a, b) => {
          const aTime = (a as any).purchasedAt?.seconds ?? 0
          const bTime = (b as any).purchasedAt?.seconds ?? 0
          return bTime - aTime
        })

        setRawTickets(hydrated)
        setLoading(false)
      },
      err => {
        console.error('[useUserTickets] Firestore error:', err)
        setLoading(false)
      }
    )

    return unsub
  }, [uid])

  // ── Network registrations via collectionGroup query on email ──
  useEffect(() => {
    if (!email) {
      setNetwork([])
      return
    }

    getDocs(
      query(
        collectionGroup(db, 'networkRegistrations'),
        where('email', '==', email)
      )
    ).then(async snap => {
      if (snap.empty) { setNetwork([]); return }

      const results = await Promise.all(
        snap.docs.map(async d => {
          const eventId  = d.ref.parent.parent?.id || ''
          let eventData: any = {}
          if (eventId) {
            try {
              const evSnap = await getDoc(doc(db, 'events', eventId))
              if (evSnap.exists()) eventData = evSnap.data()
            } catch { /* ignore */ }
          }
          return networkRegToUserTicket({ id: d.id, ...d.data() }, eventId, eventData)
        })
      )

      results.sort((a, b) => {
        const aTime = (a.purchasedAt as any)?.seconds ?? 0
        const bTime = (b.purchasedAt as any)?.seconds ?? 0
        return bTime - aTime
      })

      setNetwork(results)
    }).catch(err => console.error('[useUserTickets] network query error:', err))
  }, [email])

  const tickets   = useMemo(() => {
    const all = [...rawTickets.map(toUserTicket), ...networkTickets]
    all.sort((a, b) => {
      const aTime = (a.purchasedAt as any)?.seconds ?? 0
      const bTime = (b.purchasedAt as any)?.seconds ?? 0
      return bTime - aTime
    })
    return all
  }, [rawTickets, networkTickets])

  const upcoming  = useMemo(() => tickets.filter(t => t.status === 'upcoming'),  [tickets])
  const used      = useMemo(() => tickets.filter(t => t.status === 'used'),      [tickets])
  const cancelled = useMemo(() => tickets.filter(t => t.status === 'cancelled'), [tickets])

  return { tickets, loading, upcoming, used, cancelled }
}

// ─── Save a ticket doc after purchase ────────────────────────────────────────
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
  }, { merge: true })
}

// ─── Link guest-purchased tickets to a newly created/logged-in account ──────
export async function linkGuestTicketsToUser(uid: string, email: string): Promise<void> {
  try {
    const q = query(
      collectionGroup(db, 'attendees'),
      where('email', '==', email)
    )
    const snap = await getDocs(q)
    if (snap.empty) return

    await Promise.all(
      snap.docs.map(async (d) => {
        const data    = d.data()
        const eventId = d.ref.parent.parent?.id
        if (!eventId || !data.ticketCode) return

        // FIX: attendee docs don't carry event-level fields like coverImage —
        // that lives on the events/{eventId} doc, not the attendee record.
        // Pull it from there so the banner image actually gets saved.
        let ev: any = {}
        try {
          const evSnap = await getDoc(doc(db, 'events', eventId))
          if (evSnap.exists()) ev = evSnap.data()
        } catch { /* ignore */ }

        await saveTicketToUser(uid, {
          eventId,
          eventName:     data.eventName     || ev.name        || '',
          eventImage:    data.eventImage    || data.coverImage || ev.coverImage || '',
          eventDate:     data.eventDate     || '',
          eventTime:     data.eventTime     || ev.startTime    || '',
          eventLocation: data.eventVenue    || data.eventLocation || ev.venue || ev.address || '',
          eventCategory: data.eventCategory || ev.type || ev.category || '',
          ticketCode:    data.ticketCode,
          ticketType:    data.ticketType    || '',
          qty:           data.quantity       || data.qty || 1,
          attendeeName:  data.name          || data.attendeeName || '',
          attendeeEmail: data.email         || '',
        })
      })
    )

    console.log(`[linkGuestTicketsToUser] Linked ${snap.size} ticket(s) to uid=${uid}`)
  } catch (err) {
    console.error('[linkGuestTicketsToUser] failed:', err)
  }
}