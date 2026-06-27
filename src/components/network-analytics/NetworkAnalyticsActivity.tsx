import { ScanLine, Ticket, UserPlus, Sparkles, Bell } from 'lucide-react'

// ── Check-in Timeline ─────────────────────────────────────────────────────────

interface TimelineEntry {
  hour: string
  count: number
}

interface CheckinTimelineProps {
  data: TimelineEntry[]
}

export function CheckinTimeline({ data }: CheckinTimelineProps) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
          Check-in Timeline
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          Today
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((entry, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 52, flexShrink: 0 }}>{entry.hour}</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((entry.count / max) * 100)}%`,
                background: 'linear-gradient(90deg, #6366F1, #22C55E)',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 16, textAlign: 'right' }}>{entry.count}</span>
          </div>
        ))}
        {data.length === 0 && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0' }}>
            No check-ins recorded yet
          </div>
        )}
      </div>
    </div>
  )
}

// ── Recent Activity ───────────────────────────────────────────────────────────

interface ActivityItem {
  type: 'checkin' | 'ticket' | 'registration'
  name: string
  detail: string
  time: string
  initials: string
}

interface RecentActivityProps {
  items: ActivityItem[]
}

const activityIcon = (type: ActivityItem['type']) => {
  if (type === 'checkin') return { icon: <ScanLine size={12} />, color: '#22C55E', bg: 'rgba(34,197,94,0.15)' }
  if (type === 'ticket') return { icon: <Ticket size={12} />, color: '#818CF8', bg: 'rgba(129,140,248,0.15)' }
  return { icon: <UserPlus size={12} />, color: '#6366F1', bg: 'rgba(99,102,241,0.15)' }
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Recent Activity</div>
        <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          View All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => {
          const { icon, color, bg } = activityIcon(item.type)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, #6366F1, #22C55E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {item.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.detail}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  {icon}
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0' }}>
            No recent activity yet
          </div>
        )}
      </div>
    </div>
  )
}

// ── AI Insights ───────────────────────────────────────────────────────────────

interface InsightItem {
  text: string
  type: 'info' | 'warn' | 'good' | 'tip'
}

interface AIInsightsProps {
  insights: InsightItem[]
  recommendation?: string
  onSendReminder?: () => void
}

const insightDot = (type: InsightItem['type']) => {
  if (type === 'info') return '#818CF8'
  if (type === 'warn') return '#F59E0B'
  if (type === 'good') return '#22C55E'
  return '#14B8A6'
}

export function AIInsights({ insights, recommendation, onSendReminder }: AIInsightsProps) {
  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Sparkles size={16} color="#818CF8" />
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>AI Insights</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {insights.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: insightDot(item.type), flexShrink: 0, marginTop: 4 }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
        {insights.length === 0 && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Gathering data to generate insights...</div>
        )}
      </div>

      {recommendation && (
        <div style={{
          background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, padding: '10px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
            <span style={{ color: '#22C55E', marginTop: 1 }}><Sparkles size={13} /></span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              <strong style={{ color: '#22C55E' }}>Recommendation:</strong> {recommendation}
            </span>
          </div>
          {onSendReminder && (
            <button
              onClick={onSendReminder}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#22C55E', border: 'none', borderRadius: 8,
                padding: '6px 12px', fontSize: 12, color: '#000', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Bell size={12} /> Send Reminder
            </button>
          )}
        </div>
      )}
    </div>
  )
}