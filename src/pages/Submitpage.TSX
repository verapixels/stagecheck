import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, doc, getDoc, getDocs, addDoc, onSnapshot, serverTimestamp, query, where
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { Music2, Search, Upload, Plus, X, Check, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Song {
  id: string
  title: string
  artist: string
  source: 'youtube' | 'original'
  thumbnail?: string
  youtubeId?: string
  originalFile?: string
  singerName?: string
}

interface EventMeta {
  name: string
  description?: string
  shortDescription?: string
  location?: string
  venue?: string
  date?: any
  coverImage?: string
  imageUrl?: string
}

interface FormConfig {
  maxPerformers: number | null
  minsPerGroup: number | null
  allowAudio: boolean
  allowOriginal: boolean
  contactEmail?: string
  contactPhone?: string
}

// ─── Song Search via YouTube Data API ────────────────────────────────────────
const YT_API_KEY = (import.meta as any).env?.VITE_YOUTUBE_API_KEY || ''

async function searchYouTube(query: string): Promise<Song[]> {
  if (!YT_API_KEY || !query.trim()) return []
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      source: 'youtube',
      thumbnail: item.snippet.thumbnails?.default?.url,
      youtubeId: item.id.videoId,
    }))
  } catch { return [] }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubmitPage() {
  const { eventSlug, eventId } = useParams<{ eventSlug: string; eventId: string }>()

  const [eventMeta, setEventMeta]   = useState<EventMeta | null>(null)
  const [config, setConfig]         = useState<FormConfig | null>(null)
  const [notFound, setNotFound]     = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)

  // Submission count for slots
  const [submissionCount, setSubmissionCount] = useState(0)

  // Form fields
  const [name, setName]             = useState('')
  const [choirName, setChoirName]   = useState('')
  const [email, setEmail]           = useState('')
  const [songs, setSongs]           = useState<Song[]>([])

  // Song search
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [searching, setSearching]       = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [takenSongs, setTakenSongs]     = useState<string[]>([]) // taken youtube IDs

  // Original upload
  const [uploadMode, setUploadMode]     = useState(false)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalTitle, setOriginalTitle] = useState('')
  const [singerName, setSingerName]     = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading]       = useState(false)

  // Submit
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [error, setError]               = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load event + config ──────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    Promise.all([
      getDoc(doc(db, 'events', eventId)),
      getDoc(doc(db, 'events', eventId, 'config', 'submissionForm')),
    ]).then(([eventSnap, configSnap]) => {
      if (!eventSnap.exists() || !configSnap.exists()) { setNotFound(true); setLoadingMeta(false); return }
      setEventMeta(eventSnap.data() as EventMeta)
      setConfig(configSnap.data() as FormConfig)
      setLoadingMeta(false)
    })
  }, [eventId])

  // ── Live submission count ────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    return onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      setSubmissionCount(snap.size)
    })
  }, [eventId])

  // ── Live taken songs ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    return onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      const taken: string[] = []
      snap.docs.forEach(d => {
        const sgs: Song[] = d.data().songs || []
        sgs.forEach(s => { if (s.youtubeId) taken.push(s.youtubeId) })
      })
      setTakenSongs(taken)
    })
  }, [eventId])

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Search songs ─────────────────────────────────────────────────────────
  const handleSearch = (val: string) => {
    setSearchQuery(val)
    setShowDropdown(true)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!val.trim()) { setSearchResults([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const results = await searchYouTube(val)
      setSearchResults(results)
      setSearching(false)
    }, 500)
  }

  const addSong = (song: Song) => {
    if (songs.find(s => s.id === song.id)) return
    setSongs(prev => [...prev, song])
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const removeSong = (id: string) => setSongs(prev => prev.filter(s => s.id !== id))

  // ── Upload original ──────────────────────────────────────────────────────
  const handleOriginalUpload = async (): Promise<Song | null> => {
    if (!originalFile || !originalTitle || !eventId) return null
    setUploading(true)
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `events/${eventId}/audio/${Date.now()}_${originalFile.name}`)
      const task = uploadBytesResumable(storageRef, originalFile)
      task.on('state_changed',
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err => { setUploading(false); reject(err) },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          setUploading(false)
          resolve({ id: `original-${Date.now()}`, title: originalTitle, artist: singerName || 'Original', source: 'original', originalFile: url, singerName })
        }
      )
    })
  }

  const handleAddOriginal = async () => {
    const song = await handleOriginalUpload()
    if (song) {
      setSongs(prev => [...prev, song])
      setOriginalFile(null); setOriginalTitle(''); setSingerName(''); setUploadMode(false); setUploadProgress(0)
    }
  }

  
const handleSubmit = async () => {
  if (!name.trim() || songs.length === 0 || !eventId) return
  setSubmitting(true); setError('')
  try {
    await addDoc(collection(db, 'events', eventId, 'submissions'), {
      performerName: name,
      groupName: choirName || name,
      email,
      songs,
      songSearch: songs[0]?.title || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    // ── fire emails (don't await — don't block UI) ──────────────────────────
    const BASE = window.location.hostname === 'localhost'
      ? `http://localhost:5001/stagecheck-699c7/us-central1`
      : 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

    fetch(`${BASE}/sendSubmissionEmails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'submitted',
        eventId,
        eventName: eventMeta?.name || '',
        performerName: name,
        groupName: choirName || name,
        performerEmail: email || undefined,
        organizerEmail: config?.contactEmail || undefined,
        songs,
      }),
    }).catch(() => {}) // silent fail — submission already saved

    setSubmitted(true)
  } catch (e: any) { setError('Something went wrong. Please try again.') }
  setSubmitting(false)
}

  const slotsLeft = config?.maxPerformers != null ? Math.max(0, config.maxPerformers - submissionCount) : null

  // ── Event date formatting ─────────────────────────────────────────────────
  const formatDate = (date: any) => {
    if (!date) return null
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date)
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingMeta) return (
    <div style={centerStyle}>
      <Loader2 size={24} color="#22C55E" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{spinCSS}</style>
    </div>
  )

  if (notFound) return (
    <div style={centerStyle}>
      <div style={{ textAlign: 'center' }}>
        <AlertTriangle size={40} color="#F87171" style={{ marginBottom: 16 }} />
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Form not found</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>This submission link is invalid or has not been set up yet.</div>
      </div>
      <style>{spinCSS}</style>
    </div>
  )

  if (submitted) return (
    <div style={centerStyle}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={28} color="#22C55E" />
        </div>
        <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 10 }}>Submission received!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
          {eventMeta?.name} has your entry. {email ? "You'll receive a confirmation at " + email + '.' : 'The event organizer will review it soon.'}
        </p>
        {songs.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginTop: 10, textAlign: 'left' }}>
            {s.thumbnail && <img src={s.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
            <div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.artist}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{spinCSS}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080e1c', fontFamily: 'var(--font-body, system-ui)' }}>

      {/* Hero banner */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        {eventMeta?.coverImage || eventMeta?.imageUrl
          ? <img src={eventMeta.coverImage || eventMeta.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a2a4a, #0f1629)' }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,14,28,0.2) 0%, rgba(8,14,28,0.85) 80%, #080e1c 100%)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
          <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 6 }}>Submit Your Entry</div>
          <h1 style={{ fontFamily: 'var(--font-display, system-ui)', fontWeight: 800, fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{eventMeta?.name}</h1>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Event info chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, marginBottom: 24 }}>
          {(eventMeta?.location || eventMeta?.venue) ? (
  <Chip icon="📍" text={eventMeta.location || eventMeta.venue || ''} />
) : null}
          {eventMeta?.date ? <Chip icon="📅" text={formatDate(eventMeta.date) ?? ''} /> : null}
          {config?.minsPerGroup ? <Chip icon="⏱" text={`${config.minsPerGroup} min per group`} /> : null}
          {slotsLeft !== null && (
            <Chip icon="🎟" text={`${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left`} color={slotsLeft < 5 ? '#F87171' : '#22C55E'} />
          )}
        </div>

        {/* Description */}
        {(eventMeta?.description || eventMeta?.shortDescription) && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
            {eventMeta.description || eventMeta.shortDescription}
          </p>
        )}

        {/* Slots closed */}
        {slotsLeft === 0 && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 24, color: '#F87171', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
            Submissions are now closed. No slots remain.
          </div>
        )}

        {slotsLeft !== 0 && (
          <>
            {/* Your Details */}
            <FormSection label="Your Details">
              <InputField label="Your Name *" value={name} onChange={setName} placeholder="e.g. John Doe" />
              <InputField label="Choir / Group Name" value={choirName} onChange={setChoirName} placeholder="e.g. Grace Choir" />
              <InputField label="Email (for notifications)" value={email} onChange={setEmail} placeholder="e.g. john@gmail.com" type="email" />
            </FormSection>

            {/* Songs */}
            <FormSection label="Your Songs">

              {/* Added songs list */}
              {songs.length > 0 && (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {songs.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                      {s.thumbnail && <img src={s.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.artist || s.singerName}</div>
                      </div>
                      <button onClick={() => removeSong(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search tab */}
              {config?.allowAudio && (
                <div ref={searchRef} style={{ position: 'relative', marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Search for a song</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
                    <Search size={13} color="rgba(255,255,255,0.3)" />
                    <input
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      onFocus={() => searchQuery && setShowDropdown(true)}
                      placeholder="Type a song name..."
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
                    />
                    {searching && <Loader2 size={13} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                  </div>

                  {/* Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                      {searchResults.map(song => {
                        const taken = takenSongs.includes(song.youtubeId || '')
                        const alreadyAdded = songs.find(s => s.id === song.id)
                        return (
                          <div key={song.id}
                            onClick={() => !taken && !alreadyAdded && addSong(song)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: taken ? 'default' : 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: taken ? 'rgba(248,113,113,0.04)' : 'transparent', opacity: taken ? 0.7 : 1, transition: 'background 0.15s' }}>
                            {song.thumbnail && <img src={song.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: taken ? '#F87171' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{song.artist}</div>
                              {taken && <div style={{ fontSize: 10, color: '#F87171', fontWeight: 600 }}>⚠ Song taken by another group — choose a different one</div>}
                            </div>
                            {!taken && !alreadyAdded && (
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Plus size={12} color="#22C55E" />
                              </div>
                            )}
                            {alreadyAdded && <Check size={14} color="#22C55E" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Original upload */}
              {config?.allowOriginal && (
                <div>
                  {!uploadMode ? (
                    <button onClick={() => setUploadMode(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                      <Upload size={13} /> Upload original song instead
                    </button>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Original Song</div>
                        <button onClick={() => setUploadMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><X size={14} /></button>
                      </div>
                      <InputField label="Song Name *" value={originalTitle} onChange={setOriginalTitle} placeholder="e.g. Amazing Grace (Original)" />
                      <InputField label="Singer / Artist Name" value={singerName} onChange={setSingerName} placeholder="e.g. Mary Johnson" />
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Audio File *</label>
                        <input type="file" accept="audio/*" onChange={e => setOriginalFile(e.target.files?.[0] || null)}
                          style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }} />
                      </div>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#22C55E', transition: 'width 0.3s' }} />
                        </div>
                      )}
                      <button onClick={handleAddOriginal} disabled={!originalFile || !originalTitle || uploading}
                        style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', background: originalFile && originalTitle ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: originalFile && originalTitle ? '#22C55E' : 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: originalFile && originalTitle ? 'pointer' : 'default' }}>
                        {uploading ? `Uploading ${uploadProgress}%...` : 'Add This Song'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            {error && <div style={{ color: '#F87171', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

            <button
              onClick={handleSubmit}
              disabled={!name.trim() || songs.length === 0 || submitting}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: name.trim() && songs.length > 0 ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'rgba(255,255,255,0.07)',
                color: name.trim() && songs.length > 0 ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                cursor: name.trim() && songs.length > 0 ? 'pointer' : 'default',
                boxShadow: name.trim() && songs.length > 0 ? '0 6px 24px rgba(34,197,94,0.25)' : 'none',
                transition: 'all 0.2s',
              }}>
              {submitting ? 'Submitting...' : `Submit Entry${songs.length > 1 ? ` (${songs.length} songs)` : ''}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>
              Powered by StageCheck
            </p>
          </>
        )}
      </div>

      <style>{spinCSS}</style>
    </div>
  )
}

// ─── Small components ─────────────────────────────────────────────────────────

function Chip({ icon, text, color }: { icon: string; text: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: color || 'rgba(255,255,255,0.5)' }}>
      <span>{icon}</span> {text}
    </div>
  )
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#080e1c', fontFamily: 'system-ui',
}

const spinCSS = `@keyframes spin { to { transform: rotate(360deg); } }`