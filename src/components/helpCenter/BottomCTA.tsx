// src/components/helpCenter/BottomCTA.tsx
import { RiArrowRightLine, RiUserVoiceLine } from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

export default function BottomCTA() {
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-bottom-cta" ref={ref}>
      <style>{`
        .hc-bottom-cta {
          margin: 0 clamp(20px, 5%, 80px) 64px;
          max-width: calc(1280px - clamp(40px, 10%, 160px));
          margin-left: auto; margin-right: auto;
        }
        .hc-bottom-cta-card {
          position: relative;
          border-radius: 22px; overflow: hidden;
          min-height: 200px;
          display: flex; align-items: center;
          padding: clamp(36px, 5%, 56px) clamp(28px, 5%, 60px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .hc-bottom-cta-bg {
          position: absolute; inset: 0;
          background-image: url('/images/help-bottom-cta-crowd.jpg');
          background-size: cover; background-position: center;
          opacity: 0.3;
        }
        .hc-bottom-cta-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(6,13,26,0.88) 50%, rgba(6,13,26,0.5) 100%);
        }
        .hc-bottom-cta-green {
          position: absolute; bottom: -60px; left: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(13,199,94,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hc-bottom-cta-body {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap; width: 100%;
        }
        .hc-bottom-cta-text {}
        .hc-bottom-cta-sub {
          font-family: 'Inter', sans-serif; font-size: 13px;
          color: rgba(255,255,255,0.48); margin: 0 0 10px; font-weight: 400;
        }
        .hc-bottom-cta-title {
          font-family: 'Fraunces', serif; font-weight: 900;
          font-size: clamp(1.2rem, 2.8vw, 1.8rem);
          color: #fff; margin: 0; line-height: 1.15;
        }
        .hc-bottom-cta-actions {
          display: flex; gap: 12px; flex-shrink: 0; flex-wrap: wrap;
        }
        .hc-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px; border-radius: 12px; border: none;
          background: #0dc75e; color: #000;
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 700;
          cursor: pointer; transition: filter 0.2s, transform 0.2s;
          text-decoration: none; white-space: nowrap;
        }
        .hc-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .hc-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.18); background: transparent;
          color: #fff; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          text-decoration: none; white-space: nowrap;
        }
        .hc-btn-ghost:hover {
          border-color: rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.05);
        }
        @media (max-width: 640px) {
          .hc-bottom-cta-body { flex-direction: column; align-items: flex-start; }
          .hc-bottom-cta-actions { width: 100%; }
          .hc-btn-primary, .hc-btn-ghost { flex: 1; justify-content: center; }
        }
      `}</style>

      <div className="hc-bottom-cta-card hc-reveal">
        <div className="hc-bottom-cta-bg" />
        <div className="hc-bottom-cta-overlay" />
        <div className="hc-bottom-cta-green" />
        <div className="hc-bottom-cta-body">
          <div className="hc-bottom-cta-text">
            <p className="hc-bottom-cta-sub">Join thousands of organizers who trust StageCheck.</p>
            <h2 className="hc-bottom-cta-title">Ready to create your next<br />unforgettable event?</h2>
          </div>
          <div className="hc-bottom-cta-actions">
            <a href="/onboarding" className="hc-btn-primary">
              Create an Event <RiArrowRightLine size={15} />
            </a>
            <a href="#" className="hc-btn-ghost">
              <RiUserVoiceLine size={15} /> Talk to an Expert
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}