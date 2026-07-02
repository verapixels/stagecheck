// src/pages/HowItWorksPage.tsx
import { Helmet } from 'react-helmet-async'
import { RiFlashlightLine } from 'react-icons/ri'
import SiteNavbar from '../components/Navbar'
import StepsSection from '../components/howItWorks/StepsSection'
import DashboardShowcase from '../components/howItWorks/DashboardShowcase'
import WhyOrganizers from '../components/howItWorks/WhyOrganizers'
import CTASection from '../components/howItWorks/CTASection'
import HiwFooter from '../components/howItWorks/Hiwfooter'

const PAGE_URL = 'https://stagecheck.com.ng/how-it-works'
const PAGE_TITLE = 'How StageCheck Works — Create, Sell & Check-in Tickets in Nigeria'
const PAGE_DESC =
  'See how StageCheck helps Nigerian event organizers create events, sell tickets, promote shows, check-in attendees with QR codes, and track real-time sales analytics — all in one platform.'

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How StageCheck Works',
  description: PAGE_DESC,
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Create Your Event', text: 'Add your event details, date, venue and upload eye-catching visuals.' },
    { '@type': 'HowToStep', position: 2, name: 'Create Tickets', text: 'Set up ticket types, pricing, quantities and customize buyer experience.' },
    { '@type': 'HowToStep', position: 3, name: 'Promote & Share', text: 'Share your event page, run promos and reach the right audience.' },
    { '@type': 'HowToStep', position: 4, name: 'Sell Tickets', text: 'Attendees buy tickets securely via the platform in just a few clicks.' },
    { '@type': 'HowToStep', position: 5, name: 'Check-in Attendees', text: 'Scan QR codes or enter ticket codes to check-in attendees instantly.' },
    { '@type': 'HowToStep', position: 6, name: 'Track & Analyze', text: 'Monitor sales, attendance, revenue and insights in real-time.' },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stagecheck.com.ng/' },
    { '@type': 'ListItem', position: 2, name: 'How It Works', item: PAGE_URL },
  ],
}

export default function HowItWorksPage() {
  return (
    <div className="hiw-page">
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content="https://stagecheck.com.ng/og-how-it-works.jpg" />
        <meta property="og:site_name" content="StageCheck" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESC} />
        <meta name="twitter:image" content="https://stagecheck.com.ng/og-how-it-works.jpg" />
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{`
        .hiw-page {
          background: #060d1a;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ── Hero ── */
        .hiw-hero {
          padding: calc(64px + 56px) clamp(16px, 4%, 48px) 52px;
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
        }
        .hiw-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 16px; border-radius: 999px;
          background: rgba(13,199,94,0.08);
          border: 1px solid rgba(13,199,94,0.22);
          color: #0dc75e;
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        .hiw-hero-title {
          font-family: 'Fraunces', serif;
          font-weight: 900;
          font-size: clamp(2.4rem, 6vw, 4rem);
          letter-spacing: -1.5px;
          line-height: 1.08;
          color: #fff;
          margin: 0 0 18px;
        }
        .hiw-hero-title span { color: #0dc75e; font-style: italic; }
        .hiw-hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: clamp(14px, 1.6vw, 17px);
          color: rgba(255,255,255,0.48);
          line-height: 1.65;
          max-width: 540px;
          margin: 0 auto 32px;
          font-weight: 400;
        }
        .hiw-hero-actions {
          display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;
        }
        .hiw-hero-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px; border-radius: 12px; border: none;
          background: #0dc75e; color: #000;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: filter .2s, transform .2s;
          text-decoration: none;
        }
        .hiw-hero-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .hiw-hero-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14); background: transparent;
          color: #fff; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: border-color .2s, background .2s;
          text-decoration: none;
        }
        .hiw-hero-btn-ghost:hover { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.04); }

        /* ── Divider ── */
        .hiw-section-divider {
          width: 100%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 0;
        }

        @media (max-width: 480px) {
          .hiw-hero { padding-top: calc(64px + 40px); }
          .hiw-hero-actions { flex-direction: column; width: 100%; padding: 0 24px; }
          .hiw-hero-btn-primary, .hiw-hero-btn-ghost { width: 100%; justify-content: center; }
        }
      `}</style>

      <SiteNavbar />

      {/* Hero */}
      <section className="hiw-hero">
        <span className="hiw-eyebrow">
          <RiFlashlightLine size={12} /> Simple setup. Powerful results.
        </span>
        <h1 className="hiw-hero-title">
          How <span>StageCheck</span> Works
        </h1>
        <p className="hiw-hero-sub">
          Everything you need to create, manage and grow successful events — from first ticket sold to final check-in.
        </p>
        <div className="hiw-hero-actions">
          <a href="/signup" className="hiw-hero-btn-primary">
            Create Your Event
          </a>
          <a href="/events" className="hiw-hero-btn-ghost">
            Browse Events
          </a>
        </div>
      </section>

      <div className="hiw-section-divider" />
      <StepsSection />
      <div className="hiw-section-divider" />
      <DashboardShowcase />
      <div className="hiw-section-divider" />
      <WhyOrganizers />
      <div className="hiw-section-divider" />
      <CTASection />
      <HiwFooter />
    </div>
  )
}