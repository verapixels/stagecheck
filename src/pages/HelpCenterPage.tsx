// src/pages/HelpCenterPage.tsx
import { Helmet } from 'react-helmet-async'
import SiteNavbar from '../components/Navbar'
import HelpHero from '../components/helpCenter/HelpHero'
import NewToStageCheck from '../components/helpCenter/NewToStageCheck'
import BrowseCategories from '../components/helpCenter/BrowseCategories'
import FeaturedGuides from '../components/helpCenter/FeaturedGuides'
import VideoTutorials from '../components/helpCenter/VideoTutorials'
import ResourcesTools from '../components/helpCenter/ResourcesTools'
import StillNeedHelp from '../components/helpCenter/StillNeedHelp'
import FAQAndCommunity from '../components/helpCenter/FAQAndCommunity'
import BottomCTA from '../components/helpCenter/BottomCTA'
import HelpFooter from '../components/helpCenter/HelpFooter'

const PAGE_TITLE = 'Help Centre — StageCheck Support & Guides'
const PAGE_DESC = 'Find answers, guides and support for creating and managing events on StageCheck. Browse categories, watch tutorials and get help from our team.'

export default function HelpCenterPage() {
  return (
    <div className="hc-page">
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <link rel="canonical" href="https://stagecheck.com.ng/help" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{`
        /* ─── Global tokens ─────────────────────────────────────── */
        .hc-page {
          background: #060d1a;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ─── Scroll reveal animation ───────────────────────────── */
        .hc-reveal-hidden {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
          transition-delay: var(--delay, 0ms);
        }
        .hc-reveal-visible {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.55s ease, transform 0.55s ease;
          transition-delay: var(--delay, 0ms);
        }

        /* ─── Shared section utilities ──────────────────────────── */
        .hc-section-title {
          font-family: 'Fraunces', serif;
          font-weight: 800;
          font-size: clamp(1.1rem, 2.2vw, 1.45rem);
          color: #fff;
          margin: 0;
        }
        .hc-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .hc-view-all {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #0dc75e; text-decoration: none;
          transition: gap 0.2s, opacity 0.2s;
          white-space: nowrap;
        }
        .hc-view-all:hover { gap: 8px; opacity: 0.85; }

        /* ─── Divider ───────────────────────────────────────────── */
        .hc-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin: 0 clamp(20px, 5%, 80px);
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ─── Reduced motion ────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .hc-reveal-hidden, .hc-reveal-visible {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <SiteNavbar />
      <HelpHero />
      <div style={{ padding: '40px 0 0' }}>
        <NewToStageCheck />
      </div>
      <BrowseCategories />
      <div className="hc-divider" />
      <FeaturedGuides />
      <div className="hc-divider" />
      <VideoTutorials />
      <div className="hc-divider" />
      <ResourcesTools />
      <div className="hc-divider" />
      <StillNeedHelp />
      <FAQAndCommunity />
      <div className="hc-divider" />
      <BottomCTA />
      <HelpFooter />
    </div>
  )
}