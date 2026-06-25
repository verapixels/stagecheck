// src/pages/Dashboard.tsx
import { Link } from 'react-router-dom'
import UserDashboardLayout from '../components/UserDashboardLayout'
import { useAuth } from '../context/Authcontext'
import { useUserInvitations } from '../lib/useUserInvitations'
import StatsCards from '../components/dashboard/StatsCards'
import UpcomingEventsList from '../components/dashboard/UpcomingEventsList'
import PendingInvitationsList from '../components/dashboard/PendingInvitationsList'
import SavedEventsList from '../components/dashboard/SavedEventsList'
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel'
import { useUserTickets } from '../lib/useUserTickets'
import { useUserSavedEvents } from '../lib/useUserSavedEvents'

export default function Dashboard() {
  const { user } = useAuth()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there'

  const { tickets, loading: ticketsLoading } = useUserTickets(user?.uid)
  const { savedEvents, loading: savedLoading } = useUserSavedEvents(user?.uid)
  const { invitations, pending, loading: invitesLoading } = useUserInvitations(user?.uid, user?.email)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const upcomingEvents = tickets.filter(t => {
    if (!t.eventDate) return false
    const d = new Date(t.eventDate)
    return d >= now
  })

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* ── Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            letterSpacing: '-0.5px',
            marginBottom: 4,
            color: '#fff',
            lineHeight: 1.2,
          }}>
            Welcome back, {displayName}! 👋
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' }}>
            Here's what's happening with your events and tickets.
          </p>
        </div>

        <Link
          to="/profile"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.7)', fontSize: 13,
            fontFamily: 'Inter, sans-serif', textDecoration: 'none',
            fontWeight: 500, flexShrink: 0,
          }}
        >
          ✏️ Edit Profile
        </Link>
      </div>

      {/* ── Stats */}
      <StatsCards
        ticketsBought={tickets.length}
        savedCount={savedEvents.length}
        upcomingCount={upcomingEvents.length}
        invitationCount={invitations.length}
        loading={ticketsLoading || savedLoading || invitesLoading}
      />

      {/* ── Main grid */}
      <div
        className="dash-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 20,
          marginTop: 24,
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <UpcomingEventsList tickets={upcomingEvents} loading={ticketsLoading} />
          <SavedEventsList savedEvents={savedEvents} loading={savedLoading} />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PendingInvitationsList invitations={pending} loading={invitesLoading} />
          <QuickActionsPanel />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </UserDashboardLayout>
  )
}