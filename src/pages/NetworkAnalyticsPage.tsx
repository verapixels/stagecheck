import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEventMeta } from '../lib/useEventMeta'
import DashboardLayout from '../components/DashboardLayout'
import { PieChart, Users, TrendingUp, GitBranch, Wallet, ScanLine } from 'lucide-react'

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
  padding: '20px',
}
const SUB2 = 'rgba(255,255,255,0.4)'

export default function NetworkAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading } = useEventMeta(eventId)
  const [registrants, setRegistrants] = useState<any[]>([])
  const [tickets, setTickets]         = useState<any[]>([])
  const [nodes, setNodes]             = useState<any[]>([])

  useEffect(() => {
    if (!eventId) return
    const u1 = onSnapshot(collection(db, 'events', eventId, 'networkRegistrations'), s => setRegistrants(s.docs.map(d => d.data())))
    const u2 = onSnapshot(collection(db, 'events', eventId, 'networkTickets'),       s => setTickets(s.docs.map(d => d.data())))
    const u3 = onSnapshot(collection(db, 'events', eventId, 'networkNodes'),         s => setNodes(s.docs.map(d => d.data())))
    return () => { u1(); u2(); u3() }
  }, [eventId])

  const checkedIn   = registrants.filter(r => r.checkedIn).length
  const totalRev    = tickets.reduce((a, t) => a + (t.isFree ? 0 : (t.price || 0) * (t.sold || 0)), 0)
  const fillRate    = registrants.length > 0 ? Math.round((checkedIn / registrants.length) * 100) : 0

  // Group registrants by orgNode
  const byNode: Record<string, number> = {}
  registrants.forEach(r => {
    const key = r.orgNode || 'Unassigned'
    byNode[key] = (byNode[key] || 0) + 1
  })
  const nodeEntries = Object.entries(byNode).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxNode = nodeEntries[0]?.[1] || 1

  const COLORS = ['#6366F1', '#818CF8', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6', '#F97316', '#06B6D4']

  const stats = [
    { label: 'Total Registrants', value: registrants.length, icon: <Users size={16} />,      color: '#6366F1' },
    { label: 'Checked In',        value: checkedIn,           icon: <ScanLine size={16} />,   color: '#22C55E' },
    { label: 'Org Nodes',         value: nodes.length,        icon: <GitBranch size={16} />,  color: '#818CF8' },
    { label: 'Total Revenue',     value: `₦${totalRev.toLocaleString()}`, icon: <Wallet size={16} />, color: '#F59E0B' },
    { label: 'Check-in Rate',     value: `${fillRate}%`,      icon: <TrendingUp size={16} />, color: '#14B8A6' },
    { label: 'Ticket Types',      value: tickets.length,      icon: <PieChart size={16} />,   color: '#EC4899' },
  ]

  return (
    <DashboardLayout eventType={eventType ?? 'network'} eventId={eventId} enabledModules={enabledModules} metaLoading={loading}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <PieChart size={20} color="#6366F1" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Analytics
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
            Overview of registrations, check-ins, and revenue for this network event.
          </p>
        </div>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(12,17,35,0.8)', border: `1px solid ${s.color}20`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 11, color: SUB2 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Check-in progress bar */}
        <div style={{ ...glass, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Check-in Progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: SUB2, marginBottom: 8 }}>
            <span>{checkedIn} checked in</span>
            <span style={{ color: '#22C55E', fontWeight: 700 }}>{fillRate}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${fillRate}%`, background: 'linear-gradient(90deg,#6366F1,#22C55E)', borderRadius: 8, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: SUB2, marginTop: 8 }}>{registrants.length - checkedIn} still to check in</div>
        </div>

        {/* Registrants by org node */}
        {nodeEntries.length > 0 && (
          <div style={glass}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Registrants by Org Node</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nodeEntries.map(([node, count], i) => (
                <div key={node}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{node}</span>
                    <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((count / maxNode) * 100)}%`, background: COLORS[i % COLORS.length], borderRadius: 5, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}