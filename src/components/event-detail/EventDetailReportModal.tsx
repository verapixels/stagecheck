// ─── EventDetailReportModal.tsx ───────────────────────────────────────────────

import {
  RiFlag2Line, RiCloseLine, RiCheckLine, RiLoader4Line,
} from 'react-icons/ri'
import type { EventData } from './eventDetailTypes'

const REPORT_ISSUES = [
  'Misleading or false information',
  'Event has been cancelled',
  'Scam or fraud',
  'Inappropriate content',
  'Safety concern',
  'Ticket pricing issues',
  'Other (describe below)',
]

interface Props {
  event: EventData
  issue: string
  custom: string
  email: string
  submitting: boolean
  success: boolean
  onIssue: (v: string) => void
  onCustom: (v: string) => void
  onEmail: (v: string) => void
  onSubmit: () => void
  onClose: () => void
}

export default function EventDetailReportModal({
  event, issue, custom, email,
  submitting, success,
  onIssue, onCustom, onEmail, onSubmit, onClose,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => !submitting && onClose()}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#030d1a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden',
          animation: 'popIn 0.3s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RiFlag2Line size={16} color="#f87171" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Report Event</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                Help us keep StageCheck safe
              </div>
            </div>
          </div>
          {!submitting && (
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              }}
            >
              <RiCloseLine size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                margin: '0 auto 18px',
                background: 'rgba(13,199,94,0.12)',
                border: '2px solid rgba(13,199,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'popIn 0.4s cubic-bezier(.16,1,.3,1)',
              }}>
                <RiCheckLine size={34} color="#0dc75e" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                Report Submitted
              </div>
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.7, marginBottom: 22,
              }}>
                Thanks for letting us know. Our team will review this event and take action if needed.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 28px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: 'rgba(255,255,255,0.7)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 12, color: 'rgba(255,255,255,0.4)',
                marginBottom: 16, lineHeight: 1.6,
              }}>
                What's the issue with{' '}
                <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{event.name}</strong>?
              </div>

              {/* Issue chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {REPORT_ISSUES.map(i => (
                  <button
                    key={i}
                    onClick={() => onIssue(i)}
                    style={{
                      padding: '7px 13px', borderRadius: 100,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: issue === i
                        ? 'rgba(248,113,113,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${issue === i
                        ? 'rgba(248,113,113,0.5)'
                        : 'rgba(255,255,255,0.07)'}`,
                      color: issue === i ? '#f87171' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>

              {/* Details textarea */}
              <textarea
                value={custom}
                onChange={e => onCustom(e.target.value)}
                placeholder="Tell us more…"
                rows={3}
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, color: '#fff', fontSize: 13,
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                  lineHeight: 1.6, marginBottom: 12,
                }}
              />

              {/* Email */}
              <input
                type="email" value={email}
                onChange={e => onEmail(e.target.value)}
                placeholder="your@email.com (optional)"
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, color: '#fff', fontSize: 13,
                  fontFamily: 'Inter, sans-serif', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 20,
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, color: 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={
                    !issue ||
                    (issue === 'Other (describe below)' && !custom.trim()) ||
                    submitting
                  }
                  style={{
                    flex: 2, padding: '12px', borderRadius: 10,
                    fontSize: 13, fontWeight: 700,
                    cursor: (!issue || submitting) ? 'not-allowed' : 'pointer',
                    background: !issue
                      ? 'rgba(248,113,113,0.15)'
                      : 'rgba(248,113,113,0.85)',
                    border: 'none', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? (
                    <><RiLoader4Line size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
                  ) : (
                    <><RiFlag2Line size={14} /> Submit Report</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}