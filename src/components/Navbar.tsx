// src/components/landing/SiteNavbar.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  collection, getDocs, query, orderBy, limit,
  addDoc, doc, setDoc, increment, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiSearchLine, RiMapPin2Line, RiCrosshairLine,
  RiArrowRightUpLine, RiArrowDownSLine,
  RiMenuLine, RiCloseLine, RiCalendarEventLine,
  RiInformationLine, RiQuestionLine, RiShieldLine,
  RiFileTextLine, RiRefundLine, RiFireLine,
} from 'react-icons/ri'

interface SiteNavbarProps {
  searchValue?: string
  onSearchChange?: (v: string) => void
  onSearchSubmit?: () => void
  locationLabel?: string
  onLocationChange?: (label: string) => void
}

const PAGE_TABS = [
  { label: 'How It Works', to: '/how-it-works', icon: <RiInformationLine size={16} /> },
  { label: 'Events', to: '/events', icon: <RiCalendarEventLine size={16} /> },
  { label: 'Why StageCheck', to: '/why-us', icon: <RiQuestionLine size={16} /> },
]

const RESOURCE_LINKS = [
  { label: 'Privacy Policy', to: '/privacy', icon: <RiShieldLine size={14} /> },
  { label: 'Terms of Service', to: '/terms', icon: <RiFileTextLine size={14} /> },
  { label: 'Refund Policy', to: '/refund', icon: <RiRefundLine size={14} /> },
]

// Fallback shown the first time, before the DB has any trending data
const FALLBACK_TRENDING = ['tech events', 'lagos free events', 'music concerts', 'stage plays']

export default function SiteNavbar({
  searchValue = '', onSearchChange, onSearchSubmit,
  locationLabel = 'Anywhere', onLocationChange,
}: SiteNavbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [locOpen, setLocOpen] = useState(false)
  const [resOpen, setResOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [cityInput, setCityInput] = useState('')
  const [locating, setLocating] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobSearchFocused, setMobSearchFocused] = useState(false)
  const [trending, setTrending] = useState<string[]>(FALLBACK_TRENDING)
  const [trendingLoaded, setTrendingLoaded] = useState(false)

  const locRef = useRef<HTMLDivElement>(null)
  const mobLocRef = useRef<HTMLDivElement>(null)
  const resRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobSearchRef = useRef<HTMLDivElement>(null)
  const mobSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false); setMobileSearchOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = (mobileOpen || mobileSearchOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen, mobileSearchOpen])

  useEffect(() => {
    if (mobileSearchOpen) {
      const t = setTimeout(() => mobSearchInputRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [mobileSearchOpen])

  // Close popups on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        locRef.current && !locRef.current.contains(e.target as Node) &&
        mobLocRef.current && !mobLocRef.current.contains(e.target as Node)
      ) setLocOpen(false)
      if (resRef.current && !resRef.current.contains(e.target as Node)) setResOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false)
      if (mobSearchRef.current && !mobSearchRef.current.contains(e.target as Node)) setMobSearchFocused(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Fetch trending searches from Firestore once, lazily, the first time the dropdown is needed
  const loadTrending = async () => {
    if (trendingLoaded) return
    setTrendingLoaded(true)
    try {
      const q = query(collection(db, 'trendingSearches'), orderBy('count', 'desc'), limit(6))
      const snap = await getDocs(q)
      const terms = snap.docs.map(d => (d.data() as any).term).filter(Boolean)
      if (terms.length > 0) setTrending(terms)
    } catch (e) {
      console.error('Failed to load trending searches', e)
      // keep fallback list
    }
  }

  // Log a search so trending data improves over time (fire-and-forget, never blocks UI)
  const logSearch = (term: string) => {
    const clean = term.trim().toLowerCase()
    if (!clean) return
    addDoc(collection(db, 'searchLogs'), { term: clean, createdAt: serverTimestamp() }).catch(() => {})
    const trendRef = doc(db, 'trendingSearches', clean)
    setDoc(trendRef, { term: clean, count: increment(1), updatedAt: serverTimestamp() }, { merge: true }).catch(() => {})
  }

  const submitSearch = (term?: string) => {
    const value = term ?? searchValue
    if (term) onSearchChange?.(term)
    logSearch(value)
    onSearchSubmit?.()
    setSearchFocused(false)
    setMobSearchFocused(false)
  }

  const useMyLocation = () => {
    setLocating(true)
    if (!navigator.geolocation) {
      onLocationChange?.('Location unavailable'); setLocating(false); setLocOpen(false); return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          onLocationChange?.(data?.address?.city || data?.address?.town || data?.address?.state || 'Current location')
        } catch { onLocationChange?.('Current location') }
        setLocating(false); setLocOpen(false)
      },
      () => { onLocationChange?.('Location unavailable'); setLocating(false); setLocOpen(false) },
      { timeout: 8000 }
    )
  }

  const submitCity = () => {
    if (cityInput.trim()) onLocationChange?.(cityInput.trim())
    setLocOpen(false)
  }

  const LocationPopup = () => (
    <div className="stg-loc-pop">
      <button className="stg-loc-opt" onClick={useMyLocation}>
        <RiCrosshairLine size={15} color="var(--green)" />
        {locating ? 'Finding you...' : 'Use my location'}
      </button>
      <div className="stg-loc-divider">or</div>
      <div className="stg-loc-input-row">
        <input
          placeholder="Type a city..."
          value={cityInput}
          onChange={e => setCityInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitCity()}
        />
        <button className="stg-loc-go" onClick={submitCity}>
          <RiArrowRightUpLine size={14} />
        </button>
      </div>
    </div>
  )

  const TrendingDropdown = ({ onPick }: { onPick: (term: string) => void }) => (
    <div className="stg-trend-pop">
      <div className="stg-trend-label">
        <RiFireLine size={13} color="var(--green)" /> Trending Searches
      </div>
      {trending.map((t, i) => (
        <button key={t + i} className="stg-trend-item" onClick={() => onPick(t)}>
          <RiArrowRightUpLine size={13} color="rgba(255,255,255,0.3)" />
          {t}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <style>{`
        :root {
          --nav-h: 64px;
          --green: #0dc75e;
          --bg-card: #0d1220;
          --border: rgba(255,255,255,0.07);
          --border-g: rgba(13,199,94,0.4);
          --text: #f0faf2;
          --muted: rgba(255,255,255,0.75);
          --muted2: rgba(255,255,255,0.45);
          --font-body: 'Inter', sans-serif;
        }

        .stg-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          height: var(--nav-h);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(16px, 4%, 48px); gap: 12px;
          transition: background .3s, box-shadow .3s, border-color .3s;
          border-bottom: 1px solid transparent;
        }
        .stg-nav.scrolled {
          background: rgba(4,8,20,.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom-color: var(--border);
          box-shadow: 0 4px 24px rgba(0,0,0,.5);
        }

        .stg-logo { display:flex; align-items:center; gap:9px; cursor:pointer; flex-shrink:0; text-decoration:none; }
        .stg-logo-img { height:30px; width:auto; object-fit:contain; }
        .stg-logo-text { font-family:var(--font-body); font-weight:800; font-size:16px; color:var(--text); letter-spacing:-0.3px; }

        .stg-tabs { display:flex; align-items:center; gap:2px; flex-shrink:0; }
        .stg-tab {
          position:relative; padding:8px 13px; border-radius:9px;
          font-size:13px; font-weight:500; color:var(--muted);
          cursor:pointer; background:none; border:none;
          font-family:var(--font-body); transition:color .2s, background .2s;
          display:flex; align-items:center; gap:4px;
        }
        .stg-tab:hover { color:var(--text); background:rgba(255,255,255,0.05); }
        .stg-tab.active { color:var(--text); }
        .stg-tab.active::after {
          content:''; position:absolute; bottom:-1px; left:13%; right:13%; height:2px;
          background:var(--green); border-radius:2px;
          box-shadow:0 0 12px 2px rgba(13,199,94,.5);
        }

        .stg-res-pop {
          position:absolute; top:calc(100% + 8px); left:0; min-width:180px;
          background:#0d1220; border:1px solid var(--border); border-radius:12px;
          padding:6px; box-shadow:0 16px 48px rgba(0,0,0,.7); z-index:60;
          animation: stgFadeDown .15s ease;
        }
        .stg-res-item {
          display:flex; align-items:center; gap:8px;
          width:100%; text-align:left; padding:9px 11px; border-radius:8px;
          background:none; border:none; color:var(--muted); font-size:13px;
          font-family:var(--font-body); cursor:pointer; transition:background .15s, color .15s;
        }
        .stg-res-item:hover { background:rgba(255,255,255,0.06); color:var(--text); }

        .stg-search-group {
          flex: 1; max-width: 460px;
          display: flex; align-items: center; gap: 8px;
          position: relative;
        }

        .stg-loc-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 999px; flex-shrink: 0;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
          color: var(--muted); font-size: 13px; font-family: var(--font-body);
          cursor: pointer; white-space: nowrap;
          transition: border-color .2s, color .2s;
          max-width: 140px;
        }
        .stg-loc-btn:hover { border-color: var(--border-g); color: var(--text); }
        .stg-loc-btn-label {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 80px;
        }

        /* ── Redesigned search input: solid card look, no "stretched pill" feel */
        .stg-search-wrap { position: relative; flex: 1; min-width: 0; }
        .stg-search {
          display:flex; align-items:center; gap:9px;
          background: var(--bg-card);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 12px; padding: 9px 12px;
          transition: border-color .2s, box-shadow .2s;
        }
        .stg-search.focused {
          border-color: var(--border-g);
          box-shadow: 0 0 0 3px rgba(13,199,94,0.08);
        }
        .stg-search input {
          flex:1; background:none; border:none; outline:none;
          color:var(--text); font-size:13px; font-family:var(--font-body); min-width:0;
        }
        .stg-search input::placeholder { color:rgba(255,255,255,0.5); }
        .stg-search-btn {
          width:28px; height:28px; border-radius:8px; flex-shrink:0;
          background:var(--green); border:none; color:#000;
          display:flex; align-items:center; justify-content:center; cursor:pointer;
          transition: filter .2s;
        }
        .stg-search-btn:hover { filter: brightness(1.1); }

        .stg-trend-pop {
          position:absolute; top:calc(100% + 8px); left:0; right:0;
          background:#0d1220; border:1px solid var(--border); border-radius:14px;
          padding:8px; box-shadow:0 20px 50px rgba(0,0,0,.7); z-index:60;
          animation: stgFadeDown .18s cubic-bezier(.22,1,.36,1);
        }
        .stg-trend-label {
          display:flex; align-items:center; gap:6px;
          font-size:11px; font-weight:700; color:var(--green);
          text-transform:uppercase; letter-spacing:0.07em;
          padding:6px 10px 8px;
        }
        .stg-trend-item {
          display:flex; align-items:center; gap:9px; width:100%;
          text-align:left; padding:9px 10px; border-radius:9px;
          background:none; border:none; color:var(--text); font-size:13px;
          font-family:var(--font-body); cursor:pointer; transition:background .15s;
        }
        .stg-trend-item:hover { background:rgba(13,199,94,0.08); }

        .stg-loc-pop {
          position:absolute; top:calc(100% + 10px); left:0; width:236px;
          background:#0d1220; border:1px solid var(--border); border-radius:14px;
          padding:14px; box-shadow:0 20px 50px rgba(0,0,0,.7);
          display:flex; flex-direction:column; gap:10px; z-index:60;
          animation: stgFadeDown .15s ease;
          box-sizing: border-box;
        }
        .stg-loc-opt {
          display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px;
          cursor:pointer; font-size:13px; color:var(--text); font-family:var(--font-body);
          background:rgba(255,255,255,0.03); border:1px solid var(--border);
          transition:border-color .2s, background .2s;
        }
        .stg-loc-opt:hover { border-color:var(--border-g); background:rgba(13,199,94,0.04); }
        .stg-loc-divider { display:flex; align-items:center; gap:8px; font-size:11px; color:var(--muted2); }
        .stg-loc-divider::before, .stg-loc-divider::after { content:''; flex:1; height:1px; background:var(--border); }
        .stg-loc-input-row { display:flex; gap:6px; min-width:0; }
        .stg-loc-input-row input {
          flex:1; min-width:0; background:rgba(255,255,255,0.04); border:1px solid var(--border);
          border-radius:8px; padding:8px 10px; color:var(--text);
          font-size:13px; font-family:var(--font-body); outline:none;
          transition: border-color .2s; box-sizing:border-box;
        }
        .stg-loc-input-row input:focus { border-color: var(--border-g); }
        .stg-loc-go {
          background:var(--green); border:none; border-radius:8px;
          width:36px; height:36px; flex-shrink:0; box-sizing:border-box;
          color:#000; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
        }

        .stg-nav-r { display:flex; gap:8px; align-items:center; flex-shrink:0; }
        .stg-btn-ghost {
          padding:8px 16px; border-radius:999px; font-size:13px; font-weight:600;
          background:transparent; border:1px solid rgba(255,255,255,0.16); color:var(--text);
          font-family:var(--font-body); cursor:pointer; transition:border-color .2s, background .2s;
          white-space:nowrap;
        }
        .stg-btn-ghost:hover { border-color:rgba(255,255,255,0.35); background:rgba(255,255,255,0.04); }
        .stg-btn-solid {
          display:inline-flex; align-items:center; gap:5px;
          padding:8px 16px; border-radius:999px; font-size:13px; font-weight:700;
          background:var(--green); border:none; color:#000;
          font-family:var(--font-body); cursor:pointer; transition:filter .2s, transform .2s;
          white-space:nowrap;
        }
        .stg-btn-solid:hover { filter:brightness(1.08); transform:translateY(-1px); }

        .stg-mob-icon-btn {
          display:none; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:10px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          color:var(--text); cursor:pointer; flex-shrink:0;
          transition: background .2s;
        }
        .stg-mob-icon-btn:hover { background:rgba(255,255,255,0.1); }

        .stg-hamburger {
          display:none; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:10px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          color:var(--text); cursor:pointer; flex-shrink:0;
          transition: background .2s;
        }
        .stg-hamburger:hover { background:rgba(255,255,255,0.1); }

        .stg-mob-loc-icon-wrap { display:none; position:relative; flex-shrink:0; }

        .stg-mob-search-overlay {
          position: fixed; top: 0; left: 0; right: 0; z-index: 600;
          background: rgba(4,8,20,.99);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: calc(var(--nav-h) + 14px) clamp(16px,4%,48px) 18px;
          animation: stgSlideDownFade .22s cubic-bezier(.22,1,.36,1);
        }
        .stg-mob-search-row { display:flex; align-items:center; gap:10px; position:relative; }
        .stg-mob-search-box {
          flex:1; min-width:0; display:flex; align-items:center; gap:10px;
          background: var(--bg-card); border:1.5px solid rgba(13,199,94,0.35);
          border-radius:14px; padding:12px 16px;
          box-shadow: 0 0 0 4px rgba(13,199,94,0.06);
        }
        .stg-mob-search-box input {
          flex:1; min-width:0; background:none; border:none; outline:none;
          color:var(--text); font-size:15px; font-family:var(--font-body);
        }
        .stg-mob-search-box input::placeholder { color:rgba(255,255,255,0.5); }
        .stg-mob-search-close {
          width:40px; height:40px; border-radius:50%; flex-shrink:0;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1);
          color:var(--text); cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition: background .2s;
        }
        .stg-mob-search-close:hover { background:rgba(255,255,255,0.12); }
        .stg-mob-search-overlay .stg-trend-pop { left:0; right:56px; top:calc(100% + 4px); position:absolute; }

        .stg-mob-overlay {
          position:fixed; inset:0; z-index:505;
          background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
          animation: stgFadeIn .2s ease;
        }

        .stg-mob-drawer {
          position:fixed; top:0; right:0; bottom:0; z-index:510;
          width:min(320px, 88vw);
          background:#080e1e;
          border-left:1px solid rgba(255,255,255,0.08);
          display:flex; flex-direction:column;
          animation: stgSlideLeft .25s cubic-bezier(.22,1,.36,1);
          overflow-y:auto;
        }

        .stg-mob-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 20px 16px;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }

        .stg-mob-links { padding:12px 12px; flex:1; }
        .stg-mob-link {
          display:flex; align-items:center; gap:12px;
          padding:13px 12px; border-radius:11px;
          font-size:14px; font-weight:500; color:var(--muted);
          cursor:pointer; transition:background .15s, color .15s;
          border:none; background:none; width:100%; text-align:left;
          font-family:var(--font-body);
        }
        .stg-mob-link:hover, .stg-mob-link.active { background:rgba(255,255,255,0.05); color:var(--text); }
        .stg-mob-link.active { color:var(--green); }
        .stg-mob-link-icon {
          width:32px; height:32px; border-radius:9px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          background:rgba(255,255,255,0.06);
        }
        .stg-mob-link.active .stg-mob-link-icon { background:rgba(13,199,94,0.12); color:var(--green); }

        .stg-mob-divider { margin:6px 20px; height:1px; background:rgba(255,255,255,0.07); }
        .stg-mob-section-label {
          padding:10px 24px 6px;
          font-size:10px; font-weight:700; color:var(--muted2);
          letter-spacing:0.1em; text-transform:uppercase;
        }

        .stg-mob-footer {
          padding:16px 20px 28px;
          border-top:1px solid rgba(255,255,255,0.07);
          display:flex; flex-direction:column; gap:10px;
        }
        .stg-mob-btn-ghost {
          padding:13px; border-radius:12px; font-size:14px; font-weight:600;
          background:transparent; border:1px solid rgba(255,255,255,0.16); color:var(--text);
          font-family:var(--font-body); cursor:pointer; text-align:center;
          transition:border-color .2s, background .2s;
        }
        .stg-mob-btn-ghost:hover { border-color:rgba(255,255,255,0.35); }
        .stg-mob-btn-solid {
          padding:13px; border-radius:12px; font-size:14px; font-weight:700;
          background:var(--green); border:none; color:#000;
          font-family:var(--font-body); cursor:pointer; text-align:center;
          display:flex; align-items:center; justify-content:center; gap:6px;
          transition:filter .2s;
        }
        .stg-mob-btn-solid:hover { filter:brightness(1.08); }

        .stg-mob-loc {
          margin:12px 20px 0; position:relative;
          display:flex; align-items:center; gap:10px;
          padding:11px 14px; border-radius:12px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
          cursor:pointer; transition: border-color .2s;
        }
        .stg-mob-loc:hover { border-color:var(--border-g); }
        .stg-mob-loc-text { flex:1; font-size:13px; color:var(--muted); font-family:var(--font-body); }
        .stg-mob-loc-val { font-size:13px; font-weight:600; color:var(--text); font-family:var(--font-body); }
        .stg-mob-loc .stg-loc-pop { left:auto; right:0; }

        @keyframes stgFadeDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes stgFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes stgSlideLeft {
          from { transform:translateX(100%); opacity:0; }
          to   { transform:translateX(0); opacity:1; }
        }
        @keyframes stgSlideDownFade {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:translateY(0); }
        }

        @media (max-width: 1180px) { .stg-tabs { display:none !important; } }
        @media (max-width: 900px)  { .stg-search-group { display:none !important; } }
        @media (max-width: 640px) {
          .stg-hamburger { display:flex !important; }
          .stg-mob-icon-btn { display:flex !important; }
          .stg-mob-loc-icon-wrap { display:flex !important; }
          .stg-nav-r { display:none !important; }
        }
        .stg-mob-loc-icon-wrap .stg-loc-pop {
          left: auto;
          right: 0;
        }
        @media (min-width: 641px) {
          .stg-mob-overlay { display:none !important; }
          .stg-mob-drawer  { display:none !important; }
          .stg-mob-search-overlay { display:none !important; }
        }
      `}</style>

      <nav className={`stg-nav ${scrolled ? 'scrolled' : ''}`}>

        {/* Logo */}
        <div className="stg-logo" onClick={() => navigate('/')}>
          <img src="/Stagechecklogo.png" alt="StageCheck" className="stg-logo-img" />
          <span className="stg-logo-text">StageCheck</span>
        </div>

        {/* Desktop tabs */}
        <div className="stg-tabs">
          {PAGE_TABS.map(t => (
            <button key={t.to} className={`stg-tab ${pathname === t.to ? 'active' : ''}`} onClick={() => navigate(t.to)}>
              {t.label}
            </button>
          ))}
          <div ref={resRef} style={{ position: 'relative' }}>
            <button className="stg-tab" onClick={() => setResOpen(v => !v)}>
              Resources <RiArrowDownSLine size={13} style={{ transition: 'transform .2s', transform: resOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {resOpen && (
              <div className="stg-res-pop">
                {RESOURCE_LINKS.map(r => (
                  <button key={r.to} className="stg-res-item" onClick={() => { navigate(r.to); setResOpen(false) }}>
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop location + search group */}
        <div className="stg-search-group">
          <div ref={locRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button className="stg-loc-btn" onClick={() => setLocOpen(v => !v)}>
              <RiMapPin2Line size={14} color="var(--green)" />
              <span className="stg-loc-btn-label">{locationLabel}</span>
              <RiArrowDownSLine
                size={12}
                style={{ transition: 'transform .2s', transform: locOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
              />
            </button>
            {locOpen && <LocationPopup />}
          </div>

          <div className="stg-search-wrap" ref={searchRef}>
            <div className={`stg-search ${searchFocused ? 'focused' : ''}`}>
              <RiSearchLine size={13} color="rgba(255,255,255,0.45)" />
              <input
                placeholder="Search events, venues..."
                value={searchValue}
                onFocus={() => { setSearchFocused(true); loadTrending() }}
                onChange={e => onSearchChange?.(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitSearch()}
              />
              <button className="stg-search-btn" onClick={() => submitSearch()}>
                <RiSearchLine size={12} />
              </button>
            </div>
            {searchFocused && <TrendingDropdown onPick={(t) => submitSearch(t)} />}
          </div>
        </div>

        {/* Desktop CTA buttons */}
        <div className="stg-nav-r">
          <button className="stg-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
          <button className="stg-btn-solid" onClick={() => navigate('/signup')}>
            Create Event <RiArrowRightUpLine size={12} />
          </button>
        </div>

        {/* Mobile: search icon */}
        <button className="stg-mob-icon-btn" onClick={() => setMobileSearchOpen(true)}>
          <RiSearchLine size={18} />
        </button>

        {/* Mobile: location icon */}
        <div className="stg-mob-loc-icon-wrap" ref={mobLocRef}>
          <button className="stg-mob-icon-btn" onClick={() => setLocOpen(v => !v)}>
            <RiMapPin2Line size={18} />
          </button>
          {locOpen && <LocationPopup />}
        </div>

        {/* Mobile: hamburger */}
        <button className="stg-hamburger" onClick={() => setMobileOpen(true)}>
          <RiMenuLine size={20} />
        </button>
      </nav>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="stg-mob-search-overlay" style={{ top: 'var(--nav-h)' }}>
          <div className="stg-mob-search-row" ref={mobSearchRef}>
            <div className="stg-mob-search-box">
              <RiSearchLine size={16} color="var(--green)" />
              <input
                ref={mobSearchInputRef}
                placeholder="Search events, venues..."
                value={searchValue}
                onFocus={() => { setMobSearchFocused(true); loadTrending() }}
                onChange={e => onSearchChange?.(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { submitSearch(); setMobileSearchOpen(false) }
                  if (e.key === 'Escape') setMobileSearchOpen(false)
                }}
              />
            </div>
            <button className="stg-mob-search-close" onClick={() => setMobileSearchOpen(false)}>
              <RiCloseLine size={18} />
            </button>
            {mobSearchFocused && (
              <TrendingDropdown onPick={(t) => { submitSearch(t); setMobileSearchOpen(false) }} />
            )}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="stg-mob-overlay" onClick={() => setMobileOpen(false)} />
          <div className="stg-mob-drawer">

            <div className="stg-mob-head">
              <div className="stg-logo" onClick={() => { navigate('/'); setMobileOpen(false) }}>
                <img src="/Stagechecklogo.png" alt="StageCheck" className="stg-logo-img" />
                <span className="stg-logo-text">StageCheck</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Location row inside drawer */}
            <div className="stg-mob-loc" ref={mobLocRef} onClick={() => setLocOpen(v => !v)}>
              <RiMapPin2Line size={15} color="var(--green)" />
              <span className="stg-mob-loc-text">Location</span>
              <span className="stg-mob-loc-val">{locationLabel}</span>
              {locOpen && <LocationPopup />}
            </div>

            <div className="stg-mob-links">
              <div className="stg-mob-section-label">Navigate</div>
              {PAGE_TABS.map(t => (
                <button
                  key={t.to}
                  className={`stg-mob-link ${pathname === t.to ? 'active' : ''}`}
                  onClick={() => { navigate(t.to); setMobileOpen(false) }}
                >
                  <span className="stg-mob-link-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
              <div className="stg-mob-divider" style={{ margin: '10px 0' }} />
              <div className="stg-mob-section-label">Resources</div>
              {RESOURCE_LINKS.map(r => (
                <button
                  key={r.to}
                  className={`stg-mob-link ${pathname === r.to ? 'active' : ''}`}
                  onClick={() => { navigate(r.to); setMobileOpen(false) }}
                >
                  <span className="stg-mob-link-icon">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="stg-mob-footer">
              <button className="stg-mob-btn-ghost" onClick={() => { navigate('/login'); setMobileOpen(false) }}>
                Log in
              </button>
              <button className="stg-mob-btn-solid" onClick={() => { navigate('/signup'); setMobileOpen(false) }}>
                Create Event <RiArrowRightUpLine size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}