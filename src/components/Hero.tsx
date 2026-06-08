import { ArrowRight, Play, CheckCircle2, Shield, Zap, BarChart3 } from 'lucide-react'

function DashboardMockup() {
  const rows = [
    { name: 'Choir A — Opening Set', status: 'Confirmed', slot: '4:00 PM', num: '#SC001' },
    { name: 'Drama Team', status: 'Verified', slot: '4:20 PM', num: '#SC002' },
    { name: 'Speaker — Keynote', status: 'Confirmed', slot: '4:45 PM', num: '#SC003' },
    { name: 'Choir B — Finals', status: 'Pending', slot: '5:10 PM', num: '#SC004' },
    { name: 'Closing Dance', status: 'Verified', slot: '5:35 PM', num: '#SC005' },
  ]

  const statusColor: Record<string, string> = {
    Confirmed: '#22C55E',
    Verified: '#3B82F6',
    Pending: '#F59E0B',
  }

  return (
    <div style={{
      background: 'rgba(13,20,38,0.9)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.1)',
      width: '100%', maxWidth: 580,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>stagecheck.com — Live Control Panel</span>
        </div>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
      </div>

      <div style={{ display: 'flex', height: 360 }}>
        <div style={{ width: 130, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: 'var(--green)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={12} color="#0B1020" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#fff' }}>StageCheck</span>
          </div>
          {['Dashboard','Events','Schedule','Performers','Resources','Judging','Analytics','Messages','Settings'].map((item, i) => (
            <div key={item} style={{
              padding: '7px 12px', fontSize: 10,
              color: i === 2 ? '#22C55E' : 'rgba(255,255,255,0.4)',
              background: i === 2 ? 'rgba(34,197,94,0.08)' : 'transparent',
              borderLeft: i === 2 ? '2px solid #22C55E' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>{item}</div>
          ))}
        </div>

        <div style={{ flex: 1, padding: '14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: '#fff' }}>Live Stage Schedule</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.25)' }}>● LIVE</div>
              <div style={{ background: '#22C55E', color: '#0B1020', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>+ Add Slot</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Performers', val: '24' },
              { label: 'Conflicts', val: '0', green: true },
              { label: 'Next Up', val: '4:20 PM' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6, padding: '6px 8px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.green ? '#22C55E' : '#fff', fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 65px 60px', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Performer / Act', 'Status', 'Time Slot', 'ID'].map(h => (
                <span key={h} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>{h}</span>
              ))}
            </div>
            {rows.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 65px 60px',
                padding: '6px 10px',
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
                background: i === 0 ? 'rgba(34,197,94,0.05)' : 'transparent',
              }}>
                <span style={{ fontSize: 10, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', fontWeight: i === 0 ? 600 : 400 }}>{r.name}</span>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: `${statusColor[r.status]}20`,
                  color: statusColor[r.status],
                  fontSize: 8, padding: '2px 5px', borderRadius: 3, fontFamily: 'var(--font-body)',
                }}>
                  <CheckCircle2 size={7} /> {r.status}
                </div>
                <span style={{ fontSize: 10, color: '#22C55E', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{r.slot}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>{r.num}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={11} color="#22C55E" />
            <span style={{ fontSize: 10, color: '#22C55E', fontFamily: 'var(--font-body)' }}>No conflicts detected across all 24 performers</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const stats = [
    { icon: <Shield size={14} />, label: 'Zero-conflict events', value: '18k+' },
    { icon: <Zap size={14} />, label: 'Performers managed', value: '120k+' },
    { icon: <BarChart3 size={14} />, label: 'Event categories', value: '12' },
  ]

  return (
    <section style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      overflow: 'hidden', paddingTop: 72,
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 50% at 10% 80%, rgba(34,197,94,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 90% 20%, rgba(59,130,246,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 80% 40% at 50% 100%, rgba(34,197,94,0.05) 0%, transparent 70%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 0%, transparent 100%)',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem',
        alignItems: 'center', position: 'relative', zIndex: 1,
      }} className="hero-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            padding: '6px 14px', borderRadius: 100, marginBottom: 28,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#22C55E', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
              The Event Operating System
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', lineHeight: 1.1,
            letterSpacing: '-1.5px', marginBottom: 24,
          }}>
            Everything that happens{' '}
            <span style={{ color: '#22C55E' }}>on your stage,</span>
            <br />
            <span style={{
              WebkitTextStroke: '1px rgba(255,255,255,0.6)',
              color: 'transparent',
            }}>under control.</span>
          </h1>

          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
            marginBottom: 36, maxWidth: 460, fontWeight: 300,
          }}>
            StageCheck is not just a song checker. It's a full event operating system —
            scheduling, registration, conflict detection, live control, judging, ticketing,
            and analytics. All in one platform.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
            <button style={{
              background: '#22C55E', border: 'none', color: '#0B1020',
              padding: '14px 28px', borderRadius: 10, cursor: 'pointer',
              fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1da34a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Start for Free <ArrowRight size={16} />
            </button>
            <button style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', padding: '14px 24px', borderRadius: 10, cursor: 'pointer',
              fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Play size={14} fill="currentColor" /> Watch Demo
            </button>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E' }}>
                  {s.icon}
                  <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#fff' }}>{s.value}</span>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <DashboardMockup />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; } }
      `}</style>
    </section>
  )
}
