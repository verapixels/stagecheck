// ─── TicketingTicketList.tsx ───────────────────────────────────────────────
// "Select Your Tickets" card list — each ticket type with price, quantity
// stepper, and a low-stock pill. Uses the ticket's own `color` field for
// the accent strip (matches EventDetailTicketDrawer's pattern) instead of
// a separate category enum. Plus the "Make it even better" add-ons strip.

import { useState } from 'react'
import { RiTicketLine, RiZoomInLine, RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri'
import type { TicketType, AddOn } from './ticketingTypes'

function fmtNaira(n: number) {
  return `₦${n.toLocaleString()}`
}

interface Props {
  tickets: TicketType[]
  quantities: Record<string, number>
  onQtyChange: (ticketId: string, qty: number) => void
  addOns: AddOn[]
  addOnQuantities: Record<string, number>
  // `size` is optional so this keeps working even before the parent page
  // is updated to actually use it — it'll just come through as undefined
  // until the parent's addOnQuantities/onAddOnAdd handling is updated to
  // key by size too.
  onAddOnAdd: (addOnId: string, size?: string) => void
}

function addOnImages(a: AddOn): string[] {
  if (a.images?.length) return a.images
  if (a.imageUrl) return [a.imageUrl]
  return []
}

export default function TicketingTicketList({
  tickets, quantities, onQtyChange, addOns, addOnQuantities, onAddOnAdd,
}: Props) {
  // Track the currently-selected size per add-on locally, since the parent
  // doesn't know about sizes yet. Keyed by add-on id.
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  // Lightbox state: which add-on's gallery is open, and which image index.
  const [lightboxAddOn, setLightboxAddOn] = useState<AddOn | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (a: AddOn) => {
    if (addOnImages(a).length === 0) return
    setLightboxAddOn(a)
    setLightboxIndex(0)
  }
  const closeLightbox = () => setLightboxAddOn(null)
  const lightboxImages = lightboxAddOn ? addOnImages(lightboxAddOn) : []
  const showPrev = () => setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length)
  const showNext = () => setLightboxIndex(i => (i + 1) % lightboxImages.length)

  return (
    <div className="tk-fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
        Select Your Tickets
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 18px' }}>
        Choose the ticket type that works for you.
      </p>

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 14 }}>
          <RiTicketLine size={36} style={{ display: 'block', margin: '0 auto 12px' }} />
          No tickets available yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tickets.map(t => {
            const qty = quantities[t.id] || 0
            const selected = qty > 0
            const remaining = t.quantity - t.sold
            const soldOut = remaining <= 0
            const lowStock = !soldOut && remaining <= 5
            const accent = t.color || 'var(--green)'

            return (
              <div key={t.id} style={{
                border: selected ? `1px solid ${accent}` : '1px solid var(--card-border)',
                background: selected ? `${accent}14` : 'var(--card)',
                borderRadius: 16, overflow: 'hidden',
                opacity: soldOut ? 0.5 : 1,
                position: 'relative',
                transition: 'border-color 0.2s, background 0.2s',
              }}>
                
                <div style={{
                  padding: 18, display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                }}>
                  {selected && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      width: 22, height: 22, borderRadius: '50%',
                      background: accent, color: '#00210d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900,
                    }}>✓</div>
                  )}

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--text)', marginBottom: 4 }}>
                      {t.name}
                    </div>
                    {t.description && (
                      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 6px', maxWidth: 360 }}>
                        {t.description}
                      </p>
                    )}
                    <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
                      {t.price === 0 ? 'Free' : fmtNaira(t.price)}
                    </div>
                    {soldOut ? (
                      <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginTop: 6 }}>
                        Sold out
                      </div>
                    ) : lowStock && (
                      <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginTop: 6 }}>
                        Only {remaining} left!
                      </div>
                    )}
                  </div>

                  {!soldOut && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Quantity</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          className="tk-qty-btn"
                          disabled={qty <= 0}
                          onClick={() => onQtyChange(t.id, Math.max(0, qty - 1))}
                        >−</button>
                        <span style={{ width: 24, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                        <button
                          className="tk-qty-btn"
                          disabled={qty >= remaining}
                          onClick={() => onQtyChange(t.id, qty + 1)}
                        >+</button>
                      </div>
                      {qty > 0 && (
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>
                          {qty} ticket{qty > 1 ? 's' : ''} · <strong style={{ color: 'var(--text)' }}>{fmtNaira(t.price * qty)}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add-ons */}
      {addOns.length > 0 && (
        <div style={{
          marginTop: 18, border: '1px solid var(--card-border)', borderRadius: 16,
          padding: 18, background: 'var(--card)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: 'var(--text)' }}>
            Make it even better with an add-on!
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px' }}>
            Elevate your experience with our premium add-ons.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {addOns.map(a => {
              const needsSize = a.requiresSize && (a.sizeOptions?.length ?? 0) > 0
              const chosenSize = selectedSizes[a.id] || ''
              const canAdd = !needsSize || chosenSize !== ''
              const images = addOnImages(a)

              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openLightbox(a)}
                    disabled={images.length === 0}
                    style={{
                      position: 'relative', width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)', border: 'none', padding: 0,
                      cursor: images.length > 0 ? 'pointer' : 'default',
                    }}
                    title={images.length > 0 ? 'Tap to view larger' : undefined}
                  >
                    {images[0] && <img src={images[0]} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {images.length > 0 && (
                      <span style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0)', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                      >
                        <RiZoomInLine size={14} color="#fff" style={{ opacity: 0 }} className="tk-zoom-icon" />
                      </span>
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{a.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{a.description}</div>
                  </div>
                  {needsSize && (
                    <select
                      className="tk-input"
                      value={chosenSize}
                      onChange={e => setSelectedSizes(s => ({ ...s, [a.id]: e.target.value }))}
                      style={{ width: 130, padding: '7px 10px', fontSize: 13 }}
                    >
                      <option value="">Select Size</option>
                      {a.sizeOptions?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', minWidth: 70, textAlign: 'right' }}>
                    {fmtNaira(a.price)}
                  </span>
                  <button
                    onClick={() => canAdd && onAddOnAdd(a.id, needsSize ? chosenSize : undefined)}
                    disabled={!canAdd}
                    className="tk-qty-btn"
                    style={{ width: 32, height: 32, opacity: canAdd ? 1 : 0.4, cursor: canAdd ? 'pointer' : 'not-allowed' }}
                    title={!canAdd ? 'Select a size first' : undefined}
                  >+</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxAddOn && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'tkFadeIn 0.15s ease',
          }}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RiCloseLine size={20} />
          </button>

          {/*
            No stopPropagation wrapper here on purpose — tapping the image
            or caption area also closes the lightbox now, same as tapping
            the backdrop. On mobile this wrapper takes up almost the whole
            screen, so requiring a tap strictly *outside* it left barely
            any tappable area, which is why closing wasn't working.
            Only the actual controls below (prev/next/dots/close) stop
            propagation, since those need their own click behavior.
          */}
          <div style={{ maxWidth: 'min(720px, 92vw)', width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={lightboxImages[lightboxIndex]}
                alt={lightboxAddOn.name}
                style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 14, display: 'block', background: '#0a0f1e' }}
              />
              {lightboxImages.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); showPrev() }} style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <RiArrowLeftSLine size={20} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); showNext() }} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <RiArrowRightSLine size={20} />
                  </button>
                </>
              )}
            </div>

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{lightboxAddOn.name}</div>
              {lightboxImages.length > 1 && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                  {lightboxImages.map((_, i) => (
                    <button key={i} onClick={e => { e.stopPropagation(); setLightboxIndex(i) }} style={{
                      width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                      background: i === lightboxIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                    }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tk-zoom-icon { transition: opacity 0.15s; }
        button:hover > span > .tk-zoom-icon { opacity: 1; }
        @keyframes tkFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}