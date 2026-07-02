/* ─────────────────────────────────────────────────────────────
   RegularTicketTypes.ts
   Shared types, constants and helpers for all RegularTicket components
───────────────────────────────────────────────────────────── */

export interface TicketType {
  id: string
  name: string
  price: number
  isFree: boolean
  quantity: number
  sold: number
  description?: string
  color: string
  category?: string
  benefits?: string[]
  whoCanBuy?: 'everyone' | 'students' | 'promo' | 'invited'
  pushServiceCharge?: boolean
}

export interface AddOn {
  id: string
  name: string
  price: number
  isFree: boolean
  quantity: number
  sold: number
  description?: string
  color: string
  imageUrl?: string        // first/primary image — kept for backward compatibility
  images?: string[]        // up to MAX_ADDON_IMAGES images
  category?: 'hospitality' | 'merchandise' | 'parking' | 'experience' | 'other'
  active?: boolean
  requiresSize?: boolean
  sizeOptions?: string[]
}

export interface Attendee {
  id: string
  name: string
  email: string
  ticketType: string
  ticketCode: string
  checkedIn: boolean
  checkedInAt?: any
  purchasedAt?: any
  avatar?: string
}

export type CheckinResult =
  | { status: 'success'; attendee: Attendee }
  | { status: 'already';  attendee: Attendee }
  | { status: 'invalid' }
  | null

/* ─── Brand / design tokens ─── */
export const G      = '#22C55E'   // brand green
export const G_DIM  = '#16a34a'
export const BG     = '#0B1020'
export const CARD   = 'rgba(12,17,35,0.85)'
export const BORDER = 'rgba(255,255,255,0.09)'

// Readable text — no more faded grays
export const TX1    = '#FFFFFF'               // primary text
export const TX2    = 'rgba(255,255,255,0.85)'// secondary text — was 0.62, now readable
export const TX3    = 'rgba(255,255,255,0.55)'// tertiary (labels, caps)

export const PRESET_COLORS = [
  '#22C55E','#3B82F6','#F59E0B','#8B5CF6',
  '#EC4899','#14B8A6','#EF4444','#F97316',
  '#06B6D4','#A855F7','#84CC16','#FBBF24',
]

export const TICKET_CATEGORIES = [
  { key: 'vip',      label: 'VIP / Premium' },
  { key: 'general',  label: 'General Admission' },
  { key: 'earlybird',label: 'Early Bird' },
  { key: 'student',  label: 'Student' },
  { key: 'other',    label: 'Other' },
]

export const ADDON_CATEGORIES = [
  { key: 'hospitality', label: 'Hospitality' },
  { key: 'merchandise', label: 'Merchandise' },
  { key: 'parking',     label: 'Parking' },
  { key: 'experience',  label: 'Experience' },
  { key: 'other',       label: 'Other' },
]

// Common size presets offered as quick-add buttons in the admin modal —
// organizers can still type their own custom sizes too.
export const COMMON_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

// Add-ons can have up to this many gallery images.
export const MAX_ADDON_IMAGES = 3

export const EMPTY_TICKET_FORM = {
  name: '', isFree: false, price: 0, quantity: 100,
  description: '', color: PRESET_COLORS[0],
  category: 'general', benefits: [] as string[],
  whoCanBuy: 'everyone' as 'everyone' | 'students' | 'promo' | 'invited',
  pushServiceCharge: false,
}

export const EMPTY_ADDON_FORM = {
  name: '', isFree: false, price: 0, quantity: 50,
  description: '', color: PRESET_COLORS[3],
  imageUrl: '', images: [] as string[],
  category: 'hospitality' as const, active: true,
  requiresSize: false, sizeOptions: [] as string[],
}

export const isValidHex = (h: string) => /^#[0-9A-Fa-f]{6}$/.test(h)

export const fmtNaira = (n: number) => `₦${n.toLocaleString()}`

export const displayPrice = (item: TicketType | AddOn) =>
  (item.isFree ?? item.price === 0) ? 'Free' : fmtNaira(item.price)