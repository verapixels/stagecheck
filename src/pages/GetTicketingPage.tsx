// ─── TicketingPage.tsx ─────────────────────────────────────────────────────
// Standalone ticketing page, route: /events/:eventId/tickets
// Mirrors EventDetailPage's pattern: this file owns all state/data-fetching,
// and renders small Ticketing* presentational components.
//
// Layout matches screenshot:
//   NAV
//   BREADCRUMB
//   EVENT TITLE + META + STATS + SHARE   (TicketingHeader)
//   STEP INDICATOR (1 Select Tickets — 2 Your Details — 3 Checkout — 4 Confirmation)
//   ┌───────────────────────────────┬──────────────────┐
//   │ Select Your Tickets + Add-ons │ Your Order (sticky)│
//   └───────────────────────────────┴──────────────────┘
//   TRUST FOOTER (Instant Delivery / Secure Payments / Easy Refunds / 24/7 Support)

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { RiLoader4Line, RiAlertLine } from 'react-icons/ri'

import { TK_GLOBAL_CSS } from '../components/ticketing/ticketingStyles'
import type { EventData, TicketType, AddOn, TicketingStep } from '../components/ticketing/ticketingTypes'

import Navbar from '../components/Navbar'
import TicketingHeader from '../components/ticketing/TicketingHeader'
import TicketingSteps from '../components/ticketing/TicketingSteps'
import TicketingTicketList from '../components/ticketing/TicketingTicketList'
import TicketingOrderSummary from '../components/ticketing/TicketingOrderSummary'
import TicketingTrustFooter from '../components/ticketing/TicketingTrustFooter'

const PLATFORM_FEE = 1000
const SERVICE_CHARGE = 500

export default function GetTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventData | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<TicketingStep>('select-tickets')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)

  // ── Load event + tickets + add-ons from Firestore
  useEffect(() => {
    if (!eventId) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId!))
        if (snap.exists()) setEvent({ id: snap.id, ...snap.data() } as EventData)

        const tSnap = await getDocs(collection(db, 'events', eventId!, 'tickets'))
        setTickets(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType)))

        const aSnap = await getDocs(collection(db, 'events', eventId!, 'addOns'))
        setAddOns(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  const heroImg = event?.coverImage || event?.media?.find(m => m.type === 'image')?.url || ''

  const handleQtyChange = (ticketId: string, qty: number) => {
    setQuantities(q => ({ ...q, [ticketId]: qty }))
  }

  const handleAddOnAdd = (addOnId: string) => {
    setAddOnQuantities(q => ({ ...q, [addOnId]: (q[addOnId] || 0) + 1 }))
  }

  const handleClearAll = () => {
    setQuantities({})
    setAddOnQuantities({})
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

  const handleContinue = () => {
    // Hand off selected ticket/add-on quantities to the existing
    // EventDetailTicketDrawer flow (details → payment → confirmation),
    // or advance `step` locally if this page owns its own checkout UI.
    setStep('your-details')
  }

  // ── Loading / Not found
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#060e1c', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
    }}>
      <style>{TK_GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ animation: 'spin 0.8s linear infinite', color: '#0dc75e' }}><RiLoader4Line size={32} /></div>
      <p style={{ color: '#c4cbdb', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading tickets…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!event) return (
    <div style={{
      minHeight: '100vh', background: '#060e1c', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
    }}>
      <style>{TK_GLOBAL_CSS}</style>
      <RiAlertLine size={40} color="rgba(255,255,255,0.3)" />
      <p style={{ color: '#c4cbdb', fontFamily: 'Inter, sans-serif' }}>Event not found</p>
      <button onClick={() => navigate(-1)} className="tk-btn-primary" style={{ padding: '10px 22px' }}>
        Go Back
      </button>
    </div>
  )

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{TK_GLOBAL_CSS}</style>

      <div className="tk-page">
        <Navbar />

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px clamp(16px,4%,56px) 60px' }}>
          <TicketingHeader event={event} onShare={handleShare} copied={copied} />

          <TicketingSteps current={step} />

          <div className="tk-grid" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TicketingTicketList
                tickets={tickets}
                quantities={quantities}
                onQtyChange={handleQtyChange}
                addOns={addOns}
                addOnQuantities={addOnQuantities}
                onAddOnAdd={handleAddOnAdd}
              />
            </div>

            <div className="tk-sidebar" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24 }}>
              <TicketingOrderSummary
                event={event}
                heroImg={heroImg}
                tickets={tickets}
                quantities={quantities}
                addOns={addOns}
                addOnQuantities={addOnQuantities}
                onClearAll={handleClearAll}
                onContinue={handleContinue}
                onBuyForGroup={() => navigate(`/events/${eventId}/tickets/group`)}
                platformFee={PLATFORM_FEE}
                serviceCharge={SERVICE_CHARGE}
                ctaLabel="Continue to Details"
              />
            </div>
          </div>

          <TicketingTrustFooter />
        </div>
      </div>
    </>
  )
}