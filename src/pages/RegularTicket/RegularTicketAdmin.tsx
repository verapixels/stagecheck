/* ─────────────────────────────────────────────────────────────
   RegularTicketAdmin.tsx
   Main ticketing page — composes all RegularTicket* components.
   Drop-in replacement for the old TicketingPage.tsx.
───────────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Ticket, Package, Users, Plus, ScanLine, Eye,
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

// ── RegularTicket component family ─────────────────────────
import RegularTicketStats      from '../../components/RegularTicketStats'
import RegularTicketList       from '../../components/RegularTicketList'
import RegularTicketAddonList  from '../../components/RegularTicketAddonList'
import RegularTicketAttendees  from '../../components/RegularTicketAttendees'
import RegularTicketCheckin    from '../../components/RegularTicketCheckin'
import RegularTicketModal      from '../../components/RegularTicketModal'
import RegularTicketAddonModal from '../../components/RegularTicketAddonModal'

import {
  EMPTY_TICKET_FORM, EMPTY_ADDON_FORM,
  G, TX1, TX2, TX3, CARD, BORDER,
} from './RegularTicketTypes'
import type { TicketType, AddOn, Attendee } from './RegularTicketTypes'

type ActiveTab = 'tickets' | 'addons' | 'attendees' | 'checkin'

export default function RegularTicketAdmin() {
  const { eventId }                     = useParams<{ eventId: string }>()
  const { eventType, enabledModules }   = useEvent()

  /* ── Data ── */
  const [tickets,   setTickets]   = useState<TicketType[]>([])
  const [addOns,    setAddOns]    = useState<AddOn[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading,   setLoading]   = useState(true)

  /* ── UI state ── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('tickets')
  const [search,    setSearch]    = useState('')

  /* ── Ticket modal ── */
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [editingTicket,   setEditingTicket]   = useState<TicketType | null>(null)

  /* ── Addon modal ── */
  const [addonModalOpen, setAddonModalOpen] = useState(false)
  const [editingAddon,   setEditingAddon]   = useState<AddOn | null>(null)

  /* ── Delete confirm ── */
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null)
  const [deleteAddonId,  setDeleteAddonId]  = useState<string | null>(null)

  /* ── Firestore listeners ── */
  useEffect(() => {
    if (!eventId) return
    const unT  = onSnapshot(collection(db, 'events', eventId, 'tickets'), snap => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType))); setLoading(false)
    })
    const unA  = onSnapshot(collection(db, 'events', eventId, 'addOns'), snap => {
      setAddOns(snap.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)))
    })
    const unAt = onSnapshot(collection(db, 'events', eventId, 'attendees'), snap => {
      setAttendees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendee)))
    })
    return () => { unT(); unA(); unAt() }
  }, [eventId])

  /* ── Ticket CRUD ── */
  const openNewTicket  = () => { setEditingTicket(null); setTicketModalOpen(true) }
  const openEditTicket = (t: TicketType) => { setEditingTicket(t); setTicketModalOpen(true) }

  const handleSaveTicket = async (form: typeof EMPTY_TICKET_FORM) => {
    if (!eventId) return
    const finalPrice = form.isFree ? 0 : form.price
    if (editingTicket) {
      await updateDoc(doc(db, 'events', eventId, 'tickets', editingTicket.id), { ...form, price: finalPrice })
    } else {
      await addDoc(collection(db, 'events', eventId, 'tickets'), { ...form, price: finalPrice, sold: 0, createdAt: serverTimestamp() })
    }
    setTicketModalOpen(false)
  }

  const handleDeleteTicket = async (id: string) => {
    if (!eventId) return
    await deleteDoc(doc(db, 'events', eventId, 'tickets', id))
    setDeleteTicketId(null)
  }

  /* ── Addon CRUD ── */
  const openNewAddon  = () => { setEditingAddon(null); setAddonModalOpen(true) }
  const openEditAddon = (a: AddOn) => { setEditingAddon(a); setAddonModalOpen(true) }

  const handleSaveAddon = async (form: typeof EMPTY_ADDON_FORM & { imageUrl: string }) => {
    if (!eventId) return
    const finalPrice = form.isFree ? 0 : form.price
    if (editingAddon) {
      await updateDoc(doc(db, 'events', eventId, 'addOns', editingAddon.id), { ...form, price: finalPrice })
    } else {
      await addDoc(collection(db, 'events', eventId, 'addOns'), { ...form, price: finalPrice, sold: 0, createdAt: serverTimestamp() })
    }
    setAddonModalOpen(false)
  }

  const handleDeleteAddon = async (id: string) => {
    if (!eventId) return
    await deleteDoc(doc(db, 'events', eventId, 'addOns', id))
    setDeleteAddonId(null)
  }

  /* ── Full check-in station view ── */
  if (activeTab === 'checkin' && eventId) {
    return (
      <DashboardLayout plan="starter" eventType={eventType ?? 'custom'} eventId={eventId} enabledModules={enabledModules}>
        <RegularTicketCheckin eventId={eventId} attendees={attendees} onBack={() => setActiveTab('attendees')} />
      </DashboardLayout>
    )
  }

  const TABS = [
    { key: 'tickets',   label: 'Tickets',                         icon: <Ticket size={13} /> },
    { key: 'addons',    label: `Add-ons (${addOns.length})`,      icon: <Package size={13} /> },
    { key: 'attendees', label: `Attendees (${attendees.length})`, icon: <Users size={13} /> },
  ] as const

  return (
    <DashboardLayout plan="starter" eventType={eventType ?? 'custom'} eventId={eventId} enabledModules={enabledModules}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '10px', display: 'flex' }}>
                <Ticket size={22} color={G} />
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 900,
                fontSize: 'clamp(1.4rem,4vw,2.2rem)', letterSpacing: '-0.6px',
                color: TX1, margin: 0,
              }}>
                Ticketing
              </h1>
            </div>
            <p style={{ fontSize: 14, color: TX2, margin: 0 }}>
              Manage ticket sales, pricing, attendance and revenue for this event.
            </p>
          </div>

          {/* Header action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 10,
              border: `1px solid ${BORDER}`,
              background: 'rgba(255,255,255,0.05)', color: TX1,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
            }}>
              <Eye size={14} /> Preview Event
            </button>
            <button
              onClick={openNewTicket}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: G, color: '#000',
                cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
                boxShadow: `0 4px 14px rgba(34,197,94,0.3)`,
              }}
            >
              <Plus size={14} /> Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <RegularTicketStats tickets={tickets} addOns={addOns} attendees={attendees} />

      {/* ── Tab bar + context actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: `1px solid ${BORDER}`, gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.09)' : 'transparent',
              color: activeTab === tab.key ? TX1 : TX2,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
              <span style={{ color: activeTab === tab.key ? G : TX3 }}>{tab.icon}</span>
              <span className="rt-btn-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab-specific actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeTab === 'tickets' && (
            <button onClick={openNewTicket} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)', color: G, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
            >
              <Plus size={13} /> <span className="rt-btn-label">New Ticket Type</span>
            </button>
          )}
          {activeTab === 'addons' && (
            <button onClick={openNewAddon} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.28)', color: '#8B5CF6', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
            >
              <Plus size={13} /> <span className="rt-btn-label">New Add-on</span>
            </button>
          )}
          {activeTab === 'attendees' && (
            <>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search attendees…"
                style={{
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                  borderRadius: 10, color: TX1, fontSize: 13,
                  padding: '8px 12px', outline: 'none', fontFamily: 'var(--font-body)',
                  width: 'clamp(120px,20vw,190px)',
                }}
                onFocus={e => e.currentTarget.style.borderColor = `${G}55`}
                onBlur={e => e.currentTarget.style.borderColor = BORDER}
              />
              <button onClick={() => setActiveTab('checkin')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)', color: G, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
              >
                <ScanLine size={13} /> <span className="rt-btn-label">Check-in Station</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ TICKETS TAB ══ */}
      {activeTab === 'tickets' && (
        <RegularTicketList
          tickets={tickets}
          loading={loading}
          onEdit={openEditTicket}
          onDelete={handleDeleteTicket}
          deleteConfirmId={deleteTicketId}
          onDeleteConfirm={setDeleteTicketId}
          onDeleteCancel={() => setDeleteTicketId(null)}
        />
      )}

      {/* ══ ADDONS TAB ══ */}
      {activeTab === 'addons' && (
        <RegularTicketAddonList
          addOns={addOns}
          onNewAddon={openNewAddon}
          onEdit={openEditAddon}
          onDelete={handleDeleteAddon}
          deleteConfirmId={deleteAddonId}
          onDeleteConfirm={setDeleteAddonId}
          onDeleteCancel={() => setDeleteAddonId(null)}
        />
      )}

      {/* ══ ATTENDEES TAB ══ */}
      {activeTab === 'attendees' && eventId && (
        <RegularTicketAttendees
          attendees={attendees}
          eventId={eventId}
          search={search}
          onSearch={setSearch}
          onOpenCheckin={() => setActiveTab('checkin')}
        />
      )}

      {/* ══ TICKET MODAL ══ */}
      <RegularTicketModal
        open={ticketModalOpen}
        editing={editingTicket}
        onClose={() => setTicketModalOpen(false)}
        onSave={handleSaveTicket}
      />

      {/* ══ ADDON MODAL ══ */}
      <RegularTicketAddonModal
        open={addonModalOpen}
        editing={editingAddon}
        eventId={eventId ?? ''}
        onClose={() => setAddonModalOpen(false)}
        onSave={handleSaveAddon}
      />

      <style>{`
        @media (max-width: 400px) { .rt-btn-label { display: none; } }
      `}</style>
    </DashboardLayout>
  )
}