import { useState, useEffect } from 'react'
import { CheckSquare, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = ['Features', 'How it Works', 'Solutions', 'Pricing']

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 2rem',
      background: scrolled ? 'rgba(11,16,32,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--green)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckSquare size={18} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.3px' }}>
            StageCheck
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }} className="desktop-links">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} style={{
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
              fontSize: 15, fontWeight: 400, transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >{l}</a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="desktop-links">
          <button
  onClick={() => navigate('/login')}
  style={{
    background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff', padding: '8px 20px', borderRadius: 8,
    cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 500,
    transition: 'border-color 0.2s',
  }}>Login</button>
          <button style={{
            background: 'var(--green)', border: 'none',
            color: '#0B1020', padding: '9px 22px', borderRadius: 8,
            cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 700,
            letterSpacing: '0.2px', transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1da34a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--green)')}
          >Request Demo</button>
        </div>

        {/* Mobile hamburger */}
 {/* Mobile hamburger */}
<button
  onClick={() => setOpen(!open)}
  className="mobile-menu-btn"
  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'none' }}
>
  {open ? <X size={24} /> : <Menu size={24} />}
</button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: 'rgba(11,16,32,0.98)', backdropFilter: 'blur(20px)',
          padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              onClick={() => setOpen(false)}
              style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >{l}</a>
          ))}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Login</button>
            <button style={{ flex: 1, background: 'var(--green)', border: 'none', color: '#0B1020', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Request Demo</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
