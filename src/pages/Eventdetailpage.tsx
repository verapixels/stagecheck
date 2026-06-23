// ─── EventDetailPage.tsx ──────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, getDocs, addDoc,
  updateDoc, serverTimestamp, query, limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import QRCode from 'qrcode'
import {
  RiLoader4Line, RiAlertLine, RiFlag2Line,
  RiShieldCheckLine,
} from 'react-icons/ri'

import { ED_GLOBAL_CSS } from '../components/event-detail/eventDetailStyles'
import type { EventData, TicketType, AttendeeForm, DrawerStep } from '../components/event-detail/eventDetailTypes'
import { formatDate, formatTime, getEventTypeLabel } from '../components/event-detail/eventDetailHelpers'

import Navbar          from '../components/Navbar'
import EventDetailBreadcrumb      from '../components/event-detail/EventDetailBreadcrumb'
import EventDetailHero            from '../components/event-detail/EventDetailHero'
import EventDetailSidebar         from '../components/event-detail/EventDetailSidebar'
import EventDetailAbout           from '../components/event-detail/EventDetailAbout'
import EventDetailFeaturedPeople  from '../components/event-detail/EventDetailFeaturedPeople'
import EventDetailVenue           from '../components/event-detail/EventDetailVenue'
import EventDetailSchedule        from '../components/event-detail/EventDetailSchedule'
import EventDetailGallery         from '../components/event-detail/EventDetailGallery'
import EventDetailFAQ             from '../components/event-detail/EventDetailFAQ'
import EventDetailRelated         from '../components/event-detail/EventDetailRelated'
import EventDetailTicketDrawer    from '../components/event-detail/EventDetailTicketDrawer'
import EventDetailReportModal     from '../components/event-detail/EventDetailReportModal'
import EventDetailMobileCTA       from '../components/event-detail/EventDetailMobileCTA'
import TicketingLoadingTransition from '../components/ticketing/TicketingLoadingTransition'

const CF_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent]               = useState<EventData | null>(null)
  const [tickets, setTickets]           = useState<TicketType[]>([])
  const [relatedEvents, setRelatedEvents] = useState<EventData[]>([])
  const [loading, setLoading]           = useState(true)

  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [step, setStep]                 = useState<DrawerStep>('select-ticket')
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
  const [qty, setQty]                   = useState(1)
  const [attendee, setAttendee]         = useState<AttendeeForm>({ name: '', email: '', phone: '', altPhone: '' })
  const [formErrors, setFormErrors]     = useState<Partial<AttendeeForm>>({})
  const [paying, setPaying]             = useState(false)
  const [payError, setPayError]         = useState('')
  const [processing, setProcessing]     = useState(false)
  const [ticketCode, setTicketCode]     = useState('')
  const [qrDataUrl, setQrDataUrl]       = useState('')

  const [liked, setLiked]               = useState(false)
  const [copied, setCopied]             = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [reportModal, setReportModal]   = useState(false)
  const [reportIssue, setReportIssue]   = useState('')
  const [reportCustom, setReportCustom] = useState('')
  const [reportEmail, setReportEmail]   = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [navigatingToTickets, setNavigatingToTickets] = useState(false)

  const paymentInProgress = useRef(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (document.getElementById('paystack-inline-script')) return
    const s = document.createElement('script')
    s.id = 'paystack-inline-script'
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(s)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (!eventId) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId!))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as EventData
          setEvent(data)
          try {
            const rq = query(collection(db, 'events'), limit(12))
            const rSnap = await getDocs(rq)
            const now = new Date()
            setRelatedEvents(
              rSnap.docs
                .filter(d => {
                  if (d.id === eventId) return false
                  try {
                    const raw = d.data().date
                    const evDate = raw?.toDate ? raw.toDate() : new Date(raw)
                    return evDate >= now
                  } catch { return true }
                })
                .slice(0, 4)
                .map(d => ({ id: d.id, ...d.data() } as EventData))
            )
          } catch { /* non-critical */ }
        }
        const tSnap = await getDocs(collection(db, 'events', eventId!, 'tickets'))
        setTickets(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType)))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [eventId])

  const allMedia = event
    ? [...(event.coverImage ? [{ url: event.coverImage, type: 'image' }] : []), ...(event.media || [])]
    : []
  const allImages = allMedia.filter(m => m.type === 'image')
  const heroImg   = allImages[0]?.url || ''
  const isFree    = tickets.length > 0 && tickets.every(t => t.price === 0)
  const minPrice  = tickets.filter(t => t.price > 0).length > 0
    ? Math.min(...tickets.filter(t => t.price > 0).map(t => t.price))
    : 0
  const mapsEmbedUrl = event?.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&output=embed&z=15&hl=en`
    : event?.venue
      ? `https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed&z=15&hl=en`
      : ''

  const validateAttendee = () => {
    const e: Partial<AttendeeForm> = {}
    if (!attendee.name.trim()) e.name = 'Full name is required'
    if (!attendee.email.trim() || !/\S+@\S+\.\S+/.test(attendee.email)) e.email = 'Valid email required'
    if (!attendee.phone.trim()) e.phone = 'Phone number is required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePaymentSuccess = async (reference: string) => {
    if (paymentInProgress.current) return
    paymentInProgress.current = true
    if (!eventId || !selectedTicket || !event) { paymentInProgress.current = false; return }
    setProcessing(true)
    try {
      await updateDoc(doc(db, 'events', eventId, 'tickets', selectedTicket.id), {
        sold: (selectedTicket.sold || 0) + qty,
      })
      const code = reference.startsWith('free_') ? ticketCode || `SC-FREE-${Date.now()}` : ticketCode
      const finalCode = code || `SC-${Date.now()}`
      setTicketCode(finalCode)
      const qr = await QRCode.toDataURL(
        JSON.stringify({ code: finalCode, event: event.name, attendee: attendee.name, ticket: selectedTicket.name }),
        { width: 200, margin: 1, color: { dark: '#0dc75e', light: '#060e1c' } }
      )
      setQrDataUrl(qr)
      setStep('success')
      fetch(`${CF_BASE}/sendTicketConfirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: attendee.name, attendeeEmail: attendee.email,
          phone: attendee.phone, ticketCode: finalCode,
          ticketType: selectedTicket.name, ticketQty: qty,
          eventName: event.name, eventDate: formatDate(event.date),
          eventTime: event.startTime ? formatTime(event.startTime) : '',
          venueName: event.venue || '', venueAddress: event.address || '',
          organizerEmail: event.organizerEmail || event.organizer?.email || '',
        }),
      }).catch(console.error)
    } catch (e) {
      console.error(e)
      paymentInProgress.current = false
    }
    setProcessing(false)
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: event?.name, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!ticketRef.current) return
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(ticketRef.current!, { backgroundColor: '#060e1c', scale: 2 }).then(canvas => {
        const a = document.createElement('a')
        a.download = `StageCheck-Ticket-${ticketCode}.png`
        a.href = canvas.toDataURL('image/png')
        a.click()
      })
    }).catch(() => {
      const a = document.createElement('a')
      a.download = `ticket-${ticketCode}.png`
      a.href = qrDataUrl
      a.click()
    })
  }

  const handleReport = async () => {
    if (!reportIssue) return
    setReportSubmitting(true)
    try {
      const reason = reportIssue === 'Other (describe below)' ? reportCustom : reportIssue
      await addDoc(collection(db, 'reports'), {
        eventId: eventId || '', eventName: event?.name || '',
        reason, message: reportCustom, reporterEmail: reportEmail,
        reporterName: reportEmail ? reportEmail.split('@')[0] : 'Anonymous',
        status: 'pending', createdAt: serverTimestamp(),
      })
      setReportSuccess(true)
    } catch (e) { console.error(e) }
    setReportSubmitting(false)
  }

  const handleGetTickets = () => {
    setNavigatingToTickets(true)
    setTimeout(() => navigate(`/event/${eventId}/tickets`), 900)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{ED_GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}><RiLoader4Line size={32} /></div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading event…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{ED_GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <RiAlertLine size={40} color="rgba(255,255,255,0.2)" />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>Event not found</p>
      <button onClick={() => navigate(-1)} style={{ background: '#0dc75e', border: 'none', color: '#000', padding: '10px 22px', borderRadius: 9, cursor: 'pointer', fontWeight: 700 }}>Go Back</button>
    </div>
  )

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{ED_GLOBAL_CSS}</style>

      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Navbar />
        <EventDetailBreadcrumb event={event} />

        {/* ── HERO + SIDEBAR — side by side */}
        <div style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 clamp(16px,4%,56px)',
          display: 'flex',
          gap: 20,
          alignItems: 'stretch',    // ← both columns same height
        }}>
          {/* Hero (left) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <EventDetailHero
              event={event}
              heroImg={heroImg}
              liked={liked}
              copied={copied}
              onLike={() => setLiked(v => !v)}
              onShare={handleShare}
            />
          </div>

          {/* Sidebar (right, sticky) */}
          <div
            className="ed-sidebar ed-desktop"
            style={{
              width: 320,
              flexShrink: 0,
              position: 'sticky',
              top: 88,
              alignSelf: 'flex-start', // sticky needs this
            }}
          >
            <EventDetailSidebar
              tickets={tickets}
              selectedTicket={selectedTicket}
              qty={qty}
              onSelectTicket={t => { setSelectedTicket(t); setQty(1) }}
              onQtyChange={setQty}
              onGetTickets={handleGetTickets}
              minPrice={minPrice}
              isFree={isFree}
            />
          </div>
        </div>

        {/* ── MAIN CONTENT GRID */}
        <div style={{
          maxWidth: 1160,
          margin: '20px auto 0',
          padding: '0 clamp(16px,4%,56px)',
          paddingBottom: 120,
        }}>

          {/* ROW 1: About (left 55%) + Featured People (right) */}
          <div
            className="ed-two-col"
            style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}
          >
            <div style={{ flex: '0 0 55%', minWidth: 0 }}>
              <EventDetailAbout event={event} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <EventDetailFeaturedPeople event={event} />
            </div>
          </div>

          {/* ROW 2: Venue | Schedule | Gallery — 3 equal cols */}
          {(event.venue || (event.agenda || []).length > 0 || allImages.length > 1) && (
            <div
              className="ed-three-col"
              style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <EventDetailVenue event={event} mapsEmbedUrl={mapsEmbedUrl} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <EventDetailSchedule event={event} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <EventDetailGallery images={allImages.slice(1)} />
              </div>
            </div>
          )}

          {/* ROW 3: FAQ (left 40%) + Related Events (right) */}
          {((event.faq || []).length > 0 || relatedEvents.length > 0) && (
            <div
              className="ed-two-col"
              style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}
            >
              <div style={{ flex: '0 0 40%', minWidth: 0 }}>
                <EventDetailFAQ event={event} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <EventDetailRelated events={relatedEvents} />
              </div>
            </div>
          )}

          {/* Report link */}
          <div style={{ textAlign: 'center', padding: '18px 0 8px' }}>
            <button
              onClick={() => {
                setReportModal(true)
                setReportSuccess(false)
                setReportIssue('')
                setReportCustom('')
                setReportEmail('')
              }}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(248,113,113,0.5)', fontSize: 12,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.5)')}
            >
              <RiFlag2Line size={13} /> Report this event
            </button>
          </div>

          {/* Powered by footer */}
          <div style={{ textAlign: 'center', paddingBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'rgba(255,255,255,0.2)',
            }}>
              <RiShieldCheckLine size={12} color="var(--green)" />
              StageCheck by{' '}
              <a href="https://www.verapixels.com" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
                Verapixels
              </a>
            </div>
          </div>
        </div>

        {/* ── MOBILE SIDEBAR (below hero) */}
        <div className="ed-mobile" style={{ display: 'none', padding: '0 16px 16px' }}>
          <EventDetailSidebar
            tickets={tickets}
            selectedTicket={selectedTicket}
            qty={qty}
            onSelectTicket={t => { setSelectedTicket(t); setQty(1) }}
            onQtyChange={setQty}
            onGetTickets={handleGetTickets}
            minPrice={minPrice}
            isFree={isFree}
          />
        </div>

        {/* ── MOBILE STICKY CTA */}
        <EventDetailMobileCTA
          event={event}
          heroImg={heroImg}
          minPrice={minPrice}
          isFree={isFree}
          visible={scrolled}
          onGetTickets={handleGetTickets}
        />
      </div>

      {navigatingToTickets && <TicketingLoadingTransition eventName={event.name} />}

      {drawerOpen && (
        <EventDetailTicketDrawer
          event={event}
          tickets={tickets}
          step={step}
          selectedTicket={selectedTicket}
          qty={qty}
          attendee={attendee}
          formErrors={formErrors}
          paying={paying}
          payError={payError}
          processing={processing}
          ticketCode={ticketCode}
          qrDataUrl={qrDataUrl}
          onClose={() => setDrawerOpen(false)}
          onStep={setStep}
          onSelectTicket={t => { setSelectedTicket(t); setQty(1) }}
          onQtyChange={setQty}
          onAttendeeChange={partial => setAttendee(a => ({ ...a, ...partial }))}
          onValidateAttendee={validateAttendee}
          onPaymentSuccess={handlePaymentSuccess}
          onPayError={setPayError}
          onPaying={setPaying}
          onDownload={handleDownload}
        />
      )}

      {reportModal && (
        <EventDetailReportModal
          event={event}
          issue={reportIssue}
          custom={reportCustom}
          email={reportEmail}
          submitting={reportSubmitting}
          success={reportSuccess}
          onIssue={setReportIssue}
          onCustom={setReportCustom}
          onEmail={setReportEmail}
          onSubmit={handleReport}
          onClose={() => setReportModal(false)}
        />
      )}
    </>
  )
}