// src/components/howItWorks/StepsSection.tsx
import {
  RiCalendarCheckLine,
  RiPriceTag3Line,
  RiMegaphoneLine,
  RiShoppingCartLine,
  RiQrCodeLine,
  RiBarChartLine,
} from 'react-icons/ri'

const STEPS = [
  {
    icon: RiCalendarCheckLine,
    title: 'Create Your Event',
    desc: 'Add your event details, date, venue and upload eye-catching visuals.',
  },
  {
    icon: RiPriceTag3Line,
    title: 'Create Tickets',
    desc: 'Set up ticket types, pricing, quantities and customize buyer experience.',
  },
  {
    icon: RiMegaphoneLine,
    title: 'Promote & Share',
    desc: 'Share your event page, run promos and reach the right audience.',
  },
  {
    icon: RiShoppingCartLine,
    title: 'Sell Tickets',
    desc: 'Attendees buy tickets securely via our platform in just a few clicks.',
  },
  {
    icon: RiQrCodeLine,
    title: 'Check-in Attendees',
    desc: 'Scan QR codes or enter ticket codes to check-in attendees instantly.',
  },
  {
    icon: RiBarChartLine,
    title: 'Track & Analyze',
    desc: 'Monitor sales, attendance, revenue and insights in real-time.',
  },
]

export default function StepsSection() {
  return (
    <section className="hiw-steps-section">
      <style>{`
        .hiw-steps-section {
          padding: 0 clamp(16px, 4%, 48px) 48px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hiw-steps-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          position: relative;
        }
        .hiw-step-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 22px 16px 20px;
          transition: border-color .25s, transform .25s, background .25s;
          cursor: default;
        }
        .hiw-step-card:hover {
          border-color: rgba(13,199,94,0.3);
          background: rgba(13,199,94,0.04);
          transform: translateY(-3px);
        }
        .hiw-step-num {
          width: 24px; height: 24px; border-radius: 50%;
          background: rgba(13,199,94,0.12);
          border: 1px solid rgba(13,199,94,0.35);
          color: #0dc75e;
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .hiw-step-connector {
          position: absolute;
          top: 34px; right: -12px;
          display: flex; align-items: center;
          z-index: 2;
          color: rgba(13,199,94,0.5);
          font-size: 16px;
          font-weight: 700;
        }
        .hiw-step-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: rgba(13,199,94,0.1);
          border: 1px solid rgba(13,199,94,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .hiw-step-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 14px;
          color: #fff;
          margin: 0 0 7px;
          line-height: 1.3;
        }
        .hiw-step-desc {
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          line-height: 1.6;
          color: rgba(255,255,255,0.45);
          margin: 0;
          font-weight: 400;
        }
        @media (max-width: 1024px) {
          .hiw-steps-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
          .hiw-step-connector:nth-child(3n) { display: none; }
        }
        @media (max-width: 640px) {
          .hiw-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hiw-step-connector { display: none; }
          .hiw-step-card { padding: 18px 14px 16px; }
        }
        @media (max-width: 380px) {
          .hiw-steps-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hiw-steps-grid">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div className="hiw-step-card" key={step.title}>
              <div className="hiw-step-num">{i + 1}</div>
              <div className="hiw-step-icon">
                <Icon size={20} color="#0dc75e" />
              </div>
              <h3 className="hiw-step-title">{step.title}</h3>
              <p className="hiw-step-desc">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <span className="hiw-step-connector">→</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}