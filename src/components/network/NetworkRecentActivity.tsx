import { UserPlus, ScanLine, GitBranch, Clock } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'registration' | 'checkin' | 'org-update'
  label: string
  sub: string
  time: string
}

interface Props {
  items: ActivityItem[]
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
  overflow: 'hidden',
}

const TYPE_META = {
  'registration': { icon: <UserPlus size={13} />,  color: '#818CF8' },
  'checkin':      { icon: <ScanLine size={13} />,  color: '#34D399' },
  'org-update':   { icon: <GitBranch size={13} />, color: '#6366F1' },
}

export default function NetworkRecentActivity({ items }: Props) {
  return (
    <div style={glass}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Clock size={14} color="rgba(255,255,255,0.35)" />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
          Recent Activity
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '36px 20px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No activity yet
        </div>
      ) : (
        items.map((item, i) => {
          const meta = TYPE_META[item.type]
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
              borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: `${meta.color}14`, border: `1px solid ${meta.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: meta.color,
              }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{item.time}</span>
            </div>
          )
        })
      )}
    </div>
  )
}