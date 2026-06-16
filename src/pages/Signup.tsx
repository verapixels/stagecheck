import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, ArrowRight, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../context/Authcontext'

// ─── Animated 3D Left Panel ───────────────────────────────────────────────────
function LeftPanel() {
  const features = [
    { icon: '🎭', label: 'Song Clash Detection', desc: 'AI catches duplicate songs before they ruin your event' },
    { icon: '🎟️', label: 'Instant Ticketing', desc: 'Sell & scan tickets with zero friction' },
    { icon: '🏆', label: 'Live Judging & Scores', desc: 'Real-time leaderboards your crowd will love' },
    { icon: '📊', label: 'Event Analytics', desc: 'Deep insights after every performance' },
  ]

  const stats = [
    { n: '18K+', l: 'Events' },
    { n: '120K+', l: 'Performers' },
    { n: '2M+', l: 'Tickets' },
  ]

  // Screenshot sections to use as "photos" — floating cards
  // SCREENSHOT INSTRUCTIONS (tell the user):
  // Card 1 → screenshot your Events grid section (3 event cards visible)
  // Card 2 → screenshot the Live Control / Stage page
  // Card 3 → screenshot the Clash Detection dashboard
  // For now we use animated CSS-only placeholders

  return (
    <div className="lp-root">
      {/* Animated mesh background */}
      <div className="lp-bg" />
      <div className="lp-noise" />

      {/* Orbiting glow blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Grid lines */}
      <div className="lp-grid" />

      {/* Content */}
      <div className="lp-content">

        {/* Logo */}
        <div className="lp-logo">
          <img src="/Stagechecklogo.png" alt="StageCheck" style={{ height: 36, objectFit: 'contain' }} />
        </div>

        {/* Hero headline */}
        <div className="lp-headline">
          <div className="lp-badge">
            <span className="pulse-dot" /> TRUSTED BY EVENT ORGANIZERS
          </div>
          <h2 className="lp-h2">
            Your events.<br />
            <span className="lp-accent">Flawlessly run.</span>
          </h2>
          <p className="lp-sub">
            Join thousands of organizers who use StageCheck to plan, manage and run unforgettable events — from choir concerts to major competitions.
          </p>
        </div>

        {/* Stats row */}
        <div className="lp-stats">
          {stats.map(s => (
            <div key={s.l} className="lp-stat">
              <span className="lp-stat-n">{s.n}</span>
              <span className="lp-stat-l">{s.l}</span>
            </div>
          ))}
        </div>

        {/* 3D floating feature cards */}
        <div className="lp-cards">
          {features.map((f, i) => (
            <div
              key={f.label}
              className="lp-feat-card"
              style={{ animationDelay: `${i * 0.18}s`, '--ci': i } as React.CSSProperties}
            >
              <span className="lp-feat-icon">{f.icon}</span>
              <div>
                <div className="lp-feat-label">{f.label}</div>
                <div className="lp-feat-desc">{f.desc}</div>
              </div>
              <span className="lp-feat-check"><Check size={13} /></span>
            </div>
          ))}
        </div>

        {/* Screenshot mockup window (you'll replace the src with real screenshots) */}
        {/*
          📸 SCREENSHOT INSTRUCTIONS:
          Take these 3 screenshots of your live site and save them in /public/:
          1. /public/sc-events.png    → Scroll to your Events grid, screenshot the 3 cards
          2. /public/sc-stage.png     → Screenshot the Live Control page from /dashboard/event/.../live
          3. /public/sc-clashes.png   → Screenshot the Clash Detection page

          Then swap the CSS background below to use them as the mockup content.
          The floating window below auto-cycles through them.
        */}
        <MockupWindow />

        {/* Bottom trust line */}
        <div className="lp-trust">
          <span className="lp-lock">🔒</span>
          <span>Free to start · No credit card required · Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}

// Cycling mockup window that simulates a "video" with CSS animation
function MockupWindow() {
  const slides = [
    {
      // Events grid slide — CSS-only representation
      // Replace bg with: url('/public/sc-events.png') center/cover no-repeat
      label: 'EVENTS DASHBOARD',
      bg: 'linear-gradient(135deg,#0a1628 0%,#1a2f4a 100%)',
      content: (
        <div className="mock-events">
          {['Talent Show · Jun 16', 'Open Mic · Aug 12', 'AMVCA · Sep 15'].map((e, i) => (
            <div key={i} className="mock-ev-row" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="mock-ev-dot" style={{ background: ['#0dc75e','#f59e0b','#3b82f6'][i] }} />
              <span>{e}</span>
              <span className="mock-ev-badge">Live</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'CLASH DETECTION',
      bg: 'linear-gradient(135deg,#0f0a1e 0%,#2d1b4e 100%)',
      content: (
        <div className="mock-clash">
          <div className="mock-clash-row ok"><span>✓</span> "Amazing Grace" — Clear</div>
          <div className="mock-clash-row warn"><span>⚠</span> "Hallelujah" — 2 performers</div>
          <div className="mock-clash-row ok"><span>✓</span> "Oceans" — Clear</div>
          <div className="mock-clash-bar">
            <div className="mock-clash-fill" />
          </div>
          <div className="mock-clash-label">3 / 12 songs checked</div>
        </div>
      ),
    },
    {
      label: 'LIVE STAGE CONTROL',
      bg: 'linear-gradient(135deg,#0a1e10 0%,#0d3320 100%)',
      content: (
        <div className="mock-live">
          <div className="mock-live-badge">● LIVE NOW</div>
          <div className="mock-live-name">Performer #4 — Adaeze O.</div>
          <div className="mock-live-timer">02:34</div>
          <div className="mock-live-score">Score: <strong>87.5</strong></div>
          <div className="mock-live-bar">
            <div className="mock-live-fill" />
          </div>
        </div>
      ),
    },
  ]

  const [active, setActive] = useState(0)

  // Auto-cycle
  useState(() => {
    const t = setInterval(() => setActive(a => (a + 1) % slides.length), 3500)
    return () => clearInterval(t)
  })

  const s = slides[active]

  return (
    <div className="mockup-win">
      {/* Window chrome */}
      <div className="mock-chrome">
        <div className="mock-dots">
          <span style={{ background: '#f87171' }} />
          <span style={{ background: '#fbbf24' }} />
          <span style={{ background: '#22c55e' }} />
        </div>
        <div className="mock-url">app.stagecheck.io</div>
      </div>

      {/* Screen */}
      <div className="mock-screen" style={{ background: s.bg }}>
        <div className="mock-tab-bar">
          <span className="mock-tab active">{s.label}</span>
        </div>
        <div className="mock-body">{s.content}</div>
      </div>

      {/* Slide dots */}
      <div className="mock-nav">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`mock-nav-dot ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Right panel — form ────────────────────────────────────────────────────────
function InputField({
  label, type = 'text', placeholder, icon, value, onChange, error,
}: {
  label: string; type?: string; placeholder: string; icon: React.ReactNode;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string
}) {
  const [focused, setFocused] = useState(false)
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="inp-wrap">
      <label className="inp-label">{label}</label>
      <div className={`inp-box ${focused ? 'focused' : ''} ${error ? 'errored' : ''}`}>
        <span className="inp-icon">{icon}</span>
        <input
          type={type === 'password' && showPw ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="inp-el"
          autoComplete={type === 'password' ? 'new-password' : undefined}
        />
        {type === 'password' && (
          <button
            type="button"
            className="inp-eye"
            onClick={() => setShowPw(v => !v)}
            tabIndex={-1}
          >
            {showPw ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <span className="inp-err"><AlertCircle size={11} />{error}</span>}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName)
    setLoading(false)
    if (error) {
      const code = (error as any)?.code || ''
      if (code === 'auth/email-already-in-use') setServerError('An account with this email already exists.')
      else if (code === 'auth/weak-password') setServerError('Password is too weak.')
      else if (code === 'auth/network-request-failed') setServerError('Network error. Check your connection.')
      else setServerError('Something went wrong. Please try again.')
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setServerError('')
    await signInWithGoogle()
    setGoogleLoading(false)
  }

  const pwStrength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength]
  const strengthColor = ['', '#f87171', '#fbbf24', '#60a5fa', '#0dc75e'][pwStrength]

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        :root {
          --green: #0dc75e; --bg: #000c1a; --card: #060f20;
          --border: rgba(255,255,255,0.07); --border-g: rgba(13,199,94,0.25);
          --text: #f0faf4; --muted: rgba(255,255,255,0.55);
          --font-d: 'Syne', sans-serif; --font-b: 'DM Sans', sans-serif;
        }

        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes float1    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.08)} }
        @keyframes float2    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,35px) scale(1.05)} }
        @keyframes float3    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,20px) scale(0.95)} }
        @keyframes cardSlide { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:none} }
        @keyframes gridMove  { from{transform:translateY(0)} to{transform:translateY(40px)} }
        @keyframes mockFade  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:none} }
        @keyframes clashFill { from{width:0} to{width:25%} }
        @keyframes liveFill  { from{width:0} to{width:72%} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes rotateZ   { from{transform:rotateY(0deg)} to{transform:rotateY(360deg)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        /* ── LAYOUT ── */
        .su-page {
          min-height: 100vh; display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          font-family: var(--font-b);
        }
        @media (max-width: 900px) {
          .su-page { grid-template-columns: 1fr; }
          .lp-root  { display: none; }
        }

        /* ═══ LEFT PANEL ═══ */
        .lp-root {
          position: relative; overflow: hidden;
          background: #000d1f;
          display: flex; align-items: stretch;
        }
        .lp-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 20% 30%, rgba(13,199,94,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 80% at 80% 70%, rgba(59,130,246,0.08) 0%, transparent 60%);
        }
        .lp-noise {
          position: absolute; inset: 0; opacity: .025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
        .lp-grid {
          position: absolute; inset: 0; opacity: .04;
          background-image: linear-gradient(rgba(13,199,94,.6) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(13,199,94,.6) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridMove 8s linear infinite alternate;
        }
        .blob {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
        }
        .blob-1 {
          width: 340px; height: 340px; top: -80px; left: -60px;
          background: rgba(13,199,94,0.13);
          animation: float1 9s ease-in-out infinite;
        }
        .blob-2 {
          width: 260px; height: 260px; bottom: 10%; right: -40px;
          background: rgba(59,130,246,0.1);
          animation: float2 11s ease-in-out infinite;
        }
        .blob-3 {
          width: 200px; height: 200px; top: 50%; left: 40%;
          background: rgba(139,92,246,0.08);
          animation: float3 7s ease-in-out infinite;
        }

        .lp-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; gap: 24px;
          padding: 40px 44px; width: 100%; overflow-y: auto;
        }

        .lp-logo { flex-shrink: 0; }

        .lp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(13,199,94,0.08); border: 1px solid rgba(13,199,94,0.2);
          border-radius: 20px; padding: 4px 14px;
          font-size: 10px; font-weight: 700; letter-spacing: .1em; color: var(--green);
          margin-bottom: 14px;
        }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green); display: inline-block;
          animation: pulse 1.4s infinite;
        }
        .lp-h2 {
          font-family: var(--font-d); font-size: clamp(26px,2.8vw,38px);
          font-weight: 800; line-height: 1.1; color: var(--text);
        }
        .lp-accent { color: var(--green); }
        .lp-sub { font-size: 13.5px; color: var(--muted); line-height: 1.7; margin-top: 10px; max-width: 380px; }

        /* Stats */
        .lp-stats {
          display: flex; gap: 24px; flex-wrap: wrap;
          padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
        }
        .lp-stat { display: flex; flex-direction: column; }
        .lp-stat-n { font-family: var(--font-d); font-size: 22px; font-weight: 800; color: var(--text); }
        .lp-stat-l { font-size: 11px; color: var(--muted); }

        /* Feature cards */
        .lp-cards { display: flex; flex-direction: column; gap: 10px; }
        .lp-feat-card {
          display: flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 13px; padding: 13px 16px;
          animation: cardSlide .5s cubic-bezier(.16,1,.3,1) both;
          transition: border-color .25s, transform .25s, background .25s;
          position: relative; overflow: hidden;
        }
        .lp-feat-card::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
          background: var(--green); opacity: 0; transition: opacity .25s;
        }
        .lp-feat-card:hover { border-color: rgba(13,199,94,0.2); transform: translateX(4px); background: rgba(13,199,94,0.04); }
        .lp-feat-card:hover::before { opacity: 1; }
        .lp-feat-icon { font-size: 22px; flex-shrink: 0; }
        .lp-feat-label { font-size: 13px; font-weight: 700; color: var(--text); }
        .lp-feat-desc { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
        .lp-feat-check {
          margin-left: auto; width: 22px; height: 22px; border-radius: 50%;
          background: rgba(13,199,94,.12); border: 1px solid rgba(13,199,94,.25);
          display: flex; align-items: center; justify-content: center; color: var(--green);
          flex-shrink: 0;
        }

        /* Mockup window */
        .mockup-win {
          border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 24px 64px rgba(0,0,0,.7), 0 0 0 1px rgba(13,199,94,.08);
          background: #060f20;
          flex-shrink: 0;
        }
        .mock-chrome {
          display: flex; align-items: center; gap: 10px;
          background: #0a1628; padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .mock-dots { display: flex; gap: 6px; }
        .mock-dots span { width: 10px; height: 10px; border-radius: 50%; display: block; }
        .mock-url {
          flex: 1; text-align: center; font-size: 11px;
          color: rgba(255,255,255,0.3); font-family: monospace;
        }
        .mock-screen { padding: 12px; min-height: 140px; animation: mockFade .45s ease both; }
        .mock-tab-bar { margin-bottom: 10px; }
        .mock-tab {
          font-size: 9px; font-weight: 700; letter-spacing: .08em;
          color: var(--green); background: rgba(13,199,94,.1);
          border: 1px solid rgba(13,199,94,.2); border-radius: 5px; padding: 3px 9px;
        }
        .mock-body { font-size: 12px; }

        /* Mock events */
        .mock-events { display: flex; flex-direction: column; gap: 8px; }
        .mock-ev-row {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,.04); border-radius: 7px; padding: 8px 10px;
          color: rgba(255,255,255,.75); animation: fadeUp .35s ease both;
        }
        .mock-ev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .mock-ev-badge {
          margin-left: auto; font-size: 9px; font-weight: 700;
          color: var(--green); background: rgba(13,199,94,.1);
          border-radius: 4px; padding: 2px 6px;
        }

        /* Mock clash */
        .mock-clash { display: flex; flex-direction: column; gap: 7px; }
        .mock-clash-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; padding: 7px 10px; border-radius: 7px; }
        .mock-clash-row.ok   { color: #0dc75e; background: rgba(13,199,94,.07); }
        .mock-clash-row.warn { color: #fbbf24; background: rgba(251,191,36,.07); }
        .mock-clash-bar { height: 4px; background: rgba(255,255,255,.08); border-radius: 4px; margin-top: 4px; }
        .mock-clash-fill { height: 100%; width: 25%; background: var(--green); border-radius: 4px; animation: clashFill 1.5s ease; }
        .mock-clash-label { font-size: 10px; color: var(--muted); }

        /* Mock live */
        .mock-live { display: flex; flex-direction: column; gap: 6px; padding: 4px 2px; }
        .mock-live-badge { font-size: 10px; font-weight: 800; color: #f87171; letter-spacing: .08em; animation: blink 1.2s infinite; }
        .mock-live-name { font-size: 13px; font-weight: 700; color: var(--text); }
        .mock-live-timer { font-family: monospace; font-size: 28px; font-weight: 800; color: var(--green); }
        .mock-live-score { font-size: 12px; color: var(--muted); }
        .mock-live-bar { height: 4px; background: rgba(255,255,255,.08); border-radius: 4px; }
        .mock-live-fill { height: 100%; width: 72%; background: var(--green); border-radius: 4px; animation: liveFill 1.8s ease; }

        .mock-nav { display: flex; justify-content: center; gap: 6px; padding: 10px; background: #0a1628; }
        .mock-nav-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,.2); border: none; cursor: pointer; transition: all .2s;
        }
        .mock-nav-dot.active { background: var(--green); width: 18px; border-radius: 4px; }

        .lp-trust {
          display: flex; align-items: center; gap: 8px;
          font-size: 11.5px; color: rgba(255,255,255,.35);
        }
        .lp-lock { font-size: 13px; }

        /* ═══ RIGHT PANEL ═══ */
        .rp-root {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: clamp(24px,5vh,64px) clamp(20px,5vw,64px);
          background: var(--bg); min-height: 100vh; overflow-y: auto;
        }
        .rp-inner { width: 100%; max-width: 440px; }

        /* Mobile logo (hidden on desktop since left panel has it) */
        .rp-mob-logo {
          display: none; justify-content: center; margin-bottom: 28px;
        }
        @media (max-width: 900px) { .rp-mob-logo { display: flex; } }

        .rp-head { margin-bottom: 28px; }
        .rp-title {
          font-family: var(--font-d); font-size: clamp(22px,3vw,30px);
          font-weight: 800; color: var(--text); margin-bottom: 6px;
        }
        .rp-sub { font-size: 14px; color: var(--muted); }

        /* Google btn */
        .g-btn {
          width: 100%; padding: 13px; border-radius: 11px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text); cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: var(--font-b); display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all .2s; position: relative; overflow: hidden;
        }
        .g-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent);
          transform: translateX(-100%); transition: transform .5s;
        }
        .g-btn:hover::before { transform: translateX(100%); }
        .g-btn:hover { border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.08); }
        .g-btn:disabled { opacity: .6; cursor: not-allowed; }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px; margin: 20px 0;
        }
        .div-line { flex: 1; height: 1px; background: var(--border); }
        .div-text { font-size: 12px; color: rgba(255,255,255,.25); }

        /* Server error */
        .srv-err {
          background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;
          display: flex; align-items: flex-start; gap: 10;
        }
        .srv-err-txt { font-size: 13px; color: #f87171; font-family: var(--font-b); }

        /* Input */
        .inp-wrap { display: flex; flex-direction: column; gap: 5px; }
        .inp-label { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.6); }
        .inp-box {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          border-radius: 10px; padding: 0 14px; height: 48px;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .inp-box.focused {
          border-color: var(--border-g);
          box-shadow: 0 0 0 3px rgba(13,199,94,.08);
          background: rgba(13,199,94,.03);
        }
        .inp-box.errored { border-color: rgba(239,68,68,.4); }
        .inp-icon { color: rgba(255,255,255,.3); flex-shrink: 0; display: flex; align-items: center; }
        .inp-el {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 14px; font-family: var(--font-b);
        }
        .inp-el::placeholder { color: rgba(255,255,255,.25); }
        .inp-eye { background: none; border: none; cursor: pointer; font-size: 14px; color: rgba(255,255,255,.3); padding: 0 2px; }
        .inp-err {
          display: flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: #f87171;
        }

        /* Password strength */
        .pw-strength { display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
        .pw-bars { display: flex; gap: 4px; }
        .pw-bar { flex: 1; height: 3px; border-radius: 3px; background: rgba(255,255,255,.08); transition: background .3s; }
        .pw-lbl { font-size: 11px; }

        /* Form */
        .su-form { display: flex; flex-direction: column; gap: 14px; }

        /* Submit btn */
        .sub-btn {
          width: 100%; padding: 14px; border-radius: 11px;
          background: var(--green); border: none; color: #000; cursor: pointer;
          font-size: 15px; font-weight: 700; font-family: var(--font-b);
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all .2s; margin-top: 6px; position: relative; overflow: hidden;
          box-shadow: 0 0 24px rgba(13,199,94,.3);
        }
        .sub-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
          transform: translateX(-100%); transition: transform .5s;
        }
        .sub-btn:hover::after { transform: translateX(100%); }
        .sub-btn:hover { background: #1fe070; box-shadow: 0 0 36px rgba(13,199,94,.5); transform: translateY(-1px); }
        .sub-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        .rp-foot { text-align: center; margin-top: 22px; font-size: 13px; color: rgba(255,255,255,.3); }
        .rp-foot a { color: var(--green); text-decoration: none; font-weight: 600; }
        .rp-foot a:hover { text-decoration: underline; }
        .rp-legal { text-align: center; margin-top: 14px; font-size: 11px; color: rgba(255,255,255,.18); line-height: 1.7; }
        .rp-legal a { color: rgba(255,255,255,.35); text-decoration: underline; }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px; border: 2px solid rgba(0,0,0,.25);
          border-top-color: #000; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
      `}</style>

      <div className="su-page">
        {/* ── LEFT ── */}
        <LeftPanel />

        {/* ── RIGHT ── */}
        <div className="rp-root">
          <div className="rp-inner">

            {/* Mobile logo */}
            <div className="rp-mob-logo">
              <img src="/Stagechecklogo.png" alt="StageCheck" style={{ height: 32, objectFit: 'contain' }} />
            </div>

            <div className="rp-head">
              <h1 className="rp-title">Create your account</h1>
              <p className="rp-sub">Free to start — no credit card required.</p>
            </div>

            {/* Google */}
            <button className="g-btn" onClick={handleGoogle} disabled={googleLoading}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              {googleLoading ? <><span className="spinner" /> Redirecting...</> : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="div-line" /><span className="div-text">or with email</span><div className="div-line" />
            </div>

            {/* Server error */}
            {serverError && (
              <div className="srv-err" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span className="srv-err-txt">{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="su-form" noValidate>
              <InputField label="Full name" placeholder="e.g. Emeka Okonkwo" icon={<User size={15} />}
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />

              <InputField label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={15} />}
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} />

              <div>
                <InputField label="Password" type="password" placeholder="Min. 8 characters" icon={<Lock size={15} />}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} />
                {form.password && (
                  <div className="pw-strength">
                    <div className="pw-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="pw-bar" style={{ background: i <= pwStrength ? strengthColor : undefined }} />
                      ))}
                    </div>
                    <span className="pw-lbl" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <InputField label="Confirm password" type="password" placeholder="Repeat your password" icon={<Lock size={15} />}
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />

              <button type="submit" className="sub-btn" disabled={loading}>
                {loading ? <><span className="spinner" style={{ borderColor: 'rgba(0,0,0,.25)', borderTopColor: '#000' }} /> Creating account...</> : <><ArrowRight size={16} /> Create Account</>}
              </button>
            </form>

            <p className="rp-foot">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
            <p className="rp-legal">
              By signing up you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}