// src/components/EventAnalytics/types.ts

export interface EventDoc {
  id: string
  name: string
  date: string
  location: string
  eventType: string
  joinCode: string
  status: string
  maxPerformers: number
  enabledModules: string[]
  organizerId?: string
  coverImage?: string
  createdAt?: { seconds: number }
}

export interface TicketTypeDoc {
  id: string
  name: string
  price: number
  quantity: number // capacity
  sold: number
  category?: string
  isFree?: boolean
  color?: string
  description?: string
}

export interface AttendeeDoc {
  id: string
  eventId: string // stamped on client after fetch, not stored on the doc itself
  name: string
  email: string
  phone?: string
  ticketType?: string
  ticketTypeId?: string
  ticketCode: string
  quantity: number
  totalPaid: number
  paymentMethod?: string
  eventName?: string
  eventDate?: string
  eventVenue?: string
  checkedIn: boolean
  purchasedAt?: { toDate: () => Date; seconds: number } | null
}

export interface EventStats {
  event: EventDoc
  ticketsSold: number
  ticketCapacity: number
  revenue: number
  registrations: number
  checkedInCount: number
  soldPercent: number
  checkInPercent: number
}

export interface ActivityItem {
  id: string
  type: 'purchase' | 'checkin' | 'registration' | 'refund'
  eventName: string
  detail: string
  timestamp: Date
}

export type DateRangeFilter = '7d' | '30d' | '90d' | 'year' | 'all'
export type StatusFilter = 'all' | 'active' | 'draft'