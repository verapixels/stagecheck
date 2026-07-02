/* ─────────────────────────────────────────────────────────────
   RegularTicketAddonModal.tsx
   Wide centered modal for creating / editing add-ons.
   Includes multi-image upload (up to MAX_ADDON_IMAGES images,
   base64 preview + Firebase Storage URLs).
───────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef } from 'react'
import {
  X, Check, Loader2, Package, Gift, CreditCard, Upload,
  Eye, ChevronRight, ImageIcon, Ruler, Plus,
} from 'lucide-react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from'../lib/firebase'
import {
  G, TX1, TX2, TX3, BORDER, ADDON_CATEGORIES, COMMON_SIZE_PRESETS, MAX_ADDON_IMAGES,
  EMPTY_ADDON_FORM, fmtNaira,
} from '../pages/RegularTicket/RegularTicketTypes'
import type { AddOn } from '../pages/RegularTicket/RegularTicketTypes'

type ProductType = 'physical' | 'digital' | 'service'

// One upload slot — either empty, holding a not-yet-uploaded File (shown via
// a local data-url preview), or holding an already-uploaded Storage URL.
interface ImageSlot {
  file: File | null
  preview: string | null   // data-url (pending) or https:// url (already saved)
}
const EMPTY_SLOT: ImageSlot = { file: null, preview: null }

interface Props {
  open: boolean
  editing: AddOn | null
  eventId: string
  onClose: () => void
  onSave: (data: typeof EMPTY_ADDON_FORM & { imageUrl: string; images: string[] }) => Promise<void>
}

export default function RegularTicketAddonModal({ open, editing, eventId, onClose, onSave }: Props) {
  const [form, setForm]           = useState({ ...EMPTY_ADDON_FORM, imageUrl: '' })
  const [productType, setProductType] = useState<ProductType>('physical')
  const [sizeInput, setSizeInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [step, setStep]           = useState(1)
  const [slots, setSlots]         = useState<ImageSlot[]>([EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT])
  const [imgUploading, setImgUploading] = useState(false)
  const [activePreview, setActivePreview] = useState<'desktop' | 'mobile'>('desktop')
  const [previewImgIdx, setPreviewImgIdx] = useState(0)
  const overlayRef  = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlotIndex = useRef<number>(0)

  const filledSlots = slots.filter(s => s.preview)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setSizeInput('')
    setPreviewImgIdx(0)
    if (editing) {
      const existingImages = editing.images?.length ? editing.images : (editing.imageUrl ? [editing.imageUrl] : [])
      const nextSlots: ImageSlot[] = [0, 1, 2].map(i => ({ file: null, preview: existingImages[i] || null }))
      setSlots(nextSlots)
      setForm({
        name: editing.name, isFree: editing.isFree ?? editing.price === 0,
        price: editing.price, quantity: editing.quantity,
        description: editing.description || '',
        color: editing.color, imageUrl: editing.imageUrl || '',
        images: existingImages,
        category: (editing.category || 'hospitality') as any, active: editing.active ?? true,
        requiresSize: editing.requiresSize ?? false,
        sizeOptions: editing.sizeOptions || [],
      })
    } else {
      setForm({ ...EMPTY_ADDON_FORM, imageUrl: '' })
      setSlots([EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT])
      setProductType('physical')
    }
  }, [open, editing])

  const patch = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }))

  const openFilePicker = (index: number) => {
    activeSlotIndex.current = index
    fileInputRef.current?.click()
  }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    const idx = activeSlotIndex.current
    const reader = new FileReader()
    reader.onload = ev => {
      setSlots(s => s.map((slot, i) => i === idx ? { file, preview: ev.target?.result as string } : slot))
    }
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-picking the same file
  }

  const removeImage = (index: number) => {
    setSlots(s => s.map((slot, i) => i === index ? { ...EMPTY_SLOT } : slot))
  }

  const addSize = (raw: string) => {
    const val = raw.trim().toUpperCase()
    if (!val) return
    if (form.sizeOptions.includes(val)) { setSizeInput(''); return }
    patch({ sizeOptions: [...form.sizeOptions, val] })
    setSizeInput('')
  }
  const removeSize = (val: string) => {
    patch({ sizeOptions: form.sizeOptions.filter(s => s !== val) })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      setImgUploading(true)
      const uploadedUrls: string[] = []
      for (const slot of slots) {
        if (!slot.preview) continue
        if (slot.file) {
          // pending upload — a data-url preview that hasn't hit Storage yet
          const sRef = storageRef(storage, `events/${eventId}/addons/${Date.now()}_${slot.file.name}`)
          await uploadBytes(sRef, slot.file)
          const url = await getDownloadURL(sRef)
          uploadedUrls.push(url)
        } else {
          // already a real Storage URL from a previous save
          uploadedUrls.push(slot.preview)
        }
      }
      setImgUploading(false)

      const requiresSize = form.requiresSize && form.sizeOptions.length > 0
      await onSave({
        ...form,
        images: uploadedUrls,
        imageUrl: uploadedUrls[0] || '', // keep first image as the legacy single-image field
        requiresSize,
      })
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
                        {([
                          { key: 'physical', label: 'Physical' },
                          { key: 'digital',  label: 'Digital' },
                          { key: 'service',  label: 'Service' },
                        ] as { key: ProductType; label: string }[]).map(t => {
                          const active = productType === t.key
                          return (
                            <button
                              key={t.key}
                              onClick={() => {
                                setProductType(t.key)
                                if (t.key !== 'physical') patch({ requiresSize: false })
                              }}
                              style={{
                                flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer',
                                border: `1.5px solid ${active ? 'rgba(139,92,246,0.6)' : BORDER}`,
                                background: active ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                                color: active ? '#8B5CF6' : TX2, fontSize: 13, fontWeight: active ? 700 : 500,
                                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                              }}
                            >
                              {t.label}
                            </button>
                          )
                        })}
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

                  {/* Sizes — only for Physical add-ons */}
                  {productType === 'physical' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Ruler size={15} color={form.requiresSize ? '#8B5CF6' : TX3} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: TX1 }}>Comes in different sizes?</div>
                            <div style={{ fontSize: 11.5, color: TX3 }}>Attendees pick a size before adding it to their order.</div>
                          </div>
                        </div>
                        <button onClick={() => patch({ requiresSize: !form.requiresSize })} style={{
                          width: 40, height: 22, borderRadius: 11,
                          background: form.requiresSize ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
                          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        }}>
                          <div style={{ position: 'absolute', top: 2, left: form.requiresSize ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                        </button>
                      </div>

                      {form.requiresSize && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {COMMON_SIZE_PRESETS.map(s => {
                              const active = form.sizeOptions.includes(s)
                              return (
                                <button key={s} onClick={() => active ? removeSize(s) : addSize(s)} style={{
                                  padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                                  border: `1px solid ${active ? 'rgba(139,92,246,0.6)' : BORDER}`,
                                  background: active ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                  color: active ? '#8B5CF6' : TX2, fontSize: 12, fontWeight: 600,
                                  fontFamily: 'var(--font-body)',
                                }}>
                                  {s}
                                </button>
                              )
                            })}
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={sizeInput}
                              onChange={e => setSizeInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(sizeInput) } }}
                              placeholder="Custom size — e.g. 42 or One Size"
                              style={{ ...inp, flex: 1 }}
                              onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                              onBlur={e => e.currentTarget.style.borderColor = BORDER}
                            />
                            <button onClick={() => addSize(sizeInput)} style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '0 16px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.4)',
                              background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', cursor: 'pointer',
                              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', flexShrink: 0,
                            }}>
                              <Plus size={14} /> Add
                            </button>
                          </div>

                          {form.sizeOptions.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {form.sizeOptions.map(s => (
                                <span key={s} style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '5px 6px 5px 10px', borderRadius: 7,
                                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                                  color: TX1, fontSize: 12, fontWeight: 600,
                                }}>
                                  {s}
                                  <button onClick={() => removeSize(s)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer', color: TX3,
                                    display: 'flex', alignItems: 'center', padding: 2,
                                  }}>
                                    <X size={11} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          {form.sizeOptions.length === 0 && (
                            <p style={{ margin: 0, fontSize: 11.5, color: '#F87171' }}>
                              Add at least one size, or attendees won't be able to select this add-on.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image upload — up to MAX_ADDON_IMAGES slots */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={lbl}>
                      Add-on Images * <span style={{ color: TX3, fontWeight: 400, textTransform: 'none' }}>(up to {MAX_ADDON_IMAGES})</span>
                    </label>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleImagePick} style={{ display: 'none' }} />

                    <div className="rt-addon-img-row">
                      {slots.map((slot, i) => (
                        <div key={i} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                          {slot.preview ? (
                            <div style={{ position: 'relative' }}>
                              <img src={slot.preview} alt={`Image ${i + 1}`} style={{
                                width: '100%', height: 130, objectFit: 'cover',
                                borderRadius: 12, border: `1px solid ${BORDER}`, display: 'block',
                              }} />
                              {i === 0 && (
                                <span style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9, fontWeight: 700, background: 'rgba(10,14,28,0.85)', color: '#8B5CF6', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  Main
                                </span>
                              )}
                              <button onClick={() => removeImage(i)} style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 24, height: 24, borderRadius: '50%',
                                background: 'rgba(10,14,28,0.85)', border: `1px solid ${BORDER}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#F87171',
                              }}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => openFilePicker(i)}
                              style={{
                                border: `2px dashed rgba(255,255,255,0.15)`,
                                borderRadius: 12, padding: '20px 10px',
                                textAlign: 'center', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)', transition: 'all 0.15s',
                                height: 130, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                            >
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={16} color="#8B5CF6" />
                              </div>
                              <p style={{ margin: 0, fontSize: 11.5, color: TX2, lineHeight: 1.4 }}>
                                {i === 0 ? 'Main image' : `Image ${i + 1} (optional)`}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: TX3 }}>PNG, JPG or WEBP, max 5MB each. Recommended 1200 × 800px.</p>

                    {/* Tips */}
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <ImageIcon size={13} color={G} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Tips for great images</span>
                      </div>
                      {['Use high-quality, clear images', 'Show what the add-on includes from different angles', 'Avoid text-heavy images'].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                          <Check size={10} color={G} />
                          <span style={{ fontSize: 12, color: TX2 }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: TX3 }}>Attendees can tap an image to view it larger and browse all {MAX_ADDON_IMAGES}.</p>
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
                    {filledSlots.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {filledSlots.map((s, i) => (
                          <img key={i} src={s.preview!} alt={`Image ${i + 1}`} style={{ flex: 1, height: 100, objectFit: 'cover', borderRadius: 10 }} />
                        ))}
                      </div>
                    )}
                    {[
                      { label: 'Name',     value: form.name || '—' },
                      { label: 'Category', value: form.category },
                      { label: 'Type',     value: form.isFree ? 'Free' : 'Paid' },
                      { label: 'Price',    value: form.isFree ? 'Free' : fmtNaira(form.price) },
                      { label: 'Quantity', value: String(form.quantity) },
                      { label: 'Sizes',    value: form.requiresSize && form.sizeOptions.length > 0 ? form.sizeOptions.join(', ') : 'None' },
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
                {filledSlots.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={filledSlots[Math.min(previewImgIdx, filledSlots.length - 1)].preview!}
                      alt="Preview"
                      style={{ width: '100%', height: activePreview === 'mobile' ? 90 : 120, objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(10,14,28,0.8)', color: '#8B5CF6', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ADD-ON</span>
                    </div>
                    {form.active && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(10,14,28,0.8)', color: G, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AVAILABLE</span>
                      </div>
                    )}
                    {filledSlots.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                        {filledSlots.map((_, i) => (
                          <button key={i} onClick={() => setPreviewImgIdx(i)} style={{
                            width: 6, height: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                            background: i === previewImgIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                          }} />
                        ))}
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
                  {form.requiresSize && form.sizeOptions.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <select disabled style={{
                        width: '100%', padding: '6px 10px', borderRadius: 7, fontSize: 11,
                        background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TX2,
                      }}>
                        <option>Select Size</option>
                        {form.sizeOptions.map(s => <option key={s}>{s}</option>)}
                      </select>
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
                    ? <><Loader2 size={14} style={{ animation: 'rtSpin 1s linear infinite' }} />{imgUploading ? 'Uploading images…' : 'Saving…'}</>
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
        .rt-addon-img-row { display: flex; gap: 10px; align-items: stretch; }
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