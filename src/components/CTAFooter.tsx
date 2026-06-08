import { CheckSquare, ArrowRight, ExternalLink } from 'lucide-react'

export function CTA() {
  return (
    <section style={{ padding: '6rem 2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(59,130,246,0.08) 100%)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 24, padding: 'clamp(2rem, 6vw, 5rem)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-1.5px',
              marginBottom: 20, lineHeight: 1.1,
            }}>
              Ready to run your<br />
              <span style={{ color: '#22C55E' }}>first clash-free event?</span>
            </h2>
            <p style={{
              fontSize: 18, color: 'rgba(255,255,255,0.55)', fontWeight: 300,
              marginBottom: 36, maxWidth: 480, margin: '0 auto 36px',
            }}>
              Join thousands of event organizers who've eliminated the chaos.
              Set up your first event in under 5 minutes.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{
                background: '#22C55E', border: 'none', color: '#0B1020',
                padding: '15px 32px', borderRadius: 10, cursor: 'pointer',
                fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#1da34a'}
                onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}
              >
                Get Started Free <ArrowRight size={18} />
              </button>
              <button style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', padding: '15px 28px', borderRadius: 10, cursor: 'pointer',
                fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              >
                Schedule a Demo
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const footerLinks = {
    Product: ['Dashboard', 'Events', 'Pricing', 'Changelog'],
    Solutions: ['Multiple Choirs', 'Festivals', 'Community Events', 'Enterprise'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
  }

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '4rem 2rem 2rem',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr repeat(4, 1fr)',
          gap: 40, marginBottom: '4rem',
        }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, background: '#22C55E', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare size={16} color="#0B1020" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>StageCheck</span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontWeight: 300, maxWidth: 240 }}>
              The professional event coordination platform for multi-act live performances.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {[ExternalLink, ExternalLink, ExternalLink].map((Icon, i) => (
                <a key={i} href="#" style={{
                  width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s', textDecoration: 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16, fontFamily: 'var(--font-body)', letterSpacing: '0.3px' }}>{category}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(link => (
                  <li key={link}>
                    <a href="#" style={{
                      fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                      transition: 'color 0.2s', fontWeight: 300,
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                    >{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1.5rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            © 2026 StageCheck. All rights reserved.
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Built for the performers. Engineered for the organizers.
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
