import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useEventMeta } from '../lib/useEventMeta'

type EventContextType = {
  eventType: string | null
  enabledModules: string[] | null
  loading: boolean
}

const EventContext = createContext<EventContextType>({
  eventType: null,
  enabledModules: null,
  loading: true,
})

export function EventProvider({ children }: { children: ReactNode }) {
  const { eventId } = useParams<{ eventId: string }>()
  const meta = useEventMeta(eventId)
  return (
    <EventContext.Provider value={meta}>
      {children}
    </EventContext.Provider>
  )
}

export const useEvent = () => useContext(EventContext)