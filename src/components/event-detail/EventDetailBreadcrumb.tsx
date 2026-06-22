// ─── EventDetailBreadcrumb.tsx ────────────────────────────────────────────────
import type { EventData } from './eventDetailTypes'
import { getEventTypeLabel } from './eventDetailHelpers'

interface Props {
  event: EventData
}

export default function EventDetailBreadcrumb({ event }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 12, color: 'rgba(255,255,255,0.35)',
      padding: '12px clamp(16px,5%,64px)',
      marginTop: 'var(--nav-h)',
    }}>
      <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Home</a>
      <span>/</span>
      <a href="#" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Events</a>
      <span>/</span>
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>
        {getEventTypeLabel(event.eventType || '')}
      </span>
      <span>/</span>
      <span style={{
        color: 'rgba(255,255,255,0.85)',
        maxWidth: 200, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {event.name}
      </span>
    </div>
  )
}