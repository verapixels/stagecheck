import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/Authcontext'
import ProtectedRoute from './components/Protectedroute'
import { useAuth } from './context/Authcontext'
import { EventProvider } from './context/Eventcontext'

// Landing
import LandingPage from './pages/Landing'

// Auth pages
import SignUp from './pages/Signup'
import Login from './pages/Login'

// Protected — main
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import EventDashboard from './pages/Eventdashboard'
import EventsPage from './pages/EventsPage'
import SettingsPage from './pages/SettingsPage'
import JoinPage from './pages/JoinPage'

// Public event detail
import EventDetailPage from './pages/Eventdetailpage'

// Public — all events
import AllEvents from './pages/AllEvents'

// Protected — event specific
import SubmissionsPage from './pages/event/SubmissionsPage'
import SongsPage from './pages/event/SongsPage'
import ClashesPage from './pages/event/ClashesPage'
import LiveControlPage from './pages/event/LiveControlPage'
import ResourcesPage from './pages/event/ResourcesPage'
import JudgingPage from './pages/event/JudgingPage'
import TicketingPage from './pages/event/TicketingPage'
import MessagesPage from './pages/event/MessagesPage'
import MediaPage from './pages/event/MediaPage'
import AnalyticsPage from './pages/event/AnalyticsPage'
import AIInsightsPage from './pages/event/AIInsightsPage'
import SubmitPage from './pages/SubmitPage'

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
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

  if (user) return <Navigate to="/dashboard" replace />
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
        <Routes>

          {/* ── PUBLIC ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<AllEvents />} />
          <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/join/:joinCode" element={<JoinPage />} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/submit/:eventSlug/:eventId" element={<SubmitPage />} />

          {/* ── PROTECTED — MAIN ── */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* ── PROTECTED — EVENT DASHBOARD ── */}
          <Route path="/dashboard/event/:eventId" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />

          {/* ── PROTECTED — EVENT SPECIFIC ── */}
          <Route path="/dashboard/event/:eventId/submissions" element={<EventRoute><SubmissionsPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/songs"        element={<EventRoute><SongsPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/clashes"      element={<EventRoute><ClashesPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/live"         element={<EventRoute><LiveControlPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/resources"    element={<EventRoute><ResourcesPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/judging"      element={<EventRoute><JudgingPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/ticketing"    element={<EventRoute><TicketingPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/messages"     element={<EventRoute><MessagesPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/media"        element={<EventRoute><MediaPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/analytics"    element={<EventRoute><AnalyticsPage /></EventRoute>} />
          <Route path="/dashboard/event/:eventId/ai"           element={<EventRoute><AIInsightsPage /></EventRoute>} />

          {/* ── CATCH ALL ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}