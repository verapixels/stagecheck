import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/Authcontext'
import { generateLocalSummary, generateLocalDescription } from '../lib/Eventcontentlibrary'

import OnboardingHeader from '../components/onboarding/OnboardingHeader'
import OnboardingStepRow from '../components/onboarding/OnboardingStepRow'
import OnboardingLivePreview from '../components/onboarding/OnboardingLivePreview'
import OnboardingFooterBar from '../components/onboarding/OnboardingFooterBar'
import OnboardingEventTypeStep from '../components/onboarding/OnboardingEventTypeStep'
import OnboardingEventDetailsStep from '../components/onboarding/OnboardingEventDetailsStep'
import OnboardingModulesStep from '../components/onboarding/OnboardingModulesStep'
import { EVENT_TYPES, DEFAULT_MODULES, DEFAULT_SUBMISSION_FIELDS, generateEventCode } from '../components/onboarding/onboardingConstants'
import type {
  OnboardingForm, OnboardingStep, MediaItem, FeaturedArtist,
  AgendaItem, FAQItem, GoodToKnow, RepeatingDate,
} from '../components/onboarding/onboardingTypes'

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [eventCode] = useState(generateEventCode)

  const [activeStep, setActiveStep] = useState<OnboardingStep>('event-type')
  const [selectedType, setSelectedType] = useState('')
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const descRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<OnboardingForm>({
    eventName: '', summary: '', eventDate: '', endDate: '',
    startTime: '', endTime: '', isRepeating: false,
    venue: '', address: '', locationType: 'venue',
    description: '', organizerName: '', organizerEmail: '', organizerPhone: '', maxPerformers: '50',
  })

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([])
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [faqItems, setFaqItems] = useState<FAQItem[]>([])
  const [goodToKnow, setGoodToKnow] = useState<GoodToKnow>({ ageInfo: '', doorTime: '', parkingInfo: '' })
  const [repeatingDates, setRepeatingDates] = useState<RepeatingDate[]>([])
  const onAddMultipleDates = (dates: string[]) => {
    setRepeatingDates(prev => [
      ...prev,
      ...dates.map(date => ({ id: crypto.randomUUID(), date, startTime: '', endTime: '', notes: '' })),
    ])
  }
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)

  const selectedTypeData = EVENT_TYPES.find(t => t.id === selectedType)
  const imageCount = mediaItems.filter(m => m.type === 'image').length
  const videoCount = mediaItems.filter(m => m.type === 'video').length

  // ── Event type ──────────────────────────────────────────────
  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId)
    setEnabledModules(DEFAULT_MODULES[typeId] || [])
  }

  // ── Media ───────────────────────────────────────────────────
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || imageCount >= 2) return
    const reader = new FileReader()
    reader.onload = ev => setMediaItems(prev => [...prev, { id: Date.now().toString(), file, preview: ev.target?.result as string, type: 'image' }])
    reader.readAsDataURL(file); e.target.value = ''
  }
  const handleAddVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || videoCount >= 2) return
    setMediaItems(prev => [...prev, { id: Date.now().toString(), file, preview: URL.createObjectURL(file), type: 'video' }]); e.target.value = ''
  }
  const removeMedia = (id: string) => setMediaItems(prev => prev.filter(m => m.id !== id))

  // ── Lineup ──────────────────────────────────────────────────
  const addArtist = (artist: FeaturedArtist) => {
    if (featuredArtists.find(a => a.name.toLowerCase() === artist.name.toLowerCase())) return
    setFeaturedArtists(prev => [...prev, { ...artist, role: 'Featured' }])
  }
  const removeArtist = (name: string) => setFeaturedArtists(prev => prev.filter(a => a.name !== name))
  const updateArtistRole = (name: string, role: string) => setFeaturedArtists(prev => prev.map(a => a.name === name ? { ...a, role } : a))
  const addManualArtist = async (manual: { name: string; bio: string }, photo: File | null, preview: string) => {
    let imageUrl = ''
    if (photo) {
      try {
        const storageRef = ref(storage, `events/${eventCode}/artist_${Date.now()}_${photo.name}`)
        await uploadBytes(storageRef, photo)
        imageUrl = await getDownloadURL(storageRef)
      } catch { imageUrl = preview }
    }
    setFeaturedArtists(prev => [...prev, { name: manual.name, image: imageUrl || preview, genre: 'Artist', listeners: '—', bio: manual.bio, role: 'Featured' }])
  }

  // ── Agenda / FAQ / Repeating dates ─────────────────────────
  const addAgendaItem = () => setAgendaItems(prev => [...prev, { id: Date.now().toString(), time: '', title: '', speaker: '' }])
  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: string) => setAgendaItems(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  const removeAgendaItem = (id: string) => setAgendaItems(prev => prev.filter(a => a.id !== id))

  const addFAQ = () => setFaqItems(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }])
  const updateFAQ = (id: string, field: keyof FAQItem, value: string) => setFaqItems(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  const removeFAQ = (id: string) => setFaqItems(prev => prev.filter(f => f.id !== id))

  const addRepeatingDate = () => setRepeatingDates(prev => [...prev, { id: Date.now().toString(), date: '', startTime: '', endTime: '', notes: '' }])
  const updateRepeatingDate = (id: string, field: keyof RepeatingDate, value: string) => setRepeatingDates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  const removeRepeatingDate = (id: string) => setRepeatingDates(prev => prev.filter(r => r.id !== id))

  // ── AI helpers ──────────────────────────────────────────────
  const handleGenerateSummary = async () => {
    if (!form.eventName.trim() || generatingSummary) return
    setGeneratingSummary(true)
    try {
      const s = generateLocalSummary(form.eventName, selectedTypeData?.label || 'event', form.venue)
      if (s) setForm(f => ({ ...f, summary: s }))
    } finally { setGeneratingSummary(false) }
  }

  const handleGenerateDescription = async () => {
    if (!form.eventName.trim() || generatingDescription) return
    setGeneratingDescription(true)
    try {
      const d = generateLocalDescription(form.eventName, selectedTypeData?.label || 'event', form.venue)
      if (d) {
        const html = d.replace(/\n\n/g, '<br><br>')
        const current = descRef.current ? descRef.current.innerHTML : ''
        const newHtml = html + (current ? '<br><br>' + current : '')
        if (descRef.current) descRef.current.innerHTML = newHtml
        setForm(prev => ({ ...prev, description: newHtml }))
      }
    } finally { setGeneratingDescription(false) }
  }

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.eventName.trim()) e.eventName = 'Event name is required'
    if (!form.eventDate) e.eventDate = 'Event date is required'
    if (!form.startTime) e.startTime = 'Start time is required'
    if (form.locationType === 'venue' && !form.venue.trim()) e.venue = 'Venue is required'
    if (form.locationType === 'venue' && !form.address.trim()) e.address = 'Address is required'
    const descContent = (descRef.current?.innerHTML || form.description || '').replace(/<[^>]*>/g, '').trim()
    if (!descContent) e.description = 'Description is required'
    if (!form.organizerName.trim()) e.organizerName = 'Organizer name is required'
    if (!form.organizerEmail.trim()) e.organizerEmail = 'Organizer email is required'
    return e
  }

  // ── Step navigation ─────────────────────────────────────────
  const STEP_ORDER: OnboardingStep[] = ['event-type', 'event-details', 'modules']
  const stepDone = (s: OnboardingStep) => STEP_ORDER.indexOf(activeStep) > STEP_ORDER.indexOf(s)

  const goToStep = (s: OnboardingStep) => {
    if (s === activeStep) return
    if (s === 'event-details' && !selectedType) return
    if (s === 'modules') {
      const errs = validate(); setErrors(errs)
      if (Object.keys(errs).length > 0) { setActiveStep('event-details'); return }
    }
    setActiveStep(s)
  }

  const handleContinue = () => {
    if (activeStep === 'event-type') {
      if (!selectedType) return
      setActiveStep('event-details')
    } else if (activeStep === 'event-details') {
      const errs = validate(); setErrors(errs)
      if (Object.keys(errs).length === 0) setActiveStep('modules')
    } else {
      handleCreateEvent()
    }
  }

  const toggleModule = (moduleId: string) => setEnabledModules(prev => prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId])

  // ── Create event ────────────────────────────────────────────
  const handleCreateEvent = async () => {
    const errs = validate(); setErrors(errs)
    if (Object.keys(errs).length > 0) { setActiveStep('event-details'); return }
    setLoading(true); setError('')
    try {
      const uploadedMedia: { url: string; type: string }[] = []
      for (const item of mediaItems) {
        const storageRef = ref(storage, `events/${eventCode}/media_${item.id}_${item.file.name}`)
        await uploadBytes(storageRef, item.file)
        uploadedMedia.push({ url: await getDownloadURL(storageRef), type: item.type })
      }
      const docRef = await addDoc(collection(db, 'events'), {
        organizerId: user?.uid, organizerEmail: form.organizerEmail,
        name: form.eventName, summary: form.summary,
        date: form.eventDate, endDate: form.endDate,
        startTime: form.startTime, endTime: form.endTime,
        isRepeating: form.isRepeating,
        repeatingDates: form.isRepeating ? repeatingDates : [],
        locationType: form.locationType, venue: form.venue, address: form.address,
        description: descRef.current?.innerHTML || form.description,
        media: uploadedMedia, coverImage: uploadedMedia.find(m => m.type === 'image')?.url || '',
        organizer: { name: form.organizerName, email: form.organizerEmail, phone: form.organizerPhone },
        featuredArtists: featuredArtists.map(a => ({ name: a.name, image: a.image, genre: a.genre, listeners: a.listeners, bio: a.bio, role: a.role })),
        agenda: agendaItems, faq: faqItems, goodToKnow,
        eventType: selectedType, enabledModules,
        submissionFields: DEFAULT_SUBMISSION_FIELDS[selectedType] || DEFAULT_SUBMISSION_FIELDS.custom,
        enabledFields: (DEFAULT_SUBMISSION_FIELDS[selectedType] || DEFAULT_SUBMISSION_FIELDS.custom).filter(f => f.required || f.alwaysOn).map(f => f.id),
        maxPerformers: parseInt(form.maxPerformers) || 50,
        joinCode: eventCode, status: 'active', createdAt: serverTimestamp(),
        attendingCount: 0, rating: 0, reviewCount: 0,
        slug: form.eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      })
      if (enabledModules.includes('ticketing')) navigate(`/manage/event/${docRef.id}/ticketing`)
      else navigate(`/manage/event/${docRef.id}`)
    } catch (e: any) {
      console.error('Error creating event:', e)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const continueLabel = activeStep === 'modules' ? 'Create Event' : 'Save & Continue'

  return (
    <DashboardLayout plan="starter">
      <div style={{ padding: '0 4px', display: 'flex', gap: 32, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <OnboardingHeader />

          <OnboardingStepRow
            number={1} label="Event Type" desc="Choose what kind of event you're running"
            color={selectedTypeData?.color || '#22C55E'}
            statusText={selectedTypeData?.label}
            active={activeStep === 'event-type'} done={stepDone('event-type')}
            onToggle={() => goToStep('event-type')}
          >
            <OnboardingEventTypeStep selectedType={selectedType} onSelectType={handleSelectType} />
          </OnboardingStepRow>

          <OnboardingStepRow
            number={2} label="Event Details" desc="Add description, media, lineup, agenda and FAQs"
            color="#3B82F6"
            statusText={form.eventName || undefined}
            active={activeStep === 'event-details'} done={stepDone('event-details')}
            onToggle={() => goToStep('event-details')}
          >
            <OnboardingEventDetailsStep
              form={form} setForm={setForm} errors={errors} descRef={descRef}
              onGenerateSummary={handleGenerateSummary} onGenerateDescription={handleGenerateDescription}
              generatingSummary={generatingSummary} generatingDescription={generatingDescription}
              mediaItems={mediaItems} onAddImage={handleAddImage} onAddVideo={handleAddVideo} onRemoveMedia={removeMedia}
              repeatingDates={repeatingDates} onAddRepeatingDate={addRepeatingDate} onUpdateRepeatingDate={updateRepeatingDate} onRemoveRepeatingDate={removeRepeatingDate}
              featuredArtists={featuredArtists} onAddArtist={addArtist} onRemoveArtist={removeArtist} onUpdateArtistRole={updateArtistRole} onAddManualArtist={addManualArtist}
              agendaItems={agendaItems} onAddAgenda={addAgendaItem} onUpdateAgenda={updateAgendaItem} onRemoveAgenda={removeAgendaItem}
              faqItems={faqItems} onAddFAQ={addFAQ} onUpdateFAQ={updateFAQ} onRemoveFAQ={removeFAQ}
              goodToKnow={goodToKnow} setGoodToKnow={setGoodToKnow} onAddMultipleDates={onAddMultipleDates}
            />
          </OnboardingStepRow>

          <OnboardingStepRow
            number={3} label="Modules" desc="Pick only the tools your event needs"
            color="#8B5CF6"
            statusText={`${enabledModules.length} enabled`}
            active={activeStep === 'modules'} done={false}
            onToggle={() => goToStep('modules')}
          >
            <OnboardingModulesStep enabledModules={enabledModules} onToggleModule={toggleModule} />
          </OnboardingStepRow>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#F87171', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} />{error}
            </div>
          )}

          <OnboardingFooterBar onContinue={handleContinue} continueLabel={continueLabel} loading={loading} />
        </div>

        <div className="ob-preview-sidebar" style={{ display: 'block' }}>
          <OnboardingLivePreview
  form={form}
  mediaItems={mediaItems}
  repeatingDates={repeatingDates}
  typeColor={selectedTypeData?.color}
  typeLabel={selectedTypeData?.label}
/>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        [contenteditable][data-placeholder]:empty:before { content: attr(data-placeholder); color: rgba(255,255,255,0.3); pointer-events: none; }
        [contenteditable] a { color: #22C55E; }
        [contenteditable] ul { padding-left: 20px; }
        @media (max-width: 1000px) {
          .ob-preview-sidebar { display: none !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}
