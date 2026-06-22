// ─── EventDetailNavbar.tsx ────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import {
  RiArrowLeftLine, RiCheckLine, RiHeartLine, RiHeartFill,
  RiShareLine, RiSearchLine, RiBellLine,
  RiMapPinLine,
} from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'
import { getEventTypeLabel } from './eventDetailHelpers'

interface Props {
  event: EventData
  scrolled: boolean
  liked: boolean
  onLike: () => void
  onShare: () => void
  onGetTickets: () => void
}

export default function EventDetailNavbar({
  event, scrolled, liked, onLike, onShare, onGetTickets,
}: Props) {
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
      height: 'var(--nav-h)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px,4%,48px)',
      background: scrolled ? 'rgba(6,8,16,0.97)' : 'rgba(6,8,16,0.0)',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled
        ? '1px solid rgba(255,255,255,0.06)'
        : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>

      {/* Left: Logo + back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RiCheckLine size={17} color="#000" />
          </div>
          <span style={{
            fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px',
          }}>StageCheck</span>
        </div>
      </div>

      {/* Centre: search bar (desktop) */}
      <div className="ed-desktop" style={{
        flex: 1, maxWidth: 380, margin: '0 32px',
        display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 100, padding: '8px 16px', gap: 8,
      }}>
        <RiSearchLine size={14} color="rgba(255,255,255,0.3)" />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Search events, artists, venues…
        </span>
      </div>

      {/* Right: nav links + location + bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="ed-desktop" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#" className="ed-nav-link">Events</a>
          <a href="#" className="ed-nav-link">How It Works</a>
          <a href="#" className="ed-nav-link">Why StageCheck</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <a href="#" className="ed-nav-link">Resources</a>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>▾</span>
          </div>
        </div>

        {/* Location pill */}
        <div className="ed-desktop" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 100, padding: '7px 14px',
          cursor: 'pointer',
        }}>
          <RiMapPinLine size={13} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            Anywhere
          </span>
        </div>

        {/* Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <RiBellLine size={20} color="rgba(255,255,255,0.6)" />
          <div style={{
            position: 'absolute', top: -3, right: -3,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--green)',
            border: '1.5px solid var(--bg)',
          }} />
        </div>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.12)',
          overflow: 'hidden', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>👤</div>
        </div>
      </div>
    </nav>
  )
}