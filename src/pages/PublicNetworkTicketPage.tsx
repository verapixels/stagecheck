// src/pages/PublicNetworkTicketPage.tsx
// Flow: Step 1 → Attendee Details (dynamic org form)
//        Step 2 → Select Tickets & Add-ons + Order Summary
//        Step 3 → Payment Successful / Confirmation

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs,
  addDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import QRCode from 'qrcode'
import {
  RiLoader4Line, RiShieldCheckLine, RiArrowLeftLine,
  RiArrowRightLine, RiDownload2Line, RiShareLine,
  RiCalendarLine, RiHomeLine, RiMapPinLine, RiTimeLine,
  RiLockLine, RiCheckLine, RiMailLine, RiUserLine,
  RiPhoneLine, RiAlertLine,
} from 'react-icons/ri'
import { ChevronDown } from 'lucide-react'

const CF_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NetworkTicket {
  id: string
  name: string
  price: number
  isFree: boolean
  quantity: number
  sold: number
  type: 'individual' | 'group'
  groupSize?: number
  color: string
  description?: string
}

interface CustomField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio'
  required?: boolean
  options?: string[]
  placeholder?: string
}

interface OrgLevel {
  id: string
  name: string
  order: number
  color: string
}

interface OrgNode {
  id: string
  name: string
  levelId: string
  parentId?: string
}

type Step = 'details' | 'tickets' | 'success'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

function generateTicketCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return (
    'SC-' +
    Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    ).join('-')
  )
}

function formatEventDate(raw: any) {
  if (!raw) return ''
  try {
    const d = raw?.toDate ? raw.toDate() : new Date(raw)
    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

function formatEventDateShort(raw: any) {
  if (!raw) return ''
  try {
    const d = raw?.toDate ? raw.toDate() : new Date(raw)
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { key: 'details', num: 1, label: 'Attendee Details', sub: 'Fill in your details based on the organizer\'s requirements.' },
    { key: 'tickets', num: 2, label: 'Select Tickets & Add-ons', sub: 'Choose your tickets and any add-ons, then proceed to secure payment.' },
    { key: 'success', num: 3, label: 'Confirmation', sub: 'Your purchase is confirmed! Download, share, or add to calendar.' },
  ]
  const currentIdx = steps.findIndex(s => s.key === current)

  return (
    <div style={{ display: 'flex', gap: 0, padding: '20px 0 0' }}>
      {steps.map((s, i) => {
        const done   = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={s.key} style={{ flex: 1, paddingRight: i < 2 ? 16 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done ? '#0dc75e' : active ? '#0dc75e' : 'rgba(255,255,255,0.08)',
                color: done || active ? '#000' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
              }}>
                {done ? <RiCheckLine size={14} /> : s.num}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: active ? '#0dc75e' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                  marginBottom: 3,
                }}>
                  {active ? `${s.num}. ${s.label}` : `${s.num}.`}
                </div>
                {active && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                    {s.sub}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EventMiniCard({ event, heroImg }: { event: any; heroImg: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {heroImg && (
        <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: 14, overflow: 'hidden', marginBottom: 12, background: 'rgba(255,255,255,0.04)' }}>
          <img src={heroImg} alt={event?.eventName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {event?.date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <RiCalendarLine size={14} color="#0dc75e" />
            {formatEventDateShort(event.date)}
          </div>
        )}
        {event?.startTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <RiTimeLine size={14} color="#0dc75e" />
            {event.startTime}
          </div>
        )}
        {(event?.venue || event?.address) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <RiMapPinLine size={14} color="#0dc75e" />
            {event?.venue || event?.address}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  padding: '12px 14px',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 0.15s',
}

const LBL: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.75)',
  marginBottom: 7,
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LBL}>
        {label}
        {required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: '5px 0 0', fontSize: 11, color: '#f87171' }}>{error}</p>}
    </div>
  )
}

// ─── Ticket quantity row ──────────────────────────────────────────────────────

function TicketRow({ ticket, qty, onChange }: {
  ticket: NetworkTicket
  qty: number
  onChange: (n: number) => void
}) {
  const remaining = ticket.quantity - (ticket.sold || 0)
  const soldOut   = remaining <= 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: qty > 0 ? '1px solid rgba(13,199,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
      marginBottom: 10, transition: 'border-color 0.2s',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{ticket.name}</div>
        <div style={{ fontSize: 13, color: '#0dc75e', fontWeight: 700 }}>
          {ticket.isFree || ticket.price === 0 ? 'Free' : fmtNaira(ticket.price)}
        </div>
        {soldOut && <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>Sold out</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => onChange(Math.max(0, qty - 1))}
          disabled={qty === 0 || soldOut}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: qty > 0 ? 'rgba(13,199,94,0.1)' : 'transparent',
            color: qty > 0 ? '#0dc75e' : 'rgba(255,255,255,0.3)',
            fontSize: 18, cursor: qty > 0 ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          −
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', minWidth: 20, textAlign: 'center' }}>{qty}</span>
        <button
          onClick={() => onChange(Math.min(remaining, qty + 1))}
          disabled={soldOut || qty >= remaining}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: !soldOut && qty < remaining ? 'rgba(13,199,94,0.1)' : 'transparent',
            color: !soldOut && qty < remaining ? '#0dc75e' : 'rgba(255,255,255,0.3)',
            fontSize: 18, cursor: !soldOut && qty < remaining ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicNetworkTicketPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const [event,    setEvent]    = useState<any>(null)
  const [tickets,  setTickets]  = useState<NetworkTicket[]>([])
  const [config,   setConfig]   = useState<any>(null)
  const [levels,   setLevels]   = useState<OrgLevel[]>([])
  const [nodes,    setNodes]    = useState<OrgNode[]>([])
  const [loading,  setLoading]  = useState(true)
  const [step,     setStep]     = useState<Step>('details')

  // Step 1 — form state
  const [form,    setForm]    = useState<Record<string, string>>({})
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [submitting, setSub]  = useState(false)

  // Step 2 — ticket selection
  const [quantities, setQty]  = useState<Record<string, number>>({})

  // Step 3 — success
  const [ticketCode, setTicketCode] = useState('')
  const [qrDataUrl,  setQrDataUrl]  = useState('')
  const [paying,     setPaying]     = useState(false)
  const [payError,   setPayError]   = useState('')

  const paymentInProgress = useRef(false)

  const heroImg = event?.coverImage || ''

  // Load Paystack
  useEffect(() => {
    if (document.getElementById('paystack-inline')) return
    const s   = document.createElement('script')
    s.id      = 'paystack-inline'
    s.src     = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(s)
  }, [])

  // Load all data
  useEffect(() => {
    if (!eventId) return
    Promise.all([
      getDoc(doc(db, 'events', eventId)),
      getDoc(doc(db, 'events', eventId, 'config', 'networkForm')),
      getDocs(query(collection(db, 'events', eventId, 'orgLevels'), orderBy('order'))),
      getDocs(collection(db, 'events', eventId, 'orgNodes')),
      getDocs(collection(db, 'events', eventId, 'networkTickets')),
    ]).then(([evSnap, cfgSnap, lvlSnap, nodeSnap, tkSnap]) => {
      if (evSnap.exists()) setEvent({ id: evSnap.id, ...evSnap.data() })
      if (cfgSnap.exists()) setConfig(cfgSnap.data())
      setLevels(lvlSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrgLevel)))
      setNodes(nodeSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrgNode)))
      setTickets(tkSnap.docs.map(d => ({ id: d.id, ...d.data() } as NetworkTicket)))
      setLoading(false)
    })
  }, [eventId])

  const customFields: CustomField[] = config?.customFields ?? []
  const shownLevels = levels.slice(0, config?.levelDepth ?? levels.length)

  const nodesForLevel = (levelId: string, idx: number): OrgNode[] => {
    if (idx === 0) return nodes.filter(n => n.levelId === levelId)
    const parentLevel  = shownLevels[idx - 1]
    const parentNodeId = form[`level_${parentLevel.id}`]
    if (!parentNodeId) return []
    return nodes.filter(n => n.levelId === levelId && n.parentId === parentNodeId)
  }

  // ── Step 1 validation ──
  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!form['name']?.trim())  errs['name']  = 'Full name is required'
    if (!form['email']?.trim() || !/^\S+@\S+\.\S+$/.test(form['email'] ?? ''))
      errs['email'] = 'Valid email address required'
    if (config?.requirePhone && !form['phone']?.trim())
      errs['phone'] = 'Phone number is required'
    customFields.forEach(f => {
      if (f.required && !form[`custom_${f.id}`]?.trim())
        errs[`custom_${f.id}`] = `${f.label} is required`
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1Continue = () => {
    if (!validateStep1()) return
    setStep('tickets')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Payment ──
  const totalTickets = tickets.reduce((s, t) => s + (quantities[t.id] || 0), 0)
  const subtotal     = tickets.reduce((s, t) => {
    const q = quantities[t.id] || 0
    return s + (t.isFree || t.price === 0 ? 0 : t.price * q)
  }, 0)
  const isFree       = subtotal === 0 && totalTickets > 0
  const platformFee  = isFree ? 0 : Math.round(subtotal * 0.05)
  const serviceCharge = isFree ? 0 : Math.round(platformFee * 0.075)
  const total        = subtotal + platformFee + serviceCharge
  const hasSelection = totalTickets > 0

  const handlePayment = async () => {
    if (!hasSelection || paying || paymentInProgress.current) return
    setPayError('')

    if (isFree) {
      await doConfirm(`free_${Date.now()}`)
      return
    }

    const Paystack = (window as any).PaystackPop
    if (!Paystack) { setPayError('Paystack not loaded, please wait.'); return }

    const selectedTicket = tickets.find(t => (quantities[t.id] || 0) > 0)
    setPaying(true)

    const handler = Paystack.setup({
      key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:    form['email'],
      amount:   total * 100,
      currency: 'NGN',
      ref:      `SC-NET-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      metadata: {
        eventId,
        eventName:    event?.name,
        attendeeName: form['name'],
        ticketType:   selectedTicket?.name || '',
      },
      callback: (res: { reference: string }) => {
        setPaying(false)
        doConfirm(res.reference)
      },
      onClose: () => setPaying(false),
    })
    handler.openIframe()
  }

  const doConfirm = async (reference: string) => {
    if (paymentInProgress.current) return
    paymentInProgress.current = true
    const code = generateTicketCode()
    setTicketCode(code)

    try {
      // Build org path
      const orgPathParts: string[] = []
      shownLevels.forEach(level => {
        const nodeId = form[`level_${level.id}`]
        if (nodeId) {
          const node = nodes.find(n => n.id === nodeId)
          if (node) orgPathParts.push(node.name)
        }
      })

      // Save registration
      await addDoc(collection(db, 'events', eventId!, 'networkRegistrations'), {
        fullName:    form['name'].trim(),
        email:       form['email'].trim(),
        phone:       form['phone']?.trim() || null,
        orgPath:     orgPathParts.join(' › '),
        ticketCode:  code,
        ticketTypes: tickets
          .filter(t => (quantities[t.id] || 0) > 0)
          .map(t => ({ id: t.id, name: t.name, qty: quantities[t.id], price: t.price })),
        paymentRef:  reference,
        totalPaid:   total,
        checkedIn:   false,
        customFields: customFields.map(f => ({
          id: f.id, label: f.label, type: f.type,
          value: form[`custom_${f.id}`]?.trim() || '',
        })),
        ...shownLevels.reduce((acc, level) => {
          if (form[`level_${level.id}`]) {
            const node = nodes.find(n => n.id === form[`level_${level.id}`])
            acc[`level_${level.id}`] = node?.name ?? form[`level_${level.id}`]
          }
          return acc
        }, {} as Record<string, string>),
        submittedAt: serverTimestamp(),
      })

      // Generate QR
      const selectedTicket = tickets.find(t => (quantities[t.id] || 0) > 0)
      const qr = await QRCode.toDataURL(
        JSON.stringify({ code, event: event?.eventName, attendee: form['name'] }),
        { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
      )
      setQrDataUrl(qr)
      setStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Send email
      // Send email
const payload = {
  attendeeName:  form['name'],
  attendeeEmail: form['email'],
  phone:         form['phone'] || '',
  ticketCode:    code,
  ticketType:    selectedTicket?.name || 'Network Ticket',
  ticketQty:     totalTickets,
  eventName:     event?.name || '',
  eventDate:     formatEventDate(event?.date),
  eventTime:     event?.startTime || '',
  venueName:     event?.venue || '',
  venueAddress:  event?.address || '',
  eventImage:    event?.coverImage || '',
}
// Send email
fetch(`${CF_BASE}/sendTicketConfirmation`, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify(payload),
}).catch(console.error)
} catch (e) {
  console.error(e)
  paymentInProgress.current = false
}
}
  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060e1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}><RiLoader4Line size={28} /></div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#060e1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <RiAlertLine size={36} color="rgba(255,255,255,0.2)" />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Event not found</p>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Attendee Details
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'details') return (
    <div style={{ minHeight: '100vh', background: '#060e1c', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ntk-input:focus { border-color: rgba(13,199,94,0.5) !important; background: rgba(255,255,255,0.06) !important; }
        .ntk-select { appearance: none; -webkit-appearance: none; }
        .ntk-radio-card { cursor: pointer; transition: all 0.15s; }
        .ntk-radio-card:hover { border-color: rgba(13,199,94,0.3) !important; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: 'rgba(6,14,28,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/stagechecklogo.svg" alt="StageCheck" style={{ height: 26, display: 'block' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <RiLockLine size={12} color="#0dc75e" /> Secure &amp; Encrypted
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Back */}
        <button onClick={() => navigate(`/event/${eventId}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', padding: '0 0 16px', fontFamily: 'DM Sans, sans-serif' }}>
          <RiArrowLeftLine size={15} /> Back to Event
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Attendee Details</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#0dc75e' }}>
            <RiShieldCheckLine size={13} /> Secure registration
          </div>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          Please fill in your details to get your ticket
        </p>

        <EventMiniCard event={event} heroImg={heroImg} />

        {/* ── FORM ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 18px' }}>

          {/* Full Name */}
          <Field label="Full Name" required error={errors['name']}>
            <div style={{ position: 'relative' }}>
              <RiUserLine size={15} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="ntk-input"
                type="text"
                placeholder="Enter your full name"
                value={form['name'] || ''}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => { const n = { ...p }; delete n['name']; return n }) }}
                style={{ ...INP, paddingLeft: 36 }}
              />
            </div>
          </Field>

          {/* Email */}
          <Field label="Email Address" required error={errors['email']}>
            <div style={{ position: 'relative' }}>
              <RiMailLine size={15} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="ntk-input"
                type="email"
                placeholder="Enter your email address"
                value={form['email'] || ''}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => { const n = { ...p }; delete n['email']; return n }) }}
                style={{ ...INP, paddingLeft: 36 }}
              />
            </div>
          </Field>

          {/* Phone (if enabled) */}
          {config?.requirePhone && (
            <Field label="Phone Number" required={config?.requirePhone} error={errors['phone']}>
              <div style={{ position: 'relative' }}>
                <RiPhoneLine size={15} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="ntk-input"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form['phone'] || ''}
                  onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => { const n = { ...p }; delete n['phone']; return n }) }}
                  style={{ ...INP, paddingLeft: 36 }}
                />
              </div>
            </Field>
          )}

          {/* Custom fields (dynamic — text, email, tel, number, textarea, select, radio) */}
          {customFields.map(field => {
            const key = `custom_${field.id}`
            const val = form[key] || ''

            if (field.type === 'select' && field.options?.length) {
              return (
                <Field key={field.id} label={field.label} required={field.required} error={errors[key]}>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="ntk-input ntk-select"
                      value={val}
                      onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => { const n = { ...p }; delete n[key]; return n }) }}
                      style={{ ...INP, paddingRight: 36, cursor: 'pointer' }}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </Field>
              )
            }

            if (field.type === 'radio' && field.options?.length) {
              return (
                <Field key={field.id} label={field.label} required={field.required} error={errors[key]}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(field.options!.length, 3)}, 1fr)`, gap: 8 }}>
                    {field.options!.map(opt => {
                      const selected = val === opt
                      return (
                        <button
                          key={opt}
                          className="ntk-radio-card"
                          onClick={() => { setForm(p => ({ ...p, [key]: opt })); setErrors(p => { const n = { ...p }; delete n[key]; return n }) }}
                          style={{
                            padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                            border: selected ? '2px solid #0dc75e' : '1px solid rgba(255,255,255,0.1)',
                            background: selected ? 'rgba(13,199,94,0.1)' : 'rgba(255,255,255,0.03)',
                            color: selected ? '#0dc75e' : 'rgba(255,255,255,0.6)',
                            fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            position: 'relative',
                          }}
                        >
                          {selected && (
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#0dc75e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <RiCheckLine size={10} color="#000" />
                            </div>
                          )}
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </Field>
              )
            }

            if (field.type === 'textarea') {
              return (
                <Field key={field.id} label={field.label} required={field.required} error={errors[key]}>
                  <textarea
                    className="ntk-input"
                    rows={3}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    value={val}
                    onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => { const n = { ...p }; delete n[key]; return n }) }}
                    style={{ ...INP, resize: 'vertical', lineHeight: 1.6 } as React.CSSProperties}
                  />
                </Field>
              )
            }

            return (
              <Field key={field.id} label={field.label} required={field.required} error={errors[key]}>
                <input
                  className="ntk-input"
                  type={field.type}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={val}
                  onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => { const n = { ...p }; delete n[key]; return n }) }}
                  style={INP}
                />
              </Field>
            )
          })}

          {/* Org hierarchy dropdowns (cascade) */}
          {shownLevels.map((level, idx) => {
            const options  = nodesForLevel(level.id, idx)
            const disabled = idx > 0 && !form[`level_${shownLevels[idx - 1].id}`]
            const key      = `level_${level.id}`
            return (
              <Field key={level.id} label={level.name} required>
                <div style={{ position: 'relative' }}>
                  <select
                    className="ntk-input ntk-select"
                    disabled={disabled}
                    value={form[key] || ''}
                    onChange={e => {
                      const val = e.target.value
                      const reset: Record<string, string> = {}
                      shownLevels.slice(idx + 1).forEach(l => { reset[`level_${l.id}`] = '' })
                      setForm(p => ({ ...p, [key]: val, ...reset }))
                    }}
                    style={{
                      ...INP,
                      paddingRight: 36,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >
                    <option value="">
                      {disabled ? `Select ${shownLevels[idx - 1]?.name} first` : `Select ${level.name}`}
                    </option>
                    {options.map(node => (
                      <option key={node.id} value={node.id}>{node.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </Field>
            )
          })}
        </div>

        {/* Continue CTA */}
        <button
          onClick={handleStep1Continue}
          disabled={submitting}
          style={{
            width: '100%', marginTop: 16, padding: '14px 0',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #0dc75e, #0ab350)',
            color: '#000', fontSize: 15, fontWeight: 800,
            fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 24px rgba(13,199,94,0.3)',
          }}
        >
          Continue <RiArrowRightLine size={16} />
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
          <RiShieldCheckLine size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Your information is secure with us.
        </p>

        {/* Step indicators */}
        <StepIndicator current="details" />
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Select Tickets & Add-ons + Order Summary
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'tickets') return (
    <div style={{ minHeight: '100vh', background: '#060e1c', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top bar */}
      <div style={{ background: 'rgba(6,14,28,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/stagechecklogo.svg" alt="StageCheck" style={{ height: 26, display: 'block' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <RiLockLine size={12} color="#0dc75e" /> Secure &amp; Encrypted
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Back */}
        <button onClick={() => setStep('details')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', padding: '0 0 16px', fontFamily: 'DM Sans, sans-serif' }}>
          <RiArrowLeftLine size={15} /> Back
        </button>

        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Review Your Order</h1>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          Choose your tickets then proceed to secure payment
        </p>

        <EventMiniCard event={event} heroImg={heroImg} />

        {/* Tickets */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>Select Tickets</div>
          {tickets.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              No tickets available yet
            </div>
          ) : (
            tickets.map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                qty={quantities[t.id] || 0}
                onChange={n => setQty(p => ({ ...p, [t.id]: n }))}
              />
            ))
          )}
        </div>

        {/* Order Summary */}
        {hasSelection && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12, fontFamily: 'Syne, sans-serif' }}>Order Summary</div>
            {tickets.filter(t => (quantities[t.id] || 0) > 0).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                <span>{t.name} (x{quantities[t.id]})</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>
                  {t.isFree || t.price === 0 ? 'Free' : fmtNaira(t.price * (quantities[t.id] || 0))}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10, marginTop: 4 }}>
              {!isFree && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                    <span>Platform Fee (5%)</span>
                    <span>{fmtNaira(platformFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    <span>Service Charge (7.5%)</span>
                    <span>{fmtNaira(serviceCharge)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                <span>Total</span>
                <span style={{ color: '#0dc75e' }}>{isFree ? 'Free' : fmtNaira(total)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', background: 'rgba(13,199,94,0.06)', borderRadius: 8, border: '1px solid rgba(13,199,94,0.15)' }}>
              <RiMailLine size={13} color="#0dc75e" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Tickets will be sent to <strong style={{ color: '#fff' }}>{form['email']}</strong>
              </span>
            </div>
          </div>
        )}

        {payError && (
          <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{payError}</p>
        )}

        {/* Pay CTA */}
        <button
          onClick={handlePayment}
          disabled={!hasSelection || paying}
          style={{
            width: '100%', padding: '14px 0',
            borderRadius: 12, border: 'none',
            background: hasSelection && !paying ? 'linear-gradient(135deg, #0dc75e, #0ab350)' : 'rgba(255,255,255,0.07)',
            color: hasSelection && !paying ? '#000' : 'rgba(255,255,255,0.25)',
            fontSize: 15, fontWeight: 800,
            fontFamily: 'DM Sans, sans-serif',
            cursor: hasSelection && !paying ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: hasSelection && !paying ? '0 6px 24px rgba(13,199,94,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {paying
            ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing…</>
            : isFree
              ? <><RiCheckLine size={16} /> Claim Free Ticket</>
              : <><RiLockLine size={15} /> Proceed to Payment</>
          }
        </button>

        {/* Secured by Paystack */}
        {!isFree && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Secured by</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>paystack</span>
          </div>
        )}

        <StepIndicator current="tickets" />
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Success / Confirmation
  // ─────────────────────────────────────────────────────────────────────────────

  const selectedTicketNames = tickets
    .filter(t => (quantities[t.id] || 0) > 0)
    .map(t => `${quantities[t.id]} ${t.name}`)
    .join(', ')

  return (
    <div style={{ minHeight: '100vh', background: '#060e1c', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes confetti { 0% { opacity:0; transform:translateY(-20px) scale(0.5); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes popIn { 0% { transform:scale(0.8); opacity:0; } 100% { transform:scale(1); opacity:1; } }
      `}</style>

      {/* Top bar */}
      <div style={{ background: 'rgba(6,14,28,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/stagechecklogo.svg" alt="StageCheck" style={{ height: 26, display: 'block' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <RiLockLine size={12} color="#0dc75e" /> Secure &amp; Encrypted
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'popIn 0.4s ease' }}>
          {/* Confetti dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {['#0dc75e', '#60a5fa', '#f59e0b', '#a78bfa', '#f87171'].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, animation: `confetti 0.5s ease ${i * 0.08}s both` }} />
            ))}
          </div>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(13,199,94,0.15)', border: '2px solid rgba(13,199,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <RiCheckLine size={28} color="#0dc75e" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Payment Successful!</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Your ticket purchase was successful!</p>
        </div>

        {/* Event card */}
        {heroImg && (
          <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: 'rgba(255,255,255,0.04)' }}>
            <img src={heroImg} alt={event?.eventName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          {event?.date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              <RiCalendarLine size={14} color="#0dc75e" /> {formatEventDateShort(event.date)}
            </div>
          )}
          {(event?.venue || event?.address) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              <RiMapPinLine size={14} color="#0dc75e" /> {event?.venue || event?.address}
            </div>
          )}
        </div>

        {/* Ticket Details + QR side by side on desktop */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px', marginBottom: 16 }}>
          <div className="ntk-ticket-inner" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14, fontFamily: 'Syne, sans-serif' }}>Ticket Details</div>
              {[
                { label: 'Full Name',     value: form['name'] },
                { label: 'Email',         value: form['email'] },
                { label: 'Phone Number',  value: form['phone'] || '—' },
                { label: 'Ticket(s)',     value: selectedTicketNames },
                { label: 'Order ID',      value: ticketCode },
                { label: 'Date',          value: formatEventDate(event?.date) + (event?.startTime ? ` · ${event.startTime}` : '') },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* QR */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 10 }}>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR" style={{ width: 120, height: 120, display: 'block' }} />
                  : <div style={{ width: 120, height: 120, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#999', textAlign: 'center' }}>QR Code</div>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Ticket Code</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0dc75e', letterSpacing: 1, fontFamily: 'monospace' }}>{ticketCode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => {
              const a      = document.createElement('a')
              a.download   = `StageCheck-Ticket-${ticketCode}.png`
              a.href       = qrDataUrl
              a.click()
            }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0dc75e, #0ab350)', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif' }}
          >
            <RiDownload2Line size={16} /> Download Ticket
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: event?.eventName, text: `My ticket code: ${ticketCode}` })
              } else {
                navigator.clipboard.writeText(ticketCode)
              }
            }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif' }}
          >
            <RiShareLine size={16} /> Share Ticket
          </button>
          <button
            onClick={() => {
              if (event?.date) {
                const d   = event.date?.toDate ? event.date.toDate() : new Date(event.date)
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event?.eventName || '')}&dates=${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(event?.venue || '')}`
                window.open(url, '_blank')
              }
            }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif' }}
          >
            <RiCalendarLine size={16} /> Add to Calendar
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif' }}
          >
            <RiHomeLine size={16} /> Go Back Home
          </button>
        </div>

        {/* Thank you */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
          Thank you for choosing StageCheck.<br />See you at the event!
        </p>

        <StepIndicator current="success" />

        <style>{`
          @media (max-width: 400px) {
            .ntk-ticket-inner { flex-direction: column !important; align-items: center !important; }
          }
        `}</style>
      </div>
    </div>
  )
}