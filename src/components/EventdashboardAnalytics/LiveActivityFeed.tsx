// src/components/EventAnalytics/LiveActivityFeed.tsx
import { Ticket, CheckCircle2, UserPlus, RotateCcw } from 'lucide-react'
import type { ActivityItem } from './Types'

interface Props {
  activity: ActivityItem[]
}

const ICONS: Record<ActivityItem['type'], { icon: React.ReactNode; color: string }> = {
  purchase: { icon: <Ticket size={14} />, color: '#22C55E' },
  checkin: { icon: <CheckCircle2 size={14} />, color: '#3B82F6' },
  registration: { icon: <UserPlus size={14} />, color: '#8B5CF6' },
  refund: { icon: <RotateCcw size={14} />, color: '#EF4444' },
}

function timeAgo(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function LiveActivityFeed({ activity }: Props) {
  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: '0 0 16px' }}>
        Live Activity
      </h3>

      {activity.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No recent activity.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 360, overflowY: 'auto' }}>
          {activity.map(a => {
            const meta = ICONS[a.type]
            return (
              <div key={a.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${meta.color}15`, border: `1px solid ${meta.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color,
                }}>
                  {meta.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{timeAgo(a.timestamp)}</div>
                  <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 600, lineHeight: 1.4 }}>{a.detail}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{a.eventName}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}