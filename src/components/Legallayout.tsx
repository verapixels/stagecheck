import { Link } from 'react-router-dom'
import { CheckSquare, ArrowLeft } from 'lucide-react'

interface LegalLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  lastUpdated: string
}

export default function LegalLayout({ children, title, subtitle, lastUpdated }: LegalLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#0B1020', color: '#fff', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11,16,32,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 clamp(1.5rem, 5vw, 4rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#22C55E', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckSquare size={15} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display, system-ui)', fontWeight: 700, fontSize: 17, color: '#fff' }}>StageCheck</span>
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </nav>

      {/* Hero */}
      <div style={{
        padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4rem) clamp(2rem, 4vw, 3rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        maxWidth: 860, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 8, padding: '4px 12px', marginBottom: 20,
          fontSize: 12, color: '#22C55E', fontWeight: 600,
        }}>
          Legal
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display, system-ui)', fontWeight: 800,
          fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.5px',
          color: '#fff', marginBottom: 12, lineHeight: 1.15,
        }}>{title}</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 16, maxWidth: 560 }}>{subtitle}</p>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Last updated: {lastUpdated}</div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem) clamp(3rem, 6vw, 5rem)' }}>
        {children}
      </div>

      {/* Footer links */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem clamp(1.5rem, 5vw, 4rem)', display: 'flex', gap: 24, flexWrap: 'wrap', maxWidth: 860, margin: '0 auto' }}>
        {[
          { label: 'Privacy Policy', to: '/privacy' },
          { label: 'Terms of Service', to: '/terms' },
          { label: 'Refund Policy', to: '/refund' },
        ].map(l => (
          <Link key={l.to} to={l.to} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            {l.label}
          </Link>
        ))}
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>© {new Date().getFullYear()} StageCheck</span>
      </div>

      <style>{`
        .legal-section { margin-bottom: 2.5rem; }
        .legal-h2 {
          font-family: var(--font-display, system-ui); font-weight: 700;
          font-size: 1.2rem; color: #fff; margin-bottom: 12px; margin-top: 0;
          padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .legal-p { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.8; margin: 0 0 12px; }
        .legal-ul { padding-left: 20px; margin: 0 0 12px; }
        .legal-li { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.8; margin-bottom: 6px; }
        .legal-li::marker { color: #22C55E; }
        .legal-highlight {
          background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15);
          border-radius: 10px; padding: 16px 20px; margin-bottom: 16px;
        }
        .legal-highlight p { margin: 0; }
        .legal-link { color: #22C55E; text-decoration: none; }
        .legal-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}