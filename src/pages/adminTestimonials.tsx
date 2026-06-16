import { useEffect, useState } from 'react'
import {
  collection, getDocs, query, orderBy, doc,
  updateDoc, deleteDoc, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiStarLine, RiAddLine, RiDeleteBin2Line, RiEyeLine,
  RiCheckLine, RiLoader4Line, RiLinksLine, RiFileCopyLine,
  RiSearchLine, RiImageLine, RiArrowUpLine, RiArrowDownLine,
  RiMailLine, RiCloseLine, RiUser3Line, RiQuoteText,
  RiCalendarLine, RiExternalLinkLine,
} from 'react-icons/ri'

interface Testimonial {
  id: string; name: string; role: string; quote: string
  avatar?: string; order: number; showPhoto: boolean
  usedFor?: string; rating?: number; approved: boolean; createdAt?: any
  source?: 'manual' | 'feedback_form'
}

interface FeedbackSubmission {
  id: string; name: string; usedFor: string
  description: string; experience?: string
  rating: number; photoURL?: string; photoUrl?: string
  showPhoto: boolean; submittedAt: any; converted: boolean
}

function StarRating({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5,6,7,8,9,10].map(i => (
        <RiStarLine key={i} size={size} style={{
          color: i <= rating ? '#fbbf24' : 'rgba(255,255,255,.15)',
          fill: i <= rating ? '#fbbf24' : 'none',
          flexShrink: 0,
        }} />
      ))}
      <span style={{ fontSize: size, color: 'var(--muted)', marginLeft: 4 }}>{rating}/10</span>
    </div>
  )
}

// ── Detail Modal for Testimonials ──────────────────────────────────────────────
function TestimonialDetailModal({ t, onClose }: { t: Testimonial; onClose: () => void }) {
  const photo = t.avatar
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">Testimonial Details</span>
          <button className="btn btn-ghost-sm" onClick={onClose}><RiCloseLine size={14} /> Close</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Photo */}
          {photo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}>Photo</span>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 260 }}>
                <img
                  src={photo}
                  alt={t.name}
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                <RiImageLine size={13} />
                Photo visibility: <strong style={{ color: t.showPhoto ? 'var(--green)' : 'rgba(255,255,255,0.5)' }}>{t.showPhoto ? 'Shown publicly' : 'Hidden'}</strong>
              </div>
            </div>
          )}

          {/* Name + Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={labelStyle}><RiUser3Line style={{ marginRight: 5 }} />Name</span>
              <div style={valueStyle}>{t.name}</div>
            </div>
            <div>
              <span style={labelStyle}>Role / Title</span>
              <div style={valueStyle}>{t.role || <em style={{ color: 'var(--muted)' }}>Not set</em>}</div>
            </div>
          </div>

          {/* Used For */}
          {t.usedFor && (
            <div>
              <span style={labelStyle}>Used StageCheck for</span>
              <div style={valueStyle}>{t.usedFor}</div>
            </div>
          )}

          {/* Rating */}
          {t.rating !== undefined && (
            <div>
              <span style={labelStyle}>Rating</span>
              <div style={{ marginTop: 6 }}>
                <StarRating rating={t.rating} size={16} />
              </div>
            </div>
          )}

          {/* Quote */}
          <div>
            <span style={labelStyle}><RiQuoteText style={{ marginRight: 5 }} />Testimonial Quote</span>
            <div style={{
              marginTop: 8, padding: '16px 20px',
              background: 'rgba(13,199,94,0.05)',
              border: '1px solid rgba(13,199,94,0.15)',
              borderRadius: 12,
              fontSize: 14, color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.75, fontStyle: 'italic',
            }}>
              "{t.quote || <span style={{ color: 'var(--muted)', fontStyle: 'normal' }}>No quote recorded</span>}"
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={labelStyle}>Status</span>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${t.approved ? 'badge-green' : 'badge-yellow'}`}>
                  {t.approved ? 'Live on site' : 'Hidden'}
                </span>
              </div>
            </div>
            <div>
              <span style={labelStyle}>Source</span>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${t.source === 'feedback_form' ? 'badge-blue' : ''}`}>
                  {t.source === 'feedback_form' ? 'Feedback form' : 'Manual entry'}
                </span>
              </div>
            </div>
          </div>

          {/* Order */}
          <div>
            <span style={labelStyle}>Display Order</span>
            <div style={valueStyle}>#{t.order}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detail Modal for Submissions ──────────────────────────────────────────────
function SubmissionDetailModal({ s, onClose, onConvert, loading }: {
  s: FeedbackSubmission; onClose: () => void
  onConvert: () => void; loading: boolean
}) {
  // Support both field names
  const photo = s.photoURL || s.photoUrl
  const text = s.description || s.experience || ''

  const formatDate = (ts: any) => {
    if (!ts) return 'Unknown'
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts)
      return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    } catch { return 'Unknown' }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">Feedback Submission</span>
          <button className="btn btn-ghost-sm" onClick={onClose}><RiCloseLine size={14} /> Close</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Photo */}
          {photo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={labelStyle}><RiImageLine style={{ marginRight: 5 }} />Submitted Photo</span>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 280 }}>
                <img
                  src={photo}
                  alt={s.name}
                  style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    const fb = el.nextElementSibling as HTMLElement
                    if (fb) fb.style.display = 'flex'
                  }}
                />
                <div style={{
                  display: 'none', alignItems: 'center', justifyContent: 'center',
                  padding: '20px', color: 'var(--muted)', fontSize: 13, gap: 8,
                  border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12,
                }}>
                  <RiImageLine size={18} /> Image failed to load
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                <RiEyeLine size={13} />
                Wants photo shown publicly: <strong style={{ color: s.showPhoto ? 'var(--green)' : 'rgba(255,255,255,0.5)' }}>{s.showPhoto ? 'Yes' : 'No'}</strong>
              </div>
              <a
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)', textDecoration: 'none' }}
              >
                <RiExternalLinkLine size={12} /> Open full image
              </a>
            </div>
          ) : (
            <div style={{
              padding: '20px', border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <RiImageLine size={16} /> No photo submitted
            </div>
          )}

          {/* Name + Used for */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={labelStyle}><RiUser3Line style={{ marginRight: 5 }} />Name</span>
              <div style={valueStyle}>{s.name}</div>
            </div>
            <div>
              <span style={labelStyle}>Used StageCheck for</span>
              <div style={valueStyle}>{s.usedFor || <em style={{ color: 'var(--muted)' }}>Not provided</em>}</div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <span style={labelStyle}>Rating</span>
            <div style={{ marginTop: 6 }}>
              <StarRating rating={s.rating} size={16} />
            </div>
          </div>

          {/* Experience / Description */}
          <div>
            <span style={labelStyle}><RiQuoteText style={{ marginRight: 5 }} />Their Experience</span>
            <div style={{
              marginTop: 8, padding: '16px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 14, color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.75, whiteSpace: 'pre-wrap',
            }}>
              {text || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No description provided</span>}
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={labelStyle}><RiCalendarLine style={{ marginRight: 5 }} />Submitted</span>
              <div style={valueStyle}>{formatDate(s.submittedAt)}</div>
            </div>
            <div>
              <span style={labelStyle}>Status</span>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${s.converted ? 'badge-green' : 'badge-yellow'}`}>
                  {s.converted ? 'Converted to testimonial' : 'Pending review'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!s.converted && (
          <div className="modal-foot">
            <button className="btn btn-ghost-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={onConvert} disabled={loading}>
              {loading
                ? <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} />
                : <RiCheckLine size={13} />}
              Use as Testimonial
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'flex', alignItems: 'center',
}
const valueStyle: React.CSSProperties = {
  marginTop: 6, fontSize: 14, color: 'var(--text)',
  fontWeight: 500,
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'testimonials' | 'submissions'>('testimonials')
  const [addModal, setAddModal] = useState(false)
  const [linkModal, setLinkModal] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [newT, setNewT] = useState({ name: '', role: '', quote: '', avatar: '', usedFor: '', rating: 9, showPhoto: false })

  // Detail modals
  const [detailT, setDetailT] = useState<Testimonial | null>(null)
  const [detailS, setDetailS] = useState<FeedbackSubmission | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      // Testimonials
      let tSnap
      try {
        const q = query(collection(db, 'testimonials'), orderBy('order', 'asc'))
        tSnap = await getDocs(q)
      } catch {
        tSnap = await getDocs(collection(db, 'testimonials'))
      }
      const tList: Testimonial[] = tSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name ?? 'Anonymous',
        role: d.data().role ?? '',
        // Support both 'quote' and 'description'/'experience' field names
        quote: d.data().quote || d.data().description || d.data().experience || '',
        avatar: d.data().avatar || d.data().photoURL || d.data().photoUrl || '',
        order: d.data().order ?? 99,
        showPhoto: d.data().showPhoto ?? false,
        usedFor: d.data().usedFor ?? '',
        rating: d.data().rating ?? 10,
        approved: d.data().approved ?? true,
        createdAt: d.data().createdAt,
        source: d.data().source ?? 'manual',
      }))

      // Submissions
      let sSnap
      try {
        const q2 = query(collection(db, 'feedbackSubmissions'), orderBy('submittedAt', 'desc'))
        sSnap = await getDocs(q2)
      } catch {
        try { sSnap = await getDocs(collection(db, 'feedbackSubmissions')) }
        catch { sSnap = null }
      }
      const sList: FeedbackSubmission[] = sSnap?.docs.map(d => ({
        id: d.id,
        name: d.data().name ?? 'Anonymous',
        usedFor: d.data().usedFor ?? '',
        // Read all possible field names for the text
        description: d.data().description || d.data().experience || '',
        experience: d.data().experience || d.data().description || '',
        rating: d.data().rating ?? 0,
        // Read both photo field names
        photoURL: d.data().photoURL || d.data().photoUrl || '',
        photoUrl: d.data().photoUrl || d.data().photoURL || '',
        showPhoto: d.data().showPhoto ?? false,
        submittedAt: d.data().submittedAt,
        converted: d.data().converted ?? false,
      })) ?? []

      setTestimonials(tList)
      setSubmissions(sList)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function generateLink() {
    if (!linkTitle.trim()) return
    try {
      const ref = await addDoc(collection(db, 'feedbackTokens'), {
        title: linkTitle, createdAt: serverTimestamp(),
        active: true, submissions: 0,
      })
      const base = window.location.origin
      setGeneratedLink(`${base}/feedback/${ref.id}`)
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
    showToast('Link copied!')
  }

  async function addTestimonial() {
    if (!newT.name || !newT.quote) return
    setActionLoading('add')
    try {
      const maxOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.order)) + 1 : 1
      const ref = await addDoc(collection(db, 'testimonials'), {
        ...newT, order: maxOrder, approved: true,
        source: 'manual', createdAt: serverTimestamp(),
      })
      setTestimonials(prev => [...prev, { id: ref.id, ...newT, order: maxOrder, approved: true, source: 'manual' }])
      setAddModal(false)
      setNewT({ name: '', role: '', quote: '', avatar: '', usedFor: '', rating: 9, showPhoto: false })
      showToast('Testimonial added')
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading('') }
  }

  async function deleteTestimonial(id: string) {
    setActionLoading('del' + id)
    try {
      await deleteDoc(doc(db, 'testimonials', id))
      setTestimonials(prev => prev.filter(t => t.id !== id))
      if (detailT?.id === id) setDetailT(null)
      showToast('Deleted')
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading('') }
  }

  async function toggleApprove(t: Testimonial) {
    setActionLoading('ap' + t.id)
    try {
      await updateDoc(doc(db, 'testimonials', t.id), { approved: !t.approved })
      setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, approved: !x.approved } : x))
      if (detailT?.id === t.id) setDetailT(prev => prev ? { ...prev, approved: !prev.approved } : null)
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading('') }
  }

  async function toggleShowPhoto(t: Testimonial) {
    try {
      await updateDoc(doc(db, 'testimonials', t.id), { showPhoto: !t.showPhoto })
      setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, showPhoto: !x.showPhoto } : x))
    } catch { }
  }

  async function moveOrder(t: Testimonial, dir: 'up' | 'down') {
    const sorted = [...testimonials].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(x => x.id === t.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swap = sorted[swapIdx]
    try {
      await Promise.all([
        updateDoc(doc(db, 'testimonials', t.id), { order: swap.order }),
        updateDoc(doc(db, 'testimonials', swap.id), { order: t.order }),
      ])
      setTestimonials(prev => prev.map(x => {
        if (x.id === t.id) return { ...x, order: swap.order }
        if (x.id === swap.id) return { ...x, order: t.order }
        return x
      }))
    } catch { }
  }

  async function convertToTestimonial(s: FeedbackSubmission) {
    setActionLoading('conv' + s.id)
    try {
      const photo = s.photoURL || s.photoUrl || ''
      const text = s.description || s.experience || ''
      const maxOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.order)) + 1 : 1
       const ref = await addDoc(collection(db, 'testimonials'), {
  name: s.name,
  role: s.usedFor,
  usedFor: s.usedFor,
  quote: text,
  description: text,
  experience: text,
  avatar: photo,
  photoURL: photo,
  photoUrl: photo,
  showPhoto: s.showPhoto,
  rating: s.rating,
  order: maxOrder,
  approved: true,
  source: 'feedback_form',
  createdAt: serverTimestamp(),
})
      await updateDoc(doc(db, 'feedbackSubmissions', s.id), { converted: true })
      const newTestimonial: Testimonial = {
        id: ref.id, name: s.name, role: s.usedFor, quote: text,
        avatar: photo, showPhoto: s.showPhoto, rating: s.rating,
        order: maxOrder, approved: true, source: 'feedback_form',
      }
      setTestimonials(prev => [...prev, newTestimonial])
      setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, converted: true } : x))
      setDetailS(null)
      showToast('Converted to testimonial ✓')
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading('') }
  }

  const filteredT = testimonials
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.quote.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.order - b.order)

  const filteredS = submissions
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))

  const pendingSubmissions = submissions.filter(s => !s.converted).length

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Testimonials</h1>
          <p className="page-sub">Manage social proof displayed on your landing page</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost-sm" style={{ fontSize: 13, padding: '9px 16px' }}
            onClick={() => { setLinkModal(true); setGeneratedLink(''); setLinkTitle('') }}>
            <RiFileCopyLine size={13} /> Request Feedback
          </button>
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>
            <RiAddLine size={14} /> Add Testimonial
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {(['testimonials', 'submissions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 9, cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            background: tab === t ? 'rgba(13,199,94,.12)' : 'none',
            color: tab === t ? 'var(--green)' : 'var(--muted)',
            border: tab === t ? '1px solid var(--border-g)' : '1px solid transparent',
            transition: 'all .18s', position: 'relative',
          }}>
            {t === 'testimonials' ? 'Live Testimonials' : 'Feedback Inbox'}
            {t === 'submissions' && pendingSubmissions > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%',
                background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff',
              }}>{pendingSubmissions}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="filter-bar" style={{ padding: '10px 0', paddingBottom: 16 }}>
        <div className="search-input-wrap" style={{ maxWidth: 320 }}>
          <RiSearchLine size={14} color="var(--muted2)" />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <RiLoader4Line size={24} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />
        </div>
      ) : tab === 'testimonials' ? (
        filteredT.length === 0 ? (
          <div className="empty-state card" style={{ padding: '56px 0' }}>
            <RiStarLine size={36} />
            No testimonials yet. Add one or convert a feedback submission.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredT.map((t, i) => {
              const photo = t.avatar
              return (
                <div key={t.id} className="card" style={{
                  display: 'flex', gap: 16, padding: '16px 20px',
                  alignItems: 'flex-start', flexWrap: 'wrap',
                  cursor: 'pointer', transition: 'border-color .2s',
                }}
                  onClick={() => setDetailT(t)}
                >
                  {/* Order controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}
                    onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost-sm" style={{ padding: '4px 6px' }}
                      onClick={() => moveOrder(t, 'up')} disabled={i === 0}>
                      <RiArrowUpLine size={12} />
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{t.order}</span>
                    <button className="btn btn-ghost-sm" style={{ padding: '4px 6px' }}
                      onClick={() => moveOrder(t, 'down')} disabled={i === filteredT.length - 1}>
                      <RiArrowDownLine size={12} />
                    </button>
                  </div>

                  {/* Avatar / Photo */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    border: '2px solid rgba(13,199,94,.3)', overflow: 'hidden',
                    background: photo ? undefined : 'linear-gradient(135deg, #0dc75e, #0a9444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#000',
                  }}>
                    {photo ? (
                      <img
                        src={photo}
                        alt={t.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                          // Show initials fallback
                          const parent = img.parentElement
                          if (parent) {
                            parent.style.background = 'linear-gradient(135deg, #0dc75e, #0a9444)'
                            parent.textContent = (t.name || 'U').slice(0, 2).toUpperCase()
                          }
                        }}
                      />
                    ) : (t.name || 'U').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.role}</span>
                      <span className={`badge ${t.approved ? 'badge-green' : 'badge-yellow'}`}>{t.approved ? 'Live' : 'Hidden'}</span>
                      {t.source === 'feedback_form' && <span className="badge badge-blue">From form</span>}
                      {photo && (
                        <span style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <RiImageLine size={11} /> Has photo
                        </span>
                      )}
                    </div>
                    {t.rating !== undefined && <StarRating rating={t.rating} />}
                    <p style={{
                      fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.65,
                      marginTop: 8, fontStyle: 'italic',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      "{t.quote || <span style={{ fontStyle: 'normal', color: 'var(--muted)' }}>No quote</span>}"
                    </p>
                    {t.usedFor && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        Used for: {t.usedFor}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost-sm"
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
                      onClick={() => setDetailT(t)}
                      title="View details"
                    >
                      <RiEyeLine size={12} /> View
                    </button>
                    {photo && (
                      <button
                        className="btn btn-ghost-sm"
                        style={{ fontSize: 11, color: t.showPhoto ? 'var(--green)' : undefined }}
                        onClick={() => toggleShowPhoto(t)}
                        title="Toggle photo visibility"
                      >
                        <RiImageLine size={12} /> {t.showPhoto ? 'Photo On' : 'Photo Off'}
                      </button>
                    )}
                    <button className="btn btn-ghost-sm" onClick={() => toggleApprove(t)}>
                      {t.approved ? <RiCloseLine size={12} /> : <RiCheckLine size={12} />}
                      {t.approved ? 'Hide' : 'Show'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteTestimonial(t.id)}
                      disabled={actionLoading === 'del' + t.id}
                    >
                      <RiDeleteBin2Line size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        // ── Submissions tab ──
        filteredS.length === 0 ? (
          <div className="empty-state card" style={{ padding: '56px 0' }}>
            <RiMailLine size={36} />
            No feedback submissions yet. Generate a link and share it.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredS.map(s => {
              const photo = s.photoURL || s.photoUrl
              const text = s.description || s.experience || ''
              return (
                <div key={s.id} className="card" style={{
                  padding: '16px 20px', display: 'flex', gap: 16,
                  alignItems: 'flex-start', flexWrap: 'wrap',
                  cursor: 'pointer',
                }}
                  onClick={() => setDetailS(s)}
                >
                  {/* Avatar / Photo */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: photo ? undefined : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#fff',
                    overflow: 'hidden', border: '2px solid rgba(96,165,250,.3)',
                  }}>
                    {photo ? (
                      <img
                        src={photo}
                        alt={s.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                          const parent = img.parentElement
                          if (parent) {
                            parent.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                            parent.textContent = (s.name || 'U').slice(0, 2).toUpperCase()
                          }
                        }}
                      />
                    ) : (s.name || 'U').slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.usedFor}</span>
                      {s.converted && <span className="badge badge-green">Converted</span>}
                      {photo && (
                        <span style={{ fontSize: 11, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <RiImageLine size={11} /> Has photo
                        </span>
                      )}
                    </div>
                    <StarRating rating={s.rating} />
                    <p style={{
                      fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.65,
                      marginTop: 8, display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {text}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost-sm"
                      style={{ fontSize: 11 }}
                      onClick={() => setDetailS(s)}
                    >
                      <RiEyeLine size={12} /> View Details
                    </button>
                    {!s.converted && (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: '7px 12px' }}
                        onClick={() => convertToTestimonial(s)}
                        disabled={actionLoading === 'conv' + s.id}
                      >
                        {actionLoading === 'conv' + s.id
                          ? <RiLoader4Line size={12} style={{ animation: 'spin .8s linear infinite' }} />
                          : <RiCheckLine size={12} />}
                        Use as testimonial
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Add Testimonial Modal ── */}
      {addModal && (
        <div className="modal-backdrop" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">Add Testimonial</span>
              <button className="btn btn-ghost-sm" onClick={() => setAddModal(false)}>Cancel</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Adaeze Okafor"
                  value={newT.name} onChange={e => setNewT(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Title</label>
                <input className="form-input" placeholder="e.g. Event Organizer"
                  value={newT.role} onChange={e => setNewT(p => ({ ...p, role: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Used StageCheck For</label>
                <input className="form-input" placeholder="e.g. Annual choir concert"
                  value={newT.usedFor} onChange={e => setNewT(p => ({ ...p, usedFor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Testimonial Quote *</label>
                <textarea className="form-input" placeholder="What did they say?"
                  value={newT.quote} onChange={e => setNewT(p => ({ ...p, quote: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Rating (1–10)</label>
                <input className="form-input" type="number" min={1} max={10}
                  value={newT.rating} onChange={e => setNewT(p => ({ ...p, rating: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Avatar / Photo URL (optional)</label>
                <input className="form-input" placeholder="https://..."
                  value={newT.avatar} onChange={e => setNewT(p => ({ ...p, avatar: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={addTestimonial} disabled={actionLoading === 'add'}>
                {actionLoading === 'add'
                  ? <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} />
                  : <RiAddLine size={13} />}
                Add Testimonial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Link Modal ── */}
      {linkModal && (
        <div className="modal-backdrop" onClick={() => { setLinkModal(false); setGeneratedLink('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">Request Feedback</span>
              <button className="btn btn-ghost-sm" onClick={() => { setLinkModal(false); setGeneratedLink('') }}>Close</button>
            </div>
            <div className="modal-body">
              <div style={{
                background: 'var(--green-dim)', border: '1px solid var(--border-g)',
                borderRadius: 12, padding: '14px 16px', fontSize: 13,
                color: 'rgba(255,255,255,.8)', lineHeight: 1.65,
              }}>
                Generate a shareable link. Responses land in your <strong>Feedback Inbox</strong> for review.
              </div>
              {!generatedLink ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Campaign Label (internal)</label>
                    <input className="form-input" placeholder="e.g. Post-event follow-up — June 2025"
                      value={linkTitle} onChange={e => setLinkTitle(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={generateLink}
                    disabled={!linkTitle.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                    <RiLinksLine size={14} /> Generate Feedback Link
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                    Link ready — share this:
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>
                      {generatedLink}
                    </span>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', flexShrink: 0 }} onClick={copyLink}>
                      {linkCopied ? <RiCheckLine size={13} /> : <RiLinksLine size={13} />}
                      {linkCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Testimonial Detail Modal ── */}
      {detailT && (
        <TestimonialDetailModal
          t={detailT}
          onClose={() => setDetailT(null)}
        />
      )}

      {/* ── Submission Detail Modal ── */}
      {detailS && (
        <SubmissionDetailModal
          s={detailS}
          onClose={() => setDetailS(null)}
          onConvert={() => convertToTestimonial(detailS)}
          loading={actionLoading === 'conv' + detailS.id}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: 'var(--bg-card)',
          border: '1px solid var(--border-g)', borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, color: 'var(--green)', zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'slideIn .3s ease',
        }}>
          <RiCheckLine size={15} />{toast}
        </div>
      )}
    </>
  )
}