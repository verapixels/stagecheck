// src/components/Navbar.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  variant?: 'landing' | 'events'
  onScrollTo?: (id: string) => void
}

export default function Navbar({ variant = 'landing', onScrollTo }: NavbarProps) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <style>{`
        .sc-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          height: 70px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(16px, 4%, 64px);
          transition: background .3s ease, box-shadow .3s ease, border-color .3s ease;
          border-bottom: 1px solid transparent;
        }
        .sc-nav.scrolled {
          background: rgba(0,4,14,.96);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom-color: rgba(255,255,255,0.08);
          box-shadow: 0 4px 32px rgba(0,0,0,.5);
        }
        .sc-nav-logo {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; flex-shrink: 0; text-decoration: none;
        }
        .sc-logo-img {
          height: 40px; width: auto; object-fit: contain; display: block;
          filter: brightness(1.15) drop-shadow(0 0 8px rgba(13,199,94,0.35));
          transition: filter .25s, transform .25s;
        }
        .sc-nav-logo:hover .sc-logo-img {
          filter: brightness(1.3) drop-shadow(0 0 14px rgba(13,199,94,0.55));
          transform: scale(1.04);
        }
        .sc-logo-fallback { display: none; align-items: center; gap: 10px; }
        .sc-logo-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: #0dc75e; display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 900; font-size: 18px;
          color: #000; box-shadow: 0 0 18px rgba(13,199,94,0.45); flex-shrink: 0;
        }
        .sc-logo-name {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 17px;
          color: #f0faf2; letter-spacing: -0.5px;
        }
        .sc-logo-name span { color: #0dc75e; }

        .sc-nav-center {
          display: flex; align-items: center; gap: 2px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 40px; padding: 4px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .sc-nav-pill {
          padding: 7px 18px; border-radius: 36px;
          font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.6);
          cursor: pointer; background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          transition: color .2s; white-space: nowrap;
        }
        .sc-nav-pill:hover { color: #f0faf2; }

        .sc-nav-r { display: flex; gap: 10px; align-items: center; }
        .sc-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 20px; border-radius: 9px; font-size: 14px; font-weight: 600;
          cursor: pointer; background: transparent;
          border: 1px solid rgba(255,255,255,0.1); color: #f0faf2;
          font-family: 'DM Sans', sans-serif; transition: all .2s; flex-shrink: 0;
        }
        .sc-btn-ghost:hover { border-color: rgba(13,199,94,0.2); color: #0dc75e; }
        .sc-btn-green {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 22px; border-radius: 9px; font-size: 14px; font-weight: 700;
          cursor: pointer; background: #0dc75e; border: none; color: #000;
          font-family: 'DM Sans', sans-serif; transition: all .2s;
          box-shadow: 0 0 20px rgba(13,199,94,.25); flex-shrink: 0;
        }
        .sc-btn-green:hover {
          background: #2fe070; box-shadow: 0 0 32px rgba(13,199,94,.45);
          transform: translateY(-1px);
        }

        .sc-mob-trigger {
          display: none; width: 40px; height: 40px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; cursor: pointer; align-items: center; justify-content: center;
          flex-direction: column; gap: 5px; padding: 10px; transition: all .2s;
        }
        .sc-mob-trigger:hover { border-color: rgba(13,199,94,0.2); }
        .sc-mob-trigger span {
          display: block; height: 1.5px; background: #f0faf2;
          border-radius: 2px; transition: all .35s cubic-bezier(.16,1,.3,1);
        }
        .sc-mob-trigger span:nth-child(1) { width: 20px; }
        .sc-mob-trigger span:nth-child(2) { width: 14px; align-self: flex-end; }
        .sc-mob-trigger span:nth-child(3) { width: 18px; }
        .sc-mob-trigger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); width: 20px; }
        .sc-mob-trigger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .sc-mob-trigger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); width: 20px; }

        .sc-mob-overlay {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,4,14,.98); backdrop-filter: blur(32px);
          display: flex; flex-direction: column;
          padding: 70px 0 0;
          pointer-events: none; opacity: 0;
          transition: opacity .35s cubic-bezier(.16,1,.3,1);
        }
        .sc-mob-overlay.open { pointer-events: all; opacity: 1; }
        .sc-mob-inner {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px; padding: 32px 24px;
        }
        .sc-mob-link {
          width: 100%; max-width: 340px; text-align: center;
          font-family: 'Syne', sans-serif; font-size: clamp(22px,6vw,32px); font-weight: 700;
          color: rgba(255,255,255,0.6); background: none; border: none; cursor: pointer;
          padding: 14px 24px; border-radius: 14px;
          transition: all .25s; border: 1px solid transparent;
        }
        .sc-mob-link:hover { color: #f0faf2; background: rgba(255,255,255,.03); border-color: rgba(255,255,255,0.08); }
        .sc-mob-divider { width: 60px; height: 1px; background: rgba(255,255,255,0.08); margin: 12px 0; }
        .sc-mob-btns { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 340px; margin-top: 8px; }
        .sc-mob-btn-g {
          display: block; width: 100%; padding: 14px; border-radius: 12px;
          font-weight: 700; font-size: 15px; cursor: pointer;
          background: #0dc75e; border: none; color: #000;
          font-family: 'DM Sans', sans-serif; text-align: center;
        }
        .sc-mob-btn-o {
          display: block; width: 100%; padding: 14px; border-radius: 12px;
          font-weight: 600; font-size: 15px; cursor: pointer;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          color: #f0faf2; font-family: 'DM Sans', sans-serif; text-align: center;
        }

        @media (max-width: 900px) {
          .sc-nav-center { display: none !important; }
          .sc-btn-ghost.desktop-only { display: none !important; }
          .sc-mob-trigger { display: flex !important; }
        }
        @media (max-width: 480px) {
          .sc-btn-green.desktop-only { display: none !important; }
        }
      `}</style>

      <NavContent
        scrolled={scrolled}
        variant={variant}
        navigate={navigate}
        onScrollTo={onScrollTo}
      />
    </>
  )
}

function NavContent({ scrolled, variant, navigate, onScrollTo }: {
  scrolled: boolean
  variant: 'landing' | 'events'
  navigate: ReturnType<typeof useNavigate>
  onScrollTo?: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const landingNavItems = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Events', id: 'events' },
    { label: 'Why Us', id: 'why-us' },
  ]

  const handlePill = (id: string) => {
    if (variant === 'landing' && onScrollTo) {
      onScrollTo(id)
    } else {
      navigate(`/#${id}`)
    }
    setMenuOpen(false)
  }

  return (
    <>
      <nav className={`sc-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="sc-nav-logo" onClick={() => navigate('/')}>
          <img
            src="/Stagechecklogo.png"
            alt="StageCheck"
            className="sc-logo-img"
            onError={e => {
              const img = e.target as HTMLImageElement
              img.style.display = 'none'
              const fb = img.nextSibling as HTMLElement
              if (fb) fb.style.display = 'flex'
            }}
          />
          <div className="sc-logo-fallback">
            <div className="sc-logo-icon">S</div>
            <span className="sc-logo-name">Stage<span>Check</span></span>
          </div>
        </div>

        {variant === 'landing' && (
          <div className="sc-nav-center">
            {landingNavItems.map(l => (
              <button key={l.label} className="sc-nav-pill" onClick={() => handlePill(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        )}

        <div className="sc-nav-r">
          <button className="sc-btn-ghost desktop-only" onClick={() => navigate('/login')}>Log in</button>
          <button className="sc-btn-green desktop-only" onClick={() => navigate('/signup')}>
            {variant === 'events' ? 'Create Event' : 'Get Started Free'}
          </button>
          <button
            className={`sc-mob-trigger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`sc-mob-overlay ${menuOpen ? 'open' : ''}`}>
        <div className="sc-mob-inner">
          {variant === 'landing' && landingNavItems.map(l => (
            <button key={l.label} className="sc-mob-link" onClick={() => handlePill(l.id)}>
              {l.label}
            </button>
          ))}
          {variant === 'events' && (
            <button className="sc-mob-link" onClick={() => { navigate('/'); setMenuOpen(false) }}>
              Home
            </button>
          )}
          <div className="sc-mob-divider" />
          <div className="sc-mob-btns">
            <button className="sc-mob-btn-g" onClick={() => { setMenuOpen(false); navigate('/signup') }}>
              {variant === 'events' ? 'Create Event' : 'Get Started Free'}
            </button>
            <button className="sc-mob-btn-o" onClick={() => { setMenuOpen(false); navigate('/login') }}>
              Log in
            </button>
          </div>
        </div>
      </div>
    </>
  )
}