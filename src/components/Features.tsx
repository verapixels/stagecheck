import { Calendar, Users, Shield, Cpu, Package, Radio, MessageSquare, Ticket, Trophy, Film, BarChart3, Sparkles } from 'lucide-react'

const features = [
  { icon: <Calendar size={22} />, title: 'Performance Scheduling', desc: 'Assign time slots, prevent overlaps, auto-balance event flow. Choir A at 4:00 PM, Speaker at 4:30 PM — zero chaos.', accent: '#22C55E', tag: 'Scheduling' },
  { icon: <Users size={22} />, title: 'Registration & Auditions', desc: 'Full registration portal for choirs, speakers, dancers, and talents. Comes with approval, rejection, and waiting list systems.', accent: '#3B82F6', tag: 'Registration' },
  { icon: <Shield size={22} />, title: 'Conflict Detection', desc: 'Beyond songs — detect duplicate performers, overlapping time slots, same group entered twice, and clashing resources instantly.', accent: '#22C55E', tag: 'Protection' },
  { icon: <Cpu size={22} />, title: 'Live Stage Control', desc: 'Real-time control panel during the event: who is next, countdown timers, mark completed acts, full stage status display.', accent: '#F59E0B', tag: 'Live' },
  { icon: <Package size={22} />, title: 'Resource Management', desc: 'Assign microphones, instruments, rehearsal rooms, and stage time. Prevent double-booking of equipment across all acts.', accent: '#8B5CF6', tag: 'Resources' },
  { icon: <Trophy size={22} />, title: 'Judging & Scoring', desc: 'Judges score performances live. Real-time scoring dashboard, automatic ranking, and feedback submission for competitions.', accent: '#F59E0B', tag: 'Competitions' },
  { icon: <MessageSquare size={22} />, title: 'Communication System', desc: 'Built-in messaging between organizers and performers. Announcements, schedule changes, and automated reminders.', accent: '#14B8A6', tag: 'Comms' },
  { icon: <Ticket size={22} />, title: 'Ticketing System', desc: 'Create tickets with QR codes, track attendance, validate entry at the gate. Full event infrastructure in one place.', accent: '#EC4899', tag: 'Ticketing' },
  { icon: <Film size={22} />, title: 'Media & Content Hub', desc: 'Upload event recordings, store highlights, build a shareable event archive. StageCheck becomes your memory platform too.', accent: '#3B82F6', tag: 'Media' },
  { icon: <BarChart3 size={22} />, title: 'Analytics Dashboard', desc: 'Track participation rates, popular categories, schedule efficiency, and event success metrics. Data that makes you better.', accent: '#8B5CF6', tag: 'Analytics' },
  { icon: <Radio size={22} />, title: 'Event Planning Hub', desc: 'Create events, set rules, control capacity, define categories — music, drama, speech, dance. A full event management tool.', accent: '#22C55E', tag: 'Planning' },
  { icon: <Sparkles size={22} />, title: 'AI Smart Suggestions', desc: 'Suggest available time slots, recommend alternatives, detect similar submissions, and auto-optimize full event flow.', accent: '#EC4899', tag: 'AI' },
]

export default function Features() {
  return (
    <section id="features" style={{ padding: '7rem 2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)',
      }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            padding: '5px 14px', borderRadius: 100, marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500, fontFamily: 'var(--font-body)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>12 Integrated Systems</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-1px', marginBottom: 16,
          }}>
            Not a feature. An entire<br />
            <span style={{ color: '#22C55E' }}>operating system for live events.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto', fontWeight: 300 }}>
            Every plan includes all 12 systems. What scales with your plan is capacity —
            not what you can access.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(19,26,46,0.6)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '24px', backdropFilter: 'blur(8px)',
              transition: 'all 0.25s', cursor: 'default', position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.accent}30`; e.currentTarget.style.background = 'rgba(19,26,46,0.9)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(19,26,46,0.6)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: `radial-gradient(circle at top right, ${f.accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'inline-block', background: `${f.accent}15`, color: f.accent, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, marginBottom: 14, fontFamily: 'var(--font-body)', letterSpacing: '0.3px' }}>{f.tag}</div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.accent}15`, border: `1px solid ${f.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.accent, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#fff', letterSpacing: '-0.2px' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
