// src/components/EventAnalytics/Insights.tsx
import { TrendingUp } from 'lucide-react'

interface Props {
  insights: string[]
}

export default function Insights({ insights }: Props) {
  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: '0 0 16px' }}>
        Insights
      </h3>

      {insights.length === 0 ? (
        <div style={{ padding: '10px 0', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Not enough data yet to generate insights.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {insights.map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <TrendingUp size={14} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}