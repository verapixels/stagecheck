// ─── EventDetailFAQ.tsx ───────────────────────────────────────────────────────
// FAQ accordion — green circle icon per question, chevron toggle, "Contact Support" link

import { useState } from 'react'
import { RiArrowDownSLine, RiArrowUpSLine, RiQuestionLine } from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'

interface Props {
  event: EventData
}

export default function EventDetailFAQ({ event }: Props) {
  const faq = event.faq || []
  const [open, setOpen] = useState<string | null>(null)

  if (faq.length === 0) return null

  return (
    <div className="ed-card" style={{ marginBottom: 14 }}>
      <div className="ed-section-label">
        Frequently Asked Questions
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {faq.map(f => (
          <div
            key={f.id}
            style={{
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden',
              background: open === f.id ? 'rgba(13,199,94,0.03)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <button
              className="ed-faq-btn"
              onClick={() => setOpen(open === f.id ? null : f.id)}
            >
              {/* Green circle icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(13,199,94,0.12)',
                  border: '1px solid rgba(13,199,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <RiQuestionLine size={11} color="var(--green)" />
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: open === f.id ? 'var(--green)' : '#fff',
                  lineHeight: 1.4,
                }}>
                  {f.question}
                </span>
              </div>
              {open === f.id
                ? <RiArrowUpSLine size={17} color="var(--green)" />
                : <RiArrowDownSLine size={17} color="rgba(255,255,255,0.3)" />}
            </button>

            {open === f.id && (
              <div style={{
                padding: '0 18px 16px 54px',
                fontSize: 13, color: 'rgba(255,255,255,0.62)',
                lineHeight: 1.8,
              }}>
                {f.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18, fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
      }}>
        Still have questions?{' '}
        <a
          href="mailto:support@stagecheck.com"
          style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}