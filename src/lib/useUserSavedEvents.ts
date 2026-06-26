// src/lib/useUserSavedEvents.ts
import { useEffect, useState, useMemo } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, deleteDoc, serverTimestamp, getDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export interface SavedEventDoc {
  id: string
  eventId: string
  eventName: string
  eventImage?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  city?: string
  eventType?: string
  description?: string
  organizer?: string
  ageRestriction?: string
  website?: string
  savedAt?: any
}

export interface SavedEvent {
  id: string
  eventId: string
  eventName: string
  eventImage?: string
  eventDate: string
  eventTime?: string
  venue?: string
  city?: string
  eventType?: string
  description?: string
  organizer?: string
  ageRestriction?: string
  website?: string
  status: 'upcoming' | 'past'
}

function deriveStatus(eventDate?: string): 'upcoming' | 'past' {
  if (!eventDate) return 'upcoming'
  return new Date(eventDate) >= new Date() ? 'upcoming' : 'past'
}

function toSavedEvent(d: SavedEventDoc): SavedEvent {
  return {
    id:             d.id,
    eventId:        d.eventId,
    eventName:      d.eventName,
    eventImage:     d.eventImage,
    eventDate:      d.eventDate || '',
    eventTime:      d.eventTime,
    venue:          d.eventLocation || '',
    city:           d.city,
    eventType:      d.eventType,
    description:    d.description,
    organizer:      d.organizer,
    ageRestriction: d.ageRestriction,
    website:        d.website,
    status:         deriveStatus(d.eventDate),
  }
}

export function useUserSavedEvents(uid?: string) {
  const [rawEvents, setRawEvents] = useState<SavedEventDoc[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!uid) {
      setRawEvents([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'users', uid, 'savedEvents')
    const q   = query(ref, orderBy('savedAt', 'desc'))

    const unsub = onSnapshot(
      q,
      snap => {
        setRawEvents(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SavedEventDoc, 'id'>) })))
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsub
  }, [uid])

  const savedEvents = useMemo(() => rawEvents.map(toSavedEvent), [rawEvents])
  const upcoming    = useMemo(() => savedEvents.filter(e => e.status === 'upcoming'), [savedEvents])
  const past        = useMemo(() => savedEvents.filter(e => e.status === 'past'),     [savedEvents])

  const removeSavedEvent = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'savedEvents', id))
  }

  return { savedEvents, loading, upcoming, past, removeSavedEvent }
}

export async function toggleSaveEvent(
  uid: string,
  event: {
    id: string
    name: string
    coverImage?: string
    date?: any
    startTime?: string
    venue?: string
    address?: string
    city?: string
    eventType?: string
    type?: string
    category?: string
    description?: string
    organizer?: any
    ageRestriction?: string
    website?: string
  }
) {
  const ref  = doc(db, 'users', uid, 'savedEvents', event.id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await deleteDoc(ref)
    return false
  } else {
    let dateStr = ''
    try {
      const raw = event.date
      const d   = raw?.toDate ? raw.toDate() : new Date(raw)
      dateStr   = d.toISOString().split('T')[0]
    } catch { /* ignore */ }

    // organizer can be a string or an object { name, ... }
    const organizerName = typeof event.organizer === 'string'
      ? event.organizer
      : event.organizer?.name || ''

    await setDoc(ref, {
      eventId:        event.id,
      eventName:      event.name,
      eventImage:     event.coverImage || '',
      eventDate:      dateStr,
      eventTime:      event.startTime   || '',
      eventLocation:  event.venue || event.address || '',
      city:           event.city        || '',
      eventType:      event.eventType || event.type || event.category || '',
      description:    event.description || '',
      organizer:      organizerName,
      ageRestriction: event.ageRestriction || '',
      website:        event.website     || '',
      savedAt:        serverTimestamp(),
    })
    return true
  }
}

export async function isEventSaved(uid: string, eventId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'savedEvents', eventId))
  return snap.exists()
}