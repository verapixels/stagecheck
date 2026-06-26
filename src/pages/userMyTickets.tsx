// src/pages/MyTickets.tsx
import { useState, useMemo } from 'react'
import {
  Ticket, Clock, CheckCircle, XCircle, Search,
  MapPin, Calendar, Download, Share2, X, Copy, ChevronRight, ArrowLeft,
} from 'lucide-react'
import UserDashboardLayout from '../components/UserDashboardLayout'
import { useAuth } from '../context/Authcontext'
import { useUserTickets, type UserTicket } from '../lib/useUserTickets'
import { useUserInvitations } from '../lib/useUserInvitations'

type TabKey = 'all' | 'upcoming' | 'used' | 'cancelled'

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  upcoming:  { bg: 'rgba(13,199,94,0.15)',  color: '#0dc75e', label: 'Upcoming'  },
  used:      { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', label: 'Used'      },
  cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', label: 'Cancelled' },
}

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatMoney(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}
function formatPurchased(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' • ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  )
}

// ── QR code URL using the same service as your email template ────────────────
function buildQrUrl(ticket: UserTicket): string {
  const qrData = JSON.stringify({
    code: ticket.ticketNumber,
    event: ticket.eventName,
    attendee: ticket.attendeeName || '',
  })
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff&qzone=2&format=png`
}

// ── Download ticket as image ─────────────────────────────────────────────────
async function downloadTicketImage(ticket: UserTicket) {
  const qrUrl = buildQrUrl(ticket)

  // Draw on an off-screen canvas
  const W = 600, H = 780
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#060e1c'
  ctx.fillRect(0, 0, W, H)

  // Top green accent bar
  ctx.fillStyle = '#0dc75e'
  ctx.fillRect(0, 0, W, 5)

  // Card background
  ctx.fillStyle = '#0a1424'
  roundRect(ctx, 24, 24, W - 48, H - 48, 18)
  ctx.fill()

  // Border
  ctx.strokeStyle = 'rgba(13,199,94,0.3)'
  ctx.lineWidth = 1
  roundRect(ctx, 24, 24, W - 48, H - 48, 18)
  ctx.stroke()

  // Event name
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(ticket.eventName || 'Event', W / 2, 80)

  // Date & venue
  ctx.fillStyle = '#0dc75e'
  ctx.font = '13px Arial'
  ctx.fillText(
    `${formatDate(ticket.eventDate)}${ticket.eventTime ? ' · ' + ticket.eventTime : ''}`,
    W / 2, 108
  )
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '13px Arial'
  ctx.fillText(`${ticket.venue || ''}${ticket.city ? ', ' + ticket.city : ''}`, W / 2, 130)

  // Divider dashes
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.setLineDash([6, 4])
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(48, 150); ctx.lineTo(W - 48, 150); ctx.stroke()
  ctx.setLineDash([])

  // QR code (fetch as blob → image)
  try {
    const resp = await fetch(qrUrl)
    const blob = await resp.blob()
    const bmp  = await createImageBitmap(blob)
    const qrSize = 200
    const qrX = (W - qrSize) / 2
    const qrY = 168
    // White box behind QR
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 14)
    ctx.fill()
    ctx.drawImage(bmp, qrX, qrY, qrSize, qrSize)
  } catch {
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    roundRect(ctx, (W - 224) / 2, 168, 224, 224, 14)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '13px Arial'
    ctx.fillText('QR Code', W / 2, 282)
  }

  // Ticket number label
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '11px Arial'
  ctx.fillText('TICKET NUMBER', W / 2, 410)
  ctx.fillStyle = '#0dc75e'
  ctx.font = 'bold 18px Courier New, monospace'
  ctx.fillText(ticket.ticketNumber || '', W / 2, 434)

  // Divider dashes
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.setLineDash([6, 4])
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(48, 456); ctx.lineTo(W - 48, 456); ctx.stroke()
  ctx.setLineDash([])

  // Details grid
  const detailRows: [string, string][] = [
    ['Attendee',     ticket.attendeeName || ticket.eventName || '—'],
    ['Ticket Type',  ticket.ticketType   || '—'],
    ['Quantity',     `${ticket.quantity || 1} Ticket${(ticket.quantity || 1) !== 1 ? 's' : ''}`],
    ['Price Paid',   ticket.pricePaid ? formatMoney(ticket.pricePaid) : '—'],
    ['Order ID',     ticket.orderId        || '—'],
    ['Status',       (STATUS_COLORS[ticket.status]?.label) || ticket.status || '—'],
  ]

  let dy = 478
  for (const [label, value] of detailRows) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(label, 56, dy)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '500 13px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(value, W - 56, dy)
    dy += 28
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = '11px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('stagecheck.com.ng', W / 2, H - 36)

  // Download
  const link = document.createElement('a')
  link.download = `StageCheck-${ticket.ticketNumber || 'ticket'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MyTickets() {
  const { user } = useAuth()
  const { tickets, loading, upcoming, used, cancelled } = useUserTickets(user?.uid, user?.email ?? undefined)
  const { pending } = useUserInvitations(user?.uid, user?.email)

  const [activeTab, setActiveTab]   = useState<TabKey>('all')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<UserTicket | null>(null)
  const [copied, setCopied]         = useState(false)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [downloading, setDownloading]   = useState(false)

  const tabList: { key: TabKey; label: string }[] = [
    { key: 'all',       label: 'All'       },
    { key: 'upcoming',  label: 'Upcoming'  },
    { key: 'used',      label: 'Used'      },
    { key: 'cancelled', label: 'Cancelled' },
  ]
  const tabData: Record<TabKey, UserTicket[]> = { all: tickets, upcoming, used, cancelled }

  const filtered = useMemo(() => {
    const base = tabData[activeTab]
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(t =>
      t.eventName?.toLowerCase().includes(q) ||
      t.venue?.toLowerCase().includes(q) ||
      t.ticketNumber?.toLowerCase().includes(q),
    )
  }, [activeTab, tickets, search])

  const handleSelect = (t: UserTicket) => { setSelected(t); setMobileDetail(true) }
  const handleClose  = () => { setSelected(null); setMobileDetail(false) }

  const copyTicketNumber = (num: string) => {
    navigator.clipboard.writeText(num).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = async (ticket: UserTicket) => {
    setDownloading(true)
    try { await downloadTicketImage(ticket) }
    finally { setDownloading(false) }
  }

  const stats = [
    { icon: <Ticket size={20} />,      value: tickets.length,   label: 'Total',     color: '#0dc75e', bg: 'rgba(13,199,94,0.12)'   },
    { icon: <Clock size={20} />,       value: upcoming.length,  label: 'Upcoming',  color: '#a78bfa', bg: 'rgba(139,92,246,0.12)'  },
    { icon: <CheckCircle size={20} />, value: used.length,      label: 'Used',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
    { icon: <XCircle size={20} />,     value: cancelled.length, label: 'Cancelled', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  ]

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <style>{`
        /* ── Layout ─────────────────────────────────────── */
        .mt-wrapper {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 20px;
          /* Fix height so each col can scroll independently */
          display: flex;
          flex-direction: column;
        }
        .mt-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          /* Let the grid grow but cap it for scroll */
          min-height: 0;
          height: 580px;
        }
        .mt-list-col {
          border-right: 1px solid rgba(255,255,255,0.07);
          overflow-y: auto;
          overflow-x: hidden;
          min-width: 0;
        }
        .mt-detail-col {
          overflow-y: auto;
          background: rgba(0,0,0,0.15);
          min-width: 0;
        }

        /* ── Stats ──────────────────────────────────────── */
        .mt-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .mt-stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mt-stat-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* ── Tabs bar ────────────────────────────────────── */
        .mt-tabs-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 8px;
        }
        .mt-tabs {
          display: flex; gap: 2px;
          overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .mt-tabs::-webkit-scrollbar { display: none; }
        .tab-btn {
          background: none; border: none; cursor: pointer;
          padding: 10px 14px; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.45); transition: all 0.15s;
          white-space: nowrap; border-bottom: 2px solid transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .tab-btn.active  { color: #0dc75e; border-bottom-color: #0dc75e; }
        .tab-btn:hover:not(.active) { color: rgba(255,255,255,0.75); }

        /* ── Search ──────────────────────────────────────── */
        .mt-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 8px 14px;
        }
        .mt-search-input {
          background: none; border: none; outline: none;
          color: #fff; font-size: 13px;
          font-family: 'DM Sans', sans-serif; width: 100%; min-width: 0;
        }

        /* ── Ticket rows ─────────────────────────────────── */
        .ticket-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 12px; cursor: pointer;
          border: 1px solid transparent; transition: all 0.18s;
          margin: 0 8px 2px;
        }
        .ticket-row:hover  { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
        .ticket-row.active { background: rgba(13,199,94,0.06);  border-color: rgba(13,199,94,0.25);  }

        /* ── Action buttons ──────────────────────────────── */
        .action-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 8px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          font-size: 12px; font-weight: 500; cursor: pointer;
          transition: all 0.15s; flex-direction: column;
          font-family: 'DM Sans', sans-serif;
        }
        .action-btn:hover { background: rgba(255,255,255,0.09); }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-btn.primary {
          background: rgba(13,199,94,0.1);
          border-color: rgba(13,199,94,0.3);
          color: #0dc75e;
        }
        .action-btn.primary:hover { background: rgba(13,199,94,0.18); }

        /* ── Mobile overlay ──────────────────────────────── */
        .mt-mobile-detail { display: none; }

        /* ── Scrollbar styling ───────────────────────────── */
        .mt-list-col::-webkit-scrollbar,
        .mt-detail-col::-webkit-scrollbar { width: 4px; }
        .mt-list-col::-webkit-scrollbar-track,
        .mt-detail-col::-webkit-scrollbar-track { background: transparent; }
        .mt-list-col::-webkit-scrollbar-thumb,
        .mt-detail-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* ── Responsive ──────────────────────────────────── */
        @media (max-width: 900px) {
          .mt-grid { grid-template-columns: 1fr; height: auto; }
          .mt-detail-col { display: none; }
          .mt-list-col { height: 460px; border-right: none; }
          .mt-mobile-detail {
            display: block; position: fixed; inset: 0; z-index: 200;
            background: #060e1c; overflow-y: auto; padding: 16px;
            -webkit-overflow-scrolling: touch;
          }
          .mt-mobile-detail.hidden { display: none; }
        }

        @media (max-width: 700px) {
          .mt-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .mt-stat-card { padding: 12px 14px; gap: 10px; }
        }

        @media (max-width: 480px) {
          .mt-tabs-bar { flex-direction: column; align-items: stretch; padding: 8px 12px; gap: 8px; }
          .mt-search-wrap { width: 100%; }
          .ticket-row { padding: 10px 12px; gap: 10px; margin: 0 4px 2px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Ticket size={24} color="#0dc75e" />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', color: '#fff', margin: 0 }}>
            My Tickets
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
          View and manage all your event tickets in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-stats">
        {stats.map((s, i) => (
          <div key={i} className="mt-stat-card">
            <div className="mt-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', lineHeight: 1.1 }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main card wrapper */}
      <div className="mt-wrapper">
        {/* Tabs + Search */}
        <div className="mt-tabs-bar">
          <div className="mt-tabs">
            {tabList.map(t => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.key !== 'all' && (
                  <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>({tabData[t.key].length})</span>
                )}
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 0' }}>
            <div className="mt-search-wrap">
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input className="mt-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, lineHeight: 1 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="mt-grid">
          {/* Left: scrollable list */}
          <div className="mt-list-col">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
                    <div style={{ height: 11, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                {search ? 'No tickets match your search.' : 'No tickets here yet.'}
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 16px 4px', color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'DM Sans, sans-serif', letterSpacing: 0.5 }}>
                  {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                </div>
                {filtered.map(t => {
                  const sc      = STATUS_COLORS[t.status] || STATUS_COLORS.upcoming
                  const evDate  = t.eventDate ? new Date(t.eventDate) : null
                  const month   = evDate ? evDate.toLocaleDateString('en', { month: 'short' }).toUpperCase() : ''
                  const day     = evDate ? evDate.getDate() : ''
                  const weekday = evDate ? evDate.toLocaleDateString('en', { weekday: 'short' }).toUpperCase() : ''
                  return (
                    <div
                      key={t.id}
                      className={`ticket-row ${selected?.id === t.id ? 'active' : ''}`}
                      onClick={() => handleSelect(t)}
                    >
                      {t.eventImage ? (
                        <img src={t.eventImage} alt={t.eventName} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ticket size={20} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                      {evDate && (
                        <div style={{ textAlign: 'center', flexShrink: 0, width: 36 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#0dc75e', letterSpacing: 1 }}>{month}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{day}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>{weekday}</div>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Syne, sans-serif' }}>
                          {t.eventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2, overflow: 'hidden' }}>
                          <MapPin size={10} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.venue}{t.city ? `, ${t.city}` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          <Calendar size={10} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formatDate(t.eventDate)}{t.eventTime ? ` • ${t.eventTime}` : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                        <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                          {sc.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>#{t.ticketNumber}</span>
                        <ChevronRight size={13} color="rgba(255,255,255,0.25)" />
                      </div>
                    </div>
                  )
                })}
                <div style={{ height: 12 }} />
              </>
            )}
          </div>

          {/* Right: scrollable detail */}
          <div className="mt-detail-col">
            {!selected ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '60px 20px' }}>
                <Ticket size={40} strokeWidth={1} />
                <p style={{ fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Select a ticket to view details</p>
              </div>
            ) : (
              <TicketDetailPanel
                ticket={selected}
                onClose={handleClose}
                onCopy={copyTicketNumber}
                onDownload={handleDownload}
                copied={copied}
                downloading={downloading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile full-screen overlay */}
      <div className={`mt-mobile-detail ${!mobileDetail ? 'hidden' : ''}`}>
        {selected && (
          <>
            <button
              onClick={handleClose}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', padding: '0 0 16px 0', fontWeight: 500 }}
            >
              <ArrowLeft size={18} /> Back to tickets
            </button>
            <TicketDetailPanel
              ticket={selected}
              onClose={handleClose}
              onCopy={copyTicketNumber}
              onDownload={handleDownload}
              copied={copied}
              downloading={downloading}
            />
          </>
        )}
      </div>
    </UserDashboardLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail panel
// ─────────────────────────────────────────────────────────────────────────────

function TicketDetailPanel({ ticket, onClose, onCopy, onDownload, copied, downloading }: {
  ticket: UserTicket
  onClose: () => void
  onCopy: (n: string) => void
  onDownload: (t: UserTicket) => void
  copied: boolean
  downloading: boolean
}) {
  const s      = STATUS_COLORS[ticket.status] || STATUS_COLORS.upcoming
  const qrUrl  = buildQrUrl(ticket)

  const details: { label: string; value: string }[] = [
    { label: 'Attendee',        value: ticket.attendeeName || '—' },
    { label: 'Ticket Type',     value: ticket.ticketType   || '—' },
    { label: 'Quantity',        value: `${ticket.quantity || 1} Ticket${(ticket.quantity || 1) !== 1 ? 's' : ''}` },
    { label: 'Purchased On',    value: ticket.purchasedOn   ? formatPurchased(ticket.purchasedOn)   : '—' },
    { label: 'Order ID',        value: ticket.orderId       || '—' },
    { label: 'Payment Method',  value: ticket.paymentMethod || '—' },
    { label: 'Price Paid',      value: ticket.pricePaid     ? formatMoney(ticket.pricePaid) : '—' },
  ]

  return (
    <div style={{ padding: '20px' }}>
      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, letterSpacing: 0.3 }}>
          {s.label}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
          #{ticket.ticketNumber}
        </span>
      </div>

      {/* Event name */}
      <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'Syne, sans-serif', lineHeight: 1.3 }}>{ticket.eventName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
        <Calendar size={12} style={{ flexShrink: 0 }} />
        {formatDate(ticket.eventDate)}{ticket.eventTime ? ` • ${ticket.eventTime}` : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
        <MapPin size={12} style={{ flexShrink: 0 }} />
        {ticket.venue}{ticket.city ? `, ${ticket.city}` : ''}
      </div>

      {/* QR Code — always generated from ticket number */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 8 }}>
        <img
          src={qrUrl}
          alt="QR Code"
          width={200}
          height={200}
          style={{ width: 200, height: 200, display: 'block', borderRadius: 8 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div style={{ fontSize: 10, color: '#888', fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
          Scan at entrance
        </div>
      </div>

      {/* Ticket number + copy */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0dc75e', fontFamily: 'DM Sans, sans-serif', letterSpacing: 0.5 }}>
          #{ticket.ticketNumber}
        </span>
        <button
          onClick={() => onCopy(ticket.ticketNumber)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#0dc75e' : 'rgba(255,255,255,0.4)', padding: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}
        >
          <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#0dc75e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0dc75e', display: 'inline-block', flexShrink: 0 }} />
        Valid for entry
      </div>

      {/* Action buttons — 2 buttons only, no wallet */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        <button
          className="action-btn primary"
          onClick={() => onDownload(ticket)}
          disabled={downloading}
        >
          <Download size={16} />
          {downloading ? 'Generating…' : 'Download Ticket'}
        </button>
        <button className="action-btn" onClick={() => {
          if (navigator.share) {
            navigator.share({ title: ticket.eventName, text: `My ticket #${ticket.ticketNumber} for ${ticket.eventName}` })
          } else {
            onCopy(ticket.ticketNumber)
          }
        }}>
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 18 }} />

      {/* Ticket details */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, fontFamily: 'Syne, sans-serif' }}>Ticket Details</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'rgba(255,255,255,0.02)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {details.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, fontSize: 13, padding: '11px 14px', borderBottom: i < details.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', flexShrink: 0, fontSize: 12 }}>{d.label}</span>
            <span style={{ color: d.value === '—' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)', fontWeight: 500, textAlign: 'right', fontFamily: 'DM Sans, sans-serif', wordBreak: 'break-all', fontSize: 12 }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: '#60a5fa', flexShrink: 0, fontSize: 14 }}>ℹ</span>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
          Present your QR code at the entrance for scanning. Screenshots are not accepted.
        </p>
      </div>

      <div style={{ height: 20 }} />
    </div>
  )
}