// src/components/invitations/InvitationTabs.tsx
type Tab = 'pending' | 'accepted' | 'declined'

export default function InvitationTabs({
  active, onChange, counts,
}: { active: Tab; onChange: (t: Tab) => void; counts: Record<Tab, number> }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)',
            background: active === t.key ? 'rgba(34,197,94,0.12)' : 'transparent',
            color: active === t.key ? '#22C55E' : 'rgba(255,255,255,0.5)',
            fontWeight: active === t.key ? 600 : 400,
          }}
        >
          {t.label}
          <span style={{
            fontSize: 11, background: active === t.key ? '#22C55E' : 'rgba(255,255,255,0.1)',
            color: active === t.key ? '#0B1020' : 'rgba(255,255,255,0.5)',
            borderRadius: 999, padding: '1px 7px', fontWeight: 700,
          }}>
            {counts[t.key]}
          </span>
        </button>
      ))}
    </div>
  )
}