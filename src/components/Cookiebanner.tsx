import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

type ConsentState = {
  essential: true
  analytics: boolean
  accepted: boolean
}

const STORAGE_KEY = 'stagecheck_cookie_consent'
const REJECT_TTL  = 24 * 60 * 60 * 1000
const ACCEPT_TTL  = 365 * 24 * 60 * 60 * 1000

// Module-level flag — survives StrictMode remounts within the same session
let _bannerShown = false

function needsConsent(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return true
  try {
    const saved: ConsentState & { timestamp: number } = JSON.parse(raw)
    const age = Date.now() - (saved.timestamp ?? 0)
    const ttl = saved.accepted ? ACCEPT_TTL : REJECT_TTL
    if (age > ttl) {
      localStorage.removeItem(STORAGE_KEY)
      return true
    }
    return false
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return true
  }
}

export default function CookieBanner() {
  const { pathname } = useLocation()
  const [visible, setVisible]         = useState(false)
  const [expanded, setExpanded]       = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState(true)
  const [leaving, setLeaving]         = useState(false)

  const isAdminRoute =
    pathname.startsWith('/superadmin') || pathname.startsWith('/dashboard')

  useEffect(() => {
    if (isAdminRoute) return
    if (_bannerShown) return      // StrictMode double-mount guard
    if (!needsConsent()) return   // valid consent in storage

    _bannerShown = true
    setVisible(true)
  }, [isAdminRoute])

  if (isAdminRoute) return null

  const dismiss = (consent: ConsentState) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...consent, timestamp: Date.now() })
    )
    _bannerShown = false  // reset so next session can re-check naturally
    setLeaving(true)
    setTimeout(() => setVisible(false), 300)
  }

  const acceptAll      = () => dismiss({ essential: true, analytics: true,        accepted: true  })
  const rejectAll      = () => dismiss({ essential: true, analytics: false,       accepted: false })
  const acceptSelected = () => dismiss({ essential: true, analytics: analyticsOn, accepted: analyticsOn })

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes cb-slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes cb-slideDown {
          from { opacity: 1; transform: translateY(0);    }
          to   { opacity: 0; transform: translateY(100%); }
        }
        @keyframes cb-expandIn {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 200px; }
        }
        .cb-banner {
          animation: cb-slideUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .cb-banner.cb-out {
          animation: cb-slideDown 0.28s ease-in forwards !important;
        }
        .cb-expand {
          overflow: hidden;
          animation: cb-expandIn 0.28s ease forwards;
        }
        .cb-btn-accept {
          background: #0dc75e;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
        }
        .cb-btn-accept:hover  { background: #0fb356; transform: translateY(-1px); }
        .cb-btn-accept:active { transform: translateY(0); }
        .cb-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          font-family: inherit;
        }
        .cb-btn-ghost:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .cb-btn-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 12px;
          cursor: pointer;
          padding: 4px 0;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s;
          font-family: inherit;
          white-space: nowrap;
        }
        .cb-btn-link:hover { color: rgba(255,255,255,0.75); }
        .cb-toggle {
          width: 40px; height: 22px;
          border-radius: 11px; border: none;
          cursor: pointer; position: relative;
          flex-shrink: 0;
          transition: background 0.25s;
        }
        .cb-thumb {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff;
          transition: left 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.35);
        }
      `}</style>

      <div
        className={`cb-banner${leaving ? ' cb-out' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9999,
          background: '#0d1220',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Green accent line */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, #0dc75e 0%, rgba(13,199,94,0.3) 60%, transparent 100%)',
        }} />

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px clamp(16px,4%,48px)',
        }}>

          {/* Expanded preferences panel */}
          {expanded && (
            <div className="cb-expand" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 14,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Essential cookies</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Login, auth, and core functionality</div>
                </div>
                <div style={{
                  fontSize: 11, color: '#0dc75e',
                  background: 'rgba(13,199,94,0.1)',
                  border: '1px solid rgba(13,199,94,0.2)',
                  borderRadius: 20, padding: '3px 10px',
                }}>Always on</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Analytics cookies</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Helps us improve the platform</div>
                </div>
                <button
                  className="cb-toggle"
                  aria-pressed={analyticsOn}
                  onClick={() => setAnalyticsOn(v => !v)}
                  style={{ background: analyticsOn ? '#0dc75e' : 'rgba(255,255,255,0.12)' }}
                >
                  <div className="cb-thumb" style={{ left: analyticsOn ? 21 : 3 }} />
                </button>
              </div>
            </div>
          )}

          {/* Main bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{
              flex: 1, minWidth: 260, margin: 0,
              fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
            }}>
              StageCheck uses cookies to improve your experience and understand platform usage. We never sell your data.{' '}
              <Link
                to="/privacy"
                style={{ color: '#0dc75e', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Privacy policy →
              </Link>
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {expanded ? (
                <button className="cb-btn-accept" onClick={acceptSelected}>Save preferences</button>
              ) : (
                <>
                  <button className="cb-btn-accept" onClick={acceptAll}>Accept and close</button>
                  <button className="cb-btn-ghost"  onClick={rejectAll}>Reject all</button>
                </>
              )}
              <button className="cb-btn-link" onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Hide settings ↑' : 'Change settings'}
              </button>
            </div>
          </div>
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