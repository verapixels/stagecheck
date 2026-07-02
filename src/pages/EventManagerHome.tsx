import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Authcontext'
import DashboardLayout from '../components/DashboardLayout'
import EventAnalytics from '../components/EventdashboardAnalytics/Index'
import type { EventDoc } from '../components/EventdashboardAnalytics/Types'

export default function EventManagerHome() {
  const { user } = useAuth()

  const [events, setEvents] = useState<EventDoc[]>([])
  const [loading, setLoading] = useState(true)
  const currentEventType = events.length > 0 ? events[0].eventType : 'choir'

  // Load all events for this organizer from Firestore in real time
  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, 'events'),
      where('organizerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDoc))
      setEvents(data)
      setLoading(false)
    }, () => {
      setLoading(false)
    })

    return () => unsub()
  }, [user?.uid])

  return (
    <DashboardLayout plan="starter" eventType={currentEventType}>
      <EventAnalytics events={events} loading={loading} />
    </DashboardLayout>
  )
}