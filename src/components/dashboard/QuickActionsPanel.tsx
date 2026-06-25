// src/components/dashboard/QuickActionsPanel.tsx
import { useNavigate } from 'react-router-dom'

const actions = [
  {
    label: 'Browse Events',
    description: 'Discover amazing events',
    to: '/events',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
    ),
  },
  {
    label: 'Create Event',
    description: 'Start planning your event',
    to: '/onboarding',
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M12 14v4m-2-2h4"/>
      </svg>
    ),
  },
  {
    label: 'Become a Sub Admin',
    description: 'Have an invitation link?',
    to: '/dashboard/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Help & Support',
    description: 'Get help when you need it',
    to: '/support',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
      </svg>
    ),
  },
]

export default function QuickActionsPanel() {
  const navigate = useNavigate()

  const handleClick = (action: typeof actions[0]) => {
    if (action.external) {
      window.open(action.to, '_blank', 'noopener,noreferrer')
    } else {
      navigate(action.to)
    }
  }

  return (
    <div style={{
      background: 'rgba(10, 14, 30, 0.7)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 22px 16px' }}>
        <h3 style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#fff',
          margin: 0,
        }}>
          Quick Actions
        </h3>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {actions.map(a => (
          <button
            key={a.label}
            onClick={() => handleClick(a)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            {/* Icon */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'rgba(13,199,94,0.1)',
              border: '1px solid rgba(13,199,94,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0dc75e',
              flexShrink: 0,
            }}>
              {a.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                marginBottom: 1,
              }}>
                {a.label}
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                fontFamily: 'Inter, sans-serif',
              }}>
                {a.description}
              </div>
            </div>

            {/* Chevron */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}