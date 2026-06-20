// src/components/landing/ImpactSection.tsx
//
// Replaces the old ugly "Impact by the numbers" grid. Stat cards now show
// ONLY an icon mark in a soft glass disc — no number, no border, no color-
// keyed outline. The number + label live underneath as plain text, so the
// card itself stays quiet and the typography does the talking.
// Testimonial carousel keeps your auto-scroll behavior but is restyled to
// feel like a single editorial pull-quote rather than a SaaS widget.

import { useCallback, useEffect, useRef, useState } from 'react'
import { RiCalendarEventLine, RiFlashlightLine, RiTicketLine, RiSparklingLine, RiArrowLeftSLine, RiArrowRightSLine, RiDoubleQuotesL } from 'react-icons/ri'

export interface ImpactStat { icon: React.ReactNode; value: string; label: string }
export interface Testimonial { id: string; quote: string; name: string; role: string; avatar?: string }

const DEFAULT_STATS: ImpactStat[] = [
  { icon: <RiCalendarEventLine />, value: '10+', label: 'Events managed' },
  { icon: <RiFlashlightLine />, value: '1K+', label: 'Performers registered' },
  { icon: <RiTicketLine />, value: '1K+', label: 'Tickets issued' },
  { icon: <RiSparklingLine />, value: '98%', label: 'Customer satisfaction' },
]

export default function ImpactSection({
  stats = DEFAULT_STATS, testimonials,
}: { stats?: ImpactStat[]; testimonials: Testimonial[] }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((n: number) => {
    if (fading) return
    setFading(true)
    setTimeout(() => { setIdx(n); setFading(false) }, 320)
  }, [fading])

  useEffect(() => {
    if (testimonials.length <= 1) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 5500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [testimonials.length])

  const manualNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current)
    fn()
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 5500)
  }

  const t = testimonials[idx]
  const initials = t?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || ''

  return (
    <>
      <style>{`
        .stg-impact { padding: clamp(56px,8vw,100px) clamp(16px,5%,80px); background: linear-gradient(180deg,var(--bg) 0%, #010810 100%); }
        .stg-impact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        @media (max-width: 860px) { .stg-impact-grid { grid-template-columns: 1fr !important; gap: 44px !important; } }

        .stg-impact-eyebrow { font-family: var(--font-display); font-style: italic; color: var(--green); font-size: 14px; }
        .stg-impact-h2 { font-family: var(--font-display); font-weight: 700; font-size: clamp(24px,3vw,34px); margin: 8px 0 32px; }

        .stg-stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px 20px; }
        .stg-stat { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
        .stg-stat-disc {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(13,199,94,0.08);
          display: flex; align-items: center; justify-content: center;
          color: var(--green); font-size: 22px;
        }
        .stg-stat-val { font-family: var(--font-display); font-weight: 700; font-size: clamp(26px,3vw,34px); }
        .stg-stat-lbl { font-size: 12.5px; color: rgba(255,255,255,0.6); }

        /* Editorial pull-quote testimonial */
        .stg-quote-card { position: relative; padding: 8px 8px 0 36px; }
        .stg-quote-mark { color: var(--green); opacity: .25; font-size: 32px; margin-bottom: 14px; }
        .stg-quote-txt {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(18px, 2.2vw, 24px); line-height: 1.45; color: var(--text);
          transition: opacity .32s ease, transform .32s ease;
        }
        .stg-quote-txt.fading { opacity: 0; transform: translateY(6px); }
        .stg-quote-auth { display: flex; align-items: center; gap: 12px; margin-top: 26px; }
        .stg-q-av { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .stg-q-av-fallback {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: rgba(13,199,94,0.15); color: var(--green);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 700; font-size: 14px;
        }
        .stg-q-name { font-weight: 600; font-size: 13.5px; font-family: var(--font-body); }
        .stg-q-role { font-size: 12px; color: rgba(255,255,255,0.55); }
        .stg-quote-nav { display: flex; align-items: center; gap: 10px; margin-top: 22px; }
        .stg-q-circ { width: 32px; height: 32px; border-radius: 50%; background: none; border: 1px solid var(--border); color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .2s, color .2s; }
        .stg-q-circ:hover { border-color: var(--border-g); color: var(--green); }
        .stg-q-dots { display: flex; gap: 5px; }
        .stg-q-dot { height: 5px; border-radius: 4px; background: rgba(255,255,255,0.15); cursor: pointer; transition: all .3s; }
        .stg-q-dot.active { width: 18px; background: var(--green); }
        .stg-q-dot:not(.active) { width: 5px; }
      `}</style>

      <section className="stg-impact">
        <div className="stg-impact-grid">
          <div>
            <span className="stg-impact-eyebrow">A quiet kind of proof</span>
            <h2 className="stg-impact-h2">Numbers that come from real nights, not projections.</h2>
            <div className="stg-stat-grid">
              {stats.map(s => (
                <div key={s.label} className="stg-stat">
                  <div className="stg-stat-disc">{s.icon}</div>
                  <div>
                    <div className="stg-stat-val">{s.value}</div>
                    <div className="stg-stat-lbl">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {t && (
            <div className="stg-quote-card">
              <RiDoubleQuotesL className="stg-quote-mark" />
              <p className={`stg-quote-txt ${fading ? 'fading' : ''}`}>{t.quote}</p>
              <div className="stg-quote-auth">
                {t.avatar
                  ? <img src={t.avatar} alt={t.name} className="stg-q-av" />
                  : <div className="stg-q-av-fallback">{initials}</div>}
                <div>
                  <div className="stg-q-name">{t.name}</div>
                  <div className="stg-q-role">{t.role}</div>
                </div>
              </div>
              <div className="stg-quote-nav">
                <button className="stg-q-circ" onClick={() => manualNav(() => goTo((idx - 1 + testimonials.length) % testimonials.length))}><RiArrowLeftSLine size={16} /></button>
                <div className="stg-q-dots">
                  {testimonials.map((_, i) => (
                    <div key={i} className={`stg-q-dot ${i === idx ? 'active' : ''}`} onClick={() => manualNav(() => goTo(i))} />
                  ))}
                </div>
                <button className="stg-q-circ" onClick={() => manualNav(() => goTo((idx + 1) % testimonials.length))}><RiArrowRightSLine size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}