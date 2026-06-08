import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, MapPin, Users,  Check,
  ArrowRight, ChevronRight, Music2, Mic2,
  GraduationCap, Heart, Trophy, Presentation, Star,
  Radio, Ticket, BarChart3, Package, MessageSquare,
  Film, Sparkles, Shield, CheckCircle2, Loader2,
  Clock, Phone, Mail, AlignLeft, X,
  Search, UserPlus, Mic, ChevronLeft, Bold, Italic,
  List, Link2, Plus, Trash2, Eye, ChevronDown,
  HelpCircle, Calendar, Video, Image as ImageIcon,
  AlertCircle, Info, PlayCircle, Repeat2, Globe, User,
} from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/Authcontext'
import { generateLocalSummary, generateLocalDescription } from '../lib/Eventcontentlibrary'

// ─── Types ────────────────────────────────────────────────────────
type FeaturedArtist = {
  name: string
  image: string
  genre: string
  listeners: string
  bio: string
  mbid?: string
  role?: string
  socialLinks?: { spotify?: string; instagram?: string; youtube?: string }
}

type MediaItem = {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
  focusX?: number
  focusY?: number
}

type AgendaItem = {
  id: string
  time: string
  title: string
  speaker?: string
}

type FAQItem = {
  id: string
  question: string
  answer: string
}

type GoodToKnow = {
  ageInfo: string
  doorTime: string
  parkingInfo: string
}

type RepeatingDate = {
  id: string
  date: string
  startTime: string
  endTime: string
  notes: string
}

// ─── Event Types ──────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: 'choir',       icon: <Music2 size={20} />,       label: 'Choir Concert',      desc: 'Multi-choir song registration with clash detection', color: '#22C55E' },
  { id: 'talent',      icon: <Star size={20} />,          label: 'Talent Show',        desc: 'Open performances across multiple categories',       color: '#F59E0B' },
  { id: 'conference',  icon: <Presentation size={20} />,  label: 'Conference',         desc: 'Speakers, topics, sessions and presentations',       color: '#3B82F6' },
  { id: 'competition', icon: <Trophy size={20} />,        label: 'School Competition', desc: 'Academic or performance competitions with judging',  color: '#8B5CF6' },
  { id: 'drama',       icon: <Star size={20} />,          label: 'Drama / Theatre',    desc: 'Plays, cast management and stage requirements',      color: '#EC4899' },
  { id: 'worship',     icon: <Heart size={20} />,         label: 'Worship Night',      desc: 'Worship sets, ministers and service flow',           color: '#14B8A6' },
  { id: 'openmic',     icon: <Mic2 size={20} />,          label: 'Open Mic',           desc: 'Solo performers, sign-ups and slot management',     color: '#F97316' },
  { id: 'graduation',  icon: <GraduationCap size={20} />, label: 'Award / Graduation', desc: 'Ceremony scheduling, awardees and protocol',        color: '#06B6D4' },
  { id: 'custom',      icon: <Sparkles size={20} />,      label: 'Custom Event',       desc: 'Build your own event type from scratch',            color: '#A78BFA' },
]

// ─── Modules ──────────────────────────────────────────────────────
const ALL_MODULES = [
  { id: 'music',     icon: <Music2 size={18} />,        label: 'Music Submissions',   desc: 'Song titles, audio uploads, duration',        color: '#22C55E' },
  { id: 'judging',   icon: <Trophy size={18} />,         label: 'Judging & Scoring',   desc: 'Judge panels, live scoring, rankings',         color: '#F59E0B' },
  { id: 'ticketing', icon: <Ticket size={18} />,         label: 'Ticketing',           desc: 'Ticket creation, QR codes, attendance',       color: '#EC4899' },
  { id: 'resources', icon: <Package size={18} />,        label: 'Resource Management', desc: 'Mics, instruments, rooms, stage time',         color: '#8B5CF6' },
  { id: 'live',      icon: <Radio size={18} />,          label: 'Live Stage Control',  desc: 'Real-time stage panel during the event',      color: '#F97316' },
  { id: 'messaging', icon: <MessageSquare size={18} />,  label: 'Communication',       desc: 'Announcements and performer messaging',        color: '#14B8A6' },
  { id: 'media',     icon: <Film size={18} />,           label: 'Media Hub',           desc: 'Upload videos, recordings, highlights',       color: '#3B82F6' },
  { id: 'analytics', icon: <BarChart3 size={18} />,      label: 'Analytics',           desc: 'Participation rates, metrics, reports',       color: '#06B6D4' },
  { id: 'clash',     icon: <Shield size={18} />,         label: 'Clash Detection',     desc: 'Prevent duplicate songs, slots, performers',  color: '#22C55E' },
  { id: 'voting',    icon: <Star size={18} />,           label: 'Live Voting',         desc: 'Audience votes and live poll results',         color: '#A78BFA' },
]

const DEFAULT_MODULES: Record<string, string[]> = {
  choir:       ['music', 'clash', 'live', 'messaging', 'ticketing'],
  talent:      ['judging', 'live', 'ticketing', 'messaging', 'voting'],
  conference:  ['resources', 'live', 'messaging', 'analytics', 'media'],
  competition: ['judging', 'clash', 'live', 'messaging', 'analytics'],
  drama:       ['resources', 'live', 'ticketing', 'messaging', 'media'],
  worship:     ['music', 'clash', 'live', 'messaging', 'resources'],
  openmic:     ['music', 'live', 'ticketing', 'messaging'],
  graduation:  ['live', 'ticketing', 'messaging', 'media', 'analytics'],
  custom:      [],
}

const DEFAULT_SUBMISSION_FIELDS: Record<string, { id: string; label: string; type: string; required: boolean; alwaysOn: boolean }[]> = {
  choir: [
    { id: 'groupName',  label: 'Choir / Group Name', type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',      label: 'Contact Email',       type: 'email',  required: true,  alwaysOn: true  },
    { id: 'songSearch', label: 'Song Search',         type: 'search', required: true,  alwaysOn: true  },
    { id: 'photo',      label: 'Choir Photo',         type: 'file',   required: false, alwaysOn: false },
  ],
  talent: [
    { id: 'performerName', label: 'Performer / Group Name', type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',         label: 'Contact Email',           type: 'email',  required: true,  alwaysOn: true  },
    { id: 'category',      label: 'Act Category',            type: 'select', required: true,  alwaysOn: true  },
    { id: 'audio',         label: 'Audio Upload',            type: 'file',   required: false, alwaysOn: false },
    { id: 'photo',         label: 'Performer Photo',         type: 'file',   required: false, alwaysOn: false },
  ],
  conference: [
    { id: 'speakerName', label: 'Speaker Name',          type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',       label: 'Contact Email',          type: 'email', required: true,  alwaysOn: true  },
    { id: 'topic',       label: 'Session Title / Topic',  type: 'text',  required: true,  alwaysOn: true  },
    { id: 'bio',         label: 'Speaker Bio',            type: 'text',  required: false, alwaysOn: false },
    { id: 'photo',       label: 'Speaker Photo',          type: 'file',  required: false, alwaysOn: false },
  ],
  competition: [
    { id: 'teamName',  label: 'Team / Student Name',   type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',     label: 'Contact Email',           type: 'email',  required: true,  alwaysOn: true  },
    { id: 'category',  label: 'Competition Category',   type: 'select', required: true,  alwaysOn: true  },
    { id: 'members',   label: 'Team Members',           type: 'text',   required: false, alwaysOn: false },
    { id: 'equipment', label: 'Required Equipment',     type: 'text',   required: false, alwaysOn: false },
  ],
  drama: [
    { id: 'dramaTitle', label: 'Drama Title',   type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',      label: 'Contact Email', type: 'email',  required: true,  alwaysOn: true  },
    { id: 'castSize',   label: 'Cast Size',     type: 'number', required: true,  alwaysOn: false },
    { id: 'poster',     label: 'Drama Poster',  type: 'file',   required: false, alwaysOn: false },
    { id: 'script',     label: 'Script Upload', type: 'file',   required: false, alwaysOn: false },
  ],
  worship: [
    { id: 'ministerName', label: 'Minister / Leader Name', type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',        label: 'Contact Email',           type: 'email',  required: true,  alwaysOn: true  },
    { id: 'songSearch',   label: 'Song Search',             type: 'search', required: true,  alwaysOn: true  },
    { id: 'photo',        label: 'Minister Photo',          type: 'file',   required: false, alwaysOn: false },
  ],
  openmic: [
    { id: 'performerName', label: 'Performer Name',  type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',         label: 'Contact Email',   type: 'email',  required: true,  alwaysOn: true  },
    { id: 'actType',       label: 'Act Type',        type: 'select', required: true,  alwaysOn: true  },
    { id: 'audio',         label: 'Audio Upload',    type: 'file',   required: false, alwaysOn: false },
    { id: 'photo',         label: 'Performer Photo', type: 'file',   required: false, alwaysOn: false },
  ],
  graduation: [
    { id: 'awardeeName', label: 'Awardee / Graduand Name', type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',       label: 'Contact Email',            type: 'email', required: true,  alwaysOn: true  },
    { id: 'award',       label: 'Award / Programme',        type: 'text',  required: true,  alwaysOn: true  },
    { id: 'photo',       label: 'Awardee Photo',            type: 'file',  required: false, alwaysOn: false },
  ],
  custom: [
    { id: 'entryName', label: 'Entry / Participant Name', type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',     label: 'Contact Email',             type: 'email', required: true,  alwaysOn: true  },
  ],
}

function generateEventCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── Last.fm multi-result artist search ──────────────────────────
const LASTFM_KEY = 'b25b959554ed76058ac220b7b2e0a026'
// ─── Smart multi-source artist search ────────────────────────────
function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'&-]/g, '')
    .replace(/\s+/g, ' ')
}

// ─── Firebase Cloud Function proxy ───────────────────────────────
const DEEZER_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchDeezerArtists'
const KG_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchKnowledgeGraph'

async function deezerFetch(artistName: string, limit = 8) {
  const res = await fetch(
    `${DEEZER_FUNCTION_URL}?q=${encodeURIComponent(artistName)}&limit=${limit}`
  )
  if (!res.ok) throw new Error('function error')
  return res.json()
}

async function searchArtists(name: string): Promise<FeaturedArtist[]> {
  const q = normalizeQuery(name)
  if (!q) return []

  const results: FeaturedArtist[] = []
  const seen = new Set<string>()

  // ── Deezer via CORS proxy ──
  try {
    const data = await deezerFetch(q, 8)
    for (const a of (data.data || []).slice(0, 6)) {
      const key = a.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      results.push({
        name: a.name,
        image: a.picture_xl || a.picture_big || a.picture_medium || a.picture || '',
        genre: 'Artist',
        listeners: a.nb_fan ? parseInt(a.nb_fan).toLocaleString() : '—',
        bio: '',
      })
    }
  } catch { /* continue to Last.fm */ }

  // ── Last.fm fallback/supplement ──
  if (results.length < 3) {
    try {
      const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(q)}&api_key=${LASTFM_KEY}&format=json&limit=6`
      )
      const data = await res.json()
      const matches = data?.results?.artistmatches?.artist || []
      for (const a of matches) {
        const key = a.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        let image = ''
        try {
          const dd = await deezerFetch(a.name, 1)
          image = dd?.data?.[0]?.picture_xl || dd?.data?.[0]?.picture_big || ''
        } catch { /* no image */ }
        results.push({
          name: a.name,
          image,
          genre: 'Artist',
          listeners: a.listeners ? parseInt(a.listeners).toLocaleString() : '—',
          bio: '',
          mbid: a.mbid,
        })
        if (results.length >= 6) break
      }
    } catch { /* ignore */ }
  }

  return results.slice(0, 6)
}

async function searchPublicFigures(name: string): Promise<FeaturedArtist[]> {
  const q = normalizeQuery(name)
  if (!q) return []

  const results: FeaturedArtist[] = []
  const seen = new Set<string>()

  try {
    const res = await fetch(`${KG_FUNCTION_URL}?q=${encodeURIComponent(q)}&limit=8`)
    if (!res.ok) throw new Error('function error')
    const data = await res.json()

    for (const item of (data.itemListElement || [])) {
      const entity = item.result
      if (!entity?.name) continue
      const key = entity.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      const types: string[] = entity['@type'] || []
      const typeLabel = types
        .filter((t: string) => !['Thing', 'Intangible'].includes(t))
        .map((t: string) => t.replace(/([A-Z])/g, ' $1').trim())
        .slice(0, 2).join(' · ') || 'Public Figure'

      const description = entity.detailedDescription?.articleBody || ''

      // ── 1. Try KG image first ──
      let image = entity.image?.contentUrl || entity.image?.url || ''

      // ── 2. Wikipedia fallback ──
      if (!image) {
        try {
          const wikiSearch = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entity.name)}&format=json&origin=*&srlimit=1`
          )
          if (wikiSearch.ok) {
            const wikiSearchData = await wikiSearch.json()
            const pageTitle = wikiSearchData?.query?.search?.[0]?.title
            if (pageTitle) {
              const wikiImg = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=400&format=json&origin=*`
              )
              if (wikiImg.ok) {
                const wikiImgData = await wikiImg.json()
                const pages = wikiImgData?.query?.pages
                const page = pages?.[Object.keys(pages)[0]]
                image = page?.thumbnail?.source || ''
              }
            }
          }
        } catch { /* try deezer */ }
      }

      // ── 3. Deezer fallback ──
      if (!image) {
        try {
          const deezerData = await deezerFetch(entity.name, 1)
          image = deezerData?.data?.[0]?.picture_xl ||
                  deezerData?.data?.[0]?.picture_big ||
                  deezerData?.data?.[0]?.picture_medium || ''
        } catch { /* no image */ }
      }

      results.push({
        name: entity.name,
        image,
        genre: typeLabel,
        listeners: description.length > 100 ? description.slice(0, 97) + '…' : description,
        bio: description,
      })
      if (results.length >= 6) break
    }
  } catch { /* ignore */ }

  return results
}



// ─── Custom Date Picker ────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function CustomDatePicker({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const selectDay = (d: number) => {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
    setOpen(false)
  }
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }
  const displayVal = parsed ? `${MONTHS[parsed.getMonth()].slice(0,3)} ${parsed.getDate()}, ${parsed.getFullYear()}` : ''
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : open ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, transition: 'border-color 0.2s', userSelect: 'none' }}>
        <CalendarDays size={15} color={open ? '#22C55E' : 'rgba(255,255,255,0.7)'} />
        <span style={{ flex: 1, fontSize: 14, color: displayVal ? '#fff' : 'rgba(255,255,255,0.88)', fontFamily: 'var(--font-body)' }}>{displayVal || 'Pick a date'}</span>
        <ChevronRight size={14} color="rgba(255,255,255,0.88)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px', width: 280, boxShadow: '0 24px 60px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={15} /></button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={15} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.88)', padding: '3px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
              const isSelected = parsed?.getDate() === d && parsed?.getMonth() === viewMonth && parsed?.getFullYear() === viewYear
              const isToday = today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear
              return (
                <div key={d} onClick={() => selectDay(d)} style={{ textAlign: 'center', fontSize: 12, padding: '6px 2px', borderRadius: 8, cursor: 'pointer', fontWeight: isSelected ? 700 : 400, background: isSelected ? '#22C55E' : isToday ? 'rgba(34,197,94,0.12)' : 'transparent', color: isSelected ? '#0B1020' : isToday ? '#22C55E' : 'rgba(255,255,255,0.8)', border: isToday && !isSelected ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(34,197,94,0.12)' : 'transparent' }}
                >{d}</div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Custom Time Picker ────────────────────────────────────────────
function CustomTimePicker({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hours = value ? parseInt(value.split(':')[0]) : null
  const minutes = value ? parseInt(value.split(':')[1]) : null
  const ampm = hours !== null ? (hours >= 12 ? 'PM' : 'AM') : null
  const displayHour = hours !== null ? (hours % 12 || 12) : null
  const displayVal = hours !== null && minutes !== null ? `${displayHour}:${String(minutes).padStart(2,'0')} ${ampm}` : ''
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const setTime = (h: number, m: number) => onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : open ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, transition: 'border-color 0.2s', userSelect: 'none' }}>
        <Clock size={15} color={open ? '#22C55E' : 'rgba(255,255,255,0.7)'} />
        <span style={{ flex: 1, fontSize: 14, color: displayVal ? '#fff' : 'rgba(255,255,255,0.88)', fontFamily: 'var(--font-body)' }}>{displayVal || 'Pick a time'}</span>
        <ChevronRight size={14} color="rgba(255,255,255,0.88)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px', width: 260, boxShadow: '0 24px 60px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Select Time</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['AM', 'PM'] as const).map(period => (
              <button key={period} onClick={() => { if (hours === null) { setTime(period === 'AM' ? 8 : 20, 0); return } const base = hours % 12; setTime(period === 'AM' ? base : base + 12, minutes ?? 0) }}
                style={{ flex: 1, padding: '7px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)', background: ampm === period ? '#22C55E' : 'rgba(255,255,255,0.06)', color: ampm === period ? '#0B1020' : ' rgba(255,255,255,0.8)', transition: 'all 0.15s' }}
              >{period}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.88)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Hour</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                {hourOptions.map(h => { const h24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h); const sel = displayHour === h; return <div key={h} onClick={() => setTime(h24, minutes ?? 0)} style={{ textAlign: 'center', padding: '5px 2px', fontSize: 12, borderRadius: 7, cursor: 'pointer', fontWeight: sel ? 700 : 400, background: sel ? '#22C55E' : 'transparent', color: sel ? '#0B1020' : 'rgba(255,255,255,0.7)', transition: 'all 0.15s' }} onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>{h}</div> })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.88)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Min</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                {minuteOptions.map(m => { const sel = minutes === m; return <div key={m} onClick={() => setTime(hours ?? 8, m)} style={{ textAlign: 'center', padding: '5px 2px', fontSize: 12, borderRadius: 7, cursor: 'pointer', fontWeight: sel ? 700 : 400, background: sel ? '#22C55E' : 'transparent', color: sel ? '#0B1020' : 'rgba(255,255,255,0.7)', transition: 'all 0.15s' }} onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>{String(m).padStart(2,'0')}</div> })}
              </div>
            </div>
          </div>
          {value && <div style={{ marginTop: 12, textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>{displayVal}</div>}
          <button onClick={() => setOpen(false)} style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 9, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Confirm</button>
        </div>
      )}
    </div>
  )
}

// ─── Media Preview Modal ───────────────────────────────────────────
function MediaPreviewModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'rgba(10,16,30,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 28, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Preview your {item.type}</div>
            <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.75)', marginTop: 3 }}>See how it looks across different screen sizes</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.85)' }}><X size={15} /></button>
        </div>
        {item.type === 'image' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div><div style={{ fontSize: 12, color: ' rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 600 }}>Square (1:1)</div><div style={{ width: 200, height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}><img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></div>
            <div><div style={{ fontSize: 12, color: ' rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 600 }}>Banner (2:1)</div><div style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}><img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></div>
            <div><div style={{ fontSize: 12, color: ' rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 600 }}>Mobile (3:4)</div><div style={{ width: 160, height: 213, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}><img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></div>
          </div>
        ) : (
          <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            <video src={item.preview} controls style={{ width: '100%', maxHeight: 360 }} />
          </div>
        )}
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.07)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.15)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 }}>
            {item.type === 'image' ? '💡 Tip: Avoid text overlays — they get cropped on different devices.' : '💡 Tip: Keep videos under 1 minute. Show the atmosphere and energy of your event.'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Image Examples Modal ──────────────────────────────────────────
function ImageExamplesModal({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0)
  const slides = [
    { title: "Give people an idea of what they'll experience", examples: [{ label: '✓ Show the atmosphere, vibe, and feeling', good: true, emoji: '🎉' }, { label: '✓ Show an activity from your event', good: true, emoji: '🎤' }] },
    { title: 'Use minimal text on your images', examples: [{ label: '✗ Avoid lots of text — it gets cut off on different devices', good: false, emoji: '📝' }, { label: '✓ A small amount of text on an image is okay', good: true, emoji: '🎨' }] },
    { title: 'Technical requirements', examples: [{ label: '✓ Images: 1880×940px recommended, JPEG or PNG', good: true, emoji: '🖼' }, { label: '✓ Videos: Min 480p, vertical, MP4/MOV, max 1 min', good: true, emoji: '🎬' }] },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 560, width: '100%', animation: 'scaleIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 6 }}>{slides[slide].title}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {slides[slide].examples.map((ex, i) => (
            <div key={i} style={{ flex: 1, border: `2px solid ${ex.good ? '#22C55E' : '#EF4444'}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{ex.emoji}</div>
              <div style={{ fontSize: 13, color: ex.good ? '#16A34A' : '#DC2626', fontWeight: 500 }}>{ex.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {slides.map((_, i) => <div key={i} onClick={() => setSlide(i)} style={{ width: 10, height: 10, borderRadius: '50%', background: slide === i ? '#111' : '#ddd', cursor: 'pointer' }} />)}
        </div>
        {slide < slides.length - 1
          ? <button onClick={() => setSlide(s => s + 1)} style={{ width: '100%', padding: '12px', background: '#fff', border: '2px solid #111', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Next</button>
          : <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#EF4444', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Ok, I'm ready!</button>
        }
      </div>
    </div>
  )
}

// ─── Lineup Examples Modal ────────────────────────────────────────
function LineupExamplesModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>Focus on what matters to your audience</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>The Lineup section adapts to your event</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { role: 'Headliner', name: 'The Echo Band', type: 'EDM', color: '#7C3AED', emoji: '🎵' },
            { role: 'Keynote', name: 'Maria Torres', type: 'Business Speaker', color: '#2563EB', emoji: '🎙' },
            { role: 'Featured', name: 'DJ Pulse', type: 'House Music', color: '#059669', emoji: '🎧' },
          ].map(a => (
            <div key={a.name} style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ height: 120, background: `linear-gradient(135deg, ${a.color}22, ${a.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{a.emoji}</div>
              <div style={{ padding: 12 }}>
                <div style={{ display: 'inline-block', background: a.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginBottom: 6 }}>{a.role}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{a.type}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '12px', background: '#7C3AED', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Got it!</button>
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
}

type Step = 'welcome' | 'event-type' | 'event-details' | 'modules'

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Organizer'

  const [step, setStep] = useState<Step>('welcome')
  const [selectedType, setSelectedType] = useState('')
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [eventCode] = useState(generateEventCode)
  const [typeDropOpen, setTypeDropOpen] = useState(false)
  const [animateIn, setAnimateIn] = useState(true)

  useEffect(() => {
    setAnimateIn(false)
    const t = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(t)
  }, [step])

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [showImageExamples, setShowImageExamples] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLDivElement>(null)

  const [artistQuery, setArtistQuery] = useState('')
  const [artistSearching, setArtistSearching] = useState(false)
  const [artistResults, setArtistResults] = useState<FeaturedArtist[]>([])
  const [artistError, setArtistError] = useState('')
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([])
  const [showLineupExamples, setShowLineupExamples] = useState(false)
  const [showLineupSection, setShowLineupSection] = useState(false)
  const [manualArtistMode, setManualArtistMode] = useState(false)
 const [lineupSearchMode, setLineupSearchMode] = useState<'artist' | 'figure' | 'manual'>('artist') // ADD THIS
  const [manualArtist, setManualArtist] = useState({ name: '', bio: '' })
  const [manualArtistPhoto, setManualArtistPhoto] = useState<File | null>(null)
  const [manualArtistPreview, setManualArtistPreview] = useState('')
  const manualArtistPhotoRef = useRef<HTMLInputElement>(null)
  const artistDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [showAgenda, setShowAgenda] = useState(false)
  const [faqItems, setFaqItems] = useState<FAQItem[]>([])
  const [showFAQ, setShowFAQ] = useState(false)
  const [goodToKnow, setGoodToKnow] = useState<GoodToKnow>({ ageInfo: '', doorTime: '', parkingInfo: '' })
  const [showGoodToKnow, setShowGoodToKnow] = useState(false)
  const [repeatingDates, setRepeatingDates] = useState<RepeatingDate[]>([])
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)

  const [form, setForm] = useState({
    eventName: '', summary: '', eventDate: '', endDate: '',
    startTime: '', endTime: '', isRepeating: false,
    venue: '', address: '', locationType: 'venue' as 'venue' | 'online' | 'tba',
    description: '', organizerName: '', organizerEmail: '', organizerPhone: '', maxPerformers: '50',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  
  const selectedTypeData = EVENT_TYPES.find(t => t.id === selectedType)
  const imageCount = mediaItems.filter(m => m.type === 'image').length
  const videoCount = mediaItems.filter(m => m.type === 'video').length

  const handleSelectType = (typeId: string) => { setSelectedType(typeId); setEnabledModules(DEFAULT_MODULES[typeId] || []) }
  const toggleModule = (moduleId: string) => setEnabledModules(prev => prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId])

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || imageCount >= 2) return
    const reader = new FileReader()
    reader.onload = ev => setMediaItems(prev => [...prev, { id: Date.now().toString(), file, preview: ev.target?.result as string, type: 'image' }])
    reader.readAsDataURL(file); e.target.value = ''
  }
  const handleAddVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || videoCount >= 2) return
    setMediaItems(prev => [...prev, { id: Date.now().toString(), file, preview: URL.createObjectURL(file), type: 'video' }]); e.target.value = ''
  }
  const removeMedia = (id: string) => setMediaItems(prev => prev.filter(m => m.id !== id))

  const handleArtistSearch = useCallback((q: string) => {
    setArtistQuery(q); setArtistError(''); setArtistResults([])
    if (!q.trim()) return
    if (artistDebounce.current) clearTimeout(artistDebounce.current)
    artistDebounce.current = setTimeout(async () => {
      setArtistSearching(true)
      const results = await searchArtists(q.trim())
      setArtistSearching(false)
      if (results.length > 0) setArtistResults(results)
      else setArtistError('No artists found. Try a different name or add manually.')
    }, 600)
  }, [])

  const addArtist = (artist: FeaturedArtist) => {
    if (featuredArtists.find(a => a.name.toLowerCase() === artist.name.toLowerCase())) return
    setFeaturedArtists(prev => [...prev, { ...artist, role: 'Featured' }])
    setArtistQuery(''); setArtistResults([]); setArtistError('')
  }

  const addManualArtist = async () => {
    if (!manualArtist.name.trim()) return
    let imageUrl = ''
    if (manualArtistPhoto) {
      try {
        const storageRef = ref(storage, `events/${eventCode}/artist_${Date.now()}_${manualArtistPhoto.name}`)
        await uploadBytes(storageRef, manualArtistPhoto)
        imageUrl = await getDownloadURL(storageRef)
      } catch { imageUrl = manualArtistPreview }
    }
    setFeaturedArtists(prev => [...prev, { name: manualArtist.name, image: imageUrl || manualArtistPreview, genre: 'Artist', listeners: '—', bio: manualArtist.bio, role: 'Featured' }])
    setManualArtist({ name: '', bio: '' }); setManualArtistPhoto(null); setManualArtistPreview(''); setManualArtistMode(false)
  }

  const handleManualArtistPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setManualArtistPhoto(file)
    const reader = new FileReader()
    reader.onload = ev => setManualArtistPreview(ev.target?.result as string)
    reader.readAsDataURL(file); e.target.value = ''
  }

  const removeArtist = (name: string) => setFeaturedArtists(prev => prev.filter(a => a.name !== name))
  const updateArtistRole = (name: string, role: string) => setFeaturedArtists(prev => prev.map(a => a.name === name ? { ...a, role } : a))

  const addAgendaItem = () => setAgendaItems(prev => [...prev, { id: Date.now().toString(), time: '', title: '', speaker: '' }])
  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: string) => setAgendaItems(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  const removeAgendaItem = (id: string) => setAgendaItems(prev => prev.filter(a => a.id !== id))

  const addFAQ = () => setFaqItems(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }])
  const updateFAQ = (id: string, field: keyof FAQItem, value: string) => setFaqItems(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  const removeFAQ = (id: string) => setFaqItems(prev => prev.filter(f => f.id !== id))

  const addRepeatingDate = () => setRepeatingDates(prev => [...prev, { id: Date.now().toString(), date: '', startTime: '', endTime: '', notes: '' }])
  const updateRepeatingDate = (id: string, field: keyof RepeatingDate, value: string) => setRepeatingDates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  const removeRepeatingDate = (id: string) => setRepeatingDates(prev => prev.filter(r => r.id !== id))

  const handleGenerateSummary = async () => {
    if (!form.eventName.trim() || generatingSummary) return
    setGeneratingSummary(true)
    try { const s = generateLocalSummary(form.eventName, selectedTypeData?.label || 'event', form.venue); if (s) setForm(f => ({ ...f, summary: s })) }
    finally { setGeneratingSummary(false) }
  }

  const handleGenerateDescription = async () => {
    if (!form.eventName.trim() || generatingDescription) return
    setGeneratingDescription(true)
    try {
      const d = generateLocalDescription(form.eventName, selectedTypeData?.label || 'event', form.venue)
      if (d) {
        const html = d.replace(/\n\n/g, '<br><br>')
        // Capture innerHTML synchronously BEFORE any setState
        const current = descRef.current ? descRef.current.innerHTML : ''
        const newHtml = html + (current ? '<br><br>' + current : '')
        if (descRef.current) {
          descRef.current.innerHTML = newHtml
        }
        // Pass the already-computed string, NOT a function referencing descRef
        setForm(prev => ({ ...prev, description: newHtml }))
      }
    } finally {
      setGeneratingDescription(false)
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.eventName.trim())      e.eventName      = 'Event name is required'
    if (!form.eventDate)             e.eventDate      = 'Event date is required'
    if (!form.startTime)             e.startTime      = 'Start time is required'
    if (form.locationType === 'venue' && !form.venue.trim())    e.venue    = 'Venue is required'
    if (form.locationType === 'venue' && !form.address.trim())  e.address  = 'Address is required'
    const descContent = (descRef.current?.innerHTML || form.description || '').replace(/<[^>]*>/g, '').trim()
    if (!descContent)                e.description    = 'Description is required'
    if (!form.organizerName.trim())  e.organizerName  = 'Organizer name is required'
    if (!form.organizerEmail.trim()) e.organizerEmail = 'Organizer email is required'
    return e
  }

  const handleCreateEvent = async () => {
    const errs = validate(); setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true); setError('')
    try {
      const uploadedMedia: { url: string; type: string }[] = []
      for (const item of mediaItems) {
        const storageRef = ref(storage, `events/${eventCode}/media_${item.id}_${item.file.name}`)
        await uploadBytes(storageRef, item.file)
        uploadedMedia.push({ url: await getDownloadURL(storageRef), type: item.type })
      }
      const docRef = await addDoc(collection(db, 'events'), {
        organizerId: user?.uid, organizerEmail: user?.email,
        name: form.eventName, summary: form.summary,
        date: form.eventDate, endDate: form.endDate,
        startTime: form.startTime, endTime: form.endTime,
        isRepeating: form.isRepeating,
        repeatingDates: form.isRepeating ? repeatingDates : [],
        locationType: form.locationType, venue: form.venue, address: form.address,
        description: descRef.current?.innerHTML || form.description,
        media: uploadedMedia, coverImage: uploadedMedia.find(m => m.type === 'image')?.url || '',
        organizer: { name: form.organizerName, email: form.organizerEmail, phone: form.organizerPhone },
        featuredArtists: featuredArtists.map(a => ({ name: a.name, image: a.image, genre: a.genre, listeners: a.listeners, bio: a.bio, role: a.role })),
        agenda: agendaItems, faq: faqItems, goodToKnow,
        eventType: selectedType, enabledModules,
        submissionFields: DEFAULT_SUBMISSION_FIELDS[selectedType] || DEFAULT_SUBMISSION_FIELDS.custom,
        enabledFields: (DEFAULT_SUBMISSION_FIELDS[selectedType] || DEFAULT_SUBMISSION_FIELDS.custom).filter(f => f.required || f.alwaysOn).map(f => f.id),
        maxPerformers: parseInt(form.maxPerformers) || 50,
        joinCode: eventCode, status: 'active', createdAt: serverTimestamp(),
      })
      if (enabledModules.includes('ticketing')) navigate(`/dashboard/event/${docRef.id}/ticketing`)
      else navigate(`/dashboard/event/${docRef.id}`)
    } catch (e: any) {
      console.error('Error creating event:', e)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }


  const inputStyle = (hasError?: string): React.CSSProperties => ({
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, color: '#fff', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s', WebkitAppearance: 'none',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)',
    fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6,
  }

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '16px 18px',
  }

  const STEPS: Step[] = ['welcome', 'event-type', 'event-details', 'modules']
  const stepIndex = STEPS.indexOf(step)

  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
      {['Event Type', 'Details', 'Modules'].map((label, i) => {
        const done = stepIndex > i + 1; const active = stepIndex === i + 1
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? '#22C55E' : active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${done || active ? '#22C55E' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: done ? '#0B1020' : active ? '#22C55E' : 'rgba(255,255,255,0.88)', flexShrink: 0, transition: 'all 0.3s' }}>
                {done ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-body)', color: active ? '#22C55E' : done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width: 24, height: 1, background: done ? '#22C55E' : 'rgba(255,255,255,0.1)', flexShrink: 0, transition: 'background 0.3s' }} />}
          </div>
        )
      })}
    </div>
  )

  const LivePreview = () => (
    <div style={{ position: 'sticky', top: 24, width: 300, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Eye size={12} /> Live Preview
      </div>
      <div style={{ background: 'rgba(19,26,46,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ height: 140, background: mediaItems.find(m => m.type === 'image') ? 'transparent' : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.1))', position: 'relative', overflow: 'hidden' }}>
          {mediaItems.find(m => m.type === 'image')
            ? <img src={mediaItems.find(m => m.type === 'image')!.preview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)' }}><ImageIcon size={36} /></div>}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,16,30,0.9) 0%, transparent 60%)' }} />
          {selectedTypeData && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: `${selectedTypeData.color}dd`, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#fff' }}>{selectedTypeData.label}</div>
          )}
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: form.eventName ? '#fff' : 'rgba(255,255,255,0.88)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{form.eventName || 'Your Event Name'}</div>
          </div>
        </div>
        <div style={{ padding: '12px 14px 16px' }}>
          {form.summary && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5, marginBottom: 10, borderLeft: '2px solid rgba(34,197,94,0.4)', paddingLeft: 8 }}>{form.summary}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.eventDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(34,197,94,0.07)', borderRadius: 8, padding: '6px 10px' }}>
                <CalendarDays size={11} color="#22C55E" />
                <span>{new Date(form.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                {form.startTime && <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {form.startTime}</span>}
              </div>
            )}
            {(form.venue || form.locationType !== 'venue') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px' }}>
                <MapPin size={11} color="#22C55E" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.locationType === 'online' ? 'Online Event' : form.locationType === 'tba' ? 'TBA' : form.venue || 'Venue'}
                </span>
              </div>
            )}
          </div>
          {featuredArtists.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Lineup</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {featuredArtists.slice(0, 4).map(a => (
                  <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 52 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(168,139,250,0.4)', background: 'rgba(168,139,250,0.15)' }}>
                      {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={16} color="#A78BFA" /></div>}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{a.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 8, color: '#A78BFA', background: 'rgba(168,139,250,0.15)', padding: '1px 4px', borderRadius: 4 }}>{a.role}</div>
                  </div>
                ))}
                {featuredArtists.length > 4 && <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: ' rgba(255,255,255,0.8)' }}>+{featuredArtists.length - 4}</div>}
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'linear-gradient(135deg, #22C55E, #16a34a)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#0B1020', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>Register / Get Tickets</div>
        </div>
      </div>
      {mediaItems.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>{mediaItems.length} media file{mediaItems.length !== 1 ? 's' : ''} attached</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {mediaItems.map(item => (
              <div key={item.id} style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewItem(item)}>
                {item.type === 'image' ? <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayCircle size={18} color="#22C55E" /></div>}
                <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', borderRadius: 3, padding: '1px 4px', fontSize: 7, color: '#fff', fontWeight: 700 }}>{item.type === 'image' ? 'IMG' : 'VID'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <DashboardLayout plan="starter">
      <div style={{ padding: '0 4px' }} className={animateIn ? 'sc-page-enter' : 'sc-page-exit'}>

        {/* ── WELCOME ── */}
        {step === 'welcome' && (
          <div className="sc-container">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '5px 14px', borderRadius: 100, marginBottom: 18 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 500 }}>Welcome to StageCheck</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 3rem)', letterSpacing: '-1px', marginBottom: 14 }}>Welcome, {displayName}</h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', fontWeight: 300, lineHeight: 1.7, marginBottom: 28 }}>
                StageCheck adapts to any event — choir concerts, conferences, talent shows, worship nights and more. Setup takes less than 2 minutes.
              </p>
            </div>
            <div className="welcome-grid" style={{ marginBottom: 32 }}>
              {[
                { num: '1', title: 'Choose Event Type', desc: 'Tell us what kind of event you are running', color: '#22C55E' },
                { num: '2', title: 'Fill Event Details', desc: 'Name, date, venue, media and lineup', color: '#3B82F6' },
                { num: '3', title: 'Enable Modules', desc: 'Pick only what your event needs', color: '#8B5CF6' },
              ].map(s => (
                <div key={s.num} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 18px', transition: 'transform 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${s.color}30` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 12 }}>{s.num}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 5, fontFamily: 'var(--font-display)' }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setStep('event-type')} className="sc-btn-primary">Set Up My First Event <ArrowRight size={15} /></button>
              <button onClick={() => navigate('/dashboard')} className="sc-btn-ghost">Skip for now</button>
            </div>
          </div>
        )}

        {/* ── STEP 1: EVENT TYPE ── */}
        {step === 'event-type' && (
          <div className="sc-container">
            <StepBar />
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className="sc-heading">What type of event are you running?</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', fontWeight: 300 }}>StageCheck adapts its forms and tools to match your event type.</p>
            </div>
            <div style={{ position: 'relative', marginBottom: 32 }}>
              <div onClick={() => setTypeDropOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: selectedType ? `${selectedTypeData?.color}10` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${selectedType ? `${selectedTypeData?.color}50` : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none', boxShadow: typeDropOpen ? '0 0 0 3px rgba(34,197,94,0.08)' : 'none' }}>
                {selectedType && selectedTypeData ? (
                  <>
                    <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `${selectedTypeData.color}18`, border: `1px solid ${selectedTypeData.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedTypeData.color }}>{selectedTypeData.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 2 }}>{selectedTypeData.label}</div>
                      <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTypeData.desc}</div>
                    </div>
                  </>
                ) : <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1 }}>Select event type…</span>}
                <ChevronRight size={17} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, transform: typeDropOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.22s' }} />
              </div>
              {typeDropOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'rgba(10,16,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', zIndex: 100, boxShadow: '0 24px 80px rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)', maxHeight: '60vh', overflowY: 'auto', animation: 'fadeDown 0.2s ease' }}>
                  {EVENT_TYPES.map((t, i) => (
                    <div key={t.id} onClick={() => { handleSelectType(t.id); setTypeDropOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', background: selectedType === t.id ? `${t.color}12` : 'transparent', borderLeft: `3px solid ${selectedType === t.id ? t.color : 'transparent'}`, borderBottom: i < EVENT_TYPES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (selectedType !== t.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderLeftColor = `${t.color}50` } }}
                      onMouseLeave={e => { if (selectedType !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' } }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `${t.color}15`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color }}>{t.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: selectedType === t.id ? '#fff' : 'rgba(255,255,255,0.85)' }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: ' rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                      </div>
                      {selectedType === t.id && <Check size={14} color={t.color} style={{ flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('welcome')} className="sc-btn-ghost"><ChevronLeft size={15} /> Back</button>
              <button onClick={() => selectedType && setStep('event-details')} disabled={!selectedType} className="sc-btn-primary" style={{ opacity: selectedType ? 1 : 0.4, cursor: selectedType ? 'pointer' : 'not-allowed' }}>Continue <ArrowRight size={15} /></button>
            </div>
          </div>
        )}

        {/* ── STEP 2: EVENT DETAILS ── */}
        {step === 'event-details' && (
          <div className="sc-details-layout">
            <div style={{ flex: 1, minWidth: 0 }}>
              <StepBar />
              {selectedTypeData && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${selectedTypeData.color}15`, border: `1px solid ${selectedTypeData.color}30`, padding: '5px 12px', borderRadius: 8, marginBottom: 20 }}>
                  <span style={{ color: selectedTypeData.color }}>{selectedTypeData.icon}</span>
                  <span style={{ fontSize: 12, color: selectedTypeData.color, fontWeight: 600 }}>{selectedTypeData.label}</span>
                </div>
              )}
              <h1 className="sc-heading" style={{ marginBottom: 6 }}>Event Details</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>Set the basics. You can update these later in the event dashboard.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Cover Media */}
                <div className="sc-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={14} color="#3B82F6" /></div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Cover, Images & Videos</div>
                      </div>
                      <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.75)', marginLeft: 36 }}>Up to 2 images + 2 videos</div>
                    </div>
                    <button onClick={() => setShowImageExamples(true)} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={11} /> See examples
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
                    {mediaItems.map(item => (
                      <div key={item.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0f1e', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => setPreviewItem(item)}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        {item.type === 'image' ? <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}><PlayCircle size={28} color="#22C55E" /></div>}
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>{item.type}</div>
                        <button onClick={e => { e.stopPropagation(); removeMedia(item.id) }} className="sc-remove-btn" style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={11} /></button>
                      </div>
                    ))}
                    {imageCount < 2 && (
                      <div onClick={() => imageInputRef.current?.click()} style={{ borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.12)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
                        <ImageIcon size={18} color="rgba(255,255,255,0.88)" /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Add Image ({imageCount}/2)</span>
                      </div>
                    )}
                    {videoCount < 2 && (
                      <div onClick={() => videoInputRef.current?.click()} style={{ borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.12)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.background = 'rgba(59,130,246,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
                        <Video size={18} color="rgba(255,255,255,0.88)" /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Add Video ({videoCount}/2)</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                    <span>📷 Images: 1880×940px, JPEG/PNG, max 10MB</span>
                    <span>🎬 Videos: min 480p, MP4/MOV, max 1 min</span>
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddImage} />
                  <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleAddVideo} />
                </div>

                {/* Basic Information */}
                <div className="sc-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} color="#22C55E" /></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Basic Information</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Event Name *</label>
                    <input style={inputStyle(errors.eventName)} placeholder="e.g. Lagos Choral Festival 2026" value={form.eventName}
                      onChange={e => setForm({ ...form, eventName: e.target.value })}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = errors.eventName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'} />
                    {errors.eventName && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{errors.eventName}</span>}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Summary <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>(max 140 chars)</span></label>
                      <button onClick={handleGenerateSummary} disabled={!form.eventName.trim() || generatingSummary} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, cursor: form.eventName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, opacity: form.eventName.trim() ? 1 : 0.4 }}>
                        {generatingSummary ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={10} /> Generate with AI</>}
                      </button>
                    </div>
                    <input style={inputStyle()} placeholder="A short, exciting summary of your event…" value={form.summary} maxLength={140}
                      onChange={e => setForm({ ...form, summary: e.target.value })}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.88)', marginTop: 4, textAlign: 'right' }}>{form.summary.length}/140</div>
                  </div>
                  {/* Schedule Type */}
                  <div>
                    <label style={labelStyle}>Schedule Type</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[{ id: false, label: 'Single Event', sub: 'Happens once', icon: <CalendarDays size={13} /> }, { id: true, label: 'Repeating Event', sub: 'Multiple dates', icon: <Repeat2 size={13} /> }].map(opt => (
                        <div key={String(opt.id)} onClick={() => setForm(f => ({ ...f, isRepeating: opt.id }))} style={{ flex: 1, border: `1.5px solid ${form.isRepeating === opt.id ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', background: form.isRepeating === opt.id ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${form.isRepeating === opt.id ? '#22C55E' : 'rgba(255,255,255,0.88)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {form.isRepeating === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>{opt.icon} {opt.label}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Date / Time */}
                  <div className="sc-four-col">
                    <div>
                      <label style={labelStyle}><CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />Start Date *</label>
                      <CustomDatePicker value={form.eventDate} onChange={v => setForm({ ...form, eventDate: v })} hasError={!!errors.eventDate} />
                      {errors.eventDate && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{errors.eventDate}</span>}
                    </div>
                    <div>
                      <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Start Time *</label>
                      <CustomTimePicker value={form.startTime} onChange={v => setForm({ ...form, startTime: v })} hasError={!!errors.startTime} />
                      {errors.startTime && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{errors.startTime}</span>}
                    </div>
                    <div>
                      <label style={labelStyle}><CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />End Date</label>
                      <CustomDatePicker value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} />
                    </div>
                    <div>
                      <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />End Time</label>
                      <CustomTimePicker value={form.endTime} onChange={v => setForm({ ...form, endTime: v })} />
                    </div>
                  </div>
                  {/* Repeating Dates */}
                  {form.isRepeating && (
                    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '16px', animation: 'fadeDown 0.25s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Repeat2 size={14} color="#22C55E" />
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Additional Event Dates</div>
                        </div>
                        <button onClick={addRepeatingDate} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={11} /> Add Date</button>
                      </div>
                      {repeatingDates.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '16px 0' }}>Click "Add Date" to add more occurrences</div>}
                      {repeatingDates.map((rd, idx) => (
                        <div key={rd.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px', marginBottom: 10, animation: 'fadeDown 0.2s ease' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E' }}>Occurrence {idx + 2}</div>
                            <button onClick={() => removeRepeatingDate(rd.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F87171' }}><Trash2 size={11} /></button>
                          </div>
                          <div className="sc-three-col">
                            <div><label style={{ ...labelStyle, fontSize: 11 }}>Date *</label><CustomDatePicker value={rd.date} onChange={v => updateRepeatingDate(rd.id, 'date', v)} /></div>
                            <div><label style={{ ...labelStyle, fontSize: 11 }}>Start Time</label><CustomTimePicker value={rd.startTime} onChange={v => updateRepeatingDate(rd.id, 'startTime', v)} /></div>
                            <div><label style={{ ...labelStyle, fontSize: 11 }}>End Time</label><CustomTimePicker value={rd.endTime} onChange={v => updateRepeatingDate(rd.id, 'endTime', v)} /></div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <label style={{ ...labelStyle, fontSize: 11 }}>Notes (optional)</label>
                            <input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="e.g. Special guest night, different venue…" value={rd.notes}
                              onChange={e => updateRepeatingDate(rd.id, 'notes', e.target.value)}
                              onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Location */}
                  <div>
                    <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Location</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      {[{ id: 'venue', label: 'Venue', icon: '📍' }, { id: 'online', label: 'Online', icon: '💻' }, { id: 'tba', label: 'TBA', icon: '📅' }].map(opt => (
                        <button key={opt.id} onClick={() => setForm(f => ({ ...f, locationType: opt.id as any }))} style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: `1.5px solid ${form.locationType === opt.id ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, background: form.locationType === opt.id ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', color: form.locationType === opt.id ? '#22C55E' : 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <span>{opt.icon}</span>{opt.label}
                        </button>
                      ))}
                    </div>
                    {form.locationType === 'venue' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><MapPin size={15} color="rgba(255,255,255,0.7)" /></div>
                          <input style={{ ...inputStyle(errors.venue), paddingLeft: 40 }} placeholder="Search venue e.g. Tafawa Balewa Square, Lagos" value={form.venue}
                            onChange={e => setForm({ ...form, venue: e.target.value })}
                            onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                            onBlur={e => e.currentTarget.style.borderColor = errors.venue ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'} />
                        </div>
                        {errors.venue && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.venue}</span>}
                        <input style={inputStyle(errors.address)} placeholder="Full Address e.g. Race Course Rd, Lagos Island" value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                          onBlur={e => e.currentTarget.style.borderColor = errors.address ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'} />
                        {errors.address && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.address}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                          <Globe size={10} color="rgba(255,255,255,0.2)" /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Powered by Google Maps</span>
                        </div>
                      </div>
                    )}
                    {form.locationType === 'online' && (
                      <input style={inputStyle()} placeholder="Online event URL or platform (e.g. Zoom link)" value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    )}
                    {form.locationType === 'tba' && (
                      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Location will be announced later. You can update this from the event dashboard.</div>
                    )}
                  </div>
                </div>

          {/* Description */}
<div className="sc-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,139,250,0.15)', border: '1px solid rgba(168,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignLeft size={14} color="#A78BFA" /></div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Description</div>
  </div>
  <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ display: 'flex', gap: 2, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap', alignItems: 'center' }}>
      {[
        { icon: <Bold size={13} />, label: 'Bold', cmd: 'bold' },
        { icon: <Italic size={13} />, label: 'Italic', cmd: 'italic' },
        { icon: <List size={13} />, label: 'List', cmd: 'insertUnorderedList' },
        { icon: <Link2 size={13} />, label: 'Link', cmd: 'createLink' },
      ].map(btn => (
        <button key={btn.label} title={btn.label}
          onMouseDown={e => {
            e.preventDefault()
            if (btn.cmd === 'createLink') {
              const url = prompt('Enter URL:')
              if (url) document.execCommand('createLink', false, url)
            } else {
              document.execCommand(btn.cmd, false, undefined)
            }
            descRef.current?.focus()
          }}
          style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: ' rgba(255,255,255,0.8)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ' rgba(255,255,255,0.8)' }}>
          {btn.icon}
        </button>
      ))}
      {/* Center align button */}
      <button title="Center"
        onMouseDown={e => { e.preventDefault(); document.execCommand('justifyCenter', false, undefined); descRef.current?.focus() }}
        style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: ' rgba(255,255,255,0.8)', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ' rgba(255,255,255,0.8)' }}>
        <AlignLeft size={13} />
      </button>
      <div style={{ flex: 1 }} />
      <button onClick={handleGenerateDescription} disabled={!form.eventName.trim() || generatingDescription}
        style={{ background: 'rgba(168,139,250,0.12)', border: '1px solid rgba(168,139,250,0.25)', color: '#A78BFA', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, cursor: form.eventName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, opacity: form.eventName.trim() ? 1 : 0.4 }}>
        {generatingDescription ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={10} /> Suggest</>}
      </button>
    </div>
    <div
      ref={descRef}
      contentEditable
      suppressContentEditableWarning
      onInput={e => setForm(f => ({ ...f, description: e.currentTarget.innerHTML }))}
      data-placeholder="Describe your event — what attendees can expect, the vibe, highlights…"
      style={{
        minHeight: 140, padding: '14px 16px', outline: 'none',
        color: '#fff', fontSize: 14, lineHeight: 1.7,
        fontFamily: 'var(--font-body)',
        background: 'rgba(255,255,255,0.02)',
        border: errors.description ? '1px solid rgba(239,68,68,0.5)' : 'none',
      }}
    />
  </div>
  {errors.description && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.description}</span>}
</div>

                {/* Stand Out Sections */}
                <div className="sc-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={14} color="#F59E0B" /></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Stand out with sections</div>
                  </div>
                  <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.75)', marginBottom: 18, marginLeft: 36 }}>Add rich content to make your event page shine</div>

                  {/* Lineup */}
                  <div style={{ ...sectionStyle, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(168,139,250,0.15)', border: '1px solid rgba(168,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA', flexShrink: 0 }}><Mic size={16} /></div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Lineup</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Build excitement, show who's performing or speaking</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => setShowLineupExamples(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: ' rgba(255,255,255,0.8)', fontSize: 11, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>See examples</button>
                        <button onClick={() => setShowLineupSection(v => !v)} style={{ background: 'rgba(168,139,250,0.15)', border: '1px solid rgba(168,139,250,0.3)', color: '#A78BFA', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)' }}>
                          <Plus size={11} /> {showLineupSection ? 'Hide' : 'Add'}
                        </button>
                      </div>
                    </div>
                    {showLineupSection && (
                      <div style={{ marginTop: 16, animation: 'fadeDown 0.25s ease' }}>
                            {/* Three-tab toggle */}
<div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
  {([
    { id: 'artist', label: 'Search Artist',   icon: <Search size={12} />,   color: '#A78BFA' },
    { id: 'figure', label: 'Public Figure',   icon: <Globe size={12} />,    color: '#22C55E' },
    { id: 'manual', label: 'Add Manually',    icon: <UserPlus size={12} />, color: '#F59E0B' },
  ] as const).map(tab => (
    <button key={tab.id} onClick={() => { setLineupSearchMode(tab.id); setArtistQuery(''); setArtistResults([]); setArtistError('') }}
      style={{ flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        transition: 'all 0.15s', fontFamily: 'var(--font-body)',
        border: `1px solid ${lineupSearchMode === tab.id ? `${tab.color}50` : 'rgba(255,255,255,0.1)'}`,
        background: lineupSearchMode === tab.id ? `${tab.color}12` : 'rgba(255,255,255,0.03)',
        color: lineupSearchMode === tab.id ? tab.color : 'rgba(255,255,255,0.4)',
      }}>
      {tab.icon} {tab.label}
    </button>
  ))}
</div>

{/* Artist Search tab */}
{lineupSearchMode === 'artist' && (
  <>
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        {artistSearching ? <Loader2 size={13} color="#A78BFA" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} color="rgba(255,255,255,0.88)" />}
      </div>
      <input style={{ ...inputStyle(), paddingLeft: 38 }} placeholder="Search artist e.g. Burna Boy, Adele, Wizkid…"
        value={artistQuery} onChange={e => handleArtistSearch(e.target.value)}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(168,139,250,0.5)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
    </div>
    {artistResults.length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, marginBottom: 12, animation: 'fadeDown 0.2s ease' }}>
        {artistResults.map(a => (
          <div key={a.name} onClick={() => addArtist(a)}
            style={{ background: featuredArtists.some(f => f.name === a.name) ? 'rgba(34,197,94,0.08)' : 'rgba(168,139,250,0.06)', border: `1px solid ${featuredArtists.some(f => f.name === a.name) ? 'rgba(34,197,94,0.3)' : 'rgba(168,139,250,0.2)'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!featuredArtists.some(f => f.name === a.name)) e.currentTarget.style.borderColor = 'rgba(168,139,250,0.5)' }}
            onMouseLeave={e => { if (!featuredArtists.some(f => f.name === a.name)) e.currentTarget.style.borderColor = 'rgba(168,139,250,0.2)' }}>
            <div style={{ height: 80, background: 'rgba(168,139,250,0.1)', position: 'relative', overflow: 'hidden' }}>
              {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="#A78BFA" /></div>}
              {featuredArtists.some(f => f.name === a.name) && <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={24} color="#22C55E" /></div>}
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{a.listeners} listeners</div>
            </div>
          </div>
        ))}
      </div>
    )}
    {artistError && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={12} />{artistError}</div>}
  </>
)}

{/* Public Figure tab */}
{lineupSearchMode === 'figure' && (
  <>
    <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, marginBottom: 10, fontSize: 11, color: ' rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Globe size={11} color="#22C55E" />
      Search celebrities, speakers, founders — e.g. Dangote, Hilda Bassey, Elon Musk
    </div>
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        {artistSearching ? <Loader2 size={13} color="#22C55E" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} color="rgba(255,255,255,0.88)" />}
      </div>
      <input style={{ ...inputStyle(), paddingLeft: 38 }} placeholder="e.g. Aliko Dangote, Hilda Bassey, Elon Musk…"
        value={artistQuery}
        onChange={e => {
          setArtistQuery(e.target.value); setArtistError(''); setArtistResults([])
          if (!e.target.value.trim()) return
          if (artistDebounce.current) clearTimeout(artistDebounce.current)
          artistDebounce.current = setTimeout(async () => {
            setArtistSearching(true)
            const results = await searchPublicFigures(e.target.value.trim())
            setArtistSearching(false)
            if (results.length > 0) setArtistResults(results)
            else setArtistError('No results found. Try a different name or add manually.')
          }, 600)
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
    </div>
    {artistResults.length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, marginBottom: 12, animation: 'fadeDown 0.2s ease' }}>
        {artistResults.map(a => (
          <div key={a.name} onClick={() => addArtist(a)}
            style={{ background: featuredArtists.some(f => f.name === a.name) ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.04)', border: `1px solid ${featuredArtists.some(f => f.name === a.name) ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.15)'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!featuredArtists.some(f => f.name === a.name)) e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)' }}
            onMouseLeave={e => { if (!featuredArtists.some(f => f.name === a.name)) e.currentTarget.style.borderColor = 'rgba(34,197,94,0.15)' }}>
            <div style={{ height: 80, background: 'rgba(34,197,94,0.08)', position: 'relative', overflow: 'hidden' }}>
              {a.image
                ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                    onError={e => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty('display','flex') }} />
                : null}
              <div style={{ width: '100%', height: '100%', display: a.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="#22C55E" /></div>
              {featuredArtists.some(f => f.name === a.name) && <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={24} color="#22C55E" /></div>}
              <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '2px 5px', fontSize: 8, color: '#22C55E', fontWeight: 700, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.genre}</div>
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{a.name}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{a.listeners}</div>
            </div>
          </div>
        ))}
      </div>
    )}
    {artistError && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={12} />{artistError}</div>}
  </>
)}

{/* Manual tab — your existing manual form, unchanged */}
{lineupSearchMode === 'manual' && (
  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px', animation: 'fadeDown 0.2s ease' }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><UserPlus size={13} /> Add Performer / Speaker Manually</div>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div onClick={() => manualArtistPhotoRef.current?.click()} style={{ width: 80, height: 80, borderRadius: 14, overflow: 'hidden', border: `2px dashed ${manualArtistPreview ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)'}`, background: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        {manualArtistPreview ? <img src={manualArtistPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><ImageIcon size={20} color="rgba(255,255,255,0.88)" /><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.88)', marginTop: 4 }}>Photo</span></>}
      </div>
      <input ref={manualArtistPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleManualArtistPhoto} />
      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 12 }}>Name *</label>
          <input style={{ ...inputStyle(), padding: '9px 12px', fontSize: 13 }} placeholder="Performer or speaker name" value={manualArtist.name}
            onChange={e => setManualArtist(a => ({ ...a, name: e.target.value }))}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 12 }}>Bio</label>
          <textarea rows={2} style={{ ...inputStyle(), padding: '9px 12px', fontSize: 13, resize: 'vertical' }} placeholder="Short bio or description…" value={manualArtist.bio}
            onChange={e => setManualArtist(a => ({ ...a, bio: e.target.value }))}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
      </div>
    </div>
    <button onClick={addManualArtist} disabled={!manualArtist.name.trim()}
      style={{ marginTop: 12, width: '100%', padding: '9px', background: manualArtist.name.trim() ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${manualArtist.name.trim() ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 9, color: manualArtist.name.trim() ? '#F59E0B' : 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 700, cursor: manualArtist.name.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
      <CheckCircle2 size={13} /> Add to Lineup
    </button>
  </div>
)}
                        {featuredArtists.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginTop: 14 }}>
                            {featuredArtists.map(a => (
                              <div key={a.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', transition: 'transform 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ height: 90, background: 'linear-gradient(135deg, rgba(168,139,250,0.15), rgba(168,139,250,0.05))', position: 'relative', overflow: 'hidden' }}>
                                  {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={28} color="#A78BFA" /></div>}
                                  <button onClick={() => removeArtist(a.name)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={11} /></button>
                                </div>
                                <div style={{ padding: '8px 10px' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                                  <select value={a.role || 'Featured'} onChange={e => updateArtistRole(a.name, e.target.value)} style={{ ...inputStyle(), padding: '3px 6px', fontSize: 10, borderRadius: 6, height: 'auto' }}>
                                    {['Headliner', 'Featured', 'Keynote', 'Guest', 'Special Guest', 'DJ', 'Opening Act', 'Minister', 'Host'].map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Agenda */}
                  <div style={{ ...sectionStyle, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', flexShrink: 0 }}><Calendar size={16} /></div>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Agenda</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Share your schedule so people can plan ahead</div></div>
                      </div>
                      <button onClick={() => { setShowAgenda(v => !v); if (agendaItems.length === 0) setTimeout(addAgendaItem, 10) }} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)' }}><Plus size={11} /> {showAgenda ? 'Hide' : 'Add'}</button>
                    </div>
                    {showAgenda && (
                      <div style={{ marginTop: 14, animation: 'fadeDown 0.25s ease' }}>
                        {agendaItems.map(item => (
                          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }} className="sc-agenda-row">
                            <input style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="10:00 AM" value={item.time} onChange={e => updateAgendaItem(item.id, 'time', e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            <input style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="Session title" value={item.title} onChange={e => updateAgendaItem(item.id, 'title', e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            <input style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="Speaker (optional)" value={item.speaker || ''} onChange={e => updateAgendaItem(item.id, 'speaker', e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            <button onClick={() => removeAgendaItem(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F87171', flexShrink: 0 }}><Trash2 size={12} /></button>
                          </div>
                        ))}
                        <button onClick={addAgendaItem} style={{ background: 'transparent', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 9, padding: '8px 14px', color: '#3B82F6', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)' }}><Plus size={12} /> Add another slot</button>
                      </div>
                    )}
                  </div>

                  {/* FAQ */}
                  <div style={{ ...sectionStyle, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}><HelpCircle size={16} /></div>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Frequently Asked Questions</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Answer common questions before people ask <span style={{ color: '#F59E0B' }}>+8% organic traffic</span></div></div>
                      </div>
                      <button onClick={() => { setShowFAQ(v => !v); if (faqItems.length === 0) setTimeout(addFAQ, 10) }} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)' }}><Plus size={11} /> {showFAQ ? 'Hide' : 'Add'}</button>
                    </div>
                    {showFAQ && (
                      <div style={{ marginTop: 14, animation: 'fadeDown 0.25s ease' }}>
                        {faqItems.map(item => (
                          <div key={item.id} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <input style={{ ...inputStyle(), flex: 1, padding: '8px 10px', fontSize: 12 }} placeholder="Question e.g. Is this event free?" value={item.question} onChange={e => updateFAQ(item.id, 'question', e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                              <button onClick={() => removeFAQ(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F87171', flexShrink: 0 }}><Trash2 size={12} /></button>
                            </div>
                            <textarea rows={2} style={{ ...inputStyle(), resize: 'vertical', padding: '8px 10px', fontSize: 12 }} placeholder="Answer…" value={item.answer} onChange={e => updateFAQ(item.id, 'answer', e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                        ))}
                        <button onClick={addFAQ} style={{ background: 'transparent', border: '1px dashed rgba(245,158,11,0.3)', borderRadius: 9, padding: '8px 14px', color: '#F59E0B', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)' }}><Plus size={12} /> Add another question</button>
                      </div>
                    )}
                  </div>

                  {/* Good to Know */}
                  <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14B8A6', flexShrink: 0 }}><Info size={16} /></div>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Good to Know</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Age restrictions, door time, parking info</div></div>
                      </div>
                      <button onClick={() => setShowGoodToKnow(v => !v)} style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: '#14B8A6', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)' }}>
                        {showGoodToKnow ? <><ChevronDown size={11} /> Hide</> : <><Plus size={11} /> Add</>}
                      </button>
                    </div>
                    {showGoodToKnow && (
                      <div style={{ marginTop: 14, animation: 'fadeDown 0.25s ease' }}>
                        <div className="sc-three-col">
                          <div><label style={{ ...labelStyle, fontSize: 11 }}>Age Info</label><input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="e.g. 18+ only" value={goodToKnow.ageInfo} onChange={e => setGoodToKnow(g => ({ ...g, ageInfo: e.target.value }))} onFocus={e => e.currentTarget.style.borderColor = 'rgba(20,184,166,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                          <div><label style={{ ...labelStyle, fontSize: 11 }}>Door Time</label><input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="e.g. Doors open at 6 PM" value={goodToKnow.doorTime} onChange={e => setGoodToKnow(g => ({ ...g, doorTime: e.target.value }))} onFocus={e => e.currentTarget.style.borderColor = 'rgba(20,184,166,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                          <div><label style={{ ...labelStyle, fontSize: 11 }}>Parking Info</label><input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="e.g. Free parking on site" value={goodToKnow.parkingInfo} onChange={e => setGoodToKnow(g => ({ ...g, parkingInfo: e.target.value }))} onFocus={e => e.currentTarget.style.borderColor = 'rgba(20,184,166,0.5)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="sc-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#3B82F6" /></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Organizer Info</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Organizer Name *</label>
                    <input style={inputStyle(errors.organizerName)} placeholder="Your name or organization" value={form.organizerName}
                      onChange={e => setForm({ ...form, organizerName: e.target.value })}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = errors.organizerName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'} />
                    {errors.organizerName && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{errors.organizerName}</span>}
                  </div>
                  <div className="sc-two-col">
                    <div>
                      <label style={labelStyle}><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email *</label>
                      <input type="email" style={inputStyle(errors.organizerEmail)} placeholder="you@example.com" value={form.organizerEmail}
                        onChange={e => setForm({ ...form, organizerEmail: e.target.value })}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = errors.organizerEmail ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'} />
                      {errors.organizerEmail && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{errors.organizerEmail}</span>}
                    </div>
                    <div>
                      <label style={labelStyle}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
                      <input type="tel" style={inputStyle()} placeholder="+234 801 234 5678" value={form.organizerPhone}
                        onChange={e => setForm({ ...form, organizerPhone: e.target.value })}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}><Users size={12} style={{ display: 'inline', marginRight: 4 }} />Max Performers / Entries</label>
                    <input type="number" min="1" max="50" style={inputStyle()} value={form.maxPerformers}
                      onChange={e => setForm({ ...form, maxPerformers: e.target.value })}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, display: 'block' }}>Starter plan max: 50</span>
                  </div>
                  <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: ' rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={13} color="#3B82F6" style={{ flexShrink: 0 }} />
                    <span>Need help? Contact us at <a href="mailto:support@stagecheckng.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>support@stagecheckng.com</a></span>
                  </div>
                </div>

                {/* Invite Link */}
                

                <div style={{ display: 'flex', gap: 10, paddingBottom: 32, flexWrap: 'wrap' }}>
                  <button onClick={() => setStep('event-type')} className="sc-btn-ghost"><ChevronLeft size={15} /> Back</button>
                  <button onClick={() => { const errs = validate(); setErrors(errs); if (Object.keys(errs).length === 0) setStep('modules') }} className="sc-btn-primary">Choose Modules <ArrowRight size={15} /></button>
                </div>
              </div>
            </div>
            <div className="sc-preview-sidebar"><LivePreview /></div>
          </div>
        )}

        {/* ── STEP 3: MODULES ── */}
        {step === 'modules' && (
          <div className="sc-container" style={{ maxWidth: 800 }}>
            <StepBar />
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className="sc-heading">Enable your modules</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>
                Pre-selected the best modules for a <strong style={{ color: selectedTypeData?.color }}>{selectedTypeData?.label}</strong>. Add or remove anything you need.
              </p>
            </div>
            <div className="modules-grid" style={{ marginBottom: 24 }}>
              {ALL_MODULES.map(m => {
                const on = enabledModules.includes(m.id)
                return (
                  <div key={m.id} onClick={() => toggleModule(m.id)} style={{ background: on ? `${m.color}10` : 'rgba(19,26,46,0.5)', border: `1px solid ${on ? `${m.color}40` : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (!on) e.currentTarget.style.borderColor = `${m.color}30` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (!on) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                    <div style={{ marginTop: 2, color: on ? m.color : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{m.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: on ? '#fff' : 'rgba(255,255,255,0.85)', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: ' rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{m.desc}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: on ? m.color : 'rgba(255,255,255,0.08)', border: `1px solid ${on ? m.color : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, transition: 'all 0.2s' }}>
                      {on && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.8)', marginBottom: 10 }}>{enabledModules.length} module{enabledModules.length !== 1 ? 's' : ''} enabled</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {enabledModules.length === 0
                  ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)' }}>No modules selected</span>
                  : enabledModules.map(id => { const m = ALL_MODULES.find(x => x.id === id); if (!m) return null; return <span key={id} style={{ fontSize: 11, background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>{m.label}</span> })}
              </div>
            </div>
            {enabledModules.includes('ticketing') && (
              <div style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeDown 0.25s ease' }}>
                <Ticket size={16} color="#EC4899" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Ticketing enabled</div>
                  <div style={{ fontSize: 12, color: ' rgba(255,255,255,0.8)' }}>After creating your event, you'll be directed to set up ticket types.</div>
                </div>
              </div>
            )}
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#F87171', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} />{error}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setStep('event-details')} className="sc-btn-ghost"><ChevronLeft size={15} /> Back</button>
              <button onClick={handleCreateEvent} disabled={loading} className="sc-btn-primary" style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><CheckCircle2 size={15} /> Create Event</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {previewItem && <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      {showImageExamples && <ImageExamplesModal onClose={() => setShowImageExamples(false)} />}
      {showLineupExamples && <LineupExamplesModal onClose={() => setShowLineupExamples(false)} />}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

        .sc-page-enter { animation: slideIn 0.3s ease; }
        .sc-page-exit { opacity: 0; }
        .sc-container { max-width: 720px; margin: 0 auto; width: 100%; }
        .sc-details-layout { display: flex; gap: 32px; align-items: flex-start; max-width: 1200px; margin: 0 auto; width: 100%; }
        .sc-details-layout > div:first-child { flex: 1; min-width: 0; }
        .sc-card { background: rgba(19,26,46,0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: clamp(1rem,4vw,1.6rem); transition: border-color 0.2s; }
        .sc-card:hover { border-color: rgba(255,255,255,0.12); }
        .sc-preview-sidebar { display: block; }
        .sc-heading { font-family: var(--font-display); font-weight: 800; font-size: clamp(1.4rem, 4vw, 2.2rem); letter-spacing: -0.6px; margin-bottom: 8px; }
        .sc-btn-primary { background: linear-gradient(135deg, #22C55E, #16a34a); border: none; color: #0B1020; padding: 13px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 700; font-family: var(--font-body); display: inline-flex; align-items: center; gap: 7px; transition: all 0.2s; -webkit-tap-highlight-color: transparent; box-shadow: 0 4px 14px rgba(34,197,94,0.25); }
        .sc-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.35); }
        .sc-btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.12); color:  rgba(255,255,255,0.8); padding: 13px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-family: var(--font-body); display: inline-flex; align-items: center; gap: 7px; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
        .sc-btn-ghost:hover { border-color: rgba(255,255,255,0.85); color: rgba(255,255,255,0.8); }
        .welcome-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .sc-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sc-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .sc-four-col { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
        textarea { resize: vertical; }
        input, textarea, select { -webkit-appearance: none; appearance: none; }
        .sc-remove-btn { opacity: 0 !important; transition: opacity 0.2s !important; }
        *:hover > .sc-remove-btn { opacity: 1 !important; }
        @media (max-width: 1000px) {
          .sc-preview-sidebar { display: none !important; }
          .sc-details-layout { max-width: 720px; }
          .sc-four-col { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 680px) {
          .sc-container { max-width: 100%; }
          .sc-details-layout { max-width: 100%; }
          .welcome-grid { grid-template-columns: 1fr !important; }
          .sc-two-col { grid-template-columns: 1fr !important; }
          .sc-three-col { grid-template-columns: 1fr !important; }
          .sc-four-col { grid-template-columns: 1fr !important; }
          .modules-grid { grid-template-columns: 1fr 1fr !important; }
          .sc-agenda-row { grid-template-columns: 1fr 1fr !important; }
          .sc-agenda-row > *:nth-child(3) { grid-column: span 2; }
          .sc-btn-primary, .sc-btn-ghost { padding: 12px 16px; font-size: 13px; }
          .sc-heading { font-size: clamp(1.3rem, 6vw, 1.8rem) !important; }
          .sc-card { border-radius: 14px; }
        }
        @media (max-width: 400px) {
          .modules-grid { grid-template-columns: 1fr !important; }
          .sc-agenda-row { grid-template-columns: 1fr !important; }
          .sc-agenda-row > *:nth-child(3) { grid-column: span 1; }
        }
          [contenteditable][data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: rgba(255,255,255,0.88);
  pointer-events: none;
}
[contenteditable] a { color: #22C55E; }
[contenteditable] ul { padding-left: 20px; }
      `}</style>
    </DashboardLayout>
  )
}