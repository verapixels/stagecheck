// src/components/EventAnalytics/EventsNeedingAttention.tsx
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import type { EventStats } from './Types'

interface Props {
  stats: EventStats[]
}

interface Flag {
  eventId: string
  eventName: string
  severity: 'high' | 'medium'
  title: string
  detail: string
}

function buildFlags(stats: EventStats[]): Flag[] {
  const flags: Flag[] = []

  for (const s of stats) {
    if (s.event.status !== 'active') continue

    if (s.ticketCapacity > 0 && s.soldPercent < 25) {
      flags.push({
        eventId: s.event.id, eventName: s.event.name, severity: 'high',
        title: s.event.name,
        detail: `Only ${s.soldPercent}% of tickets sold. Promote this event.`,
      })
    } else if (s.registrations > 0 && s.checkInPercent < 40) {
      flags.push({
        eventId: s.event.id, eventName: s.event.name, severity: 'medium',
        title: s.event.name,
        detail: `Check in rate is lower than expected. Current check-in rate: ${s.checkInPercent}%`,
      })
    } else if (s.ticketsSold === 0) {
      flags.push({
        eventId: s.event.id, eventName: s.event.name, severity: 'medium',
        title: s.event.name,
        detail: 'No ticket sales yet. Consider a marketing push.',
      })
    }
  }

  return flags.slice(0, 5)
}

export default function EventsNeedingAttention({ stats }: Props) {
  const navigate = useNavigate()
  const flags = buildFlags(stats)

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>
          Events Needing Attention
        </h3>
      </div>

      {flags.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          All events are tracking well.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {flags.map((f, i) => {
            const color = f.severity === 'high' ? '#EF4444' : '#F59E0B'
            return (
              <div
                key={i}
                onClick={() => navigate(`/manage/event/${f.eventId}/analytics`)}
                style={{
                  display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  background: `${color}0D`, border: `1px solid ${color}30`,
                }}
              >
                {f.severity === 'high'
                  ? <AlertCircle size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                  : <AlertTriangle size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    {f.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}