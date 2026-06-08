import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Ticket, Plus, Trash2, QrCode, Users, TrendingUp, Loader2, Check,
  Edit2, X, Tag, Hash, AlignLeft, Palette, Layers,
  BarChart2, UserCheck, BadgeDollarSign, Sparkles, Gift, CreditCard
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

interface TicketType {
  id: string
  name: string
  price: number
  isFree: boolean
  quantity: number
  sold: number
  description?: string
  color: string
}

interface Attendee {
  id: string
  name: string
  email: string
  ticketType: string
  ticketCode: string
  checkedIn: boolean
  purchasedAt?: any
}

const PRESET_COLORS = [
  '#22C55E','#3B82F6','#F59E0B','#8B5CF6',
  '#EC4899','#14B8A6','#EF4444','#F97316',
  '#06B6D4','#A855F7','#84CC16','#FBBF24',
]

const EMPTY_FORM = {
  name: '', isFree: true, price: 0,
  quantity: 100, description: '', color: PRESET_COLORS[0],
}

/* ─── validates a 6-digit hex string ─── */
const isValidHex = (h: string) => /^#[0-9A-Fa-f]{6}$/.test(h)

/* ─── Numeric input that's fully clearable ─── */
function NumericInput({
  value, onChange, min = 0, placeholder = '0', style
}: {
  value: number; onChange: (n: number) => void
  min?: number; placeholder?: string; style?: React.CSSProperties
}) {
  const [display, setDisplay] = useState(value === 0 ? '' : String(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setDisplay(value === 0 ? '' : String(value))
  }, [value, focused])
  return (
    <input
      type="text" inputMode="numeric" pattern="[0-9]*"
      value={display} placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        const n = parseInt(display) || 0
        const clamped = Math.max(min, n)
        onChange(clamped)
        setDisplay(clamped === 0 ? '' : String(clamped))
      }}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        setDisplay(raw)
        if (raw !== '') onChange(Math.max(min, parseInt(raw)))
      }}
      style={style}
    />
  )
}

/* ─── Color picker with presets + hex input + native color picker ─── */
function ColorPicker({
  value, onChange
}: { value: string; onChange: (c: string) => void }) {
  const [hex, setHex] = useState(value)
  const [hexError, setHexError] = useState(false)
  const nativeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setHex(value) }, [value])

  const handleHexChange = (raw: string) => {
    let val = raw.trim()
    if (!val.startsWith('#')) val = '#' + val
    setHex(val)
    if (isValidHex(val)) {
      setHexError(false)
      onChange(val)
    } else {
      setHexError(true)
    }
  }

  const handleNative = (e: React.ChangeEvent<HTMLInputElement>) => {
    const c = e.target.value
    setHex(c)
    setHexError(false)
    onChange(c)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* preset swatches */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => { onChange(c); setHex(c); setHexError(false) }} style={{
            width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
            border: value === c ? '2px solid #fff' : '2px solid transparent',
            transform: value === c ? 'scale(1.18)' : 'scale(1)',
            transition: 'all 0.13s',
            boxShadow: value === c ? `0 0 0 3px ${c}55` : 'none',
            outline: 'none', flexShrink: 0,
          }} />
        ))}
        {/* "open native picker" swatch */}
        <button
          title="Open colour picker"
          onClick={() => nativeRef.current?.click()}
          style={{
            width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px dashed rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: 'none', flexShrink: 0, transition: 'all 0.13s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
        >
          <Palette size={12} color="rgba(255,255,255,0.45)" />
        </button>
        {/* hidden native input */}
        <input ref={nativeRef} type="color" value={value}
          onChange={handleNative}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />
      </div>

      {/* hex text field */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* live preview dot */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: isValidHex(hex) ? hex : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.15s',
        }} />
        <input
          value={hex}
          onChange={e => handleHexChange(e.target.value)}
          placeholder="#22C55E"
          maxLength={7}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${hexError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, color: hexError ? '#F87171' : '#fff', fontSize: 13,
            padding: '9px 12px', outline: 'none',
            fontFamily: 'monospace', letterSpacing: '0.05em',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = isValidHex(hex) ? `${value}66` : 'rgba(255,255,255,0.25)'}
          onBlur={e => e.currentTarget.style.borderColor = hexError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}
        />
        {hexError && (
          <span style={{ fontSize: 11, color: '#F87171', whiteSpace: 'nowrap' }}>invalid hex</span>
        )}
      </div>
    </div>
  )
}

export default function TicketingPage() {
  const { eventId } = useParams<{ eventId: string }>()
 const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [tickets, setTickets]     = useState<TicketType[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tickets' | 'attendees'>('tickets')
  const [search, setSearch]       = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!eventId) return
    const unsubT = onSnapshot(collection(db, 'events', eventId, 'tickets'), snap => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType)))
      setLoading(false)
    })
    const unsubA = onSnapshot(collection(db, 'events', eventId, 'attendees'), snap => {
      setAttendees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendee)))
    })
    return () => { unsubT(); unsubA() }
  }, [eventId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showForm && drawerRef.current && !drawerRef.current.contains(e.target as Node)) closeForm()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showForm])

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }

  const openEdit = (t: TicketType) => {
    setForm({
      name: t.name, isFree: t.isFree ?? t.price === 0,
      price: t.price, quantity: t.quantity,
      description: t.description || '', color: t.color,
    })
    setEditingId(t.id)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (!eventId || !form.name.trim()) return
    setSaving(true)
    const finalPrice = form.isFree ? 0 : form.price
    try {
      if (editingId) {
        await updateDoc(doc(db, 'events', eventId, 'tickets', editingId), { ...form, price: finalPrice })
      } else {
        await addDoc(collection(db, 'events', eventId, 'tickets'), {
          ...form, price: finalPrice, sold: 0, createdAt: serverTimestamp(),
        })
      }
      closeForm()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!eventId) return
    await deleteDoc(doc(db, 'events', eventId, 'tickets', id))
    setDeleteConfirm(null)
  }

  const toggleCheckin = async (att: Attendee) => {
    if (!eventId) return
    await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), { checkedIn: !att.checkedIn })
  }

  const totalRevenue = tickets.reduce((s, t) => s + (t.isFree ? 0 : t.price) * t.sold, 0)
  const totalSold    = tickets.reduce((s, t) => s + t.sold, 0)
  const totalCap     = tickets.reduce((s, t) => s + t.quantity, 0)
  const checkedInCnt = attendees.filter(a => a.checkedIn).length
  const fillRate     = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0

  const filteredAttendees = attendees.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.ticketCode?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── shared styles ── */
  const glass: React.CSSProperties = {
    background: 'rgba(12,17,35,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
  }
  const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
  }
  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#fff', fontSize: 14,
    padding: '11px 14px', outline: 'none',
    fontFamily: 'var(--font-body)', width: '100%',
    boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s',
  }
  const focusInp = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = `${form.color}66`
    e.currentTarget.style.background  = 'rgba(255,255,255,0.06)'
  }
  const blurInp = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
    e.currentTarget.style.background  = 'rgba(255,255,255,0.04)'
  }

  const stats = [
    { label: 'Ticket Types', value: tickets.length,                      icon: <Layers size={16} />,          color: '#818CF8' },
    { label: 'Sold / Cap',   value: `${totalSold} / ${totalCap}`,        icon: <BarChart2 size={16} />,        color: '#34D399' },
    { label: 'Fill Rate',    value: `${fillRate}%`,                      icon: <TrendingUp size={16} />,       color: '#60A5FA' },
    { label: 'Checked In',   value: checkedInCnt,                        icon: <UserCheck size={16} />,        color: '#A78BFA' },
    { label: 'Revenue',      value: `₦${totalRevenue.toLocaleString()}`, icon: <BadgeDollarSign size={16} />,  color: '#FBBF24' },
  ]

  const displayPrice = (t: TicketType) =>
    (t.isFree ?? t.price === 0) ? 'Free' : `₦${t.price.toLocaleString()}`

  return (
     <DashboardLayout
  plan="starter"
   eventType={eventType ?? 'custom'}
  eventId={eventId}
  enabledModules={enabledModules}
>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ background: 'rgba(236,72,153,0.12)', borderRadius: 10, padding: '7px 8px', display: 'flex' }}>
            <Ticket size={18} color="#EC4899" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(1.5rem,3vw,2.1rem)', letterSpacing: '-0.6px',
            color: '#fff', margin: 0,
          }}>Ticketing</h1>
        </div>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Create ticket tiers, track sales, and manage attendance
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }} className="stat-grid">
        {stats.map((s, i) => (
          <div key={i} style={{ ...glass, padding: '16px 18px', borderRadius: 16, borderLeft: `3px solid ${s.color}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: 'clamp(1rem,2vw,1.4rem)', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginBottom: 4, letterSpacing: '-0.3px' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar + action ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.06)', gap: 2 }}>
          {(['tickets', 'attendees'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '7px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              transition: 'all 0.18s',
              background: activeTab === tab ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.35)',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}>
              {tab === 'tickets' ? 'Ticket Types' : `Attendees (${attendees.length})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {activeTab === 'attendees' && (
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search attendees…"
              style={{ ...inp, padding: '8px 14px', width: 220, borderRadius: 10, fontSize: 13 }}
            />
          )}
          {activeTab === 'tickets' && (
            <button onClick={openNew} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', padding: '9px 18px', borderRadius: 11,
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            >
              <Plus size={14} /> New Ticket Type
            </button>
          )}
        </div>
      </div>

      {/* ══ TICKETS TAB ══ */}
      {activeTab === 'tickets' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.3)', padding: '40px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Loading ticket types…</span>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ ...glass, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ marginBottom: 14, opacity: 0.15 }}><Ticket size={40} color="#fff" /></div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No ticket types yet — create your first one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {tickets.map(t => {
                const isFree = t.isFree ?? t.price === 0
                const pct = t.quantity > 0 ? Math.min(100, Math.round((t.sold / t.quantity) * 100)) : 0
                return (
                  <div key={t.id} style={{
                    background: 'rgba(12,17,35,0.8)', border: `1px solid ${t.color}22`,
                    borderRadius: 20, overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${t.color}18` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: 3, background: `linear-gradient(90deg,${t.color},${t.color}44)` }} />
                    <div style={{ padding: '20px 22px' }}>
                      {/* header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            {isFree
                              ? <Gift size={12} color={t.color} />
                              : <CreditCard size={12} color={t.color} />
                            }
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.color, opacity: 0.8 }}>
                              {isFree ? 'Free ticket' : 'Paid ticket'}
                            </span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 3, lineHeight: 1.3 }}>{t.name}</div>
                          {t.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{t.description}</div>}
                        </div>
                        <div style={{ background: `${t.color}18`, border: `1px solid ${t.color}30`, borderRadius: 10, padding: '5px 11px', textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: t.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
                            {displayPrice(t)}
                          </div>
                          {!isFree && <div style={{ fontSize: 10, color: `${t.color}80`, marginTop: 1 }}>per ticket</div>}
                        </div>
                      </div>

                      {/* feature list */}
                      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {[
                          { icon: <Tag size={12} />,         label: 'Capacity',  value: `${t.quantity} total` },
                          { icon: <Users size={12} />,       label: 'Sold',      value: `${t.sold} sold` },
                          { icon: <Hash size={12} />,        label: 'Remaining', value: `${t.quantity - t.sold} left` },
                          { icon: <TrendingUp size={12} />,  label: 'Revenue',   value: isFree ? 'N/A' : `₦${(t.price * t.sold).toLocaleString()}` },
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.35)' }}>
                              {item.icon}
                              <span style={{ fontSize: 12 }}>{item.label}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* progress */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                          <span>Sales progress</span>
                          <span style={{ color: t.color, fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${t.color},${t.color}aa)`, borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>

                      {/* actions */}
                      {deleteConfirm === t.id ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'rgba(248,113,113,0.8)', flex: 1 }}>Delete this ticket type?</span>
                          <button onClick={() => handleDelete(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(t.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.04)', color: '#F87171', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.04)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ══ ATTENDEES TAB ══ */}
      {activeTab === 'attendees' && (
        <div style={{ ...glass, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {filteredAttendees.length} {filteredAttendees.length === 1 ? 'Attendee' : 'Attendees'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              <span style={{ color: '#34D399', fontWeight: 600 }}>{checkedInCnt} checked in</span>
              <span>·</span>
              <span>{attendees.length - checkedInCnt} pending</span>
            </div>
          </div>
          {filteredAttendees.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              {search ? 'No attendees match your search.' : 'No attendees yet.'}
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 120px', padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Attendee','Ticket Type','Code','Status'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>{h}</span>
                ))}
              </div>
              {filteredAttendees.map((att, i) => (
                <div key={att.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 120px', alignItems: 'center', padding: '13px 24px', borderBottom: i < filteredAttendees.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{att.name}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)' }}>{att.email}</div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', padding: '3px 9px', borderRadius: 6 }}>
                      {att.ticketType}
                    </span>
                  </div>
                  <div>
                    <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 5 }}>
                      {att.ticketCode}
                    </code>
                  </div>
                  <div>
                    <button onClick={() => toggleCheckin(att)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s', borderColor: att.checkedIn ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)', background: att.checkedIn ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', color: att.checkedIn ? '#34D399' : 'rgba(255,255,255,0.35)' }}>
                      {att.checkedIn ? <Check size={11} /> : <QrCode size={11} />}
                      {att.checkedIn ? 'Checked in' : 'Check in'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ SLIDE-IN DRAWER ══ */}
      <div onClick={closeForm} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)', zIndex: 99,
        opacity: showForm ? 1 : 0, pointerEvents: showForm ? 'all' : 'none',
        transition: 'opacity 0.22s',
      }} />

      <div ref={drawerRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: 'rgba(10,14,28,0.98)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transform: showForm ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(10,14,28,0.98)', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Sparkles size={14} color={editingId ? '#818CF8' : '#34D399'} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                {editingId ? 'Edit Ticket Type' : 'New Ticket Type'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {editingId ? 'Update the details below' : 'Fill in the details to create a new tier'}
            </p>
          </div>
          <button onClick={closeForm} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <X size={14} />
          </button>
        </div>

        {/* drawer body */}
        <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Ticket Name */}
          <div style={fieldWrap}>
            <label style={lbl}><AlignLeft size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Ticket Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. General Admission" style={inp}
              onFocus={focusInp} onBlur={blurInp}
            />
          </div>

          {/* ── FREE / PAID TOGGLE ── */}
          <div style={fieldWrap}>
            <label style={lbl}>Ticket Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { key: true,  icon: <Gift size={14} />,       label: 'Free',  sub: 'No charge' },
                { key: false, icon: <CreditCard size={14} />, label: 'Paid',  sub: 'Set a price' },
              ].map(opt => {
                const active = form.isFree === opt.key
                return (
                  <button key={String(opt.key)} onClick={() => setForm(p => ({ ...p, isFree: opt.key, price: opt.key ? 0 : p.price }))} style={{
                    padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${active ? `${form.color}60` : 'rgba(255,255,255,0.07)'}`,
                    background: active ? `${form.color}12` : 'rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s', textAlign: 'left',
                    color: active ? form.color : 'rgba(255,255,255,0.35)',
                  }}>
                    <span style={{ opacity: active ? 1 : 0.5 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', marginBottom: 1 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{opt.sub}</div>
                    </div>
                    {active && (
                      <div style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={9} color="#000" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price field — only shown when paid */}
          {!form.isFree && (
            <div style={fieldWrap}>
              <label style={lbl}>Price (₦)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>₦</span>
                <NumericInput
                  value={form.price} onChange={n => setForm(p => ({ ...p, price: n }))}
                  min={0} placeholder="0"
                  style={{ ...inp, paddingLeft: 26 }}
                />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={fieldWrap}>
            <label style={lbl}>Quantity</label>
            <NumericInput
              value={form.quantity} onChange={n => setForm(p => ({ ...p, quantity: Math.max(1, n) }))}
              min={1} placeholder="100" style={inp}
            />
          </div>

          {/* Description */}
          <div style={fieldWrap}>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Includes programme, seat access, and complimentary drink"
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6, padding: '12px 14px' } as React.CSSProperties}
              onFocus={focusInp as any} onBlur={blurInp as any}
            />
          </div>

          {/* Accent colour */}
          <div style={fieldWrap}>
            <label style={lbl}><Palette size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Accent Colour</label>
            <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
            {/* live preview */}
            <div style={{ marginTop: 4, height: 38, borderRadius: 10, border: `1px solid ${form.color}30`, background: `${form.color}0e`, display: 'flex', alignItems: 'center', paddingLeft: 14, gap: 9 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: form.color, fontWeight: 600 }}>
                {form.name || 'Preview'} · {form.isFree ? 'Free' : form.price > 0 ? `₦${form.price.toLocaleString()}` : 'Set price'}
              </span>
            </div>
          </div>
        </div>

        {/* drawer footer */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: 'rgba(10,14,28,0.98)' }}>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: form.name.trim() ? form.color : 'rgba(255,255,255,0.05)',
            border: 'none', color: form.name.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
            padding: '11px 0', borderRadius: 12,
            cursor: form.name.trim() ? 'pointer' : 'not-allowed',
            fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)',
            transition: 'all 0.18s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
            {editingId ? 'Save Changes' : 'Create Ticket'}
          </button>
          <button onClick={closeForm} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13.5, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) { .stat-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 560px) { .stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </DashboardLayout>
  )
}