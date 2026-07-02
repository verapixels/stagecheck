// src/components/howItWorks/CTASection.tsx
import { useNavigate } from 'react-router-dom'
import { RiCalendarCheckLine, RiArrowRightLine, RiPhoneLine } from 'react-icons/ri'

export default function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="hiw-cta-section">
      <style>{`
        .hiw-cta-section {
          padding: 0 clamp(16px, 4%, 48px) 80px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hiw-cta-card {
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
          background: rgba(13,199,94,0.06);
          border: 1px solid rgba(13,199,94,0.18);
          border-radius: 20px;
          padding: 32px 36px;
          position: relative;
          overflow: hidden;
        }
        .hiw-cta-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(13,199,94,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .hiw-cta-left { display: flex; align-items: center; gap: 18px; }
        .hiw-cta-icon {
          width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
          background: rgba(13,199,94,0.14);
          border: 1px solid rgba(13,199,94,0.25);
          display: flex; align-items: center; justify-content: center;
        }
        .hiw-cta-title {
          font-family: 'Fraunces', serif;
          font-weight: 800;
          font-size: clamp(15px, 2vw, 19px);
          color: #fff;
          margin: 0 0 5px;
          line-height: 1.2;
        }
        .hiw-cta-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.48);
          margin: 0;
          font-weight: 400;
        }
        .hiw-cta-actions { display: flex; gap: 10px; flex-shrink: 0; }
        .hiw-cta-ghost-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 12px 20px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.15); background: transparent;
          color: #fff; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: border-color .2s, background .2s; white-space: nowrap;
        }
        .hiw-cta-ghost-btn:hover { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.05); }
        .hiw-cta-solid-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 12px 20px; border-radius: 11px; border: none;
          background: #0dc75e; color: #000;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: filter .2s, transform .2s; white-space: nowrap;
        }
        .hiw-cta-solid-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        @media (max-width: 700px) {
          .hiw-cta-card { padding: 24px 20px; gap: 20px; }
          .hiw-cta-left { gap: 14px; }
          .hiw-cta-actions { width: 100%; }
          .hiw-cta-ghost-btn, .hiw-cta-solid-btn { flex: 1; justify-content: center; }
        }
      `}</style>

      <div className="hiw-cta-card">
        <div className="hiw-cta-left">
          <div className="hiw-cta-icon">
            <RiCalendarCheckLine size={24} color="#0dc75e" />
          </div>
          <div>
            <h3 className="hiw-cta-title">Ready to create unforgettable experiences?</h3>
            <p className="hiw-cta-sub">Join thousands of event organizers who trust StageCheck.</p>
          </div>
        </div>
        <div className="hiw-cta-actions">
          <button className="hiw-cta-ghost-btn" onClick={() => navigate('/contact')}>
            <RiPhoneLine size={14} /> Book a Demo
          </button>
          <button className="hiw-cta-solid-btn" onClick={() => navigate('/signup')}>
            Create Your Event <RiArrowRightLine size={14} />
          </button>
        </div>
      </div>
    </section>
  )
}