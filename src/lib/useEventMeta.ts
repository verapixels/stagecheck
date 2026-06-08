import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useEventMeta(eventId?: string) {
  const [eventType, setEventType] = useState<string | null>(null)
  const [enabledModules, setEnabledModules] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)  // ← dedicated flag

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    setLoading(true)  // reset on eventId change
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) {
        setEventType(snap.data().eventType ?? 'custom')
        setEnabledModules(snap.data().enabledModules ?? [])
      }
      setLoading(false)  // ← only false after data is set
    })
  }, [eventId])

  return { eventType, enabledModules, loading }
}