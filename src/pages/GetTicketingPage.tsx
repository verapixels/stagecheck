// ─── GetTicketsPage.tsx ─────────────────────────────────────────────────────
// Route: /event/:eventId/tickets

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiLoader4Line, RiAlertLine,
  RiArrowRightLine, RiArrowLeftLine,
  RiCheckboxCircleLine, RiDownload2Line, RiShareLine,
  RiMailLine, RiCheckLine,
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
import TicketingTrustFooter from '../components/ticketing/TicketingTrustFooter'

const CF_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

interface AttendeeForm {
  name: string
  email: string
  phone: string
}

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

function fmtNaira(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

const PLATFORM_FEE_RATE   = 0.05
const SERVICE_CHARGE_RATE = 0.075

function generateTicketCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return 'SC-' + Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-')
}

// ─── Inline Order Summary ─────────────────────────────────────────────────────
function OrderSummaryCard({
  event, heroImg, tickets, quantities, addOns, addOnQuantities,
  onClearAll, onContinue, ctaLabel, isCheckout,
  userEmail, userName, userPhone,
  onPaymentSuccess, onPaymentError, paying, setPaying,
}: {
  event: EventData
  heroImg: string
  tickets: TicketType[]
  quantities: Record<string, number>
  addOns: AddOn[]
  addOnQuantities: Record<string, number>
  onClearAll: () => void
  onContinue: () => void
  ctaLabel: string
  isCheckout: boolean
  userEmail: string
  userName: string
  userPhone?: string
  onPaymentSuccess: (ref: string, code: string) => void
  onPaymentError?: (msg: string) => void
  paying: boolean
  setPaying: (v: boolean) => void
}) {
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

  if (!hasSelection) return null

  const handleCTA = () => {
    if (!isCheckout) { onContinue(); return }

    if (isFree) {
      onPaymentSuccess(`free_${Date.now()}`, generateTicketCode())
      return
    }

    const Paystack = (window as any).PaystackPop
    if (!Paystack) {
      onPaymentError?.('Paystack is not loaded yet. Please try again.')
      return
    }

    const selectedLine = lines[0]
    setPaying(true)
    const handler = Paystack.setup({
      key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:    userEmail,
      amount:   total * 100,
      currency: 'NGN',
      ref:      `SC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      metadata: {
        eventId:       event.id,
        ticketTypeId:  selectedLine?.id || '',
        ticketType:    selectedLine?.name || '',
        quantity:      lines.reduce((s, t) => s + (quantities[t.id] || 0), 0),
        attendeeName:  userName,
        attendeeEmail: userEmail,
        phone:         userPhone || '',
        eventName:     event.name,
      },
      callback: (response: { reference: string }) => {
        setPaying(false)
        onPaymentSuccess(response.reference, generateTicketCode())
      },
      onClose: () => setPaying(false),
    })
    handler.openIframe()
  }

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 18,
      background: 'var(--card)',
      overflow: 'hidden',
    }}>
      {/* Event mini header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
        {heroImg && (
          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
            <img src={heroImg} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {formatDate(event.date)}{event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Line items */}
        <div style={{ marginBottom: 14 }}>
          {lines.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {quantities[t.id]} × {t.price === 0 ? 'Free' : fmtNaira(t.price)}
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {t.price === 0 ? 'Free' : fmtNaira(t.price * quantities[t.id])}
              </span>
            </div>
          ))}
          {addOnLines.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>×{addOnQuantities[a.id]}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtNaira(a.price * addOnQuantities[a.id])}</span>
            </div>
          ))}
        </div>

        {/* Fee breakdown */}
        {!isFree && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, marginBottom: 12 }}>
            {[
              { label: 'Subtotal', value: fmtNaira(subtotal) },
              { label: 'Platform Fee (5%)', value: fmtNaira(platformFee) },
              { label: 'Service Charge (7.5%)', value: fmtNaira(serviceCharge) },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 7 }}>
                <span>{r.label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, marginBottom: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>{isFree ? 'Free' : fmtNaira(total)}</span>
        </div>

        {/* CTA */}
        <button
          className="tk-btn-primary"
          style={{
            width: '100%', padding: '13px 0', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: paying ? 0.6 : 1,
            cursor: paying ? 'not-allowed' : 'pointer',
          }}
          disabled={paying}
          onClick={handleCTA}
        >
          {paying ? 'Processing…' : isCheckout && isFree ? 'Claim Free Ticket' : ctaLabel}
          {!paying && <RiArrowRightLine size={16} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 12, justifyContent: 'center' }}>
          <RiCheckboxCircleLine size={13} color="var(--green)" />
          Secure Ticketing · 100% Buyer Protection
        </div>
      </div>
    </div>
  )
}

// ─── Register Interest Panel ──────────────────────────────────────────────────
function RegisterInterestPanel({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'events', eventId, 'interestedAttendees'), {
        name:      name.trim(),
        email:     email.trim().toLowerCase(),
        phone:     phone.trim(),
        createdAt: serverTimestamp(),
      })
      setDone(true)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) return (
    <div style={{ border: '1px solid rgba(13,199,94,0.25)', borderRadius: 18, background: 'rgba(13,199,94,0.05)', padding: '36px 24px', textAlign: 'center' }}>
      <RiCheckLine size={40} color="var(--green)" style={{ marginBottom: 12 }} />
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>You're on the list!</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
        We'll email <strong style={{ color: 'var(--text)' }}>{email}</strong> as soon as tickets go on sale.
      </p>
    </div>
  )

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, background: 'var(--card)', padding: '28px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <RiMailLine size={20} color="var(--green)" />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Register Your Interest</h3>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.6 }}>
        Tickets aren't available yet. Drop your details and we'll notify you the moment they go on sale.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input className="tk-input" placeholder="e.g. Amara Okafor" value={name}
            onChange={e => setName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input className="tk-input" type="email" placeholder="e.g. amara@email.com" value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            style={{ width: '100%', boxSizing: 'border-box', ...(error ? { borderColor: '#f87171' } : {}) }} />
          {error && <p style={errorStyle}>{error}</p>}
        </div>
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input className="tk-input" type="tel" placeholder="e.g. 08012345678" value={phone}
            onChange={e => setPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <button
        className="tk-btn-primary"
        style={{ width: '100%', marginTop: 22, padding: '13px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1 }}
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'Submitting…' : 'Notify Me When Tickets Are Available'}
        {!submitting && <RiArrowRightLine size={16} />}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GetTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()
  const location    = useLocation()
  const { user }    = useAuth()

  const locationState = (location.state || {}) as {
    preSelectedTicketId?: string
    preSelectedQty?: number
  }

  const [event, setEvent]     = useState<EventData | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [addOns, setAddOns]   = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<TicketingStep>('select-tickets')
  const [quantities, setQuantities]             = useState<Record<string, number>>({})
  const [addOnQuantities, setAddOnQuantities]   = useState<Record<string, number>>({})
  const [copied, setCopied]   = useState(false)
  const [paying, setPaying]   = useState(false)

  const [attendee, setAttendee]     = useState<AttendeeForm>({ name: '', email: '', phone: '' })
  const [formErrors, setFormErrors] = useState<Partial<AttendeeForm>>({})

  const [ticketCode, setTicketCode] = useState('')
  const [qrDataUrl, setQrDataUrl]   = useState('')
  const [processing, setProcessing] = useState(false)
  const paymentInProgress = useRef(false)
  const stateApplied      = useRef(false)

  // Load Paystack
  useEffect(() => {
    if (document.getElementById('paystack-inline-script')) return
    const s = document.createElement('script')
    s.id  = 'paystack-inline-script'
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(s)
  }, [])

  // Load event + tickets + addons
  useEffect(() => {
    if (!eventId) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId!))
        if (snap.exists()) setEvent({ id: snap.id, ...snap.data() } as EventData)

        const tSnap = await getDocs(collection(db, 'events', eventId!, 'tickets'))
        const loadedTickets = tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType))
        setTickets(loadedTickets)

        const aSnap = await getDocs(collection(db, 'events', eventId!, 'addOns'))
        setAddOns(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)))

        // Pre-fill from EventDetailPage selection (only once)
        if (!stateApplied.current && locationState.preSelectedTicketId) {
          const match = loadedTickets.find(t => t.id === locationState.preSelectedTicketId)
          if (match) {
            const rem = match.quantity - (match.sold || 0)
            const isFreeTicket = match.price === 0
            // Free tickets: max 1
            const qty = isFreeTicket ? 1 : Math.min(locationState.preSelectedQty || 1, rem)
            if (rem > 0) setQuantities({ [match.id]: qty })
          }
          stateApplied.current = true
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      setAttendee(a => ({
        name:  a.name  || user.displayName || '',
        email: a.email || user.email       || '',
        phone: a.phone,
      }))
    }
  }, [user])

  const heroImg = event?.coverImage || event?.media?.find(m => m.type === 'image')?.url || ''
  const noTickets = tickets.length === 0

  const handleQtyChange = (ticketId: string, qty: number) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    // Free tickets: max 1
    const maxAllowed = ticket.price === 0 ? 1 : ticket.quantity - (ticket.sold || 0)
    setQuantities(q => ({ ...q, [ticketId]: Math.min(qty, maxAllowed) }))
  }

  const handleAddOnAdd = (addOnId: string) =>
    setAddOnQuantities(q => ({ ...q, [addOnId]: (q[addOnId] || 0) + 1 }))

  const handleClearAll = () => { setQuantities({}); setAddOnQuantities({}) }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: event?.name, url })
    else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleContinueToDetails = () => {
    const hasAny = tickets.some(t => (quantities[t.id] || 0) > 0) ||
                   addOns.some(a => (addOnQuantities[a.id] || 0) > 0)
    if (!hasAny) return
    setStep('your-details')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  const handlePaymentSuccess = async (reference: string, code: string) => {
    if (paymentInProgress.current) return
    paymentInProgress.current = true
    if (!eventId || !event) { paymentInProgress.current = false; return }

    setProcessing(true)
    setStep('confirmation')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const finalCode = code || `SC-${Date.now()}`
      setTicketCode(finalCode)

      const qr = await QRCode.toDataURL(
        JSON.stringify({ code: finalCode, event: event.name, attendee: attendee.name, ref: reference }),
        { width: 200, margin: 1, color: { dark: '#0dc75e', light: '#060e1c' } }
      )
      setQrDataUrl(qr)

      const selectedLines = tickets.filter(t => (quantities[t.id] || 0) > 0)
      await Promise.all(
        selectedLines.map(t =>
          updateDoc(doc(db, 'events', eventId!, 'tickets', t.id), {
            sold: (t.sold || 0) + (quantities[t.id] || 0),
          })
        )
      )

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
          eventId: eventId!, eventName: event.name,
          eventImage: event.coverImage || '', eventDate: dateStr,
          eventTime: event.startTime ? formatTime(event.startTime) : '',
          eventLocation: event.venue || (event as any).address || '',
          eventCategory: (event as any).type || (event as any).category || '',
          ticketCode: finalCode, ticketType: primaryTicket?.name || '',
          qty: totalQty, attendeeName: attendee.name, attendeeEmail: attendee.email,
        }).catch(console.error)
      }

      const primaryTicket = selectedLines[0]
      const totalQty      = selectedLines.reduce((s, t) => s + (quantities[t.id] || 0), 0)
      fetch(`${CF_BASE}/sendTicketConfirmation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: attendee.name, attendeeEmail: attendee.email,
          phone: attendee.phone, ticketCode: finalCode,
          ticketType: primaryTicket?.name || '', ticketQty: totalQty,
          eventName: event.name, eventDate: formatDate(event.date),
          eventTime: event.startTime ? formatTime(event.startTime) : '',
          venueName: (event as any).venue || '', venueAddress: (event as any).address || '',
          eventImage: event.coverImage || '',
        }),
      }).catch(console.error)
    } catch (e) {
      console.error(e)
      paymentInProgress.current = false
    }

    setProcessing(false)
    paymentInProgress.current = false
  }

  // ── Loading / not found ───────────────────────────────────────────────────

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

  // ── No tickets → Register Interest ───────────────────────────────────────
  if (noTickets) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{TK_GLOBAL_CSS}</style>
      <div className="tk-page">
        <Navbar />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px clamp(16px,4%,40px) 60px' }}>
          <TicketingHeader event={event} onShare={handleShare} copied={copied} />
          <RegisterInterestPanel eventId={eventId!} eventName={event.name} />
          <TicketingTrustFooter />
        </div>
      </div>
    </>
  )

  // ── Main render ───────────────────────────────────────────────────────────
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

          {/* ══ STEP 1: SELECT TICKETS ════════════════════════════════════ */}
          {step === 'select-tickets' && (
            <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TicketingTicketList
                  tickets={tickets}
                  quantities={quantities}
                  onQtyChange={handleQtyChange}
                  addOns={addOns.length > 0 ? addOns : []}
                  addOnQuantities={addOnQuantities}
                  onAddOnAdd={handleAddOnAdd}
                />
              </div>

              {/* Order summary — only shows when something selected */}
              <div className="tk-sidebar" style={{ width: 340, flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: 24 }}>
                  <OrderSummaryCard
                    event={event} heroImg={heroImg}
                    tickets={tickets} quantities={quantities}
                    addOns={addOns} addOnQuantities={addOnQuantities}
                    onClearAll={handleClearAll}
                    onContinue={handleContinueToDetails}
                    ctaLabel="Continue to Details"
                    isCheckout={false}
                    userEmail="" userName=""
                    onPaymentSuccess={handlePaymentSuccess}
                    paying={paying} setPaying={setPaying}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 2: YOUR DETAILS ══════════════════════════════════════ */}
          {step === 'your-details' && (
            <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 18, background: 'var(--card)', padding: 28 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>Your Details</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                    Your ticket confirmation will be sent to the email below.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input className="tk-input" placeholder="e.g. Amara Okafor" value={attendee.name}
                        onChange={e => { setAttendee(a => ({ ...a, name: e.target.value })); if (formErrors.name) setFormErrors(f => ({ ...f, name: undefined })) }}
                        style={inputStyle(!!formErrors.name)} />
                      {formErrors.name && <p style={errorStyle}>{formErrors.name}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input className="tk-input" type="email" placeholder="e.g. amara@email.com" value={attendee.email}
                        onChange={e => { setAttendee(a => ({ ...a, email: e.target.value })); if (formErrors.email) setFormErrors(f => ({ ...f, email: undefined })) }}
                        style={inputStyle(!!formErrors.email)} />
                      {formErrors.email && <p style={errorStyle}>{formErrors.email}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input className="tk-input" type="tel" placeholder="e.g. 08012345678" value={attendee.phone}
                        onChange={e => { setAttendee(a => ({ ...a, phone: e.target.value })); if (formErrors.phone) setFormErrors(f => ({ ...f, phone: undefined })) }}
                        style={inputStyle(!!formErrors.phone)} />
                      {formErrors.phone && <p style={errorStyle}>{formErrors.phone}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                    <button className="tk-btn-outline" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setStep('select-tickets')}>
                      <RiArrowLeftLine size={15} /> Back
                    </button>
                    <button className="tk-btn-primary" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleContinueToCheckout}>
                      Continue to Checkout <RiArrowRightLine size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="tk-sidebar" style={{ width: 340, flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: 24 }}>
                  <OrderSummaryCard
                    event={event} heroImg={heroImg}
                    tickets={tickets} quantities={quantities}
                    addOns={addOns} addOnQuantities={addOnQuantities}
                    onClearAll={handleClearAll}
                    onContinue={handleContinueToCheckout}
                    ctaLabel="Continue to Checkout"
                    isCheckout={false}
                    userEmail={attendee.email} userName={attendee.name} userPhone={attendee.phone}
                    onPaymentSuccess={handlePaymentSuccess}
                    paying={paying} setPaying={setPaying}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 3: CHECKOUT ══════════════════════════════════════════ */}
          {step === 'checkout' && (
            <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 18, background: 'var(--card)', padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Attendee Details</h3>
                    <button onClick={() => setStep('your-details')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                  {[{ label: 'Name', value: attendee.name }, { label: 'Email', value: attendee.email }, { label: 'Phone', value: attendee.phone }].map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 50, flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <button className="tk-btn-outline" style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setStep('your-details')}>
                  <RiArrowLeftLine size={15} /> Back to Details
                </button>
              </div>

              <div className="tk-sidebar" style={{ width: 340, flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: 24 }}>
                  <OrderSummaryCard
                    event={event} heroImg={heroImg}
                    tickets={tickets} quantities={quantities}
                    addOns={addOns} addOnQuantities={addOnQuantities}
                    onClearAll={handleClearAll}
                    onContinue={() => {}}
                    ctaLabel="Pay Now"
                    isCheckout={true}
                    userEmail={attendee.email} userName={attendee.name} userPhone={attendee.phone}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={msg => alert(msg)}
                    paying={paying} setPaying={setPaying}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 4: CONFIRMATION ══════════════════════════════════════ */}
          {step === 'confirmation' && (
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 0 60px' }}>
              {processing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}><RiLoader4Line size={36} /></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Processing your ticket…</p>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--card-border)', borderRadius: 20, background: 'var(--card)', padding: '36px 28px', textAlign: 'center' }}>
                  <RiCheckboxCircleLine size={56} color="var(--green)" style={{ marginBottom: 16 }} />
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>You're going! 🎉</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                    Your ticket has been sent to <strong style={{ color: 'var(--text)' }}>{attendee.email}</strong>.
                  </p>
                  <div style={{ border: '1px solid rgba(13,199,94,0.25)', borderRadius: 16, background: 'rgba(13,199,94,0.05)', padding: '20px 20px 16px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Ticket Code</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>{ticketCode}</div>
                    {qrDataUrl && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <img src={qrDataUrl} alt="QR" style={{ width: 140, height: 140, borderRadius: 12, border: '2px solid rgba(13,199,94,0.3)' }} />
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{event.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(event.date)}{event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
                    </div>
                    {(event as any).venue && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{(event as any).venue}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>For: <strong style={{ color: 'var(--text)' }}>{attendee.name}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {qrDataUrl && (
                      <button className="tk-btn-primary" style={{ flex: 1, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                        onClick={() => { const a = document.createElement('a'); a.download = `StageCheck-${ticketCode}.png`; a.href = qrDataUrl; a.click() }}>
                        <RiDownload2Line size={15} /> Download Ticket
                      </button>
                    )}
                    <button className="tk-btn-outline" style={{ flex: 1, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }} onClick={handleShare}>
                      <RiShareLine size={15} /> Share Event
                    </button>
                  </div>
                  <button onClick={() => navigate(`/event/${eventId}`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                    Back to event page
                  </button>
                </div>
              )}
            </div>
          )}

          <TicketingTrustFooter />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}