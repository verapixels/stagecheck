// src/components/helpCenter/HelpFooter.tsx
import { Link } from 'react-router-dom'
import {
  RiTwitterXLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiLinkedinLine,
  RiYoutubeLine,
  RiMailLine,
  RiPhoneLine,
} from 'react-icons/ri'

const COLS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Events', to: '/events' },
      { label: 'Attendees', to: '#' },
      { label: 'Check-In', to: '#' },
      { label: 'Analytics', to: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Resource Center', to: '#' },
      { label: 'Guides', to: '#' },
      { label: 'Templates', to: '#' },
      { label: 'Video Tutorials', to: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '#' },
      { label: 'Careers', to: '#' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
  {
    heading: 'Get in touch',
    isContact: true,
    links: [
      { label: 'support@stagecheck.com.ng', href: 'mailto:support@stagecheck.com.ng', icon: RiMailLine },
      { label: '+234 801 234 5678', href: 'tel:+2348012345678', icon: RiPhoneLine },
      { label: "We're available 24/7", href: '#', icon: null },
    ],
  },
]

const SOCIALS = [
  { Icon: RiTwitterXLine, href: '#', label: 'X' },
  { Icon: RiInstagramLine, href: '#', label: 'Instagram' },
  { Icon: RiFacebookCircleLine, href: '#', label: 'Facebook' },
  { Icon: RiLinkedinLine, href: '#', label: 'LinkedIn' },
  { Icon: RiYoutubeLine, href: '#', label: 'YouTube' },
]

export default function HelpFooter() {
  return (
    <footer className="hc-footer">
      <style>{`
        .hc-footer {
          background: rgba(4, 8, 18, 0.95);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 48px clamp(20px, 5%, 80px) 0;
        }
        .hc-footer-inner { max-width: 1280px; margin: 0 auto; }
        .hc-footer-top {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, 1fr);
          gap: 32px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .hc-footer-brand {}
        .hc-footer-logo {
          display: flex; align-items: center; gap: 9px;
          font-family: 'Fraunces', serif; font-weight: 800;
          font-size: 17px; color: #fff;
          text-decoration: none; margin-bottom: 12px;
        }
        .hc-footer-logo-dot {
          width: 26px; height: 26px; border-radius: 8px;
          background: #0dc75e;
          display: flex; align-items: center; justify-content: center;
        }
        .hc-footer-tagline {
          font-family: 'Inter', sans-serif; font-size: 12px;
          color: rgba(255,255,255,0.38); line-height: 1.65;
          margin: 0 0 18px; max-width: 200px; font-weight: 400;
        }
        .hc-footer-socials {
          display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
        }
        .hc-footer-social {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.45); text-decoration: none;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .hc-footer-social:hover {
          background: rgba(13,199,94,0.1);
          border-color: rgba(13,199,94,0.25);
          color: #0dc75e;
        }
        .hc-footer-col-head {
          font-family: 'Inter', sans-serif;
          font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.28); margin: 0 0 15px;
        }
        .hc-footer-col-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .hc-footer-col-list a, .hc-footer-contact-item {
          font-family: 'Inter', sans-serif; font-size: 12.5px;
          color: rgba(255,255,255,0.48); text-decoration: none;
          font-weight: 400; transition: color 0.2s;
          display: flex; align-items: center; gap: 7px;
        }
        .hc-footer-col-list a:hover, .hc-footer-contact-item:hover { color: rgba(255,255,255,0.8); }
        .hc-footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 0; flex-wrap: wrap; gap: 12px;
        }
        .hc-footer-copy {
          font-family: 'Inter', sans-serif; font-size: 11.5px;
          color: rgba(255,255,255,0.28); font-weight: 400;
        }
        .hc-footer-copy a { color: #0dc75e; text-decoration: none; }
        @media (max-width: 1024px) {
          .hc-footer-top { grid-template-columns: 1fr 1fr; }
          .hc-footer-brand { grid-column: 1 / -1; max-width: 320px; }
        }
        @media (max-width: 580px) {
          .hc-footer-top { grid-template-columns: 1fr 1fr; gap: 22px; }
          .hc-footer-brand { grid-column: 1 / -1; }
          .hc-footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="hc-footer-inner">
        <div className="hc-footer-top">
          <div className="hc-footer-brand">
            <Link to="/" className="hc-footer-logo">
              <div className="hc-footer-logo-dot">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L11 10H1L6 1Z" fill="white" />
                </svg>
              </div>
              StageCheck
            </Link>
            <p className="hc-footer-tagline">
              The all-in-one platform for discovering, creating and managing unforgettable events.
            </p>
            <div className="hc-footer-socials">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} className="hc-footer-social" aria-label={label} target="_blank" rel="noopener noreferrer">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.heading}>
              <p className="hc-footer-col-head">{col.heading}</p>
              {col.isContact ? (
                <ul className="hc-footer-col-list">
                  {(col.links as { label: string; href: string; icon: any }[]).map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="hc-footer-contact-item">
                        {item.icon && <item.icon size={12} color="#0dc75e" />}
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="hc-footer-col-list">
                  {(col.links as { label: string; to: string }[]).map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="hc-footer-bottom">
          <p className="hc-footer-copy">
            &copy; {new Date().getFullYear()} StageCheck by{' '}
            <a href="https://verapixels.com" target="_blank" rel="noopener noreferrer">Verapixels Technologies</a>.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}