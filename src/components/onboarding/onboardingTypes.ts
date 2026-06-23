export type FeaturedArtist = {
  name: string
  image: string
  genre: string
  listeners: string
  bio: string
  mbid?: string
  role?: string
}

export type MediaItem = {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
}

export type AgendaItem = { id: string; time: string; title: string; speaker?: string }
export type FAQItem = { id: string; question: string; answer: string }
export type GoodToKnow = { ageInfo: string; doorTime: string; parkingInfo: string }
export type RepeatingDate = { id: string; date: string; startTime: string; endTime: string; notes: string }

export type OnboardingForm = {
  eventName: string
  summary: string
  eventDate: string
  endDate: string
  startTime: string
  endTime: string
  isRepeating: boolean
  venue: string
  address: string
  locationType: 'venue' | 'online' | 'tba'
  description: string
  organizerName: string
  organizerEmail: string
  organizerPhone: string
  maxPerformers: string
}

export type OnboardingStep = 'event-type' | 'event-details' | 'modules'
export type LineupSearchMode = 'artist' | 'figure' | 'manual'

export type SubmissionField = {
  id: string
  label: string
  type: string
  required: boolean
  alwaysOn: boolean
}