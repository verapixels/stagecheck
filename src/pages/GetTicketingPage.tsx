// ─── TicketingPage.tsx ─────────────────────────────────────────────────────
// Route: /event/:eventId/tickets
//
// Step flow:
//   1. select-tickets  → pick ticket types + add-ons
//   2. your-details    → collect name / email / phone
//   3. checkout        → review order + pay (Paystack or free claim)
//   4. confirmation    → success screen with ticket code + QR

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs, updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiLoader4Line, RiAlertLine,
  RiArrowRightLine, RiArrowLeftLine,
  RiCheckboxCircleLine, RiDownload2Line, RiShareLine,
} from 'react-icons/ri'
import QRCode from 'qrcode'

import { TK_GLOBAL_CSS } from '../components/ticketing/ticketingStyles'
import type { EventData, TicketType, AddOn, TicketingStep } from '../components/ticketing/ticketingTypes'
import { formatDate, formatTime } from '../components/event-detail/eventDetailHelpers'
import { useAuth } from '../context/Authcontext'
import { saveTicketToUser } from '../lib/useUserTickets'

import Navbar from '../components/Navbar'
import TicketingHeader from '../components/ticketing/TicketingHeader'
import TicketingSteps from '../components/ticketing/TicketingSteps'
import TicketingTicketList from '../components/ticketing/TicketingTicketList'
import TicketingOrderSummary from '../components/ticketing/TicketingOrderSummary'
import TicketingTrustFooter from '../components/ticketing/TicketingTrustFooter'

const CF_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

interface AttendeeForm {
  name: string
  email: string
  phone: string
}

// ── Shared inline styles for the details form ─────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.65)',
  marginBottom: 7,
  fontFamily: 'Inter, sans-serif',
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box' as const,
  ...(hasError ? { borderColor: '#f87171' } : {}),
})

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#f87171',
  margin: '5px 0 0',
  fontFamily: 'Inter, sans-serif',
}

export default function GetTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent]   = useState<EventData | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [addOns, setAddOns]   = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<TicketingStep>('select-tickets')
  const [quantities, setQuantities]       = useState<Record<string, number>>({})
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)

  // Attendee details (collected on step 2)
  const [attendee, setAttendee] = useState<AttendeeForm>({ name: '', email: '', phone: '' })
  const [formErrors, setFormErrors] = useState<Partial<AttendeeForm>>({})

  // Post-payment state
  const [ticketCode, setTicketCode] = useState('')
  const [qrDataUrl, setQrDataUrl]   = useState('')
  const [processing, setProcessing] = useState(false)
  const paymentInProgress = useRef(false)

  // Load Paystack script once
  useEffect(() => {
    if (document.getElementById('paystack-inline-script')) return
    const s = document.createElement('script')
    s.id  = 'paystack-inline-script'
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(s)
  }, [])

  // Load event + tickets + add-ons
  useEffect(() => {
    if (!eventId) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId!))
        if (snap.exists()) setEvent({ id: snap.id, ...snap.data() } as EventData)

        const tSnap = await getDocs(collection(db, 'events', eventId!, 'tickets'))
        setTickets(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType)))

        const aSnap = await getDocs(collection(db, 'events', eventId!, 'addOns'))
        setAddOns(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  const heroImg = event?.coverImage || event?.media?.find(m => m.type === 'image')?.url || ''

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleQtyChange = (ticketId: string, qty: number) =>
    setQuantities(q => ({ ...q, [ticketId]: qty }))

  const handleAddOnAdd = (addOnId: string) =>
    setAddOnQuantities(q => ({ ...q, [addOnId]: (q[addOnId] || 0) + 1 }))

  const handleClearAll = () => {
    setQuantities({})
    setAddOnQuantities({})
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: event?.name, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Step 1 → 2
  const handleContinueToDetails = () => {
    const hasAny =
      tickets.some(t => (quantities[t.id] || 0) > 0) ||
      addOns.some(a => (addOnQuantities[a.id] || 0) > 0)
    if (!hasAny) return
    setStep('your-details')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 2 → 3  (validates form first)
  const handleContinueToCheckout = () => {
    const errors: Partial<AttendeeForm> = {}
    if (!attendee.name.trim())  errors.name  = 'Full name is required'
    if (!attendee.email.trim() || !/\S+@\S+\.\S+/.test(attendee.email))
      errors.email = 'Valid email is required'
    if (!attendee.phone.trim()) errors.phone = 'Phone number is required'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    setStep('checkout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Called by TicketingOrderSummary on step 3 (isCheckout=true)
  const handlePaymentSuccess = async (reference: string, code: string) => {
    if (paymentInProgress.current) return
    paymentInProgress.current = true
    if (!eventId || !event) { paymentInProgress.current = false; return }

    setProcessing(true)
    // Switch to confirmation immediately so the spinner shows
    setStep('confirmation')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const finalCode = code || `SC-${Date.now()}`
      setTicketCode(finalCode)

      // Generate QR code
      const qr = await QRCode.toDataURL(
        JSON.stringify({ code: finalCode, event: event.name, attendee: attendee.name, ref: reference }),
        { width: 200, margin: 1, color: { dark: '#0dc75e', light: '#060e1c' } }
      )
      setQrDataUrl(qr)

      // Increment sold counts on each ticket type
      const selectedLines = tickets.filter(t => (quantities[t.id] || 0) > 0)
      await Promise.all(
        selectedLines.map(t =>
          updateDoc(doc(db, 'events', eventId!, 'tickets', t.id), {
            sold: (t.sold || 0) + (quantities[t.id] || 0),
          })
        )
      )

      // Save ticket to user dashboard if logged in
      if (user?.uid) {
        let dateStr = ''
        try {
          const raw = event.date
          const d   = raw?.toDate ? raw.toDate() : new Date(raw)
          dateStr   = d.toISOString().split('T')[0]
        } catch { /* ignore */ }

        const primaryTicket = selectedLines[0]
        const totalQty      = selectedLines.reduce((s, t) => s + (quantities[t.id] || 0), 0)

        saveTicketToUser(user.uid, {
          eventId:       eventId!,
          eventName:     event.name,
          eventImage:    event.coverImage || '',
          eventDate:     dateStr,
          eventTime:     event.startTime ? formatTime(event.startTime) : '',
          eventLocation: event.venue || (event as any).address || '',
          eventCategory: (event as any).type || (event as any).category || '',
          ticketCode:    finalCode,
          ticketType:    primaryTicket?.name || '',
          qty:           totalQty,
          attendeeName:  attendee.name,
          attendeeEmail: attendee.email,
        }).catch(console.error)
      }

      // Send confirmation email (fire-and-forget)
      const primaryTicket = selectedLines[0]
      const totalQty      = selectedLines.reduce((s, t) => s + (quantities[t.id] || 0), 0)
      fetch(`${CF_BASE}/sendTicketConfirmation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName:   attendee.name,
          attendeeEmail:  attendee.email,
          phone:          attendee.phone,
          ticketCode:     finalCode,
          ticketType:     primaryTicket?.name || '',
          ticketQty:      totalQty,
          eventName:      event.name,
          eventDate:      formatDate(event.date),
          eventTime:      event.startTime ? formatTime(event.startTime) : '',
          venueName:      (event as any).venue    || '',
          venueAddress:   (event as any).address  || '',
          organizerEmail: (event as any).organizerEmail || (event as any).organizer?.email || '',
        }),
      }).catch(console.error)

    } catch (e) {
      console.error(e)
      paymentInProgress.current = false
    }

    setProcessing(false)
    paymentInProgress.current = false
  }

  // ── Loading / not-found guards ────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{TK_GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}><RiLoader4Line size={32} /></div>
      <p style={{ color: '#c4cbdb', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading tickets…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#060e1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{TK_GLOBAL_CSS}</style>
      <RiAlertLine size={40} color="rgba(255,255,255,0.3)" />
      <p style={{ color: '#c4cbdb', fontFamily: 'Inter, sans-serif' }}>Event not found</p>
      <button onClick={() => navigate(-1)} className="tk-btn-primary" style={{ padding: '10px 22px' }}>Go Back</button>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{TK_GLOBAL_CSS}</style>

      <div className="tk-page">
        <Navbar />

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px clamp(16px,4%,56px) 60px' }}>
          <TicketingHeader event={event} onShare={handleShare} copied={copied} />
          <TicketingSteps current={step} />

          {/* ══ STEP 1: SELECT TICKETS ══════════════════════════════════════ */}
          {step === 'select-tickets' && (
            <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TicketingTicketList
                  tickets={tickets}
                  quantities={quantities}
                  onQtyChange={handleQtyChange}
                  addOns={addOns}
                  addOnQuantities={addOnQuantities}
                  onAddOnAdd={handleAddOnAdd}
                />
              </div>

              <div className="tk-sidebar" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24 }}>
                <TicketingOrderSummary
                  event={event}
                  heroImg={heroImg}
                  tickets={tickets}
                  quantities={quantities}
                  addOns={addOns}
                  addOnQuantities={addOnQuantities}
                  onClearAll={handleClearAll}
                  onContinue={handleContinueToDetails}
                  onBuyForGroup={() => navigate(`/events/${eventId}/tickets/group`)}
                  ctaLabel="Continue to Details"
                  isCheckout={false}
                  userEmail=""
                  userName=""
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          )}

          {/* ══ STEP 2: YOUR DETAILS ════════════════════════════════════════ */}
          {step === 'your-details' && (
            <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

              {/* Details form */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 18, background: 'var(--card)', padding: 28 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
                    Your Details
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                    Your ticket confirmation will be sent to the email below.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Full Name */}
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input
                        className="tk-input"
                        placeholder="e.g. Amara Okafor"
                        value={attendee.name}
                        onChange={e => {
                          setAttendee(a => ({ ...a, name: e.target.value }))
                          if (formErrors.name) setFormErrors(f => ({ ...f, name: undefined }))
                        }}
                        style={inputStyle(!!formErrors.name)}
                      />
                      {formErrors.name && <p style={errorStyle}>{formErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input
                        className="tk-input"
                        type="email"
                        placeholder="e.g. amara@email.com"
                        value={attendee.email}
                        onChange={e => {
                          setAttendee(a => ({ ...a, email: e.target.value }))
                          if (formErrors.email) setFormErrors(f => ({ ...f, email: undefined }))
                        }}
                        style={inputStyle(!!formErrors.email)}
                      />
                      {formErrors.email && <p style={errorStyle}>{formErrors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        className="tk-input"
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={attendee.phone}
                        onChange={e => {
                          setAttendee(a => ({ ...a, phone: e.target.value }))
                          if (formErrors.phone) setFormErrors(f => ({ ...f, phone: undefined }))
                        }}
                        style={inputStyle(!!formErrors.phone)}
                      />
                      {formErrors.phone && <p style={errorStyle}>{formErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Nav */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                    <button
                      className="tk-btn-outline"
                      style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => setStep('select-tickets')}
                    >
                      <RiArrowLeftLine size={15} /> Back
                    </button>
                    <button
                      className="tk-btn-primary"
                      style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onClick={handleContinueToCheckout}
                    >
                      Continue to Checkout <RiArrowRightLine size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky order preview — isCheckout=false so CTA just calls onContinue */}
              <div className="tk-sidebar" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24 }}>
                <TicketingOrderSummary
                  event={event}
                  heroImg={heroImg}
                  tickets={tickets}
                  quantities={quantities}
                  addOns={addOns}
                  addOnQuantities={addOnQuantities}
                  onClearAll={handleClearAll}
                  onContinue={handleContinueToCheckout}
                  onBuyForGroup={() => navigate(`/events/${eventId}/tickets/group`)}
                  ctaLabel="Continue to Checkout"
                  isCheckout={false}
                  userEmail={attendee.email}
                  userName={attendee.name}
                  userPhone={attendee.phone}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          )}

          {/* ══ STEP 3: CHECKOUT ════════════════════════════════════════════ */}
          {step === 'checkout' && (
            <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

              {/* Left: attendee review */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 18, background: 'var(--card)', padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Attendee Details</h3>
                    <button
                      onClick={() => setStep('your-details')}
                      style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                    >
                      Edit
                    </button>
                  </div>
                  {[
                    { label: 'Name',  value: attendee.name  },
                    { label: 'Email', value: attendee.email },
                    { label: 'Phone', value: attendee.phone },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 50, flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="tk-btn-outline"
                  style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}
                  onClick={() => setStep('your-details')}
                >
                  <RiArrowLeftLine size={15} /> Back to Details
                </button>
              </div>

              {/* Right: order summary — isCheckout=true triggers payment */}
              <div className="tk-sidebar" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24 }}>
                <TicketingOrderSummary
                  event={event}
                  heroImg={heroImg}
                  tickets={tickets}
                  quantities={quantities}
                  addOns={addOns}
                  addOnQuantities={addOnQuantities}
                  onClearAll={handleClearAll}
                  onContinue={() => {}}
                  onBuyForGroup={() => navigate(`/events/${eventId}/tickets/group`)}
                  ctaLabel="Pay Now"
                  isCheckout={true}
                  userEmail={attendee.email}
                  userName={attendee.name}
                  userPhone={attendee.phone}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={msg => alert(msg)}
                />
              </div>
            </div>
          )}

          {/* ══ STEP 4: CONFIRMATION ════════════════════════════════════════ */}
          {step === 'confirmation' && (
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 0 60px' }}>
              {processing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}>
                    <RiLoader4Line size={36} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                    Processing your ticket…
                  </p>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 20, background: 'var(--card)', padding: '36px 28px', textAlign: 'center' }}>

                  <RiCheckboxCircleLine size={56} color="var(--green)" style={{ marginBottom: 16 }} />

                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>
                    You're going! 🎉
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                    Your ticket has been sent to{' '}
                    <strong style={{ color: 'var(--text)' }}>{attendee.email}</strong>.
                  </p>

                  {/* Ticket card */}
                  <div style={{ border: '1px solid rgba(13,199,94,0.25)', borderRadius: 16, background: 'rgba(13,199,94,0.05)', padding: '20px 20px 16px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Ticket Code</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>
                      {ticketCode}
                    </div>

                    {qrDataUrl && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <img
                          src={qrDataUrl}
                          alt="Ticket QR Code"
                          style={{ width: 140, height: 140, borderRadius: 12, border: '2px solid rgba(13,199,94,0.3)' }}
                        />
                      </div>
                    )}

                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{event.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(event.date)}{event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
                    </div>
                    {(event as any).venue && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{(event as any).venue}</div>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                      For: <strong style={{ color: 'var(--text)' }}>{attendee.name}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {qrDataUrl && (
                      <button
                        className="tk-btn-primary"
                        style={{ flex: 1, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                        onClick={() => {
                          const a = document.createElement('a')
                          a.download = `StageCheck-${ticketCode}.png`
                          a.href = qrDataUrl
                          a.click()
                        }}
                      >
                        <RiDownload2Line size={15} /> Download Ticket
                      </button>
                    )}
                    <button
                      className="tk-btn-outline"
                      style={{ flex: 1, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                      onClick={handleShare}
                    >
                      <RiShareLine size={15} /> Share Event
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/event/${eventId}`)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}
                  >
                    Back to event page
                  </button>
                </div>
              )}
            </div>
          )}

          <TicketingTrustFooter />
        </div>
      </div>
    </>
  )
}