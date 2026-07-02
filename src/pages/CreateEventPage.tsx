import { Helmet } from "react-helmet-async";
import SiteNavbar from "../components/Navbar";
import CreateEventHero from "../components/publiccreateevents/CreateEventHero";
import CreateEventGuideBanner from "../components/publiccreateevents/CreateEventGuideBanner";
import CreateEventHelpCards from "../components/publiccreateevents/CreateEventHelpCards";
import CreateEventSteps from "../components/publiccreateevents/CreateEventSteps";
import CreateEventToolsResources from "../components/publiccreateevents/CreateEventToolsResources";
import CreateEventTalkToSales from "../components/publiccreateevents/CreateEventTalkToSales";
import CreateEventSupportStrip from "../components/publiccreateevents/CreateEventSupportStrip";
import "../components/publiccreateevents/createEvent.css";
import footer from '../components/Publicfooter'
import PublicFooter from "../components/Publicfooter";

const APP_URL = "https://stagecheck.com.ng";
const PAGE_URL = `${APP_URL}/create-event`;
const OG_IMAGE = `${APP_URL}/images/og-create-event.jpg`; // add a 1200x630 jpg for sharing previews

// JSON-LD structured data — helps Google understand this is a HowTo / Service page
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": PAGE_URL,
      "url": PAGE_URL,
      "name": "Create an Event | StageCheck",
      "description": "Create and manage events on StageCheck — Nigeria's all-in-one event ticketing and management platform. Set up tickets, promote your event, and check in attendees effortlessly.",
      "inLanguage": "en",
      "isPartOf": { "@id": APP_URL },
      "publisher": {
        "@type": "Organization",
        "name": "StageCheck",
        "url": APP_URL,
        "logo": { "@type": "ImageObject", "url": `${APP_URL}/logo.png` },
        "sameAs": [
          "https://instagram.com/stagecheckapp",
          "https://twitter.com/stagecheckapp",
          "https://facebook.com/stagecheckapp",
        ],
      },
    },
    {
      "@type": "HowTo",
      "name": "How to Create an Event on StageCheck",
      "description": "Follow these 6 steps to create and publish your event on StageCheck in minutes.",
      "totalTime": "PT10M",
      "step": [
        { "@type": "HowToStep", "position": 1, "name": "Event Details", "text": "Add your event name, description, location, date and time." },
        { "@type": "HowToStep", "position": 2, "name": "Tickets & Pricing", "text": "Create ticket types, set prices and manage availability." },
        { "@type": "HowToStep", "position": 3, "name": "Customize", "text": "Add a banner, seating, FAQ and other event settings." },
        { "@type": "HowToStep", "position": 4, "name": "Publish", "text": "Review your event and publish when you're ready." },
        { "@type": "HowToStep", "position": 5, "name": "Promote", "text": "Share your event and attract more attendees." },
        { "@type": "HowToStep", "position": 6, "name": "Check-In & Manage", "text": "Use StageCheck tools to check in and manage your event on the day." },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is StageCheck free to use for event organizers?",
          "acceptedAnswer": { "@type": "Answer", "text": "StageCheck offers a free plan for basic events. Paid plans unlock advanced features like custom branding, analytics, and priority support." },
        },
        {
          "@type": "Question",
          "name": "How long does it take to create an event on StageCheck?",
          "acceptedAnswer": { "@type": "Answer", "text": "Most organizers publish their first event in under 10 minutes using StageCheck's step-by-step event builder." },
        },
        {
          "@type": "Question",
          "name": "Can I sell tickets on StageCheck?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. StageCheck supports paid and free tickets, multiple ticket tiers, early-bird pricing, and Paystack-powered payments." },
        },
      ],
    },
  ],
};

export default function CreateEventPage() {
  return (
    <>
      <Helmet>
        {/* ── Primary ── */}
        <title>Create an Event | StageCheck — Nigeria's Event Management Platform</title>
        <meta
          name="description"
          content="Create, manage and sell tickets for your event with StageCheck. Nigeria's all-in-one platform for concerts, conferences, festivals and private events. Get started free."
        />
        <meta
          name="keywords"
          content="create event Nigeria, event management platform Nigeria, sell tickets online Nigeria, event ticketing Lagos, StageCheck, how to create an event"
        />
        <link rel="canonical" href={PAGE_URL} />

        {/* ── Open Graph (Facebook, WhatsApp, LinkedIn) ── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:site_name" content="StageCheck" />
        <meta property="og:title" content="Create an Event | StageCheck" />
        <meta
          property="og:description"
          content="From setup to sell-out, StageCheck gives you everything you need to create, manage and grow events people love. Join 10,000+ organizers in Nigeria."
        />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_NG" />

        {/* ── Twitter Card ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@stagecheckapp" />
        <meta name="twitter:title" content="Create an Event | StageCheck" />
        <meta
          name="twitter:description"
          content="Nigeria's all-in-one event ticketing platform. Create, promote and manage your event in minutes."
        />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* ── Robots / Indexing ── */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        {/* ── JSON-LD Structured Data ── */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <SiteNavbar />

      <main className="ce-page">
        <CreateEventHero />
        <div className="ce-wrap">
          <CreateEventGuideBanner />
        </div>
        <CreateEventHelpCards />
        <CreateEventSteps />
        <CreateEventToolsResources />
        <CreateEventTalkToSales />
        <CreateEventSupportStrip />
        <PublicFooter />
      </main>
    </>
  );
}