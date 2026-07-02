// src/components/helpCenter/NewToStageCheck.tsx
import { RiRocketLine, RiArrowRightLine, RiPlayCircleLine } from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

export default function NewToStageCheck() {
  const ref = useScrollReveal()

  return (
    <section className="hc-new-section" ref={ref}>
      <style>{`
        .hc-new-section {
          padding: 0 clamp(20px, 5%, 80px) 0;
          max-width: 1280px; margin: 0 auto;
        }
        .hc-new-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          background: rgba(13,199,94,0.05);
          border: 1px solid rgba(13,199,94,0.15);
          border-radius: 20px;
          overflow: hidden;
          transition: border-color 0.3s;
        }
        .hc-new-card:hover { border-color: rgba(13,199,94,0.28); }
        .hc-new-left {
          padding: clamp(28px, 4%, 48px);
          display: flex; flex-direction: column; gap: 0;
        }
        .hc-new-icon-wrap {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(13,199,94,0.12);
          border: 1px solid rgba(13,199,94,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        .hc-new-title {
          font-family: 'Fraunces', serif; font-weight: 800;
          font-size: clamp(1.1rem, 2.2vw, 1.5rem);
          color: #fff; margin: 0 0 10px; line-height: 1.2;
        }
        .hc-new-desc {
          font-family: 'Inter', sans-serif; font-size: 13.5px;
          color: rgba(255,255,255,0.5); line-height: 1.65;
          margin: 0 0 24px; font-weight: 400;
        }
        .hc-new-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 11px; border: none;
          background: #0dc75e; color: #000;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: filter 0.2s, transform 0.2s;
          text-decoration: none; width: fit-content;
        }
        .hc-new-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .hc-new-right {
          position: relative; height: 220px; overflow: hidden;
        }
        .hc-new-img {
          width: 100%; height: 100%;
          object-fit: cover;
          background: rgba(255,255,255,0.04);
          display: block;
        }
        .hc-new-img-fallback {
          width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(13,199,94,0.08), rgba(6,13,26,0.9));
          display: flex; align-items: center; justify-content: center;
        }
        .hc-new-play {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(6,13,26,0.3);
          cursor: pointer; transition: background 0.2s;
        }
        .hc-new-play:hover { background: rgba(6,13,26,0.15); }
        .hc-new-play-btn {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(13,199,94,0.9);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, background 0.2s;
          box-shadow: 0 0 30px rgba(13,199,94,0.4);
        }
        .hc-new-play:hover .hc-new-play-btn { transform: scale(1.08); background: #0dc75e; }
        @media (max-width: 768px) {
          .hc-new-card { grid-template-columns: 1fr; }
          .hc-new-right { height: 180px; }
          .hc-new-left { padding: 28px 24px 24px; }
        }
      `}</style>

      <div className="hc-new-card hc-reveal">
        <div className="hc-new-left">
          <div className="hc-new-icon-wrap">
            <RiRocketLine size={22} color="#0dc75e" />
          </div>
          <h2 className="hc-new-title">New to StageCheck?</h2>
          <p className="hc-new-desc">
            Follow our getting started guide to create your first event in just a few minutes.
          </p>
          <a href="#" className="hc-new-btn">
            Start the Guide <RiArrowRightLine size={14} />
          </a>
        </div>
        <div className="hc-new-right">
          <div className="hc-new-img-fallback">
            <img
              src="/images/help-getting-started.jpg"
              alt="Getting started with StageCheck"
              className="hc-new-img"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="hc-new-play">
            <div className="hc-new-play-btn">
              <RiPlayCircleLine size={28} color="#000" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}