// src/components/helpCenter/ResourcesTools.tsx
import {
  RiFileCopyLine,
  RiCheckboxLine,
  RiLightbulbLine,
  RiDownloadLine,
  RiPlugLine,
  RiArrowRightLine,
} from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

const RESOURCES = [
  {
    icon: RiFileCopyLine,
    color: '#0dc75e',
    title: 'Templates',
    desc: 'Ready-to-use event templates.',
    link: 'Browse templates',
  },
  {
    icon: RiCheckboxLine,
    color: '#8B5CF6',
    title: 'Checklists',
    desc: 'Step-by-step checklists for success.',
    link: 'View checklists',
  },
  {
    icon: RiLightbulbLine,
    color: '#F59E0B',
    title: 'Best Practices',
    desc: 'Tips and strategies from successful organizers.',
    link: 'Explore tips',
  },
  {
    icon: RiDownloadLine,
    color: '#06B6D4',
    title: 'Downloads',
    desc: 'Guides, PDFs and planning documents.',
    link: 'View downloads',
  },
  {
    icon: RiPlugLine,
    color: '#EC4899',
    title: 'Integrations',
    desc: 'Connect tools and automate your workflow.',
    link: 'More integrations',
  },
]

export default function ResourcesTools() {
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-res-section" ref={ref}>
      <style>{`
        .hc-res-section {
          padding: 0 clamp(20px, 5%, 80px) 64px;
          max-width: 1280px; margin: 0 auto;
        }
        .hc-res-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 28px 24px;
        }
        .hc-res-item {
          display: flex; flex-direction: column; gap: 0;
          padding: 0 8px;
          border-right: 1px solid rgba(255,255,255,0.06);
          text-decoration: none;
        }
        .hc-res-item:last-child { border-right: none; }
        .hc-res-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 13px;
        }
        .hc-res-title {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 14px; color: #fff; margin: 0 0 6px;
        }
        .hc-res-desc {
          font-family: 'Inter', sans-serif; font-size: 11.5px;
          color: rgba(255,255,255,0.4); margin: 0 0 14px;
          line-height: 1.5; font-weight: 400; flex: 1;
        }
        .hc-res-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          transition: gap 0.2s;
        }
        .hc-res-item:hover .hc-res-link { gap: 8px; }
        @media (max-width: 1024px) {
          .hc-res-grid { grid-template-columns: repeat(3, 1fr); }
          .hc-res-item:nth-child(3) { border-right: none; }
        }
        @media (max-width: 640px) {
          .hc-res-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 22px 18px; }
          .hc-res-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 18px; }
          .hc-res-item:last-child { border-bottom: none; }
          .hc-res-icon { margin: 0 auto 13px; }
          .hc-res-title { text-align: center; }
          .hc-res-desc { text-align: center; }
          .hc-res-link { justify-content: center; }
        }
        @media (max-width: 380px) {
          .hc-res-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hc-section-header hc-reveal">
        <h2 className="hc-section-title">Resources & tools</h2>
        <a href="#" className="hc-view-all">View all resources <RiArrowRightLine size={14} /></a>
      </div>

      <div className="hc-res-grid hc-reveal">
        {RESOURCES.map((r) => {
          const Icon = r.icon
          return (
            <a key={r.title} href="#" className="hc-res-item">
              <div className="hc-res-icon" style={{ background: `${r.color}18`, border: `1px solid ${r.color}28` }}>
                <Icon size={20} color={r.color} />
              </div>
              <h3 className="hc-res-title">{r.title}</h3>
              <p className="hc-res-desc">{r.desc}</p>
              <span className="hc-res-link" style={{ color: r.color }}>
                {r.link} <RiArrowRightLine size={12} />
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}