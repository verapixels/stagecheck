import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

type ConsentState = {
  essential: true
  analytics: boolean
}

const STORAGE_KEY = 'stagecheck_cookie_consent'

export default function CookieBanner() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState(true)
  const [dismissing, setDismissing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const isAdminRoute = pathname.startsWith('/superadmin') || pathname.startsWith('/dashboard')
  
  useEffect(() => {
  if (isAdminRoute) return
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }
  try {
    const { timestamp } = JSON.parse(saved)
    const hours24 = 24 * 60 * 60 * 1000
    if (Date.now() - timestamp > hours24) {
      localStorage.removeItem(STORAGE_KEY)
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}, [isAdminRoute])
  if (isAdminRoute) return null

  const spawnSparkles = (originEl?: HTMLElement) => {
    const colors = ['#22C55E', '#86efac', '#60a5fa', '#f59e0b', '#fff', '#a78bfa']
    const rect = originEl
      ? originEl.getBoundingClientRect()
      : cardRef.current?.getBoundingClientRect()
    if (!rect) return
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        const s = document.createElement('div')
        s.style.cssText = `
          position:fixed;
          width:8px;height:8px;border-radius:50%;
          pointer-events:none;z-index:99999;
          left:${rect.left + Math.random() * rect.width}px;
          top:${rect.top + Math.random() * rect.height}px;
          background:${colors[i % colors.length]};
          box-shadow:0 0 10px ${colors[i % colors.length]};
          animation:sc-sparkle 0.8s ease forwards;
        `
        document.body.appendChild(s)
        setTimeout(() => s.remove(), 900)
      }, i * 40)
    }
  }

  const dismiss = (consent: ConsentState) => {
    spawnSparkles()
    setDismissing(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...consent, timestamp: Date.now() }))
    setTimeout(() => {
      setVisible(false)
      setDismissing(false)
    }, 520)
  }

  const acceptAll = () => dismiss({ essential: true, analytics: true })
  const rejectAll = () => dismiss({ essential: true, analytics: false })
  const acceptSelected = () => dismiss({ essential: true, analytics: analyticsOn })

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes sc-floatIn {
          from { opacity:0; transform:perspective(900px) rotateX(16deg) translateY(60px) scale(0.92); }
          to   { opacity:1; transform:perspective(900px) rotateX(0deg)  translateY(0)     scale(1);    }
        }
        @keyframes sc-crumble {
          0%   { opacity:1; transform:perspective(900px) rotateX(0deg)  scale(1)    rotate(0deg);   }
          100% { opacity:0; transform:perspective(900px) rotateX(-30deg) scale(0.7) rotate(-6deg) translateY(40px); }
        }
        @keyframes sc-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes sc-glow {
          0%,100% { box-shadow: 0 0 22px rgba(34,197,94,0.12), 0 32px 80px rgba(0,0,0,0.55); }
          50%      { box-shadow: 0 0 44px rgba(34,197,94,0.28), 0 32px 80px rgba(0,0,0,0.55); }
        }
        @keyframes sc-orbit1 {
          from { transform:rotate(0deg)   translateX(38px) rotate(0deg);    }
          to   { transform:rotate(360deg) translateX(38px) rotate(-360deg); }
        }
        @keyframes sc-orbit2 {
          from { transform:rotate(120deg) translateX(30px) rotate(-120deg); }
          to   { transform:rotate(480deg) translateX(30px) rotate(-480deg); }
        }
        @keyframes sc-orbit3 {
          from { transform:rotate(240deg) translateX(44px) rotate(-240deg); }
          to   { transform:rotate(600deg) translateX(44px) rotate(-600deg); }
        }
        @keyframes sc-bob {
          0%,100% { transform:translateY(0px)  rotate(-3deg); }
          50%      { transform:translateY(-7px) rotate(3deg);  }
        }
        @keyframes sc-sparkle {
          0%   { transform:scale(0) rotate(0deg);   opacity:0; }
          50%  { transform:scale(1) rotate(180deg); opacity:1; }
          100% { transform:scale(0) rotate(360deg); opacity:0; }
        }
        @keyframes sc-slideDown {
          from { opacity:0; transform:translateY(-8px) scaleY(0.92); }
          to   { opacity:1; transform:translateY(0)    scaleY(1);    }
        }

        .sc-card {
          animation: sc-floatIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards,
                     sc-glow 3s ease-in-out 1.2s infinite;
        }
        .sc-card.sc-out { animation: sc-crumble 0.5s cubic-bezier(0.4,0,1,1) forwards !important; }

        .sc-shimmer-bar {
          height: 3px;
          background: linear-gradient(90deg, #16a34a, #22C55E, #86efac, #22C55E, #16a34a);
          background-size: 200% 100%;
          animation: sc-shimmer 2.5s linear infinite;
        }

        .sc-cookie {
          width:54px;height:54px;border-radius:50%;flex-shrink:0;
          background: linear-gradient(135deg,#92400e,#b45309,#d97706);
          display:flex;align-items:center;justify-content:center;font-size:27px;
          box-shadow:0 4px 20px rgba(217,119,6,0.45),inset 0 -3px 6px rgba(0,0,0,0.3),inset 0 2px 4px rgba(255,255,255,0.15);
          animation: sc-bob 3.2s ease-in-out infinite;
          position:relative;z-index:2;
        }

        .sc-orbit { position:absolute;inset:0;animation-timing-function:linear;animation-iteration-count:infinite; }
        .sc-dot   { width:9px;height:9px;border-radius:50%;position:absolute;top:50%;left:50%;margin:-4.5px 0 0 -4.5px; }
        .sc-o1    { animation:sc-orbit1 3s   linear infinite; }
        .sc-o2    { animation:sc-orbit2 4.6s linear infinite; }
        .sc-o3    { animation:sc-orbit3 6.2s linear infinite; }

        .sc-toggle {
          width:46px;height:25px;border-radius:13px;border:none;cursor:pointer;position:relative;
          transition:background 0.3s cubic-bezier(0.4,0,0.2,1);flex-shrink:0;
        }
        .sc-thumb {
          position:absolute;top:3.5px;width:18px;height:18px;border-radius:50%;background:#fff;
          transition:left 0.3s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 5px rgba(0,0,0,0.4);
        }

        .sc-btn-accept {
          flex:1;padding:11px 16px;border:none;border-radius:13px;cursor:pointer;font-size:13.5px;font-weight:700;
          background:linear-gradient(135deg,#22C55E,#16a34a);color:#052e16;
          box-shadow:0 4px 20px rgba(34,197,94,0.35);position:relative;overflow:hidden;
          transition:transform 0.15s,box-shadow 0.15s;
        }
        .sc-btn-accept::after {
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent);pointer-events:none;
        }
        .sc-btn-accept:hover { transform:translateY(-2px) scale(1.02); box-shadow:0 8px 30px rgba(34,197,94,0.48); }
        .sc-btn-accept:active { transform:scale(0.97); }

        .sc-btn-ghost {
          flex:1;padding:11px 16px;border-radius:13px;cursor:pointer;font-size:13.5px;font-weight:500;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);
          transition:all 0.2s;
        }
        .sc-btn-ghost:hover { background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2); }

        .sc-btn-save {
          flex:1;padding:11px 16px;border-radius:13px;cursor:pointer;font-size:13.5px;font-weight:500;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);color:#fff;
          transition:all 0.2s;
        }
        .sc-btn-save:hover { background:rgba(255,255,255,0.13); }

        .sc-btn-manage {
          padding:11px 13px;border-radius:13px;cursor:pointer;font-size:13px;
          background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);
          display:flex;align-items:center;gap:5px;transition:all 0.2s;white-space:nowrap;
        }
        .sc-btn-manage:hover { border-color:rgba(255,255,255,0.25);color:rgba(255,255,255,0.85); }

        .sc-prefs {
          background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:14px 16px;margin-bottom:18px;
          animation:sc-slideDown 0.3s cubic-bezier(0.22,1,0.36,1);transform-origin:top;
        }
        .sc-pref-row {
          display:flex;align-items:center;justify-content:space-between;padding:10px 0;
        }
        .sc-pref-row + .sc-pref-row { border-top:1px solid rgba(255,255,255,0.05); }
      `}</style>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9997,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: dismissing ? 0 : 1,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className={`sc-card${dismissing ? ' sc-out' : ''}`}
        style={{
          position: 'fixed',
          bottom: 'clamp(1.2rem, 3vw, 2rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          width: 'min(490px, calc(100vw - 2rem))',
          background: 'linear-gradient(160deg, rgba(15,24,42,0.98) 0%, rgba(10,16,30,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          overflow: 'hidden',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top shimmer bar */}
        <div className="sc-shimmer-bar" />

        <div style={{ padding: '26px 26px 22px', position: 'relative' }}>

          {/* Glassy inner reflection */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, transparent 50%, rgba(34,197,94,0.02) 100%)',
            borderRadius: 24,
          }} />

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20, position: 'relative' }}>
            {/* Orbit system */}
            <div style={{ width: 88, height: 88, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="sc-orbit sc-o1"><div className="sc-dot" style={{ background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} /></div>
              <div className="sc-orbit sc-o2"><div className="sc-dot" style={{ background: '#60a5fa', boxShadow: '0 0 8px #60a5fa', width: 7, height: 7, margin: '-3.5px 0 0 -3.5px' }} /></div>
              <div className="sc-orbit sc-o3"><div className="sc-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b', width: 7, height: 7, margin: '-3.5px 0 0 -3.5px' }} /></div>
              <div className="sc-cookie">🍪</div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                We baked some cookies
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
                StageCheck uses cookies to keep things running and understand how the platform is used. We never sell your data.{' '}
                <Link to="/privacy" style={{ color: 'rgba(34,197,94,0.7)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#22C55E')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(34,197,94,0.7)')}>
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>

          {/* Preferences panel */}
          {expanded && (
            <div className="sc-prefs">
              {/* Essential */}
              <div className="sc-pref-row">
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Essential cookies</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>Login, auth, and core functionality</p>
                </div>
                <div style={{
                  fontSize: 11, color: 'rgba(34,197,94,0.9)', background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 10px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Always on
                </div>
              </div>

              {/* Analytics */}
              <div className="sc-pref-row">
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Analytics cookies</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>Helps us improve the platform</p>
                </div>
                <button
                  className="sc-toggle"
                  aria-pressed={analyticsOn}
                  aria-label="Toggle analytics cookies"
                  onClick={() => setAnalyticsOn(v => !v)}
                  style={{ background: analyticsOn ? '#22C55E' : 'rgba(255,255,255,0.12)' }}
                >
                  <div className="sc-thumb" style={{ left: analyticsOn ? 24 : 3 }} />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="sc-btn-accept" onClick={acceptAll}>Accept all</button>
            {expanded ? (
              <button className="sc-btn-save" onClick={acceptSelected}>Save preferences</button>
            ) : (
              <button className="sc-btn-ghost" onClick={rejectAll}>Reject all</button>
            )}
            <button
              className="sc-btn-manage"
              onClick={() => setExpanded(v => !v)}
            >
              <span style={{ display: 'inline-block', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: 13 }}>▾</span>
              Manage
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 14, marginBottom: 0, fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
            Your choices are saved locally and respected everywhere on StageCheck.
          </p>
        </div>
      </div>
    </>
  )
}

export function useCookieConsent() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { essential: true, analytics: false, decided: false }
  try {
    const parsed = JSON.parse(raw)
    return { essential: true, analytics: parsed.analytics ?? false, decided: true }
  } catch {
    return { essential: true, analytics: false, decided: false }
  }
}