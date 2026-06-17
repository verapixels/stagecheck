import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs, addDoc,
  updateDoc, serverTimestamp, query, limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiCalendarEventLine, RiMapPinLine, RiTimeLine,
  RiTicketLine, RiArrowRightLine, RiArrowLeftLine, RiCheckLine,
  RiCloseLine, RiDownloadLine, RiMailLine, RiPhoneLine,
  RiUserLine, RiShieldCheckLine, RiLockLine, RiBankCardLine,
  RiBankLine, RiLoader4Line, RiMusicLine, RiShareLine,
  RiTimerLine, RiAlertLine, RiCheckboxCircleLine,
  RiExternalLinkLine, RiRefreshLine, RiArrowDownSLine,
  RiArrowUpSLine, RiCalendar2Line, RiMapPin2Line,
  RiGroupLine, RiHeartLine, RiHeartFill, RiFlag2Line,
  RiInstagramLine, RiGlobalLine, RiInformationLine,
  RiStarLine, RiFileTextLine, RiBuilding2Line,
 RiCarLine, RiBusLine, RiWalkLine,
  RiRepeatLine, RiAlarmLine, RiParkingLine,
  RiUserVoiceLine, RiHashtag, RiBarChartLine,
  RiAccountCircleLine, RiTeamLine,
} from 'react-icons/ri'
import QRCode from 'qrcode'

// ─── Types ────────────────────────────────────────────────────────
interface EventData {
  id: string
  name: string
  date: any
  endDate?: string
  startTime?: string
  endTime?: string
  isRepeating?: boolean
  venue?: string
  address?: string
  locationType?: string
  description?: string
  summary?: string
  coverImage?: string
  media?: { url: string; type: string }[]
  featuredArtists?: { name: string; image: string; genre: string; listeners: string; bio: string; role?: string }[]
  agenda?: { id: string; time: string; title: string; speaker?: string }[]
  faq?: { id: string; question: string; answer: string }[]
  goodToKnow?: { ageInfo: string; doorTime: string; parkingInfo: string }
  organizer?: { name: string; email: string; phone: string }
  organizerEmail?: string
  eventType?: string
  joinCode?: string
  slug?: string
  status?: string
  enabledModules?: string[]
  maxPerformers?: number
  attendingCount?: number
}

interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
  sold: number
  description?: string
  color: string
}

interface AttendeeForm {
  name: string
  email: string
  phone: string
  altPhone: string
}

type PaymentMethod = 'card' | 'transfer'
type Step = 'details' | 'select-ticket' | 'attendee-form' | 'payment' | 'success'

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(val: any): string {
  try {
    let d: Date
    if (val?.toDate) d = val.toDate()
    else if (val instanceof Date) d = val
    else d = new Date(val)
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return '' }
}

function formatDateShort(val: any): string {
  try {
    let d: Date
    if (val?.toDate) d = val.toDate()
    else if (val instanceof Date) d = val
    else d = new Date(val)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

function formatTime(time: string): string {
  if (!time) return ''
  try {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch { return time }
}

function getEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    choir: 'Choir Concert', talent: 'Talent Show', conference: 'Conference',
    competition: 'Competition', drama: 'Drama / Theatre', worship: 'Worship Night',
    openmic: 'Open Mic', graduation: 'Award / Graduation', custom: 'Event',
  }
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return 'SC-' + Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-')
}

declare global { interface Window { PaystackPop: any } }

function loadPaystack(): Promise<void> {
  return new Promise(resolve => {
    if (window.PaystackPop) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

// ─── Main Component ───────────────────────────────────────────────
export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventData | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [relatedEvents, setRelatedEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('details')
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card')
  const [attendee, setAttendee] = useState<AttendeeForm>({ name: '', email: '', phone: '', altPhone: '' })
  const [formErrors, setFormErrors] = useState<Partial<AttendeeForm>>({})
  const [processing, setProcessing] = useState(false)
  const [ticketCode, setTicketCode] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [expandFaq, setExpandFaq] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [transferDetails, setTransferDetails] = useState<{ accountNumber: string; bankName: string; reference: string } | null>(null)
  const [transferCountdown, setTransferCountdown] = useState(300)
  const [transferExpired, setTransferExpired] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const countdownRef = useRef<any>(null)
  const ticketRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false)

  // ── DOUBLE-CLICK FIX: this ref blocks any second call to handlePaymentSuccess ──
  const paymentInProgress = useRef(false)

  const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxx'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (!eventId) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId!))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as EventData
          setEvent(data)
          try {
            const rq = query(collection(db, 'events'), limit(4))
            const rSnap = await getDocs(rq)
            setRelatedEvents(
              rSnap.docs.filter(d => d.id !== eventId).slice(0, 3)
                .map(d => ({ id: d.id, ...d.data() } as EventData))
            )
          } catch { /* ignore */ }
        }
        const tSnap = await getDocs(collection(db, 'events', eventId!, 'tickets'))
        setTickets(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType)))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [eventId])

  useEffect(() => {
    if (step === 'payment' && payMethod === 'transfer' && transferDetails) {
      setTransferCountdown(300)
      setTransferExpired(false)
      countdownRef.current = setInterval(() => {
        setTransferCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current); setTransferExpired(true); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(countdownRef.current)
  }, [step, payMethod, transferDetails])

  const fmtCountdown = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const totalAmount = selectedTicket ? selectedTicket.price * qty : 0

  const validateAttendee = () => {
    const e: Partial<AttendeeForm> = {}
    if (!attendee.name.trim()) e.name = 'Full name is required'
    if (!attendee.email.trim() || !/\S+@\S+\.\S+/.test(attendee.email)) e.email = 'Valid email required'
    if (!attendee.phone.trim()) e.phone = 'Phone number is required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCardPayment = useCallback(async () => {
    if (!validateAttendee()) return
    if (paymentInProgress.current) return  // block double click
    setProcessing(true)
    try {
      await loadPaystack()
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY, email: attendee.email, amount: totalAmount * 100, currency: 'NGN',
        callback: async (response: any) => { await handlePaymentSuccess(response.reference) },
        onClose: () => { setProcessing(false) },
      })
      handler.openIframe()
    } catch { setProcessing(false) }
  }, [attendee, totalAmount, PAYSTACK_KEY])

  const handleBankTransfer = async () => {
    if (!validateAttendee()) return
    if (paymentInProgress.current) return  // block double click
    setProcessing(true)
    setTransferDetails({
      accountNumber: '0' + Math.floor(100000000 + Math.random() * 900000000).toString(),
      bankName: 'Wema Bank (Verapixels)',
      reference: 'SC_' + Date.now(),
    })
    setProcessing(false)
  }

  const handlePaymentSuccess = async (reference: string) => {
    // ── GUARD: if already running, do nothing — prevents multiple emails ──
    if (paymentInProgress.current) return
    paymentInProgress.current = true

    if (!eventId || !selectedTicket || !event) {
      paymentInProgress.current = false
      return
    }

    setProcessing(true)
    const code = generateTicketCode()
    setTicketCode(code)

    try {
      await addDoc(collection(db, 'events', eventId, 'attendees'), {
        name: attendee.name, email: attendee.email, phone: attendee.phone,
        altPhone: attendee.altPhone, ticketType: selectedTicket.name,
        ticketTypeId: selectedTicket.id, ticketColor: selectedTicket.color,
        ticketCode: code, quantity: qty, totalPaid: totalAmount,
        paymentMethod: payMethod, paymentReference: reference,
        eventName: event.name, eventDate: event.date, eventVenue: event.venue || '',
        checkedIn: false, purchasedAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'events', eventId, 'tickets', selectedTicket.id), {
        sold: (selectedTicket.sold || 0) + qty,
      })
      const qr = await QRCode.toDataURL(
        JSON.stringify({ code, event: event.name, attendee: attendee.name, ticket: selectedTicket.name }),
        { width: 200, margin: 1, color: { dark: '#0dc75e', light: '#060e1c' } }
      )
      setQrDataUrl(qr)
      setStep('success')

      // Send ticket confirmation email (fire and forget — don't block success screen)
      fetch('https://us-central1-stagecheck-699c7.cloudfunctions.net/sendTicketConfirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: attendee.name,
          attendeeEmail: attendee.email,
          phone: attendee.phone,
          ticketCode: code,
          ticketType: selectedTicket.name,
          ticketQty: qty,
          eventName: event.name,
          eventDate: formatDate(event.date),
          eventTime: event.startTime ? formatTime(event.startTime) : '',
          venueName: event.venue || '',
          venueAddress: event.address || '',
          organizerEmail: event.organizerEmail || event.organizer?.email || '',
        }),
      }).catch(e => console.error('Ticket email failed:', e))

    } catch (e) {
      console.error(e)
      // If something failed, release the lock so they can retry
      paymentInProgress.current = false
    }

    setProcessing(false)
  }

  const handleVerifyTransfer = async () => {
    if (!transferDetails) return
    if (paymentInProgress.current) return  // block double click
    setVerifying(true)
    await new Promise(r => setTimeout(r, 2000))
    await handlePaymentSuccess(transferDetails.reference)
    setVerifying(false)
  }

  const downloadTicket = () => {
    if (!ticketRef.current) return
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(ticketRef.current!, { backgroundColor: '#060e1c', scale: 2 }).then(canvas => {
        const a = document.createElement('a')
        a.download = `StageCheck-Ticket-${ticketCode}.png`
        a.href = canvas.toDataURL('image/png')
        a.click()
      })
    }).catch(() => {
      const a = document.createElement('a')
      a.download = `ticket-${ticketCode}.png`
      a.href = qrDataUrl
      a.click()
    })
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

  const allMedia = event ? [
    ...(event.coverImage ? [{ url: event.coverImage, type: 'image' }] : []),
    ...(event.media || []),
  ] : []
  const allImages = allMedia.filter(m => m.type === 'image')
  const heroImg = allImages[0]?.url || ''

  const minPrice = tickets.filter(t => t.price > 0).length > 0
    ? Math.min(...tickets.filter(t => t.price > 0).map(t => t.price))
    : 0
  const isFree = tickets.length > 0 && tickets.every(t => t.price === 0)
  const hasFeatured = (event?.featuredArtists || []).length > 0
  const hasAgenda = (event?.agenda || []).length > 0
  const hasFAQ = (event?.faq || []).length > 0
  const hasGTK = event?.goodToKnow && Object.values(event.goodToKnow).some(v => v)

  const inputSt = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  })

  const mapsEmbedUrl = event?.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed&z=15&hl=en`
    : event?.venue
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed&z=15&hl=en`
    : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}><RiLoader4Line size={32} /></div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>Loading event…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <RiAlertLine size={40} color="rgba(255,255,255,0.2)" />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>Event not found</p>
      <button onClick={() => navigate(-1)} style={{ background: '#0dc75e', border: 'none', color: '#000', padding: '10px 22px', borderRadius: 9, cursor: 'pointer', fontWeight: 700 }}>Go Back</button>
    </div>
  )

  // ── TICKET DRAWER ─────────────────────────────────────────────
  const renderDrawerContent = () => {
    if (step === 'select-ticket') return renderTicketSelect()
    if (step === 'attendee-form') return renderAttendeeForm()
    if (step === 'payment') return renderPayment()
    if (step === 'success') return renderSuccess()
    return null
  }

  const renderTicketSelect = () => (
    <div style={{ paddingTop: 20 }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>Choose a ticket type to continue</p>
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          <RiTicketLine size={36} style={{ display: 'block', margin: '0 auto 12px' }} />
          No tickets available yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tickets.map(t => {
            const rem = t.quantity - t.sold
            const selected = selectedTicket?.id === t.id
            const soldOut = rem <= 0
            return (
              <div key={t.id} onClick={() => !soldOut && setSelectedTicket(t)}
                style={{ border: `1.5px solid ${selected ? t.color : soldOut ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, overflow: 'hidden', cursor: soldOut ? 'not-allowed' : 'pointer', background: selected ? `${t.color}0d` : 'rgba(255,255,255,0.02)', opacity: soldOut ? 0.5 : 1, transition: 'all 0.2s', position: 'relative' }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${t.color}, ${t.color}50)` }} />
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 3 }}>{t.name}</div>
                      {t.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{t.description}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: soldOut ? 'rgba(255,255,255,0.3)' : t.color, fontFamily: 'Syne, sans-serif' }}>
                        {t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: 11, color: soldOut ? '#f87171' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                        {soldOut ? 'Sold out' : `${rem} left`}
                      </div>
                    </div>
                  </div>
                  {selected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.color}25` }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Quantity</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        <button onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)) }} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>−</button>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', minWidth: 24, textAlign: 'center', fontFamily: 'Syne, sans-serif' }}>{qty}</span>
                        <button onClick={e => { e.stopPropagation(); setQty(q => Math.min(rem, q + 1)) }} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>+</button>
                      </div>
                    </div>
                  )}
                </div>
                {selected && <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RiCheckLine size={12} color="#000" /></div>}
              </div>
            )
          })}
        </div>
      )}
      {selectedTicket && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(13,199,94,0.06)', borderRadius: 10, marginBottom: 14, border: '1px solid rgba(13,199,94,0.15)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0dc75e', fontFamily: 'Syne, sans-serif' }}>{totalAmount === 0 ? 'Free' : `₦${totalAmount.toLocaleString()}`}</span>
          </div>
          <button onClick={() => setStep('attendee-form')} style={{ width: '100%', padding: '14px', background: '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Continue <RiArrowRightLine size={16} />
          </button>
        </div>
      )}
    </div>
  )

  const renderAttendeeForm = () => (
    <div style={{ paddingTop: 20 }}>
      <button onClick={() => setStep('select-ticket')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
        <RiArrowLeftLine size={15} /> Back
      </button>
      <div style={{ background: 'rgba(13,199,94,0.06)', border: '1px solid rgba(13,199,94,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedTicket?.name} × {qty}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0dc75e', fontFamily: 'Syne, sans-serif' }}>{totalAmount === 0 ? 'Free' : `₦${totalAmount.toLocaleString()}`}</div>
        </div>
        <button onClick={() => setStep('select-ticket')} style={{ fontSize: 11, color: '#0dc75e', background: 'none', border: '1px solid rgba(13,199,94,0.3)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer' }}>Change</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Full Name *', type: 'text', field: 'name' as const, placeholder: 'John Doe' },
          { label: 'Email Address *', type: 'email', field: 'email' as const, placeholder: 'you@example.com' },
          { label: 'Phone Number *', type: 'tel', field: 'phone' as const, placeholder: '+234 801 234 5678' },
          { label: 'Alternative Number (optional)', type: 'tel', field: 'altPhone' as const, placeholder: '+234 802 345 6789' },
        ].map(f => (
          <div key={f.field}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input type={f.type} style={inputSt(formErrors[f.field])} placeholder={f.placeholder}
              value={attendee[f.field]}
              onChange={e => setAttendee(a => ({ ...a, [f.field]: e.target.value }))}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(13,199,94,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = formErrors[f.field] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'} />
            {formErrors[f.field] && <span style={{ fontSize: 11, color: '#f87171', marginTop: 4, display: 'block' }}>{formErrors[f.field]}</span>}
          </div>
        ))}
      </div>
      <button onClick={() => { if (validateAttendee()) setStep('payment') }} style={{ width: '100%', padding: '14px', background: '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 }}>
        Continue to Payment <RiArrowRightLine size={16} />
      </button>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
        Your ticket confirmation will be sent to your email address.
      </p>
    </div>
  )

  const renderPayment = () => (
    <div style={{ paddingTop: 20 }}>
      <button onClick={() => setStep('attendee-form')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
        <RiArrowLeftLine size={15} /> Back
      </button>
      <div style={{ background: 'rgba(13,199,94,0.06)', border: '1px solid rgba(13,199,94,0.15)', borderRadius: 10, padding: '14px 16px', marginBottom: 22 }}>
        <div style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>{selectedTicket?.name} × {qty}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{attendee.name} · {attendee.email}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0dc75e', fontFamily: 'Syne, sans-serif' }}>{totalAmount === 0 ? 'Free' : `₦${totalAmount.toLocaleString()}`}</span>
        </div>
      </div>
      {totalAmount === 0 ? (
        // ── FREE TICKET BUTTON — disabled + spinner while processing ──
        <button
          onClick={() => { if (!processing && !paymentInProgress.current) handlePaymentSuccess('free_' + Date.now()) }}
          disabled={processing}
          style={{ width: '100%', padding: '14px', background: processing ? 'rgba(13,199,94,0.5)' : '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: processing ? 0.8 : 1, transition: 'all 0.2s' }}>
          {processing
            ? <><RiLoader4Line size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…</>
            : <><RiCheckboxCircleLine size={16} /> Claim Free Ticket</>
          }
        </button>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              { id: 'card' as PaymentMethod, icon: <RiBankCardLine size={18} />, label: 'Card', sub: 'Debit / Credit' },
              { id: 'transfer' as PaymentMethod, icon: <RiBankLine size={18} />, label: 'Bank Transfer', sub: 'Get account no.' }
            ].map(m => (
              <button key={m.id} onClick={() => { setPayMethod(m.id); setTransferDetails(null); setTransferExpired(false) }}
                style={{ border: `1.5px solid ${payMethod === m.id ? 'rgba(13,199,94,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '14px 12px', background: payMethod === m.id ? 'rgba(13,199,94,0.07)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ color: payMethod === m.id ? '#0dc75e' : 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: payMethod === m.id ? '#fff' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m.sub}</div>
              </button>
            ))}
          </div>

          {/* ── CARD PAYMENT BUTTON — disabled + spinner while processing ── */}
          {payMethod === 'card' && (
            <button
              onClick={() => { if (!processing && !paymentInProgress.current) handleCardPayment() }}
              disabled={processing}
              style={{ width: '100%', padding: '14px', background: processing ? 'rgba(13,199,94,0.5)' : '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: processing ? 0.8 : 1, transition: 'all 0.2s' }}>
              {processing
                ? <><RiLoader4Line size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                : <><RiLockLine size={15} /> Pay ₦{totalAmount.toLocaleString()} Securely</>
              }
            </button>
          )}

          {payMethod === 'transfer' && (
            !transferDetails ? (
              // ── GENERATE ACCOUNT BUTTON — disabled + spinner while processing ──
              <button
                onClick={() => { if (!processing && !paymentInProgress.current) handleBankTransfer() }}
                disabled={processing}
                style={{ width: '100%', padding: '14px', background: processing ? 'rgba(13,199,94,0.5)' : '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: processing ? 0.8 : 1, transition: 'all 0.2s' }}>
                {processing
                  ? <><RiLoader4Line size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                  : <><RiBankLine size={15} /> Generate Bank Account</>
                }
              </button>
            ) : transferExpired ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 14, color: '#f87171', fontWeight: 600, marginBottom: 12 }}>Account number expired</div>
                <button onClick={() => { setTransferDetails(null); setTransferExpired(false) }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 18px', borderRadius: 9, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                  <RiRefreshLine size={14} /> Generate New Account
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background: 'rgba(13,199,94,0.05)', border: '1px solid rgba(13,199,94,0.2)', borderRadius: 14, padding: '20px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transfer Details</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: transferCountdown < 60 ? 'rgba(239,68,68,0.12)' : 'rgba(13,199,94,0.12)', borderRadius: 20, padding: '4px 10px' }}>
                      <RiTimerLine size={12} color={transferCountdown < 60 ? '#f87171' : '#0dc75e'} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: transferCountdown < 60 ? '#f87171' : '#0dc75e', fontFamily: 'Syne, sans-serif' }}>{fmtCountdown(transferCountdown)}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Bank</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{transferDetails.bankName}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Account Number</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0dc75e', fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em' }}>
                      {transferDetails.accountNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Amount</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>₦{totalAmount.toLocaleString()}</div>
                  </div>
                </div>
                {/* ── VERIFY TRANSFER BUTTON — disabled + spinner while verifying ── */}
                <button
                  onClick={() => { if (!verifying && !paymentInProgress.current) handleVerifyTransfer() }}
                  disabled={verifying}
                  style={{ width: '100%', padding: '13px', background: verifying ? 'rgba(13,199,94,0.5)' : '#0dc75e', border: 'none', color: '#000', borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: verifying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: verifying ? 0.8 : 1, transition: 'all 0.2s' }}>
                  {verifying
                    ? <><RiLoader4Line size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying…</>
                    : <><RiCheckLine size={15} /> I've Made the Transfer</>
                  }
                </button>
              </div>
            )
          )}
        </>
      )}
    </div>
  )

  const renderSuccess = () => (
    <div style={{ paddingTop: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(13,199,94,0.15)', border: '2px solid rgba(13,199,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', animation: 'popIn 0.4s cubic-bezier(.16,1,.3,1)' }}>
          <RiCheckLine size={30} color="#0dc75e" />
        </div>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>You're in!</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Ticket sent to <strong style={{ color: '#0dc75e' }}>{attendee.email}</strong></p>
      </div>
      <div ref={ticketRef} style={{ background: 'linear-gradient(135deg, #060e1c 0%, #04091a 100%)', border: `1px solid ${selectedTicket?.color || '#0dc75e'}30`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: `0 0 40px ${selectedTicket?.color || '#0dc75e'}15` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${selectedTicket?.color || '#0dc75e'}, ${selectedTicket?.color || '#0dc75e'}60)` }} />
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: selectedTicket?.color || '#0dc75e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{selectedTicket?.name}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', lineHeight: 1.2, marginBottom: 10 }}>{event.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {event.date && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}><RiCalendarEventLine size={11} color={selectedTicket?.color || '#0dc75e'} />{formatDate(event.date)}{event.startTime ? ` · ${formatTime(event.startTime)}` : ''}</div>}
                {event.venue && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}><RiMapPinLine size={11} color={selectedTicket?.color || '#0dc75e'} />{event.venue}</div>}
              </div>
            </div>
            {qrDataUrl && <div style={{ flexShrink: 0, padding: 6, background: '#060e1c', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}><img src={qrDataUrl} alt="QR" style={{ width: 72, height: 72, display: 'block' }} /></div>}
          </div>
        </div>
        <div style={{ padding: '14px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Attendee</div><div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{attendee.name}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Ticket Code</div><div style={{ fontSize: 12, fontWeight: 700, color: selectedTicket?.color || '#0dc75e', fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em' }}>{ticketCode}</div></div>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>StageCheck · <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0dc75e', textDecoration: 'none' }}>Verapixels</a></span>
            <span style={{ fontSize: 11, fontWeight: 700, color: selectedTicket?.color || '#0dc75e', fontFamily: 'Syne, sans-serif' }}>{totalAmount === 0 ? 'FREE' : `₦${selectedTicket?.price?.toLocaleString()}`}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={downloadTicket} style={{ flex: 1, padding: '12px', background: 'rgba(13,199,94,0.1)', border: '1px solid rgba(13,199,94,0.3)', color: '#0dc75e', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <RiDownloadLine size={15} /> Download
        </button>
        <button onClick={() => { setTicketDrawerOpen(false); setStep('details') }} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Back to Event
        </button>
      </div>
    </div>
  )

  // ═══ MAIN PAGE ═══════════════════════════════════════════════
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #000612; --bg2: #04091a; --bg-card: #060e1c;
          --green: #0dc75e; --border: rgba(255,255,255,0.07);
          --text: #f0faf2; --muted: #4a6a52; --nav-h: 64px;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from { opacity:0; transform: scale(0.7); } to { opacity:1; transform: scale(1); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 1.4s infinite; display:inline-block; }
        input, textarea, select { -webkit-appearance:none; appearance:none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .sc { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: clamp(18px,3vw,28px); margin-bottom: 14px; }
        .btn-main { background: var(--green); color: #000; border: none; border-radius: 11px; padding: 13px 28px; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'DM Sans',sans-serif; box-shadow: 0 0 24px rgba(13,199,94,0.35); transition: all 0.2s; }
        .btn-main:hover { background: #1bd46a; box-shadow: 0 0 36px rgba(13,199,94,0.5); transform: translateY(-1px); }
        .maps-iframe { width: 100%; height: 100%; border: 0; border-radius: 14px; filter: invert(90%) hue-rotate(150deg) saturate(1.4) brightness(0.85); }
        @media (max-width: 900px) {
          .detail-layout { flex-direction: column !important; }
          .detail-sidebar { width: 100% !important; position: static !important; }
        }
        @media (max-width: 768px) {
          .hero-h1 { font-size: clamp(22px, 7vw, 36px) !important; }
          .desktop-only { display: none !important; }
        }
      `}</style>

      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* NAV */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400, height: 'var(--nav-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px,4%,48px)', background: scrolled ? 'rgba(0,4,14,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.3s' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}>
            <RiArrowLeftLine size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setLiked(v => !v)} style={{ width: 36, height: 36, borderRadius: 9, background: liked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${liked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: liked ? '#f87171' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
              {liked ? <RiHeartFill size={15} /> : <RiHeartLine size={15} />}
            </button>
            <button onClick={handleShare} style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
              <RiShareLine size={15} />
            </button>
            <button className="btn-main desktop-only" onClick={() => { setStep('select-ticket'); setTicketDrawerOpen(true) }} style={{ padding: '9px 20px', borderRadius: 9, fontSize: 13 }}>
              <RiTicketLine size={14} /> Get Tickets
            </button>
          </div>
        </nav>

        {/* HERO */}
        <div style={{ position: 'relative', height: 'clamp(300px, 48vh, 500px)', overflow: 'hidden' }}>
          {heroImg
            ? <img src={heroImg} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a1628 0%, #1a0a2e 50%, #0f1e0f 100%)' }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,6,18,1) 0%, rgba(0,6,18,0.55) 45%, rgba(0,6,18,0.15) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(20px,5%,60px) clamp(16px,5%,64px) 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {getEventTypeLabel(event.eventType || '')}
              </span>
              {event.status === 'active' && <span style={{ fontSize: 10, background: 'rgba(13,199,94,0.15)', border: '1px solid rgba(13,199,94,0.3)', color: 'var(--green)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>ACTIVE</span>}
            </div>
            <h1 className="hero-h1" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px,5vw,54px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: 12, maxWidth: 700 }}>
              {event.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
              {event.date && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}><RiCalendarEventLine size={13} color="var(--green)" />{formatDateShort(event.date)}</div>}
              {event.startTime && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}><RiTimeLine size={13} color="var(--green)" />{formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}</div>}
              {event.venue && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}><RiMapPinLine size={13} color="var(--green)" />{event.venue}</div>}
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="detail-layout" style={{ display: 'flex', gap: 24, padding: 'clamp(20px,3vw,40px) clamp(16px,5%,64px)', maxWidth: 1120, margin: '0 auto', alignItems: 'flex-start', paddingBottom: 120 }}>

          {/* LEFT CONTENT */}
          <div style={{ flex: 1, minWidth: 0 }}>

            <div className="sc" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 180 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(13,199,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RiCalendar2Line size={18} color="var(--green)" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date & Time</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{formatDate(event.date)}</div>
                  {event.startTime && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      {formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
                      {event.endTime && (() => {
                        try {
                          const [sh, sm] = event.startTime!.split(':').map(Number)
                          const [eh, em] = event.endTime!.split(':').map(Number)
                          const diff = (eh * 60 + em) - (sh * 60 + sm)
                          if (diff > 0) return <span style={{ marginLeft: 8, background: 'rgba(13,199,94,0.12)', color: 'var(--green)', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{diff >= 60 ? `${Math.floor(diff/60)}h${diff%60 ? ` ${diff%60}m` : ''}` : `${diff}m`}</span>
                        } catch { return null }
                      })()}
                    </div>
                  )}
                  {event.endDate && event.endDate !== event.date && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Ends: {formatDateShort(event.endDate + 'T00:00:00')}</div>
                  )}
                  {event.isRepeating && (
                    <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RiRepeatLine size={12} /> Repeating event
                    </div>
                  )}
                </div>
              </div>

              {(event.venue || event.locationType) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 180 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(13,199,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RiMapPin2Line size={18} color="var(--green)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {event.locationType === 'online' ? 'Online Event' : event.locationType === 'tba' ? 'Location' : 'Venue'}
                    </div>
                    {event.venue && <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{event.venue}</div>}
                    {event.address && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{event.address}</div>}
                    {event.locationType === 'online' && event.address && (
                      <a href={event.address} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}>
                        <RiExternalLinkLine size={11} /> Join Online
                      </a>
                    )}
                    {event.locationType !== 'online' && event.address && (
                      <a href={`https://maps.google.com?q=${encodeURIComponent(event.address)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}>
                        <RiExternalLinkLine size={11} /> Open in Maps
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(event.summary || event.description) && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RiFileTextLine size={13} /> Event Overview
                </div>
                {event.summary && (
                  <p style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.92)', lineHeight: 1.75, marginBottom: event.description ? 14 : 0 }}>{event.summary}</p>
                )}
                {event.description && (
                  <>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, maxHeight: descExpanded ? 'none' : '140px', overflow: descExpanded ? 'visible' : 'hidden', maskImage: descExpanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: descExpanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)', whiteSpace: 'pre-line' }}>
                      {event.description}
                    </div>
                    {event.description.length > 200 && (
                      <button onClick={() => setDescExpanded(v => !v)} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--green)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                        {descExpanded ? <><RiArrowUpSLine size={16} /> Show less</> : <><RiArrowDownSLine size={16} /> Read more</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {hasGTK && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RiInformationLine size={13} /> Good to Know
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {event.goodToKnow!.doorTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
                      <RiAlarmLine size={16} color="var(--green)" />
                      <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Door Time</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.goodToKnow!.doorTime}</div></div>
                    </div>
                  )}
                  {event.goodToKnow!.ageInfo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
                      <RiGroupLine size={16} color="#fbbf24" />
                      <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age Restriction</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.goodToKnow!.ageInfo}</div></div>
                    </div>
                  )}
                  {event.goodToKnow!.parkingInfo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
                      <RiParkingLine size={16} color="#60a5fa" />
                      <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parking</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.goodToKnow!.parkingInfo}</div></div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
                    <RiBuilding2Line size={16} color="#a78bfa" />
                    <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.locationType === 'online' ? 'Online' : 'In Person'}</div></div>
                  </div>
                </div>
              </div>
            )}

            {allImages.length > 1 && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Gallery</div>
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 10, aspectRatio: '16/7' }}>
                  <img src={allImages[activeImg].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(allImages.length, 5)}, 1fr)`, gap: 8 }}>
                  {allImages.map((img, i) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', border: `2px solid ${i === activeImg ? 'var(--green)' : 'transparent'}`, transition: 'border-color 0.2s' }}>
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasFeatured && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RiUserVoiceLine size={13} /> Lineup
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
                  {event.featuredArtists!.map((a, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(13,199,94,0.25)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                      <div style={{ height: 110, overflow: 'hidden', background: 'rgba(168,139,250,0.1)', position: 'relative' }}>
                        {a.image && !a.image.includes('2a96cbd8b46e442fc41c2b86b821562f') ? (
                          <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => {
                              const img = e.currentTarget; img.onerror = null
                              fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.name)}`, { headers: { Accept: 'application/json' } })
                                .then(r => r.json()).then(d => { if (d?.thumbnail?.source) img.src = d.thumbnail.source })
                                .catch(() => { img.style.display = 'none' })
                            }}
                          />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <RiMusicLine size={28} color="rgba(168,139,250,0.5)" />
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '0 8px', fontWeight: 600 }}>{a.name}</span>
                          </div>
                        )}
                        {a.role && <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', fontSize: 9, fontWeight: 700, color: '#fff', padding: '2px 7px', borderRadius: 4 }}>{a.role}</div>}
                      </div>
                      <div style={{ padding: '10px 12px 12px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{a.genre}</div>
                        {a.listeners && a.listeners !== '—' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{a.listeners} listeners</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasAgenda && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RiTimeLine size={13} /> Schedule
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {event.agenda!.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', gap: 16, paddingBottom: i < event.agenda!.length - 1 ? 16 : 0, marginBottom: i < event.agenda!.length - 1 ? 16 : 0, borderBottom: i < event.agenda!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ flexShrink: 0, width: 76, paddingTop: 2 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', fontFamily: 'Syne, sans-serif' }}>{item.time || '—'}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: item.speaker ? 4 : 0 }}>{item.title}</div>
                        {item.speaker && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{item.speaker}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.venue && event.locationType !== 'online' && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RiMapPin2Line size={13} /> Location
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>{event.venue}</div>
                    {event.address && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>{event.address}</div>}
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>How to get there</div>
                    {[
                      { label: 'Driving', icon: <RiCarLine size={14} />, mode: 'driving' },
                      { label: 'Public Transport', icon: <RiBusLine size={14} />, mode: 'transit' },
                      { label: 'Walking', icon: <RiWalkLine size={14} />, mode: 'walking' },
                    ].map(({ label, icon, mode }) => (
                      <a key={label} href={`https://maps.google.com?q=${encodeURIComponent(event.address || event.venue || '')}&mode=${mode}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--green)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)'}>
                        <span style={{ color: 'var(--green)' }}>{icon}</span> {label}
                      </a>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 220, borderRadius: 14, overflow: 'hidden', height: 220, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(13,199,94,0.2)', position: 'relative' }}>
                    {mapsEmbedUrl ? (
                      <iframe className="maps-iframe" src={mapsEmbedUrl} title={`Map of ${event.venue}`} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                        <RiMapPin2Line size={28} color="rgba(13,199,94,0.4)" />
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0 20px' }}>{event.venue}</div>
                      </div>
                    )}
                    <a href={`https://maps.google.com?q=${encodeURIComponent(event.address || event.venue || '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(13,199,94,0.9)', color: '#000', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(8px)' }}>
                      <RiExternalLinkLine size={11} /> Open Maps
                    </a>
                  </div>
                </div>
              </div>
            )}

            {hasFAQ && (
              <div className="sc">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Frequently Asked</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {event.faq!.map(f => (
                    <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <button onClick={() => setExpandFaq(expandFaq === f.id ? null : f.id)}
                        style={{ width: '100%', background: expandFaq === f.id ? 'rgba(13,199,94,0.06)' : 'rgba(255,255,255,0.02)', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{f.question}</span>
                        {expandFaq === f.id ? <RiArrowUpSLine size={16} color="var(--green)" /> : <RiArrowDownSLine size={16} color="rgba(255,255,255,0.4)" />}
                      </button>
                      {expandFaq === f.id && (
                        <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 }}>{f.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="sc" style={{ background: 'rgba(13,199,94,0.03)', border: '1px solid rgba(13,199,94,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(13,199,94,0.1)', border: '2px solid rgba(13,199,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RiShieldCheckLine size={22} color="var(--green)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>
                    Powered by <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>Verapixels</a>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Questions about this event? Our support team is here to help.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                    <a href="mailto:info.verapixels@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--green)'} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'}><RiMailLine size={13} /> info.verapixels@gmail.com</a>
                    <a href="tel:+2349058187851" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--green)'} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'}><RiPhoneLine size={13} /> +234 905 818 7851</a>
                    <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--green)'} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'}><RiGlobalLine size={13} /> verapixels.com</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href="mailto:info.verapixels@gmail.com" style={{ padding: '8px 16px', background: 'rgba(13,199,94,0.1)', border: '1px solid rgba(13,199,94,0.3)', borderRadius: 9, color: 'var(--green)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(13,199,94,0.15)' }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(13,199,94,0.1)' }}>
                    <RiMailLine size={13} /> Contact Support
                  </a>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)'}>
                <RiFlag2Line size={13} /> Report this event
              </button>
            </div>

            {relatedEvents.length > 0 && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>You might also like…</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>More events you may enjoy</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {relatedEvents.map(ev => (
                    <div key={ev.id} onClick={() => navigate(`/event/${ev.id}`)}
                      style={{ display: 'flex', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(13,199,94,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}>
                      <div style={{ width: 100, flexShrink: 0, background: ev.coverImage ? 'transparent' : 'linear-gradient(135deg, #1a0a2e, #3b1d7a)', overflow: 'hidden' }}>
                        {ev.coverImage ? <img src={ev.coverImage} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RiCalendarEventLine size={24} color="rgba(255,255,255,0.2)" /></div>}
                      </div>
                      <div style={{ padding: '14px 14px 14px 0', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><RiCalendarEventLine size={11} /> {formatDateShort(ev.date)}</div>
                        {ev.venue && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}><RiMapPinLine size={11} /> {ev.venue}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="detail-sidebar" style={{ width: 320, flexShrink: 0, position: 'sticky', top: 88 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(13,199,94,0.2)', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, var(--green), rgba(13,199,94,0.3))' }} />
              <div style={{ padding: '22px 22px 20px' }}>
                <div style={{ marginBottom: 16 }}>
                  {tickets.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>No tickets available yet.</div>
                  ) : isFree ? (
                    <div><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: 'Syne, sans-serif' }}>Free</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>This event is free to attend</div></div>
                  ) : (
                    <div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>From</div><div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>₦{minPrice.toLocaleString()}</div></div>
                  )}
                </div>
                {tickets.length > 0 && (
                  <div style={{ marginBottom: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    {tickets.slice(0, 4).map(t => {
                      const rem = t.quantity - t.sold; const soldOut = rem <= 0
                      return (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: soldOut ? 'rgba(255,255,255,0.2)' : t.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: soldOut ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)' }}>{t.name}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: soldOut ? 'rgba(255,255,255,0.2)' : t.price === 0 ? 'var(--green)' : '#fff', fontFamily: 'Syne, sans-serif' }}>
                            {soldOut ? 'Sold out' : t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}
                          </span>
                        </div>
                      )
                    })}
                    {tickets.length > 4 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>+{tickets.length - 4} more ticket types</div>}
                  </div>
                )}
                <button onClick={() => { setStep('select-ticket'); setTicketDrawerOpen(true) }} className="btn-main" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 11, fontSize: 14 }}>
                  <RiTicketLine size={16} /> {tickets.length === 0 ? 'Register Interest' : isFree ? 'Register Free' : 'Get Tickets'}
                </button>
                {tickets.length > 0 && !isFree && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10 }}>No booking fees · Secure checkout</div>}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 22px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Event Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {event.date && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,199,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><RiCalendarEventLine size={15} color="var(--green)" /></div>
                    <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Date</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{formatDate(event.date)}</div>{event.endDate && event.endDate !== event.date && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Until {formatDateShort(event.endDate + 'T00:00:00')}</div>}</div>
                  </div>
                )}
                {event.startTime && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,199,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><RiTimeLine size={15} color="var(--green)" /></div>
                    <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Time</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}</div></div>
                  </div>
                )}
                {event.venue && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,199,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><RiMapPinLine size={15} color="var(--green)" /></div>
                    <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Venue</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.venue}</div>{event.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.5 }}>{event.address}</div>}{event.address && <a href={`https://maps.google.com?q=${encodeURIComponent(event.address)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--green)', marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}><RiExternalLinkLine size={10} /> Open in Maps</a>}</div>
                  </div>
                )}
                {event.eventType && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,199,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><RiStarLine size={15} color="var(--green)" /></div>
                    <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Event Type</div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{getEventTypeLabel(event.eventType)}</div></div>
                  </div>
                )}
                {event.isRepeating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                    <RiRepeatLine size={14} color="#fbbf24" /><span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>Repeating Event</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 12 }}>Share this event</div>
              <button onClick={handleShare} style={{ width: '100%', padding: '9px', background: copied ? 'rgba(13,199,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(13,199,94,0.3)' : 'var(--border)'}`, borderRadius: 9, color: copied ? 'var(--green)' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RiShareLine size={13} /> {copied ? 'Link Copied!' : 'Copy Event Link'}
              </button>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RiShieldCheckLine size={12} color="var(--green)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>StageCheck by <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>Verapixels</a></span>
            </div>
          </div>
        </div>

        {/* STICKY MOBILE CTA */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, padding: '12px 16px', background: 'rgba(2,8,20,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transform: scrolled ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s cubic-bezier(.16,1,.3,1)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 2 }}>{event.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tickets.length === 0 ? 'Free registration' : isFree ? 'Free' : `From ₦${minPrice.toLocaleString()}`}</div>
          </div>
          <button onClick={() => { setStep('select-ticket'); setTicketDrawerOpen(true) }} className="btn-main" style={{ padding: '12px 22px', fontSize: 14 }}>
            <RiTicketLine size={15} /> {isFree ? 'Register' : 'Get Tickets'}
          </button>
        </div>
      </div>

      {/* TICKET DRAWER */}
      {ticketDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setTicketDrawerOpen(false)} />
          <div style={{ width: 'min(520px,100vw)', background: '#020b18', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'slideInRight 0.3s cubic-bezier(.16,1,.3,1)' }}>
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 11, color: '#0dc75e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Get Tickets</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{event.name}</div>
              </div>
              <button onClick={() => setTicketDrawerOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={{ flex: 1, padding: '0 24px 24px', overflowY: 'auto' }}>
              {renderDrawerContent()}
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
              <RiShieldCheckLine size={12} color="#0dc75e" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
                StageCheck by <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0dc75e', textDecoration: 'none', fontWeight: 600 }}>Verapixels</a> · Payments by Paystack
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}