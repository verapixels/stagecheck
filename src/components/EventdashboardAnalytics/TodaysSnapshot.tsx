// src/components/EventAnalytics/TodaysSnapshot.tsx
import { Wallet, Ticket, UserPlus, CheckCircle2, RotateCcw } from 'lucide-react'
import type { AttendeeDoc } from './Types'
import { formatNairaFull, isToday } from './Analytics.utils'

interface Props {
  attendees: AttendeeDoc[]
}

export default function TodaysSnapshot({ attendees }: Props) {
  const todays = attendees.filter(a => a.purchasedAt?.toDate && isToday(a.purchasedAt.toDate()))

  const sales = todays.reduce((s, a) => s + (a.totalPaid || 0), 0)
  const ticketsSold = todays.reduce((s, a) => s + (a.quantity || 1), 0)
  const registrations = todays.length
  const checkIns = todays.filter(a => a.checkedIn).length
  const refunds = 0 // no refunds collection yet

  const items = [
    { icon: <Wallet size={18} />, label: "Today's Sales", value: formatNairaFull(sales), color: '#22C55E' },
    { icon: <Ticket size={18} />, label: 'Tickets Sold', value: String(ticketsSold), color: '#3B82F6' },
    { icon: <UserPlus size={18} />, label: 'New Registrations', value: String(registrations), color: '#8B5CF6' },
    { icon: <CheckCircle2 size={18} />, label: 'Check Ins', value: String(checkIns), color: '#22C55E' },
    { icon: <RotateCcw size={18} />, label: 'Refund Requests', value: String(refunds), color: '#EF4444' },
  ]

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: '0 0 18px' }}>
        Today's Snapshot
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 14 }}>
        {items.map(it => (
          <div key={it.label} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: `${it.color}15`,
              border: `1px solid ${it.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: it.color,
            }}>
              {it.icon}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff' }}>{it.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}