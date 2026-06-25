// src/components/dashboard/StatsCards.tsx
import { Link } from 'react-router-dom'

interface StatsCardsProps {
  ticketsBought: number
  savedCount: number
  upcomingCount: number
  invitationCount: number
  loading: boolean
}

const STATS = (props: StatsCardsProps) => [
  {
    label: 'Tickets Bought',
    value: props.ticketsBought,
    linkLabel: 'View all tickets',
    to: '/dashboard/tickets',
    iconBg: '#0dc75e18',
    iconBorder: '#0dc75e30',
    iconColor: '#0dc75e',
    linkColor: '#0dc75e',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
      </svg>
    ),
  },
  {
    label: 'Saved Events',
    value: props.savedCount,
    linkLabel: 'View saved events',
    to: '/dashboard/saved',
    iconBg: '#a855f718',
    iconBorder: '#a855f730',
    iconColor: '#a855f7',
    linkColor: '#a855f7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
    ),
  },
  {
    label: 'Upcoming Events',
    value: props.upcomingCount,
    linkLabel: 'View upcoming',
    to: '/dashboard/tickets',
    iconBg: '#3b82f618',
    iconBorder: '#3b82f630',
    iconColor: '#3b82f6',
    linkColor: '#3b82f6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Invitations',
    value: props.invitationCount,
    linkLabel: 'View invitations',
    to: '/dashboard/invitations',
    iconBg: '#f59e0b18',
    iconBorder: '#f59e0b30',
    iconColor: '#f59e0b',
    linkColor: '#f59e0b',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
]

export default function StatsCards(props: StatsCardsProps) {
  const stats = STATS(props)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
      }}
      className="stats-grid"
    >
      {stats.map(s => (
        <div
          key={s.label}
          style={{
            background: 'rgba(15, 20, 40, 0.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'border-color 0.2s',
          }}
        >
          {/* Icon */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: s.iconBg,
            border: `1px solid ${s.iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: s.iconColor,
          }}>
            {s.icon}
          </div>

          {/* Number */}
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}>
            {props.loading ? (
              <span style={{
                display: 'inline-block',
                width: 32,
                height: 8,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.1)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ) : s.value}
          </div>

          {/* Label */}
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Inter, sans-serif',
            marginTop: -8,
          }}>
            {s.label}
          </div>

          {/* Link */}
          <Link
            to={s.to}
            style={{
              fontSize: 12,
              color: s.linkColor,
              textDecoration: 'none',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: -4,
            }}
          >
            {s.linkLabel} →
          </Link>
        </div>
      ))}

      <style>{`
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 500px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}