// ─── TicketingSteps.tsx ────────────────────────────────────────────────────
// Horizontal 4-step progress indicator at the top of the ticketing flow.

import { RiCheckLine } from 'react-icons/ri'
import type { TicketingStep } from './ticketingTypes'

const STEPS: { key: TicketingStep; label: string }[] = [
  { key: 'select-tickets', label: 'Select Tickets' },
  { key: 'your-details',   label: 'Your Details' },
  { key: 'checkout',       label: 'Checkout' },
  { key: 'confirmation',   label: 'Confirmation' },
]

export default function TicketingSteps({ current }: { current: TicketingStep }) {
  const currentIndex = STEPS.findIndex(s => s.key === current)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
      {STEPS.map((s, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: done ? 'var(--green)' : active ? 'var(--green)' : 'rgba(255,255,255,0.08)',
                color: done || active ? '#00210d' : 'var(--text-dim)',
                border: active ? '2px solid var(--green)' : 'none',
              }}>
                {done ? <RiCheckLine size={14} /> : i + 1}
              </div>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: active ? 'var(--green)' : done ? 'var(--text)' : 'var(--text-dim)',
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 28, height: 1, background: 'var(--card-border)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}