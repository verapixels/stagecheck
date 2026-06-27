import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/Authcontext'
import ProtectedRoute from './components/Protectedroute'
import { useAuth } from './context/Authcontext'
import { EventProvider } from './context/Eventcontext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './lib/firebase'

// Landing
import LandingPage from './pages/Landing'

// Auth pages
import SignUp from './pages/Signup'
import Login from './pages/Login'

// Protected — organizer / event management
import Onboarding from './pages/Onboarding'
import EventManagerHome from './pages/EventManagerHome'
import EventDashboard from './pages/Eventdashboard'
import EventsPage from './pages/EventsPage'
import SettingsPage from './pages/SettingsPage'

// Protected — user dashboard
import Dashboard from './pages/Dashboard'
import InvitationsPage from './pages/InvitationsPage'
import MyTickets from './pages/userMyTickets'
import SavedEvents from './pages/userSavedevents'
import UserSettings from './pages/userSettings'
import HelpSupport from './pages/userHelpsupport'
import PaymentMethods from './pages/userPaymentmethod'
import JoinPage from './pages/JoinPage'

// Public event detail
import EventDetailPage from './pages/Eventdetailpage'
import GetTicketsPage from './pages/GetTicketingPage'

// Public — all events
import AllEvents from './pages/AllEvents'

// Public — legal pages
import PrivacyPage from './pages/Privacypage'
import TermsPage from './pages/Termspage'
import RefundPage from './pages/Refundpage'

// Protected — event specific (organizer tools)
import SubmissionsPage from './pages/event/SubmissionsPage'
import SongsPage from './pages/event/SongsPage'
import ClashesPage from './pages/event/ClashesPage'
import LiveControlPage from './pages/event/LiveControlPage'
import ResourcesPage from './pages/event/ResourcesPage'
import JudgingPage from './pages/event/JudgingPage'
import TicketingPage from './pages/RegularTicket/RegularTicketAdmin'
import MessagesPage from './pages/event/MessagesPage'
import MediaPage from './pages/event/MediaPage'
import AnalyticsPage from './pages/event/AnalyticsPage'
import AIInsightsPage from './pages/event/AIInsightsPage'
import SubmitPage from './pages/SubmitPage'

// SuperAdmin
import SuperAdminRoute from './components/superadmin/Superadminroute'
import SuperAdminLayout from './components/superadmin/Superadminlayout'
import AdminOverview from './pages/adminOverview'
import AdminEvents from './pages/adminEvents'
import AdminUsers from './pages/adminUsers'
import AdminReports from './pages/adminReports'
import AdminTestimonials from './pages/adminTestimonials'
import AdminAnalytics from './pages/adminAnalytics'
import AdminSettingsPage from './pages/AdminSettingsPage'
import FeedbackPage from './pages/adminFeedbackPage'

// Cookie consent banner
import CookieBanner from './components/Cookiebanner'

// Network pages
import NetworkDashboardPage from './pages/NetworkDashboardPage'
import NetworkOrgBuilderPage from './pages/NetworkOrgBuilderPage'
import NetworkRegistrationFormPage from './pages/NetworkRegistrationFormPage'
import NetworkRegistrationsPage from './pages/NetworkRegistrationsPage'
import NetworkTicketManagementPage from './pages/NetworkTicketManagementPage'
import NetworkCheckinPage from './pages/NetworkCheckinPage'
import NetworkAnalyticsPage from './pages/NetworkAnalyticsPage'
import NetworkTeamPage from './pages/Networkteampage'
import PublicNetworkRegPage from './pages/PublicNetworkRegPage'
import AcceptInvitationPage from './pages/Acceptinvitationpage'
import PublicNetworkTicketPage from './pages/PublicNetworkTicketPage'

function ScrollRestorer() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [checking, setChecking]     = useState(false)
  const [role, setRole]             = useState<string | null>(null)
  const [roleFetched, setRoleFetched] = useState(false)

  useEffect(() => {
    if (!user) { setRoleFetched(false); return }
    setChecking(true)
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        setRole(snap.exists() ? (snap.data()?.role ?? 'user') : 'user')
        setRoleFetched(true)
        setChecking(false)
      })
      .catch(() => {
        setRole('user')
        setRoleFetched(true)
        setChecking(false)
      })
  }, [user])

  if (loading || checking || (user && !roleFetched)) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0B1020',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(34,197,94,0.2)',
          borderTop: '3px solid #22C55E',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'sans-serif' }}>
          Loading...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (user && roleFetched) {
    if (role === 'superadmin') return <Navigate to="/superadmin" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function EventRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <EventProvider>
        {children}
      </EventProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollRestorer />
        <Routes>

          {/* ── PUBLIC ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<AllEvents />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/join/:joinCode" element={<JoinPage />} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/event/:eventId/tickets" element={<GetTicketsPage />} />
          <Route path="/event/:eventId/network/tickets" element={<PublicNetworkTicketPage />} /> 
          <Route path="/submit/:eventSlug/:eventId" element={<SubmitPage />} />
          <Route path="/feedback/:tokenId" element={<FeedbackPage />} />
          <Route path="/register/:eventId" element={<PublicNetworkRegPage />} />

           {/* ── PROTECTED — USER DASHBOARD ── */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/invitations" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
          <Route path="/dashboard/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          <Route path="/dashboard/saved" element={<ProtectedRoute><SavedEvents /></ProtectedRoute>} />
          <Route path="/dashboard/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
          <Route path="/dashboard/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />

          {/* ── PROTECTED — EVENT MANAGEMENT (organizer) ── */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute><EventManagerHome /></ProtectedRoute>} />
          <Route path="/manage/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/manage/event/:eventId" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />

          {/* ── PROTECTED — EVENT SPECIFIC ── */}
          <Route path="/manage/event/:eventId/submissions" element={<EventRoute><SubmissionsPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/songs"        element={<EventRoute><SongsPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/clashes"      element={<EventRoute><ClashesPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/live"         element={<EventRoute><LiveControlPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/resources"    element={<EventRoute><ResourcesPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/judging"      element={<EventRoute><JudgingPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/ticketing"    element={<EventRoute><TicketingPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/messages"     element={<EventRoute><MessagesPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/media"        element={<EventRoute><MediaPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/analytics"    element={<EventRoute><AnalyticsPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/ai"           element={<EventRoute><AIInsightsPage /></EventRoute>} />

          {/* ── NETWORK EVENT ROUTES ── */}
          <Route path="/manage/event/:eventId/network/dashboard"      element={<EventRoute><NetworkDashboardPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/org-builder"    element={<EventRoute><NetworkOrgBuilderPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/reg-form"       element={<EventRoute><NetworkRegistrationFormPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/registrations"  element={<EventRoute><NetworkRegistrationsPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/tickets"        element={<EventRoute><NetworkTicketManagementPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/checkin"        element={<EventRoute><NetworkCheckinPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/analytics"      element={<EventRoute><NetworkAnalyticsPage /></EventRoute>} />
          <Route path="/manage/event/:eventId/network/team"           element={<EventRoute><NetworkTeamPage /></EventRoute>} />  {/* ← new */}

          {/* ── SUPERADMIN ── */}
          <Route element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
            <Route path="/superadmin" element={<AdminOverview />} />
            <Route path="/superadmin/events" element={<AdminEvents />} />
            <Route path="/superadmin/users" element={<AdminUsers />} />
            <Route path="/superadmin/reports" element={<AdminReports />} />
            <Route path="/superadmin/testimonials" element={<AdminTestimonials />} />
            <Route path="/superadmin/analytics" element={<AdminAnalytics />} />
            <Route path="/superadmin/settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="/accept-invitation/:invitationId" element={<AcceptInvitationPage />} />

          {/* ── CATCH ALL ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        <CookieBanner />

      </AuthProvider>
    </BrowserRouter>
  )
}