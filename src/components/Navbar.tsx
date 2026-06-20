// src/components/landing/SiteNavbar.tsx
//
// Search + location now live permanently in the navbar (per latest design ref),
// not just after scrolling past the hero. Tabs route to real pages. "Resources"
// is a dropdown for secondary links (Privacy/Terms/Refund etc).

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  RiSearchLine, RiMapPin2Line, RiCrosshairLine, RiArrowRightUpLine, RiArrowDownSLine,
} from 'react-icons/ri'

interface SiteNavbarProps {
  searchValue?: string
  onSearchChange?: (v: string) => void
  onSearchSubmit?: () => void
  locationLabel?: string
  onLocationChange?: (label: string) => void
}

const PAGE_TABS = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Events', to: '/events' },
  { label: 'Why StageCheck', to: '/why-us' },
]

const RESOURCE_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Refund Policy', to: '/refund' },
]

export default function SiteNavbar({
  searchValue = '', onSearchChange, onSearchSubmit,
  locationLabel = 'Anywhere', onLocationChange,
}: SiteNavbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [locOpen, setLocOpen] = useState(false)
  const [resOpen, setResOpen] = useState(false)
  const [cityInput, setCityInput] = useState('')
  const [locating, setLocating] = useState(false)
  const locRef = useRef<HTMLDivElement>(null)
  const resRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false)
      if (resRef.current && !resRef.current.contains(e.target as Node)) setResOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const useMyLocation = () => {
    setLocating(true)
    if (!navigator.geolocation) {
      onLocationChange?.('Location unavailable'); setLocating(false); setLocOpen(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          onLocationChange?.(data?.address?.city || data?.address?.town || data?.address?.state || 'Current location')
        } catch {
          onLocationChange?.('Current location')
        }
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

  return (
    <>
      <style>{`
        .stg-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          height: var(--nav-h);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(16px, 4%, 56px); gap: 14px;
          transition: background .35s ease, box-shadow .35s ease, border-color .35s ease;
          border-bottom: 1px solid transparent;
        }
        .stg-nav.scrolled {
          background: rgba(0,4,14,.96);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom-color: var(--border);
          box-shadow: 0 4px 32px rgba(0,0,0,.5);
        }
        .stg-logo { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
        .stg-logo-img { height:32px; width:auto; object-fit:contain; display:block; }
        .stg-logo-text { font-family: var(--font-body); font-weight: 800; font-size: 17px; color: var(--text); }

        .stg-tabs { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .stg-tab {
          position: relative; padding: 9px 14px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500; color: var(--muted);
          cursor: pointer; background: none; border: none;
          font-family: var(--font-body); transition: color .2s;
          display: flex; align-items: center; gap: 4px;
        }
        .stg-tab:hover { color: var(--text); }
        .stg-tab.active { color: var(--text); }
        .stg-tab.active::after {
          content: ''; position: absolute; bottom: -2px; left: 14%; right: 14%; height: 2px;
          background: var(--green); border-radius: 2px;
          box-shadow: 0 0 14px 2px rgba(13,199,94,.65);
        }
        .stg-res-pop {
          position: absolute; top: calc(100% + 8px); left: 0; min-width: 180px;
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
          padding: 6px; box-shadow: 0 20px 50px rgba(0,0,0,.6); z-index: 50;
        }
        .stg-res-item {
          display: block; width: 100%; text-align: left; padding: 9px 12px; border-radius: 8px;
          background: none; border: none; color: var(--muted); font-size: 13px;
          font-family: var(--font-body); cursor: pointer; transition: background .15s, color .15s;
        }
        .stg-res-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }

        .stg-search {
          flex: 1; max-width: 360px;
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; padding: 7px 7px 7px 16px;
        }
        .stg-search input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 13.5px; font-family: var(--font-body); min-width: 0;
        }
        .stg-search input::placeholder { color: rgba(255,255,255,0.4); }
        .stg-search-btn {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          background: var(--green); border: none; color: #000;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .stg-loc-wrap { position: relative; flex-shrink: 0; }
        .stg-loc-pill {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; padding: 9px 14px;
          font-size: 12.5px; color: var(--muted); cursor: pointer;
          font-family: var(--font-body); white-space: nowrap; transition: border-color .2s, color .2s;
        }
        .stg-loc-pill:hover { border-color: var(--border-g); color: var(--text); }
        .stg-loc-pop {
          position: absolute; top: calc(100% + 10px); right: 0; width: 240px;
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
          padding: 14px; box-shadow: 0 20px 50px rgba(0,0,0,.6);
          display: flex; flex-direction: column; gap: 10px; z-index: 50;
        }
        .stg-loc-opt {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
          cursor: pointer; font-size: 13px; color: var(--text); font-family: var(--font-body);
          background: rgba(255,255,255,0.03); border: 1px solid var(--border); transition: border-color .2s;
        }
        .stg-loc-opt:hover { border-color: var(--border-g); }
        .stg-loc-divider { display:flex; align-items:center; gap:8px; font-size:11px; color:var(--muted2); }
        .stg-loc-divider::before, .stg-loc-divider::after { content:''; flex:1; height:1px; background:var(--border); }
        .stg-loc-input-row { display: flex; gap: 6px; }
        .stg-loc-input-row input {
          flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px;
          padding: 8px 10px; color: var(--text); font-size: 13px; font-family: var(--font-body); outline: none;
        }
        .stg-loc-go { background: var(--green); border: none; border-radius: 8px; padding: 0 12px; color: #000; cursor: pointer; display:flex; align-items:center; justify-content:center; }

        .stg-nav-r { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        .stg-btn-ghost {
          padding: 9px 18px; border-radius: 999px; font-size: 13.5px; font-weight: 600;
          background: transparent; border: 1px solid rgba(255,255,255,0.18); color: var(--text);
          font-family: var(--font-body); cursor: pointer; transition: border-color .2s;
        }
        .stg-btn-ghost:hover { border-color: var(--border-g); }
        .stg-btn-solid {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 999px; font-size: 13.5px; font-weight: 700;
          background: var(--green); border: none; color: #000;
          font-family: var(--font-body); cursor: pointer; transition: filter .2s;
        }
        .stg-btn-solid:hover { filter: brightness(1.1); }

        @media (max-width: 1180px) { .stg-tabs { display: none !important; } }
        @media (max-width: 900px) { .stg-search { display: none !important; } }
        @media (max-width: 560px) { .stg-loc-pill span { display: none; } }
      `}</style>

      <nav className={`stg-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="stg-logo" onClick={() => navigate('/')}>
          <img src="/Stagechecklogo.png" alt="StageCheck" className="stg-logo-img" />
          <span className="stg-logo-text">StageCheck</span>
        </div>

        <div className="stg-tabs">
          {PAGE_TABS.map(t => (
            <button key={t.to} className={`stg-tab ${pathname === t.to ? 'active' : ''}`} onClick={() => navigate(t.to)}>
              {t.label}
            </button>
          ))}
          <div ref={resRef} style={{ position: 'relative' }}>
            <button className="stg-tab" onClick={() => setResOpen(v => !v)}>
              Resources <RiArrowDownSLine size={14} />
            </button>
            {resOpen && (
              <div className="stg-res-pop">
                {RESOURCE_LINKS.map(r => (
                  <button key={r.to} className="stg-res-item" onClick={() => { navigate(r.to); setResOpen(false) }}>{r.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stg-search">
          <RiSearchLine size={14} color="rgba(255,255,255,0.45)" />
          <input
            placeholder="Search events, venues..."
            value={searchValue}
            onChange={e => onSearchChange?.(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearchSubmit?.()}
          />
          <button className="stg-search-btn" onClick={onSearchSubmit}><RiSearchLine size={13} /></button>
        </div>

        <div className="stg-loc-wrap" ref={locRef}>
          <button className="stg-loc-pill" onClick={() => setLocOpen(v => !v)}>
            <RiMapPin2Line size={14} /> <span>{locationLabel}</span>
          </button>
          {locOpen && (
            <div className="stg-loc-pop">
              <button className="stg-loc-opt" onClick={useMyLocation}>
                <RiCrosshairLine size={16} color="var(--green)" />
                {locating ? 'Finding you…' : 'Use current location'}
              </button>
              <div className="stg-loc-divider">or</div>
              <div className="stg-loc-input-row">
                <input placeholder="Type a city…" value={cityInput} onChange={e => setCityInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitCity()} />
                <button className="stg-loc-go" onClick={submitCity}><RiArrowRightUpLine size={15} /></button>
              </div>
            </div>
          )}
        </div>

        <div className="stg-nav-r">
          <button className="stg-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
          <button className="stg-btn-solid" onClick={() => navigate('/signup')}>
            Create Event <RiArrowRightUpLine size={13} />
          </button>
        </div>
      </nav>
    </>
  )
}