interface RevenueOverviewProps {
  gross: number
  serviceFee: number
  payoutDate?: string
}

export function RevenueOverview({ gross, serviceFee, payoutDate }: RevenueOverviewProps) {
  const organiserEarnings = gross - serviceFee

  const bars = [
    { label: 'Gross Revenue',       value: gross,             color: '#F59E0B' },
    { label: 'Service Fees',        value: serviceFee,        color: '#F87171' },
    { label: 'Organizer Earnings',  value: organiserEarnings, color: '#22C55E' },
  ]
  const maxVal = Math.max(...bars.map(b => b.value), 1)

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Revenue Overview</div>
        <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          View Details
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{b.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: b.color, fontFamily: 'var(--font-display)' }}>
              ₦{b.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {bars.map(b => (
          <div key={b.label} style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.round((b.value / maxVal) * 100)}%`,
              background: b.color, borderRadius: 4, transition: 'width 0.6s ease',
            }} />
          </div>
        ))}
      </div>

      {payoutDate && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Payout scheduled for {payoutDate}
        </div>
      )}
    </div>
  )
}

interface TicketType {
  name: string
  sold: number
  total: number
  revenue: number
  color: string
}

interface TicketBreakdownProps {
  tickets: TicketType[]
}

export function TicketBreakdown({ tickets }: TicketBreakdownProps) {
  const totalSold = tickets.reduce((a, t) => a + t.sold, 0)
  const COLORS = ['#818CF8', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6']

  // Build donut segments
  const segments: { pct: number; color: string; offset: number }[] = []
  let offset = 0
  tickets.forEach((t, i) => {
    const pct = totalSold > 0 ? t.sold / totalSold : 1 / tickets.length
    segments.push({ pct, color: COLORS[i % COLORS.length], offset })
    offset += pct
  })

  const r = 42, circ = 2 * Math.PI * r

  return (
    <div style={{
      background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Ticket Breakdown</div>
        <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          View Details
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            {segments.map((seg, i) => (
              <circle key={i}
                cx={50} cy={50} r={r}
                fill="none" stroke={seg.color} strokeWidth={12}
                strokeDasharray={`${seg.pct * circ} ${circ - seg.pct * circ}`}
                strokeDashoffset={-seg.offset * circ}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{totalSold}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Total</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 120 }}>
          {tickets.map((t, i) => {
            const pct = totalSold > 0 ? Math.round((t.sold / totalSold) * 100) : 0
            return (
              <div key={t.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {t.name}
                  </span>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>₦{t.revenue.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 50 }}>{t.sold} Sold ({pct}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}