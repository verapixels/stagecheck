// src/components/Hero.tsx
//
// Public landing page hero. Receives its event data and stats as props
// from LandingPage.tsx — it does not fetch anything itself. Styling uses
// plain CSS scoped to "hero-*" classes and reads the design tokens
// (--green, --bg, --font-display, etc.) defined globally in LandingPage's
// <style> block, with safe fallbacks so this still renders correctly if
// used on its own.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiChevronDown,
  FiStar,
} from 'react-icons/fi'
import { FaTicket, FaShieldHalved, FaHeadset } from 'react-icons/fa6'

export interface HeroEvent {
  slug: string
  title: string
  bannerImage: string
  categoryLabel: string
  dateMonth: string
  dateDay: string
  dateWeekday: string
  dateFull: string
  time: string
  location: string
  attendees: number
  attendeeAvatars: string[]
}

interface HeroStat {
  icon: IconType
  value: string
  label: string
  sub: string
}

export const DEFAULT_HERO_STATS: HeroStat[] = [
  { icon: FaTicket, value: '10,000+', label: 'Tickets Sold', sub: 'On StageCheck' },
  { icon: FiCalendar, value: '500+', label: 'Events Hosted', sub: 'Across Nigeria' },
  { icon: FaShieldHalved, value: '99.9%', label: 'Platform Uptime', sub: 'Always Reliable' },
  { icon: FaHeadset, value: '24/7', label: 'Support', sub: "We're Here" },
]

interface HeroSectionProps {
  events: HeroEvent[]
  stats?: HeroStat[]
}

export default function HeroSection({ events, stats = DEFAULT_HERO_STATS }: HeroSectionProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const total = events.length

  const goPrev = () => total && setCurrentIndex((i) => (i - 1 + total) % total)
  const goNext = () => total && setCurrentIndex((i) => (i + 1) % total)

  // auto-advance every 5s — pauses on hover, restarts whenever the
  // index changes so a manual click doesn't get immediately overridden
  useEffect(() => {
    if (total <= 1 || isPaused) return
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % total)
    }, 5000)
    return () => clearInterval(id)
  }, [total, isPaused, currentIndex])

  // shortest signed distance from currentIndex on a circular track
  const getOffset = (index: number) => {
    if (!total) return 0
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return diff
  }

  return (
    <section className="hero">
      <style>{`
        .hero { position: relative; width: 100%; overflow: hidden; background: var(--bg, #000612); padding: 88px 24px 96px; }
        .hero-glow { pointer-events: none; position: absolute; left: 50%; top: 300px; width: 900px; height: 420px; transform: translateX(-50%); border-radius: 999px; background: var(--green-dim, rgba(13,199,94,0.12)); filter: blur(120px); }
        .hero-inner { position: relative; max-width: 1180px; margin: 0 auto; }

        .hero-eyebrow-row { display: flex; justify-content: center; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 7px 18px; border-radius: 999px; border: 1px solid var(--border-g, rgba(13,199,94,0.3)); background: var(--green-dim, rgba(13,199,94,0.1)); color: var(--green, #0dc75e); font-family: var(--font-body, 'Inter', sans-serif); font-size: 12px; font-weight: 600; letter-spacing: .03em; cursor: pointer; }
        .hero-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green, #0dc75e); }

        .hero-title { margin-top: 32px; text-align: center; font-family: var(--font-display, 'Fraunces', serif); font-weight: 600; font-size: 56px; line-height: 1.1; color: var(--text, #f0faf2); }
        .hero-title-accent { font-style: italic; color: var(--green, #0dc75e); }

        .hero-subtitle { max-width: 560px; margin: 24px auto 0; text-align: center; font-family: var(--font-body, 'Inter', sans-serif); font-size: 15px; line-height: 1.6; color: var(--muted, rgba(255,255,255,0.72)); }

        .hero-carousel { position: relative; margin-top: 64px; height: 420px; }
        .hero-nav { position: absolute; top: 50%; z-index: 30; width: 44px; height: 44px; transform: translateY(-50%); display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border-g, rgba(13,199,94,0.3)); background: transparent; color: var(--green, #0dc75e); cursor: pointer; transition: background .2s ease; }
        .hero-nav:hover { background: var(--green-dim, rgba(13,199,94,0.1)); }
        .hero-nav-left { left: 0; }
        .hero-nav-right { right: 0; }

        .hero-track { position: relative; margin: 0 auto; max-width: 760px; height: 100%; }
        .hero-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .hero-empty-text { font-family: var(--font-body, 'Inter', sans-serif); font-size: 14px; color: var(--muted2, rgba(255,255,255,0.45)); }

        .hero-card-wrap { position: absolute; left: 50%; top: 50%; width: 300px; transition: transform .5s ease, opacity .5s ease; }
        .hero-card { position: relative; width: 100%; height: 380px; overflow: hidden; border-radius: 24px; border: 1px solid var(--border-g, rgba(13,199,94,0.2)); background: var(--bg-card, #060e1c); }
        .hero-card-center { box-shadow: 0 0 70px rgba(13,199,94,0.18); }
        .hero-card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .hero-card-fade { position: absolute; inset: 0; background: linear-gradient(to top, #000 0%, rgba(0,0,0,.4) 55%, rgba(0,0,0,.1) 100%); }

        .hero-badge-featured { position: absolute; left: 16px; top: 16px; z-index: 2; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: rgba(13,199,94,0.18); color: var(--green, #0dc75e); font-family: var(--font-body, 'Inter', sans-serif); font-size: 11px; font-weight: 700; letter-spacing: .03em; backdrop-filter: blur(6px); }
        .hero-date-chip { position: absolute; right: 16px; top: 16px; z-index: 2; width: 56px; padding: 8px 0; display: flex; flex-direction: column; align-items: center; border-radius: 14px; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); }
        .hero-date-month { font-family: var(--font-body, 'Inter', sans-serif); font-size: 10px; font-weight: 700; color: var(--green, #0dc75e); }
        .hero-date-day { font-family: var(--font-body, 'Inter', sans-serif); font-size: 20px; font-weight: 700; color: var(--text, #f0faf2); }
        .hero-date-weekday { font-family: var(--font-body, 'Inter', sans-serif); font-size: 10px; color: var(--muted2, rgba(255,255,255,.45)); }

        .hero-card-body { position: absolute; left: 0; right: 0; bottom: 0; padding: 20px; z-index: 2; }
        .hero-card-category { font-family: var(--font-body, 'Inter', sans-serif); font-size: 11px; font-weight: 700; letter-spacing: .04em; color: var(--green, #0dc75e); }
        .hero-card-title { margin-top: 4px; font-family: var(--font-display, 'Fraunces', serif); color: var(--text, #f0faf2); font-size: 16px; font-weight: 500; }
        .hero-card-center .hero-card-title { font-size: 24px; font-weight: 600; }

        .hero-card-meta { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 16px; }
        .hero-card-meta-item { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-body, 'Inter', sans-serif); font-size: 12px; color: var(--muted, rgba(255,255,255,.72)); }
        .hero-card-meta-item svg { color: var(--green, #0dc75e); flex-shrink: 0; }

        .hero-card-footer { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .hero-attendees { display: flex; align-items: center; gap: 8px; }
        .hero-avatars { display: flex; }
        .hero-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 2px solid var(--bg-card, #060e1c); margin-left: -8px; }
        .hero-avatar:first-child { margin-left: 0; }
        .hero-attendees-count { font-family: var(--font-body, 'Inter', sans-serif); font-size: 12px; color: var(--muted2, rgba(255,255,255,.45)); }

        .hero-card-date-small { margin-top: 4px; display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-body, 'Inter', sans-serif); font-size: 11px; color: var(--muted2, rgba(255,255,255,.45)); }

        .hero-pill { display: inline-flex; align-items: center; gap: 10px; padding: 6px 6px 6px 18px; border-radius: 999px; border: 1px solid var(--border, rgba(255,255,255,.18)); background: transparent; color: var(--text, #f0faf2); font-family: var(--font-body, 'Inter', sans-serif); font-size: 13px; font-weight: 600; cursor: pointer; transition: border-color .25s, background .25s; white-space: nowrap; }
        .hero-pill-solid { background: var(--green, #0dc75e); border-color: var(--green, #0dc75e); color: #000; }
        .hero-pill-arrow { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #000; color: var(--green, #0dc75e); flex-shrink: 0; transition: transform .25s; }
        .hero-pill-solid:hover .hero-pill-arrow { transform: rotate(45deg); }

        .hero-dots { margin-top: 32px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .hero-dot { height: 6px; width: 6px; border-radius: 999px; background: var(--muted2, rgba(255,255,255,.3)); border: none; cursor: pointer; transition: all .25s; padding: 0; }
        .hero-dot.is-active { width: 20px; background: var(--green, #0dc75e); }

        .hero-stats { margin: 56px auto 0; max-width: 1024px; display: grid; grid-template-columns: repeat(4, 1fr); border-radius: 18px; border: 1px solid var(--border, rgba(255,255,255,.08)); background: rgba(255,255,255,.02); overflow: hidden; }
        .hero-stat { display: flex; align-items: center; gap: 14px; padding: 24px; border-right: 1px solid var(--border, rgba(255,255,255,.08)); }
        .hero-stat:last-child { border-right: none; }
        .hero-stat-icon { flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--green-dim, rgba(13,199,94,.1)); color: var(--green, #0dc75e); }
        .hero-stat-value { font-family: var(--font-display, 'Fraunces', serif); font-size: 22px; font-weight: 700; color: var(--green, #0dc75e); }
        .hero-stat-label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 14px; font-weight: 600; color: var(--text, #f0faf2); }
        .hero-stat-sub { font-family: var(--font-body, 'Inter', sans-serif); font-size: 12px; color: var(--muted2, rgba(255,255,255,.45)); }

        @media (max-width: 720px) {
          .hero { padding: 64px 16px 64px; }
          .hero-title { font-size: 36px; }
          .hero-carousel { height: 340px; }
          .hero-card-wrap { width: 240px; }
          .hero-card { height: 300px; }
          .hero-nav { display: none; }
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
          .hero-stat { border-right: 1px solid var(--border, rgba(255,255,255,.08)); border-bottom: 1px solid var(--border, rgba(255,255,255,.08)); }
          .hero-stat:nth-child(2n) { border-right: none; }
          .hero-stat:nth-child(n+3) { border-bottom: none; }
        }
      `}</style>

      <div className="hero-glow" />

      <div className="hero-inner">
        <div className="hero-eyebrow-row">
          <button type="button" className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            FIND IT. RUN IT. REMEMBER IT.
            <FiChevronDown size={14} />
          </button>
        </div>

        <h1 className="hero-title">
          Discover &amp; run events
          <br />
          that feel <span className="hero-title-accent">unforgettable.</span>
        </h1>

        <p className="hero-subtitle">
          From concerts to conferences, worship to workshops.
          <br />
          Everything you need to discover, create and manage amazing events.
        </p>

        <div
          className="hero-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {total > 1 && (
            <>
              <button type="button" aria-label="Previous event" className="hero-nav hero-nav-left" onClick={goPrev}>
                <FiArrowLeft size={16} />
              </button>
              <button type="button" aria-label="Next event" className="hero-nav hero-nav-right" onClick={goNext}>
                <FiArrowRight size={16} />
              </button>
            </>
          )}

          <div className="hero-track">
            {total === 0 && (
              <div className="hero-empty">
                <span className="hero-empty-text">No events to show yet</span>
              </div>
            )}

            {events.map((event, index) => {
              const offset = getOffset(index)
              if (Math.abs(offset) > 2) return null

              const isCenter = offset === 0
              const distance = Math.abs(offset)
              const scale = isCenter ? 1 : distance === 1 ? 0.8 : 0.64
              const x = offset * 235
              const opacity = isCenter ? 1 : distance === 1 ? 0.55 : 0.22
              const zIndex = 20 - distance

              return (
                <div
                  key={event.slug}
                  className="hero-card-wrap"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                    opacity,
                    zIndex,
                  }}
                >
                  <div className={`hero-card${isCenter ? ' hero-card-center' : ''}`}>
                    {event.bannerImage && (
                      <img src={event.bannerImage} alt={event.title} className="hero-card-img" />
                    )}
                    <div className="hero-card-fade" />

                    {isCenter && (
                      <>
                        <div className="hero-badge-featured">
                          <FiStar size={11} />
                          FEATURED EVENT
                        </div>
                        {event.dateDay && (
                          <div className="hero-date-chip">
                            <span className="hero-date-month">{event.dateMonth}</span>
                            <span className="hero-date-day">{event.dateDay}</span>
                            <span className="hero-date-weekday">{event.dateWeekday}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="hero-card-body">
                      <span className="hero-card-category">{event.categoryLabel}</span>
                      <h3 className="hero-card-title">{event.title}</h3>

                      {isCenter ? (
                        <>
                          <div className="hero-card-meta">
                            {event.dateFull && (
                              <span className="hero-card-meta-item">
                                <FiCalendar size={14} /> {event.dateFull}
                              </span>
                            )}
                            {event.time && (
                              <span className="hero-card-meta-item">
                                <FiClock size={14} /> {event.time}
                              </span>
                            )}
                            {event.location && (
                              <span className="hero-card-meta-item">
                                <FiMapPin size={14} /> {event.location}
                              </span>
                            )}
                          </div>

                          <div className="hero-card-footer">
                            <div className="hero-attendees">
                              {event.attendeeAvatars.length > 0 && (
                                <div className="hero-avatars">
                                  {event.attendeeAvatars.slice(0, 4).map((src, i) => (
                                    <img key={i} src={src} alt="" className="hero-avatar" />
                                  ))}
                                </div>
                              )}
                              {event.attendees > 0 && (
                                <span className="hero-attendees-count">
                                  {event.attendees.toLocaleString()}+ attending
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="hero-pill hero-pill-solid"
                              onClick={() => navigate(`/event/${event.slug}`)}
                            >
                              View Event
                              <span className="hero-pill-arrow">
                                <FiArrowUpRight size={14} />
                              </span>
                            </button>
                          </div>
                        </>
                      ) : (
                        event.dateFull && (
                          <div className="hero-card-date-small">
                            <FiCalendar size={11} /> {event.dateFull}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {total > 1 && (
          <div className="hero-dots">
            {events.map((event, index) => (
              <button
                key={event.slug}
                type="button"
                aria-label={`Go to ${event.title}`}
                className={`hero-dot${index === currentIndex ? ' is-active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}

        <div className="hero-stats">
          {stats.map((s) => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-icon">
                <s.icon size={20} />
              </div>
              <div>
                <p className="hero-stat-value">{s.value}</p>
                <p className="hero-stat-label">{s.label}</p>
                <p className="hero-stat-sub">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}