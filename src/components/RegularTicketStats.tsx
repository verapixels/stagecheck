/* ─────────────────────────────────────────────────────────────
   RegularTicketStats.tsx
   Top stats cards row
───────────────────────────────────────────────────────────── */
import { Layers, BarChart2, TrendingUp, UserCheck, BadgeDollarSign, ShoppingCart } from 'lucide-react'
import { CARD, BORDER, TX1, TX2, TX3, fmtNaira } from '../pages/RegularTicket/RegularTicketTypes'
import type { TicketType, AddOn, Attendee } from '../pages/RegularTicket/RegularTicketTypes'

interface Props {
  tickets: TicketType[]
  addOns: AddOn[]
  attendees: Attendee[]
}

export default function RegularTicketStats({ tickets, addOns, attendees }: Props) {
  const totalSold    = tickets.reduce((s, t) => s + t.sold, 0)
  const totalCap     = tickets.reduce((s, t) => s + t.quantity, 0)
  const totalRev     = tickets.reduce((s, t) => s + (t.isFree ? 0 : t.price) * t.sold, 0)
  const checkedIn    = attendees.filter(a => a.checkedIn).length
  const fillRate     = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0
  const addonRev     = addOns.reduce((s, a) => s + (a.isFree ? 0 : a.price) * a.sold, 0)

  const stats = [
    {
      label: 'Ticket Types', value: String(tickets.length),
      sub: `+0 today`, icon: <Layers size={18} color="#818CF8" />,
      color: '#818CF8', bg: 'rgba(129,140,248,0.1)',
    },
    {
      label: 'Sold / Cap', value: `${totalSold} / ${totalCap}`,
      sub: `${fillRate}% capacity`, icon: <BarChart2 size={18} color="#22C55E" />,
      color: '#22C55E', bg: 'rgba(34,197,94,0.1)',
      bar: { pct: fillRate, color: '#22C55E' },
    },
    {
      label: 'Checked In', value: `${checkedIn}`,
      sub: `${attendees.length > 0 ? Math.round((checkedIn / attendees.length) * 100) : 0}% of sold`,
      icon: <UserCheck size={18} color="#06B6D4" />,
      color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',
    },
    {
      label: 'Fill Rate', value: `${fillRate}%`,
      sub: `+12% from yesterday`, icon: <TrendingUp size={18} color="#60A5FA" />,
      color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',
    },
    {
      label: 'Total Revenue', value: fmtNaira(totalRev + addonRev),
      sub: `+18% from yesterday`, icon: <BadgeDollarSign size={18} color="#FBBF24" />,
      color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',
    },
  ]

  return (
    <>
      <div className="rt-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="rt-stat-card" style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: '18px 20px',
            borderLeft: `3px solid ${s.color}50`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 11, color: TX3, fontWeight: 600, letterSpacing: '0.05em' }}>
                {s.sub}
              </span>
            </div>
            <div style={{
              fontSize: 'clamp(1.1rem,2.5vw,1.6rem)',
              fontWeight: 800, color: TX1,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: TX2, fontWeight: 500 }}>{s.label}</div>
            {s.bar && (
              <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${s.bar.pct}%`,
                  background: `linear-gradient(90deg, ${s.bar.color}, ${s.bar.color}88)`,
                  borderRadius: 4, transition: 'width 0.4s',
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .rt-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) { .rt-stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px)  { .rt-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 380px)  { .rt-stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}