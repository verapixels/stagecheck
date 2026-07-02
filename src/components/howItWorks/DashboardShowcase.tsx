// src/components/howItWorks/DashboardShowcase.tsx
import { useEffect, useRef, useState, useLayoutEffect, type FC } from 'react'
import {
  RiDashboardLine,
  RiTicket2Line,
  RiQrCodeLine,
  RiBarChartLine,
  RiBellLine,
  RiArrowDownSLine,
  RiArrowUpLine,
  RiWalletLine,
  RiCheckboxCircleLine,
  RiGroupLine,
  RiCursorLine,
  RiOrganizationChart,
  RiUserSettingsLine,
  RiCalendarEventLine,
  RiTeamLine,
} from 'react-icons/ri'

/* ── Tab definitions ──────────────────────────────────────────── */
const TABS = [
  { key: 'dashboard', label: 'Overview', icon: RiDashboardLine },
  { key: 'tickets', label: 'Tickets', icon: RiTicket2Line },
  { key: 'checkin', label: 'Check-in', icon: RiQrCodeLine },
  { key: 'analytics', label: 'Analytics', icon: RiBarChartLine },
] as const

type TabKey = typeof TABS[number]['key']

const STEP_DURATION = 4200
const CURSOR_TRAVEL = 680
const CLICK_PULSE = 340

/* ── Panels ───────────────────────────────────────────────────── */
function DashboardPanel() {
  const points = [55, 110, 78, 145, 98, 178, 140, 205, 168, 224]
  const max = Math.max(...points)
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100
      const y = 100 - (p / max) * 80
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className="hiw-panel">
      <div className="hiw-panel-head">
        <span>Event Overview</span>
        <span className="hiw-panel-pill">This Month <RiArrowDownSLine size={13} /></span>
      </div>
      <div className="hiw-stat-row">
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Tickets Sold</span>
          <span className="hiw-stat-val">3,847</span>
          <span className="hiw-stat-delta up"><RiArrowUpLine size={11} /> 32%</span>
        </div>
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Revenue</span>
          <span className="hiw-stat-val">₦6.2M</span>
          <span className="hiw-stat-delta up"><RiArrowUpLine size={11} /> 24%</span>
        </div>
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Checked In</span>
          <span className="hiw-stat-val">2,901</span>
          <span className="hiw-stat-delta neutral">75.4%</span>
        </div>
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Remaining</span>
          <span className="hiw-stat-val">946</span>
          <span className="hiw-stat-delta neutral">24.6%</span>
        </div>
      </div>
      <div className="hiw-chart-box">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="hiw-chart-svg">
          <defs>
            <linearGradient id="hiwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0dc75e" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0dc75e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#hiwGrad)" />
          <path d={path} fill="none" stroke="#0dc75e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function TicketsPanel() {
  const rows = [
    { name: 'Regular', sold: 2140, total: 2500, price: '₦5,000', color: '#22C55E' },
    { name: 'VIP', sold: 1480, total: 1800, price: '₦20,000', color: '#8B5CF6' },
    { name: 'VVIP', sold: 227, total: 250, price: '₦65,000', color: '#F59E0B' },
  ]
  return (
    <div className="hiw-panel">
      <div className="hiw-panel-head">
        <span>Ticket Types</span>
        <span className="hiw-panel-pill"><RiTicket2Line size={12} /> 4,550 sold</span>
      </div>
      <div className="hiw-stat-row" style={{ marginBottom: 14 }}>
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Ticket Types</span>
          <span className="hiw-stat-val">5</span>
        </div>
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Sold / Cap</span>
          <span className="hiw-stat-val">3,847 / 4,550</span>
        </div>
        <div className="hiw-stat-box">
          <span className="hiw-stat-label">Fill Rate</span>
          <span className="hiw-stat-val">84.5%</span>
        </div>
      </div>
      <div className="hiw-table">
        <div className="hiw-table-row hiw-table-head">
          <span>Type</span><span>Progress</span><span>Price</span>
        </div>
        {rows.map((r) => (
          <div className="hiw-table-row" key={r.name}>
            <span className="hiw-row-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block', flexShrink: 0 }} />
              {r.name}
            </span>
            <span>
              <div className="hiw-bar-track">
                <div className="hiw-bar-fill" style={{ width: `${(r.sold / r.total) * 100}%`, background: r.color }} />
              </div>
              <span className="hiw-bar-text">{r.sold.toLocaleString()}/{r.total.toLocaleString()}</span>
            </span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 11 }}>{r.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CheckinPanel() {
  return (
    <div className="hiw-panel hiw-panel-center">
      <div className="hiw-panel-head" style={{ width: '100%' }}>
        <span>Check-in Station</span>
        <span className="hiw-panel-pill"><RiGroupLine size={12} /> 2,901 in</span>
      </div>
      <div className="hiw-checkin-grid">
        <div className="hiw-qr-box">
          <div className="hiw-qr-frame">
            <div className="hiw-qr-corner tl" />
            <div className="hiw-qr-corner tr" />
            <div className="hiw-qr-corner bl" />
            <div className="hiw-qr-corner br" />
            <div className="hiw-qr-fake">
              {Array.from({ length: 49 }).map((_, i) => (
                <span key={i} style={{ opacity: Math.random() > 0.42 ? 1 : 0.1 }} />
              ))}
            </div>
          </div>
          <p className="hiw-qr-caption">Scan QR Code</p>
          <div className="hiw-qr-or">OR</div>
          <div className="hiw-ticket-input">Enter ticket code</div>
        </div>
        <div className="hiw-checkin-feed">
          <div className="hiw-feed-label">Recent Check-ins</div>
          {['Adaeze Okonkwo', 'Tunde Balogun', 'Chiamaka Nwosu', 'Ibrahim Hassan'].map((name, i) => (
            <div className="hiw-feed-row" key={name} style={{ animationDelay: `${i * 0.14}s` }}>
              <div className="hiw-feed-avatar">{name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>VIP Ticket</div>
              </div>
              <RiCheckboxCircleLine size={15} color="#0dc75e" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalyticsPanel() {
  const bars = [52, 68, 44, 85, 61, 96, 74]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <div className="hiw-panel">
      <div className="hiw-panel-head">
        <span>Sales Analytics</span>
        <span className="hiw-panel-pill"><RiWalletLine size={12} /> ₦6.2M total</span>
      </div>
      <div className="hiw-bars-row">
        {bars.map((h, i) => (
          <div className="hiw-bar-col" key={i}>
            <div className="hiw-bar-vert" style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }} />
            <span className="hiw-bar-day">{days[i]}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div className="hiw-stat-box" style={{ flex: 1 }}>
          <span className="hiw-stat-label">Avg. Order</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>₦18,400</span>
        </div>
        <div className="hiw-stat-box" style={{ flex: 1 }}>
          <span className="hiw-stat-label">Conversion</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: '#0dc75e' }}>68.3%</span>
        </div>
      </div>
      <div className="hiw-insight-row">
        <RiArrowUpLine size={13} color="#0dc75e" />
        <span>Saturday sales are up 41% vs last week</span>
      </div>
    </div>
  )
}

const PANELS: Record<TabKey, FC> = {
  dashboard: DashboardPanel,
  tickets: TicketsPanel,
  checkin: CheckinPanel,
  analytics: AnalyticsPanel,
}

const ALL_NAV = [
  { label: 'Dashboard', icon: RiDashboardLine },
  { label: 'Events', icon: RiCalendarEventLine },
  { label: 'Overview', icon: RiOrganizationChart },
  { label: 'Registrations', icon: RiGroupLine },
  { label: 'Tickets', icon: RiTicket2Line },
  { label: 'Check-in', icon: RiQrCodeLine },
  { label: 'Analytics', icon: RiBarChartLine },
  { label: 'Team', icon: RiTeamLine },
]

/* ── Main component ───────────────────────────────────────────── */
export default function DashboardShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ top: number; left: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const measureCursor = (index: number) => {
    const container = containerRef.current
    const target = tabRefs.current[index]
    if (!container || !target) return
    const cRect = container.getBoundingClientRect()
    const tRect = target.getBoundingClientRect()
    setCursorPos({
      top: tRect.top - cRect.top + tRect.height / 2 - 14,
      left: tRect.left - cRect.left + 28,
    })
  }

  useLayoutEffect(() => {
    measureCursor(0)
    const onResize = () => measureCursor(activeIndex)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let clickTimer: ReturnType<typeof setTimeout>
    let fadeOutTimer: ReturnType<typeof setTimeout>
    let fadeInTimer: ReturnType<typeof setTimeout>
    let nextTimer: ReturnType<typeof setTimeout>

    measureCursor(activeIndex)

    clickTimer = setTimeout(() => {
      setClicking(true)
      setTimeout(() => setClicking(false), CLICK_PULSE)
    }, CURSOR_TRAVEL)

    fadeOutTimer = setTimeout(() => { setFading(true) }, CURSOR_TRAVEL + 60)

    fadeInTimer = setTimeout(() => {
      setDisplayIndex(activeIndex)
      setFading(false)
    }, CURSOR_TRAVEL + 60 + 280)

    nextTimer = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % TABS.length)
    }, STEP_DURATION)

    return () => {
      clearTimeout(clickTimer); clearTimeout(fadeOutTimer)
      clearTimeout(fadeInTimer); clearTimeout(nextTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  // map tab index to sidebar nav index
  const activeNavMap: Record<number, number> = { 0: 0, 1: 4, 2: 5, 3: 6 }
  const activeNavIndex = activeNavMap[displayIndex] ?? 0

  const ActivePanel = PANELS[TABS[displayIndex].key]

  return (
    <section className="hiw-showcase-section">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,800;0,900;1,700&display=swap');

        .hiw-showcase-section {
          padding: 0 clamp(16px, 4%, 48px) 60px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hiw-showcase-label {
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0dc75e;
          margin-bottom: 12px;
        }
        .hiw-showcase-heading {
          text-align: center;
          font-family: 'Fraunces', serif;
          font-weight: 800;
          font-size: clamp(1.5rem, 3vw, 2.1rem);
          color: #fff;
          margin: 0 0 32px;
          line-height: 1.15;
        }
        .hiw-mock-shell {
          position: relative;
          background: #0a0f1c;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,199,94,0.06);
        }
        .hiw-mock-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(6, 10, 22, 0.8);
        }
        .hiw-mock-brand {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Fraunces', serif; font-weight: 800; color: #fff; font-size: 15px;
        }
        .hiw-mock-brand-dot {
          width: 20px; height: 20px; border-radius: 7px; background: #0dc75e;
          display: flex; align-items: center; justify-content: center;
        }
        .hiw-mock-topright { display: flex; align-items: center; gap: 14px; }
        .hiw-mock-bell { color: rgba(255,255,255,0.45); }
        .hiw-mock-user {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #fff;
        }
        .hiw-mock-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(13,199,94,0.15); color: #0dc75e;
          font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(13,199,94,0.3);
        }

        .hiw-mock-body { display: flex; min-height: 400px; }
        .hiw-mock-sidebar {
          width: 178px; flex-shrink: 0;
          border-right: 1px solid rgba(255,255,255,0.05);
          padding: 16px 10px;
          display: flex; flex-direction: column; gap: 2px;
          background: rgba(6,10,22,0.5);
        }
        .hiw-sidebar-section-label {
          font-family: 'Inter', sans-serif;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding: 10px 10px 5px;
          margin-top: 4px;
        }
        .hiw-sidebar-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 11px; border-radius: 9px;
          background: none; border: none; cursor: default;
          color: rgba(255,255,255,0.45);
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 500;
          transition: background .3s, color .3s;
          text-align: left; width: 100%;
        }
        .hiw-sidebar-item.active {
          background: rgba(13,199,94,0.12);
          color: #0dc75e;
          font-weight: 600;
        }
        .hiw-sidebar-item.main-active {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.8);
        }

        .hiw-mock-main { flex: 1; padding: 20px 22px; position: relative; min-width: 0; }

        .hiw-panel { animation: hiwFadeIn .35s ease; }
        .hiw-panel.fading { opacity: 0; transition: opacity .25s ease; }
        .hiw-panel:not(.fading) { opacity: 1; transition: opacity .25s ease; }
        .hiw-panel-center { display: flex; flex-direction: column; align-items: center; }

        .hiw-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 14px; color: #fff;
          margin-bottom: 14px;
        }
        .hiw-panel-pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px; padding: 4px 10px;
        }

        .hiw-stat-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .hiw-stat-box {
          flex: 1; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 11px;
          padding: 11px; display: flex; flex-direction: column; gap: 4px;
          min-width: 0;
        }
        .hiw-stat-label { font-family: 'Inter', sans-serif; font-size: 10px; color: rgba(255,255,255,0.38); font-weight: 500; }
        .hiw-stat-val { font-family: 'Fraunces', serif; font-weight: 800; font-size: 18px; color: #fff; }
        .hiw-stat-delta { font-size: 10px; display: flex; align-items: center; gap: 3px; font-family: 'Inter', sans-serif; font-weight: 600; }
        .hiw-stat-delta.up { color: #0dc75e; }
        .hiw-stat-delta.neutral { color: rgba(255,255,255,0.4); }

        .hiw-chart-box { height: 118px; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
        .hiw-chart-svg { width: 100%; height: 100%; }

        .hiw-table { display: flex; flex-direction: column; gap: 5px; }
        .hiw-table-row {
          display: grid; grid-template-columns: 1fr 1.5fr 0.7fr;
          align-items: center; gap: 8px;
          padding: 9px 10px; border-radius: 9px;
          background: rgba(255,255,255,0.02);
          font-family: 'Inter', sans-serif; font-size: 11px; color: rgba(255,255,255,0.55);
        }
        .hiw-table-head { color: rgba(255,255,255,0.3); font-size: 9.5px; text-transform: uppercase; letter-spacing: .07em; background: none; font-weight: 600; }
        .hiw-row-name { color: #fff; font-weight: 600; font-size: 11.5px; }
        .hiw-bar-track { height: 5px; border-radius: 4px; background: rgba(255,255,255,0.07); overflow: hidden; margin-bottom: 3px; }
        .hiw-bar-fill { height: 100%; background: #0dc75e; border-radius: 4px; transition: width .6s ease; }
        .hiw-bar-text { font-size: 10px; color: rgba(255,255,255,0.38); font-family: 'Inter', sans-serif; }

        /* check-in */
        .hiw-checkin-grid { display: flex; gap: 22px; align-items: flex-start; justify-content: center; width: 100%; flex-wrap: wrap; }
        .hiw-qr-box { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .hiw-qr-frame {
          position: relative;
          width: 118px; height: 118px;
          display: flex; align-items: center; justify-content: center;
          padding: 8px; box-sizing: border-box;
        }
        .hiw-qr-corner {
          position: absolute; width: 16px; height: 16px;
          border-color: #0dc75e; border-style: solid;
        }
        .hiw-qr-corner.tl { top: 0; left: 0; border-width: 2.5px 0 0 2.5px; border-radius: 3px 0 0 0; }
        .hiw-qr-corner.tr { top: 0; right: 0; border-width: 2.5px 2.5px 0 0; border-radius: 0 3px 0 0; }
        .hiw-qr-corner.bl { bottom: 0; left: 0; border-width: 0 0 2.5px 2.5px; border-radius: 0 0 0 3px; }
        .hiw-qr-corner.br { bottom: 0; right: 0; border-width: 0 2.5px 2.5px 0; border-radius: 0 0 3px 0; }
        .hiw-qr-fake {
          width: 88px; height: 88px;
          background: #fff; display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
          padding: 8px; box-sizing: border-box; border-radius: 4px;
        }
        .hiw-qr-fake span { background: #0a0f1c; border-radius: 1px; }
        .hiw-qr-caption { font-family: 'Inter', sans-serif; font-size: 11px; color: rgba(255,255,255,0.45); margin: 0; font-weight: 500; }
        .hiw-qr-or {
          font-family: 'Inter', sans-serif; font-size: 10px; color: rgba(255,255,255,0.25);
          font-weight: 600; letter-spacing: 0.08em;
        }
        .hiw-ticket-input {
          font-family: 'Inter', sans-serif; font-size: 10px; color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px; padding: 6px 12px;
        }
        .hiw-checkin-feed { display: flex; flex-direction: column; gap: 6px; min-width: 155px; }
        .hiw-feed-label {
          font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
          color: rgba(255,255,255,0.3); letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 4px;
        }
        .hiw-feed-row {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 11.5px; color: rgba(255,255,255,0.7);
          background: rgba(13,199,94,0.05); border: 1px solid rgba(13,199,94,0.12);
          border-radius: 9px; padding: 7px 9px;
          animation: hiwSlideIn .4s ease backwards;
        }
        .hiw-feed-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(13,199,94,0.15); color: #0dc75e;
          font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .hiw-bars-row { display: flex; align-items: flex-end; gap: 8px; height: 110px; margin-bottom: 12px; }
        .hiw-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
        .hiw-bar-vert {
          width: 100%; max-width: 26px; background: linear-gradient(180deg, #0dc75e, #0a9c4a);
          border-radius: 5px 5px 0 0; animation: hiwGrowBar .65s ease backwards;
        }
        .hiw-bar-day { font-family: 'Inter', sans-serif; font-size: 9px; color: rgba(255,255,255,0.3); font-weight: 500; }
        .hiw-insight-row {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inter', sans-serif; font-size: 11.5px; color: rgba(255,255,255,0.6);
          background: rgba(13,199,94,0.06); border: 1px solid rgba(13,199,94,0.14);
          border-radius: 10px; padding: 10px 12px; font-weight: 500;
        }

        /* fake cursor — bigger & bolder */
        .hiw-fake-cursor {
          position: absolute;
          z-index: 20;
          pointer-events: none;
          transition: top ${CURSOR_TRAVEL}ms cubic-bezier(.65,0,.35,1), left ${CURSOR_TRAVEL}ms cubic-bezier(.65,0,.35,1);
          filter: drop-shadow(0 3px 8px rgba(0,0,0,0.7));
        }
        .hiw-cursor-arrow {
          display: block;
          transform: rotate(-8deg);
        }
        .hiw-click-ripple {
          position: absolute; top: -14px; left: -14px;
          width: 34px; height: 34px; border-radius: 50%;
          border: 2.5px solid #0dc75e;
          opacity: 0; transform: scale(0.4);
        }
        .hiw-fake-cursor.clicking .hiw-click-ripple {
          animation: hiwRipple ${CLICK_PULSE}ms ease-out;
        }

        @keyframes hiwRipple {
          0% { opacity: 0.9; transform: scale(0.4); }
          100% { opacity: 0; transform: scale(2.4); }
        }
        @keyframes hiwFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hiwSlideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes hiwGrowBar { from { height: 0%; } }

        @media (max-width: 720px) {
          .hiw-mock-sidebar { width: 50px; padding: 14px 6px; }
          .hiw-sidebar-item span, .hiw-sidebar-section-label, .hiw-mock-user span { display: none; }
          .hiw-sidebar-item { justify-content: center; padding: 9px; }
          .hiw-stat-row { flex-wrap: wrap; }
          .hiw-stat-row .hiw-stat-box:nth-child(n+3) { display: none; }
          .hiw-mock-body { min-height: 440px; }
          .hiw-checkin-grid { flex-direction: column; align-items: center; }
        }
      `}</style>

      <p className="hiw-showcase-label">Built for organizers</p>
      <h2 className="hiw-showcase-heading">All the tools you need, in one place.</h2>

      <div className="hiw-mock-shell" ref={containerRef}>
        {/* top bar */}
        <div className="hiw-mock-topbar">
          <div className="hiw-mock-brand">
            <div className="hiw-mock-brand-dot">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 10H1L6 1Z" fill="white" />
              </svg>
            </div>
            StageCheck
          </div>
          <div className="hiw-mock-topright">
            <RiBellLine size={16} className="hiw-mock-bell" />
            <div className="hiw-mock-user">
              <div className="hiw-mock-avatar">VE</div>
              <span>Vibes Events</span>
              <RiArrowDownSLine size={13} color="rgba(255,255,255,0.3)" />
            </div>
          </div>
        </div>

        {/* body */}
        <div className="hiw-mock-body">
          {/* sidebar */}
          <div className="hiw-mock-sidebar">
            <div className="hiw-sidebar-section-label">Main</div>
            {ALL_NAV.slice(0, 2).map((nav, i) => {
              const Icon = nav.icon
              return (
                <button key={nav.label} ref={i === -1 ? (el) => { tabRefs.current[i] = el } : undefined}
                  className={`hiw-sidebar-item ${i === 0 ? 'main-active' : ''}`}>
                  <Icon size={15} /><span>{nav.label}</span>
                </button>
              )
            })}
            <div className="hiw-sidebar-section-label">Network Tools</div>
            {ALL_NAV.slice(2).map((nav, rawI) => {
              const i = rawI + 2
              // tabRefs index: Overview→0, Registrations→skip, Tickets→1, Check-in→2, Analytics→3
              const refMap: Record<number, number> = { 2: 0, 4: 1, 5: 2, 6: 3 }
              const refIdx = refMap[i]
              const Icon = nav.icon
              return (
                <button
                  key={nav.label}
                  ref={refIdx !== undefined ? (el) => { tabRefs.current[refIdx] = el } : undefined}
                  className={`hiw-sidebar-item ${i === activeNavIndex ? 'active' : ''}`}
                >
                  <Icon size={15} /><span>{nav.label}</span>
                </button>
              )
            })}
          </div>

          {/* main panel */}
          <div className="hiw-mock-main">
            <div className={`hiw-panel ${fading ? 'fading' : ''}`}>
              <ActivePanel />
            </div>
          </div>

          {/* fake cursor — bigger SVG arrow */}
          {cursorPos && (
            <div
              className={`hiw-fake-cursor ${clicking ? 'clicking' : ''}`}
              style={{ top: cursorPos.top, left: cursorPos.left }}
            >
              <div className="hiw-click-ripple" />
              <svg
                className="hiw-cursor-arrow"
                width="28"
                height="34"
                viewBox="0 0 28 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 2L4 26L10 20L14 30L18 28L14 18H22L4 2Z"
                  fill="white"
                  stroke="#0a0f1c"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}