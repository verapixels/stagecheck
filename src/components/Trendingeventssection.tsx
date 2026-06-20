// src/components/landing/TrendingEventsSection.tsx
//
// Event cards now match the AllEvents page's `ev-card` styling exactly
// (cover image with type badge + days badge, avatar stack, colored
// "Tickets" button) so the landing page and /events page look consistent.
// Used as-is on the landing page (with its own "What's on right now"
// header), and reused on the /events page with showHeader={false}.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiMapPinLine, RiTimeLine, RiTicketLine, RiCalendarEventLine,
  RiArrowRightUpLine, RiInformationLine,
} from 'react-icons/ri'

export interface TrendingEvent {
  id: string
  name: string
  dateLabel: string
  location: string
  time?: string
  coverImage?: string
  coverGradient?: string
  typeLabel?: string
  typeColor?: string
  attendingCount?: number
  /** Short 1-2 line event description, shown under the title like the /events page cards. */
  summary?: string
  /** Optional days-until-event badge text, e.g. "TODAY" / "3d left". Omit to hide. */
  daysBadge?: string
  daysBadgeColor?: string
  /** Optional list of attendee/artist avatar image URLs (shown stacked, max 3). */
  avatarImages?: string[]
}

interface TrendingEventsSectionProps {
  events: TrendingEvent[]
  loading?: boolean
  error?: string
  onGetTickets: (id: string) => void
  /** Overrides the default "What's on right now" heading. */
  title?: React.ReactNode
  /** Overrides the default subtitle copy under the heading. */
  subtitle?: string
  /** Set false to hide the heading + "See all events" button entirely
   *  (used on the /events page, which already has its own header). */
  showHeader?: boolean
  /** Max cards to render. Defaults to 12 for the landing page teaser. */
  limit?: number
}

const FALLBACK_AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b']

function TbaTooltip() {
  const [show, setShow] = useState(false)
  return (
    <span
      className="ev-tba-wrap"
      onMouseEnter={e => { e.stopPropagation(); setShow(true) }}
      onMouseLeave={e => { e.stopPropagation(); setShow(false) }}
      onClick={e => e.stopPropagation()}
    >
      <span className="ev-tba-ic"><RiInformationLine size={13} /></span>
      {show && <span className="ev-tba-tip">TBA = To Be Announced</span>}
    </span>
  )
}

export default function TrendingEventsSection({
  events,
  loading,
  error,
  onGetTickets,
  title,
  subtitle = "A rolling list of what's coming up — twelve at a time, freshest first.",
  showHeader = true,
  limit = 12,
}: TrendingEventsSectionProps) {
  const navigate = useNavigate()
  const shown = events.slice(0, limit)

  return (
    <>
      <style>{`
        .stg-events-sec { padding: clamp(56px,8vw,100px) clamp(16px,5%,80px); }
        .stg-events-head { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:32px; }
        .stg-events-title { font-family: var(--font-display); font-weight:700; font-size: clamp(26px,3.5vw,42px); }
        .stg-events-title .acc { color: var(--green); font-style: italic; }
        .stg-events-sub { color: rgba(255,255,255,0.62); font-size: 13.5px; margin-top: 8px; }

        .stg-events-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
        }
        @media (max-width: 1100px) { .stg-events-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 760px)  { .stg-events-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px)  { .stg-events-grid { grid-template-columns: 1fr !important; } }

        /* ── ev-card: matches AllEvents.tsx card styling exactly ── */
        .ev-card {
          border-radius:18px; overflow:hidden;
          background:var(--bg-card); border:1px solid var(--border);
          cursor:pointer; transition:transform .3s cubic-bezier(.16,1,.3,1), border-color .3s, box-shadow .3s;
          display:flex; flex-direction:column;
        }
        .ev-card:hover { transform:translateY(-7px) scale(1.01); border-color:rgba(13,199,94,.2); box-shadow:0 24px 52px rgba(0,0,0,.6), 0 0 0 1px rgba(13,199,94,.07); }
        .ev-cover {
          height:200px; position:relative; display:flex; flex-direction:column;
          justify-content:flex-end; padding:14px; background-size:cover; background-position:center;
        }
        .ev-cover-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.1) 55%); }
        .ev-type-badge {
          position:absolute; top:12px; left:12px; z-index:1;
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 10px; border-radius:20px; font-size:10px; font-weight:700;
          backdrop-filter:blur(12px); letter-spacing:.04em;
          background:rgba(0,0,0,0.62); border:1px solid rgba(255,255,255,0.18); color:#fff;
        }
        .ev-days-badge {
          position:absolute; top:12px; right:12px; z-index:1;
          padding:3px 8px; border-radius:7px; font-size:9px; font-weight:800;
          color:#fff; letter-spacing:.06em;
        }
        .ev-date-chip { position:absolute; bottom:42px; left:14px; z-index:1; font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.6); letter-spacing:.04em; }
        .ev-name { font-family:var(--font-display); font-weight:800; font-size:18px; color:#fff; line-height:1.15; position:relative; z-index:1; }
        .ev-body { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; gap:4px; }
        .ev-summary { font-size:12px; color:rgba(255,255,255,0.72); line-height:1.6; margin-bottom:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ev-meta-row { display:flex; align-items:center; gap:6px; font-size:11.5px; color:rgba(255,255,255,0.78); }
        .ev-tba-wrap { position: relative; display: inline-flex; align-items: center; }
        .ev-tba-ic { display: inline-flex; align-items: center; color: rgba(255,255,255,0.5); cursor: help; margin-left: 2px; }
        .ev-tba-tip {
          position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
          background: #0c1626; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
          padding: 7px 11px; font-size: 11px; color: rgba(255,255,255,0.85); white-space: nowrap;
          box-shadow: 0 10px 28px rgba(0,0,0,.5); z-index: 5; pointer-events: none;
        }
        .ev-tba-tip::after {
          content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          border: 5px solid transparent; border-top-color: #0c1626;
        }
        .ev-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
        .ev-avatars { display:flex; align-items:center; gap:6px; }
        .ev-av { width:22px; height:22px; border-radius:50%; border:2px solid var(--bg-card); display:inline-block; overflow:hidden; }
        .ev-av-count { font-size:11px; color:var(--muted); margin-left:4px; }
        .ev-btn {
          display:inline-flex; align-items:center; gap:5px; padding:7px 14px;
          border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;
          background:var(--tc); border:none; color:#000; font-family:var(--font-body);
          transition:all .2s;
        }
        .ev-btn:hover { filter:brightness(1.15); transform:translateY(-1px); box-shadow:0 5px 16px color-mix(in srgb,var(--tc) 35%,transparent); }

        .stg-events-empty { grid-column: 1/-1; text-align:center; padding: 60px 0; color: rgba(255,255,255,0.6); font-size: 14px; }
      `}</style>

      <section id="events" className="stg-events-sec">
        {showHeader && (
          <div className="stg-events-head">
            <div>
              <h2 className="stg-events-title">
                {title ?? <>What's <span className="acc">on</span> right now</>}
              </h2>
              <p className="stg-events-sub">{subtitle}</p>
            </div>
            <button className="btn-pill" onClick={() => navigate('/events')}>
              See all events <span className="pill-arrow"><RiArrowRightUpLine size={14} /></span>
            </button>
          </div>
        )}

        <div className="stg-events-grid">
          {loading ? (
            <div className="stg-events-empty">Loading events…</div>
          ) : error ? (
            <div className="stg-events-empty">{error}</div>
          ) : shown.length === 0 ? (
            <div className="stg-events-empty">
              <RiCalendarEventLine size={28} />
              <div style={{ marginTop: 10 }}>No upcoming events yet.</div>
            </div>
          ) : (
            shown.map(ev => {
              const typeColor = ev.typeColor || '#0dc75e'
              const avatars = ev.avatarImages || []
              const isTBA = ev.location?.trim().toUpperCase() === 'TBA'
              return (
                <div key={ev.id} className="ev-card" onClick={() => navigate(`/event/${ev.id}`)}>
                  <div className="ev-cover" style={{
                    background: ev.coverImage ? undefined : (ev.coverGradient || 'linear-gradient(160deg,#0a1628,#1e3a5f)'),
                    backgroundImage: ev.coverImage ? `url(${ev.coverImage})` : undefined,
                  }}>
                    <div className="ev-cover-overlay" />
                    {ev.typeLabel && (
                      <div className="ev-type-badge">{ev.typeLabel}</div>
                    )}
                    {ev.daysBadge && (
                      <div className="ev-days-badge" style={{ background: ev.daysBadgeColor || '#0dc75e' }}>
                        {ev.daysBadge}
                      </div>
                    )}
                    <div className="ev-date-chip">{ev.dateLabel}</div>
                    <h3 className="ev-name">{ev.name}</h3>
                  </div>
                  <div className="ev-body">
                    {ev.summary && <p className="ev-summary">{ev.summary}</p>}
                    <div className="ev-meta-row">
                      <RiMapPinLine size={12} />
                      <span>{ev.location}</span>
                      {isTBA && <TbaTooltip />}
                    </div>
                    {ev.time && (
                      <div className="ev-meta-row">
                        <RiTimeLine size={12} />
                        <span>{ev.time}</span>
                      </div>
                    )}
                    <div className="ev-footer">
                      <div className="ev-avatars">
                        {Array.from({ length: 3 }, (_, i) => {
                          const img = avatars[i]
                          return img ? (
                            <span key={i} className="ev-av" style={{ marginLeft: i ? -8 : 0, zIndex: 3 - i, background: FALLBACK_AVATAR_COLORS[i] }}>
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            </span>
                          ) : (
                            <span key={i} className="ev-av" style={{ background: FALLBACK_AVATAR_COLORS[i], marginLeft: i ? -8 : 0, zIndex: 3 - i }} />
                          )
                        })}
                        <span className="ev-av-count">
                          {ev.attendingCount ? `${ev.attendingCount}+ attending` : 'Be first'}
                        </span>
                      </div>
                      <button className="ev-btn" style={{ '--tc': typeColor } as React.CSSProperties} onClick={e => { e.stopPropagation(); onGetTickets(ev.id) }}>
                        <RiTicketLine size={12} /> Tickets
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </>
  )
}