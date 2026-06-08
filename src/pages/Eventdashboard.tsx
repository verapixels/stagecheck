import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  Users, Music2, Shield, Trophy, Ticket, Radio, Package,
  MessageSquare, Film, BarChart3, Star, CheckCircle2,
  Check, ChevronDown, Settings2, Eye, Hash, Copy,
  CalendarDays, MapPin, Mic2, GraduationCap,
  Heart, Presentation, Sparkles, Loader2
} from 'lucide-react'
import DashboardLayout, { EVENT_TYPE_LABELS } from '../components/DashboardLayout'
import { useEventMeta } from '../lib/useEventMeta'



const SUBMISSION_FIELDS: Record<string, {
  id: string; label: string; description: string; placeholder: string
  type: 'text' | 'email' | 'number' | 'date' | 'file' | 'select' | 'search'
  required: boolean; alwaysOn: boolean; options?: string[]
}[]> = {
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
    { id: 'performerName', label: 'Performer / group name', description: 'Stage name or group name',             placeholder: 'e.g. The Jazz Crew',           type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',         label: 'Contact email',           description: 'Email for performer communications',   placeholder: 'e.g. performer@email.com',     type: 'email',  required: true,  alwaysOn: true  },
    { id: 'category',      label: 'Act category',            description: 'Type of performance',                  placeholder: '',                             type: 'select', required: true,  alwaysOn: true,  options: ['Music', 'Dance', 'Comedy', 'Spoken Word', 'Drama', 'Other'] },
    { id: 'actTitle',      label: 'Performance title',       description: 'Name or title of the act',             placeholder: 'e.g. Afrobeat Medley',         type: 'text',   required: false, alwaysOn: false },
    { id: 'audio',         label: 'Audio / backing track',   description: 'MP3 or WAV upload',                    placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'photo',         label: 'Performer photo',         description: 'Headshot or group photo',              placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'social',        label: 'Social media link',       description: 'Instagram, TikTok, YouTube etc.',      placeholder: 'e.g. instagram.com/yourname',  type: 'text',   required: false, alwaysOn: false },
    { id: 'bio',           label: 'Short bio',               description: 'About the performer (max 150 words)', placeholder: 'Tell us about yourself...',     type: 'text',   required: false, alwaysOn: false },
  ],
  conference: [
    { id: 'speakerName', label: 'Speaker name',            description: 'Full name and title',               placeholder: 'e.g. Dr. Amaka Osei',             type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',       label: 'Contact email',            description: 'Speaker email address',             placeholder: 'e.g. speaker@email.com',          type: 'email', required: true,  alwaysOn: true  },
    { id: 'topic',       label: 'Session title / topic',   description: 'Duplicate detection enabled',       placeholder: 'e.g. AI in African Agriculture',  type: 'text',  required: true,  alwaysOn: true  },
    { id: 'bio',         label: 'Speaker bio',             description: 'Background for the programme',      placeholder: 'Tell delegates about yourself...',type: 'text',  required: false, alwaysOn: false },
    { id: 'photo',       label: 'Speaker photo',           description: 'Professional headshot',             placeholder: '',                                type: 'file',  required: false, alwaysOn: false },
    { id: 'slides',      label: 'Presentation file',       description: 'PDF or PPTX upload',               placeholder: '',                                type: 'file',  required: false, alwaysOn: false },
    { id: 'duration',    label: 'Requested session length',description: 'Preferred time slot',              placeholder: 'e.g. 30 minutes',                 type: 'text',  required: false, alwaysOn: false },
  ],
  competition: [
    { id: 'teamName',  label: 'Team / student name',   description: 'Team or individual participant name',   placeholder: 'e.g. Team Alpha',              type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',     label: 'Contact email',          description: 'Team lead or parent email',            placeholder: 'e.g. team@email.com',          type: 'email',  required: true,  alwaysOn: true  },
    { id: 'category',  label: 'Competition category',   description: 'Category auto-activates relevant tools', placeholder: '',                           type: 'select', required: true,  alwaysOn: true,  options: ['Debate', 'Science', 'Mathematics', 'Music', 'Art', 'Sports', 'Other'] },
    { id: 'members',   label: 'Team members',           description: 'List all team participant names',      placeholder: 'e.g. Ada, Chidi, Ngozi',       type: 'text',   required: false, alwaysOn: false },
    { id: 'photo',     label: 'Team photo',             description: 'Group or individual photo',            placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'equipment', label: 'Required equipment',     description: 'Mic, projector, instruments etc.',    placeholder: 'e.g. Projector, whiteboard',   type: 'text',   required: false, alwaysOn: false },
  ],
  drama: [
    { id: 'dramaTitle', label: 'Drama title',          description: 'Duplicate title detection enabled',  placeholder: 'e.g. The Last King',           type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',      label: 'Contact email',        description: 'Director or lead contact email',     placeholder: 'e.g. director@email.com',      type: 'email',  required: true,  alwaysOn: true  },
    { id: 'castSize',   label: 'Cast size',            description: 'Total number of cast members',       placeholder: 'e.g. 12',                      type: 'number', required: true,  alwaysOn: false },
    { id: 'duration',   label: 'Performance duration', description: 'Estimated run time',                 placeholder: 'e.g. 25 minutes',              type: 'text',   required: false, alwaysOn: false },
    { id: 'poster',     label: 'Drama poster',         description: 'Production poster upload',           placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'script',     label: 'Script upload',        description: 'PDF script for review',              placeholder: '',                             type: 'file',   required: false, alwaysOn: false },
    { id: 'stageNeeds', label: 'Stage requirements',   description: 'Props, lighting, set needs',         placeholder: 'e.g. 2 chairs, dim lighting',  type: 'text',   required: false, alwaysOn: false },
  ],
  worship: [
    { id: 'ministerName', label: 'Minister / leader name',  description: 'Name of person or group leading',  placeholder: 'e.g. Pastor James Adeyemi',   type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',        label: 'Contact email',            description: 'Email for coordination',           placeholder: 'e.g. minister@church.com',    type: 'email',  required: true,  alwaysOn: true  },
    { id: 'songSearch',   label: 'Song search',              description: 'Song search with clash detection', placeholder: 'Start typing a song title...',type: 'search', required: true,  alwaysOn: true  },
    { id: 'photo',        label: 'Minister / group photo',   description: 'Photo for the programme',          placeholder: '',                            type: 'file',   required: false, alwaysOn: false },
    { id: 'setDuration',  label: 'Set duration',             description: 'Length of worship set',            placeholder: 'e.g. 20 minutes',             type: 'text',   required: false, alwaysOn: false },
    { id: 'instruments',  label: 'Instruments needed',       description: 'Instruments required on stage',    placeholder: 'e.g. Keyboard, drums, bass',  type: 'text',   required: false, alwaysOn: false },
  ],
  openmic: [
    { id: 'performerName', label: 'Performer name',   description: 'Stage name or real name',   placeholder: 'e.g. Temi Bello',      type: 'text',   required: true,  alwaysOn: true  },
    { id: 'email',         label: 'Contact email',     description: 'Performer email',           placeholder: 'e.g. temi@email.com',  type: 'email',  required: true,  alwaysOn: true  },
    { id: 'actType',       label: 'Act type',          description: 'Type of performance',       placeholder: '',                     type: 'select', required: true,  alwaysOn: true,  options: ['Poetry', 'Comedy', 'Music', 'Rap', 'Spoken Word', 'Other'] },
    { id: 'actTitle',      label: 'Performance title', description: 'Title or name of the act', placeholder: 'e.g. Lagos at Night',  type: 'text',   required: false, alwaysOn: false },
    { id: 'audio',         label: 'Audio upload',      description: 'Demo or backing track',     placeholder: '',                     type: 'file',   required: false, alwaysOn: false },
    { id: 'photo',         label: 'Performer photo',   description: 'Headshot',                  placeholder: '',                     type: 'file',   required: false, alwaysOn: false },
  ],
  graduation: [
    { id: 'awardeeName', label: 'Awardee / graduand name', description: 'Full legal name',                  placeholder: 'e.g. Chidi Emmanuel Okeke',              type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',       label: 'Contact email',            description: 'Awardee or parent email',          placeholder: 'e.g. awardee@email.com',                 type: 'email', required: true,  alwaysOn: true  },
    { id: 'award',       label: 'Award / programme',        description: 'Name of award or qualification',   placeholder: 'e.g. Best Student Award',                type: 'text',  required: true,  alwaysOn: true  },
    { id: 'photo',       label: 'Awardee photo',            description: 'Portrait photo',                   placeholder: '',                                       type: 'file',  required: false, alwaysOn: false },
    { id: 'note',        label: 'Recognition note',         description: 'Short note for the programme',     placeholder: 'e.g. For outstanding academic achievement', type: 'text', required: false, alwaysOn: false },
    { id: 'school',      label: 'School / department',      description: 'School or faculty name',           placeholder: 'e.g. Faculty of Engineering',            type: 'text',  required: false, alwaysOn: false },
  ],
  custom: [
    { id: 'entryName', label: 'Entry / participant name', description: 'Name of the participant or entry', placeholder: 'e.g. Participant name',      type: 'text',  required: true,  alwaysOn: true  },
    { id: 'email',     label: 'Contact email',             description: 'Contact email address',            placeholder: 'e.g. participant@email.com', type: 'email', required: true,  alwaysOn: true  },
    { id: 'details',   label: 'Entry details',             description: 'Any additional information',       placeholder: 'Enter details...',           type: 'text',  required: false, alwaysOn: false },
  ],
}

const ALL_MODULES = [
  { id: 'music',     icon: <Music2 size={16} />,        label: 'Music Submissions',   description: 'Song search, audio uploads, metadata',       color: '#22C55E' },
  { id: 'clash',     icon: <Shield size={16} />,        label: 'Clash Detection',     description: 'Prevent duplicate songs, slots, performers',  color: '#22C55E' },
  { id: 'judging',   icon: <Trophy size={16} />,        label: 'Judging & Scoring',   description: 'Judge panels, live scoring, rankings',         color: '#F59E0B' },
  { id: 'live',      icon: <Radio size={16} />,         label: 'Live Stage Control',  description: 'Real-time stage management during the event', color: '#F97316' },
  { id: 'ticketing', icon: <Ticket size={16} />,        label: 'Ticketing',           description: 'Ticket creation, QR codes, attendance',       color: '#EC4899' },
  { id: 'resources', icon: <Package size={16} />,       label: 'Resource Management', description: 'Mics, instruments, rooms, stage time',         color: '#8B5CF6' },
  { id: 'messaging', icon: <MessageSquare size={16} />, label: 'Communication',       description: 'Announcements and performer messaging',        color: '#14B8A6' },
  { id: 'analytics', icon: <BarChart3 size={16} />,     label: 'Analytics',           description: 'Participation rates, metrics, reports',       color: '#06B6D4' },
  { id: 'media',     icon: <Film size={16} />,          label: 'Media Hub',           description: 'Upload videos, recordings, highlights',       color: '#3B82F6' },
  { id: 'voting',    icon: <Star size={16} />,          label: 'Live Voting',         description: 'Audience votes and live poll results',         color: '#A78BFA' },
]

const EVENT_STATS: Record<string, { label: string; value: string; sub: string }[]> = {
  choir:       [
    { label: 'Choirs Registered', value: '0',  sub: 'of 50 max'          },
    { label: 'Songs Submitted',   value: '0',  sub: 'unique titles only'  },
    { label: 'Clashes Detected',  value: '0',  sub: 'need resolution'     },
    { label: 'Days to Event',     value: '--', sub: 'set your event date' },
  ],
  talent: [
    { label: 'Performers Signed Up', value: '0',  sub: 'of 50 max'             },
    { label: 'Acts Submitted',       value: '0',  sub: 'across all categories' },
    { label: 'Slot Conflicts',       value: '0',  sub: 'need resolution'       },
    { label: 'Days to Event',        value: '--', sub: 'set your event date'   },
  ],
  conference: [
    { label: 'Speakers Confirmed', value: '0',  sub: 'of 50 max'          },
    { label: 'Sessions Submitted', value: '0',  sub: 'across all tracks'  },
    { label: 'Duplicate Topics',   value: '0',  sub: 'flagged for review' },
    { label: 'Days to Event',      value: '--', sub: 'set your event date'},
  ],
  competition: [
    { label: 'Teams Entered',     value: '0',  sub: 'of 50 max'          },
    { label: 'Entries Submitted', value: '0',  sub: 'across categories'  },
    { label: 'Rule Violations',   value: '0',  sub: 'flagged for review' },
    { label: 'Days to Event',     value: '--', sub: 'set your event date'},
  ],
  drama: [
    { label: 'Productions',     value: '0',  sub: 'registered'         },
    { label: 'Total Cast',      value: '0',  sub: 'across all dramas'  },
    { label: 'Stage Conflicts', value: '0',  sub: 'need resolution'    },
    { label: 'Days to Event',   value: '--', sub: 'set your event date'},
  ],
  worship: [
    { label: 'Ministers',       value: '0',  sub: 'confirmed'          },
    { label: 'Songs Submitted', value: '0',  sub: 'total across sets'  },
    { label: 'Song Clashes',    value: '0',  sub: 'need resolution'    },
    { label: 'Days to Event',   value: '--', sub: 'set your event date'},
  ],
  openmic: [
    { label: 'Performers',    value: '0',  sub: 'signed up'          },
    { label: 'Acts Submitted',value: '0',  sub: 'total'              },
    { label: 'Slot Conflicts',value: '0',  sub: 'need resolution'    },
    { label: 'Days to Event', value: '--', sub: 'set your event date'},
  ],
  graduation: [
    { label: 'Awardees',        value: '0',  sub: 'registered'         },
    { label: 'Awards',          value: '0',  sub: 'categories'         },
    { label: 'Protocol Issues', value: '0',  sub: 'flagged'            },
    { label: 'Days to Event',   value: '--', sub: 'set your event date'},
  ],
  custom: [
    { label: 'Participants',  value: '0',  sub: 'registered'         },
    { label: 'Submissions',   value: '0',  sub: 'total'              },
    { label: 'Issues',        value: '0',  sub: 'flagged'            },
    { label: 'Days to Event', value: '--', sub: 'set your event date'},
  ],
}

type DashboardTab = 'overview' | 'submissions' | 'modules'

export default function EventDashboard() {
  const { eventId } = useParams<{ eventId: string }>()
  const { enabledModules: metaModules, loading: metaLoading } = useEventMeta(eventId)
  const [eventData, setEventData] = useState<any>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(doc(db, 'events', eventId), (snap) => {
      if (snap.exists()) setEventData({ id: snap.id, ...snap.data() })
      setLoadingEvent(false)
    })
    return () => unsub()
  }, [eventId])

  const eventType     = eventData?.eventType     ?? 'custom'
  const eventName     = eventData?.name          ?? 'My Event'
  const eventDate     = eventData?.date          ?? ''
  const eventLocation = eventData?.location      ?? ''
  const joinCode      = eventData?.joinCode      ?? ''
  const plan          = 'starter'

  const typeLabels = EVENT_TYPE_LABELS[eventType] ?? EVENT_TYPE_LABELS.custom
  const fields     = SUBMISSION_FIELDS[eventType] ?? SUBMISSION_FIELDS.custom
  const stats      = EVENT_STATS[eventType]       ?? EVENT_STATS.custom

  const [enabledFields, setEnabledFields] = useState<string[]>([])
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  // Sync enabled fields/modules from Firestore data once loaded
  useEffect(() => {
    if (!eventData) return
    setEnabledFields(
      eventData.enabledFields ?? fields.filter((f: any) => f.required || f.alwaysOn).map((f: any) => f.id)
    )
    setEnabledModules(eventData.enabledModules ?? [])
  }, [eventData])


  const toggleField = (id: string) => {
    const field = fields.find((f: any) => f.id === id)
    if (!field || field.alwaysOn) return
    setEnabledFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  const toggleModule = (id: string) => {
    setEnabledModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  const enabledFieldObjects = fields.filter((f: any) => enabledFields.includes(f.id))

  const tabStyle = (tab: DashboardTab): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: activeTab === tab ? 600 : 400,
    fontFamily: 'var(--font-body)',
    background: activeTab === tab ? 'rgba(34,197,94,0.12)' : 'transparent',
    color: activeTab === tab ? '#22C55E' : 'rgba(255,255,255,0.5)',
    transition: 'all 0.15s',
    borderBottom: activeTab === tab ? '2px solid #22C55E' : '2px solid transparent',
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  })

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '20px 24px',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12,
  }

  if (loadingEvent) return (
    <DashboardLayout plan="starter" eventType="custom">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', padding: '40px' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading event...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )

  if (!eventData) return (
    <DashboardLayout plan="starter" eventType="custom">
      <div style={{ color: '#F87171', padding: '40px' }}>Event not found.</div>
    </DashboardLayout>
  )

  return (
  <DashboardLayout plan={plan} eventType={metaLoading ? undefined : eventType} eventId={eventId} enabledModules={metaModules}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${typeLabels.color}15`, border: `1px solid ${typeLabels.color}30`,
              borderRadius: 8, padding: '4px 12px',
            }}>
              <span style={{ color: typeLabels.color, display: 'flex', alignItems: 'center' }}>{typeLabels.icon}</span>
              <span style={{ fontSize: 12, color: typeLabels.color, fontWeight: 600 }}>{typeLabels.dashboardTitle}</span>
            </div>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.5px', color: '#fff', marginBottom: 4,
          }}>
            {eventName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {eventDate && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CalendarDays size={13} />
                {new Date(eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {eventLocation && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} /> {eventLocation}
              </span>
            )}
         </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        <button style={tabStyle('overview')}     onClick={() => setActiveTab('overview')}>Overview</button>
        <button style={tabStyle('submissions')}  onClick={() => setActiveTab('submissions')}>Submission Form</button>
        <button style={tabStyle('modules')}      onClick={() => setActiveTab('modules')}>Modules</button>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: i === 2 && stat.value !== '0' ? '#F87171' : '#fff', marginBottom: 4 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="overview-grid">
            <div style={cardStyle}>
              <div style={sectionLabel}>Active Modules ({enabledModules.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {enabledModules.length === 0 ? (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No modules enabled</span>
                ) : enabledModules.map(id => {
                  const mod = ALL_MODULES.find(m => m.id === id)
                  if (!mod) return null
                  return (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, background: `${mod.color}12`, border: `1px solid ${mod.color}25`, color: mod.color, padding: '4px 10px', borderRadius: 6 }}>
                      {mod.icon} {mod.label}
                    </span>
                  )
                })}
              </div>
              <button onClick={() => setActiveTab('modules')} style={{ marginTop: 14, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                <Settings2 size={13} /> Manage modules
              </button>
            </div>

            <div style={cardStyle}>
              <div style={sectionLabel}>Submission Form ({enabledFieldObjects.length} fields)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {enabledFieldObjects.map(field => (
                  <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={13} color="#22C55E" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                      {field.label}
                      {(field.required || field.alwaysOn) && <span style={{ fontSize: 11, color: '#F87171', marginLeft: 4 }}>*</span>}
                    </span>
                    {field.type === 'search' && (
                      <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '1px 6px', borderRadius: 4, marginLeft: 'auto' }}>smart search</span>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('submissions')} style={{ marginTop: 14, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                <Settings2 size={13} /> Edit form fields
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── SUBMISSION FORM TAB ── */}
      {activeTab === 'submissions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }} className="fields-grid">
          <div style={cardStyle}>
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel}>Choose which fields performers fill in</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Fields marked "always on" are required and cannot be removed.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((field: any) => {
                const isEnabled = enabledFields.includes(field.id)
                return (
                  <div key={field.id} onClick={() => toggleField(field.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${isEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`, background: isEnabled ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)', cursor: field.alwaysOn ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: isEnabled ? '#22C55E' : 'transparent', border: `1.5px solid ${isEnabled ? '#22C55E' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      {isEnabled && <Check size={12} color="#0B1020" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: isEnabled ? '#fff' : 'rgba(255,255,255,0.5)' }}>{field.label}</span>
                        {(field.required || field.alwaysOn) && <span style={{ fontSize: 10, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)', padding: '1px 6px', borderRadius: 4 }}>{field.alwaysOn ? 'always on' : 'required'}</span>}
                        {field.type === 'search' && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '1px 6px', borderRadius: 4 }}>smart search</span>}
                        {field.type === 'file' && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)', padding: '1px 6px', borderRadius: 4 }}>file upload</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{field.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live preview */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={sectionLabel}>Live preview</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>What performers see when they register</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#22C55E' }}>
                  <Eye size={13} /> {enabledFieldObjects.length} fields
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{eventName}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Fill in the details below to register</div>
                {enabledFieldObjects.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>No fields selected.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {enabledFieldObjects.map((field: any) => (
                      <div key={field.id}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>
                          {field.label}{(field.required || field.alwaysOn) && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}
                        </label>
                        {field.type === 'search' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '9px 12px' }}>
                            <Music2 size={13} color="#22C55E" />
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{field.placeholder}</span>
                          </div>
                        ) : field.type === 'file' ? (
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Click to upload file</div>
                          </div>
                        ) : field.type === 'select' ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px' }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Select {field.label.toLowerCase()}</span>
                            <ChevronDown size={13} color="rgba(255,255,255,0.3)" />
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
                            {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          </div>
                        )}
                      </div>
                    ))}
                    <button style={{ marginTop: 4, background: typeLabels.color, border: 'none', color: '#0B1020', padding: '11px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', width: '100%' }}>
                      Submit Registration
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULES TAB ── */}
      {activeTab === 'modules' && (
        <div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 20 }}>
            Enable or disable features for this event. Only active modules appear in the sidebar.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {ALL_MODULES.map(mod => {
              const isOn = enabledModules.includes(mod.id)
              return (
                <div key={mod.id} onClick={() => toggleModule(mod.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, cursor: 'pointer', border: `1px solid ${isOn ? `${mod.color}30` : 'rgba(255,255,255,0.07)'}`, background: isOn ? `${mod.color}08` : 'rgba(19,26,46,0.5)', transition: 'all 0.2s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: isOn ? `${mod.color}15` : 'rgba(255,255,255,0.05)', border: `1px solid ${isOn ? `${mod.color}25` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOn ? mod.color : 'rgba(255,255,255,0.25)' }}>
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isOn ? '#fff' : 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{mod.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{mod.description}</div>
                  </div>
                  <div style={{ width: 38, height: 22, borderRadius: 11, flexShrink: 0, background: isOn ? mod.color : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: isOn ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ ...cardStyle, marginTop: 20 }}>
            <div style={sectionLabel}>{enabledModules.length} module{enabledModules.length !== 1 ? 's' : ''} active</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {enabledModules.length === 0 ? (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No modules enabled</span>
              ) : enabledModules.map(id => {
                const mod = ALL_MODULES.find(m => m.id === id)
                if (!mod) return null
                return (
                  <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, background: `${mod.color}12`, border: `1px solid ${mod.color}25`, color: mod.color, padding: '4px 10px', borderRadius: 6 }}>
                    {mod.icon} {mod.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .overview-grid { grid-template-columns: 1fr !important; }
          .fields-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}