// src/components/helpCenter/FeaturedGuides.tsx
import { RiArrowRightLine, RiBookOpenLine } from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

const GUIDES = [
  {
    tag: 'GUIDE',
    tagColor: '#0dc75e',
    image: '/images/help-guide-create-event.jpg',
    title: 'How to Create Your First Event',
    desc: 'Learn every step from event setup to publishing and selling tickets.',
    link: '#',
    type: 'Read guide',
  },
  {
    tag: 'GUIDE',
    tagColor: '#0dc75e',
    image: '/images/help-guide-qr-checkin.jpg',
    title: 'How QR Check-In Works',
    desc: 'Speed up entry and create a better attendee experience.',
    link: '#',
    type: 'Read guide',
  },
  {
    tag: 'GUIDE',
    tagColor: '#0dc75e',
    image: '/images/help-guide-payouts.jpg',
    title: 'Understanding Your Payouts',
    desc: 'Learn about payout schedules, fees and payment methods.',
    link: '#',
    type: 'Read guide',
  },
  {
    tag: 'TUTORIAL',
    tagColor: '#8B5CF6',
    image: '/images/help-guide-email.jpg',
    title: 'How to Send Event Emails',
    desc: 'Step-by-step guide to sending emails to your attendees.',
    link: '#',
    type: 'Watch tutorial',
  },
  {
    tag: 'GUIDE',
    tagColor: '#0dc75e',
    image: '/images/help-guide-tickets.jpg',
    title: 'Setting Up Ticket Types & Pricing',
    desc: 'Create ticket types, set prices and manage availability.',
    link: '#',
    type: 'Read guide',
  },
]

export default function FeaturedGuides() {
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-guides-section" ref={ref}>
      <style>{`
        .hc-guides-section {
          padding: 0 clamp(20px, 5%, 80px) 64px;
          max-width: 1280px; margin: 0 auto;
        }
        .hc-guides-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        .hc-guide-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; overflow: hidden;
          transition: border-color 0.25s, transform 0.25s;
          cursor: pointer; text-decoration: none; display: block;
        }
        .hc-guide-card:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-4px);
        }
        .hc-guide-img-wrap {
          position: relative; height: 130px; overflow: hidden;
          background: linear-gradient(135deg, rgba(13,199,94,0.06), rgba(6,13,26,0.9));
        }
        .hc-guide-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.4s ease;
        }
        .hc-guide-card:hover .hc-guide-img { transform: scale(1.05); }
        .hc-guide-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(6,13,26,0.7) 100%);
        }
        .hc-guide-tag {
          position: absolute; top: 10px; left: 10px;
          font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 999px;
          border: 1px solid currentColor;
        }
        .hc-guide-body { padding: 16px 16px 18px; }
        .hc-guide-title {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 13.5px; color: #fff; margin: 0 0 7px; line-height: 1.35;
        }
        .hc-guide-desc {
          font-family: 'Inter', sans-serif; font-size: 11.5px;
          color: rgba(255,255,255,0.42); line-height: 1.55;
          margin: 0 0 14px; font-weight: 400;
        }
        .hc-guide-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          color: #0dc75e; transition: gap 0.2s;
        }
        .hc-guide-card:hover .hc-guide-link { gap: 8px; }
        @media (max-width: 1100px) {
          .hc-guides-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 700px) {
          .hc-guides-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 440px) {
          .hc-guides-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hc-section-header hc-reveal">
        <h2 className="hc-section-title">Featured guides</h2>
        <a href="#" className="hc-view-all">View all guides <RiArrowRightLine size={14} /></a>
      </div>

      <div className="hc-guides-grid">
        {GUIDES.map((g, i) => (
          <a
            key={g.title}
            href={g.link}
            className="hc-guide-card hc-reveal"
            style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}
          >
            <div className="hc-guide-img-wrap">
              <img src={g.image} alt={g.title} className="hc-guide-img" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              <div className="hc-guide-img-overlay" />
              <span
                className="hc-guide-tag"
                style={{ color: g.tagColor, borderColor: g.tagColor, background: `${g.tagColor}18` }}
              >
                {g.tag}
              </span>
            </div>
            <div className="hc-guide-body">
              <h3 className="hc-guide-title">{g.title}</h3>
              <p className="hc-guide-desc">{g.desc}</p>
              <span className="hc-guide-link">
                <RiBookOpenLine size={13} /> {g.type} <RiArrowRightLine size={12} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}