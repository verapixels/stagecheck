// ─── EventDetailAbout.tsx ────────────────────────────────────────────────────
// "About This Event" card with description + optional tag pills at bottom
// Tag pills: Live Performance | Top Artists | Great Vibes | Food & Drinks

import { useState } from 'react'
import {
  RiFileTextLine, RiArrowDownSLine, RiArrowUpSLine,
  RiMusicLine, RiGroupLine, RiStarLine, RiRestaurantLine,
} from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'

interface Props {
  event: EventData
}

// Default about tags matching the screenshot
const DEFAULT_ABOUT_TAGS = [
  { label: 'Live Performance', icon: <RiMusicLine size={12} color="var(--green)" /> },
  { label: 'Top Artists',      icon: <RiGroupLine size={12} color="var(--green)" /> },
  { label: 'Great Vibes',      icon: <RiStarLine size={12} color="var(--green)" /> },
  { label: 'Food & Drinks',    icon: <RiRestaurantLine size={12} color="var(--green)" /> },
]

export default function EventDetailAbout({ event }: Props) {
  const [expanded, setExpanded] = useState(false)
  const hasText = !!(event.summary || event.description)
  if (!hasText) return null

  const longDesc = event.description && event.description.length > 220
  const aboutTags = event.aboutTags
    ? event.aboutTags.map(t => ({ label: t.label, icon: null }))
    : DEFAULT_ABOUT_TAGS

  return (
    <div className="ed-card" style={{ marginBottom: 14 }}>
      <div className="ed-section-label">
        <RiFileTextLine size={13} /> About This Event
      </div>

      {/* Summary line */}
      {event.summary && (
        <p style={{
          fontSize: 14, fontWeight: 500,
          color: '#e8f5ec',
          lineHeight: 1.78,
          marginBottom: event.description ? 12 : 0,
        }}>
          {event.summary}
        </p>
      )}

      {/* Description with read more */}
      {event.description && (
        <>
          <div style={{
            fontSize: 13.5,
            color: 'rgba(255,255,255,0.68)',
            lineHeight: 1.85,
            maxHeight: expanded ? 'none' : '110px',
            overflow: expanded ? 'visible' : 'hidden',
            maskImage: expanded
              ? 'none'
              : 'linear-gradient(to bottom, black 50%, transparent 100%)',
            WebkitMaskImage: expanded
              ? 'none'
              : 'linear-gradient(to bottom, black 50%, transparent 100%)',
            whiteSpace: 'pre-line',
          }}>
            {event.description}
          </div>
          {longDesc && (
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                marginTop: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none',
                color: 'var(--green)', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', padding: 0,
              }}
            >
              {expanded
                ? <><RiArrowUpSLine size={16} /> Show less</>
                : <><RiArrowDownSLine size={16} /> Read more</>}
            </button>
          )}
        </>
      )}

      {/* About tag pills */}
      {aboutTags.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18,
          paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {aboutTags.map((tag, i) => (
            <span key={i} className="ed-tag-pill">
              {tag.icon}
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}