import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiClipboardLine,
  RiTicket2Line,
  RiPaintBrushLine,
  RiUploadCloud2Line,
  RiMegaphoneLine,
  RiQrScanLine,
  RiFileTextLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightLine,
} from "react-icons/ri";

// Single consistent accent — no more rainbow per-card colors
const ACCENT = "#0dc75e";

const STEPS = [
  {
    num: 1,
    icon: <RiClipboardLine size={28} />,
    title: "Event Details",
    short: "Add your event name, description, location, date and time.",
    detail: "Set your event title, pick the venue or go virtual, choose your date and time, and write a compelling description that gets people excited to attend.",
    img: "/images/step-event-details.jpg",
  },
  {
    num: 2,
    icon: <RiTicket2Line size={28} />,
    title: "Tickets & Pricing",
    short: "Create ticket types, set prices and manage availability.",
    detail: "Create multiple ticket tiers — free, paid, VIP. Set capacity limits, early-bird pricing, and open or close sales at any time.",
    img: "/images/step-tickets.jpg",
  },
  {
    num: 3,
    icon: <RiPaintBrushLine size={28} />,
    title: "Customize",
    short: "Add a banner, seating, FAQ and other event settings.",
    detail: "Upload a stunning event banner, configure seating plans, add FAQs, sponsor logos, and tailor the entire event page to match your brand.",
    img: "/images/step-customize.jpg",
  },
  {
    num: 4,
    icon: <RiUploadCloud2Line size={28} />,
    title: "Publish",
    short: "Review your event and publish when you're ready.",
    detail: "Preview exactly how attendees will see your event. Make any last tweaks, then hit publish to go live instantly.",
    img: "/images/step-publish.jpg",
  },
  {
    num: 5,
    icon: <RiMegaphoneLine size={28} />,
    title: "Promote",
    short: "Share your event and attract more attendees.",
    detail: "Share to social media, send email blasts, embed your event widget on any website, and track where your ticket sales are coming from.",
    img: "/images/step-promote.jpg",
  },
  {
    num: 6,
    icon: <RiQrScanLine size={28} />,
    title: "Check-In & Manage",
    short: "Use StageCheck tools to check-in and manage your event.",
    detail: "On the day, use our QR scanner app to check attendees in instantly. Monitor sales in real-time and manage your team from one dashboard.",
    img: "/images/step-checkin.jpg",
  },
];

function StepCard({ step, inView, delay }: { step: typeof STEPS[0]; inView: boolean; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className={`ce-step-card ${inView ? "ce-step-card-in" : ""}`}
      style={{ transitionDelay: `${delay}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image — lazy + async so 6 requests don't fire at once mid-animation */}
      <img
        src={step.img}
        alt={step.title}
        className="ce-step-bg-img"
        loading="lazy"
        decoding="async"
      />

      {/* Dark gradient over image always */}
      <div className="ce-step-base-overlay" />

      {/* Number badge — simple rounded chip, no more triangle */}
      <div className="ce-step-corner">
        <span>{step.num}</span>
      </div>

      {/* Default state content */}
      <div className={`ce-step-default ${hovered ? "ce-step-default-hidden" : ""}`}>
        <div className="ce-step-icon">
          {step.icon}
        </div>
        <h5>{step.title}</h5>
        <p>{step.short}</p>
      </div>

      {/* Hover reveal panel — slides up from bottom */}
      <div className={`ce-step-reveal ${hovered ? "ce-step-reveal-in" : ""}`}>
        <div className="ce-step-reveal-icon">
          {step.icon}
        </div>
        <h5>{step.title}</h5>
        <p>{step.detail}</p>
        <button
          className="ce-step-reveal-cta"
          onClick={() => navigate("/create-event/full-guide")}
        >
          Learn more <RiArrowRightLine size={13} />
        </button>
      </div>
    </div>
  );
}

export default function CreateEventSteps() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect(); // only needs to fire once
        }
      },
      // Fire slightly before the section is actually on screen so the
      // animation completes ahead of the user scrolling into it, instead
      // of visibly kicking off mid-scroll.
      { threshold: 0, rootMargin: "0px 0px -120px 0px" }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const scroll = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="ce-section" ref={sectionRef}>
      <div className="ce-tools-header">
        <div>
          <h2 className="ce-section-title">How to Create an Event 🎉</h2>
          <p className="ce-section-sub">Follow these steps to go live in minutes. Hover a card to explore each step.</p>
        </div>
        <div className="ce-steps-nav-arrows">
          <button onClick={() => scroll(-1)}><RiArrowLeftSLine size={18} /></button>
          <button onClick={() => scroll(1)}><RiArrowRightSLine size={18} /></button>
        </div>
      </div>

      <div className="ce-steps-track" ref={trackRef}>
        {STEPS.map((s, i) => (
          <StepCard key={s.num} step={s} inView={inView} delay={i * 0.08} />
        ))}
      </div>

      <div className="ce-steps-cta">
        <button className="ce-btn-outline" onClick={() => navigate("/create-event/full-guide")}>
          <RiFileTextLine size={15} /> View Full Guide
        </button>
      </div>
    </section>
  );
}