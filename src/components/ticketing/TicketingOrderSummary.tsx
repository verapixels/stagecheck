// ─── TicketingOrderSummary.tsx ─────────────────────────────────────────────
// Sticky right-hand "Your Order" panel: event mini-card, selected line
// items, fee breakdown, total, primary CTA, "Buy for a Group", discount
// code field, and the 100% Buyer Protection box.

import { useState } from 'react'
import { RiShieldCheckLine, RiArrowRightLine, RiGroupLine } from 'react-icons/ri'
import type { EventData, TicketType, AddOn } from './ticketingTypes'
import { formatDate, formatTime } from '../event-detail/eventDetailHelpers'

function fmtNaira(n: number) {
  return `₦${n.toLocaleString()}`
}

interface Props {
  event: EventData
  heroImg: string
  tickets: TicketType[]
  quantities: Record<string, number>
  addOns: AddOn[]
  addOnQuantities: Record<string, number>
  onClearAll: () => void
  onContinue: () => void
  onBuyForGroup: () => void
  platformFee: number
  serviceCharge: number
  ctaLabel: string
}

export default function TicketingOrderSummary({
  event, heroImg, tickets, quantities, addOns, addOnQuantities,
  onClearAll, onContinue, onBuyForGroup, platformFee, serviceCharge, ctaLabel,
}: Props) {
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)

  const lines = tickets.filter(t => (quantities[t.id] || 0) > 0)
  const addOnLines = addOns.filter(a => (addOnQuantities[a.id] || 0) > 0)
  const hasSelection = lines.length > 0 || addOnLines.length > 0

  const subtotal =
    lines.reduce((sum, t) => sum + t.price * (quantities[t.id] || 0), 0) +
    addOnLines.reduce((sum, a) => sum + a.price * (addOnQuantities[a.id] || 0), 0)

  const fee = hasSelection ? platformFee : 0
  const charge = hasSelection ? serviceCharge : 0
  const total = subtotal + fee + charge

  return (
    <div style={{
      border: '1px solid var(--card-border)', borderRadius: 18,
      background: 'var(--card)', padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Your Order</h3>
        {hasSelection && (
          <button onClick={onClearAll} style={{
            background: 'none', border: 'none', color: 'var(--red)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>Clear all</button>
        )}
      </div>

      {/* Event mini-card */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
          background: 'rgba(255,255,255,0.05)',
        }}>
          {heroImg && <img src={heroImg} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{event.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            {formatDate(event.date)}{event.startTime ? ` – ${formatTime(event.startTime)}` : ''}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{event.venue}</div>
        </div>
      </div>

      {!hasSelection ? (
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16 }}>
          Select a ticket type to see your order summary here.
        </p>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {lines.map(t => (
            <div key={t.id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{t.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>{quantities[t.id]} ticket{quantities[t.id] > 1 ? 's' : ''}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtNaira(t.price * quantities[t.id])}</span>
              </div>
            </div>
          ))}
          {addOnLines.map(a => (
            <div key={a.id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{a.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>x{addOnQuantities[a.id]}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtNaira(a.price * addOnQuantities[a.id])}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 12, marginBottom: 12 }}>
        <Row label="Subtotal" value={fmtNaira(subtotal)} />
        <Row label="Platform Fee" value={fmtNaira(fee)} info />
        <Row label="Service Charge" value={fmtNaira(charge)} info />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        borderTop: '1px solid var(--card-border)', paddingTop: 12, marginBottom: 16,
      }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Total</span>
        <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>{fmtNaira(total)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
        <RiShieldCheckLine color="var(--green)" size={15} />
        Secure Ticketing. Trusted by thousands.<br />Your payment is 100% safe and secure.
      </div>

      <button
        className="tk-btn-primary"
        style={{ width: '100%', padding: '13px 0', fontSize: 15, marginBottom: 10 }}
        disabled={!hasSelection}
        onClick={onContinue}
      >
        {ctaLabel} <RiArrowRightLine size={16} />
      </button>

      <button className="tk-btn-outline" style={{ width: '100%', padding: '11px 0', fontSize: 14.5, marginBottom: 18 }} onClick={onBuyForGroup}>
        <RiGroupLine size={16} /> Buy for a Group
      </button>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Have a discount code?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="tk-input" placeholder="Enter code" value={code}
            onChange={e => setCode(e.target.value)} style={{ flex: 1 }}
          />
          <button
            className="tk-btn-primary" style={{ padding: '0 16px', fontSize: 13.5 }}
            disabled={!code || applying}
            onClick={() => { setApplying(true); setTimeout(() => setApplying(false), 600) }}
          >
            Apply
          </button>
        </div>
      </div>

      <div style={{
        border: '1px solid var(--card-border)', borderRadius: 14, padding: 14,
        background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--text)' }}>
          <RiShieldCheckLine color="var(--green)" size={17} /> 100% Buyer Protection
        </div>
        {['Secure Payments', 'Verified Tickets', '24/7 Support'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span style={{ color: 'var(--green)' }}>✓</span> {t}
          </div>
        ))}
        <a href="#" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>
          Learn more
        </a>
      </div>
    </div>
  )
}

function Row({ label, value, info }: { label: string; value: string; info?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 8 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {label} {info && <span style={{ opacity: 0.6 }}>ⓘ</span>}
      </span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}