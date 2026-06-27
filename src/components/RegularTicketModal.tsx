/* ─────────────────────────────────────────────────────────────
   RegularTicketModal.tsx
   Wide centered modal for creating / editing ticket types.
   NO side drawer — opens as an overlay popup.
───────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef } from 'react'
import {
  X, Check, Loader2, Sparkles, Gift, CreditCard, Palette,
  AlignLeft, Plus, Trash2, ChevronRight, Eye,
} from 'lucide-react'
import {
  G, TX1, TX2, TX3, BORDER, PRESET_COLORS, TICKET_CATEGORIES,
  EMPTY_TICKET_FORM, isValidHex, fmtNaira,
} from '../pages/RegularTicket/RegularTicketTypes'
import type { TicketType } from '../pages/RegularTicket/RegularTicketTypes'

interface Props {
  open: boolean
  editing: TicketType | null
  onClose: () => void
  onSave: (data: typeof EMPTY_TICKET_FORM) => Promise<void>
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [hex, setHex] = useState(value)
  const [hexErr, setHexErr] = useState(false)
  const nativeRef = useRef<HTMLInputElement>(null)
  useEffect(() => setHex(value), [value])

  const handleHex = (raw: string) => {
    let v = raw.trim()
    if (!v.startsWith('#')) v = '#' + v
    setHex(v)
    if (isValidHex(v)) { setHexErr(false); onChange(v) } else setHexErr(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => { onChange(c); setHex(c); setHexErr(false) }} style={{
            width: 26, height: 26, borderRadius: '50%', background: c,
            border: value === c ? '2px solid #fff' : '2px solid transparent',
            transform: value === c ? 'scale(1.18)' : 'scale(1)', transition: 'all 0.13s',
            boxShadow: value === c ? `0 0 0 3px ${c}55` : 'none',
            cursor: 'pointer', outline: 'none', flexShrink: 0,
          }} />
        ))}
        <button onClick={() => nativeRef.current?.click()} style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',
        }}>
          <Palette size={11} color={TX3} />
        </button>
        <input ref={nativeRef} type="color" value={value}
          onChange={e => { setHex(e.target.value); onChange(e.target.value) }}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: isValidHex(hex) ? hex : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
        }} />
        <input value={hex} onChange={e => handleHex(e.target.value)}
          placeholder="#22C55E" maxLength={7}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${hexErr ? 'rgba(248,113,113,0.5)' : BORDER}`,
            borderRadius: 8, color: hexErr ? '#F87171' : TX1,
            fontSize: 13, padding: '8px 12px', outline: 'none',
            fontFamily: 'monospace', letterSpacing: '0.05em',
          }} />
        {hexErr && <span style={{ fontSize: 11, color: '#F87171', whiteSpace: 'nowrap' }}>invalid</span>}
      </div>
    </div>
  )
}

export default function RegularTicketModal({ open, editing, onClose, onSave }: Props) {
  const [form, setForm] = useState({ ...EMPTY_TICKET_FORM })
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [benefit, setBenefit] = useState('')
  const [activePreview, setActivePreview] = useState<'desktop' | 'mobile'>('desktop')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    if (editing) {
      setForm({
        name: editing.name, isFree: editing.isFree, price: editing.price,
        quantity: editing.quantity, description: editing.description || '',
        color: editing.color, category: editing.category || 'general',
        benefits: editing.benefits || [], whoCanBuy: editing.whoCanBuy || 'everyone',
        pushServiceCharge: editing.pushServiceCharge || false,
      })
    } else {
      setForm({ ...EMPTY_TICKET_FORM })
    }
  }, [open, editing])

  const patch = (p: Partial<typeof EMPTY_TICKET_FORM>) =>
    setForm(f => ({ ...f, ...p }))

  const addBenefit = () => {
    if (!benefit.trim()) return
    patch({ benefits: [...form.benefits, benefit.trim()] })
    setBenefit('')
  }

  const removeBenefit = (i: number) =>
    patch({ benefits: form.benefits.filter((_, idx) => idx !== i) })

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const serviceCharge = form.isFree ? 0 : Math.round(form.price * 0.1)
  const organiserReceives = form.isFree ? 0 : (form.pushServiceCharge ? form.price : form.price - serviceCharge)

  // Input styles
  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${BORDER}`,
    borderRadius: 10, color: TX1, fontSize: 14,
    padding: '11px 14px', outline: 'none', fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  }
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: TX2,
    letterSpacing: '0.05em', marginBottom: 6, display: 'block',
  }
  const section: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 6,
  }

  const STEPS = ['Details', 'Pricing & Inventory', 'Additional Settings', 'Review & Create']

  if (!open) return null

  return (
    <>
      <div
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) onClose() }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          zIndex: 200, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', padding: '20px 16px',
          overflowY: 'auto',
          animation: 'rtFadeIn 0.18s ease',
        }}
      >
        <div style={{
          width: '100%', maxWidth: 1060,
          background: 'rgba(10,14,28,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          animation: 'rtSlideUp 0.22s ease',
        }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color={G} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TX1, fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
                  {editing ? 'Edit Ticket' : 'Create New Ticket'}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: TX2 }}>
                  Set up your ticket details, pricing and availability.
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
              borderRadius: 10, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: TX2,
            }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Step indicator ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            overflowX: 'auto',
          }}>
            {STEPS.map((s, i) => {
              const n = i + 1
              const done = n < step, active = n === step
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => n < step && setStep(n)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    cursor: done ? 'pointer' : 'default', padding: '4px 0',
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: done ? G : active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
                      border: active ? `2px solid ${G}` : done ? 'none' : `1px solid ${BORDER}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: done ? '#000' : active ? G : TX3,
                    }}>
                      {done ? <Check size={13} /> : n}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? TX1 : TX3, whiteSpace: 'nowrap' }}>
                      {s}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 32, height: 1, background: n < step ? G : BORDER, margin: '0 8px', flexShrink: 0 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Body: 2-column (form + live preview) ── */}
          <div className="rt-modal-body">
            {/* Left: Form */}
            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', maxHeight: '65vh' }}>

              {/* Step 1: Details */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="rt-modal-row">
                    <div style={section}>
                      <label style={lbl}>Ticket Name *</label>
                      <input value={form.name} onChange={e => patch({ name: e.target.value })}
                        placeholder="e.g. VIP Lounge Access" style={inp}
                        onFocus={e => e.currentTarget.style.borderColor = `${form.color}66`}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                      <span style={{ fontSize: 12, color: TX3 }}>This is how your ticket will be displayed to attendees.</span>
                    </div>
                    <div style={section}>
                      <label style={lbl}>Ticket Category</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {TICKET_CATEGORIES.map(cat => (
                          <button key={cat.key} onClick={() => patch({ category: cat.key })} style={{
                            padding: '7px 14px', borderRadius: 8,
                            border: `1.5px solid ${form.category === cat.key ? `${G}60` : BORDER}`,
                            background: form.category === cat.key ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                            color: form.category === cat.key ? G : TX2,
                            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                            transition: 'all 0.15s', whiteSpace: 'nowrap',
                          }}>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={section}>
                    <label style={lbl}>Description *</label>
                    <textarea value={form.description}
                      onChange={e => patch({ description: e.target.value })}
                      placeholder="e.g. Exclusive access to the VIP lounge with premium seating and private services."
                      rows={3} maxLength={300}
                      style={{ ...inp, resize: 'vertical', lineHeight: 1.6 } as any}
                      onFocus={e => (e.currentTarget as any).style.borderColor = `${form.color}66`}
                      onBlur={e => (e.currentTarget as any).style.borderColor = BORDER}
                    />
                    <span style={{ fontSize: 11, color: TX3, textAlign: 'right' }}>{form.description.length}/300</span>
                  </div>

                  <div style={section}>
                    <label style={lbl}>Access / Benefits</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={benefit} onChange={e => setBenefit(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addBenefit()}
                        placeholder="e.g. Priority entry" style={{ ...inp }}
                        onFocus={e => e.currentTarget.style.borderColor = `${G}66`}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER}
                      />
                      <button onClick={addBenefit} style={{
                        padding: '11px 16px', borderRadius: 10, border: `1px solid ${G}40`,
                        background: 'rgba(34,197,94,0.1)', color: G, cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: 13,
                        fontFamily: 'var(--font-body)',
                      }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                    {form.benefits.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {form.benefits.map((b, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 8,
                            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                          }}>
                            <Check size={12} color={G} />
                            <span style={{ flex: 1, fontSize: 13, color: TX1 }}>{b}</span>
                            <button onClick={() => removeBenefit(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TX3, padding: 2 }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={section}>
                    <label style={lbl}>Ticket Colour</label>
                    <ColorPicker value={form.color} onChange={c => patch({ color: c })} />
                  </div>
                </div>
              )}

              {/* Step 2: Pricing */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={section}>
                    <label style={lbl}>Ticket Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { key: true,  icon: <Gift size={18} />,       title: 'Free', sub: 'No charge for attendees' },
                        { key: false, icon: <CreditCard size={18} />, title: 'Paid', sub: 'Set a price below' },
                      ].map(opt => {
                        const active = form.isFree === opt.key
                        return (
                          <button key={String(opt.key)} onClick={() => patch({ isFree: opt.key, price: opt.key ? 0 : form.price })} style={{
                            padding: '16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                            border: `1.5px solid ${active ? `${form.color}60` : BORDER}`,
                            background: active ? `${form.color}10` : 'rgba(255,255,255,0.02)',
                            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                            color: active ? form.color : TX2,
                          }}>
                            <span style={{ opacity: active ? 1 : 0.5 }}>{opt.icon}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: active ? form.color : TX1, marginBottom: 2 }}>{opt.title}</div>
                              <div style={{ fontSize: 12, color: TX3 }}>{opt.sub}</div>
                            </div>
                            {active && (
                              <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={10} color="#000" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {!form.isFree && (
                    <div style={section}>
                      <label style={lbl}>Price (₦)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: TX2 }}>₦</span>
                        <input
                          type="number" min={0} value={form.price || ''}
                          onChange={e => patch({ price: Math.max(0, Number(e.target.value)) })}
                          placeholder="0" style={{ ...inp, paddingLeft: 30 }}
                          onFocus={e => e.currentTarget.style.borderColor = `${form.color}66`}
                          onBlur={e => e.currentTarget.style.borderColor = BORDER}
                        />
                      </div>
                    </div>
                  )}

                  <div style={section}>
                    <label style={lbl}>Quantity Available</label>
                    <input type="number" min={1} value={form.quantity || ''}
                      onChange={e => patch({ quantity: Math.max(1, Number(e.target.value)) })}
                      placeholder="100" style={inp}
                      onFocus={e => e.currentTarget.style.borderColor = `${form.color}66`}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER}
                    />
                  </div>

                  {!form.isFree && (
                    <div style={{
                      padding: '16px', borderRadius: 12,
                      background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TX1, marginBottom: 10 }}>Ticket Summary</div>
                      {[
                        { label: 'Tickets Available', value: form.quantity },
                        { label: 'Price',             value: fmtNaira(form.price) },
                        { label: 'Service Charge (10%)', value: fmtNaira(serviceCharge) },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: TX2 }}>{row.label}</span>
                          <span style={{ fontSize: 13, color: TX1, fontWeight: 600 }}>{row.value}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: TX2, fontWeight: 600 }}>You will receive</span>
                        <span style={{ fontSize: 14, color: G, fontWeight: 800 }}>{fmtNaira(organiserReceives)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Additional */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={section}>
                    <label style={lbl}>Who is this for?</label>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: TX2 }}>Define who can purchase this ticket.</p>
                    {[
                      { key: 'everyone', label: 'Everyone' },
                      { key: 'students', label: 'Only students' },
                      { key: 'promo',    label: 'Only people with a promo code' },
                      { key: 'invited',  label: 'Only invited guests' },
                    ].map(opt => (
                      <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                        <div onClick={() => patch({ whoCanBuy: opt.key as any })} style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${form.whoCanBuy === opt.key ? G : BORDER}`,
                          background: form.whoCanBuy === opt.key ? G : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                        }}>
                          {form.whoCanBuy === opt.key && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />}
                        </div>
                        <span style={{ fontSize: 14, color: form.whoCanBuy === opt.key ? TX1 : TX2 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TX1, marginBottom: 3 }}>Push service charge to buyers</div>
                      <div style={{ fontSize: 12, color: TX2 }}>
                        {form.pushServiceCharge
                          ? 'The buyer will pay the service charge at checkout.'
                          : 'The service charge will be deducted from your earnings.'}
                      </div>
                    </div>
                    <button onClick={() => patch({ pushServiceCharge: !form.pushServiceCharge })} style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: form.pushServiceCharge ? G : 'rgba(255,255,255,0.15)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', top: 2, left: form.pushServiceCharge ? 22 : 2,
                        width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TX2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ticket Details</div>
                    {[
                      { label: 'Name',     value: form.name || '—' },
                      { label: 'Category', value: form.category },
                      { label: 'Type',     value: form.isFree ? 'Free' : 'Paid' },
                      { label: 'Price',    value: form.isFree ? 'Free' : fmtNaira(form.price) },
                      { label: 'Quantity', value: String(form.quantity) },
                      { label: 'Who',      value: form.whoCanBuy },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: TX2 }}>{row.label}</span>
                        <span style={{ fontSize: 13, color: TX1, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                    {form.benefits.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ fontSize: 12, color: TX3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Benefits</span>
                        {form.benefits.map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Check size={12} color={G} />
                            <span style={{ fontSize: 13, color: TX1 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: TX2, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <AlignLeft size={13} color={TX3} />
                    You can edit all details later from the ticket settings.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="rt-modal-preview" style={{
              width: 320, borderLeft: '1px solid rgba(255,255,255,0.07)',
              padding: '24px 22px', background: 'rgba(255,255,255,0.01)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Eye size={14} color={G} />
                <span style={{ fontSize: 14, fontWeight: 700, color: TX1 }}>Live Preview</span>
              </div>
              <p style={{ fontSize: 12, color: TX2, margin: '0 0 16px' }}>This is how your ticket will appear to attendees.</p>

              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['desktop', 'mobile'] as const).map(v => (
                  <button key={v} onClick={() => setActivePreview(v)} style={{
                    flex: 1, padding: '5px 0', borderRadius: 7, border: `1px solid ${activePreview === v ? `${G}50` : BORDER}`,
                    background: activePreview === v ? 'rgba(34,197,94,0.1)' : 'transparent',
                    color: activePreview === v ? G : TX3, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize',
                  }}>
                    {v}
                  </button>
                ))}
              </div>

              {/* Preview card */}
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `1.5px solid ${form.color}40`,
                background: `linear-gradient(135deg, ${form.color}12, rgba(10,14,28,0.95))`,
                maxWidth: activePreview === 'mobile' ? 200 : '100%',
                margin: activePreview === 'mobile' ? '0 auto' : 0,
              }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${form.color}, ${form.color}55)` }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: form.color, textTransform: 'uppercase', letterSpacing: '0.08em', background: `${form.color}18`, padding: '2px 8px', borderRadius: 4 }}>
                      {form.category?.toUpperCase() || 'TICKET'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TX3, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                      LIMITED
                    </span>
                  </div>
                  <div style={{ fontSize: activePreview === 'mobile' ? 14 : 17, fontWeight: 800, color: TX1, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                    {form.name || 'Ticket Name'}
                  </div>
                  {form.description && (
                    <div style={{ fontSize: 11, color: TX2, lineHeight: 1.5, marginBottom: 10 }}>
                      {form.description.slice(0, 80)}{form.description.length > 80 ? '…' : ''}
                    </div>
                  )}
                  <div style={{ fontSize: 20, fontWeight: 900, color: form.color, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                    {form.isFree ? 'Free' : form.price > 0 ? fmtNaira(form.price) : '₦0'}
                  </div>
                  {form.benefits.slice(0, 3).map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Check size={10} color={form.color} />
                      <span style={{ fontSize: 11, color: TX2 }}>{b}</span>
                    </div>
                  ))}
                  {form.quantity > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: TX3, marginBottom: 4 }}>
                        <span>Only {form.quantity} spots available</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: '60%', background: form.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.07)',
            gap: 10, flexWrap: 'wrap',
          }}>
            <button onClick={onClose} style={{
              padding: '11px 20px', borderRadius: 10, border: `1px solid ${BORDER}`,
              background: 'transparent', color: TX2, cursor: 'pointer',
              fontSize: 14, fontFamily: 'var(--font-body)',
            }}>
              Cancel
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  padding: '11px 20px', borderRadius: 10, border: `1px solid ${BORDER}`,
                  background: 'rgba(255,255,255,0.04)', color: TX1, cursor: 'pointer',
                  fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600,
                }}>
                  Back
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 && !form.name.trim()}
                  style={{
                    padding: '11px 24px', borderRadius: 10, border: 'none',
                    background: (step === 1 && !form.name.trim()) ? 'rgba(255,255,255,0.08)' : G,
                    color: (step === 1 && !form.name.trim()) ? TX3 : '#000',
                    cursor: (step === 1 && !form.name.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
                  padding: '11px 24px', borderRadius: 10, border: 'none',
                  background: form.name.trim() ? G : 'rgba(255,255,255,0.08)',
                  color: form.name.trim() ? '#000' : TX3,
                  cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1,
                }}>
                  {saving
                    ? <><Loader2 size={14} style={{ animation: 'rtSpin 1s linear infinite' }} /> Saving…</>
                    : <><Check size={14} /> {editing ? 'Save Changes' : 'Create Ticket'}</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rt-modal-body { display: flex; min-height: 400px; }
        .rt-modal-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 860px) {
          .rt-modal-preview { display: none !important; }
          .rt-modal-row { grid-template-columns: 1fr; }
        }
        @keyframes rtFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes rtSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes rtSpin    { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}