import { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CheckSquare, LayoutDashboard, CalendarDays, Users, Music2,
  Shield, Package, Radio, MessageSquare, Ticket, Trophy,
  Film, BarChart3, Sparkles, Settings, LogOut, ChevronRight,
  Menu, Mic2, GraduationCap, Heart, Star, Presentation,
  GitBranch, Network, ClipboardList, UserCheck, Wallet, ScanLine,
  PieChart,
} from 'lucide-react'
import { useAuth } from '../context/Authcontext'

export const PLAN_LIMITS = {
  starter:    { label: 'Starter',    color: '#64748B', events: 5,   performers: 50,   tickets: 50,    resources: 5   },
  growth:     { label: 'Growth',     color: '#22C55E', events: 25,  performers: 250,  tickets: 250,   resources: 25  },
  pro:        { label: 'Pro',        color: '#3B82F6', events: 125, performers: 1250, tickets: 99999, resources: 125 },
  enterprise: { label: 'Enterprise', color: '#8B5CF6', events: 999, performers: 9999, tickets: 99999, resources: 999 },
}

export const EVENT_TYPE_LABELS: Record<string, {
  performers: string
  songs: string
  submissions: string
  clash: string
  judging: string
  ticketing: string
  dashboardTitle: string
  icon: React.ReactNode
  color: string
}> = {
  choir:      { performers: 'Choirs',       songs: 'Songs',       submissions: 'Song Submissions',    clash: 'Clash Detection',  judging: 'Judging',           ticketing: 'Ticketing',    dashboardTitle: 'Choir Concert',      icon: <Music2 size={15} />,        color: '#22C55E' },
  talent:     { performers: 'Performers',   songs: 'Acts',        submissions: 'Act Submissions',     clash: 'Slot Conflicts',   judging: 'Judging & Scores',  ticketing: 'Ticketing',    dashboardTitle: 'Talent Show',        icon: <Star size={15} />,          color: '#F59E0B' },
  conference: { performers: 'Speakers',     songs: 'Sessions',    submissions: 'Session Submissions', clash: 'Topic Duplicates', judging: 'Programme',         ticketing: 'Registration', dashboardTitle: 'Conference',         icon: <Presentation size={15} />,  color: '#3B82F6' },
  competition:{ performers: 'Teams',        songs: 'Categories',  submissions: 'Entries',             clash: 'Rule Violations',  judging: 'Judging & Scoring', ticketing: 'Ticketing',    dashboardTitle: 'School Competition', icon: <Trophy size={15} />,        color: '#8B5CF6' },
  drama:      { performers: 'Cast',         songs: 'Dramas',      submissions: 'Drama Submissions',   clash: 'Stage Conflicts',  judging: 'Judging',           ticketing: 'Ticketing',    dashboardTitle: 'Drama / Theatre',    icon: <Star size={15} />,          color: '#EC4899' },
  worship:    { performers: 'Ministers',    songs: 'Song Sets',   submissions: 'Set Submissions',     clash: 'Song Clashes',     judging: 'Programme',         ticketing: 'Attendance',   dashboardTitle: 'Worship Night',      icon: <Heart size={15} />,         color: '#14B8A6' },
  openmic:    { performers: 'Performers',   songs: 'Acts',        submissions: 'Act Sign-ups',        clash: 'Slot Conflicts',   judging: 'Scoring',           ticketing: 'Ticketing',    dashboardTitle: 'Open Mic',           icon: <Mic2 size={15} />,          color: '#F97316' },
  graduation: { performers: 'Awardees',     songs: 'Awards',      submissions: 'Awardee Entries',     clash: 'Protocol Checks',  judging: 'Programme',         ticketing: 'Ticketing',    dashboardTitle: 'Award / Graduation', icon: <GraduationCap size={15} />, color: '#06B6D4' },
  network:    { performers: 'Registrants',  songs: 'Org Nodes',   submissions: 'Registrations',       clash: 'Conflicts',        judging: 'Analytics',         ticketing: 'Tickets',      dashboardTitle: 'Network Event',      icon: <GitBranch size={15} />,     color: '#6366F1' },
  custom:     { performers: 'Performers',   songs: 'Submissions', submissions: 'Submissions',         clash: 'Clash Detection',  judging: 'Judging',           ticketing: 'Ticketing',    dashboardTitle: 'Custom Event',       icon: <Sparkles size={15} />,      color: '#A78BFA' },
}

interface SidebarProps {
  eventId: string
  eventType: string
  enabledModules: string[] | null
  metaLoading?: boolean
  location: { pathname: string }
  onNavClick: () => void
  onSignOut: () => void
  user: { displayName?: string | null; email?: string | null } | null
}

function SidebarContent({ eventId, eventType, enabledModules, metaLoading, location, onNavClick, onSignOut, user }: SidebarProps) {
  const typeLabels = EVENT_TYPE_LABELS[eventType] ?? EVENT_TYPE_LABELS.custom
  const e = eventId ? `/manage/event/${eventId}` : ''
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Organizer'
  const isNetwork = eventType === 'network'

  const STANDARD_NAV_ITEMS: { icon: React.ReactNode; label: string; path: string; moduleId?: string }[] = [
    { icon: <Users size={18} />,         label: typeLabels.performers, path: `${e}/submissions`                             },
    { icon: <Music2 size={18} />,        label: typeLabels.songs,      path: `${e}/songs`,          moduleId: 'music'       },
    { icon: <Shield size={18} />,        label: typeLabels.clash,      path: `${e}/clashes`,        moduleId: 'clash'       },
    { icon: <Radio size={18} />,         label: 'Live Control',        path: `${e}/live`,           moduleId: 'live'        },
    { icon: <Package size={18} />,       label: 'Resources',           path: `${e}/resources`,      moduleId: 'resources'   },
    { icon: <Trophy size={18} />,        label: typeLabels.judging,    path: `${e}/judging`,        moduleId: 'judging'     },
    ...(!isNetwork ? [{ icon: <Ticket size={18} />, label: typeLabels.ticketing, path: `${e}/ticketing`, moduleId: 'ticketing' }] : []),
    { icon: <MessageSquare size={18} />, label: 'Messages',            path: `${e}/messages`,       moduleId: 'messaging'   },
    { icon: <Film size={18} />,          label: 'Media Hub',           path: `${e}/media`,          moduleId: 'media'       },
    { icon: <BarChart3 size={18} />,     label: 'Analytics',           path: `${e}/analytics`,      moduleId: 'analytics'   },
    { icon: <Sparkles size={18} />,      label: 'AI Insights',         path: `${e}/ai`                                      },
  ]

  const NETWORK_NAV_ITEMS: { icon: React.ReactNode; label: string; path: string; moduleId?: string }[] = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview',          path: `${e}/network/dashboard`                                        },
    { icon: <GitBranch size={18} />,       label: 'Org Builder',       path: `${e}/network/org-builder`,    moduleId: 'network-org'           },
    { icon: <ClipboardList size={18} />,   label: 'Reg. Form',         path: `${e}/network/reg-form`,       moduleId: 'network-registration'  },
    { icon: <Users size={18} />,           label: 'Registrations',     path: `${e}/network/registrations`,  moduleId: 'network-registration'  },
    { icon: <Wallet size={18} />,          label: 'Tickets',           path: `${e}/network/tickets`,        moduleId: 'network-checkin'       },
    { icon: <ScanLine size={18} />,        label: 'Check-in',          path: `${e}/network/checkin`,        moduleId: 'network-checkin'       },
    { icon: <PieChart size={18} />,        label: 'Analytics',         path: `${e}/network/analytics`,      moduleId: 'network-analytics'     },
    { icon: <UserCheck size={18} />,       label: 'Team',              path: `${e}/network/team`,           moduleId: 'network-checkin'       },
  ]

  const visibleStandardItems = eventId
    ? STANDARD_NAV_ITEMS.filter(item =>
        enabledModules === null ? true : !item.moduleId || enabledModules.includes(item.moduleId)
      )
    : []

  const visibleNetworkItems = eventId && isNetwork
    ? NETWORK_NAV_ITEMS.filter(item =>
        enabledModules === null ? true : !item.moduleId || enabledModules.includes(item.moduleId)
      )
    : []

  const navLink = (item: { icon: React.ReactNode; label: string; path: string }) => {
    const active = location.pathname === item.path
    return (
      <Link
        key={item.path}
        to={item.path}
        preventScrollReset
        onClick={onNavClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 8, textDecoration: 'none',
          color: active ? (isNetwork ? '#818CF8' : '#22C55E') : 'rgba(255,255,255,0.55)',
          background: active ? (isNetwork ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.1)') : 'transparent',
          fontSize: 14, fontWeight: active ? 600 : 400,
          fontFamily: 'var(--font-body)', marginBottom: 2,
          transition: 'all 0.15s',
          borderLeft: active ? `2px solid ${isNetwork ? '#818CF8' : '#22C55E'}` : '2px solid transparent',
        }}
        onMouseEnter={ev => { if (!active) { ev.currentTarget.style.background = 'rgba(255,255,255,0.05)'; ev.currentTarget.style.color = '#fff' } }}
        onMouseLeave={ev => { if (!active) { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = 'rgba(255,255,255,0.55)' } }}
      >
        {item.icon}
        <span>{item.label}</span>
        {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
      </Link>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#22C55E', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckSquare size={15} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff' }}>StageCheck</span>
        </Link>
      </div>

      {/* Event type badge */}
      {eventId && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `${typeLabels.color}12`, border: `1px solid ${typeLabels.color}25`,
            borderRadius: 8, padding: '8px 10px',
          }}>
            <span style={{ color: typeLabels.color, display: 'flex', alignItems: 'center' }}>{typeLabels.icon}</span>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 1 }}>Event Type</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: typeLabels.color, fontFamily: 'var(--font-display)' }}>
                {metaLoading ? '...' : typeLabels.dashboardTitle}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '12px 8px' }}>

        {/* MAIN */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>
            Main
          </div>
          {[
            { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/manage' },
            { icon: <CalendarDays size={18} />,    label: 'Events',    path: '/manage/events' },
          ].map(navLink)}
        </div>

        {/* NETWORK TOOLS */}
        {isNetwork && eventId && visibleNetworkItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase',
              padding: '0 8px', marginBottom: 6,
              color: 'rgba(129,140,248,0.5)',
            }}>
              Network Tools
            </div>
            {visibleNetworkItems.map(navLink)}
          </div>
        )}

        {/* EVENT TOOLS */}
        {eventId && visibleStandardItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>
              {isNetwork ? 'General Tools' : 'Event Tools'}
            </div>
            {visibleStandardItems.map(navLink)}
          </div>
        )}

        {!eventId && (
          <div style={{ margin: '8px 8px 0', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
              Select an event to see its tools and modules here.
            </div>
          </div>
        )}
      </nav>

      {/* Settings + user row */}
      <div style={{ padding: '12px 8px', flexShrink: 0 }}>
        <Link
          to="/manage/settings"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, textDecoration: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 14, fontFamily: 'var(--font-body)', marginBottom: 2, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
        >
          <Settings size={18} /> Settings
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 8, marginTop: 4, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0B1020', flexShrink: 0 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, display: 'flex', flexShrink: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Layout ──────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode
  plan?: keyof typeof PLAN_LIMITS
  eventType?: string
  eventId?: string
  enabledModules?: string[] | null
  metaLoading?: boolean
}

export default function DashboardLayout({
  children,
  plan = 'starter',
  eventType = 'custom',
  eventId = '',
  enabledModules = null,
  metaLoading = false,
}: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate('/')
  }, [signOut, navigate])

  const handleNavClick = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const sidebarProps: SidebarProps = {
    eventId,
    eventType: eventType ?? 'custom',
    enabledModules,
    metaLoading,
    location,
    onNavClick: handleNavClick,
    onSignOut: handleSignOut,
    user,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B1020' }}>

      <aside
        className="desktop-sidebar"
        style={{
          width: 240, flexShrink: 0,
          background: 'rgba(13,20,38,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 50,
          overflowY: 'auto',
        }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 260,
            background: 'rgba(13,20,38,0.99)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            overflowY: 'auto',
          }}>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      <main
        className="dashboard-main"
        style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <div
          className="mobile-topbar"
          style={{ display: 'none', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,20,38,0.95)', position: 'sticky', top: 0, zIndex: 40 }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
            <Menu size={22} />
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>StageCheck</span>
        </div>

        <div style={{ flex: 1, padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          {children}
        </div>

        <div style={{ padding: '1rem 2.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 20 }}>
          {['Privacy Policy', 'Terms of Service', 'Help'].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
            >{l}</a>
          ))}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .dashboard-main { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  )
}