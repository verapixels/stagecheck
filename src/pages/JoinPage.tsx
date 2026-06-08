import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp, doc, getDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  Music2, ChevronDown, Upload, Search, CheckCircle2,
  Loader2, CalendarDays, MapPin, AlertCircle, X, Check
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
interface FieldDef {
  id: string
  label: string
  description: string
  placeholder: string
  type: 'text' | 'email' | 'number' | 'date' | 'file' | 'select' | 'search'
  required: boolean
  alwaysOn: boolean
  options?: string[]
}

interface EventData {
  id: string
  name: string
  date: string
  location: string
  eventType: string
  enabledFields: string[]
  joinCode: string
  maxPerformers: number
  status: string
  submissionFields?: FieldDef[]
}

// ── Full field definitions (mirrors EventDashboard) ────────────────
const ALL_FIELD_DEFS: Record<string, FieldDef[]> = {
  choir: [
    { id: 'groupName',  label: 'Choir / Group name',    description: 'Full name of the choir or group',        placeholder: 'e.g. Grace Choral Society',      type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',      label: 'Contact email',          description: 'Email address for communications',      placeholder: 'e.g. contact@choirname.com',      type: 'email',  required: true,  alwaysOn: true  },
    { id: 'songSearch', label: 'Song search',            description: 'Live song search with clash detection', placeholder: 'Start typing a song title...',     type: 'search', required: true,  alwaysOn: true  },
    { id: 'conductor',  label: 'Conductor name',         description: 'Name of the lead conductor',            placeholder: 'e.g. Dr. Emeka Okonkwo',          type: 'text',   required: false, alwaysOn: false },
    { id: 'voiceParts', label: 'Voice parts',            description: 'e.g. SATB, SSA, TTBB',                 placeholder: 'e.g. SATB (4 parts)',             type: 'text',   required: false, alwaysOn: false },
    { id: 'choirSize',  label: 'Choir size',             description: 'Total number of singers',               placeholder: 'e.g. 45',                         type: 'number', required: false, alwaysOn: false },
    { id: 'photo',      label: 'Choir photo',            description: 'Group photo upload (JPG, PNG)',         placeholder: '',                                type: 'file',   required: false, alwaysOn: false },
  ],
  talent: [
    { id: 'performerName', label: 'Performer / group name', description: 'Stage name or group name',           placeholder: 'e.g. The Jazz Crew',             type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',         label: 'Contact email',           description: 'Email for performer communications', placeholder: 'e.g. performer@email.com',       type: 'email',  required: true,  alwaysOn: true  },
    { id: 'category',      label: 'Act category',            description: 'Type of performance',                placeholder: '',                               type: 'select', required: true,  alwaysOn: true,  options: ['Music', 'Dance', 'Comedy', 'Spoken Word', 'Drama', 'Other'] },
    { id: 'actTitle',      label: 'Performance title',       description: 'Name or title of the act',           placeholder: 'e.g. Afrobeat Medley',           type: 'text',   required: false, alwaysOn: false },
    { id: 'audio',         label: 'Audio / backing track',   description: 'MP3 or WAV upload',                  placeholder: '',                               type: 'file',   required: false, alwaysOn: false },
    { id: 'photo',         label: 'Performer photo',         description: 'Headshot or group photo',            placeholder: '',                               type: 'file',   required: false, alwaysOn: false },
    { id: 'social',        label: 'Social media link',       description: 'Instagram, TikTok, YouTube etc.',    placeholder: 'e.g. instagram.com/yourname',    type: 'text',   required: false, alwaysOn: false },
    { id: 'bio',           label: 'Short bio',               description: 'About the performer (max 150 words)', placeholder: 'Tell us about yourself...',     type: 'text',   required: false, alwaysOn: false },
  ],
  conference: [
    { id: 'speakerName', label: 'Speaker name',            description: 'Full name and title',              placeholder: 'e.g. Dr. Amaka Osei',             type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',       label: 'Contact email',            description: 'Speaker email address',            placeholder: 'e.g. speaker@email.com',          type: 'email', required: true,  alwaysOn: true  },
    { id: 'topic',       label: 'Session title / topic',   description: 'Duplicate detection enabled',      placeholder: 'e.g. AI in African Agriculture',  type: 'text',  required: true,  alwaysOn: true  },
    { id: 'bio',         label: 'Speaker bio',             description: 'Background for the programme',     placeholder: 'Tell delegates about yourself...', type: 'text',  required: false, alwaysOn: false },
    { id: 'photo',       label: 'Speaker photo',           description: 'Professional headshot',            placeholder: '',                                type: 'file',  required: false, alwaysOn: false },
    { id: 'slides',      label: 'Presentation file',       description: 'PDF or PPTX upload',              placeholder: '',                                type: 'file',  required: false, alwaysOn: false },
    { id: 'duration',    label: 'Requested session length', description: 'Preferred time slot',             placeholder: 'e.g. 30 minutes',                 type: 'text',  required: false, alwaysOn: false },
  ],
  competition: [
    { id: 'teamName',  label: 'Team / student name',   description: 'Team or individual participant name', placeholder: 'e.g. Team Alpha',              type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',     label: 'Contact email',          description: 'Team lead or parent email',          placeholder: 'e.g. team@email.com',          type: 'email',  required: true,  alwaysOn: true  },
    { id: 'category',  label: 'Competition category',   description: 'Category',                           placeholder: '',                             type: 'select', required: true,  alwaysOn: true,  options: ['Debate', 'Science', 'Mathematics', 'Music', 'Art', 'Sports', 'Other'] },
    { id: 'members',   label: 'Team members',           description: 'List all team participant names',    placeholder: 'e.g. Ada, Chidi, Ngozi',       type: 'text',   required: false, alwaysOn: false },
    { id: 'photo',     label: 'Team photo',             description: 'Group or individual photo',          placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'equipment', label: 'Required equipment',     description: 'Mic, projector, instruments etc.',  placeholder: 'e.g. Projector, whiteboard',   type: 'text',   required: false, alwaysOn: false },
  ],
  drama: [
    { id: 'dramaTitle', label: 'Drama title',          description: 'Duplicate title detection enabled', placeholder: 'e.g. The Last King',           type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',      label: 'Contact email',        description: 'Director or lead contact email',    placeholder: 'e.g. director@email.com',      type: 'email',  required: true,  alwaysOn: true  },
    { id: 'castSize',   label: 'Cast size',            description: 'Total number of cast members',      placeholder: 'e.g. 12',                      type: 'number', required: true,  alwaysOn: false },
    { id: 'duration',   label: 'Performance duration', description: 'Estimated run time',                placeholder: 'e.g. 25 minutes',              type: 'text',   required: false, alwaysOn: false },
    { id: 'poster',     label: 'Drama poster',         description: 'Production poster upload',          placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'script',     label: 'Script upload',        description: 'PDF script for review',             placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'stageNeeds', label: 'Stage requirements',   description: 'Props, lighting, set needs',        placeholder: 'e.g. 2 chairs, dim lighting',  type: 'text',   required: false, alwaysOn: false },
  ],
  worship: [
    { id: 'ministerName', label: 'Minister / leader name',  description: 'Name of person or group leading', placeholder: 'e.g. Pastor James Adeyemi',    type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',        label: 'Contact email',            description: 'Email for coordination',          placeholder: 'e.g. minister@church.com',     type: 'email',  required: true,  alwaysOn: true  },
    { id: 'songSearch',   label: 'Song search',              description: 'Song search with clash detection', placeholder: 'Start typing a song title...', type: 'search', required: true,  alwaysOn: true  },
    { id: 'photo',        label: 'Minister / group photo',   description: 'Photo for the programme',         placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'setDuration',  label: 'Set duration',             description: 'Length of worship set',           placeholder: 'e.g. 20 minutes',              type: 'text',   required: false, alwaysOn: false },
    { id: 'instruments',  label: 'Instruments needed',       description: 'Instruments required on stage',   placeholder: 'e.g. Keyboard, drums, bass',   type: 'text',   required: false, alwaysOn: false },
  ],
  openmic: [
    { id: 'performerName', label: 'Performer name',   description: 'Stage name or real name',  placeholder: 'e.g. Temi Bello',      type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',         label: 'Contact email',     description: 'Performer email',          placeholder: 'e.g. temi@email.com',  type: 'email',  required: true,  alwaysOn: true  },
    { id: 'actType',       label: 'Act type',          description: 'Type of performance',      placeholder: '',                     type: 'select', required: true,  alwaysOn: true,  options: ['Poetry', 'Comedy', 'Music', 'Rap', 'Spoken Word', 'Other'] },
    { id: 'actTitle',      label: 'Performance title', description: 'Title or name of the act', placeholder: 'e.g. Lagos at Night', type: 'text',   required: false, alwaysOn: false },
    { id: 'audio',         label: 'Audio upload',      description: 'Demo or backing track',    placeholder: '',                     type: 'file',   required: false, alwaysOn: false },
    { id: 'photo',         label: 'Performer photo',   description: 'Headshot',                 placeholder: '',                     type: 'file',   required: false, alwaysOn: false },
  ],
  graduation: [
    { id: 'awardeeName', label: 'Awardee / graduand name', description: 'Full legal name',               placeholder: 'e.g. Chidi Emmanuel Okeke',                 type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',       label: 'Contact email',            description: 'Awardee or parent email',       placeholder: 'e.g. awardee@email.com',                    type: 'email', required: true,  alwaysOn: true  },
    { id: 'award',       label: 'Award / programme',        description: 'Name of award or qualification', placeholder: 'e.g. Best Student Award',                  type: 'text',  required: true,  alwaysOn: true  },
    { id: 'photo',       label: 'Awardee photo',            description: 'Portrait photo',                placeholder: '',                                          type: 'file',  required: false, alwaysOn: false },
    { id: 'note',        label: 'Recognition note',         description: 'Short note for the programme',  placeholder: 'e.g. For outstanding academic achievement', type: 'text',  required: false, alwaysOn: false },
    { id: 'school',      label: 'School / department',      description: 'School or faculty name',        placeholder: 'e.g. Faculty of Engineering',               type: 'text',  required: false, alwaysOn: false },
  ],
  custom: [
    { id: 'entryName', label: 'Entry / participant name', description: 'Name of the participant or entry', placeholder: 'e.g. Participant name',      type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',     label: 'Contact email',             description: 'Contact email address',           placeholder: 'e.g. participant@email.com', type: 'email', required: true,  alwaysOn: true  },
    { id: 'details',   label: 'Entry details',             description: 'Any additional information',      placeholder: 'Enter details...',           type: 'text',  required: false, alwaysOn: false },
  ],
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  choir: '#22C55E', talent: '#F59E0B', conference: '#3B82F6',
  competition: '#8B5CF6', drama: '#EC4899', worship: '#14B8A6',
  openmic: '#F97316', graduation: '#06B6D4', custom: '#A78BFA',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  choir: 'Choir Concert', talent: 'Talent Show', conference: 'Conference',
  competition: 'School Competition', drama: 'Drama / Theatre', worship: 'Worship Night',
  openmic: 'Open Mic', graduation: 'Award / Graduation', custom: 'Custom Event',
}

// Popular songs for autocomplete demo
const POPULAR_SONGS = [
  'Amazing Grace', 'How Great Thou Art', 'Great Is Thy Faithfulness',
  'Oceans (Where Feet May Fail)', 'Waymaker', 'Goodness of God',
  'What A Beautiful Name', 'Holy Spirit', 'Do It Again', 'Reckless Love',
  'Build My Life', 'King of Kings', 'Living Hope', 'This Is Amazing Grace',
  'No Longer Slaves', 'Cornerstone', 'The Blessing', 'Graves Into Gardens',
  'Champion', 'Jireh', 'Battle Belongs', 'Hymn of Heaven',
]

export default function JoinPage() {
  const { joinCode } = useParams<{ joinCode: string }>()

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [fileNames, setFileNames]   = useState<Record<string, string>>({})
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Song search state
  const [songQuery, setSongQuery]     = useState('')
  const [songResults, setSongResults] = useState<string[]>([])
  const [songDropOpen, setSongDropOpen] = useState(false)
  const [selectedSong, setSelectedSong] = useState('')
  const [clashWarning, setClashWarning] = useState('')
  const songRef = useRef<HTMLDivElement>(null)

  // ── Fetch event by joinCode ──────────────────────────────────────
  useEffect(() => {
    if (!joinCode) { setNotFound(true); setLoading(false); return }
    ;(async () => {
      try {
        const q = query(collection(db, 'events'),   where('slug', '==', joinCode))
        const snap = await getDocs(q)
        if (snap.empty) { setNotFound(true); setLoading(false); return }
        const d = snap.docs[0]
        setEvent({ id: d.id, ...d.data() } as EventData)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [joinCode])

  // ── Song search autocomplete ─────────────────────────────────────
  useEffect(() => {
    if (songQuery.length < 2) { setSongResults([]); return }
    const q = songQuery.toLowerCase()
    setSongResults(POPULAR_SONGS.filter(s => s.toLowerCase().includes(q)).slice(0, 6))
    setSongDropOpen(true)
  }, [songQuery])

  // Close song dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (songRef.current && !songRef.current.contains(e.target as Node)) {
        setSongDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Check for song clashes ───────────────────────────────────────
  const checkSongClash = async (song: string) => {
    if (!event) return
    try {
      const subsSnap = await getDocs(collection(db, 'events', event.id, 'submissions'))
      const clash = subsSnap.docs.some(d => {
        const data = d.data()
        return (data.songSearch || data.song || '').toLowerCase() === song.toLowerCase()
      })
      setClashWarning(clash ? `"${song}" has already been chosen by another group. Please pick a different song.` : '')
    } catch {
      setClashWarning('')
    }
  }

  const handleSongSelect = (song: string) => {
    setSelectedSong(song)
    setSongQuery(song)
    setSongDropOpen(false)
    setFormValues(prev => ({ ...prev, songSearch: song }))
    checkSongClash(song)
  }

  // ── Get enabled fields ───────────────────────────────────────────
  const getEnabledFields = (): FieldDef[] => {
    if (!event) return []
    const allDefs = ALL_FIELD_DEFS[event.eventType] ?? ALL_FIELD_DEFS.custom
    return allDefs.filter(f => event.enabledFields.includes(f.id))
  }

  // ── Validation ───────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {}
    getEnabledFields().forEach(field => {
      if (field.required || field.alwaysOn) {
        const val = field.type === 'search' ? selectedSong : formValues[field.id]
        if (!val || val.trim() === '') {
          errs[field.id] = `${field.label} is required`
        }
      }
    })
    if (clashWarning) errs.songSearch = 'Please choose a different song'
    return errs
  }

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const payload: Record<string, any> = {
        ...formValues,
        status: 'pending',
        submittedAt: serverTimestamp(),
        eventId: event!.id,
        eventType: event!.eventType,
      }
      if (selectedSong) payload.songSearch = selectedSong

      await addDoc(collection(db, 'events', event!.id, 'submissions'), payload)
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const accentColor = event ? (EVENT_TYPE_COLORS[event.eventType] ?? '#22C55E') : '#22C55E'

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <PageShell accentColor="#22C55E">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 24px' }}>
        <Loader2 size={32} color="#22C55E" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading event...</p>
      </div>
    </PageShell>
  )

  // ── Not found ────────────────────────────────────────────────────
  if (notFound || !event) return (
    <PageShell accentColor="#F87171">
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Event not found
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          This invite link may have expired or the event doesn't exist.
        </p>
      </div>
    </PageShell>
  )

  // ── Success ──────────────────────────────────────────────────────
  if (submitted) return (
    <PageShell accentColor={accentColor}>
      <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `${accentColor}20`, border: `2px solid ${accentColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <CheckCircle2 size={40} color={accentColor} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          You're registered!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
          Your submission for <strong style={{ color: '#fff' }}>{event.name}</strong> has been received.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          The organiser will review your entry and get in touch via email.
        </p>
        <div style={{
          marginTop: 32, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 600 }}>Pending review</span>
          </div>
        </div>
      </div>
    </PageShell>
  )

  // ── Main form ────────────────────────────────────────────────────
  const enabledFields = getEnabledFields()
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <PageShell accentColor={accentColor}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Event header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${accentColor}15`, border: `1px solid ${accentColor}30`,
            padding: '4px 12px', borderRadius: 100, marginBottom: 16,
            fontSize: 12, color: accentColor, fontWeight: 600,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, animation: 'pulse 2s infinite' }} />
            {EVENT_TYPE_LABELS[event.eventType] ?? 'Event'}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.5px',
            color: '#fff', marginBottom: 12, lineHeight: 1.15,
          }}>
            {event.name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {eventDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                <CalendarDays size={13} color={accentColor} /> {eventDate}
              </span>
            )}
            {event.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                <MapPin size={13} color={accentColor} /> {event.location}
              </span>
            )}
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(19,26,46,0.8)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          padding: 'clamp(1.5rem, 4vw, 2rem)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              Register your entry
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Fill in the details below to submit your registration
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {enabledFields.map(field => (
              <FormField
                key={field.id}
                field={field}
                value={field.type === 'search' ? songQuery : (formValues[field.id] ?? '')}
                fileName={fileNames[field.id]}
                error={errors[field.id]}
                accentColor={accentColor}
                // song search props
                songDropOpen={field.type === 'search' ? songDropOpen : false}
                songResults={field.type === 'search' ? songResults : []}
                selectedSong={field.type === 'search' ? selectedSong : ''}
                clashWarning={field.type === 'search' ? clashWarning : ''}
                songRef={field.type === 'search' ? songRef : undefined}
                onChange={(val) => {
                  if (field.type === 'search') {
                    setSongQuery(val)
                    setSelectedSong('')
                    setSongDropOpen(true)
                  } else {
                    setFormValues(prev => ({ ...prev, [field.id]: val }))
                  }
                  setErrors(prev => ({ ...prev, [field.id]: '' }))
                }}
                onFileChange={(name) => setFileNames(prev => ({ ...prev, [field.id]: name }))}
                onSongSelect={handleSongSelect}
                onSongClear={() => { setSelectedSong(''); setSongQuery(''); setClashWarning('') }}
              />
            ))}
          </div>

          {submitError && (
            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#F87171',
            }}>
              <AlertCircle size={14} /> {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              marginTop: 28, width: '100%',
              background: submitting ? `${accentColor}80` : accentColor,
              border: 'none', color: '#0B1020',
              padding: '14px', borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {submitting
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
              : <><CheckCircle2 size={16} /> Submit Registration</>
            }
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>
          Powered by <span style={{ color: accentColor }}>StageCheck</span>
        </p>
      </div>
    </PageShell>
  )
}

// ── FormField component ────────────────────────────────────────────
interface FormFieldProps {
  field: FieldDef
  value: string
  fileName?: string
  error?: string
  accentColor: string
  songDropOpen: boolean
  songResults: string[]
  selectedSong: string
  clashWarning: string
  songRef?: React.RefObject<HTMLDivElement | null>
  onChange: (val: string) => void
  onFileChange: (name: string) => void
  onSongSelect: (song: string) => void
  onSongClear: () => void
}

function FormField({
  field, value, fileName, error, accentColor,
  songDropOpen, songResults, selectedSong, clashWarning, songRef,
  onChange, onFileChange, onSongSelect, onSongClear,
}: FormFieldProps) {
  const inputBase: React.CSSProperties = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, color: '#fff', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none', transition: 'border-color 0.2s',
  }

  const labelEl = (
    <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: 6 }}>
      {field.label}
      {(field.required || field.alwaysOn) && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}
    </label>
  )

  // Song search
  if (field.type === 'search') {
    return (
      <div ref={songRef}>
        {labelEl}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : selectedSong ? `${accentColor}50` : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, padding: '11px 14px', transition: 'border-color 0.2s',
          }}>
            <Music2 size={14} color={selectedSong ? accentColor : 'rgba(255,255,255,0.3)'} />
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)' }}
            />
            {selectedSong && (
              <button onClick={onSongClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
            {!selectedSong && <Search size={13} color="rgba(255,255,255,0.2)" />}
          </div>

          {/* Dropdown */}
          {songDropOpen && songResults.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
              background: 'rgba(15,20,40,0.98)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {songResults.map((s, i) => (
                <div
                  key={i}
                  onClick={() => onSongSelect(s)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Music2 size={12} color={accentColor} />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSong && !clashWarning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: accentColor }}>
            <Check size={12} /> Song selected — no clashes detected
          </div>
        )}
        {clashWarning && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6, fontSize: 12, color: '#F87171' }}>
            <AlertCircle size={12} style={{ marginTop: 1, flexShrink: 0 }} /> {clashWarning}
          </div>
        )}
        {error && !clashWarning && (
          <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{error}</span>
        )}
      </div>
    )
  }

  // File upload
  if (field.type === 'file') {
    return (
      <div>
        {labelEl}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.03)', border: `1px dashed ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 10, padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${accentColor}50`; e.currentTarget.style.background = `${accentColor}05` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        >
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onFileChange(f.name)
            }}
          />
          <Upload size={20} color={fileName ? accentColor : 'rgba(255,255,255,0.25)'} />
          <span style={{ fontSize: 13, color: fileName ? accentColor : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            {fileName || 'Click to upload file'}
          </span>
          {fileName && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Click to change</span>}
        </label>
        {error && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{error}</span>}
      </div>
    )
  }

  // Select
  if (field.type === 'select') {
    return (
      <div>
        {labelEl}
        <div style={{ position: 'relative' }}>
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputBase, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
            onFocus={e => e.currentTarget.style.borderColor = `${accentColor}60`}
            onBlur={e => e.currentTarget.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}
          >
            <option value="" style={{ background: '#0B1020' }}>Select {field.label.toLowerCase()}...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt} style={{ background: '#0B1020' }}>{opt}</option>
            ))}
          </select>
          <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        {error && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{error}</span>}
      </div>
    )
  }

  // Textarea for bio / details
  if (field.id === 'bio' || field.id === 'details' || field.id === 'note') {
    return (
      <div>
        {labelEl}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => e.currentTarget.style.borderColor = `${accentColor}60`}
          onBlur={e => e.currentTarget.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}
        />
        {error && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{error}</span>}
      </div>
    )
  }

  // Default: text / email / number
  return (
    <div>
      {labelEl}
      <input
        type={field.type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        style={inputBase}
        onFocus={e => e.currentTarget.style.borderColor = `${accentColor}60`}
        onBlur={e => e.currentTarget.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}
      />
      {error && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>{error}</span>}
    </div>
  )
}

// ── Page shell (no auth, standalone) ──────────────────────────────
function PageShell({ children, accentColor }: { children: React.ReactNode; accentColor: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(34,197,94,0.06) 0%, transparent 60%), #0B1020',
      fontFamily: 'var(--font-body)',
      color: '#fff',
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
          Stage<span style={{ color: accentColor }}>Check</span>
        </span>
      </div>

      {children}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes popIn { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #0B1020; }
      `}</style>
    </div>
  )
}