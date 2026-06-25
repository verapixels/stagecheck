// src/components/invitations/WhatAreInvitationsCard.tsx
import { ShieldCheck } from 'lucide-react'

export default function WhatAreInvitationsCard() {
  return (
    <div style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <ShieldCheck size={16} color="#22C55E" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>What are Invitations?</span>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
        Invitations give you access to manage events or join a team with specific permissions.
      </p>
      <a href="#" style={{ fontSize: 12, color: '#22C55E', textDecoration: 'none' }}>Learn more →</a>
    </div>
  )
}