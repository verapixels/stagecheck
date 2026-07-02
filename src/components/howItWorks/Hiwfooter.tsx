// src/components/howItWorks/HiwFooter.tsx
import { Link } from 'react-router-dom'
import {
  RiTwitterXLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiLinkedinLine,
  RiMapPinLine,
  RiMailLine,
  RiPhoneLine,
} from 'react-icons/ri'

const NAV_LINKS = [
  {
    heading: 'Platform',
    links: [
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Events', to: '/events' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Why StageCheck', to: '/why-stagecheck' },
    ],
  },
  {
    heading: 'For Organizers',
    links: [
      { label: 'Create Event', to: '/onboarding' },
      { label: 'Ticketing', to: '/manage' },
      { label: 'Check-in', to: '/manage' },
      { label: 'Analytics', to: '/manage' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/' },
      { label: 'Blog', to: '/' },
      { label: 'Careers', to: '/' },
      { label: 'Contact', to: '/' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Refund Policy', to: '/refund' },
    ],
  },
]

const SOCIALS = [
  { icon: RiTwitterXLine, href: 'https://x.com/stagecheckng', label: 'X / Twitter' },
  { icon: RiInstagramLine, href: 'https://instagram.com/stagecheckng', label: 'Instagram' },
  { icon: RiFacebookCircleLine, href: 'https://facebook.com/stagecheckng', label: 'Facebook' },
  { icon: RiLinkedinLine, href: 'https://linkedin.com/company/stagecheck', label: 'LinkedIn' },
]

export default function HiwFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="hiw-footer">
      <style>{`
        .hiw-footer {
          background: #060d1a;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 60px clamp(16px, 4%, 48px) 0;
          max-width: 100%;
        }
        .hiw-footer-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .hiw-footer-top {
          display: grid;
          grid-template-columns: 1.5fr repeat(4, 1fr);
          gap: 40px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .hiw-footer-brand {}
        .hiw-footer-logo {
          display: flex; align-items: center; gap: 9px;
          font-family: 'Fraunces', serif; font-weight: 800;
          font-size: 18px; color: #fff;
          text-decoration: none;
          margin-bottom: 14px;
        }
        .hiw-footer-logo-icon {
          width: 28px; height: 28px; border-radius: 9px;
          background: #0dc75e;
          display: flex; align-items: center; justify-content: center;
        }
        .hiw-footer-tagline {
          font-family: 'Inter', sans-serif;
          font-size: 12.5px; line-height: 1.65;
          color: rgba(255,255,255,0.4);
          margin: 0 0 20px;
          max-width: 220px;
          font-weight: 400;
        }
        .hiw-footer-contact {
          display: flex; flex-direction: column; gap: 8px;
        }
        .hiw-footer-contact-item {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.4);
          font-weight: 400;
          text-decoration: none;
        }
        .hiw-footer-contact-item:hover { color: rgba(255,255,255,0.7); }
        .hiw-footer-nav-col {}
        .hiw-footer-nav-heading {
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin: 0 0 16px;
        }
        .hiw-footer-nav-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 11px;
        }
        .hiw-footer-nav-list a {
          font-family: 'Inter', sans-serif;
          font-size: 13px; color: rgba(255,255,255,0.5);
          text-decoration: none; font-weight: 400;
          transition: color .2s;
        }
        .hiw-footer-nav-list a:hover { color: #fff; }
        .hiw-footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 0;
          flex-wrap: wrap; gap: 16px;
        }
        .hiw-footer-copy {
          font-family: 'Inter', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.3);
          font-weight: 400;
        }
        .hiw-footer-copy a { color: #0dc75e; text-decoration: none; }
        .hiw-footer-socials {
          display: flex; align-items: center; gap: 8px;
        }
        .hiw-footer-social-btn {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: background .2s, color .2s, border-color .2s;
        }
        .hiw-footer-social-btn:hover {
          background: rgba(13,199,94,0.1);
          border-color: rgba(13,199,94,0.25);
          color: #0dc75e;
        }
        .hiw-footer-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 999px; padding: 5px 12px;
        }
        .hiw-footer-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #0dc75e;
          box-shadow: 0 0 6px #0dc75e;
          animation: footerBlink 2s ease-in-out infinite;
        }
        @keyframes footerBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 1024px) {
          .hiw-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
          .hiw-footer-brand { grid-column: 1 / -1; max-width: 340px; }
        }
        @media (max-width: 600px) {
          .hiw-footer-top { grid-template-columns: 1fr 1fr; gap: 24px; }
          .hiw-footer-brand { grid-column: 1 / -1; }
          .hiw-footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="hiw-footer-inner">
        <div className="hiw-footer-top">
          {/* Brand */}
          <div className="hiw-footer-brand">
            <Link to="/" className="hiw-footer-logo">
              <div className="hiw-footer-logo-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 12H1L7 1Z" fill="white" />
                </svg>
              </div>
              StageCheck
            </Link>
            <p className="hiw-footer-tagline">
              The all-in-one event management and ticketing platform built for Nigerian event organizers.
            </p>
            <div className="hiw-footer-contact">
              <a href="mailto:hello@stagecheck.com.ng" className="hiw-footer-contact-item">
                <RiMailLine size={13} color="#0dc75e" />
                hello@stagecheck.com.ng
              </a>
              <a href="tel:+2348000000000" className="hiw-footer-contact-item">
                <RiPhoneLine size={13} color="#0dc75e" />
                +234 800 000 0000
              </a>
              <span className="hiw-footer-contact-item">
                <RiMapPinLine size={13} color="#0dc75e" />
                Lagos, Nigeria
              </span>
            </div>
          </div>

          {/* Nav columns */}
          {NAV_LINKS.map((col) => (
            <div className="hiw-footer-nav-col" key={col.heading}>
              <p className="hiw-footer-nav-heading">{col.heading}</p>
              <ul className="hiw-footer-nav-list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="hiw-footer-bottom">
          <p className="hiw-footer-copy">
            &copy; {year} <a href="https://verapixels.com" target="_blank" rel="noopener noreferrer">Verapixels Technologies</a>. All rights reserved.
          </p>
          <span className="hiw-footer-badge">
            <span className="hiw-footer-badge-dot" />
            All systems operational
          </span>
          <div className="hiw-footer-socials">
            {SOCIALS.map((s) => {
              const Icon = s.icon
              return (
                <a
                  key={s.label}
                  href={s.href}
                  className="hiw-footer-social-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  <Icon size={15} />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}