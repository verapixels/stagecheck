/* ─────────────────────────────────────────────────────────────
   RegularTicketList.tsx
   Ticket type cards grid — matches the design reference image 1
───────────────────────────────────────────────────────────── */
import { Loader2, Ticket, Gift, CreditCard, Tag, Users, Hash, TrendingUp, Edit2, Trash2 } from 'lucide-react'
import { CARD, BORDER, TX1, TX2, TX3, displayPrice, fmtNaira } from '../pages/RegularTicket/RegularTicketTypes'
import type { TicketType } from '../pages/RegularTicket/RegularTicketTypes'

interface Props {
  tickets: TicketType[]
  loading: boolean
  onEdit: (t: TicketType) => void
  onDelete: (id: string) => void
  deleteConfirmId: string | null
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

export default function RegularTicketList({
  tickets, loading, onEdit, onDelete,
  deleteConfirmId, onDeleteConfirm, onDeleteCancel,
}: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: TX2, padding: '48px 0' }}>
        <Loader2 size={18} style={{ animation: 'rtSpin 1s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Loading ticket types…</span>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 20, padding: '64px 24px', textAlign: 'center',
      }}>
        <div style={{ marginBottom: 12, opacity: 0.12 }}><Ticket size={48} color="#fff" /></div>
        <p style={{ fontSize: 15, color: TX2, margin: '0 0 6px', fontWeight: 600 }}>No ticket types yet</p>
        <p style={{ fontSize: 13, color: TX3, margin: 0 }}>Create your first ticket type to start selling.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rt-ticket-grid">
        {tickets.map(t => {
          const isFree = t.isFree ?? t.price === 0
          const pct = t.quantity > 0 ? Math.min(100, Math.round((t.sold / t.quantity) * 100)) : 0
          const isDeleting = deleteConfirmId === t.id

          return (
            <div
              key={t.id}
              style={{
                background: CARD, border: `1px solid ${t.color}20`,
                borderRadius: 20, overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 12px 40px ${t.color}18`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Color top bar */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${t.color}, ${t.color}44)` }} />

              <div style={{ padding: '18px 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    {/* Type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: `${t.color}18`, border: `1px solid ${t.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isFree
                          ? <Gift size={13} color={t.color} />
                          : <CreditCard size={13} color={t.color} />
                        }
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.color }}>
                        {t.category || (isFree ? 'Free ticket' : 'Paid ticket')}
                      </span>
                      {/* Status dot */}
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: pct < 100 ? '#22C55E' : '#EF4444',
                        marginLeft: 'auto', flexShrink: 0,
                        boxShadow: pct < 100 ? '0 0 6px #22C55E66' : 'none',
                      }} />
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 800, color: TX1,
                      fontFamily: 'var(--font-display)', lineHeight: 1.25,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.name}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: 12, color: TX2, lineHeight: 1.5, marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                        {t.description}
                      </div>
                    )}
                  </div>
                  {/* Price badge */}
                  <div style={{
                    background: `${t.color}18`, border: `1px solid ${t.color}30`,
                    borderRadius: 10, padding: '6px 11px', textAlign: 'right', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: t.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
                      {displayPrice(t)}
                    </div>
                    {!isFree && <div style={{ fontSize: 10, color: `${t.color}80`, marginTop: 1 }}>per ticket</div>}
                  </div>
                </div>

                {/* Stats rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {[
                    { icon: <Tag size={11} />,        label: 'Capacity',  value: `${t.quantity} total` },
                    { icon: <Users size={11} />,      label: 'Sold',      value: `${t.sold} sold` },
                    { icon: <Hash size={11} />,       label: 'Remaining', value: `${t.quantity - t.sold} left` },
                    { icon: <TrendingUp size={11} />, label: 'Revenue',   value: isFree ? 'N/A' : fmtNaira(t.price * t.sold) },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: TX2 }}>
                        {row.icon}
                        <span style={{ fontSize: 13 }}>{row.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TX1 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: TX2, marginBottom: 5 }}>
                    <span>Sales progress</span>
                    <span style={{ color: t.color, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: `linear-gradient(90deg, ${t.color}, ${t.color}88)`,
                      borderRadius: 4, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Actions */}
                {isDeleting ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(248,113,113,0.9)', flex: 1 }}>Delete this ticket type?</span>
                    <button onClick={() => onDelete(t.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}>Yes</button>
                    <button onClick={onDeleteCancel} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: TX2, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onEdit(t)} style={{
                      flex: 1, padding: '9px 0', borderRadius: 10,
                      border: `1px solid ${BORDER}`,
                      background: 'rgba(255,255,255,0.04)', color: TX1,
                      cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => onDeleteConfirm(t.id)} style={{
                      padding: '9px 14px', borderRadius: 10,
                      border: '1px solid rgba(248,113,113,0.18)',
                      background: 'rgba(248,113,113,0.05)', color: '#F87171',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.05)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .rt-ticket-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        @media (max-width: 480px) { .rt-ticket-grid { grid-template-columns: 1fr; gap: 12px; } }
        @keyframes rtSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}