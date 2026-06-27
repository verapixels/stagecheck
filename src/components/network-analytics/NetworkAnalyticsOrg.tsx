import { TrendingUp } from 'lucide-react'

const COLORS = ['#6366F1', '#818CF8', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6', '#F97316', '#06B6D4']
const SOURCE_COLORS = ['#22C55E', '#6366F1', '#EC4899', '#F59E0B', '#14B8A6']

interface NodePerf {
  name: string
  registrations: number
  checkedIn: number
}

interface OrgNodePerformanceProps {
  nodes: NodePerf[]
}

export function OrgNodePerformance({ nodes }: OrgNodePerformanceProps) {
  const sorted = [...nodes].sort((a, b) => b.registrations - a.registrations).slice(0, 8)

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
          Organization (Node) Performance
        </div>
        <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          View All
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
          <thead>
            <tr>
              {['Node', 'Registrations', 'Checked In', 'Rate'].map(h => (
                <th key={h} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textAlign: 'left', padding: '0 8px 10px', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '16px 8px', textAlign: 'center' }}>
                  No org node data yet
                </td>
              </tr>
            )}
            {sorted.map((node, i) => {
              const rate = node.registrations > 0 ? Math.round((node.checkedIn / node.registrations) * 100) : 0
              return (
                <tr key={node.name} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 8px', fontSize: 13, color: '#fff', fontWeight: 500 }}>{node.name}</td>
                  <td style={{ padding: '10px 8px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{node.registrations}</td>
                  <td style={{ padding: '10px 8px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{node.checkedIn}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 700,
                      color: rate >= 50 ? '#22C55E' : rate >= 20 ? '#F59E0B' : '#F87171',
                    }}>
                      <TrendingUp size={11} />
                      {rate}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface RegistrationsBySourceProps {
  sources: Record<string, number>
}

export function RegistrationsBySource({ sources }: RegistrationsBySourceProps) {
  const entries = Object.entries(sources).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((a, [, v]) => a + v, 0)

  // Build donut
  const r = 42, circ = 2 * Math.PI * r
  let offset = 0
  const segments = entries.map(([key, val], i) => {
    const pct = total > 0 ? val / total : 0
    const seg = { key, val, pct, offset, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }
    offset += pct
    return seg
  })

  const labels: Record<string, string> = {
    qr: 'QR Links', web: 'Website', instagram: 'Instagram', facebook: 'Facebook', direct: 'Direct / others',
  }

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16, fontFamily: 'var(--font-display)' }}>
        Registrations by Source
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            {segments.map((seg, i) => (
              <circle key={i} cx={50} cy={50} r={r} fill="none"
                stroke={seg.color} strokeWidth={12}
                strokeDasharray={`${seg.pct * circ} ${circ - seg.pct * circ}`}
                strokeDashoffset={-seg.offset * circ}
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 100 }}>
          {segments.map(seg => (
            <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{labels[seg.key] ?? seg.key}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{Math.round(seg.pct * 100)}%</span>
            </div>
          ))}
          {segments.length === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No source data yet</div>
          )}
        </div>
      </div>
    </div>
  )
}