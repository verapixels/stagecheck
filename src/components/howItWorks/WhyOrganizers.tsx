// src/components/howItWorks/WhyOrganizers.tsx
import {
  RiFlashlightLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiGroupLine,
  RiPieChartLine,
  RiCustomerServiceLine,
  RiSmartphoneLine,
  RiGlobalLine,
} from 'react-icons/ri'

const BENEFITS = [
  {
    icon: RiFlashlightLine,
    title: 'Save Time',
    desc: 'Automate tasks and focus on creating memorable experiences instead of chasing admin work.',
    accent: '#0dc75e',
  },
  {
    icon: RiMoneyDollarCircleLine,
    title: 'Increase Revenue',
    desc: 'Powerful tools to sell more tickets, upsell add-ons and maximize your event earnings.',
    accent: '#8B5CF6',
  },
  {
    icon: RiShieldCheckLine,
    title: 'Reduce No-Shows',
    desc: 'Smart reminders, easy digital check-ins and real-time attendance tracking.',
    accent: '#F59E0B',
  },
  {
    icon: RiGroupLine,
    title: 'Happy Attendees',
    desc: 'Smooth buying experience, instant QR tickets and seamless event-day entry.',
    accent: '#06B6D4',
  },
  {
    icon: RiPieChartLine,
    title: 'Data-Driven Decisions',
    desc: 'Real-time dashboards and insights that help you grow with every event you run.',
    accent: '#EC4899',
  },
  {
    icon: RiCustomerServiceLine,
    title: 'Dedicated Support',
    desc: 'Our team is always available to help you run your event without a hitch.',
    accent: '#F97316',
  },
  {
    icon: RiSmartphoneLine,
    title: 'Mobile-First',
    desc: 'Manage your event from anywhere — your dashboard works beautifully on any device.',
    accent: '#0dc75e',
  },
  {
    icon: RiGlobalLine,
    title: 'Built for Nigeria',
    desc: 'Naira payments, local support and features tailored for the Nigerian event industry.',
    accent: '#22D3EE',
  },
]

export default function WhyOrganizers() {
  return (
    <section className="hiw-why-section">
      <style>{`
        .hiw-why-section {
          padding: 60px clamp(16px, 4%, 48px) 60px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hiw-why-eyebrow {
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0dc75e;
          margin-bottom: 12px;
        }
        .hiw-why-title {
          text-align: center;
          font-family: 'Fraunces', serif;
          font-weight: 800;
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          color: #fff;
          margin: 0 0 10px;
          line-height: 1.15;
        }
        .hiw-why-title span { color: #0dc75e; }
        .hiw-why-sub {
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: clamp(13px, 1.4vw, 15px);
          color: rgba(255,255,255,0.45);
          max-width: 520px;
          margin: 0 auto 44px;
          line-height: 1.6;
        }
        .hiw-why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .hiw-why-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 24px 20px;
          transition: border-color .25s, transform .25s, background .25s;
          cursor: default;
        }
        .hiw-why-card:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-3px);
          background: rgba(255,255,255,0.04);
        }
        .hiw-why-icon-box {
          width: 46px; height: 46px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .hiw-why-card-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          margin: 0 0 8px;
          line-height: 1.3;
        }
        .hiw-why-card-desc {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          line-height: 1.65;
          color: rgba(255,255,255,0.45);
          margin: 0;
          font-weight: 400;
        }
        @media (max-width: 1024px) {
          .hiw-why-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }
        @media (max-width: 700px) {
          .hiw-why-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hiw-why-card { padding: 20px 16px; }
        }
        @media (max-width: 400px) {
          .hiw-why-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <p className="hiw-why-eyebrow">Why choose StageCheck</p>
      <h2 className="hiw-why-title">The platform organizers <span>trust</span></h2>
      <p className="hiw-why-sub">
        From church conferences to concerts, StageCheck gives every organizer the tools to deliver a flawless event.
      </p>

      <div className="hiw-why-grid">
        {BENEFITS.map((b) => {
          const Icon = b.icon
          return (
            <div className="hiw-why-card" key={b.title}>
              <div
                className="hiw-why-icon-box"
                style={{
                  background: `${b.accent}18`,
                  border: `1px solid ${b.accent}28`,
                }}
              >
                <Icon size={22} color={b.accent} />
              </div>
              <h3 className="hiw-why-card-title">{b.title}</h3>
              <p className="hiw-why-card-desc">{b.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}