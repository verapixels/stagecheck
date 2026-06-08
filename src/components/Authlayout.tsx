import { CheckSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0B1020',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 50% 60% at 20% 20%, rgba(34,197,94,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 40% 50% at 80% 80%, rgba(59,130,246,0.05) 0%, transparent 70%)
        `,
      }} />
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 0%, transparent 100%)',
      }} />

      {/* Top nav */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#22C55E', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare size={16} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>StageCheck</span>
        </Link>
      </nav>

      {/* Center card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(19,26,46,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        }}>
          {/* Top accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent)', borderRadius: 2, marginBottom: 28 }} />

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 26, letterSpacing: '-0.8px', color: '#fff', marginBottom: 8,
          }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28, fontWeight: 300, lineHeight: 1.6 }}>{subtitle}</p>

          {children}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '1.5rem', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 StageCheck · The Event Operating System</p>
      </div>
    </div>
  )
}