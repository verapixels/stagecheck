// ─── TicketingTicketList.tsx ───────────────────────────────────────────────
// "Select Your Tickets" card list — each ticket type with price, quantity
// stepper, and a low-stock pill. Uses the ticket's own `color` field for
// the accent strip (matches EventDetailTicketDrawer's pattern) instead of
// a separate category enum. Plus the "Make it even better" add-ons strip.

import { RiTicketLine } from 'react-icons/ri'
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
  onAddOnAdd: (addOnId: string) => void
}

export default function TicketingTicketList({
  tickets, quantities, onQtyChange, addOns, addOnQuantities, onAddOnAdd,
}: Props) {
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
            {addOns.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)',
                }}>
                  {a.icon && <img src={a.icon} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{a.description}</div>
                </div>
                {a.requiresSize && (
                  <select className="tk-input" style={{ width: 130, padding: '7px 10px', fontSize: 13 }}>
                    <option>Select Size</option>
                    {a.sizeOptions?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', minWidth: 70, textAlign: 'right' }}>
                  {fmtNaira(a.price)}
                </span>
                <button onClick={() => onAddOnAdd(a.id)} className="tk-qty-btn" style={{ width: 32, height: 32 }}>+</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}