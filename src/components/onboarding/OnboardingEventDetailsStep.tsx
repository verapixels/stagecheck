import { useRef, useState, useCallback } from 'react'
import {
  Image as ImageIcon, Video, X, PlayCircle, Sparkles, Loader2, AlignLeft,
  Bold, Italic, List, Link2, CalendarDays, Clock, MapPin, Repeat2,
  Mic, Search, Globe, UserPlus, User, CheckCircle2, AlertCircle, Plus,
  Trash2, Calendar, HelpCircle, Info, ChevronDown, Mail, Phone, Users,
} from 'lucide-react'
import VenueSearch from '../Venuesearch'
import type { VenueResult } from '../Venuesearch'
import { OnboardingDatePicker, OnboardingTimePicker } from './Onboardingdatetimepickers'
import { searchArtists, searchPublicFigures } from './Onboardingartistsearch'
import OnboardingMultiDatePicker from './OnboardingMultiDatePicker'
import type {
  OnboardingForm, MediaItem, FeaturedArtist, AgendaItem, FAQItem, GoodToKnow,
  RepeatingDate, LineupSearchMode,
} from './onboardingTypes'

type Props = {
  form: OnboardingForm
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>
  errors: Record<string, string>
  descRef: React.RefObject<HTMLDivElement | null>
  onGenerateSummary: () => void
  onGenerateDescription: () => void
  generatingSummary: boolean
  generatingDescription: boolean

  mediaItems: MediaItem[]
  onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAddVideo: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveMedia: (id: string) => void

  repeatingDates: RepeatingDate[]
  onAddRepeatingDate: () => void
  onAddMultipleDates: (dates: string[]) => void
  onUpdateRepeatingDate: (id: string, field: keyof RepeatingDate, value: string) => void
  onRemoveRepeatingDate: (id: string) => void

  featuredArtists: FeaturedArtist[]
  onAddArtist: (artist: FeaturedArtist) => void
  onRemoveArtist: (name: string) => void
  onUpdateArtistRole: (name: string, role: string) => void
  onAddManualArtist: (artist: { name: string; bio: string }, photo: File | null, preview: string) => void

  agendaItems: AgendaItem[]
  onAddAgenda: () => void
  onUpdateAgenda: (id: string, field: keyof AgendaItem, value: string) => void
  onRemoveAgenda: (id: string) => void

  faqItems: FAQItem[]
  onAddFAQ: () => void
  onUpdateFAQ: (id: string, field: keyof FAQItem, value: string) => void
  onRemoveFAQ: (id: string) => void

  goodToKnow: GoodToKnow
  setGoodToKnow: React.Dispatch<React.SetStateAction<GoodToKnow>>
}

const inputStyle = (hasError?: string): React.CSSProperties => ({
  width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
})

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }
const sectionStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }
const subCardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }

export default function OnboardingEventDetailsStep(props: Props) {
  const {
    form, setForm, errors, descRef, onGenerateSummary, onGenerateDescription,
    generatingSummary, generatingDescription,
    mediaItems, onAddImage, onAddVideo, onRemoveMedia,
    repeatingDates, onAddRepeatingDate, onAddMultipleDates, onUpdateRepeatingDate, onRemoveRepeatingDate,
    featuredArtists, onAddArtist, onRemoveArtist, onUpdateArtistRole, onAddManualArtist,
    agendaItems, onAddAgenda, onUpdateAgenda, onRemoveAgenda,
    faqItems, onAddFAQ, onUpdateFAQ, onRemoveFAQ,
    goodToKnow, setGoodToKnow,
  } = props

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const manualArtistPhotoRef = useRef<HTMLInputElement>(null)
  const artistDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const imageCount = mediaItems.filter(m => m.type === 'image').length
  const videoCount = mediaItems.filter(m => m.type === 'video').length

  const [showLineupSection, setShowLineupSection] = useState(false)
  const [showAgenda, setShowAgenda] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showGoodToKnow, setShowGoodToKnow] = useState(false)

  const [lineupSearchMode, setLineupSearchMode] = useState<LineupSearchMode>('artist')
  const [artistQuery, setArtistQuery] = useState('')
  const [artistSearching, setArtistSearching] = useState(false)
  const [artistResults, setArtistResults] = useState<FeaturedArtist[]>([])
  const [artistError, setArtistError] = useState('')

  const [manualArtist, setManualArtist] = useState({ name: '', bio: '' })
  const [manualArtistPhoto, setManualArtistPhoto] = useState<File | null>(null)
  const [manualArtistPreview, setManualArtistPreview] = useState('')

  const handleVenueChange = (result: VenueResult) => setForm(f => ({ ...f, venue: result.venue, address: result.address }))

  const runSearch = useCallback((q: string, mode: LineupSearchMode) => {
  setArtistQuery(q); setArtistError(''); setArtistResults([])
  if (artistDebounce.current) clearTimeout(artistDebounce.current)
  if (!q.trim() || mode === 'manual') return
  artistDebounce.current = setTimeout(async () => {
    setArtistSearching(true)
    const results = mode === 'artist' ? await searchArtists(q.trim()) : await searchPublicFigures(q.trim())
    setArtistSearching(false)
    if (results.length > 0) setArtistResults(results)
    else setArtistError('No results found. Try a different name or add manually.')
  }, 600)
}, [])

  const handleManualArtistPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setManualArtistPhoto(file)
    const reader = new FileReader()
    reader.onload = ev => setManualArtistPreview(ev.target?.result as string)
    reader.readAsDataURL(file); e.target.value = ''
  }

  const submitManualArtist = () => {
    if (!manualArtist.name.trim()) return
    onAddManualArtist(manualArtist, manualArtistPhoto, manualArtistPreview)
    setManualArtist({ name: '', bio: '' }); setManualArtistPhoto(null); setManualArtistPreview('')
  }

  return (
    <div style={{ marginTop: 10 }}>

      {/* Cover Media */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <ImageIcon size={15} color="#3B82F6" />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Cover, Images & Videos</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Up to 2 images + 2 videos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 10 }}>
          {mediaItems.map(item => (
            <div key={item.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0f1e' }}>
              {item.type === 'image'
                ? <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayCircle size={24} color="#22C55E" /></div>}
              <button onClick={() => onRemoveMedia(item.id)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={11} /></button>
            </div>
          ))}
          {imageCount < 2 && (
            <div onClick={() => imageInputRef.current?.click()} style={{ borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.12)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <ImageIcon size={16} color="rgba(255,255,255,0.4)" /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Add Image ({imageCount}/2)</span>
            </div>
          )}
          {videoCount < 2 && (
            <div onClick={() => videoInputRef.current?.click()} style={{ borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.12)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <Video size={16} color="rgba(255,255,255,0.4)" /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Add Video ({videoCount}/2)</span>
            </div>
          )}
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAddImage} />
        <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onAddVideo} />
      </div>

      {/* Basic Info */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Basic Information</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Event Name *</label>
          <input style={inputStyle(errors.eventName)} placeholder="e.g. Lagos Choral Festival 2026" value={form.eventName} onChange={e => setForm({ ...form, eventName: e.target.value })} />
          {errors.eventName && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.eventName}</span>}
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Summary (max 140 chars)</label>
            <button onClick={onGenerateSummary} disabled={!form.eventName.trim() || generatingSummary} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, cursor: form.eventName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5 }}>
              {generatingSummary ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={10} /> Generate with AI</>}
            </button>
          </div>
          <input style={inputStyle()} placeholder="A short, exciting summary…" value={form.summary} maxLength={140} onChange={e => setForm({ ...form, summary: e.target.value })} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Schedule Type</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ id: false, label: 'Single Event', sub: 'Happens once' }, { id: true, label: 'Repeating Event', sub: 'Multiple dates' }].map(opt => (
              <div key={String(opt.id)} onClick={() => setForm(f => ({ ...f, isRepeating: opt.id }))} style={{ flex: 1, border: `1.5px solid ${form.isRepeating === opt.id ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', background: form.isRepeating === opt.id ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Repeat2 size={13} color={form.isRepeating === opt.id ? '#22C55E' : 'rgba(255,255,255,0.5)'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}><CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />Start Date *</label>
            <OnboardingDatePicker value={form.eventDate} onChange={v => setForm({ ...form, eventDate: v })} hasError={!!errors.eventDate} />
            {errors.eventDate && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.eventDate}</span>}
          </div>
          <div>
            <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Start Time *</label>
            <OnboardingTimePicker value={form.startTime} onChange={v => setForm({ ...form, startTime: v })} hasError={!!errors.startTime} />
            {errors.startTime && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.startTime}</span>}
          </div>
          
          <div>
            <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />End Time</label>
            <OnboardingTimePicker value={form.endTime} onChange={v => setForm({ ...form, endTime: v })} />
          </div>
        </div>

        {form.isRepeating && (
          <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Pick Additional Event Dates</div>

            <OnboardingMultiDatePicker
              onAddDates={onAddMultipleDates}
              excludeDates={[form.eventDate, ...repeatingDates.map(rd => rd.date)].filter(Boolean)}
            />

            {repeatingDates.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {repeatingDates.map((rd, idx) => (
                  <div key={rd.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E' }}>Occurrence {idx + 2} — {rd.date}</div>
                      <button onClick={() => onRemoveRepeatingDate(rd.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#F87171' }}><Trash2 size={11} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                      <OnboardingTimePicker value={rd.startTime} onChange={v => onUpdateRepeatingDate(rd.id, 'startTime', v)} />
                      <OnboardingTimePicker value={rd.endTime} onChange={v => onUpdateRepeatingDate(rd.id, 'endTime', v)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={onAddRepeatingDate} style={{ marginTop: 10, background: 'transparent', border: '1px dashed rgba(34,197,94,0.3)', borderRadius: 9, padding: '8px 14px', color: '#22C55E', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={12} /> Add a blank date manually
            </button>
          </div>
        )}

        <div>
          <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Location</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[{ id: 'venue', label: 'Venue', icon: '📍' }, { id: 'online', label: 'Online', icon: '💻' }, { id: 'tba', label: 'TBA', icon: '📅' }].map(opt => (
              <button key={opt.id} onClick={() => setForm(f => ({ ...f, locationType: opt.id as any }))} style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: `1.5px solid ${form.locationType === opt.id ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, background: form.locationType === opt.id ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', color: form.locationType === opt.id ? '#22C55E' : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          {form.locationType === 'venue' && (
            <VenueSearch venue={form.venue} address={form.address} onChange={handleVenueChange} hasVenueError={!!errors.venue} />
          )}
          {form.locationType === 'online' && (
            <input style={inputStyle()} placeholder="Online event URL or platform" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          )}
          {form.locationType === 'tba' && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Location will be announced later.</div>
          )}
        </div>
      </div>

      {/* Description */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlignLeft size={15} color="#A78BFA" />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Description</div>
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 2, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', alignItems: 'center' }}>
            {[{ icon: <Bold size={13} />, cmd: 'bold' }, { icon: <Italic size={13} />, cmd: 'italic' }, { icon: <List size={13} />, cmd: 'insertUnorderedList' }, { icon: <Link2 size={13} />, cmd: 'createLink' }].map((btn, i) => (
              <button key={i} onMouseDown={e => { e.preventDefault(); if (btn.cmd === 'createLink') { const url = prompt('Enter URL:'); if (url) document.execCommand('createLink', false, url) } else { document.execCommand(btn.cmd, false, undefined) } descRef.current?.focus() }}
                style={{ background: 'transparent', border: 'none', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                {btn.icon}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={onGenerateDescription} disabled={!form.eventName.trim() || generatingDescription} style={{ background: 'rgba(168,139,250,0.12)', border: '1px solid rgba(168,139,250,0.25)', color: '#A78BFA', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, cursor: form.eventName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4 }}>
              {generatingDescription ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={10} /> Suggest</>}
            </button>
          </div>
          <div ref={descRef} contentEditable suppressContentEditableWarning
            onInput={e => setForm(f => ({ ...f, description: e.currentTarget.innerHTML }))}
            data-placeholder="Describe your event — what attendees can expect, the vibe, highlights…"
            style={{ minHeight: 140, padding: '14px 16px', outline: 'none', color: '#fff', fontSize: 14, lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', border: errors.description ? '1px solid rgba(239,68,68,0.5)' : 'none' }} />
        </div>
        {errors.description && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.description}</span>}
      </div>

      {/* Lineup */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mic size={16} color="#A78BFA" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Lineup</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Who's performing or speaking</div>
            </div>
          </div>
          <button onClick={() => setShowLineupSection(v => !v)} style={{ background: 'rgba(168,139,250,0.15)', border: '1px solid rgba(168,139,250,0.3)', color: '#A78BFA', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={11} /> {showLineupSection ? 'Hide' : 'Add'}
          </button>
        </div>
        {showLineupSection && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([{ id: 'artist', label: 'Search Artist', icon: <Search size={12} />, color: '#A78BFA' }, { id: 'figure', label: 'Public Figure', icon: <Globe size={12} />, color: '#22C55E' }, { id: 'manual', label: 'Add Manually', icon: <UserPlus size={12} />, color: '#F59E0B' }] as const).map(tab => (
                <button key={tab.id} onClick={() => { setLineupSearchMode(tab.id); setArtistQuery(''); setArtistResults([]); setArtistError('') }}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: `1px solid ${lineupSearchMode === tab.id ? `${tab.color}50` : 'rgba(255,255,255,0.1)'}`, background: lineupSearchMode === tab.id ? `${tab.color}12` : 'rgba(255,255,255,0.03)', color: lineupSearchMode === tab.id ? tab.color : 'rgba(255,255,255,0.4)' }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {(lineupSearchMode === 'artist' || lineupSearchMode === 'figure') && (
              <>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}>
                    {artistSearching ? <Loader2 size={13} color="#A78BFA" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} color="rgba(255,255,255,0.4)" />}
                  </div>
                  <input style={{ ...inputStyle(), paddingLeft: 38 }} placeholder={lineupSearchMode === 'artist' ? 'Search artist e.g. Burna Boy, Adele…' : 'e.g. Aliko Dangote, Elon Musk…'} value={artistQuery} onChange={e => runSearch(e.target.value, lineupSearchMode)} />
                </div>
                {artistResults.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, marginBottom: 12 }}>
                    {artistResults.map(a => {
                      const added = featuredArtists.some(f => f.name === a.name)
                      return (
                        <div key={a.name} onClick={() => onAddArtist(a)} style={{ background: added ? 'rgba(34,197,94,0.08)' : 'rgba(168,139,250,0.06)', border: `1px solid ${added ? 'rgba(34,197,94,0.3)' : 'rgba(168,139,250,0.2)'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                          <div style={{ aspectRatio: '1/1', background: 'rgba(168,139,250,0.1)', position: 'relative' }}>
  {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={22} color="#A78BFA" /></div>}
  {added && <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={22} color="#22C55E" /></div>}
</div>
                          <div style={{ padding: '7px 9px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{a.listeners}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {artistError && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={12} />{artistError}</div>}
              </>
            )}

            {lineupSearchMode === 'manual' && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div onClick={() => manualArtistPhotoRef.current?.click()} style={{ width: 76, height: 76, borderRadius: 14, overflow: 'hidden', border: `2px dashed ${manualArtistPreview ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)'}`, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                   {manualArtistPreview ? <img src={manualArtistPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} /> : <ImageIcon size={18} color="rgba(255,255,255,0.4)" />}
                  </div>
                  <input ref={manualArtistPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleManualArtistPhoto} />
                  <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input style={{ ...inputStyle(), padding: '9px 12px', fontSize: 13 }} placeholder="Performer or speaker name" value={manualArtist.name} onChange={e => setManualArtist(a => ({ ...a, name: e.target.value }))} />
                    <textarea rows={2} style={{ ...inputStyle(), padding: '9px 12px', fontSize: 13 }} placeholder="Short bio…" value={manualArtist.bio} onChange={e => setManualArtist(a => ({ ...a, bio: e.target.value }))} />
                  </div>
                </div>
                <button onClick={submitManualArtist} disabled={!manualArtist.name.trim()} style={{ marginTop: 12, width: '100%', padding: 9, background: manualArtist.name.trim() ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${manualArtist.name.trim() ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 9, color: manualArtist.name.trim() ? '#F59E0B' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: manualArtist.name.trim() ? 'pointer' : 'not-allowed' }}>
                  Add to Lineup
                </button>
              </div>
            )}

            {featuredArtists.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginTop: 14 }}>
                {featuredArtists.map(a => (
                  <div key={a.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                   <div style={{ aspectRatio: '1/1', position: 'relative', background: 'rgba(168,139,250,0.1)' }}>
  {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="#A78BFA" /></div>}
  <button onClick={() => onRemoveArtist(a.name)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 6, width: 20, height: 20, cursor: 'pointer', color: '#fff' }}><X size={10} /></button>
</div>
                    <div style={{ padding: '7px 9px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                       <select value={a.role || 'Featured'} onChange={e => onUpdateArtistRole(a.name, e.target.value)} style={{ ...inputStyle(), padding: '3px 6px', fontSize: 10, borderRadius: 6 }}>
  {['Headliner', 'Featured', 'Keynote', 'Guest', 'Special Guest', 'DJ', 'Opening Act', 'Minister', 'Host'].map(r => (
    <option key={r} value={r} style={{ color: '#111827', background: '#fff' }}>{r}</option>
  ))}
</select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agenda */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={16} color="#3B82F6" />
            <div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Agenda</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Share your schedule</div></div>
          </div>
          <button onClick={() => { setShowAgenda(v => !v); if (agendaItems.length === 0) setTimeout(onAddAgenda, 10) }} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={11} /> {showAgenda ? 'Hide' : 'Add'}</button>
        </div>
        {showAgenda && (
          <div style={{ marginTop: 14 }}>
            {agendaItems.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="10:00 AM" value={item.time} onChange={e => onUpdateAgenda(item.id, 'time', e.target.value)} />
                <input style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="Session title" value={item.title} onChange={e => onUpdateAgenda(item.id, 'title', e.target.value)} />
                <input style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="Speaker (optional)" value={item.speaker || ''} onChange={e => onUpdateAgenda(item.id, 'speaker', e.target.value)} />
                <button onClick={() => onRemoveAgenda(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', color: '#F87171' }}><Trash2 size={12} /></button>
              </div>
            ))}
            <button onClick={onAddAgenda} style={{ background: 'transparent', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 9, padding: '8px 14px', color: '#3B82F6', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={12} /> Add another slot</button>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={16} color="#F59E0B" />
            <div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>FAQ</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Answer common questions early</div></div>
          </div>
          <button onClick={() => { setShowFAQ(v => !v); if (faqItems.length === 0) setTimeout(onAddFAQ, 10) }} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={11} /> {showFAQ ? 'Hide' : 'Add'}</button>
        </div>
        {showFAQ && (
          <div style={{ marginTop: 14 }}>
            {faqItems.map(item => (
              <div key={item.id} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...inputStyle(), flex: 1, padding: '8px 10px', fontSize: 12 }} placeholder="Question" value={item.question} onChange={e => onUpdateFAQ(item.id, 'question', e.target.value)} />
                  <button onClick={() => onRemoveFAQ(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', color: '#F87171' }}><Trash2 size={12} /></button>
                </div>
                <textarea rows={2} style={{ ...inputStyle(), padding: '8px 10px', fontSize: 12 }} placeholder="Answer…" value={item.answer} onChange={e => onUpdateFAQ(item.id, 'answer', e.target.value)} />
              </div>
            ))}
            <button onClick={onAddFAQ} style={{ background: 'transparent', border: '1px dashed rgba(245,158,11,0.3)', borderRadius: 9, padding: '8px 14px', color: '#F59E0B', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={12} /> Add another question</button>
          </div>
        )}
      </div>

      {/* Good to Know */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={16} color="#14B8A6" />
            <div><div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Good to Know</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Age, door time, parking</div></div>
          </div>
          <button onClick={() => setShowGoodToKnow(v => !v)} style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: '#14B8A6', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            {showGoodToKnow ? <><ChevronDown size={11} /> Hide</> : <><Plus size={11} /> Add</>}
          </button>
        </div>
        {showGoodToKnow && (
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            <input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="Age info e.g. 18+" value={goodToKnow.ageInfo} onChange={e => setGoodToKnow(g => ({ ...g, ageInfo: e.target.value }))} />
            <input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="Door time e.g. 6 PM" value={goodToKnow.doorTime} onChange={e => setGoodToKnow(g => ({ ...g, doorTime: e.target.value }))} />
            <input style={{ ...inputStyle(), padding: '8px 12px', fontSize: 12 }} placeholder="Parking info" value={goodToKnow.parkingInfo} onChange={e => setGoodToKnow(g => ({ ...g, parkingInfo: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Organizer */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Organizer Info</div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Organizer Name *</label>
          <input style={inputStyle(errors.organizerName)} placeholder="Your name or organization" value={form.organizerName} onChange={e => setForm({ ...form, organizerName: e.target.value })} />
          {errors.organizerName && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.organizerName}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email *</label>
            <input type="email" style={inputStyle(errors.organizerEmail)} placeholder="you@example.com" value={form.organizerEmail} onChange={e => setForm({ ...form, organizerEmail: e.target.value })} />
            {errors.organizerEmail && <span style={{ fontSize: 12, color: '#F87171' }}>{errors.organizerEmail}</span>}
          </div>
          <div>
            <label style={labelStyle}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
            <input type="tel" style={inputStyle()} placeholder="+234 801 234 5678" value={form.organizerPhone} onChange={e => setForm({ ...form, organizerPhone: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={labelStyle}><Users size={12} style={{ display: 'inline', marginRight: 4 }} />Max Performers / Entries</label>
          <input type="number" min="1" max="50" style={inputStyle()} value={form.maxPerformers} onChange={e => setForm({ ...form, maxPerformers: e.target.value })} />
        </div>
      </div>
    </div>
  )
}