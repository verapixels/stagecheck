// src/components/EventAnalytics/useOrganizerAnalytics.ts
import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { EventDoc, TicketTypeDoc, AttendeeDoc, EventStats, ActivityItem } from './Types'
import { pct } from './Analytics.utils'

interface PerEventData {
  attendees: AttendeeDoc[]
  tickets: TicketTypeDoc[]
}

/**
 * Subscribes to the `attendees` and `tickets` subcollections of every event
 * passed in, and keeps everything live via onSnapshot. Attendee docs don't
 * carry their own eventId field (see verifyAndFulfillPayment), so we stamp
 * it on read from the subcollection path.
 *
 * NOTE: there is no refunds collection yet and no checkedInAt timestamp on
 * attendee docs (only a checkedIn boolean) — refunds are stubbed at 0 and
 * the live activity feed only surfaces purchase events until those exist.
 */
export function useOrganizerAnalytics(events: EventDoc[]) {
  const [dataByEvent, setDataByEvent] = useState<Record<string, PerEventData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (events.length === 0) {
      setDataByEvent({})
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubs: (() => void)[] = []
    let pending = events.length * 2

    const markLoaded = () => {
      pending -= 1
      if (pending <= 0) setLoading(false)
    }

    events.forEach(ev => {
      const attendeesRef = collection(db, 'events', ev.id, 'attendees')
      const unsubA = onSnapshot(attendeesRef, snap => {
        const attendees = snap.docs.map(d => ({ id: d.id, eventId: ev.id, ...(d.data() as any) })) as AttendeeDoc[]
        setDataByEvent(prev => ({ ...prev, [ev.id]: { attendees, tickets: prev[ev.id]?.tickets || [] } }))
        markLoaded()
      }, () => markLoaded())
      unsubs.push(unsubA)

      const ticketsRef = collection(db, 'events', ev.id, 'tickets')
      const unsubT = onSnapshot(ticketsRef, snap => {
        const tickets = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as TicketTypeDoc[]
        setDataByEvent(prev => ({ ...prev, [ev.id]: { attendees: prev[ev.id]?.attendees || [], tickets } }))
        markLoaded()
      }, () => markLoaded())
      unsubs.push(unsubT)
    })

    return () => unsubs.forEach(u => u())
  }, [events.map(e => e.id).join(',')])

  const eventStats: EventStats[] = useMemo(() => {
    return events.map(ev => {
      const data = dataByEvent[ev.id] || { attendees: [], tickets: [] }
      const ticketsSold = data.attendees.reduce((s, a) => s + (a.quantity || 1), 0)
      const ticketCapacity = data.tickets.reduce((s, t) => s + (t.quantity || 0), 0)
      const revenue = data.attendees.reduce((s, a) => s + (a.totalPaid || 0), 0)
      const checkedInCount = data.attendees.filter(a => a.checkedIn).length

      return {
        event: ev,
        ticketsSold,
        ticketCapacity,
        revenue,
        registrations: data.attendees.length,
        checkedInCount,
        soldPercent: pct(ticketsSold, ticketCapacity),
        checkInPercent: pct(checkedInCount, data.attendees.length),
      }
    })
  }, [events, dataByEvent])

  const allAttendees: AttendeeDoc[] = useMemo(
    () => Object.values(dataByEvent).flatMap(d => d.attendees),
    [dataByEvent]
  )

  const activityFeed: ActivityItem[] = useMemo(() => {
    return allAttendees
      .filter(a => a.purchasedAt?.toDate)
      .map(a => ({
        id: a.id,
        type: 'purchase' as const,
        eventName: a.eventName || 'Event',
        detail: `${a.ticketType || 'Ticket'} purchased by ${a.name || 'guest'}`,
        timestamp: a.purchasedAt!.toDate(),
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 12)
  }, [allAttendees])

  const totals = useMemo(() => {
    const activeEvents = events.filter(e => e.status === 'active')
    return {
      activeEventsCount: activeEvents.length,
      ticketsSold: eventStats.reduce((s, e) => s + e.ticketsSold, 0),
      registrations: eventStats.reduce((s, e) => s + e.registrations, 0),
      revenue: eventStats.reduce((s, e) => s + e.revenue, 0),
      checkedIn: eventStats.reduce((s, e) => s + e.checkedInCount, 0),
      avgCheckInRate: pct(
        eventStats.reduce((s, e) => s + e.checkedInCount, 0),
        eventStats.reduce((s, e) => s + e.registrations, 0)
      ),
      avgAttendance: eventStats.length
        ? Math.round(eventStats.reduce((s, e) => s + e.soldPercent, 0) / eventStats.length)
        : 0,
      refundRequests: 0, // no refunds collection yet — wire up once that feature exists
    }
  }, [eventStats, events])

  return { eventStats, allAttendees, activityFeed, totals, loading }
}