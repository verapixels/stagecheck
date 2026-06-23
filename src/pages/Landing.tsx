// src/pages/LandingPage.tsx
//
// Public marketing homepage. Assembles the named landing components —
// it does no layout/markup of its own beyond stitching them together and
// owning the shared state they need (search text, location, fetched
// events/testimonials, and the richer per-event fields the hero carousel
// needs that the events grid doesn't).

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'

import SiteNavbar from '../components/Navbar'
import HeroSection, { DEFAULT_HERO_STATS, type HeroEvent } from '../components/Hero'
import TrendingEventsSection, { type TrendingEvent } from '../components/Trendingeventssection'
import ImpactSection, { type Testimonial } from '../components/Impactsection'
import PublicFooter from '../components/Publicfooter'
import CookieBanner from '../components/Cookiebanner'

const FALLBACK_GRADIENTS = [
  'linear-gradient(160deg,#1a0a2e 0%,#3b1d7a 50%,#6b21a8 100%)',
  'linear-gradient(160deg,#1a0a00 0%,#7c2d12 50%,#c2410c 100%)',
  'linear-gradient(160deg,#0a1628 0%,#1e3a5f 50%,#2563eb 100%)',
]

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: 't1', quote: 'StageCheck removed all the stress from our choir concert. The song clash detection alone is a game changer.', name: 'Pastor John D.', role: 'Event Organizer' },
  { id: 't2', quote: 'We managed 400+ performers across 3 stages with zero scheduling conflicts.', name: 'Adaeze Okafor', role: 'Festival Director' },
  { id: 't3', quote: 'From ticket sales to live scoring, everything is in one place. Our events have never run smoother.', name: 'Emeka Chukwu', role: 'Competition Organizer' },
]

function toDate(val: any): Date {
  if (!val) return new Date(0)
  if (val?.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}
function isPast(date: any) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return toDate(date) < now
}
function formatTime(time?: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h)) return time
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function LandingPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('Anywhere')

  const [events, setEvents] = useState<TrendingEvent[]>([])
  const [heroEvents, setHeroEvents] = useState<HeroEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setEventsLoading(true); setEventsError('')
        let snap
        try {
          snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'asc'), limit(24)))
        } catch {
          snap = await getDocs(query(collection(db, 'events'), limit(24)))
        }
        if (cancelled) return

        const grid: TrendingEvent[] = []
        const hero: HeroEvent[] = []

         snap.docs.forEach((doc, i) => {
  const d = doc.data()
  console.log('EVENT DOC:', doc.id, {
    name: d.name,
    coverImage: d.coverImage,
    media: d.media,
    date: d.date,
  })
  if (isPast(d.date)) {
    console.log('SKIPPED (past):', d.name, d.date)
    return
  }
  const dt = toDate(d.date)
  const dateLabel = dt.getTime() ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : ''
 grid.push({
  id: doc.id,
  name: d.name ?? 'Unnamed Event',
  dateLabel,
  location: d.venue || d.location || 'TBA',
  time: d.startTime || d.time || '',
  coverImage: d.coverImage || d.media?.[0]?.url || '',
  coverGradient: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
  typeLabel: d.eventType || '',
  attendingCount: d.attendingCount ?? d.ticketsSold ?? 0,
  summary: d.summary || '',
  avatarImages: (d.featuredArtists || [])
    .filter((a: any) => a.image && !a.image.includes('2a96cbd8b46e442fc41c2b86b821562f'))
    .map((a: any) => a.image)
    .slice(0, 3),
})

          const bannerImage = d.coverImage || d.media?.[0]?.url || ''
          if (hero.length < 20) {
            hero.push({
              slug: doc.id,
              title: d.name ?? 'Unnamed Event',
              bannerImage,
              categoryLabel: d.eventType || 'Event',
              dateMonth: dt.getTime() ? dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '',
              dateDay: dt.getTime() ? String(dt.getDate()) : '',
              dateWeekday: dt.getTime() ? dt.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '',
              dateFull: dt.getTime() ? dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
              time: formatTime(d.startTime || d.time),
              location: d.venue || d.location || 'TBA',
              attendees: d.attendingCount ?? d.ticketsSold ?? 0,
              attendeeAvatars: (d.featuredArtists || []).map((a: any) => a.image).filter(Boolean).slice(0, 4),
            })
          }
        })

       setEvents(grid.slice(0, 12))
setHeroEvents(hero)
console.log('HERO ARRAY:', JSON.stringify(hero.map(h => ({ title: h.title, bannerImage: h.bannerImage }))))
        setHeroEvents(hero)
      } catch (err: any) {
        if (!cancelled) setEventsError('Could not load events — ' + (err?.message ?? 'unknown error'))
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadTestimonials() {
      try {
        const snap = await getDocs(collection(db, 'testimonials'))
        if (cancelled || snap.empty) return
        const fetched: Testimonial[] = snap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            quote: data.quote || data.experience || data.text || '',
            name: data.name || 'Anonymous',
            role: data.role || '',
            avatar: data.avatar || data.photoURL || '',
          }
        }).filter(t => t.quote.trim().length > 0)
        if (fetched.length) setTestimonials(fetched)
      } catch { /* keep defaults */ }
    }
    loadTestimonials()
    return () => { cancelled = true }
  }, [])

  const handleSearchSubmit = useCallback(() => {
    navigate(`/events?q=${encodeURIComponent(search)}&loc=${encodeURIComponent(location)}`)
  }, [navigate, search, location])

  const handleGetTickets = useCallback((id: string) => navigate(`/event/${id}`), [navigate])

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        :root {
          --bg: #000612; --bg-card: #060e1c; --bg2: #04091a;
          --green: #0dc75e; --green-dim: rgba(13,199,94,0.12);
          --border: rgba(255,255,255,0.08); --border-g: rgba(13,199,94,0.2);
          --text: #f0faf2; --muted: rgba(255,255,255,0.72); --muted2: rgba(255,255,255,0.45);
          --nav-h: 76px;
          --font-display: 'Fraunces', serif;
          --font-body: 'Inter', sans-serif;
        }
        *,*::before,*::after { box-sizing: border-box; margin:0; padding:0; }
        .stg-page { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }

        .btn-pill {
          display: inline-flex; align-items: center; gap: 10px; padding: 6px 6px 6px 22px;
          border-radius: 999px; background: transparent; border: 1px solid rgba(255,255,255,0.18);
          color: var(--text); font-family: var(--font-body); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: border-color .25s, background .25s; white-space: nowrap;
        }
        .btn-pill:hover { border-color: var(--border-g); background: rgba(13,199,94,0.04); }
        .pill-arrow {
          width: 32px; height: 32px; border-radius: 50%; background: var(--green);
          display: flex; align-items: center; justify-content: center; color: #000;
          flex-shrink: 0; transition: transform .25s;
        }
        .btn-pill:hover .pill-arrow { transform: rotate(45deg); }
        .btn-pill-solid { background: var(--green); border-color: var(--green); color: #000; font-weight: 700; }
        .btn-pill-solid .pill-arrow { background: #000; color: var(--green); }
      `}</style>

      <div className="stg-page">
        <SiteNavbar
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          locationLabel={location}
          onLocationChange={setLocation}
        />

        <HeroSection events={heroEvents} stats={DEFAULT_HERO_STATS} />

        <TrendingEventsSection
          events={events}
          loading={eventsLoading}
          error={eventsError}
          onGetTickets={handleGetTickets}
        />

        <ImpactSection testimonials={testimonials} />

        <PublicFooter />
        <CookieBanner />
      </div>
    </>
  )
}