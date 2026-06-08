import { Check, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    naira: '₦0',
    period: 'forever',
    desc: 'Full platform access. Perfect for small events and first-time organizers.',
    color: '#64748B',
    limits: [
      { label: 'Active Events', value: '5' },
      { label: 'Performers per event', value: '50' },
      { label: 'Free tickets per event', value: '50' },
      { label: 'Resource slots', value: '5' },
      { label: 'Analytics', value: 'Basic summary' },
      { label: 'Conflict detection', value: 'Basic duplicates' },
      { label: 'Scheduling', value: 'Manual ordering' },
      { label: 'AI suggestions', value: 'Disabled' },
      { label: 'Messaging', value: 'Announcements only' },
      { label: 'Live control panel', value: 'Basic view' },
    ],
    cta: 'Get Started Free',
    featured: false,
  },
  {
    name: 'Growth',
    price: '₦15k – ₦25k',
    naira: '₦15,000',
    period: 'per event',
    desc: 'For organizers running real working events with hundreds of performers.',
    color: '#22C55E',
    limits: [
      { label: 'Active Events', value: '25' },
      { label: 'Performers per event', value: '250' },
      { label: 'Tickets per event', value: '250 (full system)' },
      { label: 'Resource slots', value: '25' },
      { label: 'Analytics', value: 'Full dashboard' },
      { label: 'Conflict detection', value: 'Advanced (songs + time + performer)' },
      { label: 'Scheduling', value: 'Full automation' },
      { label: 'AI suggestions', value: 'Basic version' },
      { label: 'Messaging', value: 'Full system' },
      { label: 'Live control panel', value: 'Full access' },
    ],
    cta: 'Start Growth Plan',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₦50k – ₦100k',
    naira: '₦50,000',
    period: 'per event',
    desc: 'Power users running massive events — thousands of performers, full AI, deep integrations.',
    color: '#3B82F6',
    limits: [
      { label: 'Active Events', value: '125' },
      { label: 'Performers per event', value: '1,250' },
      { label: 'Tickets', value: 'Unlimited + QR check-in' },
      { label: 'Resource slots', value: '125' },
      { label: 'Analytics', value: 'Deep insights + export' },
      { label: 'Conflict detection', value: 'Full smart AI matching' },
      { label: 'Scheduling', value: 'Auto-optimization system' },
      { label: 'AI suggestions', value: 'Full AI engine' },
      { label: 'Messaging', value: 'Full communication suite' },
      { label: 'Integrations', value: 'YouTube, Spotify, Payments' },
    ],
    cta: 'Start Pro Plan',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '₦200k+',
    naira: '₦200,000',
    period: 'custom',
    desc: 'No real limits. Multiple admin teams, advanced security, full API, dedicated support.',
    color: '#8B5CF6',
    limits: [
      { label: 'Active Events', value: 'Unlimited' },
      { label: 'Performers per event', value: 'Unlimited' },
      { label: 'Tickets', value: 'Unlimited + advanced tools' },
      { label: 'Resource slots', value: 'Unlimited' },
      { label: 'Analytics', value: 'Custom reporting' },
      { label: 'Conflict detection', value: 'Enterprise AI' },
      { label: 'Scheduling', value: 'Multi-team coordination' },
      { label: 'AI suggestions', value: 'Custom AI pipeline' },
      { label: 'Messaging', value: 'Multi-team system' },
      { label: 'White-label', value: 'Event portals only' },
    ],
    cta: 'Contact Sales',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" style={{ padding: '7rem 2rem', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(34,197,94,0.04) 0%, transparent 70%)' }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            padding: '5px 14px', borderRadius: 100, marginBottom: 20,
          }}>
            <Zap size={12} color="#22C55E" />
            <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>All features. Every plan.</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-1px', marginBottom: 16 }}>
            Scale what you need.<br />
            <span style={{ color: '#22C55E' }}>Not what you can access.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto', fontWeight: 300, lineHeight: 1.6 }}>
            Every plan includes all 12 systems. Your tier determines how much you can do —
            not which features you can touch. Just like Notion, Slack, and Airtable.
          </p>
        </div>

        {/* Key insight banner */}
        <div style={{
          background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 12, padding: '14px 24px', marginBottom: '3rem',
          display: 'flex', alignItems: 'center', gap: 12, maxWidth: 700, margin: '0 auto 3rem',
        }}>
          <Check size={16} color="#22C55E" strokeWidth={2.5} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>
            <strong style={{ color: '#22C55E' }}>Capacity scales ×5</strong> between each plan — 5 events → 25 → 125 → Unlimited · 50 performers → 250 → 1,250 → Unlimited
          </span>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          {plans.map((p) => (
            <div key={p.name} style={{
              background: p.featured ? 'rgba(19,26,60,0.98)' : 'rgba(19,26,46,0.5)',
              border: p.featured ? `1px solid ${p.color}50` : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '28px',
              display: 'flex', flexDirection: 'column', gap: 20,
              position: 'relative', overflow: 'hidden',
              boxShadow: p.featured ? `0 0 60px ${p.color}18` : 'none',
              transition: 'transform 0.2s',
            }}>
              {p.featured && (
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  background: p.color, color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                  fontFamily: 'var(--font-body)',
                }}>Most Popular</div>
              )}

              {/* Glow top */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${p.color}60, transparent)` }} />

              {/* Plan header */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{p.name}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: p.name === 'Starter' ? 36 : 26, letterSpacing: '-1px', color: '#fff', lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/ {p.period}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontWeight: 300 }}>{p.desc}</p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              {/* Limits */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.limits.map(l => (
                  <div key={l.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{l.label}</span>
                    <span style={{ fontSize: 12, color: l.value === 'Disabled' ? 'rgba(255,255,255,0.2)' : l.value === 'Unlimited' ? p.color : 'rgba(255,255,255,0.8)', fontWeight: 600, fontFamily: 'var(--font-body)', textAlign: 'right' }}>{l.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              <button style={{
                background: p.featured ? p.color : 'transparent',
                border: p.featured ? 'none' : `1px solid rgba(255,255,255,0.15)`,
                color: p.featured ? '#fff' : '#fff',
                padding: '13px', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                width: '100%', transition: 'all 0.2s',
              }}
                onMouseEnter={e => {
                  if (p.featured) { e.currentTarget.style.filter = 'brightness(1.1)' }
                  else { e.currentTarget.style.background = `${p.color}15`; e.currentTarget.style.borderColor = `${p.color}40`; e.currentTarget.style.color = p.color }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.filter = 'none'
                  e.currentTarget.style.background = p.featured ? p.color : 'transparent'
                  e.currentTarget.style.borderColor = p.featured ? 'none' : 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = '#fff'
                }}
              >{p.cta}</button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
          All prices in Nigerian Naira (₦). No credit card required for Starter. Cancel or upgrade anytime.
        </p>
      </div>
    </section>
  )
}
