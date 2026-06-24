import React from 'react'
import { Users, GitBranch, ScanLine, TrendingUp, Wallet, Activity } from 'lucide-react'

interface Stat {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  sub?: string
}

interface Props {
  totalRegistrants: number
  totalOrgNodes: number
  checkedIn: number
  totalRevenue: number
  activeLevel: string
  fillRate: number
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
}

export default function NetworkStatGrid({ totalRegistrants, totalOrgNodes, checkedIn, totalRevenue, activeLevel, fillRate }: Props) {
  const stats: Stat[] = [
    { label: 'Registrants',   value: totalRegistrants,              icon: <Users size={15} />,     color: '#818CF8', sub: 'total registered' },
    { label: 'Org Nodes',     value: totalOrgNodes,                 icon: <GitBranch size={15} />, color: '#6366F1', sub: activeLevel || 'across all levels' },
    { label: 'Checked In',    value: checkedIn,                     icon: <ScanLine size={15} />,  color: '#34D399', sub: `${fillRate}% attendance rate` },
    { label: 'Fill Rate',     value: `${fillRate}%`,                icon: <Activity size={15} />,  color: '#60A5FA', sub: 'of capacity used' },
    { label: 'Revenue',       value: `₦${totalRevenue.toLocaleString()}`, icon: <Wallet size={15} />,    color: '#FBBF24', sub: 'ticket sales total' },
    { label: 'Momentum',      value: totalRegistrants > 0 ? 'Active' : 'Pending', icon: <TrendingUp size={15} />, color: '#F472B6', sub: 'registration status' },
  ]

  return (
    <div className="net-stat-grid" style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          ...glass,
          padding: '16px 16px 14px',
          borderLeft: `3px solid ${s.color}50`,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `${s.color}14`,
              border: `1px solid ${s.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>
              {s.icon}
            </div>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, opacity: 0.45 }} />
          </div>
          <div>
            <div style={{
              fontSize: 'clamp(1rem,2.5vw,1.4rem)', fontWeight: 800,
              fontFamily: 'var(--font-display)', color: s.color,
              letterSpacing: '-0.4px', lineHeight: 1.1, marginBottom: 3,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.sub}</div>}
          </div>
        </div>
      ))}
      <style>{`
        .net-stat-grid { grid-template-columns: repeat(6,1fr); }
        @media (max-width:1100px) { .net-stat-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width:640px)  { .net-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  )
}