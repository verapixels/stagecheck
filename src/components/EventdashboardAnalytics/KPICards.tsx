// src/components/EventAnalytics/KPICards.tsx
import { CalendarDays, Ticket, Users, Wallet, CheckCircle2, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { formatNaira, formatCompactNumber, trendLabel } from './Analytics.utils'

interface KPIData {
  activeEventsCount: number
  ticketsSold: number
  registrations: number
  revenue: number
  avgCheckInRate: number
  avgAttendance: number
}

interface Props {
  totals: KPIData
  previousTotals?: KPIData
}

export default function KPICards({ totals, previousTotals }: Props) {
  const prev = previousTotals

  const cards = [
    {
      label: 'Active Events',
      value: String(totals.activeEventsCount),
      icon: <CalendarDays size={18} />,
      color: '#22C55E',
      trend: prev ? trendLabel(totals.activeEventsCount, prev.activeEventsCount) : null,
    },
    {
      label: 'Total Tickets Sold',
      value: formatCompactNumber(totals.ticketsSold),
      icon: <Ticket size={18} />,
      color: '#3B82F6',
      trend: prev ? trendLabel(totals.ticketsSold, prev.ticketsSold) : null,
    },
    {
      label: 'Total Registrations',
      value: formatCompactNumber(totals.registrations),
      icon: <Users size={18} />,
      color: '#8B5CF6',
      trend: prev ? trendLabel(totals.registrations, prev.registrations) : null,
    },
    {
      label: 'Total Revenue',
      value: formatNaira(totals.revenue),
      icon: <Wallet size={18} />,
      color: '#F59E0B',
      trend: prev ? trendLabel(totals.revenue, prev.revenue) : null,
    },
    {
      label: 'Overall Check In Rate',
      value: `${totals.avgCheckInRate}%`,
      icon: <CheckCircle2 size={18} />,
      color: '#22C55E',
      trend: prev ? trendLabel(totals.avgCheckInRate, prev.avgCheckInRate) : null,
    },
    {
      label: 'Average Attendance',
      value: `${totals.avgAttendance}%`,
      icon: <Star size={18} />,
      color: '#EC4899',
      trend: prev ? trendLabel(totals.avgAttendance, prev.avgAttendance) : null,
    },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 14, marginBottom: 24,
    }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${c.color}15`, border: `1px solid ${c.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color,
            }}>
              {c.icon}
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
              color: '#fff', letterSpacing: '-1px',
            }}>
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{c.label}</div>
            {c.trend && (
              <div style={{
                fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3,
                color: c.trend.up ? '#22C55E' : '#F87171',
              }}>
                {c.trend.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {c.trend.value} vs previous period
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}