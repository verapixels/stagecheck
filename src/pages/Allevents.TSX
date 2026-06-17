import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, orderBy, Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiCalendarEventLine, RiMapPinLine, RiTimeLine, RiTicketLine,
  RiGroupLine, RiArrowRightLine, RiSearchLine, RiLoader4Line,
  RiArrowLeftLine, RiArrowRightSLine, RiArrowLeftSLine,
  RiInstagramLine, RiTwitterXLine, RiFacebookCircleLine,
  RiHistoryLine, RiFlashlightLine, RiCalendarCheckLine,
  RiCloseCircleLine, RiFilterLine, RiArrowUpLine,
  RiMusicLine, RiTrophyLine, RiMicLine, RiHeartLine,
  RiSlideshowLine, RiGraduationCapLine, RiSparklingLine,
  RiGridLine, RiListCheck,
} from 'react-icons/ri'
import Navbar from '../components/Navbar'

interface FirebaseEvent {
  id: string
  name: string
  date: Timestamp | Date | string
  endDate?: string
  location?: string
  venue?: string
  time?: string
  startTime?: string
  attendingCount?: number
  coverImage?: string
  coverGradient?: string
  joinCode?: string
  summary?: string
  eventType?: string
  status?: string
  featuredArtists?: { name: string; image: string }[]
  enabledModules?: string[]
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
  choir:       { label: 'Choir Concert',      icon: <RiMusicLine />,        color: '#22C55E' },
  talent:      { label: 'Talent Show',        icon: <RiFlashlightLine />,   color: '#F59E0B' },
  conference:  { label: 'Conference',         icon: <RiSlideshowLine />,    color: '#3B82F6' },
  competition: { label: 'Competition',        icon: <RiTrophyLine />,       color: '#8B5CF6' },
  drama:       { label: 'Drama / Theatre',    icon: <RiSparklingLine />,    color: '#EC4899' },
  worship:     { label: 'Worship Night',      icon: <RiHeartLine />,        color: '#14B8A6' },
  openmic:     { label: 'Open Mic',           icon: <RiMicLine />,          color: '#F97316' },
  graduation:  { label: 'Award / Graduation', icon: <RiGraduationCapLine />,color: '#06B6D4' },
  custom:      { label: 'Event',              icon: <RiSparklingLine />,    color: '#A78BFA' },
}

const CATEGORIES = [
  { id: 'all',         label: 'All Events',  icon: <RiGridLine /> },
  { id: 'choir',       label: 'Choir',       icon: <RiMusicLine /> },
  { id: 'talent',      label: 'Talent',      icon: <RiFlashlightLine /> },
  { id: 'conference',  label: 'Conference',  icon: <RiSlideshowLine /> },
  { id: 'competition', label: 'Competition', icon: <RiTrophyLine /> },
  { id: 'worship',     label: 'Worship',     icon: <RiHeartLine /> },
  { id: 'openmic',     label: 'Open Mic',    icon: <RiMicLine /> },
  { id: 'custom',      label: 'Other',       icon: <RiSparklingLine /> },
]

type Tab = 'upcoming' | 'past'
type ViewMode = 'grid' | 'list'

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

function getTypeLabel(type?: string): string {
  return EVENT_TYPE_META[type || 'custom']?.label || 'Event'
}

function getTypeColor(type?: string): string {
  return EVENT_TYPE_META[type || 'custom']?.color || '#0dc75e'
}

function daysUntil(val: any): number {
  const d = toDate(val)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

function isWithin30DaysBefore(val: any): boolean {
  const days = daysUntil(val)
  return days >= -30 && days < 0
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    type P = { x: number; y: number; vx: number; vy: number; r: number; o: number }
    const ps: P[] = []
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    for (let i = 0; i < 40; i++) ps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, r: Math.random() * 1.5 + .3, o: Math.random() * .35 + .06 })
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
        if (d < 100) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(13,199,94,${.04 * (1 - d / 100)})`; ctx.lineWidth = .4; ctx.stroke() }
      }))
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
}

function EventCard({ ev, idx, past }: { ev: FirebaseEvent; idx: number; past?: boolean }) {
  const navigate = useNavigate()
  const typeColor = getTypeColor(ev.eventType)
  const days = daysUntil(ev.date)
  const displayLoc = ev.venue || ev.location || 'TBA'
  const displayTime = ev.startTime ? formatTime(ev.startTime) : ev.time || ''

  return (
    <div
      className={`ev-card reveal zi d${(idx % 3) + 1}`}
      style={{ opacity: past ? 0.7 : 1 }}
      onClick={() => navigate(`/event/${ev.id}`)}
    >
      <div className="ev-cover" style={{
        background: ev.coverImage ? undefined : (ev.coverGradient || GRADIENTS[idx % GRADIENTS.length]),
        backgroundImage: ev.coverImage ? `url(${ev.coverImage})` : undefined,
      }}>
        <div className="ev-cover-overlay" />
        <div className="ev-type-badge" style={{ background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(10px)' }}>
          <span style={{ fontSize: 10, color: typeColor }}>{EVENT_TYPE_META[ev.eventType || 'custom']?.icon}</span>
          {getTypeLabel(ev.eventType)}
        </div>
        {!past && days >= 0 && days <= 7 && (
          <div className="ev-days-badge" style={{ background: days === 0 ? '#dc2626' : days <= 3 ? '#d97706' : '#0dc75e' }}>
            {days === 0 ? 'TODAY' : `${days}d left`}
          </div>
        )}
        {past && (
          <div className="ev-days-badge" style={{ background: 'rgba(255,255,255,0.15)' }}>PAST</div>
        )}
        <div className="ev-date-chip">{formatEventDate(ev.date)}</div>
        <h3 className="ev-name">{ev.name}</h3>
      </div>

      <div className="ev-body">
        {ev.summary && <p className="ev-summary">{ev.summary}</p>}
        <div className="ev-meta-row">
          <RiMapPinLine size={12} />
          <span>{displayLoc}</span>
        </div>
        {displayTime && (
          <div className="ev-meta-row">
            <RiTimeLine size={12} />
            <span>{displayTime}</span>
          </div>
        )}
        <div className="ev-footer">
          <div className="ev-avatars">
            {(() => {
              const validArtists = (ev.featuredArtists || []).filter(a => a.image && !a.image.includes('2a96cbd8b46e442fc41c2b86b821562f'))
              const fallbackColors = ['#8b5cf6','#ec4899','#f59e0b']
              return Array.from({ length: 3 }, (_, i) => {
                const artist = validArtists[i]
                return artist ? (
                  <span key={i} className="ev-av" style={{ marginLeft: i ? -8 : 0, zIndex: 3 - i, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: fallbackColors[i] }}>
                    <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </span>
                ) : (
                  <span key={i} className="ev-av" style={{ background: fallbackColors[i], marginLeft: i ? -8 : 0, zIndex: 3 - i }} />
                )
              })
            })()}
            <span className="ev-av-count">
              {ev.attendingCount ? `${ev.attendingCount}+ attending` : 'Be first'}
            </span>
          </div>
          <button className="ev-btn" style={{ '--tc': typeColor } as React.CSSProperties} onClick={e => { e.stopPropagation(); navigate(`/event/${ev.id}`) }}>
            <RiTicketLine size={12} /> Tickets
          </button>
        </div>
      </div>
    </div>
  )
}

function EventRow({ ev, idx }: { ev: FirebaseEvent; idx: number }) {
  const navigate = useNavigate()
  const typeColor = getTypeColor(ev.eventType)
  const days = daysUntil(ev.date)
  const displayLoc = ev.venue || ev.location || 'TBA'
  const displayTime = ev.startTime ? formatTime(ev.startTime) : ev.time || ''

  return (
    <div
      className={`ev-row reveal fy d${(idx % 3) + 1}`}
      onClick={() => navigate(`/event/${ev.id}`)}
    >
      <div className="ev-row-thumb" style={{
        background: ev.coverImage ? undefined : (ev.coverGradient || GRADIENTS[idx % GRADIENTS.length]),
        backgroundImage: ev.coverImage ? `url(${ev.coverImage})` : undefined,
      }}>
        <div className="ev-cover-overlay" />
        {!ev.coverImage && <RiCalendarEventLine size={22} color="rgba(255,255,255,0.3)" style={{ position: 'relative', zIndex: 1 }} />}
      </div>
      <div className="ev-row-body">
        <div className="ev-row-top">
          <div className="ev-type-badge sm" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(8px)' }}>
            <span style={{ color: typeColor, marginRight: 3 }}>{EVENT_TYPE_META[ev.eventType || 'custom']?.icon}</span>
            {getTypeLabel(ev.eventType)}
          </div>
          {days >= 0 && days <= 7 && (
            <div className="ev-days-badge sm" style={{ background: days === 0 ? '#dc2626' : days <= 3 ? '#d97706' : '#0dc75e' }}>
              {days === 0 ? 'TODAY' : `${days}d left`}
            </div>
          )}
        </div>
        <h3 className="ev-row-name">{ev.name}</h3>
        <div className="ev-row-metas">
          <span className="ev-meta-row"><RiCalendarEventLine size={11} />{formatEventDate(ev.date)}</span>
          {displayTime && <span className="ev-meta-row"><RiTimeLine size={11} />{displayTime}</span>}
          <span className="ev-meta-row"><RiMapPinLine size={11} />{displayLoc}</span>
          {ev.attendingCount ? <span className="ev-meta-row"><RiGroupLine size={11} />{ev.attendingCount}+ attending</span> : null}
        </div>
      </div>
      <div className="ev-row-action">
        <button className="ev-btn-row" style={{ '--tc': typeColor } as React.CSSProperties}>
          View <RiArrowRightLine size={13} />
        </button>
      </div>
    </div>
  )
}

function useScrollReveal(deps: any[]) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') }),
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    )
    els.forEach(el => { el.classList.remove('in-view'); observer.observe(el) })
    return () => observer.disconnect()
  }, deps)
}

export default function AllEvents() {
  const navigate = useNavigate()
  const [allEvents, setAllEvents] = useState<FirebaseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('upcoming')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [page, setPage] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const CARDS_PER_PAGE = 9

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true); setError('')
        let snap
        try {
          snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'asc')))
        } catch {
          snap = await getDocs(collection(db, 'events'))
        }
        const fetched: FirebaseEvent[] = snap.docs.map((doc, i) => ({
          id: doc.id,
          name: doc.data().name ?? 'Unnamed Event',
          date: doc.data().date ?? Timestamp.now(),
          endDate: doc.data().endDate ?? '',
          location: doc.data().location ?? '',
          venue: doc.data().venue ?? '',
          time: doc.data().time ?? '',
          startTime: doc.data().startTime ?? '',
          attendingCount: doc.data().attendingCount ?? doc.data().ticketsSold ?? 0,
          coverImage: doc.data().coverImage ?? '',
          coverGradient: GRADIENTS[i % GRADIENTS.length],
          joinCode: doc.data().joinCode ?? '',
          summary: doc.data().summary ?? '',
          eventType: doc.data().eventType ?? 'custom',
          status: doc.data().status ?? 'active',
          featuredArtists: doc.data().featuredArtists ?? [],
          enabledModules: doc.data().enabledModules ?? [],
        }))
        setAllEvents(fetched)
      } catch (e: any) {
        setError('Could not load events — ' + (e?.message ?? 'unknown error'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const now = new Date(); now.setHours(0, 0, 0, 0)
  const upcoming = allEvents.filter(ev => {
    const d = toDate(ev.date); d.setHours(0, 0, 0, 0)
    return d >= now
  })
  const past = allEvents.filter(ev => {
    const d = toDate(ev.date); d.setHours(0, 0, 0, 0)
    return d < now && isWithin30DaysBefore(ev.date)
  })

  const activeList = tab === 'upcoming' ? upcoming : past

  const filtered = activeList.filter(ev => {
    const q = search.toLowerCase()
    const matchSearch = !q || ev.name.toLowerCase().includes(q) || (ev.venue || ev.location || '').toLowerCase().includes(q) || (ev.summary || '').toLowerCase().includes(q)
    const matchCat = category === 'all' || ev.eventType === category
    return matchSearch && matchCat
  })

  const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE)
  const visible = filtered.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE)

  useEffect(() => { setPage(0) }, [search, category, tab])

  useScrollReveal([visible, view])

  const stats = { total: allEvents.length, upcoming: upcoming.length, past: past.length }

  const [artistAvatarIdx, setArtistAvatarIdx] = useState(0)
  const allArtistPhotos = allEvents
    .flatMap(ev => (ev.featuredArtists || []).filter(a => a.image && !a.image.includes('2a96cbd8b46e442fc41c2b86b821562f')).map(a => ({ name: a.name, image: a.image })))
    .filter((a, i, arr) => arr.findIndex(x => x.name === a.name) === i)

  useEffect(() => {
    if (allArtistPhotos.length <= 1) return
    const t = setInterval(() => setArtistAvatarIdx(i => (i + 1) % Math.max(allArtistPhotos.length, 1)), 2500)
    return () => clearInterval(t)
  }, [allArtistPhotos.length])

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #000612; --bg2: #04091a; --bg-card: #060e1c;
          --green: #0dc75e; --green-dim: rgba(13,199,94,0.12);
          --border: rgba(255,255,255,0.06); --border-g: rgba(13,199,94,0.22);
          --text: #f0faf2; --muted: rgba(255,255,255,0.45); --muted2: rgba(255,255,255,0.22);
          --nav-h: 70px;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1}50%{opacity:.35} }
        @keyframes glow    { 0%,100%{opacity:.3}50%{opacity:.65} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none} }
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)} }

        .reveal { opacity:0; transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        .reveal.fy  { transform: translateY(32px); }
        .reveal.sl  { transform: translateX(-36px); }
        .reveal.sr  { transform: translateX(36px); }
        .reveal.zi  { transform: scale(.92); }
        .reveal.in-view { opacity:1!important; transform:none!important; }
        .d1{transition-delay:.06s}.d2{transition-delay:.13s}.d3{transition-delay:.20s}
        .d4{transition-delay:.27s}.d5{transition-delay:.34s}.d6{transition-delay:.41s}

        body, .ae-root { background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 15px; line-height: 1.6; overflow-x: hidden; min-height: 100vh; }

        /* ── NAV ── */
        .ae-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          height: var(--nav-h); display: flex; align-items: center;
          justify-content: space-between; padding: 0 clamp(16px,4%,64px);
          transition: background .3s, border-color .3s, box-shadow .3s;
          border-bottom: 1px solid transparent;
        }
        .ae-nav.scrolled {
          background: rgba(0,4,14,.96); backdrop-filter: blur(24px);
          border-bottom-color: var(--border); box-shadow: 0 4px 28px rgba(0,0,0,.5);
        }

        /* ── LOGO ── */
        .ae-nav-logo {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; text-decoration: none; flex-shrink: 0;
        }
        .ae-logo-img {
          height: 56px; width: auto; object-fit: contain;
          filter: brightness(1.15) contrast(1.1) drop-shadow(0 0 10px rgba(13,199,94,0.45));
          transition: filter .25s, transform .25s;
        }
        .ae-nav-logo:hover .ae-logo-img {
          filter: brightness(1.3) contrast(1.1) drop-shadow(0 0 16px rgba(13,199,94,0.65));
          transform: scale(1.04);
        }
        .ae-logo-fallback {
          display: flex; align-items: center; gap: 10px;
        }
        .ae-logo-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: var(--green);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(13,199,94,0.5), 0 2px 8px rgba(0,0,0,0.4);
          flex-shrink: 0; font-size: 20px; color: #000; font-weight: 900;
          font-family: var(--font-display); letter-spacing: -1px;
        }
        .ae-logo-wordmark {
          display: flex; flex-direction: column; gap: 0;
        }
        .ae-logo-name {
          font-family: var(--font-display); font-weight: 800; font-size: 18px;
          color: var(--text); line-height: 1; letter-spacing: -0.5px;
        }
        .ae-logo-name span { color: var(--green); }
        .ae-logo-tagline {
          font-size: 9px; color: var(--muted); letter-spacing: .12em;
          text-transform: uppercase; line-height: 1; margin-top: 2px;
        }

        .ae-nav-r { display:flex; align-items:center; gap:10px; }
        .ae-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.12); color:var(--text); font-family:var(--font-body); transition:all .2s; }
        .ae-btn-ghost:hover { border-color:var(--border-g); color:var(--green); }
        .ae-btn-green { display:inline-flex; align-items:center; gap:7px; padding:10px 22px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; background:var(--green); border:none; color:#000; font-family:var(--font-body); transition:all .2s; box-shadow:0 0 18px rgba(13,199,94,.22); }
        .ae-btn-green:hover { background:#2fe070; box-shadow:0 0 28px rgba(13,199,94,.4); transform:translateY(-1px); }

        /* ── HERO ── */
        .ae-hero {
          position: relative; min-height: 340px; display: flex; align-items: center;
          padding: calc(var(--nav-h) + 40px) clamp(16px,5%,80px) 48px;
          overflow: hidden; text-align: center;
          background: radial-gradient(ellipse 90% 60% at 50% -10%, rgba(13,199,94,0.10) 0%, transparent 60%), var(--bg);
        }
        .ae-hero-orb {
          position:absolute; border-radius:50%; pointer-events:none; animation:glow 6s ease-in-out infinite;
        }
        .ae-hero-content { position:relative; z-index:3; width:100%; max-width:680px; margin:0 auto; }
        .ae-badge {
          display:inline-flex; align-items:center; gap:8px; margin-bottom:20px;
          background:rgba(13,199,94,.07); border:1px solid rgba(13,199,94,.2);
          border-radius:24px; padding:5px 16px; font-size:11px; color:var(--green);
          font-weight:700; letter-spacing:.1em;
        }
        .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 1.4s infinite; flex-shrink:0; }
        .ae-h1 {
          font-family:var(--font-display); font-size:clamp(32px,5.5vw,62px);
          font-weight:800; line-height:1.0; margin-bottom:14px; letter-spacing:-1.5px;
        }
        .ae-h1-accent { color:var(--green); }
        .ae-hero-p { color:rgba(255,255,255,0.5); font-size:clamp(13px,1.6vw,15px); line-height:1.75; margin-bottom:20px; max-width:480px; margin-left:auto; margin-right:auto; }

        /* ── CONTROLS BAR ── */
        .ae-controls {
          position:sticky; top:var(--nav-h); z-index:100;
          background:rgba(2,8,20,.93); border-bottom:1px solid var(--border);
          backdrop-filter:blur(20px); padding:0 clamp(16px,4%,64px);
        }
        .ae-tabs { display:flex; border-bottom:1px solid var(--border); }
        .ae-tab {
          padding:14px 20px; font-size:13px; font-weight:600; cursor:pointer;
          background:none; border:none; color:var(--muted); font-family:var(--font-body);
          position:relative; transition:color .2s; display:flex; align-items:center; gap:7px;
          white-space:nowrap;
        }
        .ae-tab:hover { color:var(--text); }
        .ae-tab.active { color:var(--green); }
        .ae-tab.active::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:2px; background:var(--green); border-radius:2px; }
        .ae-tab-count { font-size:10px; background:rgba(13,199,94,0.12); border:1px solid rgba(13,199,94,0.2); color:var(--green); padding:1px 6px; border-radius:9px; font-weight:700; }
        .ae-tab-count.grey { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.1); color:var(--muted); }

        .ae-search-row { display:flex; align-items:center; gap:10px; padding:12px 0; flex-wrap:wrap; }
        .ae-search-wrap {
          flex:1; min-width:200px; display:flex; align-items:center; gap:10px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
          border-radius:10px; padding:8px 14px; transition:border-color .2s, box-shadow .2s;
        }
        .ae-search-wrap:focus-within { border-color:rgba(13,199,94,.3); box-shadow:0 0 0 1px rgba(13,199,94,.1); }
        .ae-search-wrap input { flex:1; background:none; border:none; outline:none; color:var(--text); font-size:13px; font-family:var(--font-body); }
        .ae-search-wrap input::placeholder { color:var(--muted); }

        .ae-view-toggle { display:flex; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:9px; overflow:hidden; flex-shrink:0; }
        .ae-view-btn { padding:8px 12px; background:none; border:none; color:var(--muted); cursor:pointer; transition:all .2s; display:flex; align-items:center; }
        .ae-view-btn.active { background:rgba(13,199,94,.12); color:var(--green); }
        .ae-view-btn:hover:not(.active) { color:var(--text); }

        /* ── CATEGORY PILLS (upgraded) ── */
        .ae-cats {
          display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
          padding: 14px 0; border-top: 1px solid var(--border);
        }
        .ae-cats::-webkit-scrollbar { display: none; }
        .ae-cat-pill {
          flex-shrink: 0; padding: 8px 16px; font-size: 12px; font-weight: 700;
          color: var(--muted);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 40px; cursor: pointer;
          font-family: var(--font-body);
          display: flex; align-items: center; gap: 7px;
          position: relative;
          transition: color .2s, background .2s, border-color .2s, box-shadow .2s, transform .15s;
          white-space: nowrap; letter-spacing: .02em;
        }
        .ae-cat-pill:hover {
          color: #fff;
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }
        .ae-cat-pill.active {
          color: #000;
          background: var(--green);
          border-color: var(--green);
          box-shadow: 0 0 16px rgba(13,199,94,0.35), 0 2px 8px rgba(0,0,0,0.4);
        }
        .ae-cat-pill .pill-ic {
          font-size: 14px; display: flex; align-items: center;
          opacity: 0.75; transition: opacity .2s;
        }
        .ae-cat-pill.active .pill-ic,
        .ae-cat-pill:hover .pill-ic { opacity: 1; }

        /* ── EVENTS GRID / LIST ── */
        .ae-section { padding:clamp(32px,5vw,56px) clamp(16px,5%,80px); }
        .ae-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media(max-width:960px){ .ae-grid { grid-template-columns:repeat(2,1fr)!important; } }
        @media(max-width:560px){ .ae-grid { grid-template-columns:1fr!important; } }

        .ev-card {
          border-radius:18px; overflow:hidden;
          background:var(--bg-card); border:1px solid var(--border);
          cursor:pointer; transition:transform .3s cubic-bezier(.16,1,.3,1), border-color .3s, box-shadow .3s;
          display:flex; flex-direction:column;
        }
        .ev-card:hover { transform:translateY(-7px) scale(1.01); border-color:rgba(13,199,94,.2); box-shadow:0 24px 52px rgba(0,0,0,.6), 0 0 0 1px rgba(13,199,94,.07); }
        .ev-cover {
          height:200px; position:relative; display:flex; flex-direction:column;
          justify-content:flex-end; padding:14px; background-size:cover; background-position:center;
        }
        .ev-cover-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.1) 55%); }
        .ev-type-badge {
          position:absolute; top:12px; left:12px; z-index:1;
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 10px; border-radius:20px; font-size:10px; font-weight:700;
          backdrop-filter:blur(12px); letter-spacing:.04em;
          background:rgba(0,0,0,0.62); border:1px solid rgba(255,255,255,0.18); color:#fff;
        }
        .ev-type-badge.sm { position:static; font-size:9.5px; padding:2px 7px; }
        .ev-days-badge {
          position:absolute; top:12px; right:12px; z-index:1;
          padding:3px 8px; border-radius:7px; font-size:9px; font-weight:800;
          color:#fff; letter-spacing:.06em;
        }
        .ev-days-badge.sm { position:static; font-size:9px; padding:2px 7px; border-radius:6px; color:#fff; }
        .ev-date-chip { position:absolute; bottom:42px; left:14px; z-index:1; font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.6); letter-spacing:.04em; }
        .ev-name { font-family:var(--font-display); font-weight:800; font-size:18px; color:#fff; line-height:1.15; position:relative; z-index:1; }
        .ev-body { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; gap:4px; }
        .ev-summary { font-size:12px; color:var(--muted); line-height:1.6; margin-bottom:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ev-meta-row { display:flex; align-items:center; gap:6px; font-size:11.5px; color:rgba(255,255,255,0.5); }
        .ev-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
        .ev-avatars { display:flex; align-items:center; gap:6px; }
        .ev-av { width:22px; height:22px; border-radius:50%; border:2px solid var(--bg-card); display:inline-block; }
        .ev-av-count { font-size:11px; color:var(--muted); margin-left:4px; }
        .ev-btn {
          display:inline-flex; align-items:center; gap:5px; padding:7px 14px;
          border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;
          background:var(--tc); border:none; color:#000; font-family:var(--font-body);
          transition:all .2s;
        }
        .ev-btn:hover { filter:brightness(1.15); transform:translateY(-1px); box-shadow:0 5px 16px color-mix(in srgb,var(--tc) 35%,transparent); }

        .ae-list { display:flex; flex-direction:column; gap:12px; }
        .ev-row {
          display:flex; align-items:center; gap:16px;
          background:var(--bg-card); border:1px solid var(--border); border-radius:16px;
          overflow:hidden; cursor:pointer;
          transition:transform .25s, border-color .25s, box-shadow .25s;
        }
        .ev-row:hover { transform:translateY(-3px); border-color:rgba(13,199,94,.2); box-shadow:0 14px 36px rgba(0,0,0,.5); }
        .ev-row-thumb {
          width:110px; height:90px; flex-shrink:0; background-size:cover; background-position:center;
          display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;
        }
        .ev-row-body { flex:1; min-width:0; padding:14px 0 14px; }
        .ev-row-top { display:flex; align-items:center; gap:6px; margin-bottom:6px; flex-wrap:wrap; }
        .ev-row-name { font-family:var(--font-display); font-weight:700; font-size:15px; color:#fff; margin-bottom:7px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ev-row-metas { display:flex; flex-wrap:wrap; gap:4px 14px; }
        .ev-row-action { padding:14px 18px 14px 0; flex-shrink:0; }
        .ev-btn-row {
          display:inline-flex; align-items:center; gap:6px; padding:8px 16px;
          border-radius:9px; font-size:12px; font-weight:700; cursor:pointer;
          background:color-mix(in srgb,var(--tc) 15%,transparent);
          border:1px solid color-mix(in srgb,var(--tc) 35%,transparent);
          color:var(--tc); font-family:var(--font-body); transition:all .2s;
        }
        .ev-btn-row:hover { background:color-mix(in srgb,var(--tc) 22%,transparent); transform:translateY(-1px); }

        .ae-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:72px 0; color:var(--muted); font-size:14px; text-align:center; }
        .ae-empty-icon { opacity:.25; }
        .ae-empty-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; background:var(--green); border:none; color:#000; font-family:var(--font-body); margin-top:6px; }

        .ae-pagination { display:flex; align-items:center; justify-content:center; gap:10px; padding:32px 0 0; }
        .pg-btn { width:38px; height:38px; border-radius:50%; background:var(--bg-card); border:1px solid var(--border); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .pg-btn:hover:not(:disabled) { border-color:rgba(13,199,94,.4); color:var(--green); }
        .pg-btn:disabled { opacity:.3; cursor:not-allowed; }
        .pg-dots { display:flex; gap:6px; align-items:center; }
        .pg-dot { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,0.12); cursor:pointer; transition:all .2s; }
        .pg-dot.active { background:var(--green); width:20px; border-radius:4px; }
        .pg-info { font-size:12px; color:var(--muted); margin:0 4px; }

        .ae-no-results { text-align:center; padding:56px 0; }
        .ae-no-results h3 { font-family:var(--font-display); font-size:20px; font-weight:700; margin-bottom:8px; color:var(--text); }
        .ae-no-results p { font-size:13px; color:var(--muted); }
        .ae-clear-btn { display:inline-flex; align-items:center; gap:6px; margin-top:14px; padding:8px 18px; border-radius:9px; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:var(--text); font-size:13px; cursor:pointer; font-family:var(--font-body); transition:all .2s; }
        .ae-clear-btn:hover { border-color:rgba(13,199,94,.3); color:var(--green); }

        .ae-footer { background:#010814; border-top:1px solid var(--border); padding:clamp(36px,5vw,56px) clamp(16px,5%,80px) 24px; }
        .ae-footer-inner { display:flex; align-items:flex-start; justify-content:space-between; gap:28px; flex-wrap:wrap; margin-bottom:32px; }
        .ae-ft-p { font-size:13px; color:var(--muted); margin:12px 0 16px; max-width:200px; line-height:1.7; }
        .soc-row { display:flex; gap:8px; }
        .soc-ic { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--muted); cursor:pointer; transition:all .2s; }
        .soc-ic:hover { border-color:rgba(13,199,94,.4); color:var(--green); }
        .ae-ft-links { display:flex; gap:clamp(20px,4vw,48px); flex-wrap:wrap; }
        .ae-ft-col h5 { font-family:var(--font-display); font-size:13px; font-weight:700; margin-bottom:14px; color:var(--text); }
        .ae-ft-lnk { display:block; font-size:12px; color:var(--muted); text-decoration:none; margin-bottom:8px; background:none; border:none; cursor:pointer; font-family:var(--font-body); text-align:left; padding:0; transition:color .2s; }
        .ae-ft-lnk:hover { color:var(--green); }
        .ae-ft-bottom { border-top:1px solid var(--border); padding-top:20px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--muted2); flex-wrap:wrap; gap:10px; }

        .ae-scroll-top { position:fixed; bottom:28px; right:28px; width:40px; height:40px; border-radius:50%; background:var(--green); border:none; color:#000; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 18px rgba(13,199,94,.4); transition:all .3s; z-index:300; transform:scale(0); }
        .ae-scroll-top.show { transform:scale(1); }
        .ae-scroll-top:hover { background:#2fe070; transform:scale(1.08); }

        .ae-eyebrow { font-size:11px; font-weight:700; color:var(--green); letter-spacing:.12em; text-transform:uppercase; display:block; margin-bottom:6px; }
        .ae-section-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; gap:14px; flex-wrap:wrap; }
        .ae-section-h2 { font-family:var(--font-display); font-size:clamp(22px,3.5vw,36px); font-weight:800; line-height:1.1; }
        .ae-result-count { font-size:13px; color:var(--muted); }

        @media (max-width:620px) {
          .ae-hero { padding-bottom:32px; }
          .ev-row-action { display:none; }
          .ev-row-thumb { width:80px; height:70px; }
          .ae-logo-tagline { display: none; }
        }
      `}</style>

      <div className="ae-root">

        <Navbar variant="events" />
        
        {/* ── HERO ── */}
        <section className="ae-hero">
          <div className="ae-hero-orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle,rgba(13,199,94,0.12) 0%,transparent 70%)', top: '-10%', left: '0%' }} />
          <div className="ae-hero-orb" style={{ width: 360, height: 360, background: 'radial-gradient(circle,rgba(13,199,94,0.07) 0%,transparent 70%)', bottom: '-5%', right: '5%', animationDelay: '3s' }} />
          <ParticleField />

          <div className="ae-hero-content" style={{ animation: 'slideUp .8s cubic-bezier(.16,1,.3,1) both' }}>
            <div className="ae-badge">
              <span className="live-dot" />
              DISCOVER EVENTS NEAR YOU
            </div>
            <h1 className="ae-h1">
              All <span className="ae-h1-accent">Events</span>
            </h1>
            <p className="ae-hero-p">
              Browse upcoming concerts, competitions, conferences and more — all powered by StageCheck.
            </p>

            {!loading && allArtistPhotos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 8 }}>
                {[0, 1, 2].map(offset => {
                  const currentIdx = (artistAvatarIdx + offset) % allArtistPhotos.length
                  const currentArtist = allArtistPhotos[currentIdx]
                  return (
                    <div key={offset} style={{
                      width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                      border: '2.5px solid var(--bg-card)',
                      marginLeft: offset > 0 ? -12 : 0,
                      zIndex: 3 - offset,
                      position: 'relative',
                      boxShadow: '0 0 0 1px rgba(13,199,94,0.3)',
                      flexShrink: 0,
                      background: ['#8b5cf6','#ec4899','#f59e0b'][offset],
                    }}>
                      <img
                        src={currentArtist.image}
                        alt={currentArtist.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', transition: 'opacity 0.6s ease' }}
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
                      />
                    </div>
                  )
                })}
                <span style={{ marginLeft: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)' }}>
                  {upcoming.length > 0 ? `${upcoming.length} event${upcoming.length !== 1 ? 's' : ''} coming up` : 'Browse events'}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── CONTROLS ── */}
        <div className="ae-controls">
          <div className="ae-tabs">
            <button
              className={`ae-tab ${tab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setTab('upcoming')}
            >
              <RiCalendarCheckLine size={15} /> Upcoming
              <span className={`ae-tab-count ${tab !== 'upcoming' ? 'grey' : ''}`}>{stats.upcoming}</span>
            </button>
            <button
              className={`ae-tab ${tab === 'past' ? 'active' : ''}`}
              onClick={() => setTab('past')}
            >
              <RiHistoryLine size={15} /> Past Events
              <span className={`ae-tab-count ${tab !== 'past' ? 'grey' : ''}`}>{stats.past}</span>
            </button>
          </div>

          <div className="ae-search-row">
            <div className="ae-search-wrap">
              <RiSearchLine size={15} color="var(--muted)" style={{ flexShrink: 0 }} />
              <input
                placeholder="Search events, venues…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  <RiCloseCircleLine size={15} />
                </button>
              )}
            </div>
            <div className="ae-view-toggle">
              <button className={`ae-view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grid view">
                <RiGridLine size={16} />
              </button>
              <button className={`ae-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="List view">
                <RiListCheck size={16} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }} className="ae-result-count">
              {!loading && `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Category pills */}
          <div className="ae-cats">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`ae-cat-pill ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="pill-ic">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── EVENTS ── */}
        <section className="ae-section">
          <div className="ae-section-head">
            <div>
              <span className="ae-eyebrow reveal fy">
                {tab === 'upcoming' ? 'Upcoming Events' : 'Past Events (Last 30 Days)'}
              </span>
              <h2 className="ae-section-h2 reveal fy d1">
                {tab === 'upcoming' ? "What's On" : 'Recently Passed'}
              </h2>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="reveal sr">
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button className="pg-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <RiArrowLeftSLine size={17} />
                </button>
                <button className="pg-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <RiArrowRightSLine size={17} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="ae-empty">
              <span style={{ animation: 'spin .8s linear infinite', display: 'inline-flex' }}>
                <RiLoader4Line size={28} color="var(--green)" />
              </span>
              <span>Loading events…</span>
            </div>
          ) : error ? (
            <div className="ae-empty">
              <span style={{ color: '#f87171' }}>{error}</span>
              <button className="ae-empty-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ae-no-results">
              <div className="ae-empty-icon"><RiCalendarEventLine size={52} color="rgba(255,255,255,0.15)" /></div>
              <h3>{search || category !== 'all' ? 'No matching events' : tab === 'upcoming' ? 'No upcoming events yet' : 'No past events in the last 30 days'}</h3>
              <p>
                {search ? `No events matching "${search}"` : category !== 'all' ? `No ${CATEGORIES.find(c => c.id === category)?.label} events` : tab === 'upcoming' ? 'Check back soon for upcoming events.' : 'Events from the last 30 days will appear here.'}
              </p>
              {(search || category !== 'all') && (
                <button className="ae-clear-btn" onClick={() => { setSearch(''); setCategory('all') }}>
                  <RiCloseCircleLine size={14} /> Clear filters
                </button>
              )}
              {!search && category === 'all' && tab === 'upcoming' && (
                <button className="ae-empty-btn" onClick={() => navigate('/signup')}>
                  Create the First Event <RiArrowRightLine size={14} />
                </button>
              )}
            </div>
          ) : (
            <>
              {view === 'grid' ? (
                <div className="ae-grid">
                  {visible.map((ev, i) => (
                    <EventCard key={ev.id} ev={ev} idx={i} past={tab === 'past'} />
                  ))}
                </div>
              ) : (
                <div className="ae-list">
                  {visible.map((ev, i) => (
                    <EventRow key={ev.id} ev={ev} idx={i} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="ae-pagination">
                  <button className="pg-btn" disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    <RiArrowLeftSLine size={17} />
                  </button>
                  <div className="pg-dots">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <div
                        key={i}
                        className={`pg-dot ${i === page ? 'active' : ''}`}
                        onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      />
                    ))}
                  </div>
                  <button className="pg-btn" disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    <RiArrowRightSLine size={17} />
                  </button>
                  <span className="pg-info">{page + 1} / {totalPages}</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── CTA BANNER ── */}
        {!loading && upcoming.length > 0 && (
          <div style={{ margin: '0 clamp(16px,4%,60px) 64px', borderRadius: 20, background: 'linear-gradient(135deg,#010e20 0%,#011808 60%,#020c14 100%)', border: '1px solid rgba(13,199,94,0.18)', padding: 'clamp(32px,5vw,56px) clamp(24px,4%,56px)', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }} className="reveal zi">
            <div style={{ position: 'absolute', top: -60, right: -40, width: 320, height: 320, background: 'radial-gradient(circle,rgba(13,199,94,0.09) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="ae-eyebrow" style={{ marginBottom: 10 }}>Organise with StageCheck</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3.5vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>
                Ready to run your own <span style={{ color: 'var(--green)' }}>event?</span>
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Join organisers already using StageCheck — set up in under 2 minutes.</p>
            </div>
            <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
              <button className="ae-btn-green" style={{ padding: '14px 28px', fontSize: 14, borderRadius: 11 }} onClick={() => navigate('/signup')}>
                Create Event Free <RiArrowRightLine size={15} />
              </button>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 8 }}>No credit card required</div>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="ae-footer">
          <div className="ae-footer-inner">
            <div>
              <div className="ae-nav-logo" onClick={() => navigate('/')} style={{ marginBottom: 0, cursor: 'pointer' }}>
                <img
                  src="/Stagechecklogo.png"
                  alt="StageCheck"
                  className="ae-logo-img"
                  style={{ height: 40 }}
                  onError={e => {
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    const fallback = img.nextSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="ae-logo-fallback" style={{ display: 'none' }}>
                  <div className="ae-logo-icon" style={{ width: 32, height: 32, fontSize: 16, borderRadius: 8 }}>S</div>
                  <div className="ae-logo-wordmark">
                    <span className="ae-logo-name" style={{ fontSize: 15 }}>Stage<span>Check</span></span>
                  </div>
                </div>
              </div>
              <p className="ae-ft-p">The complete platform for discovering and managing flawless events.</p>
              <div className="soc-row">
                {[<RiFacebookCircleLine />, <RiInstagramLine />, <RiTwitterXLine />].map((ic, i) => (
                  <div key={i} className="soc-ic">{ic}</div>
                ))}
              </div>
            </div>
            <div className="ae-ft-links">
              {[
                { h: 'Platform', links: ['Features', 'How It Works', 'Pricing'] },
                { h: 'Company',  links: ['About Us', 'Blog', 'Contact'] },
                { h: 'Legal',    links: ['Privacy Policy', 'Terms of Service'] },
              ].map(col => (
                <div className="ae-ft-col" key={col.h}>
                  <h5>{col.h}</h5>
                  {col.links.map(l => <button key={l} className="ae-ft-lnk">{l}</button>)}
                </div>
              ))}
            </div>
          </div>
          <div className="ae-ft-bottom">
            <span>© 2025 StageCheck by Verapixels Technologies. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 14 }}>
              <button className="ae-ft-lnk" style={{ margin: 0 }}>Privacy</button>
              <button className="ae-ft-lnk" style={{ margin: 0 }}>Terms</button>
            </div>
          </div>
        </footer>

        {/* Scroll top */}
        <button
          className={`ae-scroll-top ${scrolled ? 'show' : ''}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <RiArrowUpLine size={17} />
        </button>

      </div>
    </>
  )
}