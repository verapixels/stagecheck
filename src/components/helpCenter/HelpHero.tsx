// src/components/helpCenter/HelpHero.tsx
import { useState } from 'react'
import { RiSearchLine, RiArrowRightLine } from 'react-icons/ri'

const POPULAR = ['Create an event', 'QR check-in', 'Payouts', 'Promo codes', 'Refunds']

export default function HelpHero() {
  const [query, setQuery] = useState('')

  return (
    <section className="hc-hero">
      <style>{`
        .hc-hero {
          position: relative;
          min-height: 380px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 80px clamp(20px, 5%, 80px) 60px;
        }
        .hc-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background: #060d1a;
        }
        .hc-hero-img {
          position: absolute; inset: 0; z-index: 1;
          background-image: url('/images/help-hero-crowd.jpg');
          background-size: cover; background-position: center top;
          opacity: 0.35;
        }
        .hc-hero-overlay {
          position: absolute; inset: 0; z-index: 2;
          background: linear-gradient(90deg, rgba(6,13,26,0.92) 40%, rgba(6,13,26,0.4) 100%);
        }
        .hc-hero-content {
          position: relative; z-index: 3;
          max-width: 520px;
          animation: hcFadeUp 0.7s ease both;
        }
        .hc-hero-eyebrow {
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #0dc75e; margin: 0 0 16px;
        }
        .hc-hero-title {
          font-family: 'Fraunces', serif;
          font-weight: 900;
          font-size: clamp(2rem, 5vw, 3.2rem);
          line-height: 1.1; letter-spacing: -1px;
          color: #fff; margin: 0 0 14px;
        }
        .hc-hero-title span { color: #0dc75e; font-style: italic; }
        .hc-hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: 14px; color: rgba(255,255,255,0.5);
          line-height: 1.6; margin: 0 0 28px; font-weight: 400;
        }
        .hc-search-wrap {
          position: relative; margin-bottom: 18px;
        }
        .hc-search-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.35); pointer-events: none;
        }
        .hc-search-input {
          width: 100%; box-sizing: border-box;
          padding: 14px 16px 14px 46px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-family: 'Inter', sans-serif; font-size: 14px;
          color: #fff; outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .hc-search-input::placeholder { color: rgba(255,255,255,0.35); }
        .hc-search-input:focus {
          border-color: rgba(13,199,94,0.5);
          background: rgba(255,255,255,0.09);
        }
        .hc-popular {
          display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
        }
        .hc-popular-label {
          font-family: 'Inter', sans-serif;
          font-size: 11.5px; color: rgba(255,255,255,0.4); font-weight: 500;
          flex-shrink: 0;
        }
        .hc-popular-tag {
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; padding: 4px 12px;
          cursor: pointer; transition: all 0.2s;
          text-decoration: none;
        }
        .hc-popular-tag:hover {
          background: rgba(13,199,94,0.1);
          border-color: rgba(13,199,94,0.3);
          color: #0dc75e;
        }
        /* floating decorations */
        .hc-deco {
          position: absolute; z-index: 3; pointer-events: none;
        }
        .hc-deco-ticket {
          right: clamp(60px, 15%, 220px); top: 15%;
          width: 80px; opacity: 0.7;
          animation: hcFloat 5s ease-in-out infinite;
        }
        .hc-deco-qr {
          right: clamp(20px, 8%, 120px); bottom: 15%;
          width: 70px; opacity: 0.6;
          animation: hcFloat 6s ease-in-out infinite 1s;
        }
        .hc-deco-chat {
          right: clamp(160px, 28%, 360px); top: 10%;
          opacity: 0.55;
          animation: hcFloat 7s ease-in-out infinite 0.5s;
        }
        @keyframes hcFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes hcFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .hc-hero { padding: 100px 20px 50px; min-height: 320px; }
          .hc-hero-overlay {
            background: linear-gradient(180deg, rgba(6,13,26,0.95) 60%, rgba(6,13,26,0.7) 100%);
          }
          .hc-deco-ticket, .hc-deco-qr, .hc-deco-chat { display: none; }
        }
      `}</style>

      <div className="hc-hero-bg" />
      <div className="hc-hero-img" />
      <div className="hc-hero-overlay" />

      {/* Floating decorative SVGs */}
      <div className="hc-deco hc-deco-chat">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <rect width="52" height="52" rx="14" fill="rgba(13,199,94,0.15)" stroke="rgba(13,199,94,0.3)" strokeWidth="1"/>
          <path d="M16 20h20M16 26h14M16 32h10" stroke="#0dc75e" strokeWidth="2" strokeLinecap="round"/>
          <path d="M38 36l4 6-6-2" stroke="#0dc75e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="hc-deco hc-deco-ticket">
        <svg width="80" height="44" viewBox="0 0 80 44" fill="none">
          <rect width="80" height="44" rx="8" fill="rgba(13,199,94,0.12)" stroke="rgba(13,199,94,0.3)" strokeWidth="1"/>
          <rect x="8" y="8" width="28" height="28" rx="4" fill="rgba(13,199,94,0.2)"/>
          <line x1="44" y1="14" x2="72" y2="14" stroke="rgba(13,199,94,0.5)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="44" y1="22" x2="66" y2="22" stroke="rgba(13,199,94,0.3)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="44" y1="30" x2="60" y2="30" stroke="rgba(13,199,94,0.3)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="hc-deco hc-deco-qr">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect width="70" height="70" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(13,199,94,0.25)" strokeWidth="1"/>
          <rect x="10" y="10" width="22" height="22" rx="3" fill="none" stroke="#0dc75e" strokeWidth="2"/>
          <rect x="38" y="10" width="22" height="22" rx="3" fill="none" stroke="#0dc75e" strokeWidth="2"/>
          <rect x="10" y="38" width="22" height="22" rx="3" fill="none" stroke="#0dc75e" strokeWidth="2"/>
          <rect x="15" y="15" width="12" height="12" rx="1" fill="#0dc75e" opacity="0.6"/>
          <rect x="43" y="15" width="12" height="12" rx="1" fill="#0dc75e" opacity="0.6"/>
          <rect x="15" y="43" width="12" height="12" rx="1" fill="#0dc75e" opacity="0.6"/>
          <rect x="38" y="38" width="6" height="6" rx="1" fill="#0dc75e" opacity="0.4"/>
          <rect x="46" y="38" width="6" height="6" rx="1" fill="#0dc75e" opacity="0.4"/>
          <rect x="54" y="38" width="6" height="6" rx="1" fill="#0dc75e" opacity="0.4"/>
          <rect x="38" y="46" width="6" height="6" rx="1" fill="#0dc75e" opacity="0.4"/>
          <rect x="54" y="54" width="6" height="6" rx="1" fill="#0dc75e" opacity="0.4"/>
        </svg>
      </div>

      <div className="hc-hero-content">
        <p className="hc-hero-eyebrow">Help Centre</p>
        <h1 className="hc-hero-title">
          How can we<br />help you <span>today?</span>
        </h1>
        <p className="hc-hero-sub">
          Find answers, explore guides, and get the support you need to create amazing events.
        </p>

        <div className="hc-search-wrap">
          <RiSearchLine size={18} className="hc-search-icon" />
          <input
            className="hc-search-input"
            type="text"
            placeholder="Search for articles, topics or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="hc-popular">
          <span className="hc-popular-label">Popular searches:</span>
          {POPULAR.map((tag) => (
            <a key={tag} href="#" className="hc-popular-tag">{tag}</a>
          ))}
        </div>
      </div>
    </section>
  )
}