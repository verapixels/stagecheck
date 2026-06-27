// src/components/landing/SiteNavbar.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  doc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/Authcontext";
import {
  RiSearchLine,
  RiMapPin2Line,
  RiCrosshairLine,
  RiArrowRightUpLine,
  RiArrowDownSLine,
  RiMenuLine,
  RiCloseLine,
  RiCalendarEventLine,
  RiInformationLine,
  RiQuestionLine,
  RiShieldLine,
  RiFileTextLine,
  RiRefundLine,
  RiFireLine,
  RiDashboardLine,
  RiSettings4Line,
  RiLogoutBoxLine,
} from "react-icons/ri";

interface SiteNavbarProps {
  onSearchSubmit?: (query: string, location: string) => void;
  locationLabel?: string;
  onLocationChange?: (label: string) => void;
}

const PAGE_TABS = [
  { label: "How It Works", to: "/how-it-works", icon: <RiInformationLine size={16} /> },
  { label: "Events", to: "/events", icon: <RiCalendarEventLine size={16} /> },
  { label: "Why StageCheck", to: "/why-us", icon: <RiQuestionLine size={16} /> },
];

const RESOURCE_LINKS = [
  { label: "Privacy Policy", to: "/privacy", icon: <RiShieldLine size={14} /> },
  { label: "Terms of Service", to: "/terms", icon: <RiFileTextLine size={14} /> },
  { label: "Refund Policy", to: "/refund", icon: <RiRefundLine size={14} /> },
];

const FALLBACK_TRENDING = ["tech events", "lagos free events", "music concerts", "stage plays"];

function LocationPopup({ locating, cityInput, setCityInput, onUseMyLocation, onSubmitCity }: {
  locating: boolean; cityInput: string; setCityInput: (v: string) => void;
  onUseMyLocation: () => void; onSubmitCity: () => void;
}) {
  return (
    <div className="stg-loc-pop">
      <button className="stg-loc-opt" onClick={onUseMyLocation}>
        <RiCrosshairLine size={15} color="var(--green)" />
        {locating ? "Finding you..." : "Use my location"}
      </button>
      <div className="stg-loc-divider">or</div>
      <div className="stg-loc-input-row">
        <input
          placeholder="Type a city..."
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmitCity()}
        />
        <button className="stg-loc-go" onClick={onSubmitCity}>
          <RiArrowRightUpLine size={14} />
        </button>
      </div>
    </div>
  );
}

function TrendingDropdown({ trending, onPick }: { trending: string[]; onPick: (term: string) => void }) {
  return (
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
  );
}

function UserMenu({ displayName, photoURL, onNavigate, onOpenManage, onLogout }: {
  displayName: string; photoURL: string | null;
  onNavigate: (to: string) => void; onOpenManage: () => void; onLogout: () => void;
}) {
  return (
    <div className="stg-res-pop" style={{ minWidth: 200, right: 0, left: "auto" }}>
      <button className="stg-res-item" onClick={() => onNavigate("/dashboard")}>
        <RiDashboardLine size={14} /> Dashboard
      </button>
      <button className="stg-res-item" onClick={() => onNavigate("/dashboard/invitations")}>
        <RiInformationLine size={14} /> Invitations
      </button>
      <button className="stg-res-item" onClick={onOpenManage}>
        <RiCalendarEventLine size={14} /> My Events
      </button>
      <button className="stg-res-item" onClick={() => onNavigate("/dashboard/settings")}>
        <RiSettings4Line size={14} /> Settings
      </button>
      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
      <button className="stg-res-item" style={{ color: "#F87171" }} onClick={onLogout}>
        <RiLogoutBoxLine size={14} /> Log out
      </button>
    </div>
  );
}

export default function SiteNavbar({ onSearchSubmit, locationLabel: externalLocationLabel, onLocationChange }: SiteNavbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  const [searchValue, setSearchValue] = useState("");
  const [locationLabel, setLocationLabel] = useState(externalLocationLabel ?? "Anywhere");
  const [scrolled, setScrolled] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobUserMenuOpen, setMobUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobSearchFocused, setMobSearchFocused] = useState(false);
  const [trending, setTrending] = useState<string[]>(FALLBACK_TRENDING);
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  const locRef = useRef<HTMLDivElement>(null);
  const mobLocRef = useRef<HTMLDivElement>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobSearchRef = useRef<HTMLDivElement>(null);
  const mobSearchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobUserMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (externalLocationLabel) setLocationLabel(externalLocationLabel) }, [externalLocationLabel]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true }); fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => { setMobileOpen(false); setMobileSearchOpen(false); setMobUserMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen || mobileSearchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen, mobileSearchOpen]);
  useEffect(() => {
    if (mobileSearchOpen) {
      const t = setTimeout(() => mobSearchInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [mobileSearchOpen]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node) &&
        (!mobLocRef.current || !mobLocRef.current.contains(e.target as Node))) setLocOpen(false);
      if (resRef.current && !resRef.current.contains(e.target as Node)) setResOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
      if (mobSearchRef.current && !mobSearchRef.current.contains(e.target as Node)) setMobSearchFocused(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (mobUserMenuRef.current && !mobUserMenuRef.current.contains(e.target as Node)) setMobUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const loadTrending = async () => {
    if (trendingLoaded) return; setTrendingLoaded(true);
    try {
      const q = query(collection(db, "trendingSearches"), orderBy("count", "desc"), limit(6));
      const snap = await getDocs(q);
      const terms = snap.docs.map((d) => (d.data() as any).term).filter(Boolean);
      if (terms.length > 0) setTrending(terms);
    } catch {}
  };

  const logSearch = (term: string) => {
    const clean = term.trim().toLowerCase(); if (!clean) return;
    addDoc(collection(db, "searchLogs"), { term: clean, createdAt: serverTimestamp() }).catch(() => {});
    setDoc(doc(db, "trendingSearches", clean), { term: clean, count: increment(1), updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
  };

  const submitSearch = (term?: string) => {
    const value = (term ?? searchValue).trim(); if (term) setSearchValue(term); if (!value) return;
    logSearch(value); setSearchFocused(false); setMobSearchFocused(false);
    navigate(`/events?q=${encodeURIComponent(value)}&loc=${encodeURIComponent(locationLabel)}`);
    onSearchSubmit?.(value, locationLabel);
  };

  const handleLocationChange = (label: string) => { setLocationLabel(label); onLocationChange?.(label); };

  const useMyLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) { handleLocationChange("Location unavailable"); setLocating(false); setLocOpen(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          handleLocationChange(data?.address?.city || data?.address?.town || data?.address?.state || "Current location");
        } catch { handleLocationChange("Current location"); }
        setLocating(false); setLocOpen(false);
      },
      () => { handleLocationChange("Location unavailable"); setLocating(false); setLocOpen(false); },
      { timeout: 8000 }
    );
  };

  const submitCity = () => { if (cityInput.trim()) handleLocationChange(cityInput.trim()); setCityInput(""); setLocOpen(false); };

  const locationPopupProps = { locating, cityInput, setCityInput, onUseMyLocation: useMyLocation, onSubmitCity: submitCity };

  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Account";
  const avatarInitial = (user?.displayName?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  const handleLogout = async () => { setUserMenuOpen(false); setMobUserMenuOpen(false); await signOut(); navigate("/"); };
  const handleOpenManage = () => { setUserMenuOpen(false); window.open("/manage", "_blank", "noopener,noreferrer"); };

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
          padding: 0 clamp(16px, 4%, 48px); gap: 16px;
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
        .stg-logo-img { height:32px; width:32px; object-fit:contain; border-radius:6px; }
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
          position:absolute; top:calc(100% + 8px); left:0; min-width:190px;
          background:#0d1220; border:1px solid var(--border); border-radius:12px;
          padding:6px; box-shadow:0 16px 48px rgba(0,0,0,.7); z-index:600;
          animation: stgFadeDown .15s ease;
        }
        .stg-res-item {
          display:flex; align-items:center; gap:8px;
          width:100%; text-align:left; padding:9px 11px; border-radius:8px;
          background:none; border:none; color:var(--muted); font-size:13px;
          font-family:var(--font-body); cursor:pointer; transition:background .15s, color .15s;
        }
        .stg-res-item:hover { background:rgba(255,255,255,0.06); color:var(--text); }

        .stg-search-group { flex: 1; max-width: 540px; display: flex; align-items: center; position: relative; }
        .stg-search-combined {
          display: flex; align-items: center; width: 100%;
          background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.10);
          border-radius: 14px; padding: 5px 5px 5px 0; gap: 0;
          transition: border-color .2s, box-shadow .2s;
        }
        .stg-search-combined:focus-within {
          border-color: var(--border-g); box-shadow: 0 0 0 3px rgba(13,199,94,0.08); background: var(--bg-card);
        }
        .stg-search-wrap { position: relative; flex: 1; min-width: 0; }
        .stg-search-inner { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
        .stg-search-inner input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 13px; font-family: var(--font-body); min-width: 0; caret-color: var(--green);
        }
        .stg-search-inner input::placeholder { color: rgba(255,255,255,0.4); }
        .stg-combined-divider { width: 1px; height: 20px; flex-shrink: 0; background: rgba(255,255,255,0.12); }
        .stg-loc-wrap { position: relative; flex-shrink: 0; }
        .stg-loc-inner {
          display: flex; align-items: center; gap: 6px; padding: 8px 10px;
          background: none; border: none; color: var(--muted); font-size: 13px;
          font-family: var(--font-body); cursor: pointer; white-space: nowrap; transition: color .2s;
        }
        .stg-loc-inner:hover { color: var(--text); }
        .stg-loc-btn-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px; }
        .stg-search-btn {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: var(--green); border: none; color: #000;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: filter .2s; margin-left: 4px;
        }
        .stg-search-btn:hover { filter: brightness(1.1); }

        .stg-trend-pop {
          position: absolute; top: calc(100% + 10px); left: 0; right: 0;
          background: #0d1220; border: 1px solid var(--border); border-radius: 14px;
          padding: 8px; box-shadow: 0 20px 50px rgba(0,0,0,.8); z-index: 600;
          animation: stgFadeDown .18s cubic-bezier(.22,1,.36,1); min-width: 240px;
        }
        .stg-trend-label {
          display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
          color: var(--green); text-transform: uppercase; letter-spacing: 0.07em; padding: 6px 10px 8px;
        }
        .stg-trend-item {
          display: flex; align-items: center; gap: 9px; width: 100%; text-align: left;
          padding: 9px 10px; border-radius: 9px; background: none; border: none;
          color: var(--text); font-size: 13px; font-family: var(--font-body); cursor: pointer; transition: background .15s;
        }
        .stg-trend-item:hover { background: rgba(13,199,94,0.08); }

        .stg-loc-pop {
          position: absolute; top: calc(100% + 10px); right: 0; width: 236px;
          background: #0d1220; border: 1px solid var(--border); border-radius: 14px;
          padding: 14px; box-shadow: 0 20px 50px rgba(0,0,0,.8);
          display: flex; flex-direction: column; gap: 10px; z-index: 600;
          animation: stgFadeDown .15s ease; box-sizing: border-box;
        }
        .stg-loc-opt {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
          cursor: pointer; font-size: 13px; color: var(--text); font-family: var(--font-body);
          background: rgba(255,255,255,0.03); border: 1px solid var(--border); transition: border-color .2s, background .2s;
        }
        .stg-loc-opt:hover { border-color: var(--border-g); background: rgba(13,199,94,0.04); }
        .stg-loc-divider { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted2); }
        .stg-loc-divider::before, .stg-loc-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .stg-loc-input-row { display: flex; gap: 6px; min-width: 0; }
        .stg-loc-input-row input {
          flex: 1; min-width: 0; background: rgba(255,255,255,0.04); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 13px;
          font-family: var(--font-body); outline: none; transition: border-color .2s; box-sizing: border-box;
        }
        .stg-loc-input-row input:focus { border-color: var(--border-g); }
        .stg-loc-go {
          background: var(--green); border: none; border-radius: 8px;
          width: 36px; height: 36px; flex-shrink: 0; box-sizing: border-box;
          color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }

        /* ── Desktop right ── */
        .stg-nav-r { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .stg-btn-ghost {
          padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 600;
          background: transparent; border: 1px solid rgba(255,255,255,0.16); color: var(--text);
          font-family: var(--font-body); cursor: pointer; transition: border-color .2s, background .2s; white-space: nowrap;
        }
        .stg-btn-ghost:hover { border-color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.04); }
        .stg-btn-solid {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700;
          background: var(--green); border: none; color: #000;
          font-family: var(--font-body); cursor: pointer; transition: filter .2s, transform .2s; white-space: nowrap;
        }
        .stg-btn-solid:hover { filter: brightness(1.08); transform: translateY(-1px); }

        /* ── Desktop user pill — more visible chevron ── */
        .stg-user-pill {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.18);
          border-radius: 999px; padding: 5px 10px 5px 5px; cursor: pointer;
          font-family: var(--font-body); transition: border-color .2s, background .2s;
        }
        .stg-user-pill:hover { border-color: rgba(13,199,94,0.5); background: rgba(13,199,94,0.06); }
        .stg-user-avatar {
          width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
          background: rgba(13,199,94,0.15); display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: var(--green);
        }
        .stg-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .stg-user-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .stg-chevron-pill {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: background .2s, transform .2s;
        }
        .stg-user-pill:hover .stg-chevron-pill { background: rgba(13,199,94,0.15); }

        /* ── Mobile icon buttons — tighter gap ── */
        .stg-mob-icons {
          display: none; align-items: center; gap: 6px;
        }
        .stg-mob-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text); cursor: pointer; flex-shrink: 0; transition: background .2s;
        }
        .stg-mob-icon-btn:hover { background: rgba(255,255,255,0.1); }

        /* ── Mobile avatar button ── */
        .stg-mob-avatar-btn {
          position: relative; display: flex; align-items: center; gap: 0;
          cursor: pointer; flex-shrink: 0;
        }
        .stg-mob-avatar {
          width: 34px; height: 34px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
          background: rgba(13,199,94,0.15); border: 1.5px solid rgba(13,199,94,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: var(--green);
        }
        .stg-mob-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .stg-mob-chevron-badge {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--green); border: 1.5px solid #060d1a;
          display: flex; align-items: center; justify-content: center;
          position: absolute; bottom: -1px; right: -3px;
        }

        /* ── Mobile avatar dropdown ── */
        .stg-mob-user-drop {
          position: absolute; top: calc(100% + 10px); right: 0; min-width: 200px;
          background: #0d1220; border: 1px solid rgba(13,199,94,0.2); border-radius: 14px;
          padding: 8px; box-shadow: 0 20px 50px rgba(0,0,0,.85); z-index: 700;
          animation: stgFadeDown .18s cubic-bezier(.22,1,.36,1);
        }
        .stg-mob-drop-header {
          padding: 10px 12px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 6px;
        }
        .stg-mob-drop-name { font-size: 13px; font-weight: 700; color: var(--text); }
        .stg-mob-drop-email { font-size: 11px; color: var(--muted2); margin-top: 2px; }

        .stg-mob-search-overlay {
          position: fixed; top: var(--nav-h); left: 0; right: 0; z-index: 600;
          background: rgba(4,8,20,.99); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border); padding: 14px clamp(16px,4%,48px) 18px;
          animation: stgSlideDownFade .22s cubic-bezier(.22,1,.36,1);
        }
        .stg-mob-search-row { display: flex; align-items: center; gap: 10px; position: relative; }
        .stg-mob-search-combined {
          flex: 1; min-width: 0; display: flex; align-items: center;
          background: var(--bg-card); border: 1.5px solid rgba(13,199,94,0.35);
          border-radius: 14px; box-shadow: 0 0 0 4px rgba(13,199,94,0.06); overflow: hidden; height: 50px;
        }
        .stg-mob-search-combined input::placeholder { color: rgba(255,255,255,0.45); }
        .stg-mob-search-icon { display: flex; align-items: center; padding: 0 10px 0 14px; flex-shrink: 0; }
        .stg-mob-search-close {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s;
        }
        .stg-mob-search-close:hover { background: rgba(255,255,255,0.12); }
        .stg-mob-search-overlay .stg-trend-pop { position: absolute; left: 0; right: 54px; top: calc(100% + 8px); }
        .stg-mob-search-overlay .stg-loc-pop { position: absolute; right: 0; left: auto; top: calc(100% + 6px); }

        .stg-mob-overlay {
          position: fixed; inset: 0; z-index: 505;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); animation: stgFadeIn .2s ease;
        }
        .stg-mob-drawer {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 510;
          width: min(320px, 88vw); background: #080e1e;
          border-left: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-direction: column;
          animation: stgSlideLeft .25s cubic-bezier(.22,1,.36,1); overflow-y: auto;
        }
        .stg-mob-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .stg-mob-links { padding: 12px; flex: 1; }
        .stg-mob-link {
          display: flex; align-items: center; gap: 12px; padding: 13px 12px; border-radius: 11px;
          font-size: 14px; font-weight: 500; color: var(--muted); cursor: pointer;
          transition: background .15s, color .15s; border: none; background: none;
          width: 100%; text-align: left; font-family: var(--font-body);
        }
        .stg-mob-link:hover { background: rgba(255,255,255,0.05); color: var(--text); }
        .stg-mob-link.active { background: rgba(255,255,255,0.05); color: var(--green); }
        .stg-mob-link-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06);
        }
        .stg-mob-link.active .stg-mob-link-icon { background: rgba(13,199,94,0.12); color: var(--green); }
        .stg-mob-divider { margin: 6px 0; height: 1px; background: rgba(255,255,255,0.07); }
        .stg-mob-section-label {
          padding: 10px 12px 6px; font-size: 10px; font-weight: 700; color: var(--muted2);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .stg-mob-footer {
          padding: 16px 20px 28px; border-top: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column; gap: 10px;
        }
        .stg-mob-btn-ghost {
          padding: 13px; border-radius: 12px; font-size: 14px; font-weight: 600;
          background: transparent; border: 1px solid rgba(255,255,255,0.16); color: var(--text);
          font-family: var(--font-body); cursor: pointer; text-align: center; transition: border-color .2s, background .2s;
        }
        .stg-mob-btn-ghost:hover { border-color: rgba(255,255,255,0.35); }
        .stg-mob-btn-solid {
          padding: 13px; border-radius: 12px; font-size: 14px; font-weight: 700;
          background: var(--green); border: none; color: #000; font-family: var(--font-body);
          cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; transition: filter .2s;
        }
        .stg-mob-btn-solid:hover { filter: brightness(1.08); }
        .stg-mob-loc {
          margin: 12px 20px 0; position: relative; display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
          cursor: pointer; transition: border-color .2s;
        }
        .stg-mob-loc:hover { border-color: var(--border-g); }
        .stg-mob-loc-text { flex: 1; font-size: 13px; color: var(--muted); font-family: var(--font-body); }
        .stg-mob-loc-val { font-size: 13px; font-weight: 600; color: var(--text); font-family: var(--font-body); }
        .stg-mob-loc .stg-loc-pop { left: 0; right: auto; top: calc(100% + 8px); }

        @keyframes stgFadeDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes stgFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes stgSlideLeft { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes stgSlideDownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1180px) { .stg-tabs { display: none !important; } }
        @media (max-width: 900px)  { .stg-search-group { display: none !important; } }
        @media (max-width: 640px) {
          .stg-mob-icons { display: flex !important; }
          .stg-nav-r { display: none !important; }
        }
        @media (min-width: 641px) {
          .stg-mob-overlay { display: none !important; }
          .stg-mob-drawer  { display: none !important; }
          .stg-mob-search-overlay { display: none !important; }
        }
      `}</style>

      <nav className={`stg-nav ${scrolled ? "scrolled" : ""}`}>

        {/* Logo */}
        <div className="stg-logo" onClick={() => navigate("/")}>
          <img src="/logo.png" alt="StageCheck" className="stg-logo-img" />
          <span className="stg-logo-text">StageCheck</span>
        </div>

        {/* Desktop tabs */}
        <div className="stg-tabs">
          {PAGE_TABS.map((t) => (
            <button key={t.to} className={`stg-tab ${pathname === t.to ? "active" : ""}`} onClick={() => navigate(t.to)}>
              {t.label}
            </button>
          ))}
          <div ref={resRef} style={{ position: "relative" }}>
            <button className="stg-tab" onClick={() => setResOpen((v) => !v)}>
              Resources{" "}
              <RiArrowDownSLine size={13} style={{ transition: "transform .2s", transform: resOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {resOpen && (
              <div className="stg-res-pop">
                {RESOURCE_LINKS.map((r) => (
                  <button key={r.to} className="stg-res-item" onClick={() => { navigate(r.to); setResOpen(false); }}>
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop search */}
        <div className="stg-search-group">
          <div className="stg-search-combined">
            <div className="stg-search-wrap" ref={searchRef}>
              <div className="stg-search-inner">
                <RiSearchLine size={14} color="rgba(255,255,255,0.4)" />
                <input
                  placeholder="Search events, venues..."
                  value={searchValue}
                  onFocus={() => { setSearchFocused(true); loadTrending(); }}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                />
              </div>
              {searchFocused && <TrendingDropdown trending={trending} onPick={submitSearch} />}
            </div>
            <div className="stg-combined-divider" />
            <div className="stg-loc-wrap" ref={locRef}>
              <button className="stg-loc-inner" onClick={() => setLocOpen((v) => !v)}>
                <RiMapPin2Line size={14} color="var(--green)" />
                <span className="stg-loc-btn-label">{locationLabel}</span>
                <RiArrowDownSLine size={12} style={{ transition: "transform .2s", transform: locOpen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
              </button>
              {locOpen && <LocationPopup {...locationPopupProps} />}
            </div>
            <button className="stg-search-btn" onClick={() => submitSearch()}>
              <RiSearchLine size={14} />
            </button>
          </div>
        </div>

        {/* Desktop right — auth aware */}
        <div className="stg-nav-r">
          {user ? (
            <div ref={userMenuRef} style={{ position: "relative" }}>
              <button className="stg-user-pill" onClick={() => setUserMenuOpen((v) => !v)}>
                <div className="stg-user-avatar">
                  {user.photoURL ? <img src={user.photoURL} alt="" /> : avatarInitial}
                </div>
                <span className="stg-user-name">{displayName}</span>
                {/* ← More visible chevron badge */}
                <div className="stg-chevron-pill">
                  <RiArrowDownSLine size={12} color="rgba(255,255,255,0.8)"
                    style={{ transition: "transform .2s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
                </div>
              </button>
              {userMenuOpen && (
                <UserMenu
                  displayName={displayName} photoURL={user.photoURL ?? null}
                  onNavigate={(to) => { navigate(to); setUserMenuOpen(false); }}
                  onOpenManage={handleOpenManage} onLogout={handleLogout}
                />
              )}
            </div>
          ) : (
            <>
              <button className="stg-btn-ghost" onClick={() => navigate("/login")}>Log in</button>
              <button className="stg-btn-solid" onClick={() => navigate("/signup")}>
                Create Event <RiArrowRightUpLine size={12} />
              </button>
            </>
          )}
        </div>

        {/* ── Mobile icon group (tighter, with avatar if logged in) ── */}
        <div className="stg-mob-icons">
          {/* Search */}
          <button className="stg-mob-icon-btn" onClick={() => setMobileSearchOpen(true)}>
            <RiSearchLine size={18} />
          </button>

          {/* Location */}
          <div style={{ position: "relative" }} ref={mobLocRef}>
            <button className="stg-mob-icon-btn" onClick={() => setLocOpen((v) => !v)}>
              <RiMapPin2Line size={18} />
            </button>
            {locOpen && <LocationPopup {...locationPopupProps} />}
          </div>

          {/* Avatar dropdown (logged in) OR hamburger only */}
          {user ? (
            <>
              {/* Avatar with chevron badge */}
              <div className="stg-mob-avatar-btn" ref={mobUserMenuRef} onClick={() => setMobUserMenuOpen((v) => !v)}>
                <div className="stg-mob-avatar">
                  {user.photoURL ? <img src={user.photoURL} alt="" /> : avatarInitial}
                </div>
                {/* Green chevron badge */}
                <div className="stg-mob-chevron-badge">
                  <RiArrowDownSLine size={9} color="#000"
                    style={{ transition: "transform .2s", transform: mobUserMenuOpen ? "rotate(180deg)" : "none" }} />
                </div>

                {/* Mobile user dropdown */}
                {mobUserMenuOpen && (
                  <div className="stg-mob-user-drop">
                    <div className="stg-mob-drop-header">
                      <div className="stg-mob-drop-name">{user.displayName || displayName}</div>
                      <div className="stg-mob-drop-email">{user.email}</div>
                    </div>
                    <button className="stg-res-item" onClick={() => { navigate("/dashboard"); setMobUserMenuOpen(false); }}>
                      <RiDashboardLine size={14} /> Dashboard
                    </button>
                    <button className="stg-res-item" onClick={() => { navigate("/dashboard/invitations"); setMobUserMenuOpen(false); }}>
                      <RiInformationLine size={14} /> Invitations
                    </button>
                    <button className="stg-res-item" onClick={() => { window.open("/manage", "_blank", "noopener,noreferrer"); setMobUserMenuOpen(false); }}>
                      <RiCalendarEventLine size={14} /> My Events
                    </button>
                    <button className="stg-res-item" onClick={() => { navigate("/dashboard/settings"); setMobUserMenuOpen(false); }}>
                      <RiSettings4Line size={14} /> Settings
                    </button>
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    <button className="stg-res-item" style={{ color: "#F87171" }} onClick={handleLogout}>
                      <RiLogoutBoxLine size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>

              {/* Hamburger for nav links */}
              <button className="stg-mob-icon-btn" onClick={() => setMobileOpen(true)}>
                <RiMenuLine size={20} />
              </button>
            </>
          ) : (
            <button className="stg-mob-icon-btn" onClick={() => setMobileOpen(true)}>
              <RiMenuLine size={20} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="stg-mob-search-overlay">
          <div className="stg-mob-search-row" ref={mobSearchRef}>
            <div className="stg-mob-search-combined">
              <div className="stg-mob-search-icon"><RiSearchLine size={16} color="var(--green)" /></div>
              <input
                ref={mobSearchInputRef}
                placeholder="Search events..."
                value={searchValue}
                onFocus={() => { setMobSearchFocused(true); loadTrending(); }}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { submitSearch(); setMobileSearchOpen(false); }
                  if (e.key === "Escape") setMobileSearchOpen(false);
                }}
                style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 15, fontFamily: "var(--font-body)", padding: "13px 8px", caretColor: "var(--green)" }}
              />
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
              <div style={{ position: "relative", flexShrink: 0 }} ref={mobLocRef}>
                <button onClick={() => setLocOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "13px 12px", background: "none", border: "none", color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-body)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <RiMapPin2Line size={14} color="var(--green)" />
                  <span style={{ maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)", fontSize: 13 }}>{locationLabel}</span>
                </button>
                {locOpen && <LocationPopup {...locationPopupProps} />}
              </div>
            </div>
            <button className="stg-mob-search-close" onClick={() => setMobileSearchOpen(false)}>
              <RiCloseLine size={18} />
            </button>
            {mobSearchFocused && <TrendingDropdown trending={trending} onPick={(t) => { submitSearch(t); setMobileSearchOpen(false); }} />}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="stg-mob-overlay" onClick={() => setMobileOpen(false)} />
          <div className="stg-mob-drawer">
            <div className="stg-mob-head">
              <div className="stg-logo" onClick={() => { navigate("/"); setMobileOpen(false); }}>
                <img src="/logo.png" alt="StageCheck" className="stg-logo-img" />
                <span className="stg-logo-text">StageCheck</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RiCloseLine size={18} />
              </button>
            </div>

            {user && (
              <div style={{ margin: "12px 20px 0", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: "rgba(13,199,94,0.06)", border: "1px solid rgba(13,199,94,0.18)" }}>
                <div className="stg-user-avatar">
                  {user.photoURL ? <img src={user.photoURL} alt="" /> : avatarInitial}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--muted2)" }}>{user.email}</div>
                </div>
              </div>
            )}

            <div className="stg-mob-loc" onClick={() => setLocOpen((v) => !v)}>
              <RiMapPin2Line size={15} color="var(--green)" />
              <span className="stg-mob-loc-text">Location</span>
              <span className="stg-mob-loc-val">{locationLabel}</span>
              {locOpen && <LocationPopup {...locationPopupProps} />}
            </div>

            <div className="stg-mob-links">
              <div className="stg-mob-section-label">Navigate</div>
              {PAGE_TABS.map((t) => (
                <button key={t.to} className={`stg-mob-link ${pathname === t.to ? "active" : ""}`} onClick={() => { navigate(t.to); setMobileOpen(false); }}>
                  <span className="stg-mob-link-icon">{t.icon}</span>{t.label}
                </button>
              ))}

              {user && (
                <>
                  <div className="stg-mob-divider" />
                  <div className="stg-mob-section-label">Account</div>
                  <button className={`stg-mob-link ${pathname === "/dashboard" ? "active" : ""}`} onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>
                    <span className="stg-mob-link-icon"><RiDashboardLine size={16} /></span>Dashboard
                  </button>
                  <button className={`stg-mob-link ${pathname === "/dashboard/invitations" ? "active" : ""}`} onClick={() => { navigate("/dashboard/invitations"); setMobileOpen(false); }}>
                    <span className="stg-mob-link-icon"><RiInformationLine size={16} /></span>Invitations
                  </button>
                  <button className="stg-mob-link" onClick={() => { window.open("/manage", "_blank", "noopener,noreferrer"); setMobileOpen(false); }}>
                    <span className="stg-mob-link-icon"><RiCalendarEventLine size={16} /></span>My Events
                  </button>
                  <button className={`stg-mob-link ${pathname === "/dashboard/settings" ? "active" : ""}`} onClick={() => { navigate("/dashboard/settings"); setMobileOpen(false); }}>
                    <span className="stg-mob-link-icon"><RiSettings4Line size={16} /></span>Settings
                  </button>
                </>
              )}

              <div className="stg-mob-divider" />
              <div className="stg-mob-section-label">Resources</div>
              {RESOURCE_LINKS.map((r) => (
                <button key={r.to} className={`stg-mob-link ${pathname === r.to ? "active" : ""}`} onClick={() => { navigate(r.to); setMobileOpen(false); }}>
                  <span className="stg-mob-link-icon">{r.icon}</span>{r.label}
                </button>
              ))}
            </div>

            <div className="stg-mob-footer">
              {user ? (
                <button className="stg-mob-btn-solid" style={{ background: "transparent", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171" }} onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  Log out
                </button>
              ) : (
                <>
                  <button className="stg-mob-btn-ghost" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Log in</button>
                  <button className="stg-mob-btn-solid" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>
                    Create Event <RiArrowRightUpLine size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}