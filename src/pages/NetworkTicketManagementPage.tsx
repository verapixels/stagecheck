import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEventMeta } from '../lib/useEventMeta'
import DashboardLayout from '../components/DashboardLayout'
import NetworkTicketTypes from '../components/network/NetworkTicketTypes'
import { Wallet } from 'lucide-react'

interface NetworkTicket {
  id: string
  name: string
  price: number
  isFree: boolean
  quantity: number
  sold: number
  type: 'individual' | 'group'
  groupSize?: number
  color: string
  description?: string
}

const SUB2 = 'rgba(255,255,255,0.4)'

export default function NetworkTicketManagementPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading } = useEventMeta(eventId)
  const [tickets, setTickets] = useState<NetworkTicket[]>([])
  const [tab, setTab] = useState<'individual' | 'group'>('individual')

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'networkTickets'), snap => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as NetworkTicket)))
    })
    return unsub
  }, [eventId])

  const totalSold = tickets.reduce((a, t) => a + (t.sold || 0), 0)
  const totalRev  = tickets.reduce((a, t) => a + (t.isFree ? 0 : t.price * (t.sold || 0)), 0)
  const totalCap  = tickets.reduce((a, t) => a + t.quantity, 0)

  return (
    <DashboardLayout eventType={eventType ?? 'network'} eventId={eventId} enabledModules={enabledModules} metaLoading={loading}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Wallet size={20} color="#6366F1" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Ticket Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
            Create and manage individual and group tickets for this network event.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Sold',  value: totalSold },
            { label: 'Capacity',    value: totalCap  },
            { label: 'Revenue',     value: `₦${totalRev.toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(12,17,35,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: SUB2, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['individual', 'group'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: 'var(--font-body)',
              background: tab === t ? '#6366F1' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : SUB2,
              transition: 'all 0.15s',
            }}>
              {t === 'individual' ? 'Individual' : 'Group'}
            </button>
          ))}
        </div>

        {/* Ticket component */}
        {eventId && (
          <NetworkTicketTypes eventId={eventId} tickets={tickets} mode={tab} />
        )}
      </div>
    </DashboardLayout>
  )
}