// src/components/helpCenter/VideoTutorials.tsx
import { RiPlayCircleFill, RiArrowRightLine } from 'react-icons/ri'
import { useScrollReveal } from './helpCenter'

const VIDEOS = [
  {
    image: '/images/help-video-create-event.jpg',
    duration: '12:43',
    title: 'Creating your first event',
    desc: 'Step by step walkthrough',
  },
  {
    image: '/images/help-video-ticket-types.jpg',
    duration: '08:30',
    title: 'Setting up ticket types',
    desc: 'Create tickets & pricing',
  },
  {
    image: '/images/help-video-qr-checkin.jpg',
    duration: '05:15',
    title: 'QR Check-in in action',
    desc: 'Scan & manage attendees',
  },
  {
    image: '/images/help-video-attendees.jpg',
    duration: '07:30',
    title: 'Managing your attendees',
    desc: 'View, export & manage data',
  },
  {
    image: '/images/help-video-analytics.jpg',
    duration: '07:26',
    title: 'Using analytics',
    desc: 'Understand your event data',
  },
]

export default function VideoTutorials() {
  const ref = useScrollReveal() as React.RefObject<HTMLDivElement>

  return (
    <section className="hc-videos-section" ref={ref}>
      <style>{`
        .hc-videos-section {
          padding: 0 clamp(20px, 5%, 80px) 64px;
          max-width: 1280px; margin: 0 auto;
        }
        .hc-videos-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        .hc-video-card {
          border-radius: 14px; overflow: hidden;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer; text-decoration: none; display: block;
          transition: border-color 0.25s, transform 0.25s;
        }
        .hc-video-card:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-3px);
        }
        .hc-video-thumb {
          position: relative; height: 120px; overflow: hidden;
          background: rgba(13,199,94,0.05);
        }
        .hc-video-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.4s ease;
        }
        .hc-video-card:hover .hc-video-img { transform: scale(1.06); }
        .hc-video-overlay {
          position: absolute; inset: 0;
          background: rgba(6,13,26,0.4);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.25s;
        }
        .hc-video-card:hover .hc-video-overlay { background: rgba(6,13,26,0.2); }
        .hc-video-play {
          color: #fff; opacity: 0.9;
          transition: transform 0.25s, opacity 0.25s;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        }
        .hc-video-card:hover .hc-video-play { transform: scale(1.1); opacity: 1; }
        .hc-video-duration {
          position: absolute; bottom: 8px; right: 8px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          color: #fff; background: rgba(0,0,0,0.7);
          border-radius: 5px; padding: 2px 7px;
        }
        .hc-video-body { padding: 12px 14px 15px; }
        .hc-video-title {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: 13px; color: #fff; margin: 0 0 5px; line-height: 1.35;
        }
        .hc-video-desc {
          font-family: 'Inter', sans-serif; font-size: 11px;
          color: rgba(255,255,255,0.4); margin: 0; font-weight: 400;
        }
        @media (max-width: 1100px) {
          .hc-videos-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 700px) {
          .hc-videos-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 440px) {
          .hc-videos-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hc-section-header hc-reveal">
        <h2 className="hc-section-title">Video tutorials</h2>
        <a href="#" className="hc-view-all">View all tutorials <RiArrowRightLine size={14} /></a>
      </div>

      <div className="hc-videos-grid">
        {VIDEOS.map((v, i) => (
          <a
            key={v.title}
            href="#"
            className="hc-video-card hc-reveal"
            style={{ '--delay': `${i * 70}ms` } as React.CSSProperties}
          >
            <div className="hc-video-thumb">
              <img src={v.image} alt={v.title} className="hc-video-img" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
              <div className="hc-video-overlay">
                <RiPlayCircleFill size={40} className="hc-video-play" />
              </div>
              <span className="hc-video-duration">{v.duration}</span>
            </div>
            <div className="hc-video-body">
              <h3 className="hc-video-title">{v.title}</h3>
              <p className="hc-video-desc">{v.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}