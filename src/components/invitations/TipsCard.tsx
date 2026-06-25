// src/components/invitations/TipsCard.tsx
import { CheckCircle2 } from 'lucide-react'

const tips = [
  'Only accept invitations from people you know and trust.',
  'Review your role and permissions before accepting.',
  'You can leave a team at any time from the event settings.',
]

export default function TipsCard() {
  return (
    <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Tips</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <CheckCircle2 size={14} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}