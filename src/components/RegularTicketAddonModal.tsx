/* ─────────────────────────────────────────────────────────────
   RegularTicketAddonModal.tsx
   Wide centered modal for creating / editing add-ons.
   Includes image upload (base64 preview + Firebase Storage URL).
───────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef } from 'react'
import {
  X, Check, Loader2, Package, Gift, CreditCard, Upload, Trash2,
  Eye, ChevronRight, ImageIcon,
} from 'lucide-react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from'../lib/firebase'
import {
  G, TX1, TX2, TX3, BORDER, ADDON_CATEGORIES,
  EMPTY_ADDON_FORM, fmtNaira,
} from '../pages/RegularTicket/RegularTicketTypes'
import type { AddOn } from '../pages/RegularTicket/RegularTicketTypes'

interface Props {
  open: boolean
  editing: AddOn | null
  eventId: string
  onClose: () => void
  onSave: (data: typeof EMPTY_ADDON_FORM & { imageUrl: string }) => Promise<void>
}

export default function RegularTicketAddonModal({ open, editing, eventId, onClose, onSave }: Props) {
  const [form, setForm]           = useState({ ...EMPTY_ADDON_FORM, imageUrl: '' })
  const [saving, setSaving]       = useState(false)
  const [step, setStep]           = useState(1)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [imgFile, setImgFile]     = useState<File | null>(null)
  const [imgUploading, setImgUploading] = useState(false)
  const [activePreview, setActivePreview] = useState<'desktop' | 'mobile'>('desktop')
  const overlayRef  = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setImgFile(null)
    if (editing) {
      setForm({
        name: editing.name, isFree: editing.isFree ?? editing.price === 0,
        price: editing.price, quantity: editing.quantity,
        description: editing.description || '',
        color: editing.color, imageUrl: editing.imageUrl || '',
        category: (editing.category || 'hospitality') as any, active: editing.active ?? true,
      })
      setImgPreview(editing.imageUrl || null)
    } else {
      setForm({ ...EMPTY_ADDON_FORM, imageUrl: '' })
      setImgPreview(null)
    }
  }, [open, editing])

  const patch = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }))

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    setImgFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImgFile(null); setImgPreview(null); patch({ imageUrl: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      let imageUrl = form.imageUrl
      if (imgFile && eventId) {
        setImgUploading(true)
        const sRef = storageRef(storage, `events/${eventId}/addons/${Date.now()}_${imgFile.name}`)
        await uploadBytes(sRef, imgFile)
        imageUrl = await getDownloadURL(sRef)
        setImgUploading(false)
      }
      await onSave({ ...form, imageUrl })
    } finally {
      setSaving(false); setImgUploading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
    borderRadius: 10, color: TX1, fontSize: 14,
    padding: '11px 14px', outline: 'none', fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  }
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: TX2,
    letterSpacing: '0.05em', marginBottom: 6, display: 'block',
  }

  const STEPS = ['Details', 'Pricing & Inventory', 'Visibility', 'Review & Create']

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
          overflowY: 'auto', animation: 'rtFadeIn 0.18s ease',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color="#8B5CF6" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TX1, fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
                  {editing ? 'Edit Add-on' : 'Create New Add-on'}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: TX2 }}>
                  Set up your add-on details, pricing and availability.
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TX2 }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Steps ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
            {STEPS.map((s, i) => {
              const n = i + 1; const done = n < step; const active = n === step
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => done && setStep(n)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: done ? 'pointer' : 'default', padding: '4px 0' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? '#8B5CF6' : active ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.07)', border: active ? '2px solid #8B5CF6' : done ? 'none' : `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: done ? '#fff' : active ? '#8B5CF6' : TX3 }}>
                      {done ? <Check size={13} /> : n}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? TX1 : TX3, whiteSpace: 'nowrap' }}>{s}</span>
                  </button>
                  {i < STEPS.length - 1 && <div style={{ width: 32, height: 1, background: done ? '#8B5CF6' : BORDER, margin: '0 8px', flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>

          {/* ── Body ── */}
          <div className="rt-modal-body">
            {/* Left form */}
            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', maxHeight: '65vh' }}>

              {/* Step 1 */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="rt-modal-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={lbl}>Add-on Name *</label>
                      <input value={form.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. VIP Lounge Access" style={inp}
                        onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={lbl}>Add-on Type</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { key: 'physical', label: 'Physical' },
                          { key: 'digital',  label: 'Digital' },
                          { key: 'service',  label: 'Service' },
                        ].map(t => (
                          <button key={t.key} style={{
                            flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer',
                            border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)',
                            color: TX2, fontSize: 13, fontFamily: 'var(--font-body)',
                          }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={lbl}>Add-on Description *</label>
                    <textarea value={form.description} onChange={e => patch({ description: e.target.value })}
                      placeholder="e.g. Exclusive access to the VIP lounge with premium seating and private services."
                      rows={3} maxLength={300}
                      style={{ ...inp, resize: 'vertical', lineHeight: 1.6 } as any}
                      onFocus={e => (e.currentTarget as any).style.borderColor = 'rgba(139,92,246,0.5)'}
                      onBlur={e => (e.currentTarget as any).style.borderColor = BORDER}
                    />
                    <span style={{ fontSize: 11, color: TX3, textAlign: 'right' }}>{form.description.length}/300</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={lbl}>Add-on Category</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ADDON_CATEGORIES.map(cat => (
                        <button key={cat.key} onClick={() => patch({ category: cat.key as any })} style={{
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${form.category === cat.key ? 'rgba(139,92,246,0.6)' : BORDER}`,
                          background: form.category === cat.key ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                          color: form.category === cat.key ? '#8B5CF6' : TX2,
                          fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                          transition: 'all 0.15s', whiteSpace: 'nowrap',
                        }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={lbl}>Add-on Image *</label>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleImagePick} style={{ display: 'none' }} />

                    <div className="rt-addon-img-row">
                      {/* Upload zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          flex: 1, border: `2px dashed rgba(255,255,255,0.15)`,
                          borderRadius: 12, padding: '28px 20px',
                          textAlign: 'center', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.02)', transition: 'all 0.15s',
                          minHeight: 130, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload size={20} color="#8B5CF6" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, color: TX2 }}>
                            <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Click to upload</span> or drag and drop
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: TX3 }}>PNG, JPG or WEBP (Max. 5MB)</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: TX3 }}>Recommended: 1200 × 800px</p>
                        </div>
                      </div>

                      {/* Preview */}
                      {imgPreview && (
                        <div style={{ position: 'relative', width: 160, flexShrink: 0 }}>
                          <img src={imgPreview} alt="Preview" style={{
                            width: '100%', height: 130, objectFit: 'cover',
                            borderRadius: 12, border: `1px solid ${BORDER}`, display: 'block',
                          }} />
                          <button onClick={removeImage} style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'rgba(10,14,28,0.85)', border: `1px solid ${BORDER}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#F87171',
                          }}>
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tips */}
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <ImageIcon size={13} color={G} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Tips for a great image</span>
                      </div>
                      {['Use high-quality, clear images', 'Show what the add-on includes', 'Avoid text-heavy images'].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                          <Check size={10} color={G} />
                          <span style={{ fontSize: 12, color: TX2 }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: TX3 }}>This image will represent your add-on across the platform.</p>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={lbl}>Add-on Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { key: true,  icon: <Gift size={18} />,       title: 'Free', sub: 'No extra charge' },
                        { key: false, icon: <CreditCard size={18} />, title: 'Paid', sub: 'Set a price below' },
                      ].map(opt => {
                        const active = form.isFree === opt.key
                        return (
                          <button key={String(opt.key)} onClick={() => patch({ isFree: opt.key, price: opt.key ? 0 : form.price })} style={{
                            padding: '16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                            border: `1.5px solid ${active ? 'rgba(139,92,246,0.6)' : BORDER}`,
                            background: active ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                          }}>
                            <span style={{ color: active ? '#8B5CF6' : TX3, opacity: active ? 1 : 0.5 }}>{opt.icon}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#8B5CF6' : TX1, marginBottom: 2 }}>{opt.title}</div>
                              <div style={{ fontSize: 12, color: TX3 }}>{opt.sub}</div>
                            </div>
                            {active && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" /></div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {!form.isFree && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={lbl}>Price (₦)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: TX2 }}>₦</span>
                        <input type="number" min={0} value={form.price || ''} onChange={e => patch({ price: Math.max(0, Number(e.target.value)) })}
                          placeholder="0" style={{ ...inp, paddingLeft: 30 }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                          onBlur={e => e.currentTarget.style.borderColor = BORDER}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={lbl}>Quantity Available</label>
                    <input type="number" min={1} value={form.quantity || ''} onChange={e => patch({ quantity: Math.max(1, Number(e.target.value)) })}
                      placeholder="50" style={inp}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Visibility */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TX1, marginBottom: 3 }}>Active / Visible</div>
                      <div style={{ fontSize: 12, color: TX2 }}>{form.active ? 'Attendees can see and purchase this add-on.' : 'Add-on is hidden from attendees.'}</div>
                    </div>
                    <button onClick={() => patch({ active: !form.active })} style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: form.active ? G : 'rgba(255,255,255,0.15)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}>
                      <div style={{ position: 'absolute', top: 2, left: form.active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TX2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add-on Details</div>
                    {imgPreview && (
                      <img src={imgPreview} alt="Add-on" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
                    )}
                    {[
                      { label: 'Name',     value: form.name || '—' },
                      { label: 'Category', value: form.category },
                      { label: 'Type',     value: form.isFree ? 'Free' : 'Paid' },
                      { label: 'Price',    value: form.isFree ? 'Free' : fmtNaira(form.price) },
                      { label: 'Quantity', value: String(form.quantity) },
                      { label: 'Visible',  value: form.active ? 'Yes' : 'No' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: TX2 }}>{row.label}</span>
                        <span style={{ fontSize: 13, color: TX1, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: TX3, margin: 0 }}>You can edit all details later from the add-on settings.</p>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="rt-modal-preview" style={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '24px 22px', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Eye size={14} color="#8B5CF6" />
                <span style={{ fontSize: 14, fontWeight: 700, color: TX1 }}>Live Preview</span>
              </div>
              <p style={{ fontSize: 12, color: TX2, margin: '0 0 16px' }}>See how your add-on will appear to attendees.</p>

              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['desktop', 'mobile'] as const).map(v => (
                  <button key={v} onClick={() => setActivePreview(v)} style={{
                    flex: 1, padding: '5px 0', borderRadius: 7,
                    border: `1px solid ${activePreview === v ? 'rgba(139,92,246,0.5)' : BORDER}`,
                    background: activePreview === v ? 'rgba(139,92,246,0.1)' : 'transparent',
                    color: activePreview === v ? '#8B5CF6' : TX3, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize',
                  }}>
                    {v}
                  </button>
                ))}
              </div>

              {/* Preview card */}
              <div style={{
                borderRadius: 14, overflow: 'hidden',
                border: `1px solid rgba(139,92,246,0.3)`,
                background: 'rgba(12,17,35,0.9)',
                maxWidth: activePreview === 'mobile' ? 180 : '100%',
                margin: activePreview === 'mobile' ? '0 auto' : 0,
              }}>
                {imgPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imgPreview} alt="Preview" style={{ width: '100%', height: activePreview === 'mobile' ? 90 : 120, objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(10,14,28,0.8)', color: '#8B5CF6', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ADD-ON</span>
                    </div>
                    {form.active && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(10,14,28,0.8)', color: G, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AVAILABLE</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: activePreview === 'mobile' ? 90 : 120, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={28} color="rgba(139,92,246,0.4)" />
                  </div>
                )}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: activePreview === 'mobile' ? 12 : 15, fontWeight: 800, color: TX1, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                    {form.name || 'Add-on Name'}
                  </div>
                  {form.description && (
                    <div style={{ fontSize: 11, color: TX2, lineHeight: 1.5, marginBottom: 10 }}>
                      {form.description.slice(0, 70)}{form.description.length > 70 ? '…' : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: activePreview === 'mobile' ? 14 : 18, fontWeight: 900, color: '#8B5CF6', fontFamily: 'var(--font-display)' }}>
                      {form.isFree ? 'Free' : form.price > 0 ? fmtNaira(form.price) : '₦0'}
                    </span>
                    <button style={{ padding: '6px 14px', borderRadius: 8, background: G, border: 'none', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={onClose} style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: TX2, cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)' }}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TX1, cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.name.trim()} style={{
                  padding: '11px 24px', borderRadius: 10, border: 'none',
                  background: (step === 1 && !form.name.trim()) ? 'rgba(255,255,255,0.08)' : '#8B5CF6',
                  color: (step === 1 && !form.name.trim()) ? TX3 : '#fff',
                  cursor: (step === 1 && !form.name.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
                  padding: '11px 24px', borderRadius: 10, border: 'none',
                  background: form.name.trim() ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
                  color: form.name.trim() ? '#fff' : TX3,
                  cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1,
                }}>
                  {saving
                    ? <><Loader2 size={14} style={{ animation: 'rtSpin 1s linear infinite' }} />{imgUploading ? 'Uploading image…' : 'Saving…'}</>
                    : <><Check size={14} />{editing ? 'Save Changes' : 'Create Add-on'}</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rt-modal-body    { display: flex; min-height: 400px; }
        .rt-modal-row     { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .rt-addon-img-row { display: flex; gap: 12px; align-items: flex-start; }
        @media (max-width: 860px) {
          .rt-modal-preview { display: none !important; }
          .rt-modal-row     { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .rt-addon-img-row { flex-direction: column; }
        }
        @keyframes rtFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes rtSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes rtSpin    { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}