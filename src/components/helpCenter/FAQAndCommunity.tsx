// src/components/helpCenter/FAQAndCommunity.tsx
import { useState } from 'react'
import { RiArrowDownSLine, RiArrowRightLine } from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

const FAQS = [
  { q: 'How do payouts work?', a: 'Payouts are processed automatically after your event ends. Funds are transferred to your registered bank account within 3–5 business days, minus our platform service fee.' },
  { q: 'How do refunds work?', a: 'You can set your own refund policy when creating an event. Refunds can be processed manually from your dashboard up to the event date.' },
  { q: 'Can I edit an event after publishing?', a: 'Yes, most event details can be edited after publishing. Changes to ticket pricing or capacity will be noted to existing ticket holders.' },
  { q: 'How do promo codes work?', a: 'You can create percentage or fixed-amount promo codes from your ticketing dashboard. Set usage limits and expiry dates for each code.' },
  { q: 'How do I scan tickets using the app?', a: 'Download the StageCheck mobile app, open Check-in mode, and point your camera at any ticket QR code. The app works offline too.' },
  { q: 'Can I invite my team members?', a: 'Yes — go to Team & Roles in your event dashboard and invite collaborators by email. You can assign roles like co-organizer, check-in staff, or viewer.' },
]

const COMMUNITY = [
  {
    icon: '📘',
    color: '#1877F2',
    name: 'Facebook Group',
    desc: 'Join the community',
    href: '#',
  },
  {
    icon: '💡',
    color: '#0dc75e',
    name: 'Organizer Tips',
    desc: 'Weekly tips & insights',
    href: '#',
  },
  {
    icon: '🔔',
    color: '#F59E0B',
    name: "What's New",
    desc: 'Latest updates',
    href: '#',
  },
  {
    icon: '▶',
    color: '#FF0000',
    name: 'YouTube Channel',
    desc: 'Tutorials & webinars',
    href: '#',
  },
]

export default function FAQAndCommunity() {
  const [open, setOpen] = useState<number | null>(0)
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-faq-section" ref={ref}>
      <style>{`
        .hc-faq-section {
          padding: 0 clamp(20px, 5%, 80px) 64px;
          max-width: 1280px; margin: 0 auto;
        }
        .hc-faq-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: start;
        }
        /* FAQ */
        .hc-faq-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .hc-faq-item {
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .hc-faq-q {
          width: 100%; background: none; border: none;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 0; cursor: pointer; gap: 12px;
          text-align: left;
        }
        .hc-faq-q-text {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          color: rgba(255,255,255,0.85); line-height: 1.4;
        }
        .hc-faq-q:hover .hc-faq-q-text { color: #fff; }
        .hc-faq-arrow {
          color: rgba(255,255,255,0.4); flex-shrink: 0;
          transition: transform 0.3s, color 0.2s;
        }
        .hc-faq-arrow.open { transform: rotate(180deg); color: #0dc75e; }
        .hc-faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease, padding 0.25s ease;
        }
        .hc-faq-answer.open { max-height: 200px; padding-bottom: 14px; }
        .hc-faq-answer-text {
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.48); line-height: 1.65; font-weight: 400;
        }
        /* Community */
        .hc-comm-title {
          font-family: 'Fraunces', serif; font-weight: 800;
          font-size: clamp(1.1rem, 2.2vw, 1.45rem);
          color: #fff; margin: 0 0 8px;
        }
        .hc-comm-sub {
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.44); margin: 0 0 22px; font-weight: 400;
        }
        .hc-comm-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .hc-comm-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 18px 16px;
          display: flex; align-items: center; gap: 12px;
          text-decoration: none; cursor: pointer;
          transition: border-color 0.25s, transform 0.2s, background 0.25s;
        }
        .hc-comm-card:hover {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        .hc-comm-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .hc-comm-name {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 13px; color: #fff; margin: 0 0 3px;
        }
        .hc-comm-desc {
          font-family: 'Inter', sans-serif; font-size: 11px;
          color: rgba(255,255,255,0.4); margin: 0; font-weight: 400;
        }
        /* big question mark decoration */
        .hc-faq-deco {
          text-align: center;
          margin-top: 30px;
          opacity: 0.07;
          font-family: 'Fraunces', serif;
          font-size: 120px; font-weight: 900;
          color: #0dc75e;
          line-height: 1;
          user-select: none;
        }
        @media (max-width: 900px) {
          .hc-faq-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        @media (max-width: 480px) {
          .hc-comm-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hc-faq-grid">
        {/* FAQ */}
        <div className="hc-reveal">
          <div className="hc-faq-header">
            <h2 className="hc-section-title">Frequently asked questions</h2>
            <a href="#" className="hc-view-all">View all FAQs <RiArrowRightLine size={14} /></a>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} className="hc-faq-item">
              <button
                className="hc-faq-q"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="hc-faq-q-text">{faq.q}</span>
                <RiArrowDownSLine size={18} className={`hc-faq-arrow ${open === i ? 'open' : ''}`} />
              </button>
              <div className={`hc-faq-answer ${open === i ? 'open' : ''}`}>
                <p className="hc-faq-answer-text">{faq.a}</p>
              </div>
            </div>
          ))}
          <div className="hc-faq-deco">?</div>
        </div>

        {/* Community */}
        <div className="hc-reveal" style={{ '--delay': '120ms' } as React.CSSProperties}>
          <h2 className="hc-comm-title">Join our community</h2>
          <p className="hc-comm-sub">Connect with other organizers and get inspired.</p>
          <div className="hc-comm-grid">
            {COMMUNITY.map((c) => (
              <a key={c.name} href={c.href} className="hc-comm-card">
                <div className="hc-comm-icon" style={{ background: `${c.color}20` }}>
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                </div>
                <div>
                  <p className="hc-comm-name">{c.name}</p>
                  <p className="hc-comm-desc">{c.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}