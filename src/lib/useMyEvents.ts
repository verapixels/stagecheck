// src/lib/useMyEvents.ts
import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export interface MyEvent {
  id: string
  title: string
  date: string
  time: string
  venue: string
  city: string
  coverImage: string
  category: string
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  totalTickets: number
  ticketsSold: number
  revenue: number
  currency: string
  createdAt: string
}

export function useMyEvents(uid?: string) {
  const [events, setEvents] = useState<MyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) { setLoading(false); return }

    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', uid),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const results: MyEvent[] = snap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            title: data.name || data.title || 'Untitled Event',
            date: data.date || data.startDate || '',
            time: data.time || data.startTime || '',
            venue: data.venue || data.location?.name || '',
            city: data.city || data.location?.city || '',
            coverImage: data.coverImage || data.image || '',
            category: data.category || data.type || '',
            status: data.status || 'draft',
            totalTickets: data.totalTickets || data.capacity || 0,
            ticketsSold: data.ticketsSold || 0,
            revenue: data.revenue || 0,
            currency: data.currency || 'NGN',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
          }
        })
        setEvents(results)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [uid])

  const deleteEvent = async (eventId: string) => {
    await deleteDoc(doc(db, 'events', eventId))
  }

  const updateEventStatus = async (eventId: string, status: MyEvent['status']) => {
    await updateDoc(doc(db, 'events', eventId), { status })
  }

  return {
    events,
    loading,
    error,
    published: events.filter(e => e.status === 'published'),
    drafts: events.filter(e => e.status === 'draft'),
    completed: events.filter(e => e.status === 'completed'),
    cancelled: events.filter(e => e.status === 'cancelled'),
    deleteEvent,
    updateEventStatus,
  }
}