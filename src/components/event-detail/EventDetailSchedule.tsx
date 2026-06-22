// ─── EventDetailSchedule.tsx ─────────────────────────────────────────────────
// "Date & Time" card with a vertical dot-line schedule timeline below it.
// Matches screenshot: date + time row, "Doors open", then Event Schedule section.

import { RiTimeLine, RiCalendar2Line, RiRepeatLine } from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'
import { formatDate, formatTime } from './eventDetailHelpers'

interface Props {
  event: EventData
}

export default function EventDetailSchedule({ event }: Props) {
  const hasAgenda = (event.agenda || []).length > 0
  if (!hasAgenda && !event.date) return null

  return (
    <div className="ed-card" style={{ marginBottom: 14 }}>
      {/* ── Date & Time header */}
      <div className="ed-section-label">
        <RiCalendar2Line size={13} /> Date & Time
      </div>

      {/* Date row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 8,
      }}>
        <div className="ed-icon-box">
          <RiCalendar2Line size={15} color="var(--green)" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
          {formatDate(event.date)}
        </div>
      </div>

      {/* Time row */}
      {event.startTime && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: event.goodToKnow?.doorTime ? 6 : 0,
        }}>
          <div className="ed-icon-box">
            <RiTimeLine size={15} color="var(--green)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {formatTime(event.startTime)}
            {event.endTime ? ` (GMT+1)` : ''}
          </div>
        </div>
      )}

      {/* Doors open */}
      {event.goodToKnow?.doorTime && (
        <div style={{
          fontSize: 12, color: 'var(--text-tertiary)',
          marginLeft: 46, marginTop: 4, marginBottom: 4,
        }}>
          Doors open at {event.goodToKnow.doorTime}
        </div>
      )}

      {event.isRepeating && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: '#fbbf24', marginTop: 8, marginLeft: 46,
        }}>
          <RiRepeatLine size={12} /> Repeating event
        </div>
      )}

      {/* ── Event Schedule */}
      {hasAgenda && (
        <>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            marginTop: 18, marginBottom: 16,
          }} />
          <div className="ed-section-label">Event Schedule</div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {event.agenda!.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', gap: 14 }}>
                {/* Dot + line */}
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', width: 9,
                }}>
                  <div className="ed-sched-dot" />
                  {i < event.agenda!.length - 1 && (
                    <div className="ed-sched-line" />
                  )}
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  paddingBottom: i < event.agenda!.length - 1 ? 20 : 0,
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: 'var(--green)', marginBottom: 2,
                  }}>
                    {item.time || '—'}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: '#fff',
                    marginBottom: item.speaker ? 3 : 0,
                  }}>
                    {item.title}
                  </div>
                  {item.speaker && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {item.speaker}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}