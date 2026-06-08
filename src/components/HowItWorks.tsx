import { Settings2, Link, Eye, UserCheck, Music, CheckCircle } from 'lucide-react'

const organizerSteps = [
  { icon: <Settings2 size={20} />, title: 'Set Up Your Event', desc: 'Define event date, location, song limits, and upload your brand assets — logo, colors, and description.' },
  { icon: <Link size={20} />, title: 'Generate Unique Link', desc: 'The system creates a custom, secure URL. Share it with all participating choirs and performers.' },
  { icon: <Eye size={20} />, title: 'Monitor in Real-Time', desc: 'Watch registrations flow in live. Approve song choices, manage the queue, detect clashes instantly.' },
]

const performerSteps = [
  { icon: <UserCheck size={20} />, title: 'Access Registration Portal', desc: 'Click the unique event link. See the organizer\'s branded portal with full event details and requirements.' },
  { icon: <Music size={20} />, title: 'Register Songs Instantly', desc: 'Type your intended songs. The platform cross-references the live database in real time — clash alerts appear immediately.' },
  { icon: <CheckCircle size={20} />, title: 'Receive Confirmation', desc: 'Submit and receive an automated, professional confirmation with a full record of your registration.' },
]

function StepCard({ step, index, accent }: { step: typeof organizerSteps[0]; index: number; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* Number + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent}15`, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
          position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18, background: accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#0B1020', fontWeight: 800 }}>{index + 1}</span>
          {step.icon}
        </div>
        {index < 2 && (
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${accent}40, transparent)`, marginTop: 8 }} />
        )}
      </div>
      <div style={{ paddingBottom: index < 2 ? 28 : 0 }}>
        <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 6, color: '#fff' }}>{step.title}</h4>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, fontWeight: 300 }}>{step.desc}</p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '7rem 2rem', position: 'relative' }}>
      {/* Divider line */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '5rem' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-1px', marginBottom: 16,
          }}>
            How StageCheck Works
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto', fontWeight: 300 }}>
            Two distinct journeys. One seamless platform.
          </p>
        </div>

        {/* Two column layout */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40,
        }} className="how-grid">
          {/* Organizer */}
          <div style={{
            background: 'rgba(19,26,46,0.5)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '36px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
              <div style={{
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)',
                padding: '6px 14px', borderRadius: 8,
              }}>
                <span style={{ fontSize: 13, color: '#22C55E', fontWeight: 600, fontFamily: 'var(--font-body)' }}>For Organizers</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {organizerSteps.map((s, i) => <StepCard key={i} step={s} index={i} accent="#22C55E" />)}
            </div>
          </div>

          {/* Performer */}
          <div style={{
            background: 'rgba(19,26,46,0.5)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '36px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
              <div style={{
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
                padding: '6px 14px', borderRadius: 8,
              }}>
                <span style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600, fontFamily: 'var(--font-body)' }}>For Performers</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {performerSteps.map((s, i) => <StepCard key={i} step={s} index={i} accent="#3B82F6" />)}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
