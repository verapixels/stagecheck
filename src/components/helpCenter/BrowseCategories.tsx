// src/components/helpCenter/BrowseCategories.tsx
import { useScrollReveal } from './helpCenter'
import {
  RiRocketLine,
  RiCalendarEventLine,
  RiTicket2Line,
  RiQrCodeLine,
  RiMoneyDollarCircleLine,
  RiMegaphoneLine,
  RiTeamLine,
  RiSettings3Line,
  RiArrowRightLine,
} from 'react-icons/ri'

const CATEGORIES = [
  {
    icon: RiRocketLine,
    color: '#0dc75e',
    title: 'Getting Started',
    desc: 'Learn the basics and set up your first event.',
    articles: 12,
  },
  {
    icon: RiCalendarEventLine,
    color: '#8B5CF6',
    title: 'Events',
    desc: 'Create, manage and customize your events.',
    articles: 24,
  },
  {
    icon: RiTicket2Line,
    color: '#F59E0B',
    title: 'Ticketing',
    desc: 'Ticket types, pricing, discounts and more.',
    articles: 18,
  },
  {
    icon: RiQrCodeLine,
    color: '#06B6D4',
    title: 'Check-In',
    desc: 'Scan tickets, manage entrances and check-in.',
    articles: 16,
  },
  {
    icon: RiMoneyDollarCircleLine,
    color: '#10B981',
    title: 'Payments & Payouts',
    desc: 'Payments, payouts, refunds and financial settings.',
    articles: 16,
  },
  {
    icon: RiMegaphoneLine,
    color: '#EC4899',
    title: 'Marketing',
    desc: 'Promote your event and grow your audience.',
    articles: 14,
  },
  {
    icon: RiTeamLine,
    color: '#F97316',
    title: 'Team & Roles',
    desc: 'Invite team members and manage permissions.',
    articles: 10,
  },
  {
    icon: RiSettings3Line,
    color: '#6366F1',
    title: 'Account & Settings',
    desc: 'Update your account and manage preferences.',
    articles: 11,
  },
]

export default function BrowseCategories() {
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-cat-section" ref={ref}>
      <style>{`
        .hc-cat-section {
          padding: 64px clamp(20px, 5%, 80px);
          max-width: 1280px; margin: 0 auto;
        }
        .hc-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px;
        }
        .hc-section-title {
          font-family: 'Fraunces', serif; font-weight: 800;
          font-size: clamp(1.1rem, 2.2vw, 1.45rem);
          color: #fff; margin: 0;
        }
        .hc-view-all {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          color: #0dc75e; text-decoration: none;
          transition: gap 0.2s;
        }
        .hc-view-all:hover { gap: 8px; }
        .hc-cat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .hc-cat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 22px 20px;
          cursor: pointer;
          transition: border-color 0.25s, transform 0.25s, background 0.25s;
          text-decoration: none; display: block;
        }
        .hc-cat-card:hover {
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-3px);
          background: rgba(255,255,255,0.05);
        }
        .hc-cat-icon-box {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          transition: transform 0.25s;
        }
        .hc-cat-card:hover .hc-cat-icon-box { transform: scale(1.08); }
        .hc-cat-title {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 14.5px; color: #fff; margin: 0 0 6px;
        }
        .hc-cat-desc {
          font-family: 'Inter', sans-serif; font-size: 12px;
          color: rgba(255,255,255,0.44); line-height: 1.55;
          margin: 0 0 14px; font-weight: 400;
        }
        .hc-cat-count {
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 5px;
          transition: gap 0.2s;
        }
        .hc-cat-card:hover .hc-cat-count { gap: 8px; }

        /* staggered reveal */
        .hc-cat-card.hc-reveal { transition-delay: var(--delay, 0ms); }

        @media (max-width: 1024px) {
          .hc-cat-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 700px) {
          .hc-cat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hc-cat-card { padding: 18px 16px; }
          .hc-cat-icon-box { margin: 0 auto 14px; }
          .hc-cat-title { text-align: center; }
          .hc-cat-desc { text-align: center; }
          .hc-cat-count { justify-content: center; }
        }
        @media (max-width: 420px) {
          .hc-cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hc-section-header hc-reveal">
        <h2 className="hc-section-title">Browse by category</h2>
        <a href="#" className="hc-view-all">View all categories <RiArrowRightLine size={14} /></a>
      </div>

      <div className="hc-cat-grid">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon
          return (
            <a
              key={cat.title}
              href="#"
              className="hc-cat-card hc-reveal"
              style={{ '--delay': `${i * 60}ms` } as React.CSSProperties}
            >
              <div
                className="hc-cat-icon-box"
                style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}28` }}
              >
                <Icon size={22} color={cat.color} />
              </div>
              <h3 className="hc-cat-title">{cat.title}</h3>
              <p className="hc-cat-desc">{cat.desc}</p>
              <span className="hc-cat-count" style={{ color: cat.color }}>
                {cat.articles} articles <RiArrowRightLine size={13} />
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}