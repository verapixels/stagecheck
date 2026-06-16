import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { auth } from '../../lib/firebase'
import {
  RiDashboardLine, RiCalendarEventLine, RiGroupLine,
  RiAlertLine, RiStarLine, RiBarChartLine,
  RiSettingsLine, RiLogoutBoxLine, RiMenuLine, RiCloseLine,
  RiShieldCheckLine, RiArrowLeftLine,
} from 'react-icons/ri'

const NAV = [
  { to: '/superadmin',            icon: <RiDashboardLine />,      label: 'Overview',      end: true },
  { to: '/superadmin/events',     icon: <RiCalendarEventLine />,  label: 'Events' },
  { to: '/superadmin/users',      icon: <RiGroupLine />,          label: 'Users' },
  { to: '/superadmin/reports',    icon: <RiAlertLine />,          label: 'Reports' },
  { to: '/superadmin/testimonials', icon: <RiStarLine />,         label: 'Testimonials' },
  { to: '/superadmin/analytics',  icon: <RiBarChartLine />,       label: 'Analytics' },
  { to: '/superadmin/settings',   icon: <RiSettingsLine />,       label: 'Settings' },
]

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await auth.signOut()
    navigate('/login')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #000612;
          --bg-card: #060e1c;
          --bg2:     #04091a;
          --green:   #0dc75e;
          --green-dim: rgba(13,199,94,0.10);
          --border:  rgba(255,255,255,0.07);
          --border-g: rgba(13,199,94,0.22);
          --text:    #f0faf2;
          --muted:   rgba(255,255,255,0.55);
          --muted2:  rgba(255,255,255,0.30);
          --red:     #f87171;
          --yellow:  #fbbf24;
          --blue:    #60a5fa;
          --purple:  #a78bfa;
          --sidebar-w: 220px;
          --sidebar-collapsed: 64px;
          --font-display: 'Syne', sans-serif;
          --font-body:    'DM Sans', sans-serif;
        }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:none } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }

        body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-body); }

        /* ── ADMIN SHELL ── */
        .admin-shell {
          display: flex; min-height: 100vh; background: var(--bg);
        }

        /* ── SIDEBAR ── */
        .admin-sidebar {
          width: var(--sidebar-w);
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
          transition: width .25s cubic-bezier(.16,1,.3,1);
          overflow: hidden;
        }
        .admin-sidebar.collapsed { width: var(--sidebar-collapsed); }

        .sb-top {
          padding: 18px 14px 14px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px;
          min-height: 64px; flex-shrink: 0;
        }
        .sb-logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--green); display: flex; align-items: center; justify-content: center;
          color: #000; font-size: 15px; font-weight: 800; flex-shrink: 0;
          font-family: var(--font-display);
        }
        .sb-logo-txt {
          font-family: var(--font-display); font-weight: 800; font-size: 14px;
          white-space: nowrap; overflow: hidden;
          transition: opacity .2s, width .2s;
        }
        .collapsed .sb-logo-txt { opacity: 0; width: 0; }

        .sb-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(13,199,94,.12); border: 1px solid rgba(13,199,94,.25);
          border-radius: 6px; padding: 2px 6px; font-size: 9px;
          font-weight: 700; color: var(--green); letter-spacing: .05em;
          white-space: nowrap; margin-left: auto; flex-shrink: 0;
          transition: opacity .2s;
        }
        .collapsed .sb-badge { opacity: 0; width: 0; overflow: hidden; padding: 0; border: none; }

        .sb-nav {
          flex: 1; padding: 12px 8px; overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column; gap: 2px;
        }
        .sb-nav::-webkit-scrollbar { width: 0; }

        .sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 10px;
          color: var(--muted); text-decoration: none;
          font-size: 13.5px; font-weight: 500; white-space: nowrap;
          transition: all .18s; border: 1px solid transparent;
          font-family: var(--font-body);
          overflow: hidden;
        }
        .sb-link:hover { color: var(--text); background: rgba(255,255,255,.04); }
        .sb-link.active {
          color: var(--green); background: var(--green-dim);
          border-color: var(--border-g);
        }
        .sb-link-icon {
          font-size: 17px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          width: 20px;
        }
        .sb-link-label {
          transition: opacity .2s; overflow: hidden;
        }
        .collapsed .sb-link-label { opacity: 0; width: 0; }

        .sb-bottom {
          padding: 10px 8px 16px; border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 2px;
        }
        .sb-collapse-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 10px;
          color: var(--muted2); background: none; border: none; cursor: pointer;
          font-size: 13px; width: 100%; white-space: nowrap; overflow: hidden;
          font-family: var(--font-body); transition: color .18s;
        }
        .sb-collapse-btn:hover { color: var(--text); }
        .sb-collapse-btn-icon { font-size: 17px; flex-shrink: 0; display: flex; align-items: center; transition: transform .25s; }
        .collapsed .sb-collapse-btn-icon { transform: rotate(180deg); }
        .sb-collapse-label { transition: opacity .2s; }
        .collapsed .sb-collapse-label { opacity: 0; width: 0; overflow: hidden; }

        .sb-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 10px; cursor: pointer;
          color: rgba(248,113,113,0.7); background: none; border: none;
          font-size: 13.5px; font-weight: 500; width: 100%; overflow: hidden;
          font-family: var(--font-body); transition: all .18s; white-space: nowrap;
        }
        .sb-logout:hover { color: var(--red); background: rgba(248,113,113,.06); }

        /* ── MAIN CONTENT ── */
        .admin-main {
          flex: 1;
          margin-left: var(--sidebar-w);
          transition: margin-left .25s cubic-bezier(.16,1,.3,1);
          min-height: 100vh;
          display: flex; flex-direction: column;
        }
        .admin-main.collapsed { margin-left: var(--sidebar-collapsed); }

        /* ── TOP BAR ── */
        .admin-topbar {
          height: 64px; background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(16px);
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-mob-btn {
          display: none; width: 36px; height: 36px; border-radius: 9px;
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          align-items: center; justify-content: center; cursor: pointer;
          color: var(--text); font-size: 16px;
        }
        .topbar-live {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--green); font-weight: 700; letter-spacing: .08em;
        }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 1.4s infinite; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .topbar-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, var(--green), #0a9444);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: 13px; color: #000;
          border: 2px solid rgba(13,199,94,.3); cursor: pointer;
        }

        /* ── PAGE CONTENT ── */
        .admin-page { padding: 28px; flex: 1; animation: fadeIn .3s ease; }

        /* ── SHARED COMPONENTS ── */
        .page-header { margin-bottom: 28px; }
        .page-title { font-family: var(--font-display); font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: var(--muted); }

        .card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
        }
        .card-pad { padding: 20px 24px; }
        .card-head {
          padding: 16px 24px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .card-title { font-family: var(--font-display); font-weight: 700; font-size: 14px; }

        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .stat-grid { grid-template-columns: 1fr; } }

        .stat-tile {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 14px; padding: 18px 20px;
          display: flex; flex-direction: column; gap: 10px;
          position: relative; overflow: hidden;
          transition: transform .2s, border-color .2s;
        }
        .stat-tile:hover { transform: translateY(-3px); border-color: var(--border-g); }
        .stat-tile::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--tc, var(--green)), transparent);
        }
        .stat-tile-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
          color: var(--tc, var(--green));
          background: color-mix(in srgb, var(--tc, var(--green)) 12%, transparent);
        }
        .stat-tile-val { font-family: var(--font-display); font-size: 30px; font-weight: 800; line-height: 1; }
        .stat-tile-lbl { font-size: 12px; color: var(--muted); font-weight: 500; }
        .stat-tile-delta { font-size: 11px; font-weight: 600; }

        /* Table */
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th {
          padding: 10px 16px; text-align: left; font-size: 11px;
          font-weight: 700; color: var(--muted2); letter-spacing: .08em;
          text-transform: uppercase; border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,.02);
        }
        .admin-table td {
          padding: 13px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,.04);
          vertical-align: middle;
        }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover td { background: rgba(255,255,255,.02); }

        /* Badges */
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700;
          letter-spacing: .04em;
        }
        .badge-green  { background: rgba(13,199,94,.12);  color: #0dc75e;  border: 1px solid rgba(13,199,94,.25); }
        .badge-red    { background: rgba(248,113,113,.12); color: #f87171;  border: 1px solid rgba(248,113,113,.25); }
        .badge-yellow { background: rgba(251,191,36,.12);  color: #fbbf24;  border: 1px solid rgba(251,191,36,.25); }
        .badge-blue   { background: rgba(96,165,250,.12);  color: #60a5fa;  border: 1px solid rgba(96,165,250,.25); }
        .badge-gray   { background: rgba(255,255,255,.07); color: var(--muted); border: 1px solid var(--border); }

        /* Buttons */
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; font-family: var(--font-body);
          transition: all .18s; white-space: nowrap;
        }
        .btn-primary { background: var(--green); color: #000; }
        .btn-primary:hover { background: #2fe070; box-shadow: 0 0 20px rgba(13,199,94,.3); }
        .btn-ghost-sm {
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          color: var(--text); padding: 6px 12px; font-size: 12px;
        }
        .btn-ghost-sm:hover { border-color: rgba(255,255,255,.18); }
        .btn-danger { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25); color: var(--red); padding: 6px 12px; font-size: 12px; }
        .btn-danger:hover { background: rgba(248,113,113,.2); }
        .btn-warn { background: rgba(251,191,36,.1); border: 1px solid rgba(251,191,36,.25); color: var(--yellow); padding: 6px 12px; font-size: 12px; }
        .btn-warn:hover { background: rgba(251,191,36,.2); }

        /* Search / Filter bar */
        .filter-bar {
          display: flex; align-items: center; gap: 10px; padding: 14px 24px;
          border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .search-input-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          border-radius: 9px; padding: 7px 12px; flex: 1; min-width: 200px;
          transition: border-color .2s;
        }
        .search-input-wrap:focus-within { border-color: rgba(13,199,94,.3); }
        .search-input-wrap input {
          background: none; border: none; outline: none;
          color: var(--text); font-size: 13px; font-family: var(--font-body); flex: 1;
        }
        .search-input-wrap input::placeholder { color: var(--muted2); }
        .filter-select {
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          border-radius: 9px; padding: 7px 12px; color: var(--text);
          font-size: 13px; font-family: var(--font-body); outline: none; cursor: pointer;
        }
        .filter-select option { background: #060e1c; }

        /* Empty state */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; padding: 56px 24px;
          color: var(--muted); font-size: 13px; text-align: center;
        }

        /* Modal backdrop */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.7);
          backdrop-filter: blur(8px); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fadeIn .2s ease;
        }
        .modal {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 20px; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          animation: scaleIn .2s cubic-bezier(.16,1,.3,1);
        }
        .modal-head {
          padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-title { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal-foot { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: .05em; text-transform: uppercase; }
        .form-input {
          background: rgba(255,255,255,.04); border: 1px solid var(--border);
          border-radius: 9px; padding: 10px 14px; color: var(--text);
          font-size: 13px; font-family: var(--font-body); outline: none;
          transition: border-color .2s; width: 100%;
        }
        .form-input:focus { border-color: rgba(13,199,94,.4); }
        .form-input::placeholder { color: var(--muted2); }
        textarea.form-input { resize: vertical; min-height: 80px; }

        /* Mobile overlay sidebar */
        .mob-sidebar-overlay {
          display: none; position: fixed; inset: 0; background: rgba(0,0,0,.7);
          z-index: 190; backdrop-filter: blur(4px);
        }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform .25s cubic-bezier(.16,1,.3,1), width .25s; }
          .admin-sidebar.mob-open { transform: translateX(0); width: var(--sidebar-w) !important; }
          .admin-main { margin-left: 0 !important; }
          .topbar-mob-btn { display: flex !important; }
          .mob-sidebar-overlay.open { display: block; }
          .admin-page { padding: 16px; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="admin-shell">
        {/* Mobile overlay */}
        <div
          className={`mob-sidebar-overlay ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mob-open' : ''}`}>
          <div className="sb-top">
            <div className="sb-logo-icon">SC</div>
            <span className="sb-logo-txt">StageCheck</span>
            <span className="sb-badge"><RiShieldCheckLine size={9} />SUPER</span>
          </div>

          <nav className="sb-nav">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="sb-link-icon">{n.icon}</span>
                <span className="sb-link-label">{n.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sb-bottom">
            <button className="sb-collapse-btn" onClick={() => setCollapsed(v => !v)}>
              <span className="sb-collapse-btn-icon"><RiArrowLeftLine size={16} /></span>
              <span className="sb-collapse-label">Collapse</span>
            </button>
            <button className="sb-logout" onClick={handleLogout}>
              <RiLogoutBoxLine size={17} style={{ flexShrink: 0 }} />
              <span style={{ transition: 'opacity .2s' }} className="sb-collapse-label">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className={`admin-main ${collapsed ? 'collapsed' : ''}`}>
          {/* Topbar */}
          <header className="admin-topbar">
            <div className="topbar-left">
              <button className="topbar-mob-btn" onClick={() => setMobileOpen(v => !v)}>
                {mobileOpen ? <RiCloseLine /> : <RiMenuLine />}
              </button>
              <div className="topbar-live">
                <span className="live-dot" /> CONTROL PANEL
              </div>
            </div>
            <div className="topbar-right">
              <div className="topbar-avatar">SA</div>
            </div>
          </header>

          {/* Page content via Outlet */}
          <div className="admin-page">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}