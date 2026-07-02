// src/components/EventAnalytics/PerformanceChart.tsx
import { useMemo, useState } from 'react'
import { formatNaira, formatNairaFull } from './Analytics.utils'

type Metric = 'revenue' | 'tickets' | 'registrations' | 'checkins'

interface SeriesPoint { date: string; label: string; value: number }

interface Props {
  revenueSeries: SeriesPoint[]
  ticketsSeries: SeriesPoint[]
  registrationsSeries: SeriesPoint[]
  checkInsSeries: SeriesPoint[]
}

const TABS: { id: Metric; label: string }[] = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'tickets', label: 'Tickets Sold' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'checkins', label: 'Check Ins' },
]

const GREEN = '#22C55E'

export default function PerformanceChart({ revenueSeries, ticketsSeries, registrationsSeries, checkInsSeries }: Props) {
  const [metric, setMetric] = useState<Metric>('revenue')
  const [hover, setHover] = useState<number | null>(null)

  const series = useMemo(() => {
    switch (metric) {
      case 'tickets': return ticketsSeries
      case 'registrations': return registrationsSeries
      case 'checkins': return checkInsSeries
      default: return revenueSeries
    }
  }, [metric, revenueSeries, ticketsSeries, registrationsSeries, checkInsSeries])

  const width = 900
  const height = 300
  const padX = 20
  const padTop = 20
  const padBottom = 30

  const max = Math.max(1, ...series.map(s => s.value))
  const points = series.map((s, i) => {
    const x = padX + (i / Math.max(1, series.length - 1)) * (width - padX * 2)
    const y = padTop + (1 - s.value / max) * (height - padTop - padBottom)
    return { x, y, ...s }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || padX} ${height - padBottom} L ${points[0]?.x || padX} ${height - padBottom} Z`

  const formatValue = (v: number) => metric === 'revenue' ? formatNairaFull(v) : String(v)
  const step = Math.max(1, Math.floor(points.length / 8))

  return (
    <div style={{
      background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>
          Performance Overview
        </h3>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setMetric(t.id)}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: 7, padding: '7px 12px',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                background: metric === t.id ? GREEN : 'transparent',
                color: metric === t.id ? '#0B1020' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 480, height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity="0.35" />
              <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={padX} x2={width - padX} y1={padTop + f * (height - padTop - padBottom)} y2={padTop + f * (height - padTop - padBottom)}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          ))}

          <path d={areaPath} fill="url(#perfGradient)" />
          <path d={linePath} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={p.x - (width / points.length) / 2} y={0} width={width / points.length} height={height} fill="transparent" />
              {(hover === i) && (
                <circle cx={p.x} cy={p.y} r={5} fill={GREEN} stroke="#0B1020" strokeWidth={2} />
              )}
              {i % step === 0 && (
                <text x={p.x} y={height - 8} fontSize={10} fill="rgba(255,255,255,0.3)" textAnchor="middle" fontFamily="var(--font-body)">
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {hover !== null && points[hover] && (
          <div style={{
            position: 'absolute', left: `${(points[hover].x / width) * 100}%`, top: 0,
            transform: 'translate(-50%, -100%)', background: '#131A2E',
            border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '8px 12px',
            fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>{points[hover].label}</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{formatValue(points[hover].value)}</div>
          </div>
        )}
      </div>
    </div>
  )
}