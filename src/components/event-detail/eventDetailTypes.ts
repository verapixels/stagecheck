// ─── EventDetail shared types ─────────────────────────────────────────────────

export interface EventData {
  id: string
  name: string
  date: any
  endDate?: string
  startTime?: string
  endTime?: string
  isRepeating?: boolean
  venue?: string
  address?: string
  locationType?: string
  description?: string
  summary?: string
  coverImage?: string
  media?: { url: string; type: string }[]
  featuredArtists?: {
    name: string
    image: string
    genre: string
    listeners: string
    bio: string
    role?: string
  }[]
  agenda?: { id: string; time: string; title: string; speaker?: string }[]
  faq?: { id: string; question: string; answer: string }[]
  goodToKnow?: { ageInfo: string; doorTime: string; parkingInfo: string }
  organizer?: { name: string; email: string; phone: string }
  organizerEmail?: string
  eventType?: string
  joinCode?: string
  slug?: string
  status?: string
  enabledModules?: string[]
  maxPerformers?: number
  attendingCount?: number
  // Fields from the screenshot design
  rating?: number
  reviewCount?: number
  aboutTags?: { label: string; icon: string }[]
}

export interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
  sold: number
  description?: string
  color: string
}

export interface AttendeeForm {
  name: string
  email: string
  phone: string
  altPhone: string
}

export type DrawerStep = 'select-ticket' | 'attendee-form' | 'payment' | 'success'