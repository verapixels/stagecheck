import { Eye, Copy, Check, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { CustomField } from './NetworkFormBuilder'

interface OrgLevel {
  id: string
  name: string
  order: number
  color: string
}

interface Props {
  eventId: string
  levels: OrgLevel[]
  config: any
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.85)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  overflow: 'hidden',
}

const mockInp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 8,
  color: 'rgba(255,255,255,0.55)',
  fontSize: 12,
  padding: '9px 12px',
  width: '100%',
  boxSizing: 'border-box',
}

const fieldLbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.6)',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  display: 'block',
}

const TYPE_PLACEHOLDERS: Record<string, string> = {
  text:   'Enter text',
  number: '0',
  email:  'name@example.com',
  tel:    '+234 800 000 0000',
}

export default function NetworkFormPreview({ eventId, levels, config }: Props) {
  const [copied, setCopied]     = useState(false)
  const [eventData, setEventData] = useState<any>(null)

  // Fetch event doc for banner + description
  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) setEventData(snap.data())
    })
  }, [eventId])

  const sorted = [...levels].sort((a, b) => a.order - b.order).slice(0, config?.levelDepth ?? levels.length)
  const customFields: CustomField[] = config?.customFields ?? []
  const link = `${window.location.origin}/register/${eventId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Share link ── */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExternalLink size={13} color="#818CF8" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Public Link</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)',
            fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', minWidth: 0,
          }}>
            {link}
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)',
                color: copied ? '#22C55E' : '#818CF8',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
            >
              {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
            </button>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 9,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              <ExternalLink size={11} /> Open
            </a>
          </div>
        </div>
      </div>

      {/* ── Form preview ── */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={13} color="#818CF8" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Form Preview</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>read-only</span>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Event banner image */}
          {eventData?.bannerUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/7', background: 'rgba(255,255,255,0.04)' }}>
              <img
                src={eventData.bannerUrl}
                alt="Event banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Event name + description from event doc */}
          <div style={{ marginBottom: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 5, lineHeight: 1.2 }}>
              {eventData?.eventName || config?.formTitle || 'Event Registration'}
            </div>
            {(eventData?.description || eventData?.eventDescription || config?.formDescription) && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                {eventData?.description || eventData?.eventDescription || config?.formDescription}
              </div>
            )}
          </div>

          {/* Always-on: name + email */}
          {[
            { label: 'Full Name *',     placeholder: 'Enter your full name' },
            { label: 'Email Address *', placeholder: 'Enter your email' },
          ].map((f, i) => (
            <div key={i}>
              <label style={fieldLbl}>{f.label}</label>
              <div style={mockInp}>{f.placeholder}</div>
            </div>
          ))}

          {/* Phone if enabled */}
          {config?.requirePhone && (
            <div>
              <label style={fieldLbl}>Phone Number *</label>
              <div style={mockInp}>+234 800 000 0000</div>
            </div>
          )}

          {/* Custom fields */}
          {customFields.map(field => (
            <div key={field.id}>
              <label style={{
                ...fieldLbl,
                color: 'rgba(52,211,153,0.8)',
              }}>
                {field.label}{field.required && ' *'}
              </label>
              <div style={{
                ...mockInp,
                border: '1px solid rgba(52,211,153,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{TYPE_PLACEHOLDERS[field.type] ?? 'Enter value'}</span>
                <span style={{ fontSize: 10, color: 'rgba(52,211,153,0.5)', textTransform: 'uppercase' }}>
                  {field.type}
                </span>
              </div>
            </div>
          ))}

          {/* Org hierarchy dropdowns */}
          {sorted.map((level, i) => (
            <div key={level.id}>
              <label style={{ ...fieldLbl, color: level.color }}>
                {level.name} *
              </label>
              <div style={{
                ...mockInp,
                border: `1px solid ${level.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>Select {level.name}</span>
                <span style={{ fontSize: 10, color: level.color }}>▾</span>
              </div>
              {i < sorted.length - 1 && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, paddingLeft: 2 }}>
                  Next dropdown appears after selection
                </div>
              )}
            </div>
          ))}

          {/* Photo upload */}
          {config?.requirePhoto && (
            <div>
              <label style={fieldLbl}>Passport Photo *</label>
              <div style={{ ...mockInp, textAlign: 'center', padding: '18px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                Upload photo
              </div>
            </div>
          )}

          <div style={{
            marginTop: 4, padding: '12px 0', borderRadius: 10,
            background: 'linear-gradient(135deg,#6366F1,#4F46E5)',
            textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            Register Now
          </div>
        </div>
      </div>
    </div>
  )
}