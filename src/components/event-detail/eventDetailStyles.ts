// ─── EventDetail global CSS ───────────────────────────────────────────────────

export const ED_GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #060810;
    --bg2: #0a0e1a;
    --bg-card: #0d1220;
    --green: #0dc75e;
    --border: rgba(255,255,255,0.06);
    --text: #f0faf2;
    --text-secondary: rgba(255,255,255,0.72);
    --text-tertiary: rgba(255,255,255,0.45);
    --nav-h: 68px;
  }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.75); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInRight {
    from { transform: translateX(105%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroReveal {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--green);
    animation: pulse 1.4s infinite;
    display: inline-block; flex-shrink: 0;
  }
  input, textarea, select { -webkit-appearance: none; appearance: none; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

  /* ── Shared card shell */
  .ed-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: clamp(18px, 3vw, 26px);
    height: 100%;
  }

  /* ── Buttons */
  .btn-green {
    background: var(--green); color: #000; border: none;
    border-radius: 10px; padding: 13px 26px; font-size: 14px;
    font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Inter', sans-serif;
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
    box-shadow: 0 4px 20px rgba(13,199,94,0.25);
  }
  .btn-green:hover {
    background: #14d967;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(13,199,94,0.38);
  }
  .btn-green:active { transform: translateY(0); }

  /* ── Tag pill */
  .ed-tag-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 100px; padding: 6px 14px;
    font-size: 12px; font-weight: 500;
    color: var(--text-secondary); white-space: nowrap;
  }

  /* ── Section label */
  .ed-section-label {
    font-size: 11px; font-weight: 700; color: var(--green);
    letter-spacing: 0.1em; text-transform: uppercase;
    display: flex; align-items: center; gap: 7px;
    margin-bottom: 16px;
  }

  /* ── Icon box */
  .ed-icon-box {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(13,199,94,0.08);
    border: 1px solid rgba(13,199,94,0.15);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Artist card */
  .ed-artist-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
    cursor: default; text-align: center;
  }
  .ed-artist-card:hover {
    transform: translateY(-4px);
    border-color: rgba(13,199,94,0.25);
  }

  /* ── FAQ button */
  .ed-faq-btn {
    width: 100%; background: transparent; border: none;
    padding: 15px 18px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; cursor: pointer; text-align: left;
    transition: background 0.15s;
  }
  .ed-faq-btn:hover { background: rgba(255,255,255,0.03); }

  /* ── Related card */
  .ed-related-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s;
    flex-shrink: 0;
    width: 210px;
    min-width: 210px;
  }
  .ed-related-card:hover {
    border-color: rgba(13,199,94,0.28);
    transform: translateY(-3px);
  }

  /* Hide scrollbar on related row */
  .ed-related-scroll::-webkit-scrollbar { display: none; }
  .ed-related-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Schedule dot & line */
  .ed-sched-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--green);
    border: 2px solid rgba(13,199,94,0.3);
    flex-shrink: 0; margin-top: 5px;
  }
  .ed-sched-line {
    width: 1px; background: rgba(13,199,94,0.2);
    flex: 1; min-height: 20px;
    margin-top: 4px; margin-bottom: 4px;
  }

  /* ── Nav link */
  .ed-nav-link {
    font-size: 13px; color: rgba(255,255,255,0.6);
    text-decoration: none; font-weight: 500;
    transition: color 0.15s;
  }
  .ed-nav-link:hover { color: #fff; }

  /* ── Maps iframe */
  .ed-maps-iframe {
    width: 100%; height: 100%; border: 0;
    filter: invert(90%) hue-rotate(150deg) saturate(1.3) brightness(0.85);
  }

  /* ── Hero animations */
  .ed-hero-anim   { animation: heroReveal 0.7s cubic-bezier(.22,1,.36,1) both; }
  .ed-delay-1     { animation-delay: 0.05s; }
  .ed-delay-2     { animation-delay: 0.12s; }
  .ed-delay-3     { animation-delay: 0.22s; }
  .ed-delay-4     { animation-delay: 0.32s; }

  /* ── Responsive ───────────────────────────────────────────── */

  /* Tablet and below: stack hero/sidebar, collapse 2/3-col grids */
  @media (max-width: 960px) {
    .ed-hero-row    { flex-direction: column !important; }
    .ed-main-grid   { flex-direction: column !important; }
    .ed-sidebar     { width: 100% !important; position: static !important; top: auto !important; }
    .ed-three-col   { flex-direction: column !important; }
    .ed-two-col     { flex-direction: column !important; }
    .ed-three-col > div,
    .ed-two-col > div {
      flex: 1 1 100% !important;
      width: 100% !important;
    }
  }

  @media (max-width: 768px) {
    .ed-hero-title  { font-size: clamp(24px,7vw,42px) !important; }
    .ed-desktop     { display: none !important; }
    .ed-mobile      { display: block !important; }
  }
  @media (min-width: 769px) {
    .ed-mobile      { display: none !important; }
  }

  /* Small phones: tighten side padding everywhere */
  @media (max-width: 480px) {
    .ed-hero-row,
    .ed-main-grid {
      padding: 0 14px !important;
    }
  }
`