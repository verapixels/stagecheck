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

  const { tickets, loading: ticketsLoading }     = useUserTickets(user?.uid)
  const { savedEvents, loading: savedLoading }   = useUserSavedEvents(user?.uid)
  const { invitations, pending, loading: invitesLoading } = useUserInvitations(user?.uid, user?.email)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const upcomingEvents = tickets.filter(t => {
    if (!t.eventDate) return false
    return new Date(t.eventDate) >= now
  })

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <style>{`
        /* ── Header ──────────────────────────────────────────── */
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .dash-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-family: 'Syne', sans-serif;
          text-decoration: none;
          font-weight: 500;
          flex-shrink: 0;
          white-space: nowrap;
        }

        /* ── Main grid ───────────────────────────────────────── */
        .dash-main-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          margin-top: 24px;
        }

        /* ── Responsive ──────────────────────────────────────── */
        @media (max-width: 860px) {
          .dash-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 500px) {
          .dash-header {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .dash-edit-btn {
            /* On very small screens show as a compact pill */
            padding: 8px 14px;
            font-size: 12px;
          }
        }
      `}</style>

      {/* ── Header */}
      <div className="dash-header">
        <div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.3rem, 2.5vw, 2rem)',
            letterSpacing: '-0.5px',
            marginBottom: 4,
            color: '#fff',
            lineHeight: 1.2,
            margin: '0 0 4px',
          }}>
            Welcome back, {displayName}! 👋
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
            Here's what's happening with your events and tickets.
          </p>
        </div>

        <Link to="/profile" className="dash-edit-btn">
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
      <div className="dash-main-grid">
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
    </UserDashboardLayout>
  )
}