import { Music2, Trophy, Heart, GraduationCap } from 'lucide-react'

const solutions = [
  {
    icon: <Music2 size={28} />,
    title: 'Multiple Choirs',
    subtitle: 'National Choir Associations',
    desc: 'Manage song assignments, registration portals, and clash detection across all choirs from one dashboard. No two choirs ever perform the same song.',
    accent: '#22C55E',
  },
  {
    icon: <Trophy size={28} />,
    title: 'Festivals & Competitions',
    subtitle: 'Live Performance Networks',
    desc: 'Set up branded registration flows, enforce uniqueness rules, run live judging and scoring dashboards, and export results for official records.',
    accent: '#3B82F6',
  },
  {
    icon: <Heart size={28} />,
    title: 'Worship & Community Events',
    subtitle: 'Festival & Church Organizers',
    desc: 'Create warm, on-brand portals for worship gatherings, charity concerts, and neighborhood festivals. Simple for organizers, professional for attendees.',
    accent: '#8B5CF6',
  },
  {
    icon: <GraduationCap size={28} />,
    title: 'School & Campus Events',
    subtitle: 'Educational Institutions',
    desc: 'Talent shows, cultural days, drama festivals — manage student registrations, parent communications, scheduling, and scoring all in one place.',
    accent: '#F59E0B',
  },
]

export default function Solutions() {
  return (
    <section id="solutions" style={{ padding: '7rem 2rem', background: 'rgba(13,20,38,0.4)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12, fontFamily: 'var(--font-body)' }}>Built For</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-1px' }}>
            Every stage. Every event.<br />
            <span style={{ color: '#22C55E' }}>Every type of performance.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {solutions.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '32px', display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.accent}30`; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${s.accent}12`, border: `1px solid ${s.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent }}>{s.icon}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6, alignSelf: 'flex-start' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.accent }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>{s.subtitle}</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: '-0.5px' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
