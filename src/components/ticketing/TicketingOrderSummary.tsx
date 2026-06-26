// ─── TicketingOrderSummary.tsx ─────────────────────────────────────────────
import { useState, useRef } from 'react'
import { RiShieldCheckLine, RiArrowRightLine, RiGroupLine, RiInformationLine } from 'react-icons/ri'
import type { EventData, TicketType, AddOn } from './ticketingTypes'
import { formatDate, formatTime } from '../event-detail/eventDetailHelpers'

function fmtNaira(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
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
  ctaLabel: string
  // ── ADDED: controls whether clicking CTA triggers payment or just navigates
  isCheckout?: boolean
  userEmail: string
  userName: string
  userPhone?: string
  onPaymentSuccess: (reference: string, ticketCode: string) => void
  onPaymentError?: (msg: string) => void
}

const PLATFORM_FEE_RATE   = 0.05   // 5% of subtotal
const SERVICE_CHARGE_RATE = 0.075  // 7.5% of platform fee

function generateTicketCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return (
    'SC-' +
    Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    ).join('-')
  )
}

export default function TicketingOrderSummary({
  event, heroImg, tickets, quantities, addOns, addOnQuantities,
  onClearAll, onContinue, onBuyForGroup, ctaLabel,
  isCheckout = false,
  userEmail, userName, userPhone,
  onPaymentSuccess, onPaymentError,
}: Props) {
  const [code, setCode] = useState('')
  const [paying, setPaying] = useState(false)
  const [tooltip, setTooltip] = useState<'platform' | 'service' | null>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const lines      = tickets.filter(t => (quantities[t.id] || 0) > 0)
  const addOnLines = addOns.filter(a => (addOnQuantities[a.id] || 0) > 0)
  const hasSelection = lines.length > 0 || addOnLines.length > 0

  const subtotal =
    lines.reduce((s, t) => s + t.price * (quantities[t.id] || 0), 0) +
    addOnLines.reduce((s, a) => s + a.price * (addOnQuantities[a.id] || 0), 0)

  const isFree        = subtotal === 0
  const platformFee   = isFree ? 0 : Math.round(subtotal * PLATFORM_FEE_RATE)
  const serviceCharge = isFree ? 0 : Math.round(platformFee * SERVICE_CHARGE_RATE)
  const total         = subtotal + platformFee + serviceCharge

  const handleCTA = () => {
    if (!hasSelection) return

    // ── Not on checkout step: just advance to next step (details / checkout)
    if (!isCheckout) {
      onContinue()
      return
    }

    // ── On checkout step: trigger payment or free claim
    if (isFree) {
      onPaymentSuccess(`free_${Date.now()}`, generateTicketCode())
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Paystack = (window as any).PaystackPop
    if (!Paystack) {
      onPaymentError?.('Paystack is not loaded yet. Please wait a moment and try again.')
      return
    }

    const selectedLine = lines[0]
    const meta = {
      eventId:        event.id,
      ticketTypeId:   selectedLine?.id || '',
      ticketType:     selectedLine?.name || '',
      ticketColor:    (selectedLine as any)?.color || '',
      quantity:       lines.reduce((s, t) => s + (quantities[t.id] || 0), 0),
      attendeeName:   userName,
      attendeeEmail:  userEmail,
      phone:          userPhone || '',
      eventName:      event.name,
      eventDate:      event.date
        ? ((event.date as any)?.toDate
            ? (event.date as any).toDate().toISOString().split('T')[0]
            : String(event.date))
        : '',
      eventTime:      event.startTime ? formatTime(event.startTime) : '',
      venueName:      event.venue || '',
      venueAddress:   event.address || '',
      organizerEmail: event.organizerEmail || (event.organizer as any)?.email || '',
    }

    setPaying(true)

    const handler = Paystack.setup({
      key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:    userEmail,
      amount:   total * 100,
      currency: 'NGN',
      ref:      `SC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      metadata: meta,
      callback: (response: { reference: string }) => {
        setPaying(false)
        onPaymentSuccess(response.reference, generateTicketCode())
      },
      onClose: () => setPaying(false),
    })

    handler.openIframe()
  }

  const showTooltip = (which: 'platform' | 'service') => {
    clearTimeout(tooltipTimer.current)
    setTooltip(which)
  }
  const hideTooltip = () => {
    tooltipTimer.current = setTimeout(() => setTooltip(null), 200)
  }

  return (
    <div style={{ border: '1px solid var(--card-border)', borderRadius: 18, background: 'var(--card)', padding: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Your Order</h3>
        {hasSelection && (
          <button onClick={onClearAll} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Event mini-card */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 54, height: 54, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
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

      {/* Line items */}
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
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {t.price === 0 ? 'Free' : fmtNaira(t.price * quantities[t.id])}
                </span>
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

      {/* Fee breakdown */}
      <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 12, marginBottom: 12 }}>
        <FeeRow label="Subtotal" value={isFree ? 'Free' : fmtNaira(subtotal)} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            Platform Fee (5%)
            <span style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
              onMouseEnter={() => showTooltip('platform')} onMouseLeave={hideTooltip}>
              <RiInformationLine size={14} style={{ opacity: 0.55 }} />
              {tooltip === 'platform' && (
                <Tooltip text="A 5% platform fee applied to your ticket subtotal. This helps us maintain and improve StageCheck." />
              )}
            </span>
          </span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{isFree ? '—' : fmtNaira(platformFee)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            Service Charge (7.5%)
            <span style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
              onMouseEnter={() => showTooltip('service')} onMouseLeave={hideTooltip}>
              <RiInformationLine size={14} style={{ opacity: 0.55 }} />
              {tooltip === 'service' && (
                <Tooltip text="A 7.5% VAT/service charge applied to the platform fee only — as required by Nigerian tax law." />
              )}
            </span>
          </span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{isFree ? '—' : fmtNaira(serviceCharge)}</span>
        </div>
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--card-border)', paddingTop: 12, marginBottom: 16 }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Total</span>
        <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>{isFree ? 'Free' : fmtNaira(total)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
        <RiShieldCheckLine color="var(--green)" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Secure Ticketing. Trusted by thousands.<br />Your payment is 100% safe and secure.</span>
      </div>

      {/* Primary CTA */}
      <button
        className="tk-btn-primary"
        style={{
          width: '100%', padding: '13px 0', fontSize: 15, marginBottom: 10,
          opacity: (!hasSelection || paying) ? 0.5 : 1,
          cursor: (!hasSelection || paying) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        disabled={!hasSelection || paying}
        onClick={handleCTA}
      >
        {paying
          ? 'Processing…'
          : isCheckout && isFree
            ? 'Claim Free Ticket'
            : ctaLabel}
        {!paying && <RiArrowRightLine size={16} />}
      </button>

      <button className="tk-btn-outline" style={{ width: '100%', padding: '11px 0', fontSize: 14.5, marginBottom: 18 }} onClick={onBuyForGroup}>
        <RiGroupLine size={16} /> Buy for a Group
      </button>

      {/* Discount code */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Have a discount code?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="tk-input" placeholder="Enter code" value={code} onChange={e => setCode(e.target.value)} style={{ flex: 1 }} />
          <button className="tk-btn-primary" style={{ padding: '0 16px', fontSize: 13.5 }} disabled={!code}>Apply</button>
        </div>
      </div>

      {/* Buyer protection */}
      <div style={{ border: '1px solid var(--card-border)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,0.03)' }}>
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

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 8 }}>
      <span>{label}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Tooltip({ text }: { text: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
      background: '#1a2540', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
      padding: '9px 13px', fontSize: 12, color: 'rgba(255,255,255,0.75)', width: 220,
      lineHeight: 1.5, zIndex: 100, pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      fontFamily: 'Inter, sans-serif', whiteSpace: 'normal', textAlign: 'left',
    }}>
      {text}
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent', borderTop: '6px solid #1a2540',
      }} />
    </div>
  )
}