import { useState } from 'react'
import { createPortal } from 'react-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { X, Check, Upload, Users, Mail, ToggleLeft, ToggleRight, Copy } from 'lucide-react'

interface Props {
  eventMeta: any
  eventId: string
  existingConfig: any
  submissionLink: string
  onClose: () => void
  onCreated: (config: any) => void
}

export default function SubmissionFormModal({ eventMeta, eventId, existingConfig, submissionLink, onClose, onCreated }: Props) {
  const [contactEmail, setContactEmail]   = useState(existingConfig?.contactEmail || '')
  const [contactPhone, setContactPhone]   = useState(existingConfig?.contactPhone || '')
  const [maxPerformers, setMaxPerformers] = useState<number | ''>(existingConfig?.maxPerformers || '')
  const [minsPerGroup, setMinsPerGroup]   = useState<number | ''>(existingConfig?.minsPerGroup || '')
  const [allowAudio, setAllowAudio]       = useState(existingConfig?.allowAudio ?? true)
  const [allowOriginal, setAllowOriginal] = useState(existingConfig?.allowOriginal ?? true)
  const [saving, setSaving]               = useState(false)
  const [done, setDone]                   = useState(false)
  const [copied, setCopied]               = useState(false)

  const handleCreate = async () => {
    setSaving(true)
    const config = {
      contactEmail, contactPhone,
      maxPerformers: maxPerformers === '' ? null : Number(maxPerformers),
      minsPerGroup:  minsPerGroup  === '' ? null : Number(minsPerGroup),
      allowAudio, allowOriginal, submissionLink,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'events', eventId, 'config', 'submissionForm'), config)
    setSaving(false)
    setDone(true)
    onCreated(config)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(submissionLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modal = (
    <>
      {/* ---------- styles ---------- */}
      <style>{`
        .sfm-scroll::-webkit-scrollbar { width: 6px; }
        .sfm-scroll::-webkit-scrollbar-track { background: transparent; }
        .sfm-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
      `}</style>

      {/*
        TWO-layer approach:
        1. Fixed full-screen backdrop — does NOT scroll, just dims + catches outside clicks
        2. Fixed full-screen scroll wrapper — sits on top, handles all scrolling
      */}

      {/* Layer 1 — backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Layer 2 — scroll container (pointer-events none so clicks on empty area fall through to backdrop) */}
      <div
        className="sfm-scroll"
        style={{
          position: 'fixed', inset: 0,
          zIndex: 99999,
          overflowY: 'auto',
          overflowX: 'hidden',
          pointerEvents: 'none',       // let backdrop catch outside clicks
          paddingTop: 40,
          paddingBottom: 60,
          paddingLeft: 16,
          paddingRight: 16,
          boxSizing: 'border-box',
        }}
      >
        {/* Card — re-enable pointer events only here */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 660,            // wider card
            margin: '0 auto',
            background: 'linear-gradient(160deg, #0d1526 0%, #0a1020 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
            position: 'relative',
            // NO overflow: hidden here — that was clipping the banner
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 9, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
          >
            <X size={16} color="rgba(255,255,255,0.8)" />
          </button>

          {/* Cover banner — borderRadius only on top corners */}
          <div style={{
            position: 'relative', height: 160,
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',        // clipping stays scoped to banner only
          }}>
            {eventMeta?.coverImage || eventMeta?.imageUrl ? (
              <img
                src={eventMeta.coverImage || eventMeta.imageUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a3a5c,#0f1e40,#0a1020)' }} />
            )}
            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a1020 0%, rgba(10,16,32,0.2) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 18, left: 24, right: 54 }}>
              <div style={{ fontSize: 10, color: '#22C55E', fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 5 }}>
                Submission Form Setup
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.15 }}>
                {eventMeta?.name || 'Event'}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px 32px' }}>

            {/* Pre-filled info */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 28,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                Pre-filled from event
              </div>
              <div style={{ display: 'grid', gap: 7 }}>
                {[
                  { label: 'Description', val: eventMeta?.description || eventMeta?.shortDescription || '—' },
                  { label: 'Location',    val: eventMeta?.location    || eventMeta?.venue            || '—' },
                  { label: 'Date',        val: eventMeta?.date
                      ? new Date(eventMeta.date?.seconds ? eventMeta.date.seconds * 1000 : eventMeta.date)
                          .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', minWidth: 80, flexShrink: 0 }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <SectionLabel icon={<Mail size={13} />} label="Your Contact Details" sub="Optional — shown to participants" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
              <Field label="Email" value={contactEmail} onChange={setContactEmail} placeholder="organizer@email.com" type="email" />
              <Field label="Phone" value={contactPhone} onChange={setContactPhone} placeholder="+234 800 000 0000" type="tel" />
            </div>

            {/* Limits */}
            <SectionLabel icon={<Users size={13} />} label="Limits" sub="Control how many can submit and how long each gets" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
              <Field label="Max Performers" value={maxPerformers} onChange={v => setMaxPerformers(v === '' ? '' : Number(v))} placeholder="e.g. 20" type="number" />
              <Field label="Minutes per Group" value={minsPerGroup} onChange={v => setMinsPerGroup(v === '' ? '' : Number(v))} placeholder="e.g. 5" type="number" />
            </div>

            {/* Toggles */}
            <SectionLabel icon={<Upload size={13} />} label="What participants can submit" sub="Toggle on or off" />
            <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
              <Toggle label="Song search (YouTube)" sub="Participants search and pick a song from YouTube" value={allowAudio} onChange={setAllowAudio} />
              <Toggle label="Original song upload" sub="Participants upload their own audio file and song name" value={allowOriginal} onChange={setAllowOriginal} />
            </div>

            {/* Done state — link bar */}
            {done && (
              <div style={{
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.22)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, color: '#22C55E', fontWeight: 700, marginBottom: 10 }}>
                  Submission form created — share this link:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {submissionLink}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: copied ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.08)',
                      color: copied ? '#22C55E' : '#fff',
                      fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                    }}
                  >
                    {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy link</>}
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            {!done ? (
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                  background: saving ? 'rgba(34,197,94,0.5)' : 'linear-gradient(135deg,#22C55E,#16A34A)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  cursor: saving ? 'wait' : 'pointer',
                  boxShadow: saving ? 'none' : '0 6px 24px rgba(34,197,94,0.3)',
                  letterSpacing: '-0.2px', transition: 'all 0.2s',
                }}
              >
                {saving ? 'Creating...' : 'Create Submission Form & Get Link'}
              </button>
            ) : (
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 15, fontWeight: 600,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modal, document.body)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
      <span style={{ color: '#22C55E', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{sub}</div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: any; onChange: (v: any) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 7, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10,
          padding: '10px 14px', color: '#fff', fontSize: 14,
          fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.4)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
      />
    </div>
  )
}

function Toggle({ label, sub, value, onChange }: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: value ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${value ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12, padding: '13px 16px', cursor: 'pointer', gap: 12,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {value
          ? <ToggleRight size={28} color="#22C55E" />
          : <ToggleLeft  size={28} color="rgba(255,255,255,0.2)" />}
      </div>
    </div>
  )
}