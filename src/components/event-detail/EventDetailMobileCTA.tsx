// ─── EventDetailMobileCTA.tsx ─────────────────────────────────────────────────
// Sticky bottom bar: thumbnail + event name + price + "Get Tickets Now" button
// Matches screenshot exactly — slides up once user scrolls past hero

import { RiTicketLine, RiArrowRightLine } from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'

interface Props {
  event: EventData
  heroImg: string
  minPrice: number
  isFree: boolean
  visible: boolean
  onGetTickets: () => void
}

export default function EventDetailMobileCTA({
  event, heroImg, minPrice, isFree, visible, onGetTickets,
}: Props) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
      padding: '12px 16px 16px',
      background: 'rgba(6,8,16,0.97)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 14,
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.35s cubic-bezier(.16,1,.3,1)',
    }}>
      {/* Left: thumbnail + name + price */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 12, minWidth: 0, flex: 1,
      }}>
        {heroImg && (
          <img
            src={heroImg} alt=""
            style={{
              width: 44, height: 44, borderRadius: 10,
              objectFit: 'cover', flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {event.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {isFree ? 'Free' : `From ₦${minPrice.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Right: CTA button */}
      <button
        onClick={onGetTickets}
        className="btn-green"
        style={{ padding: '11px 20px', fontSize: 13, flexShrink: 0, borderRadius: 10 }}
      >
        <RiTicketLine size={15} />
        {isFree ? 'Register' : 'Get Tickets Now'}
        <RiArrowRightLine size={14} />
      </button>
    </div>
  )
}