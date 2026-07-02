// src/components/helpCenter/StillNeedHelp.tsx
import {
  RiCheckLine,
  RiCustomerServiceLine,
  RiArrowRightLine,
  RiUserLine,
  RiCalendarLine,
} from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

export default function StillNeedHelp() {
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-help-section" ref={ref}>
      <style>{`
        .hc-help-section {
          padding: 0 clamp(20px, 5%, 80px) 64px;
          max-width: 1280px; margin: 0 auto;
        }
        .hc-help-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: stretch;
        }
        /* Left card: support photo + text */
        .hc-help-left {
          position: relative;
          border-radius: 20px; overflow: hidden;
          min-height: 300px;
          background: rgba(13,199,94,0.05);
          border: 1px solid rgba(13,199,94,0.15);
          display: flex; flex-direction: column; justify-content: flex-end;
        }
        .hc-help-left-img {
          position: absolute; inset: 0;
          background-image: url('/images/help-support-person.jpg');
          background-size: cover; background-position: center top;
          opacity: 0.5;
        }
        .hc-help-left-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 30%, rgba(6,13,26,0.92) 100%);
        }
        .hc-help-left-body {
          position: relative; z-index: 1;
          padding: 28px 28px 32px;
        }
        .hc-help-left-title {
          font-family: 'Fraunces', serif; font-weight: 800;
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          color: #fff; margin: 0 0 8px;
        }
        .hc-help-left-sub {
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.5); margin: 0 0 18px; font-weight: 400;
        }
        .hc-help-checklist {
          display: flex; flex-direction: column; gap: 9px; margin-bottom: 22px;
        }
        .hc-help-check-item {
          display: flex; align-items: center; gap: 9px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.75); font-weight: 400;
        }
        .hc-check-icon {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(13,199,94,0.15);
          border: 1px solid rgba(13,199,94,0.35);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .hc-help-contact-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 11px; border: none;
          background: #0dc75e; color: #000;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: filter 0.2s, transform 0.2s;
          text-decoration: none; width: fit-content;
        }
        .hc-help-contact-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        /* Right: two stacked cards */
        .hc-help-right {
          display: flex; flex-direction: column; gap: 14px;
        }
        .hc-help-card {
          flex: 1;
          border-radius: 18px; overflow: hidden;
          position: relative; min-height: 140px;
          display: flex; flex-direction: column; justify-content: flex-end;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.07);
          transition: border-color 0.25s, transform 0.2s;
        }
        .hc-help-card:hover {
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .hc-help-card-img {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          opacity: 0.4; transition: opacity 0.3s;
        }
        .hc-help-card:hover .hc-help-card-img { opacity: 0.55; }
        .hc-help-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 20%, rgba(6,13,26,0.88) 100%);
        }
        .hc-help-card-body {
          position: relative; z-index: 1; padding: 20px 22px;
          display: flex; align-items: flex-end; justify-content: space-between;
        }
        .hc-help-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(13,199,94,0.15); border: 1px solid rgba(13,199,94,0.25);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px; flex-shrink: 0;
        }
        .hc-help-card-text {}
        .hc-help-card-title {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 15px; color: #fff; margin: 0 0 4px;
        }
        .hc-help-card-sub {
          font-family: 'Inter', sans-serif; font-size: 12px;
          color: rgba(255,255,255,0.45); margin: 0; font-weight: 400;
        }
        .hc-help-card-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          color: #0dc75e; flex-shrink: 0; white-space: nowrap;
          transition: gap 0.2s;
        }
        .hc-help-card:hover .hc-help-card-link { gap: 8px; }
        @media (max-width: 768px) {
          .hc-help-grid { grid-template-columns: 1fr; }
          .hc-help-left { min-height: 260px; }
        }
      `}</style>

      <div className="hc-help-grid">
        {/* Left */}
        <div className="hc-help-left hc-reveal">
          <div className="hc-help-left-img" />
          <div className="hc-help-left-overlay" />
          <div className="hc-help-left-body">
            <h2 className="hc-help-left-title">Still need help?</h2>
            <p className="hc-help-left-sub">Our support team is here for you 24/7.</p>
            <div className="hc-help-checklist">
              {['Live chat with our team', 'Get help with complex events', 'Quick responses, real people'].map((item) => (
                <div key={item} className="hc-help-check-item">
                  <div className="hc-check-icon">
                    <RiCheckLine size={12} color="#0dc75e" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <a href="#" className="hc-help-contact-btn">
              <RiCustomerServiceLine size={15} /> Contact Support
            </a>
          </div>
        </div>

        {/* Right: two cards stacked */}
        <div className="hc-help-right">
          <a href="#" className="hc-help-card hc-reveal" style={{ '--delay': '100ms' } as React.CSSProperties}>
            <div className="hc-help-card-img" style={{ backgroundImage: "url('/images/help-talk-sales.jpg')" }} />
            <div className="hc-help-card-overlay" />
            <div className="hc-help-card-body">
              <div>
                <div className="hc-help-card-icon">
                  <RiUserLine size={18} color="#0dc75e" />
                </div>
                <div className="hc-help-card-text">
                  <h3 className="hc-help-card-title">Talk to Sales</h3>
                  <p className="hc-help-card-sub">Planning a large or complex event? Our team can help.</p>
                </div>
              </div>
              <span className="hc-help-card-link">Contact Sales <RiArrowRightLine size={13} /></span>
            </div>
          </a>

          <a href="#" className="hc-help-card hc-reveal" style={{ '--delay': '180ms' } as React.CSSProperties}>
            <div className="hc-help-card-img" style={{ backgroundImage: "url('/images/help-schedule-demo.jpg')" }} />
            <div className="hc-help-card-overlay" />
            <div className="hc-help-card-body">
              <div>
                <div className="hc-help-card-icon">
                  <RiCalendarLine size={18} color="#0dc75e" />
                </div>
                <div className="hc-help-card-text">
                  <h3 className="hc-help-card-title">Schedule a Demo</h3>
                  <p className="hc-help-card-sub">See how StageCheck can simplify your event management.</p>
                </div>
              </div>
              <span className="hc-help-card-link">Book a Demo <RiArrowRightLine size={13} /></span>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}