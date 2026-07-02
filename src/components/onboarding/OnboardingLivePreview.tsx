import { useEffect, useRef, useState } from 'react'
import { CalendarDays, MapPin, Image as ImageIcon } from 'lucide-react'
import type { OnboardingForm, MediaItem, RepeatingDate } from './onboardingTypes'

type Props = {
  form: OnboardingForm
  mediaItems: MediaItem[]
  repeatingDates?: RepeatingDate[]
  typeColor?: string
  typeLabel?: string
}

const PREVIEW_WIDTH = 300
const TOP_OFFSET = 24

export default function OnboardingLivePreview({ form, mediaItems, repeatingDates = [], typeColor = '#22C55E', typeLabel }: Props) {
  const coverImage = mediaItems.find(m => m.type === 'image')
  const placeholderRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState({ left: 0, active: false })

  useEffect(() => {
    const recalc = () => {
      if (!placeholderRef.current) return
      const rect = placeholderRef.current.getBoundingClientRect()
      // Only pin on wide-enough screens (matches the ob-preview-sidebar breakpoint)
      const shouldPin = window.innerWidth > 1000
      setPinned({ left: rect.left, active: shouldPin })
    }
    recalc()
    window.addEventListener('scroll', recalc, { passive: true })
    window.addEventListener('resize', recalc)
    return () => {
      window.removeEventListener('scroll', recalc)
      window.removeEventListener('resize', recalc)
    }
  }, [])

  const allDates = form.isRepeating
    ? [
        ...(form.eventDate ? [{ date: form.eventDate, time: form.startTime }] : []),
        ...repeatingDates.map(rd => ({ date: rd.date, time: rd.startTime })),
      ]
    : []

  return (
    <>
      {/* Placeholder keeps the layout column width reserved since the real card becomes fixed */}
      <div ref={placeholderRef} className="ob-preview-sidebar" style={{ width: PREVIEW_WIDTH, flexShrink: 0 }} />

      <div
        style={
          pinned.active
            ? {
                position: 'fixed', top: TOP_OFFSET, left: pinned.left, width: PREVIEW_WIDTH,
                maxHeight: `calc(100vh - ${TOP_OFFSET * 2}px)`, overflowY: 'auto', overflowX: 'hidden',
                paddingRight: 4, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent',
              }
            : {
                position: 'absolute', top: 0, left: pinned.left, width: PREVIEW_WIDTH,
                maxHeight: '100vh', overflowY: 'auto', overflowX: 'hidden',
                paddingRight: 4,
              }
        }
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2, fontFamily: 'var(--font-display)' }}>Live Preview</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>This is how your event will appear to attendees.</div>

        <div style={{ background: 'rgba(19,26,46,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ height: 140, position: 'relative', overflow: 'hidden', background: coverImage ? 'transparent' : `linear-gradient(135deg, ${typeColor}25, rgba(59,130,246,0.1))` }}>
            {coverImage ? (
              <img src={coverImage.preview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)' }}>
                <ImageIcon size={32} />
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,16,30,0.92) 0%, transparent 60%)' }} />
            {typeLabel && (
              <div style={{ position: 'absolute', top: 10, left: 10, background: `${typeColor}dd`, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                {typeLabel}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                {form.eventName || 'Your Event Name'}
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px 18px' }}>
            {form.summary && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 12, borderLeft: `2px solid ${typeColor}60`, paddingLeft: 8 }}>
                {form.summary}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {form.isRepeating ? (
                allDates.length > 0 && (
                  <div style={{ background: `${typeColor}12`, borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: typeColor, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CalendarDays size={11} /> {allDates.length} Date{allDates.length > 1 ? 's' : ''}
                    </div>
                    {allDates.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                        <span>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        {d.time && <span style={{ color: 'rgba(255,255,255,0.35)' }}>{d.time}</span>}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                form.eventDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', background: `${typeColor}12`, borderRadius: 8, padding: '7px 10px' }}>
                    <CalendarDays size={12} color={typeColor} />
                    <span>{new Date(form.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    {form.startTime && <span style={{ color: 'rgba(255,255,255,0.35)' }}>· {form.startTime}</span>}
                  </div>
                )
              )}
              {(form.venue || form.locationType !== 'venue') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px' }}>
                  <MapPin size={12} color={typeColor} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.locationType === 'online' ? 'Online Event' : form.locationType === 'tba' ? 'TBA' : form.venue || 'Venue'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, padding: '10px 14px', background: `linear-gradient(135deg, ${typeColor}, ${typeColor}dd)`, borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#0B1020' }}>
              Register / Get Tickets
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 10, textAlign: 'center' }}>
          This is a preview only. Some changes may occur after publishing.
        </div>
      </div>
    </>
  )
}