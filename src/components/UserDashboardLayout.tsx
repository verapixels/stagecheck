// src/components/UserDashboardLayout.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, Heart, Mail, CalendarDays,
  Settings, User, Wallet, HelpCircle, LogOut, X, Menu, Bell,
} from 'lucide-react'
import { useAuth } from '../context/Authcontext'

interface NavItem {
  label: string
  icon: ReactNode
  to?: string
  newTab?: boolean
  badge?: number
}

interface UserDashboardLayoutProps {
  children: ReactNode
  invitationCount?: number
}

export default function UserDashboardLayout({ children, invitationCount = 0 }: UserDashboardLayoutProps) {
  const navigate   = useNavigate()
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'
  const photoURL    = user?.photoURL ?? null

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const mainNav: NavItem[] = [
    { label: 'Dashboard',    icon: <LayoutDashboard size={17} />, to: '/dashboard' },
    { label: 'My Tickets',   icon: <Ticket size={17} />,          to: '/dashboard/tickets' },
    { label: 'Saved Events', icon: <Heart size={17} />,           to: '/dashboard/saved' },
    { label: 'Invitations',  icon: <Mail size={17} />,            to: '/dashboard/invitations', badge: invitationCount },
    { label: 'My Events',    icon: <CalendarDays size={17} />,    to: '/manage', newTab: true },
  ]

  const secondaryNav: NavItem[] = [
    { label: 'Become a Sub Admin', icon: <User size={17} />,      to: '/dashboard/settings' },
    { label: 'Profile',            icon: <User size={17} />,      to: '/dashboard/profile' },
    { label: 'Payment Methods',    icon: <Wallet size={17} />,    to: '/dashboard/payment-methods' },
    { label: 'Settings',           icon: <Settings size={17} />,  to: '/dashboard/settings' },
    { label: 'Help & Support',     icon: <HelpCircle size={17} />,to: '/dashboard/help' },
  ]

  // Bottom nav tabs (mobile only) — 4 items matching design
  const bottomTabs: NavItem[] = [
    { label: 'Home',       icon: <LayoutDashboard size={20} />, to: '/dashboard' },
    { label: 'My Tickets', icon: <Ticket size={20} />,          to: '/dashboard/tickets' },
    { label: 'Events',     icon: <CalendarDays size={20} />,    to: '/events' },
    { label: 'Profile',    icon: <User size={20} />,            to: '/dashboard/profile' },
  ]

  const handleNav = (item: NavItem) => {
    if (!item.to) return
    if (item.newTab) { window.open(item.to, '_blank', 'noopener,noreferrer'); return }
    navigate(item.to)
  }

  const sidebarItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
    color: active ? '#22C55E' : 'rgba(255,255,255,0.6)',
    border: 'none', cursor: 'pointer', fontSize: 14,
    fontWeight: active ? 600 : 400,
    fontFamily: 'Inter, sans-serif', textAlign: 'left',
    transition: 'background 0.15s, color 0.15s',
  })

  const isActive = (item: NavItem) => !item.newTab && pathname === item.to

  const Avatar = ({ size = 34 }: { size?: number }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#22C55E',
    }}>
      {photoURL
        ? <img src={photoURL} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : displayName[0]?.toUpperCase()}
    </div>
  )

  return (
    <>
      <style>{`
        /* ── Reset & base ── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Layout shell ── */
        .udl-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary, #060e1c);
        }

        /* ── Sidebar (desktop) ── */
        .udl-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255,255,255,0.07);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        /* ── Main area ── */
        .udl-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* ── Top bar ── */
        .udl-topbar {
          height: 60px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 3vw, 32px);
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--bg-primary, #060e1c);
        }

        .udl-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ── Hamburger (mobile only) ── */
        .udl-hamburger {
          display: none;
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          position: relative;
          z-index: 10;
        }
        .udl-hamburger:hover { background: rgba(255,255,255,0.07); }
        .udl-hamburger:active { background: rgba(255,255,255,0.12); }

        /* ── Mobile logo in topbar ── */
        .udl-mobile-logo {
          display: none;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        /* Bell icon */
        .udl-bell {
          position: relative;
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
        }
        .udl-bell:hover { background: rgba(255,255,255,0.07); }
        .udl-bell-badge {
          position: absolute;
          top: 4px; right: 4px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22C55E;
          border: 2px solid var(--bg-primary, #060e1c);
        }

        /* ── Page content ── */
        .udl-content {
          flex: 1;
          padding: clamp(20px, 3vw, 36px);
          padding-bottom: 100px; /* space for mobile bottom nav */
        }

        /* ── Mobile drawer overlay ── */
        .udl-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 100;
          backdrop-filter: blur(2px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s;
        }
        .udl-overlay.open {
          opacity: 1;
          pointer-events: all;
        }

        /* ── Mobile drawer panel ── */
        .udl-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 300px;
          max-width: 85vw;
          background: #0a1628;
          border-right: 1px solid rgba(255,255,255,0.08);
          z-index: 101;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.32,0,0.15,1);
          overflow-y: auto;
        }
        .udl-drawer.open {
          transform: translateX(0);
        }

        .udl-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 18px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .udl-drawer-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .udl-drawer-name {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          font-family: Inter, sans-serif;
        }

        .udl-drawer-email {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          font-family: Inter, sans-serif;
          margin-top: 1px;
        }

        .udl-drawer-close {
          background: rgba(255,255,255,0.06);
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .udl-drawer-close:hover { background: rgba(255,255,255,0.1); }

        .udl-drawer-nav {
          flex: 1;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .udl-drawer-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.25);
          font-family: Inter, sans-serif;
          padding: 10px 10px 4px;
          text-transform: uppercase;
        }

        .udl-drawer-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 12px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-family: Inter, sans-serif;
          text-align: left;
          transition: background 0.15s, color 0.15s;
          position: relative;
        }

        .udl-drawer-footer {
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        /* ── Upcoming events preview in drawer ── */
        .udl-drawer-upcoming {
          margin: 0 10px 8px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 14px;
        }
        .udl-drawer-upcoming-title {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          font-family: Inter, sans-serif;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── Bottom nav (mobile only) ── */
        .udl-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 72px;
          background: rgba(6,14,28,0.97);
          border-top: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(16px);
          z-index: 50;
          padding: 0 8px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          align-items: center;
          justify-content: space-around;
          display: none;
        }

        .udl-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          border-radius: 12px;
          border: none;
          background: none;
          cursor: pointer;
          transition: background 0.15s;
          min-width: 60px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .udl-tab-label {
          font-size: 10px;
          font-weight: 500;
          font-family: Inter, sans-serif;
        }
        .udl-tab.active .udl-tab-label { color: #22C55E; }
        .udl-tab:not(.active) .udl-tab-label { color: rgba(255,255,255,0.4); }
        .udl-tab.active svg { color: #22C55E; }
        .udl-tab:not(.active) svg { color: rgba(255,255,255,0.4); }
        .udl-tab.active {
          background: rgba(34,197,94,0.08);
        }

        /* ── RESPONSIVE BREAKPOINTS ── */
        @media (max-width: 900px) {
          .udl-sidebar     { display: none !important; }
          .udl-hamburger   { display: flex !important; }
          .udl-mobile-logo { display: flex !important; }
          .udl-bottom-nav  { display: flex !important; }
          .udl-content     { padding: 16px 16px 90px !important; }
          .udl-topbar      { padding: 0 16px !important; }
        }
      `}</style>

      <div className="udl-shell">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="udl-sidebar">
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 28, cursor: 'pointer' }}
          >
            <img src="/Stagechecklogo.png" alt="StageCheck" style={{ height: 26 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff' }}>
              StageCheck
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {mainNav.map(item => (
              <button key={item.label} style={sidebarItemStyle(isActive(item))} onClick={() => handleNav(item)}>
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {!!item.badge && item.badge > 0 && (
                  <span style={{
                    background: '#22C55E', color: '#0B1020', fontSize: 11, fontWeight: 700,
                    borderRadius: 999, minWidth: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  }}>{item.badge}</span>
                )}
              </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />

            {secondaryNav.map(item => (
              <button key={item.label} style={sidebarItemStyle(isActive(item))} onClick={() => handleNav(item)}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { signOut(); navigate('/') }}
            style={{ ...sidebarItemStyle(false), color: '#F87171' }}
          >
            <LogOut size={17} /> Log out
          </button>
        </aside>

        {/* ── MAIN AREA ── */}
        <div className="udl-main">

          {/* Top bar */}
          <header className="udl-topbar">
            {/* Left: hamburger + logo (mobile) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="udl-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                <Menu size={22} />
              </button>
              <div className="udl-mobile-logo" onClick={() => navigate('/')}>
                <img src="/Stagechecklogo.png" alt="StageCheck" style={{ height: 24 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff' }}>
                  StageCheck
                </span>
              </div>
            </div>

            {/* Right: bell + avatar */}
            <div className="udl-topbar-right">
              <button className="udl-bell" aria-label="Notifications">
                <Bell size={19} />
                {invitationCount > 0 && <span className="udl-bell-badge" />}
              </button>
              <Avatar size={34} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                {displayName}
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="udl-content">
            {children}
          </main>
        </div>

        {/* ── MOBILE DRAWER OVERLAY ── */}
        <div
          className={`udl-overlay ${drawerOpen ? 'open' : ''}`}
          onClick={() => setDrawerOpen(false)}
        />

        {/* ── MOBILE DRAWER ── */}
        <div className={`udl-drawer ${drawerOpen ? 'open' : ''}`}>

          {/* Header: profile */}
          <div className="udl-drawer-header">
            <div className="udl-drawer-profile">
              <Avatar size={44} />
              <div>
                <div className="udl-drawer-name">{displayName}</div>
                <div className="udl-drawer-email">{user?.email || ''}</div>
              </div>
            </div>
            <button className="udl-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X size={16} />
            </button>
          </div>

          {/* Nav items */}
          <nav className="udl-drawer-nav">
            <div className="udl-drawer-section-label">Menu</div>

            {mainNav.map(item => {
              const active = isActive(item)
              return (
                <button
                  key={item.label}
                  className="udl-drawer-item"
                  onClick={() => handleNav(item)}
                  style={{
                    background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
                    color: active ? '#22C55E' : 'rgba(255,255,255,0.75)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span style={{
                      background: '#22C55E', color: '#000', fontSize: 10, fontWeight: 700,
                      borderRadius: 999, minWidth: 18, height: 18, padding: '0 5px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{item.badge}</span>
                  )}
                </button>
              )
            })}

            <div className="udl-drawer-section-label" style={{ marginTop: 8 }}>Account</div>

            {secondaryNav.map(item => {
              const active = isActive(item)
              return (
                <button
                  key={item.label}
                  className="udl-drawer-item"
                  onClick={() => handleNav(item)}
                  style={{
                    background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
                    color: active ? '#22C55E' : 'rgba(255,255,255,0.6)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Footer: logout */}
          <div className="udl-drawer-footer">
            <button
              className="udl-drawer-item"
              onClick={() => { signOut(); navigate('/') }}
              style={{ color: '#F87171', background: 'rgba(248,113,113,0.06)', width: '100%' }}
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="udl-bottom-nav">
          {bottomTabs.map(tab => {
            const active = pathname === tab.to || (tab.to === '/dashboard' && pathname === '/dashboard')
            return (
              <button
                key={tab.label}
                className={`udl-tab ${active ? 'active' : ''}`}
                onClick={() => handleNav(tab)}
              >
                {tab.icon}
                <span className="udl-tab-label">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}