import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X, Check, ChevronDown, ChevronUp } from 'lucide-react'

type ConsentState = {
  essential: true
  analytics: boolean
}

const STORAGE_KEY = 'stagecheck_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState(true)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      // Small delay so it doesn't pop up immediately on page load
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = (consent: ConsentState) => {
    setHiding(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...consent, timestamp: Date.now() }))
    setTimeout(() => {
      setVisible(false)
      setHiding(false)
    }, 350)
  }

  const acceptAll = () => dismiss({ essential: true, analytics: true })
  const acceptSelected = () => dismiss({ essential: true, analytics: analyticsOn })
  const rejectAll = () => dismiss({ essential: true, analytics: false })

  if (!visible) return null

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)',
          opacity: hiding ? 0 : 1,
          transition: 'opacity 0.35s ease',
          pointerEvents: 'none',
        }}
        className="cookie-backdrop-mobile"
      />

      {/* Banner */}
      <div
        style={{
          position: 'fixed',
          bottom: 'clamp(1rem, 3vw, 1.5rem)',
          left: '50%',
          zIndex: 999,
          width: 'min(560px, calc(100vw - 2rem))',
          background: 'rgba(13,20,38,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.08)',
          overflow: 'hidden',
          opacity: hiding ? 0 : 1,
          transform: hiding ? 'translateX(-50%) translateY(12px)' : 'translateX(-50%) translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, #22C55E, #16a34a)', width: '100%' }} />

        <div style={{ padding: '20px 22px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cookie size={17} color="#22C55E" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4, fontFamily: 'var(--font-display, system-ui)' }}>
                We use cookies
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                StageCheck uses essential cookies to keep the platform running and optional analytics cookies to help us improve. We never sell your data.{' '}
                <Link to="/privacy" style={{ color: '#22C55E', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  Privacy Policy
                </Link>
              </p>
            </div>
            <button
              onClick={rejectAll}
              title="Reject all and close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, flexShrink: 0, marginTop: -2, display: 'flex', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Expandable preferences */}
          {expanded && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 14,
            }}>
              {/* Essential */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Essential cookies</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Required for login and core functionality</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, color: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '3px 8px',
                }}>
                  <Check size={10} color="#22C55E" /> Always on
                </div>
              </div>

              {/* Analytics */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Analytics cookies</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Help us understand how the platform is used</div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => setAnalyticsOn(v => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                    background: analyticsOn ? '#22C55E' : 'rgba(255,255,255,0.12)',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: analyticsOn ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={acceptAll}
              style={{
                flex: 1, minWidth: 120,
                background: '#22C55E', border: 'none', color: '#0B1020',
                padding: '9px 16px', borderRadius: 9, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body, system-ui)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
              onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
            >
              Accept all
            </button>

            {expanded ? (
              <button
                onClick={acceptSelected}
                style={{
                  flex: 1, minWidth: 120,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', padding: '9px 16px', borderRadius: 9, cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body, system-ui)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                Save preferences
              </button>
            ) : (
              <button
                onClick={rejectAll}
                style={{
                  flex: 1, minWidth: 120,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.65)', padding: '9px 16px', borderRadius: 9, cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body, system-ui)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                Reject all
              </button>
            )}

            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-body, system-ui)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Less' : 'Manage'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .cookie-backdrop-mobile { display: block !important; }
        }
        @media (min-width: 481px) {
          .cookie-backdrop-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}

// ── Helper hook to read consent state anywhere in the app ──
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