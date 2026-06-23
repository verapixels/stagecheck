// ─── EventDetailSidebar.tsx ───────────────────────────────────────────────────
// Right-column sticky ticket panel — matches screenshot exactly:
// "Starts From ₦5,000 / Secure your spot" → ticket type rows →
// Quantity stepper → Get Tickets → Buy for a Group → Secure badge

import {
  RiShieldCheckLine, RiTicketLine, RiArrowRightLine,
  RiGroupLine, RiArrowDownSLine,
} from 'react-icons/ri'
import type { TicketType } from './eventDetailTypes'

interface Props {
  tickets: TicketType[]
  selectedTicket: TicketType | null
  qty: number
  onSelectTicket: (t: TicketType) => void
  onQtyChange: (qty: number) => void
  onGetTickets: () => void
  minPrice: number
  isFree: boolean
}

export default function EventDetailSidebar({
  tickets, selectedTicket, qty,
  onSelectTicket, onQtyChange, onGetTickets,
  minPrice, isFree,
}: Props) {
  const maxQty = selectedTicket
    ? selectedTicket.quantity - selectedTicket.sold
    : 1

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(13,199,94,0.22)',
      borderRadius: 18, overflow: 'hidden',
    }}>
      {/* Green accent bar at top */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, var(--green), rgba(13,199,94,0.2))',
      }} />

      <div style={{ padding: '22px 22px 20px' }}>

        {/* ── Price header */}
        <div style={{ marginBottom: 18 }}>
          {tickets.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              No tickets available yet.
            </div>
          ) : isFree ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Starts From
              </div>
              <div style={{
                fontSize: 28, fontWeight: 900, color: 'var(--green)',
                letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif',
              }}>
                Free
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                Starts From
              </div>
              <div style={{
                fontSize: 30, fontWeight: 900, color: '#fff',
                letterSpacing: '-1px', fontFamily: 'Inter, sans-serif',
              }}>
                ₦{minPrice.toLocaleString()}
              </div>
            </>
          )}
          {tickets.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              marginTop: 7, fontSize: 12, color: 'var(--text-tertiary)',
            }}>
              <RiShieldCheckLine size={12} color="var(--green)" />
              Secure your spot today!
            </div>
          )}
        </div>

        {/* ── Ticket type list */}
        {tickets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.38)',
              fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: 10,
            }}>
              Select Ticket Type
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tickets.slice(0, 5).map(t => {
                const rem = t.quantity - t.sold
                const soldOut = rem <= 0
                const sel = selectedTicket?.id === t.id

                return (
                  <div
                    key={t.id}
                    onClick={() => !soldOut && onSelectTicket(t)}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '11px 14px',
                      borderRadius: 10,
                      border: `1px solid ${sel
                        ? t.color + '55'
                        : soldOut
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.08)'}`,
                      background: sel
                        ? `${t.color}10`
                        : 'rgba(255,255,255,0.02)',
                      cursor: soldOut ? 'not-allowed' : 'pointer',
                      opacity: soldOut ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Left: dot + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: soldOut ? 'rgba(255,255,255,0.15)' : t.color,
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: sel ? '#fff' : 'rgba(255,255,255,0.8)',
                        }}>
                          {t.name}
                        </div>
                        
                        {!soldOut && rem <= 10 && (
                          <div style={{ fontSize: 10, color: '#f87171', marginTop: 1 }}>
                            Only {rem} left!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: price + arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: soldOut
                            ? 'rgba(255,255,255,0.2)'
                            : t.price === 0
                              ? 'var(--green)'
                              : sel
                                ? '#fff'
                                : 'var(--text-secondary)',
                        }}>
                          {soldOut
                            ? 'Sold out'
                            : t.price === 0
                              ? 'Free'
                              : `₦${t.price.toLocaleString()}`}
                        </div>
                        {/* "Available" tag for selected first ticket */}
                        {sel && !soldOut && (
                          <div style={{
                            fontSize: 10, color: 'var(--green)',
                            fontWeight: 600, marginTop: 1,
                          }}>
                            Available
                          </div>
                        )}
                      </div>
                      {!soldOut && (
                        <RiArrowDownSLine size={15} color="rgba(255,255,255,0.25)" />
                      )}
                    </div>
                  </div>
                )
              })}
              {tickets.length > 5 && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', paddingLeft: 4 }}>
                  +{tickets.length - 5} more ticket types
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Quantity stepper */}
        {selectedTicket && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, marginBottom: 14,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quantity
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => onQtyChange(Math.max(1, qty - 1))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                −
              </button>
              <span style={{
                fontSize: 15, fontWeight: 800, color: '#fff',
                minWidth: 22, textAlign: 'center',
              }}>
                {qty}
              </span>
              <button
                onClick={() => onQtyChange(Math.min(maxQty, qty + 1))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* ── Get Tickets CTA */}
        <button
          onClick={onGetTickets}
          className="btn-green"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 10, fontSize: 14 }}
        >
          <RiTicketLine size={16} />
          {tickets.length === 0
            ? 'Register Interest'
            : isFree
              ? 'Register Free'
              : 'Get Tickets'}
          <RiArrowRightLine size={15} />
        </button>

        {/* ── Buy for a Group */}
        {!isFree && tickets.length > 0 && (
          <button
            style={{
              width: '100%', padding: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.72)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 7, marginTop: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <RiGroupLine size={15} /> Buy for a Group
          </button>
        )}

        {/* ── Secure badge */}
        {tickets.length > 0 && (
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.28)',
            textAlign: 'center', marginTop: 12,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 5,
          }}>
            <RiShieldCheckLine size={12} color="rgba(13,199,94,0.5)" />
            Secure Ticketing. Trusted by thousands.
          </div>
        )}
      </div>
    </div>
  )
}