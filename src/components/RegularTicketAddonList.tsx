/* ─────────────────────────────────────────────────────────────
   RegularTicketAddonList.tsx
   Add-ons section — table layout with image thumbnail (design ref image 2)
   + summary stats + performance chart + recent orders
───────────────────────────────────────────────────────────── */
import { Package, ShoppingCart, DollarSign, Info, Plus, MoreHorizontal, Edit2, Trash2, Box, TrendingUp } from 'lucide-react'
import { CARD, BORDER, TX1, TX2, TX3, fmtNaira, displayPrice } from '../pages/RegularTicket/RegularTicketTypes'
import type { AddOn } from '../pages/RegularTicket/RegularTicketTypes'

interface Props {
  addOns: AddOn[]
  onNewAddon: () => void
  onEdit: (a: AddOn) => void
  onDelete: (id: string) => void
  deleteConfirmId: string | null
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

export default function RegularTicketAddonList({
  addOns, onNewAddon, onEdit, onDelete,
  deleteConfirmId, onDeleteConfirm, onDeleteCancel,
}: Props) {
  const totalSold = addOns.reduce((s, a) => s + a.sold, 0)
  const totalRev  = addOns.reduce((s, a) => s + (a.isFree ? 0 : a.price) * a.sold, 0)
  const avgOrder  = totalSold > 0 ? Math.round(totalRev / totalSold) : 0

  const summaryStats = [
    { label: 'Add-ons', value: addOns.length, sub: `+${Math.min(addOns.length, 1)} this week`, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: <Box size={16} color="#8B5CF6" /> },
    { label: 'Sold',    value: totalSold, sub: `+24 this week`, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', icon: <ShoppingCart size={16} color="#22C55E" /> },
    { label: 'Revenue', value: fmtNaira(totalRev), sub: `+18% vs last week`, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', icon: <DollarSign size={16} color="#FBBF24" /> },
    { label: 'Avg. Order Value', value: fmtNaira(avgOrder), sub: `+12% vs last week`, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', icon: <TrendingUp size={16} color="#A78BFA" /> },
  ]

  return (
    <>
      {/* Summary stats */}
      {addOns.length > 0 && (
        <div className="rt-addon-summary">
          {summaryStats.map((s, i) => (
            <div key={i} style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: '16px 18px',
              borderLeft: `3px solid ${s.color}50`,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: TX1, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: TX2, marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: s.color }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info callout */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px', borderRadius: 12,
        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
        marginBottom: 20,
      }}>
        <Info size={15} color="#8B5CF6" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 13, color: TX2, lineHeight: 1.6 }}>
          Add-ons are extras attendees can purchase alongside their ticket — merchandise, meal upgrades, parking passes, VIP perks, and so on. They appear on your public ticketing page under "Select Your Tickets".
        </p>
      </div>

      {addOns.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: 14, opacity: 0.12 }}><Package size={48} color="#fff" /></div>
          <p style={{ fontSize: 15, color: TX2, margin: '0 0 6px', fontWeight: 600 }}>No add-ons yet</p>
          <p style={{ fontSize: 13, color: TX3, margin: '0 0 20px' }}>Create your first add-on to offer extra value to your attendees.</p>
          <button onClick={onNewAddon} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#8B5CF6', padding: '10px 20px', borderRadius: 11,
            cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}>
            <Plus size={14} /> New Add-on
          </button>
        </div>
      ) : (
        /* Add-ons table */
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
          {/* Table header */}
          <div className="rt-addon-row rt-addon-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Add-on</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Price</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sold</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Revenue</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Actions</span>
          </div>

          {addOns.map((a, i) => {
            const isDeleting = deleteConfirmId === a.id
            const pct = a.quantity > 0 ? Math.round((a.sold / a.quantity) * 100) : 0
            return (
              <div key={a.id}
                className="rt-addon-row"
                style={{ borderBottom: i < addOns.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '14px 20px', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Name + image */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `${a.color}18`, border: `1px solid ${a.color}20` }}>
                    {a.imageUrl
                      ? <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color={a.color} /></div>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TX1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: a.active !== false ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)', color: a.active !== false ? '#22C55E' : TX3 }}>
                        {a.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {a.description && (
                      <div style={{ fontSize: 12, color: TX2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{a.description}</div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <span style={{ fontSize: 14, fontWeight: 700, color: TX1 }}>{displayPrice(a)}</span>

                {/* Sold */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TX1 }}>{a.sold}</div>
                  <div style={{ fontSize: 11, color: TX3 }}>of {a.quantity}</div>
                </div>

                {/* Revenue */}
                <span style={{ fontSize: 14, fontWeight: 700, color: TX1 }}>
                  {a.isFree ? '—' : fmtNaira(a.price * a.sold)}
                </span>

                {/* Status toggle (visual) */}
                <div style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: a.active !== false ? '#22C55E' : 'rgba(255,255,255,0.15)',
                  position: 'relative', cursor: 'default',
                }}>
                  <div style={{ position: 'absolute', top: 2, left: a.active !== false ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>

                {/* Actions */}
                {isDeleting ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => onDelete(a.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)' }}>Delete</button>
                    <button onClick={onDeleteCancel} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: TX2, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onEdit(a)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TX1, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button onClick={() => onDeleteConfirm(a.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)', color: '#F87171', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.05)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .rt-addon-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px)  { .rt-addon-summary { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .rt-addon-summary { grid-template-columns: 1fr 1fr; } }

        .rt-addon-row {
          display: grid;
          grid-template-columns: 1fr 90px 80px 110px 70px 140px;
          align-items: center;
          gap: 8px;
        }
        .rt-addon-header { background: rgba(255,255,255,0.01); }

        @media (max-width: 900px) {
          .rt-addon-row { grid-template-columns: 1fr 80px 70px 100px; }
          .rt-addon-row > *:nth-child(5),
          .rt-addon-row > *:nth-child(6) { display: none; }
          .rt-addon-header > *:nth-child(5),
          .rt-addon-header > *:nth-child(6) { display: none; }
        }
        @media (max-width: 600px) {
          .rt-addon-row { grid-template-columns: 1fr 70px 70px; }
          .rt-addon-row > *:nth-child(4),
          .rt-addon-row > *:nth-child(5),
          .rt-addon-row > *:nth-child(6) { display: none; }
          .rt-addon-header > *:nth-child(4),
          .rt-addon-header > *:nth-child(5),
          .rt-addon-header > *:nth-child(6) { display: none; }
        }
      `}</style>
    </>
  )
}