// src/lib/useUserSavedEvents.ts
import { useEffect, useState } from 'react'
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
  eventLocation?: string
  savedAt?: string
}

/**
 * Reads from users/{uid}/savedEvents subcollection.
 * Call toggleSaveEvent from EventDetailPage when user clicks the ❤ / bookmark icon.
 */
export function useUserSavedEvents(uid?: string) {
  const [savedEvents, setSavedEvents] = useState<SavedEventDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setSavedEvents([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'users', uid, 'savedEvents')
    const q = query(ref, orderBy('savedAt', 'desc'))

    const unsub = onSnapshot(q, snap => {
      setSavedEvents(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<SavedEventDoc, 'id'>),
        }))
      )
      setLoading(false)
    }, () => setLoading(false))

    return unsub
  }, [uid])

  return { savedEvents, loading }
}

/**
 * Call this from EventDetailPage when the user clicks the like/bookmark icon.
 * Pass the full event object so we can store display data.
 */
export async function toggleSaveEvent(
  uid: string,
  event: {
    id: string
    name: string
    coverImage?: string
    date?: any
    venue?: string
    address?: string
  }
) {
  const ref = doc(db, 'users', uid, 'savedEvents', event.id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await deleteDoc(ref)
    return false // now un-saved
  } else {
    let dateStr = ''
    try {
      const raw = event.date
      const d = raw?.toDate ? raw.toDate() : new Date(raw)
      dateStr = d.toISOString().split('T')[0]
    } catch { /* ignore */ }

    await setDoc(ref, {
      eventId: event.id,
      eventName: event.name,
      eventImage: event.coverImage || '',
      eventDate: dateStr,
      eventLocation: event.venue || event.address || '',
      savedAt: serverTimestamp(),
    })
    return true // now saved
  }
}

/**
 * Check if an event is saved by the current user.
 */
export async function isEventSaved(uid: string, eventId: string): Promise<boolean> {
  const ref = doc(db, 'users', uid, 'savedEvents', eventId)
  const snap = await getDoc(ref)
  return snap.exists()
}