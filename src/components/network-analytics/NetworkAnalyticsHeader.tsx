import { Download, RefreshCw, Calendar } from 'lucide-react'

interface Props {
  eventName: string
  isLive: boolean
  lastUpdated: Date | null
  onRefresh: () => void
  dateRange?: string
}

export default function NetworkAnalyticsHeader({ eventName, isLive, lastUpdated, onRefresh, dateRange }: Props) {
  const secondsAgo = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000) : null
  const updatedLabel = secondsAgo !== null
    ? secondsAgo < 60 ? `Last updated ${secondsAgo} seconds ago` : `Last updated ${Math.round(secondsAgo / 60)}m ago`
    : ''

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16, marginBottom: 28,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
            Network Event Analytics
          </h1>
          {isLive && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#22C55E', fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Live
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          Real-time overview of registrations, check-ins, revenue and more.
        </p>
        {updatedLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{updatedLabel}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.7)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          <Download size={14} /> Export Report
        </button>
        <button
          onClick={onRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.7)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
        {dateRange && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.7)', fontSize: 13,
          }}>
            <Calendar size={14} /> {dateRange}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}