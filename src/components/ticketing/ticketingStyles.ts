// ─── ticketingStyles.ts ────────────────────────────────────────────────────
// Global CSS injected once at the top of TicketingPage.
// Same design tokens as eventDetailStyles.ts (--bg, --green, etc.) so both
// pages feel like one continuous product, but with brighter foreground
// text per spec (no washed-out grays).

export const TK_GLOBAL_CSS = `
:root {
  --bg: #060e1c;
  --bg-soft: #0a1424;
  --card: #0c1830;
  --card-border: rgba(255,255,255,0.08);
  --green: #0dc75e;
  --green-soft: rgba(13,199,94,0.14);
  --text: #ffffff;
  --text-muted: #c4cbdb;      /* brighter than typical "faded gray" */
  --text-dim: #8b96ad;
  --red: #f87171;
  --gold: #f5c542;
  --pink: #ec4899;
}

* { box-sizing: border-box; }

.tk-page {
  background: var(--bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: var(--text);
}

.tk-fade-in { animation: tk-fade-in 0.5s ease both; }
@keyframes tk-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.tk-stagger > * { animation: tk-fade-in 0.45s ease both; }
.tk-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.tk-stagger > *:nth-child(2) { animation-delay: 0.08s; }
.tk-stagger > *:nth-child(3) { animation-delay: 0.14s; }
.tk-stagger > *:nth-child(4) { animation-delay: 0.2s; }

.tk-qty-btn {
  width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid var(--card-border);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; line-height: 1;
  transition: background 0.15s, border-color 0.15s;
}
.tk-qty-btn:hover { background: var(--green-soft); border-color: var(--green); }
.tk-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.tk-input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  outline: none;
}
.tk-input:focus { border-color: var(--green); }
.tk-input::placeholder { color: var(--text-dim); }

.tk-btn-primary {
  background: var(--green);
  border: none;
  color: #00210d;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Inter', sans-serif;
  transition: transform 0.15s, box-shadow 0.15s;
}
.tk-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(13,199,94,0.35); }
.tk-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.tk-btn-outline {
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text);
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.15s, background 0.15s;
}
.tk-btn-outline:hover { border-color: var(--green); background: var(--green-soft); }

@media (max-width: 900px) {
  .tk-grid { flex-direction: column !important; }
  .tk-sidebar { width: 100% !important; position: relative !important; top: 0 !important; }
}
`