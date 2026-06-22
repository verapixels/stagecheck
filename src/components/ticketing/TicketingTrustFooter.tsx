// ─── TicketingTrustFooter.tsx ──────────────────────────────────────────────
// The 4-icon trust strip near the bottom of the page.

import { RiFlashlightLine, RiLockPasswordLine, RiRefund2Line, RiHeadphoneLine } from 'react-icons/ri'

const ITEMS = [
  { icon: RiFlashlightLine,    title: 'Instant Delivery', desc: 'Your e-ticket will be sent instantly to your email.' },
  { icon: RiLockPasswordLine,  title: 'Secure Payments',  desc: 'Your payment information is safe with us.' },
  { icon: RiRefund2Line,       title: 'Easy Refunds',     desc: 'Get a refund if the event is cancelled.' },
  { icon: RiHeadphoneLine,     title: '24/7 Support',     desc: "We're here to help anytime you need us." },
]

export default function TicketingTrustFooter() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
      marginTop: 28, border: '1px solid var(--card-border)', borderRadius: 16,
      padding: '22px 18px', background: 'var(--card)',
    }}>
      {ITEMS.map(({ icon: Icon, title, desc }) => (
        <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}