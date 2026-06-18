import { useEffect, useState, useRef, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import PublicFooter from '../components/Publicfooter'

import {
  RiMusicLine, RiCalendarEventLine, RiTrophyLine, RiTicketLine,
  RiBarChartLine, RiMessage2Line, RiArrowRightLine, RiPlayCircleLine,
  RiMapPinLine, RiTimeLine, RiGroupLine,
  RiArrowLeftSLine, RiArrowRightSLine,
  RiInstagramLine, RiTwitterXLine, RiYoutubeLine,
  RiFacebookCircleLine, RiFlashlightLine, RiSparklingLine, RiLoader4Line,
  RiSearchLine, RiAddLine, RiArrowUpLine,
  RiCloseLine, RiCheckLine, RiShieldCheckLine, RiContractLine,
  RiHeartLine, RiLightbulbLine, RiRocketLine, RiTeamLine,
  RiGlobalLine, RiCustomerService2Line,
  RiSlideshowLine, RiMicLine, RiGraduationCapLine, RiStarLine,
} from 'react-icons/ri'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeaturedArtist {
  name: string
  image: string
  genre?: string
}

interface FirebaseEvent {
  id: string
  name: string
  date: Timestamp | Date | string
  location: string
  venue?: string
  time: string
  startTime?: string
  attendingCount?: number
  coverImage?: string
  coverGradient?: string
  joinCode?: string
  summary?: string
  eventType?: string
  featuredArtists?: FeaturedArtist[]
}

// Testimonial from Firestore (admin dashboard will write to 'testimonials' collection)
interface Testimonial {
  id: string
  quote: string
  name: string
  role: string
  avatar?: string
  order?: number
}

const GRADIENTS = [
  'linear-gradient(160deg,#1a0a2e 0%,#3b1d7a 50%,#6b21a8 100%)',
  'linear-gradient(160deg,#1a0a00 0%,#7c2d12 50%,#c2410c 100%)',
  'linear-gradient(160deg,#0a1628 0%,#1e3a5f 50%,#2563eb 100%)',
  'linear-gradient(160deg,#0f0a1e 0%,#3b0764 50%,#7c3aed 100%)',
  'linear-gradient(160deg,#0a1e10 0%,#0d5f2e 50%,#0dc75e 100%)',
  'linear-gradient(160deg,#1e0a0a 0%,#7c1212 50%,#dc2626 100%)',
]

const EVENT_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  choir:       { label: 'Choir Concert',      icon: <RiMusicLine />,         color: '#22C55E' },
  talent:      { label: 'Talent Show',        icon: <RiFlashlightLine />,    color: '#F59E0B' },
  conference:  { label: 'Conference',         icon: <RiSlideshowLine />,     color: '#3B82F6' },
  competition: { label: 'Competition',        icon: <RiTrophyLine />,        color: '#8B5CF6' },
  drama:       { label: 'Drama / Theatre',    icon: <RiSparklingLine />,     color: '#EC4899' },
  worship:     { label: 'Worship Night',      icon: <RiHeartLine />,         color: '#14B8A6' },
  openmic:     { label: 'Open Mic',           icon: <RiMicLine />,           color: '#F97316' },
  graduation:  { label: 'Award / Graduation', icon: <RiGraduationCapLine />, color: '#06B6D4' },
  custom:      { label: 'Event',              icon: <RiSparklingLine />,     color: '#A78BFA' },
}

function getTypeLabel(type?: string) { return EVENT_TYPE_META[type || 'custom']?.label || 'Event' }
function getTypeColor(type?: string) { return EVENT_TYPE_META[type || 'custom']?.color || '#0dc75e' }

function toDate(val: any): Date {
  if (!val) return new Date(0)
  if (val?.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}

function formatEventDate(val: any): string {
  try {
    const d = toDate(val)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
  } catch { return '' }
}

function formatTime(time?: string): string {
  if (!time) return ''
  try {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch { return time }
}

function daysUntil(val: any): number {
  const d = toDate(val)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

function isEventPast(date: any): boolean {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return toDate(date) < now
}

// Default testimonials shown if Firestore has none yet
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: 't1', quote: "StageCheck removed all the stress from our choir concert. The song clash detection alone is a game changer!", name: "Pastor John D.", role: "Event Organizer", avatar: "https://i.pravatar.cc/80?img=12" },
  { id: 't2', quote: "We managed 400+ performers across 3 stages with zero scheduling conflicts. Absolutely incredible platform.", name: "Adaeze Okafor", role: "Festival Director", avatar: "https://i.pravatar.cc/80?img=47" },
  { id: 't3', quote: "From ticket sales to live scoring, everything is in one place. Our events have never run smoother.", name: "Emeka Chukwu", role: "Competition Organizer", avatar: "https://i.pravatar.cc/80?img=33" },
]

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  })
}

// ─── Particle Canvas ─────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    type P = { x: number; y: number; vx: number; vy: number; r: number; o: number }
    const ps: P[] = []
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < 55; i++) ps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.8 + .4, o: Math.random() * .45 + .08 })
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(13,199,94,${p.o})`; ctx.fill()
      })
      ps.forEach((a, i) => ps.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < 90) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(13,199,94,${.05 * (1 - d / 90)})`; ctx.lineWidth = .5; ctx.stroke() }
      }))
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ ev, idx, onGetTickets }: { ev: FirebaseEvent; idx: number; onGetTickets: (id: string) => void }) {
  const navigate = useNavigate()
  const typeColor = getTypeColor(ev.eventType)
  const days = daysUntil(ev.date)
  const displayLoc = ev.venue || ev.location || 'TBA'
  const displayTime = ev.startTime ? formatTime(ev.startTime) : ev.time || ''
  const hasCover = !!ev.coverImage?.startsWith('http')
  const validArtists = (ev.featuredArtists || []).filter(a => a.image && !a.image.includes('2a96cbd8b46e442fc41c2b86b821562f'))
  const fallbackColors = ['#8b5cf6', '#ec4899', '#f59e0b']

  return (
    <div className={`ev-card reveal zi d${(idx % 3) + 1}`} onClick={() => navigate(`/event/${ev.id}`)}>
      <div className="ev-cover" style={{
        background: hasCover ? undefined : (ev.coverGradient || GRADIENTS[idx % GRADIENTS.length]),
      }}>
        {hasCover && <img src={ev.coverImage} alt={ev.name} className="ev-cover-photo" />}
        <div className="ev-cover-overlay" />
        <div className="ev-type-badge">
          <span style={{ fontSize: 10, color: typeColor, display: 'inline-flex', alignItems: 'center' }}>
            {EVENT_TYPE_META[ev.eventType || 'custom']?.icon}
          </span>
          {getTypeLabel(ev.eventType)}
        </div>
        {days >= 0 && days <= 7 && (
          <div className="ev-days-badge" style={{ background: days === 0 ? '#dc2626' : days <= 3 ? '#d97706' : '#0dc75e' }}>
            {days === 0 ? 'TODAY' : `${days}d left`}
          </div>
        )}
        <div className="ev-date-chip">{formatEventDate(ev.date)}</div>
        <h3 className="ev-name">{ev.name}</h3>
      </div>
      <div className="ev-body">
        {ev.summary && <p className="ev-summary">{ev.summary}</p>}
        <div className="ev-meta-row"><RiMapPinLine size={12} /><span>{displayLoc}</span></div>
        {displayTime && <div className="ev-meta-row"><RiTimeLine size={12} /><span>{displayTime}</span></div>}
        <div className="ev-footer">
          <div className="ev-avatars">
            {Array.from({ length: 3 }, (_, i) => {
              const artist = validArtists[i]
              return artist ? (
                <span key={i} className="ev-av" style={{ marginLeft: i ? -8 : 0, zIndex: 3 - i, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: fallbackColors[i] }}>
                  <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </span>
              ) : (
                <span key={i} className="ev-av" style={{ background: fallbackColors[i], marginLeft: i ? -8 : 0, zIndex: 3 - i }} />
              )
            })}
            <span className="ev-av-count">{ev.attendingCount ? `${ev.attendingCount}+ attending` : 'Be first'}</span>
          </div>
          <button className="ev-btn" style={{ '--tc': typeColor } as React.CSSProperties} onClick={e => { e.stopPropagation(); onGetTickets(ev.id) }}>
            <RiTicketLine size={12} /> Tickets
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 3D Feature Icon ──────────────────────────────────────────────────────────
function F3D({ icon, color, bg }: { icon: React.ReactNode; color: string; bg: string }) {
  return <div className="f3d-icon" style={{ '--ic': color, '--ib': bg } as React.CSSProperties}>{icon}</div>
}

// ─── Testimonial Carousel (auto-scroll + Firestore) ───────────────────────────
function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [idx, setIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((next: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setIdx(next)
      setAnimating(false)
    }, 350)
  }, [animating])

  const prev = useCallback(() => goTo((idx - 1 + testimonials.length) % testimonials.length), [idx, testimonials.length, goTo])
  const next = useCallback(() => goTo((idx + 1) % testimonials.length), [idx, testimonials.length, goTo])

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % testimonials.length)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [testimonials.length])

  // Reset timer on manual nav
  const manualNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current)
    fn()
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % testimonials.length)
    }, 5000)
  }

  const t = testimonials[idx]
  const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="tcard reveal sr">
      {/* Progress bar */}
      <div className="tcard-progress">
        {testimonials.map((_, i) => (
          <div
            key={i}
            className={`tcard-prog-seg ${i === idx ? 'active' : i < idx ? 'done' : ''}`}
            onClick={() => manualNav(() => goTo(i))}
          />
        ))}
      </div>

      <div className={`tcard-inner ${animating ? 'fading' : 'visible'}`}>
        <div className="tcard-stars">
          {[...Array(5)].map((_, i) => <RiStarLine key={i} size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />)}
        </div>
        <div className="tcard-q">"</div>
        <p className="tcard-txt">"{t.quote}"</p>
        <div className="tcard-auth">
          {t.avatar ? (
            <img
              src={t.avatar}
              alt={t.name}
              className="t-av"
              onError={e => {
                const img = e.target as HTMLImageElement
                img.style.display = 'none'
                const next = img.nextElementSibling as HTMLElement
                if (next) next.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="t-av-fallback" style={{ display: t.avatar ? 'none' : 'flex' }}>{initials}</div>
          <div>
            <div className="t-name">{t.name}</div>
            <div className="t-role">{t.role}</div>
          </div>
        </div>
      </div>

      <div className="tcard-nav">
        <button className="circ-btn" onClick={() => manualNav(prev)}><RiArrowLeftSLine size={17} /></button>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {testimonials.map((_, i) => (
            <div
              key={i}
              onClick={() => manualNav(() => goTo(i))}
              style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 4,
                background: i === idx ? 'var(--green)' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer', transition: 'all .3s'
              }}
            />
          ))}
        </div>
        <button className="circ-btn" onClick={() => manualNav(next)}><RiArrowRightSLine size={17} /></button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  useScrollReveal()

  const [events, setEvents] = useState<FirebaseEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [stats, setStats] = useState({ events: '18K+', performers: '120K+', tickets: '2M+', satisfaction: '98%' })
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [eventsPage, setEventsPage] = useState(0)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Fetch events

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setEventsLoading(true); setEventsError('')
        let snap
        try {
          const q = query(collection(db, 'events'), orderBy('date', 'asc'), limit(20))
          snap = await getDocs(q)
        } catch {
          const q2 = query(collection(db, 'events'), limit(20))
          snap = await getDocs(q2)
        }
        if (cancelled) return
        const fetched: FirebaseEvent[] = snap.docs.map((doc, i) => ({
          id: doc.id,
          name: doc.data().name ?? 'Unnamed Event',
          date: doc.data().date ?? Timestamp.now(),
          location: doc.data().location ?? 'TBA',
          venue: doc.data().venue ?? '',
          time: doc.data().time ?? '',
          startTime: doc.data().startTime ?? '',
          attendingCount: doc.data().attendingCount ?? doc.data().ticketsSold ?? 0,
          coverImage: doc.data().coverImage ?? '',
          coverGradient: GRADIENTS[i % GRADIENTS.length],
          joinCode: doc.data().joinCode ?? '',
          summary: doc.data().summary ?? '',
          eventType: doc.data().eventType ?? 'custom',
          featuredArtists: doc.data().featuredArtists ?? [],
        }))
        // Sort by soonest date first — visitors see what's happening next
        const upcoming = fetched.filter(ev => !isEventPast(ev.date)).sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
        // Shuffle so order changes on every page load
          const shuffled = [...upcoming].sort(() => Math.random() - 0.5)
         setEvents(shuffled)
      } catch (err: any) {
        if (!cancelled) setEventsError('Could not load events — ' + (err?.message ?? 'unknown error'))
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Fetch platform stats
  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const snap = await getDocs(collection(db, 'platformStats'))
        if (!snap.empty && !cancelled) {
          const d = snap.docs[0].data()
          setStats({ events: d.eventsManaged ?? '18K+', performers: d.performersRegistered ?? '120K+', tickets: d.ticketsIssued ?? '2M+', satisfaction: d.customerSatisfaction ?? '98%' })
        }
      } catch { }
    }
    loadStats()
    return () => { cancelled = true }
  }, []) 

   useEffect(() => {
  let cancelled = false
  async function loadTestimonials() {
    try {
      // Try ordered first, fall back to unordered — either way don't silently bail
      let snap
      try {
        const q = query(collection(db, 'testimonials'), orderBy('order', 'asc'), limit(10))
        snap = await getDocs(q)
      } catch {
        snap = await getDocs(collection(db, 'testimonials'))
      }
      if (cancelled) return
      if (!snap.empty) {
        const fetched: Testimonial[] = snap.docs
          .map(d => {
            const data = d.data()
            return {
              id: d.id,
              // read every possible field name
              quote: data.quote || data.experience || data.description || data.text || '',
              name: data.name || 'Anonymous',
              role: data.role || data.usedFor || '',
              // read every possible photo field name
              avatar: data.avatar || data.photoURL || data.photoUrl || '',
              order: data.order ?? 0,
            }
          })
          // only filter out entries with no quote — don't filter by name
          .filter(t => t.quote.trim().length > 0)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        if (fetched.length > 0) setTestimonials(fetched)
      }
    } catch (e) {
      console.error('loadTestimonials error:', e)
      // silently stay with defaults
    }
  }
  loadTestimonials()
  return () => { cancelled = true }
}, [])

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), menuOpen ? 400 : 0)
  }, [menuOpen])

  const handleGetTickets = useCallback((eventId: string) => navigate(`/event/${eventId}`), [navigate])

  const navItems = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Events', id: 'events' },
    { label: 'Why Us', id: 'why-us' },
  ]

  const features = [
    { icon: <RiMusicLine />, color: '#0dc75e', bg: 'rgba(13,199,94,0.08)', title: 'Smart Submissions', desc: 'Auto song detection, clash prevention and dynamic forms that adapt to your event type.' },
    { icon: <RiCalendarEventLine />, color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', title: 'Live Stage Control', desc: 'Real-time schedules, countdowns and stage management tools at your fingertips.' },
    { icon: <RiTrophyLine />, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', title: 'Judging & Scoring', desc: 'Flexible scoring systems, live leaderboards and instant result announcements.' },
    { icon: <RiTicketLine />, color: '#f87171', bg: 'rgba(239,68,68,0.08)', title: 'Ticketing Made Easy', desc: 'Sell tickets, scan QR codes and track attendance with zero friction.' },
    { icon: <RiBarChartLine />, color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', title: 'Analytics & Reports', desc: 'Powerful insights to measure impact, optimize events and prove ROI.' },
    { icon: <RiMessage2Line />, color: '#2dd4bf', bg: 'rgba(20,184,166,0.08)', title: 'Communication Hub', desc: 'Built-in announcements, messaging and automated reminders for everyone.' },
  ]

  const CARDS_PER_PAGE = 3
  const visibleEvents = events.slice(eventsPage * CARDS_PER_PAGE, eventsPage * CARDS_PER_PAGE + CARDS_PER_PAGE)
  const totalPages = Math.ceil(events.length / CARDS_PER_PAGE)

  const whyItems = [
    { icon: <RiRocketLine />, color: '#0dc75e', title: 'Launch in Minutes', desc: 'Go from idea to live event in under 5 minutes. No technical skills needed.' },
    { icon: <RiShieldCheckLine />, color: '#60a5fa', title: 'Enterprise Security', desc: 'Bank-grade encryption, secure payments and GDPR-compliant data handling.' },
    { icon: <RiTeamLine />, color: '#a78bfa', title: 'Built for Teams', desc: 'Multi-user access with roles, permissions and real-time collaboration tools.' },
    { icon: <RiGlobalLine />, color: '#fbbf24', title: 'Works Everywhere', desc: 'Mobile-first design. Works perfectly on any device, any browser, anywhere.' },
    { icon: <RiCustomerService2Line />, color: '#f87171', title: '24/7 Support', desc: 'Dedicated support team ready to help before, during and after your event.' },
    { icon: <RiLightbulbLine />, color: '#2dd4bf', title: 'Constantly Evolving', desc: 'New features added every week based on real organizer feedback and needs.' },
  ]

  // Stat cards data
  const statCards = [
    { icon: <RiCalendarEventLine />, val: stats.events, lbl: 'Events Managed', color: '#0dc75e', bg: 'rgba(13,199,94,0.08)' },
    { icon: <RiFlashlightLine />, val: stats.performers, lbl: 'Performers Registered', color: '#a78bfa', bg: 'rgba(139,92,246,0.08)' },
    { icon: <RiTicketLine />, val: stats.tickets, lbl: 'Tickets Issued', color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
    { icon: <RiSparklingLine />, val: stats.satisfaction, lbl: 'Customer Satisfaction', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  ]

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #000612; --bg-card: #060e1c; --bg2: #04091a;
          --green: #0dc75e; --green-dim: rgba(13,199,94,0.12);
          --border: rgba(255,255,255,0.08); --border-g: rgba(13,199,94,0.2);
          --text: #f0faf2;
          /* ── FIXED: much more visible muted colors ── */
          --muted: rgba(255,255,255,0.72);
          --muted2: rgba(255,255,255,0.45);
          --nav-h: 70px;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes glow-b  { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.7;transform:scale(1.08)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes beam-in { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
        @keyframes menuIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes statPop { from{opacity:0;transform:translateY(20px) scale(.94)} to{opacity:1;transform:none} }
        @keyframes prog    { from{width:0%} to{width:100%} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }

        .reveal { opacity:0; transition: opacity .75s cubic-bezier(.16,1,.3,1), transform .75s cubic-bezier(.16,1,.3,1); }
        .reveal.fy  { transform: translateY(36px); }
        .reveal.zi  { transform: scale(.9); }
        .reveal.sl  { transform: translateX(-44px); }
        .reveal.sr  { transform: translateX(44px); }
        .reveal.in-view { opacity:1 !important; transform:none !important; }
        .d1{transition-delay:.08s} .d2{transition-delay:.16s} .d3{transition-delay:.24s}
        .d4{transition-delay:.32s} .d5{transition-delay:.40s} .d6{transition-delay:.48s}

        .sc { background:var(--bg); color:var(--text); font-family:var(--font-body); font-size:15px; line-height:1.6; overflow-x:hidden; min-height:100vh; }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          height: var(--nav-h);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(16px, 4%, 64px);
          transition: background .3s ease, box-shadow .3s ease, border-color .3s ease;
          border-bottom: 1px solid transparent;
        }
        .nav.scrolled {
          background: rgba(0,4,14,.96);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom-color: var(--border);
          box-shadow: 0 4px 32px rgba(0,0,0,.5);
        }
        .logo { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; text-decoration:none; }
        .logo-img { height:40px; width:auto; object-fit:contain; display:block; }

        .nav-center {
          display: flex; align-items: center; gap: 2px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 40px; padding: 4px;
        }
        .nav-pill {
          position: relative; padding: 7px 18px; border-radius: 36px;
          font-size: 13.5px; font-weight: 500; color: var(--muted);
          cursor: pointer; background: none; border: none;
          font-family: var(--font-body);
          transition: color .2s; white-space: nowrap;
        }
        .nav-pill:hover { color: var(--text); }

        .nav-r { display:flex; gap:10px; align-items:center; }
        .btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text); font-family:var(--font-body); transition:all .2s; flex-shrink:0; }
        .btn-ghost:hover { border-color:var(--border-g); color:var(--green); }
        .btn-green { display:inline-flex; align-items:center; gap:7px; padding:9px 22px; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; background:var(--green); border:none; color:#000; font-family:var(--font-body); transition:all .2s; box-shadow:0 0 20px rgba(13,199,94,.25); flex-shrink:0; }
        .btn-green:hover { background:#2fe070; box-shadow:0 0 32px rgba(13,199,94,.45); transform:translateY(-1px); }

        /* Mobile menu */
        .mob-trigger {
          display: none; width: 40px; height: 40px;
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          border-radius: 10px; cursor: pointer; align-items: center; justify-content: center;
          flex-direction: column; gap: 5px; padding: 10px; transition: all .2s;
        }
        .mob-trigger:hover { border-color: var(--border-g); }
        .mob-trigger span { display: block; height: 1.5px; background: var(--text); border-radius: 2px; transition: all .35s cubic-bezier(.16,1,.3,1); }
        .mob-trigger span:nth-child(1) { width: 20px; }
        .mob-trigger span:nth-child(2) { width: 14px; align-self: flex-end; }
        .mob-trigger span:nth-child(3) { width: 18px; }
        .mob-trigger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); width: 20px; }
        .mob-trigger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .mob-trigger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); width: 20px; }

        .mob-overlay {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,4,14,.98); backdrop-filter: blur(32px);
          display: flex; flex-direction: column;
          padding: var(--nav-h) 0 0;
          pointer-events: none; opacity: 0;
          transition: opacity .35s cubic-bezier(.16,1,.3,1);
        }
        .mob-overlay.open { pointer-events: all; opacity: 1; }
        .mob-inner {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px; padding: 32px 24px;
          animation: menuIn .4s ease both;
        }
        .mob-link {
          width: 100%; max-width: 340px; text-align: center;
          font-family: var(--font-display); font-size: clamp(22px,6vw,32px); font-weight: 700;
          color: var(--muted); background: none; border: none; cursor: pointer;
          padding: 14px 24px; border-radius: 14px;
          transition: all .25s; border: 1px solid transparent;
        }
        .mob-link:hover { color: var(--text); background: rgba(255,255,255,.03); border-color: var(--border); }
        .mob-divider { width: 60px; height: 1px; background: var(--border); margin: 12px 0; }
        .mob-btns { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 340px; margin-top: 8px; }
        .mob-btn-g { display: block; width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; background: var(--green); border: none; color: #000; font-family: var(--font-body); text-align: center; }
        .mob-btn-o { display: block; width: 100%; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 15px; cursor: pointer; background: transparent; border: 1px solid var(--border); color: var(--text); font-family: var(--font-body); text-align: center; }
        .mob-social { display: flex; gap: 14px; margin-top: 24px; }
        .mob-soc-ic { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,.04); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); cursor: pointer; transition: all .2s; font-size: 17px; }
        .mob-soc-ic:hover { color: var(--green); border-color: var(--border-g); }

        /* ── HERO ── */
        .hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: calc(var(--nav-h) + 28px) clamp(16px,5%,80px) 32px;
          overflow: hidden; text-align: center;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background-image: url('/heroimagebckground.png');
          background-size: cover; background-position: center;
        }
        .hero-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg,rgba(0,6,18,.82) 0%,rgba(0,6,18,.55) 40%,rgba(0,6,18,.9) 100%);
        }
        .hero-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 1; animation: glow-b 5s ease-in-out infinite; }
        .hero-content { position: relative; z-index: 3; width: 100%; max-width: 760px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(13,199,94,.07); border: 1px solid rgba(13,199,94,.2);
          border-radius: 24px; padding: 5px 16px;
          font-size: 11px; color: var(--green); font-weight: 700; letter-spacing: .1em;
          margin-bottom: 22px;
        }
        .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 1.4s infinite; flex-shrink:0; }
        .hero-h1 {
          font-family: var(--font-display);
          font-size: clamp(28px, 6.5vw, 76px);
          font-weight: 800; line-height: 1.05;
          margin-bottom: 18px; letter-spacing: -1px;
          /* desktop: never break words */
          word-break: normal;
          overflow-wrap: normal;
          hyphens: none;
        }
        /* mobile only: allow word wrap so "Unforgettable" fits */
        @media (max-width: 480px) {
          .hero-h1 {
            font-size: clamp(26px, 8vw, 44px);
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            letter-spacing: -0.5px;
          }
        }
        .hero-accent { color: var(--green); }
        .hero-accent-u { color: var(--green); position: relative; display:inline-block; }
        .hero-accent-u::after {
          content: ''; position: absolute; bottom: 4px; left: 0; right: 0; height: 3px;
          background: var(--green); border-radius: 2px;
          transform-origin: left; animation: beam-in 1s ease .9s both;
        }
        .hero-p {
          color: rgba(255,255,255,0.75);
          font-size: clamp(14px,1.8vw,16px); line-height: 1.7; margin-bottom: 28px;
          max-width: 520px; margin-left: auto; margin-right: auto;
        }
        .hero-search {
          display: flex; align-items: center;
          background: rgba(6,14,28,.92); border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px; padding: 5px 5px 5px 18px;
          max-width: 560px; width: 100%;
          margin: 0 auto 24px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(13,199,94,.05);
          transition: box-shadow .3s, border-color .3s;
        }
        .hero-search:focus-within {
          box-shadow: 0 8px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(13,199,94,.28);
          border-color: rgba(13,199,94,.28);
        }
        .hero-search input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 14px; font-family: var(--font-body); padding: 9px 0;
        }
        .hero-search input::placeholder { color: rgba(255,255,255,0.45); }
        .search-div { width: 1px; height: 24px; background: var(--border); margin: 0 14px; flex-shrink: 0; }
        .hero-cta-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 32px; }
        .btn-cta-p { font-size: 14px !important; padding: 13px 28px !important; border-radius: 11px !important; }
        .btn-cta-s {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 11px; font-size: 14px; font-weight: 600;
          cursor: pointer; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
          color: var(--text); font-family: var(--font-body); transition: all .2s;
        }
        .btn-cta-s:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); }
        .hero-stats {
          display: flex; align-items: center; gap: clamp(16px,3vw,36px);
          justify-content: center; flex-wrap: wrap;
          padding-top: 20px; border-top: 1px solid var(--border);
        }
        .hs-num { font-family:var(--font-display); font-size: clamp(20px,2.5vw,28px); font-weight:800; color:var(--text); }
        .hs-lbl { font-size:11px; color:rgba(255,255,255,0.65); }
        .hs-div { width:1px; height:32px; background:var(--border); flex-shrink:0; }

        /* ── SECTIONS ── */
        .section { padding: clamp(48px,8vw,96px) clamp(16px,5%,80px); }
        .section-sm { padding: clamp(40px,6vw,72px) clamp(16px,5%,80px); }
        .eyebrow { font-size:11px; font-weight:700; color:var(--green); letter-spacing:.12em; text-transform:uppercase; margin-bottom:12px; display:block; }
        .sh2 { font-family:var(--font-display); font-size:clamp(26px,4vw,46px); font-weight:800; line-height:1.08; }
        .sh2-sub { font-size:14px; color:rgba(255,255,255,0.68); margin-top:10px; }

        /* ── EVENTS ── */
        .events-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:32px; gap:20px; flex-wrap:wrap; }
        .events-header-left { flex: 1; min-width: 0; }
        .events-header-right { display:flex; align-items:center; gap:10px; flex-shrink:0; flex-wrap:wrap; }
        @media (max-width:600px) {
          .events-header { flex-direction: column; }
          .events-header-right { width: 100%; justify-content: space-between; }
        }
        .events-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media (max-width:900px) { .events-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:540px) { .events-grid { grid-template-columns:1fr !important; } }

        /* ── EVENT CARD ── */
        .ev-card {
          border-radius:18px; overflow:hidden;
          background:var(--bg-card); border:1px solid var(--border);
          cursor:pointer;
          transition: transform .3s cubic-bezier(.16,1,.3,1), border-color .3s, box-shadow .3s;
          display:flex; flex-direction:column;
        }
        .ev-card:hover { transform:translateY(-7px) scale(1.01); border-color:rgba(13,199,94,.2); box-shadow:0 24px 52px rgba(0,0,0,.6), 0 0 0 1px rgba(13,199,94,.07); }
        .ev-cover { height:200px; position:relative; display:flex; flex-direction:column; justify-content:flex-end; padding:14px; background-size:cover; background-position:center; }
        .ev-cover-photo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }
        .ev-cover-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.1) 55%); }
        .ev-type-badge { position:absolute; top:12px; left:12px; z-index:2; display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:10px; font-weight:700; backdrop-filter:blur(12px); letter-spacing:.04em; background:rgba(0,0,0,0.62); border:1px solid rgba(255,255,255,0.18); color:#fff; }
        .ev-days-badge { position:absolute; top:12px; right:12px; z-index:2; padding:3px 8px; border-radius:7px; font-size:9px; font-weight:800; color:#fff; letter-spacing:.06em; }
        .ev-date-chip { position:absolute; bottom:42px; left:14px; z-index:2; font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.7); letter-spacing:.04em; }
        .ev-name { font-family:var(--font-display); font-weight:800; font-size:18px; color:#fff; line-height:1.15; position:relative; z-index:2; }
        .ev-body { padding:14px 16px 16px; display:flex; flex-direction:column; gap:4px; flex:1; }
        .ev-summary { font-size:12px; color:rgba(255,255,255,0.62); line-height:1.6; margin-bottom:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ev-meta-row { display:flex; align-items:center; gap:6px; font-size:11.5px; color:rgba(255,255,255,0.62); }
        .ev-meta-row span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ev-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
        .ev-avatars { display:flex; align-items:center; gap:6px; }
        .ev-av { width:22px; height:22px; border-radius:50%; border:2px solid var(--bg-card); display:inline-block; flex-shrink:0; }
        .ev-av-count { font-size:11px; color:rgba(255,255,255,0.6); margin-left:4px; }
        .ev-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; background:var(--tc); border:none; color:#000; font-family:var(--font-body); transition:all .2s; }
        .ev-btn:hover { filter:brightness(1.15); transform:translateY(-1px); box-shadow:0 5px 16px color-mix(in srgb,var(--tc) 35%,transparent); }
        .ev-empty { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 0; color:rgba(255,255,255,0.62); font-size:14px; text-align:center; }
        .ev-pagination { display:flex; align-items:center; gap:10px; }
        .pg-btn { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.04); border:1px solid var(--border); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .pg-btn:hover:not(:disabled) { border-color:rgba(13,199,94,.4); color:var(--green); }
        .pg-btn:disabled { opacity:.35; cursor:not-allowed; }
        .pg-dots { display:flex; gap:6px; }
        .pg-dot { width:6px; height:6px; border-radius:50%; background:var(--border); transition:all .2s; cursor:pointer; }
        .pg-dot.active { background:var(--green); width:18px; border-radius:4px; }

        /* ── FEATURES ── */
        .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media (max-width:900px) { .feat-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:540px) { .feat-grid { grid-template-columns:1fr !important; } }
        .feat-card { background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:28px; transition:all .3s cubic-bezier(.16,1,.3,1); }
        .feat-card:hover { transform:translateY(-5px); border-color:rgba(13,199,94,.2); box-shadow:0 18px 52px rgba(0,0,0,.5); }
        .f3d-icon { width:60px; height:60px; border-radius:17px; background:var(--ib); border:1px solid color-mix(in srgb, var(--ic) 30%, transparent); display:flex; align-items:center; justify-content:center; color:var(--ic); font-size:26px; margin-bottom:18px; box-shadow:0 8px 28px color-mix(in srgb, var(--ic) 18%, transparent); }
        .feat-h4 { font-family:var(--font-display); font-weight:700; font-size:15.5px; margin-bottom:9px; }
        .feat-p { font-size:13px; color:rgba(255,255,255,0.68); line-height:1.65; }

        /* ── STATS CARDS (new) ── */
        .stats-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width:480px) { .stats-cards-grid { grid-template-columns: 1fr !important; } }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px 22px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          transition: transform .3s cubic-bezier(.16,1,.3,1), border-color .3s, box-shadow .3s;
          animation: statPop .55s cubic-bezier(.16,1,.3,1) both;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--sc), transparent);
          border-radius: 18px 18px 0 0;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          border-color: color-mix(in srgb, var(--sc) 30%, transparent);
          box-shadow: 0 16px 48px rgba(0,0,0,.5),
                      0 0 0 1px color-mix(in srgb, var(--sc) 12%, transparent);
        }
        .stat-card-ic {
          width: 60px; height: 60px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px;
          color: var(--sc);
          background: color-mix(in srgb, var(--sc) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--sc) 20%, transparent);
          flex-shrink: 0;
        }
        .stat-card-num {
          font-family: var(--font-display);
          font-size: clamp(36px, 4.5vw, 52px);
          font-weight: 800;
          line-height: 1;
          color: var(--text);
          letter-spacing: -1px;
        }
        .stat-card-lbl {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.62);
          margin-top: 2px;
        }

        /* ── WHY US ── */
        .why-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media (max-width:900px) { .why-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:540px) { .why-grid { grid-template-columns:1fr !important; } }
        .why-card { background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:28px; transition:all .3s; }
        .why-card:hover { transform:translateY(-4px); border-color:rgba(13,199,94,.18); box-shadow:0 16px 48px rgba(0,0,0,.4); }
        .why-ic { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:16px; }
        .why-h4 { font-family:var(--font-display); font-weight:700; font-size:15px; margin-bottom:8px; }
        .why-p { font-size:13px; color:rgba(255,255,255,0.68); line-height:1.6; }

        /* ── STATS + TESTIMONIAL layout ── */
        .ts-grid { display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
        @media (max-width:820px) { .ts-grid { grid-template-columns:1fr !important; gap:40px !important; } }

        /* ── TESTIMONIAL CARD (auto-scroll) ── */
        .tcard {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 20px; padding: 28px 28px 22px; position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 0;
        }

        /* Progress bar row */
        .tcard-progress {
          display: flex; gap: 5px; margin-bottom: 20px;
        }
        .tcard-prog-seg {
          flex: 1; height: 3px; border-radius: 3px;
          background: rgba(255,255,255,0.1);
          cursor: pointer; position: relative; overflow: hidden;
          transition: background .2s;
        }
        .tcard-prog-seg.done { background: rgba(13,199,94,0.4); }
        .tcard-prog-seg.active { background: rgba(13,199,94,0.15); }
        .tcard-prog-seg.active::after {
          content: ''; position: absolute; inset: 0;
          background: var(--green);
          animation: prog 5s linear forwards;
        }

        .tcard-inner {
          transition: opacity .35s ease, transform .35s ease;
          flex: 1;
        }
        .tcard-inner.fading { opacity: 0; transform: translateY(8px); }
        .tcard-inner.visible { opacity: 1; transform: none; }

        .tcard-stars { display: flex; gap: 3px; margin-bottom: 14px; }
        .tcard-q { font-size:64px; color:var(--green); line-height:1; opacity:.12; font-family:Georgia,serif; position:absolute; top:58px; left:22px; }
        .tcard-txt { font-size:15px; line-height:1.78; margin-bottom:22px; color:rgba(255,255,255,0.88); font-style:italic; }
        .tcard-auth { display:flex; align-items:center; gap:12px; margin-bottom: 18px; }
        .t-av { width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid rgba(13,199,94,.3); flex-shrink:0; }
        .t-av-fallback {
          width:48px; height:48px; border-radius:50%;
          background: linear-gradient(135deg, var(--green), #0a9444);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: 16px; color: #000;
          flex-shrink: 0; border: 2px solid rgba(13,199,94,.3);
        }
        .t-name { font-weight:700; font-size:14px; }
        .t-role { font-size:12px; color:rgba(255,255,255,0.62); }
        .tcard-nav { display:flex; align-items:center; justify-content:space-between; }
        .circ-btn { width:34px; height:34px; border-radius:50%; background:rgba(255,255,255,0.04); border:1px solid var(--border); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .circ-btn:hover { border-color:rgba(13,199,94,.4); color:var(--green); }

        /* ── HOW IT WORKS ── */
        .steps-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0; margin-top:52px; position:relative; }
        @media (max-width:820px) { .steps-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:480px) { .steps-grid { grid-template-columns:1fr !important; } }
        .step-conn { position:absolute; top:38px; left:12.5%; right:12.5%; height:1px; background:linear-gradient(90deg,transparent,rgba(13,199,94,.25),transparent); }
        @media (max-width:820px) { .step-conn { display:none !important; } }
        .step-item { padding:28px 20px; text-align:center; }
        .step-ring { width:60px; height:60px; border-radius:50%; background:var(--bg-card); border:1px solid rgba(13,199,94,.2); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; transition:all .3s; }
        .step-item:hover .step-ring { border-color:var(--green); box-shadow:0 0 20px rgba(13,199,94,.18); }
        .step-n { font-family:var(--font-display); font-size:20px; font-weight:800; color:var(--green); }
        .step-ic { font-size:24px; color:var(--green); margin-bottom:12px; }
        .step-h4 { font-family:var(--font-display); font-size:15px; font-weight:700; margin-bottom:8px; }
        .step-p { font-size:12.5px; color:rgba(255,255,255,0.65); line-height:1.6; }

        /* ── CTA BANNER ── */
        .cta-banner {
          margin: 0 clamp(16px,4%,60px) clamp(48px,6vw,80px);
          border-radius:24px;
          background:linear-gradient(135deg,#010e20 0%,#011808 50%,#020c14 100%);
          border:1px solid rgba(13,199,94,.2);
          padding: clamp(40px,6vw,72px) clamp(28px,5%,64px);
          position:relative; overflow:hidden;
          display:grid; grid-template-columns:1fr auto; gap:40px; align-items:center;
        }
        @media (max-width:700px) { .cta-banner { grid-template-columns:1fr !important; padding:36px 24px; } }
        .cta-glow  { position:absolute; top:-80px; right:-60px; width:360px; height:360px; background:radial-gradient(circle,rgba(13,199,94,.1) 0%,transparent 70%); pointer-events:none; }
        .cta-h2 { font-family:var(--font-display); font-size:clamp(24px,3.5vw,42px); font-weight:800; line-height:1.15; margin-bottom:10px; }
        .cta-p { color:rgba(255,255,255,0.68); font-size:14px; }
        .cta-r { display:flex; flex-direction:column; align-items:flex-start; gap:12px; flex-shrink:0; }
        .cta-small { font-size:12px; color:rgba(255,255,255,0.3); }

        /* ── FOOTER ── */
        .footer { background:#010814; border-top:1px solid var(--border); padding:clamp(48px,6vw,72px) clamp(16px,5%,80px) 28px; }
        .footer-top { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr; gap:clamp(16px,2vw,36px); margin-bottom:48px; }
        @media (max-width:900px) { .footer-top { grid-template-columns:1fr 1fr 1fr !important; } }
        @media (max-width:560px) { .footer-top { grid-template-columns:1fr 1fr !important; } }
        .ft-brand-p { font-size:13px; color:rgba(255,255,255,0.62); margin:14px 0 18px; max-width:190px; line-height:1.7; }
        .soc-row { display:flex; gap:8px; }
        .soc-ic { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:14px; color:rgba(255,255,255,0.55); cursor:pointer; transition:all .2s; }
        .soc-ic:hover { border-color:rgba(13,199,94,.4); color:var(--green); }
        .ft-col-h { font-family:var(--font-display); font-size:13px; font-weight:700; margin-bottom:16px; color:var(--text); }
        .ft-lnk { display:block; font-size:13px; color:rgba(255,255,255,0.58); text-decoration:none; margin-bottom:9px; background:none; border:none; cursor:pointer; font-family:var(--font-body); text-align:left; padding:0; transition:color .2s; }
        .ft-lnk:hover { color:var(--green); }
        .ft-bottom { border-top:1px solid var(--border); padding-top:22px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:rgba(255,255,255,0.3); flex-wrap:wrap; gap:12px; }

        /* ── SCROLL TOP ── */
        .scroll-top { position:fixed; bottom:28px; right:28px; width:42px; height:42px; border-radius:50%; background:var(--green); border:none; color:#000; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(13,199,94,.4); transition:all .3s; z-index:300; transform:scale(0); }
        .scroll-top.show { transform:scale(1); }
        .scroll-top:hover { background:#2fe070; transform:scale(1.1); }

        @media (max-width:900px) {
          .nav-center { display: none !important; }
          .btn-ghost.desktop { display: none !important; }
          .mob-trigger { display: flex !important; }
        }
        @media (max-width:480px) {
          .btn-green.desktop { display: none !important; }
        }
      `}</style>

      <div className="sc">

        {/* ── NAV ── */}
        <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/Stagechecklogo.png" alt="StageCheck" className="logo-img" />
          </div>
          <div className="nav-center">
            {navItems.map(l => (
              <button key={l.label} className="nav-pill" onClick={() => scrollTo(l.id)}>{l.label}</button>
            ))}
          </div>
          <div className="nav-r">
            <button className="btn-ghost desktop" onClick={() => navigate('/login')}>Log in</button>
            <button className="btn-green desktop" onClick={() => navigate('/signup')}>Get Started Free</button>
            <button className={`mob-trigger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* ── MOBILE MENU ── */}
        <div className={`mob-overlay ${menuOpen ? 'open' : ''}`}>
          <div className="mob-inner">
            {navItems.map((l, i) => (
              <button key={l.label} className="mob-link" style={{ animationDelay: `${i * .06}s` }} onClick={() => scrollTo(l.id)}>{l.label}</button>
            ))}
            <div className="mob-divider" />
            <div className="mob-btns">
              <button className="mob-btn-g" onClick={() => { setMenuOpen(false); navigate('/signup') }}>Get Started Free</button>
              <button className="mob-btn-o" onClick={() => { setMenuOpen(false); navigate('/login') }}>Log in</button>
            </div>
            <div className="mob-social">
              {[<RiFacebookCircleLine />, <RiInstagramLine />, <RiTwitterXLine />, <RiYoutubeLine />].map((ic, i) => (
                <div key={i} className="mob-soc-ic">{ic}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-orb" style={{ width: 480, height: 480, background: 'radial-gradient(circle,rgba(13,199,94,0.14) 0%,transparent 70%)', top: '5%', left: '-5%' }} />
          <div className="hero-orb" style={{ width: 360, height: 360, background: 'radial-gradient(circle,rgba(13,199,94,0.09) 0%,transparent 70%)', bottom: '8%', right: '2%', animationDelay: '2.5s' }} />
          <ParticleField />

          <div className="hero-content">
            <div className="hero-badge reveal fy">
              <span className="live-dot" /> ALL-IN-ONE EVENT OPERATING SYSTEM
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(13,199,94,.15)', borderRadius:10, padding:'2px 8px', fontSize:10, fontWeight:800 }}>
                <span className="live-dot" />LIVE
              </span>
            </div>

            <h1 className="hero-h1 reveal fy d1">
              Discover, Plan &amp; Run<br />
              <span className="hero-accent-u">Unforgettable</span> <span className="hero-accent">Events</span>
            </h1>

            <p className="hero-p reveal fy d2">
              The complete platform for finding local happenings and running flawless events — from registration to the final applause.
            </p>

            <div className="hero-search reveal fy d2">
              <RiSearchLine size={17} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
              <input placeholder="Search events, concerts, competitions..." value={search} onChange={e => setSearch(e.target.value)} />
              <div className="search-div" />
              <button className="btn-green" style={{ padding: '9px 20px', fontSize: 13, borderRadius: 9, flexShrink: 0 }} onClick={() => scrollTo('events')}>
                <RiSearchLine size={13} /> Find Events
              </button>
            </div>

            <div className="hero-cta-row reveal fy d3">
              <button className="btn-green btn-cta-p" onClick={() => navigate('/signup')}><RiAddLine size={15} /> Create Event</button>
              <button className="btn-cta-s"><RiPlayCircleLine size={17} /> Watch Demo</button>
            </div>

            <div className="hero-stats reveal fy d4">
              {[
                { n: stats.events, l: 'Events Managed' },
                { n: stats.performers, l: 'Performers' },
                { n: stats.tickets, l: 'Tickets Sold' },
                { n: stats.satisfaction, l: 'Satisfaction' },
              ].map((s, i) => (
                <Fragment key={s.l}>
                  {i > 0 && <div className="hs-div" />}
                  <div style={{ textAlign: 'center' }}>
                    <div className="hs-num">{s.n}</div>
                    <div className="hs-lbl">{s.l}</div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── EVENTS ── */}
        <section id="events" className="section">
          <div className="events-header">
            <div className="events-header-left">
              <span className="eyebrow reveal fy">Upcoming Events</span>
              <h2 className="sh2 reveal fy d1">Explore Top Events Near You</h2>
              <p className="sh2-sub reveal fy d2">Don't miss out on what's happening around you</p>
            </div>
            <div className="events-header-right reveal sr">
              <button className="btn-ghost" style={{ fontSize:13 }} onClick={() => navigate('/events')}>
                View All Events <RiArrowRightLine size={13} />
              </button>
              <div className="ev-pagination">
                <button className="pg-btn" disabled={eventsPage === 0} onClick={() => setEventsPage(p => p - 1)}><RiArrowLeftSLine size={17} /></button>
                <div className="pg-dots">
                  {Array.from({ length: Math.max(totalPages, 1) }).map((_, i) => (
                    <div key={i} className={`pg-dot ${i === eventsPage ? 'active' : ''}`} onClick={() => setEventsPage(i)} />
                  ))}
                </div>
                <button className="pg-btn" disabled={eventsPage >= totalPages - 1 || totalPages === 0} onClick={() => setEventsPage(p => p + 1)}><RiArrowRightSLine size={17} /></button>
              </div>
            </div>
          </div>

          <div className="events-grid">
            {eventsLoading ? (
              <div className="ev-empty">
                <span style={{ animation: 'spin .8s linear infinite', display:'inline-flex' }}><RiLoader4Line size={22} color="var(--green)" /></span>
                Loading events from database…
              </div>
            ) : eventsError ? (
              <div className="ev-empty">
                <span style={{ color: '#f87171' }}>{eventsError}</span>
                <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : events.length === 0 ? (
              <div className="ev-empty">
                <RiCalendarEventLine size={36} color="rgba(255,255,255,0.2)" />
                <span>No upcoming events yet.</span>
                <button className="btn-green" style={{ padding:'10px 22px', fontSize:13 }} onClick={() => navigate('/signup')}>Create the First Event</button>
              </div>
            ) : (
              visibleEvents.map((ev, idx) => (
                <EventCard key={ev.id} ev={ev} idx={idx} onGetTickets={handleGetTickets} />
              ))
            )}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="section-sm" style={{ background: 'linear-gradient(180deg,var(--bg) 0%,#01081a 50%,var(--bg) 100%)', position:'relative', overflow:'hidden' }}>
          <div style={{ textAlign:'center' }}>
            <span className="eyebrow reveal fy">How It Works</span>
            <h2 className="sh2 reveal fy d1" style={{ textAlign:'center' }}>From idea to standing ovation</h2>
            <p className="reveal fy d2" style={{ color:'rgba(255,255,255,0.68)', fontSize:14, marginTop:10, maxWidth:460, margin:'10px auto 0' }}>Four simple steps to your most successful event yet.</p>
          </div>
          <div className="steps-grid">
            <div className="step-conn" />
            {[
              { n:'01', icon:<RiAddLine />, title:'Create Your Event', desc:'Set up in minutes with our intuitive builder. Add details, branding and ticket types.' },
              { n:'02', icon:<RiGroupLine />, title:'Manage Registrations', desc:'Performers and attendees register online. Smart forms capture everything you need.' },
              { n:'03', icon:<RiCalendarEventLine />, title:'Go Live with Control', desc:'Run your event day with real-time stage control, live scoring and instant announcements.' },
              { n:'04', icon:<RiBarChartLine />, title:'Measure & Grow', desc:'Get detailed analytics, collect feedback and improve your next event with data insights.' },
            ].map((s, i) => (
              <div key={s.n} className={`step-item reveal fy d${i + 1}`}>
                <div className="step-ring"><span className="step-n">{s.n}</span></div>
                <div className="step-ic">{s.icon}</div>
                <h4 className="step-h4">{s.title}</h4>
                <p className="step-p">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="section">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span className="eyebrow reveal fy">Platform Features</span>
            <h2 className="sh2 reveal fy d1" style={{ textAlign:'center' }}>Everything your event needs</h2>
            <p className="reveal fy d2" style={{ color:'rgba(255,255,255,0.68)', fontSize:14, marginTop:10, maxWidth:440, margin:'10px auto 0' }}>One platform. Every tool. Zero compromise.</p>
          </div>
          <div className="feat-grid">
            {features.map((f, i) => (
              <div key={f.title} className={`feat-card reveal zi d${(i % 3) + 1}`}>
                <F3D icon={f.icon} color={f.color} bg={f.bg} />
                <h4 className="feat-h4">{f.title}</h4>
                <p className="feat-p">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS + TESTIMONIAL ── */}
        <section className="section" style={{ background:'linear-gradient(180deg,var(--bg) 0%,#010810 100%)' }}>
          <div className="ts-grid">
            {/* Left — Stat Cards */}
            <div className="reveal sl">
              <span className="eyebrow">Impact by the numbers</span>
              <div className="stats-cards-grid" style={{ marginTop: 28 }}>
                {statCards.map((s, i) => (
                  <div
                    key={s.lbl}
                    className={`stat-card reveal fy d${i + 1}`}
                    style={{ '--sc': s.color } as React.CSSProperties}
                  >
                    <div className="stat-card-ic">{s.icon}</div>
                    <div className="stat-card-num">{s.val}</div>
                    <div className="stat-card-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Auto-scroll testimonial */}
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>

        {/* ── WHY STAGECHECK ── */}
        <section id="why-us" className="section" style={{ background:'#010814' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span className="eyebrow reveal fy">Why StageCheck</span>
            <h2 className="sh2 reveal fy d1" style={{ textAlign:'center' }}>Built different. Built for you.</h2>
          </div>

          <div className="reveal zi" style={{ background:'rgba(13,199,94,0.06)', border:'1px solid rgba(13,199,94,0.2)', borderRadius:16, padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(13,199,94,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--green)', fontSize:20, flexShrink:0 }}>
                <RiHeartLine />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>Completely Free Right Now</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.68)' }}>Full access to all features — no credit card, no limits.</div>
              </div>
            </div>
            <button className="btn-green" style={{ fontSize:14, padding:'11px 26px' }} onClick={() => navigate('/signup')}>
              Start Free Today <RiArrowRightLine />
            </button>
          </div>

          <div className="why-grid">
            {whyItems.map((w, i) => (
              <div key={w.title} className={`why-card reveal zi d${(i % 3) + 1}`}>
                <div className="why-ic" style={{ background:`${w.color}14`, color:w.color }}>{w.icon}</div>
                <h4 className="why-h4">{w.title}</h4>
                <p className="why-p">{w.desc}</p>
              </div>
            ))}
          </div>

          <div className="reveal fy" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 24, flexWrap:'wrap', marginTop:44, paddingTop:40, borderTop:'1px solid var(--border)' }}>
            {[
              { icon:<RiShieldCheckLine size={14} />, label:'14-Day Money Back' },
              { icon:<RiContractLine size={14} />, label:'No Lock-In Contracts' },
              { icon:<RiCloseLine size={14} />, label:'Cancel Anytime' },
              { icon:<RiCheckLine size={14} />, label:'GDPR Compliant' },
            ].map(b => (
              <div key={b.label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                <span style={{ color:'var(--green)' }}>{b.icon}</span> {b.label}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <div className="cta-banner reveal zi">
          <div className="cta-glow" />
          <div style={{ position:'relative', zIndex:1 }}>
            <span className="eyebrow" style={{ marginBottom:12 }}>Ready to begin?</span>
            <h2 className="cta-h2">Take control of your<br />next <span className="hero-accent">event today.</span></h2>
            <p className="cta-p">Join thousands of organizers who trust StageCheck to run stress-free, unforgettable events.</p>
          </div>
          <div className="cta-r" style={{ position:'relative', zIndex:1 }}>
            <button className="btn-green" style={{ fontSize:15, padding:'15px 32px' }} onClick={() => navigate('/signup')}>
              Create Your Event Now <RiArrowRightLine />
            </button>
            <small className="cta-small">Free forever plan. No credit card required.</small>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <PublicFooter />

        <button className={`scroll-top ${scrolled ? 'show' : ''}`} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
          <RiArrowUpLine size={18} />
        </button>

      </div>
    </>
  )
}