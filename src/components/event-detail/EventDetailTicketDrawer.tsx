// ─── EventDetailTicketDrawer.tsx ─────────────────────────────────────────────
// Right slide-in drawer for full ticket purchase flow:
// select-ticket → attendee-form → payment → success

import { useRef } from 'react'
import {
  RiCloseLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine,
  RiShieldCheckLine, RiLockLine, RiDownloadLine, RiLoader4Line,
  RiTicketLine, RiCalendarEventLine, RiMapPinLine,
  RiAlertLine, RiCheckboxCircleLine,
} from 'react-icons/ri'
import type { EventData, TicketType, AttendeeForm, DrawerStep } from './eventDetailTypes'
import { formatDate, formatTime } from './eventDetailHelpers'

declare global { interface Window { PaystackPop: any } }

const CF_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

interface Props {
  event: EventData
  tickets: TicketType[]
  step: DrawerStep
  selectedTicket: TicketType | null
  qty: number
  attendee: AttendeeForm
  formErrors: Partial<AttendeeForm>
  paying: boolean
  payError: string
  processing: boolean
  ticketCode: string
  qrDataUrl: string
  onClose: () => void
  onStep: (s: DrawerStep) => void
  onSelectTicket: (t: TicketType) => void
  onQtyChange: (q: number) => void
  onAttendeeChange: (f: Partial<AttendeeForm>) => void
  onValidateAttendee: () => boolean
  onPaymentSuccess: (ref: string) => void
  onPayError: (msg: string) => void
  onPaying: (v: boolean) => void
  onDownload: () => void
}

export default function EventDetailTicketDrawer({
  event, tickets, step, selectedTicket, qty,
  attendee, formErrors, paying, payError, processing,
  ticketCode, qrDataUrl,
  onClose, onStep, onSelectTicket, onQtyChange,
  onAttendeeChange, onValidateAttendee,
  onPaymentSuccess, onPayError, onPaying, onDownload,
}: Props) {
  const ticketRef = useRef<HTMLDivElement>(null)

  const totalAmount = selectedTicket ? selectedTicket.price * qty : 0

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, color: '#fff', fontSize: 14,
    fontFamily: 'Inter, sans-serif', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  })

  // ── Select ticket step
  const renderSelectTicket = () => (
    <div style={{ paddingTop: 20 }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
        Choose a ticket type to continue
      </p>
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          <RiTicketLine size={36} style={{ display: 'block', margin: '0 auto 12px' }} />
          No tickets available yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tickets.map(t => {
            const rem = t.quantity - t.sold
            const sel = selectedTicket?.id === t.id
            const soldOut = rem <= 0
            return (
              <div
                key={t.id}
                onClick={() => !soldOut && onSelectTicket(t)}
                style={{
                  border: `1.5px solid ${sel ? t.color : soldOut ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14, overflow: 'hidden',
                  cursor: soldOut ? 'not-allowed' : 'pointer',
                  background: sel ? `${t.color}0d` : 'rgba(255,255,255,0.02)',
                  opacity: soldOut ? 0.5 : 1, transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div style={{ height: 3, background: `linear-gradient(90deg, ${t.color}, ${t.color}50)` }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t.name}</div>
                      {t.description && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{t.description}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: soldOut ? 'rgba(255,255,255,0.3)' : t.color }}>
                        {t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: 11, color: soldOut ? '#f87171' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                        {soldOut ? 'Sold out' : `${rem} left`}
                      </div>
                    </div>
                  </div>
                  {sel && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginTop: 12, paddingTop: 12,
                      borderTop: `1px solid ${t.color}25`,
                    }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Quantity</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        {['−', qty, '+'].map((v, i) => i === 1 ? (
                          <span key={i} style={{ fontSize: 15, fontWeight: 700, color: '#fff', minWidth: 24, textAlign: 'center' }}>{v}</span>
                        ) : (
                          <button key={i} onClick={e => { e.stopPropagation(); onQtyChange(i === 0 ? Math.max(1, qty - 1) : Math.min(rem, qty + 1)) }}
                            style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {sel && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RiCheckLine size={12} color="#000" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {selectedTicket && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(13,199,94,0.06)', borderRadius: 10, marginBottom: 14, border: '1px solid rgba(13,199,94,0.15)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0dc75e' }}>
              {totalAmount === 0 ? 'Free' : `₦${totalAmount.toLocaleString()}`}
            </span>
          </div>
          <button
            onClick={() => onStep('attendee-form')}
            style={{ width: '100%', padding: '14px', background: '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            Continue <RiArrowRightLine size={16} />
          </button>
        </div>
      )}
    </div>
  )

  // ── Attendee form step
  const renderAttendeeForm = () => (
    <div style={{ paddingTop: 20 }}>
      <button onClick={() => onStep('select-ticket')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
        <RiArrowLeftLine size={15} /> Back
      </button>
      <div style={{ background: 'rgba(13,199,94,0.06)', border: '1px solid rgba(13,199,94,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedTicket?.name} × {qty}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0dc75e' }}>{totalAmount === 0 ? 'Free' : `₦${totalAmount.toLocaleString()}`}</div>
        </div>
        <button onClick={() => onStep('select-ticket')} style={{ fontSize: 11, color: '#0dc75e', background: 'none', border: '1px solid rgba(13,199,94,0.3)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer' }}>Change</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Full Name *', type: 'text', field: 'name' as const, ph: 'John Doe' },
          { label: 'Email Address *', type: 'email', field: 'email' as const, ph: 'you@example.com' },
          { label: 'Phone Number *', type: 'tel', field: 'phone' as const, ph: '+234 801 234 5678' },
          { label: 'Alternative Number (optional)', type: 'tel', field: 'altPhone' as const, ph: '+234 802 345 6789' },
        ].map(f => (
          <div key={f.field}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type} placeholder={f.ph}
              style={inputStyle(formErrors[f.field])}
              value={attendee[f.field]}
              onChange={e => onAttendeeChange({ [f.field]: e.target.value })}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(13,199,94,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = formErrors[f.field] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
            />
            {formErrors[f.field] && <span style={{ fontSize: 11, color: '#f87171', marginTop: 4, display: 'block' }}>{formErrors[f.field]}</span>}
          </div>
        ))}
      </div>
      <button onClick={() => { if (onValidateAttendee()) onStep('payment') }} style={{ width: '100%', padding: '14px', background: '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 }}>
        Continue to Payment <RiArrowRightLine size={16} />
      </button>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
        Your ticket confirmation will be sent to your email address.
      </p>
    </div>
  )

  // ── Payment step
  const renderPayment = () => {
    const handlePaystack = () => {
      if (!onValidateAttendee()) return
      if (!event || !selectedTicket) return
      if (!window.PaystackPop) {
        onPayError('Payment system is still loading. Please wait a moment and try again.')
        return
      }
      onPayError('')
      onPaying(true)
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: attendee.email,
        amount: Math.round(totalAmount * 100),
        currency: 'NGN',
        metadata: {
          eventId: event.id, ticketTypeId: selectedTicket.id,
          ticketType: selectedTicket.name, ticketColor: selectedTicket.color,
          quantity: qty, attendeeName: attendee.name, attendeeEmail: attendee.email,
          phone: attendee.phone, altPhone: attendee.altPhone,
          eventName: event.name, eventDate: formatDate(event.date),
          eventTime: event.startTime ? formatTime(event.startTime) : '',
          venueName: event.venue || '', venueAddress: event.address || '',
          organizerEmail: event.organizerEmail || event.organizer?.email || '',
        },
        callback: (response: { reference: string }) => {
          ;(async () => {
            try {
              const res = await fetch(`${CF_BASE}/verifyAndFulfillPayment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: response.reference, expectedAmount: totalAmount }),
              })
              const data = await res.json()
              if (!data.success) {
                onPayError(data.message || 'Payment could not be verified.')
                onPaying(false)
                return
              }
              onPaymentSuccess(data.ticketCode)
              onPaying(false)
            } catch {
              onPayError('Could not confirm payment. Reference: ' + response.reference)
              onPaying(false)
            }
          })()
        },
        onClose: () => onPaying(false),
      })
      handler.openIframe()
    }

    return (
      <div style={{ paddingTop: 20 }}>
        <button onClick={() => onStep('attendee-form')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
          <RiArrowLeftLine size={15} /> Back
        </button>
        <div style={{ background: 'rgba(13,199,94,0.06)', border: '1px solid rgba(13,199,94,0.15)', borderRadius: 10, padding: '14px 16px', marginBottom: 22 }}>
          <div style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>{selectedTicket?.name} × {qty}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{attendee.name} · {attendee.email}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0dc75e' }}>{totalAmount === 0 ? 'Free' : `₦${totalAmount.toLocaleString()}`}</span>
          </div>
        </div>
        {totalAmount === 0 ? (
          <button
            onClick={() => { if (!processing) onPaymentSuccess('free_' + Date.now()) }}
            disabled={processing}
            style={{ width: '100%', padding: '14px', background: processing ? 'rgba(13,199,94,0.5)' : '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {processing
              ? <><RiLoader4Line size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…</>
              : <><RiCheckboxCircleLine size={16} /> Claim Free Ticket</>}
          </button>
        ) : (
          <>
            {payError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <RiAlertLine size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#f87171', lineHeight: 1.5 }}>{payError}</span>
              </div>
            )}
            <button
              onClick={handlePaystack} disabled={paying}
              style={{ width: '100%', padding: '15px', background: paying ? 'rgba(13,199,94,0.5)' : '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 15, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {paying
                ? <><RiLoader4Line size={17} style={{ animation: 'spin 0.8s linear infinite' }} /> Waiting for payment…</>
                : <><RiLockLine size={16} /> Pay ₦{totalAmount.toLocaleString()} Securely</>}
            </button>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          <RiShieldCheckLine size={11} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Secured by Paystack</span>
        </div>
      </div>
    )
  }

  // ── Success step
  const renderSuccess = () => (
    <div style={{ paddingTop: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(13,199,94,0.15)', border: '2px solid rgba(13,199,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', animation: 'popIn 0.4s cubic-bezier(.16,1,.3,1)' }}>
          <RiCheckLine size={30} color="#0dc75e" />
        </div>
        <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>You're in!</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Ticket sent to <strong style={{ color: '#0dc75e' }}>{attendee.email}</strong>
        </p>
      </div>

      {/* Ticket card */}
      <div ref={ticketRef} style={{ background: 'linear-gradient(135deg, #060e1c 0%, #04091a 100%)', border: `1px solid ${selectedTicket?.color || '#0dc75e'}30`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${selectedTicket?.color || '#0dc75e'}, ${selectedTicket?.color || '#0dc75e'}60)` }} />
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: selectedTicket?.color || '#0dc75e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{selectedTicket?.name}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>{event.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {event.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <RiCalendarEventLine size={11} color={selectedTicket?.color || '#0dc75e'} />
                    {formatDate(event.date)}{event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
                  </div>
                )}
                {event.venue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <RiMapPinLine size={11} color={selectedTicket?.color || '#0dc75e'} />
                    {event.venue}
                  </div>
                )}
              </div>
            </div>
            {qrDataUrl && (
              <div style={{ flexShrink: 0, padding: 6, background: '#060e1c', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={qrDataUrl} alt="QR" style={{ width: 72, height: 72, display: 'block' }} />
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Attendee</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{attendee.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Ticket Code</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: selectedTicket?.color || '#0dc75e', letterSpacing: '0.06em' }}>{ticketCode}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onDownload} style={{ flex: 1, padding: '12px', background: 'rgba(13,199,94,0.1)', border: '1px solid rgba(13,199,94,0.3)', color: '#0dc75e', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <RiDownloadLine size={15} /> Download
        </button>
        <button onClick={() => { onClose(); onStep('select-ticket') }} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Back to Event
        </button>
      </div>
    </div>
  )

  const stepContent: Record<DrawerStep, () => React.ReactNode> = {
    'select-ticket': renderSelectTicket,
    'attendee-form': renderAttendeeForm,
    'payment': renderPayment,
    'success': renderSuccess,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex' }}>
      {/* Backdrop */}
      <div
        style={{ flex: 1, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        width: 'min(520px,100vw)',
        background: '#030c1a',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        animation: 'slideInRight 0.32s cubic-bezier(.16,1,.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Get Tickets
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{event.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}
          >
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '0 24px 24px', overflowY: 'auto' }}>
          {stepContent[step]()}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
          <RiShieldCheckLine size={12} color="var(--green)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            StageCheck by{' '}
            <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>Verapixels</a>
            {' '}· Payments by Paystack
          </span>
        </div>
      </div>
    </div>
  )
}