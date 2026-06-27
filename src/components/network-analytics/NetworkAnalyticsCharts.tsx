interface AttendanceDonutProps {
  checkedIn: number
  total: number
}

export function AttendanceDonut({ checkedIn, total }: AttendanceDonutProps) {
  const pct = total > 0 ? checkedIn / total : 0
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const remaining = total - checkedIn

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16, fontFamily: 'var(--font-display)' }}>
        Attendance Progress
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={140} height={140} viewBox="0 0 140 140">
            <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
            <circle
              cx={70} cy={70} r={r} fill="none"
              stroke="url(#donutGrad)" strokeWidth={14}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
            <defs>
              <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              {Math.round(pct * 100)}%
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Attendance</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Expected', value: total, color: '#6366F1' },
            { label: 'Checked In', value: checkedIn, color: '#22C55E' },
            { label: 'Remaining', value: remaining, color: '#818CF8' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginLeft: 4, fontFamily: 'var(--font-display)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface RegistrationTrendProps {
  data: { day: string; count: number }[]
}

export function RegistrationTrendChart({ data }: RegistrationTrendProps) {
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 100, h = 80
  const pad = 4

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((d.count / max) * (h - pad * 2))
    return { x, y, ...d }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = points.length > 0
    ? `${pathD} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`
    : ''

  const lastPoint = points[points.length - 1]
  const lastCount = data[data.length - 1]?.count ?? 0

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
          Registration Trend
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.5)',
        }}>
          Last 7 Days
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', paddingBottom: '45%' }}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Y grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={pad} y1={h - pad - f * (h - pad * 2)} x2={w - pad} y2={h - pad - f * (h - pad * 2)}
              stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
          ))}
          <path d={areaD} fill="url(#trendArea)" />
          <path d={pathD} fill="none" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#6366F1" />
          ))}
          {lastPoint && (
            <>
              <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill="#6366F1" />
              <rect x={lastPoint.x - 8} y={lastPoint.y - 14} width={16} height={12} rx={3} fill="#6366F1" />
              <text x={lastPoint.x} y={lastPoint.y - 5} textAnchor="middle" fill="#fff" fontSize={5} fontWeight="bold">{lastCount}</text>
            </>
          )}
        </svg>
      </div>

      {/* X labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{d.day}</span>
        ))}
      </div>
    </div>
  )
}