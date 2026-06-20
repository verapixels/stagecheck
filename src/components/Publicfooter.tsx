import { useNavigate } from 'react-router-dom'
import {
  RiFacebookCircleLine, RiInstagramLine, RiTwitterXLine, RiYoutubeLine,
} from 'react-icons/ri'

export default function PublicFooter() {
  const navigate = useNavigate()

  const cols = [
    { h: 'Product',   links: [{ l: 'How It Works', to: '/#how-it-works' }, { l: 'Pricing', to: '/pricing' }, { l: 'Updates', to: '/updates' }] },
    { h: 'Solutions', links: [{ l: 'For Churches', to: '/solutions/churches' }, { l: 'For Schools', to: '/solutions/schools' }, { l: 'For Conferences', to: '/solutions/conferences' }, { l: 'For Competitions', to: '/solutions/competitions' }] },
    { h: 'Company',   links: [{ l: 'About Us', to: '/about' }, { l: 'Blog', to: '/blog' }, { l: 'Careers', to: '/careers' }, { l: 'Contact Us', to: '/contact' }] },
    { h: 'Resources', links: [{ l: 'Help Center', to: '/help' }, { l: 'Guides', to: '/guides' }, { l: 'Case Studies', to: '/case-studies' }, { l: 'Community', to: '/community' }] },
    { h: 'Legal',     links: [{ l: 'Privacy Policy', to: '/privacy' }, { l: 'Terms of Service', to: '/terms' }, { l: 'Refund Policy', to: '/refund' }] },
  ]

  const handleLink = (to: string) => {
    if (to.startsWith('/#')) {
      navigate('/')
      setTimeout(() => {
        const id = to.replace('/#', '')
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      navigate(to)
    }
  }

  return (
    <footer style={{
      background: '#010814',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: 'clamp(48px,6vw,72px) clamp(16px,5%,80px) 28px',
      fontFamily: 'var(--font-body, DM Sans, system-ui, sans-serif)',
    }}>
      {/* Top grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
        gap: 'clamp(16px,2vw,36px)',
        marginBottom: 48,
      }} className="footer-top-grid">

        {/* Brand col */}
        <div>
          <div
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', marginBottom: 0, display: 'inline-block' }}
          >
            <img src="/Stagechecklogo.png" alt="StageCheck" style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', margin: '14px 0 18px', maxWidth: 190, lineHeight: 1.7 }}>
            The complete event operating system. Plan, manage and run flawless events.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[<RiFacebookCircleLine />, <RiInstagramLine />, <RiTwitterXLine />, <RiYoutubeLine />].map((ic, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(13,199,94,0.4)'; e.currentTarget.style.color = '#0dc75e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
              >{ic}</div>
            ))}
          </div>
        </div>

        {/* Link cols */}
        {cols.map(col => (
          <div key={col.h}>
            <h5 style={{ fontFamily: 'var(--font-display, Syne, system-ui)', fontSize: 13, fontWeight: 700, marginBottom: 16, color: '#f0faf2' }}>
              {col.h}
            </h5>
            {col.links.map(({ l, to }) => (
              <button
                key={l}
                onClick={() => handleLink(to)}
                style={{
                  display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.58)',
                  textDecoration: 'none', marginBottom: 9,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body, system-ui)', textAlign: 'left', padding: 0,
                  transition: 'color .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#0dc75e'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.58)'}
              >
                {l}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 22,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, color: 'rgba(255,255,255,0.3)', flexWrap: 'wrap', gap: 12,
      }}>
        <span>© 2026 StageCheck by Verapixels Technologies. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {[{ l: 'Privacy', to: '/privacy' }, { l: 'Terms', to: '/terms' }].map(({ l, to }) => (
            <button
              key={l}
              onClick={() => navigate(to)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body, system-ui)', fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: 0, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0dc75e'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >{l}</button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .footer-top-grid { grid-template-columns: 1fr 1fr 1fr !important; } }
        @media (max-width: 560px) { .footer-top-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </footer>
  )
}