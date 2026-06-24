import { useState, useRef } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Ticket, Plus, Trash2, Edit2, X, Check, Users, Loader2,
  Gift, CreditCard, TrendingUp,
} from 'lucide-react'

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

interface Props {
  eventId: string
  tickets: NetworkTicket[]
  mode: 'individual' | 'group'
}

const COLORS = ['#6366F1', '#818CF8', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6']

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18, overflow: 'hidden',
}

const SUB2 = 'rgba(255,255,255,0.4)'
const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#fff', fontSize: 13, padding: '9px 12px', outline: 'none',
  fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
}

const EMPTY = { name: '', price: 0, isFree: true, quantity: 100, type: 'individual' as const, groupSize: 10, color: COLORS[0], description: '' }

export default function NetworkTicketTypes({ eventId, tickets, mode }: Props) {
  const filtered      = tickets.filter(t => t.type === mode)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ ...EMPTY, type: mode })
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const openNew  = () => { setForm({ ...EMPTY, type: mode }); setEditingId(null); setShowForm(true) }
  const openEdit = (t: NetworkTicket) => {
    setForm({ name: t.name, price: t.price, isFree: t.isFree, quantity: t.quantity, type: t.type, groupSize: t.groupSize || 10, color: t.color, description: t.description || '' })
    setEditingId(t.id); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY, type: mode }) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const data = { ...form, price: form.isFree ? 0 : form.price, sold: editingId ? undefined : 0 }
    if (editingId) {
      await updateDoc(doc(db, 'events', eventId, 'networkTickets', editingId), data)
    } else {
      await addDoc(collection(db, 'events', eventId, 'networkTickets'), { ...data, createdAt: serverTimestamp() })
    }
    setSaving(false); closeForm()
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'events', eventId, 'networkTickets', id))
    setDeleteConfirm(null)
  }

  const title = mode === 'individual' ? 'Individual Tickets' : 'Group Tickets'
  const accent = mode === 'individual' ? '#6366F1' : '#818CF8'

  return (
    <>
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mode === 'individual' ? <Ticket size={14} color={accent} /> : <Users size={14} color={accent} />}
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}14`, padding: '2px 8px', borderRadius: 6 }}>{filtered.length}</span>
          </div>
          <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${accent}12`, border: `1px solid ${accent}28`, color: accent, padding: '7px 13px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
            <Plus size={13} /> New
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ opacity: 0.12, marginBottom: 12 }}>{mode === 'individual' ? <Ticket size={36} color="#fff" /> : <Users size={36} color="#fff" />}</div>
            <p style={{ fontSize: 13, color: SUB2, margin: 0 }}>No {title.toLowerCase()} yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, padding: 16 }}>
            {filtered.map(ticket => {
              const pct = ticket.quantity > 0 ? Math.min(100, Math.round((ticket.sold / ticket.quantity) * 100)) : 0
              return (
                <div key={ticket.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${ticket.color}22`,
                  borderRadius: 14, overflow: 'hidden', transition: 'transform 0.18s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ height: 3, background: `linear-gradient(90deg,${ticket.color},${ticket.color}44)` }} />
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 2 }}>{ticket.name}</div>
                        {ticket.description && <div style={{ fontSize: 11, color: SUB2, lineHeight: 1.4 }}>{ticket.description}</div>}
                        {mode === 'group' && ticket.groupSize && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: ticket.color, background: `${ticket.color}14`, padding: '2px 7px', borderRadius: 5, display: 'inline-block', marginTop: 4 }}>
                            {ticket.groupSize} per group
                          </span>
                        )}
                      </div>
                      <div style={{ background: `${ticket.color}18`, border: `1px solid ${ticket.color}30`, borderRadius: 9, padding: '4px 9px', textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: ticket.color, fontFamily: 'var(--font-display)' }}>
                          {ticket.isFree ? 'Free' : `₦${ticket.price.toLocaleString()}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[
                        { label: 'Sold', value: ticket.sold },
                        { label: 'Cap', value: ticket.quantity },
                        { label: 'Revenue', value: ticket.isFree ? 'N/A' : `₦${(ticket.price * ticket.sold).toLocaleString()}` },
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: SUB2 }}>{r.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{r.value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: SUB2, marginBottom: 4 }}>
                        <span>Sales</span><span style={{ color: ticket.color, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: ticket.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>

                    {deleteConfirm === ticket.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#F87171', flex: 1 }}>Delete this?</span>
                        <button onClick={() => handleDelete(ticket.id)} style={{ padding: '5px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: SUB2, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={() => openEdit(ticket)} style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: SUB2, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        ><Edit2 size={11} /> Edit</button>
                        <button onClick={() => setDeleteConfirm(ticket.id)} style={{ padding: '7px 11px', borderRadius: 9, border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.04)', color: '#F87171', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.04)'}
                        ><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      <div onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 99, opacity: showForm ? 1 : 0, pointerEvents: showForm ? 'all' : 'none', transition: 'opacity 0.22s' }} />
      <div ref={drawerRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px,100vw)',
        background: 'rgba(10,14,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transform: showForm ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: 'rgba(10,14,28,0.98)', zIndex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
            {editingId ? 'Edit Ticket' : `New ${mode === 'group' ? 'Group' : 'Individual'} Ticket`}
          </span>
          <button onClick={closeForm} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SUB2 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Name *', key: 'name', placeholder: mode === 'group' ? 'e.g. Parish Group Pass' : 'e.g. General Admission' },
            { label: 'Description', key: 'description', placeholder: 'Optional details' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inp}
                onFocus={e => e.currentTarget.style.borderColor = `${accent}50`}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { key: true,  icon: <Gift size={13} />,       title: 'Free' },
                { key: false, icon: <CreditCard size={13} />, title: 'Paid' },
              ].map(opt => {
                const active = form.isFree === opt.key
                return (
                  <button key={String(opt.key)} onClick={() => setForm(p => ({ ...p, isFree: opt.key, price: opt.key ? 0 : p.price }))} style={{ padding: '10px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${active ? `${accent}55` : 'rgba(255,255,255,0.08)'}`, background: active ? `${accent}12` : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 8, color: active ? accent : SUB2, transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}>
                    {opt.icon}<span style={{ fontSize: 13, fontWeight: 700 }}>{opt.title}</span>
                    {active && <Check size={11} style={{ marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {!form.isFree && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>Price (₦)</label>
              <input type="number" min={0} value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} placeholder="0" style={inp}
                onFocus={e => e.currentTarget.style.borderColor = `${accent}50`}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>Quantity</label>
            <input type="number" min={1} value={form.quantity || ''} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))} placeholder="100" style={inp}
              onFocus={e => e.currentTarget.style.borderColor = `${accent}50`}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>

          {mode === 'group' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>Group Size (people per ticket)</label>
              <input type="number" min={2} value={form.groupSize || ''} onChange={e => setForm(p => ({ ...p, groupSize: Number(e.target.value) }))} placeholder="10" style={inp}
                onFocus={e => e.currentTarget.style.borderColor = `${accent}50`}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
            </div>
          )}

          {/* Color swatches */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }}>Colour</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '2px solid #fff' : '2px solid transparent', transform: form.color === c ? 'scale(1.18)' : 'scale(1)', transition: 'all 0.13s', outline: 'none' }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: 'rgba(10,14,28,0.98)' }}>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: form.name.trim() ? accent : 'rgba(255,255,255,0.06)', border: 'none', color: form.name.trim() ? '#fff' : 'rgba(255,255,255,0.2)', padding: '11px 0', borderRadius: 12, cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.18s' }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
            {editingId ? 'Save Changes' : 'Create Ticket'}
          </button>
          <button onClick={closeForm} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: SUB2, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>Cancel</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}