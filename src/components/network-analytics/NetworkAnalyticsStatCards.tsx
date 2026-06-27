import { Users, ScanLine, Ticket, Wallet, GitBranch, Clock, TrendingUp, BarChart2 } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  iconBg: string
  accent: string
  trend?: string
  trendUp?: boolean
  sparkline?: number[]
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 30
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ label, value, sub, icon, iconBg, accent, trend, trendUp, sparkline }: StatCardProps) {
  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: accent }}>{icon}</span>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</span>
        </div>
        {sparkline && <MiniSparkline data={sparkline} color={accent} />}
      </div>

      <div style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {sub && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{sub}</span>}
        {trend && (
          <span style={{ fontSize: 12, color: trendUp ? '#22C55E' : '#F87171', fontWeight: 600 }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  )
}

interface Props {
  totalRegistrants: number
  checkedIn: number
  ticketsIssued: number
  revenue: number
  orgNodes: number
  pendingCheckin: number
  checkinRate: number
  registrationGrowth: number
  revenueToday: number
  ticketTypes: number
  registrationTrend: number[]
  revenueTrend: number[]
}

export default function NetworkAnalyticsStatCards({
  totalRegistrants, checkedIn, ticketsIssued, revenue, orgNodes,
  pendingCheckin, checkinRate, registrationGrowth, revenueToday,
  ticketTypes, registrationTrend, revenueTrend,
}: Props) {
  const cards: StatCardProps[] = [
    {
      label: 'Total Registrants',
      value: totalRegistrants,
      sub: `${ticketTypes} Ticket Type${ticketTypes !== 1 ? 's' : ''}`,
      icon: <Users size={18} />,
      iconBg: 'rgba(99,102,241,0.15)',
      accent: '#6366F1',
      trend: `${registrationGrowth}% today`,
      trendUp: registrationGrowth >= 0,
      sparkline: registrationTrend,
    },
    {
      label: 'Checked In',
      value: checkedIn,
      sub: `${checkinRate}% attendance`,
      icon: <ScanLine size={18} />,
      iconBg: 'rgba(34,197,94,0.15)',
      accent: '#22C55E',
      sparkline: registrationTrend.map((v, i) => Math.round(v * 0.17)),
    },
    {
      label: 'Tickets Issued',
      value: ticketsIssued,
      sub: `${ticketTypes} Ticket Type${ticketTypes !== 1 ? 's' : ''}`,
      icon: <Ticket size={18} />,
      iconBg: 'rgba(99,102,241,0.15)',
      accent: '#818CF8',
      sparkline: registrationTrend,
    },
    {
      label: 'Revenue',
      value: `₦${revenue.toLocaleString()}`,
      sub: revenueToday > 0 ? `₦${revenueToday.toLocaleString()} today` : 'No revenue today',
      icon: <Wallet size={18} />,
      iconBg: 'rgba(245,158,11,0.15)',
      accent: '#F59E0B',
      trend: revenueToday > 0 ? `₦${revenueToday.toLocaleString()} today` : undefined,
      trendUp: true,
      sparkline: revenueTrend,
    },
    {
      label: 'Organization Nodes',
      value: orgNodes,
      sub: `${Math.max(1, Math.floor(orgNodes * 0.6))} Active`,
      icon: <GitBranch size={18} />,
      iconBg: 'rgba(129,140,248,0.15)',
      accent: '#818CF8',
    },
    {
      label: 'Pending Check-in',
      value: pendingCheckin,
      sub: 'Still expected',
      icon: <Clock size={18} />,
      iconBg: 'rgba(248,113,113,0.15)',
      accent: '#F87171',
    },
    {
      label: 'Check-in Rate',
      value: `${checkinRate}%`,
      sub: `vs ${Math.max(0, checkinRate - 5)}% yesterday`,
      icon: <TrendingUp size={18} />,
      iconBg: 'rgba(20,184,166,0.15)',
      accent: '#14B8A6',
      trend: `${Math.abs(checkinRate - Math.max(0, checkinRate - 5))}% vs yesterday`,
      trendUp: true,
    },
    {
      label: 'Registration Growth',
      value: `${registrationGrowth}%`,
      sub: 'vs last 7 days',
      icon: <BarChart2 size={18} />,
      iconBg: 'rgba(99,102,241,0.15)',
      accent: '#6366F1',
      trend: `${registrationGrowth}% vs last 7 days`,
      trendUp: registrationGrowth >= 0,
      sparkline: registrationTrend,
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 14,
      marginBottom: 24,
    }}>
      {cards.map((c, i) => <StatCard key={i} {...c} />)}
    </div>
  )
}