// ─── ticketingTypes.ts ─────────────────────────────────────────────────────
// Shared types for the Ticketing* component family.
// Re-exports EventData, TicketType, AttendeeForm AS-IS from the event-detail
// types — no extension needed. Your real TicketType already has:
//   id, name, description, price, quantity, sold, color
// and EventData already has: id, name, date, startTime, venue, address,
// coverImage, media, faq, agenda, organizer, organizerEmail.
//
// The ticketing UI uses `color` (already on TicketType) for the per-ticket
// accent strip/icon — there's no separate `category` field needed.

export type { EventData, TicketType, AttendeeForm } from '../event-detail/eventDetailTypes'

export interface AddOn {
  id: string
  name: string
  description: string
  price: number
  icon?: string        // image url for the add-on thumbnail
  requiresSize?: boolean
  sizeOptions?: string[]
}

export type TicketingStep = 'select-tickets' | 'your-details' | 'checkout' | 'confirmation'

export interface SelectedTicketLine {
  ticketId: string
  qty: number
}

export interface SelectedAddOnLine {
  addOnId: string
  qty: number
  size?: string
}