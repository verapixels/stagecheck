// src/pages/InvitationsPage.tsx
import { useState } from 'react'
import UserDashboardLayout from '../components/UserDashboardLayout'
import { useAuth } from '../context/Authcontext'
import { useUserInvitations } from '../lib/useUserInvitations'
import InvitationTabs from '../components/invitations/InvitationTabs'
import InvitationCard from '../components/invitations/InvitationCard'
import AcceptedInvitationsList from '../components/invitations/AcceptedInvitationsList'
import WhatAreInvitationsCard from '../components/invitations/WhatAreInvitationsCard'
import TipsCard from '../components/invitations/TipsCard'

type Tab = 'pending' | 'accepted' | 'declined'

export default function InvitationsPage() {
  const { user } = useAuth()
  const { pending, accepted, declined, loading } = useUserInvitations(user?.uid, user?.email)
  const [tab, setTab] = useState<Tab>('pending')

  const counts = { pending: pending.length, accepted: accepted.length, declined: declined.length }
  const list = tab === 'pending' ? pending : tab === 'accepted' ? accepted : declined

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: '#fff', marginBottom: 6 }}>
          Invitations
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
          View and respond to event invitations and team access requests.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 20 }} className="inv-grid">
        <div>
          <InvitationTabs active={tab} onChange={setTab} counts={counts} />

          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '20px 0' }}>Loading invitations...</div>
          ) : tab === 'pending' ? (
            list.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                No pending invitations right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                {list.map(inv => <InvitationCard key={inv.id} invitation={inv} />)}
              </div>
            )
          ) : (
            <AcceptedInvitationsList invitations={list} emptyLabel={`No ${tab} invitations.`} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WhatAreInvitationsCard />
          <TipsCard />
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .inv-grid { grid-template-columns: 1fr !important; } }`}</style>
    </UserDashboardLayout>
  )
}