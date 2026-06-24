import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import DashboardLayout from '../components/DashboardLayout'
import { useEvent } from '../context/Eventcontext'
import { GitBranch } from 'lucide-react'
import NetworkStatGrid from '../components/network/NetworkStatGrid'
import NetworkRecentActivity from '../components/network/NetworkRecentActivity'
import NetworkOrgSummary from '../components/network/NetworkOrgSummary'

const SUB2 = 'rgba(255,255,255,0.45)'

export default function NetworkDashboardPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules } = useEvent()

  const [registrants, setRegistrants] = useState<any[]>([])
  const [orgLevels, setOrgLevels]     = useState<any[]>([])
  const [orgNodes, setOrgNodes]       = useState<any[]>([])
  const [tickets, setTickets]         = useState<any[]>([])
  const [activity, setActivity]       = useState<any[]>([])
  const [eventMeta, setEventMeta]     = useState<any>(null)

  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(s => s.exists() && setEventMeta(s.data()))

    const unsubR = onSnapshot(collection(db, 'events', eventId, 'networkRegistrations'), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRegistrants(docs)
      // Build activity feed from most recent registrations
      const acts = docs
        .filter((d: any) => d.createdAt)
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 10)
        .map((d: any) => ({
          id: d.id,
          type: d.checkedIn ? 'checkin' : 'registration',
          label: d.fullName || d.name || 'Anonymous',
          sub: d.orgPath || 'Registered',
          time: d.createdAt?.seconds
            ? new Date(d.createdAt.seconds * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            : '',
        }))
      setActivity(acts)
    })

    const unsubL = onSnapshot(collection(db, 'events', eventId, 'orgLevels'), snap => {
      setOrgLevels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const unsubN = onSnapshot(collection(db, 'events', eventId, 'orgNodes'), snap => {
      setOrgNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const unsubT = onSnapshot(collection(db, 'events', eventId, 'networkTickets'), snap => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubR(); unsubL(); unsubN(); unsubT() }
  }, [eventId])

  const checkedIn    = registrants.filter(r => r.checkedIn).length
  const totalRevenue = tickets.reduce((s: number, t: any) => s + ((t.price || 0) * (t.sold || 0)), 0)
  const fillRate     = registrants.length > 0
    ? Math.round((checkedIn / registrants.length) * 100)
    : 0

  // Build org summary per level
  const levelSummary = orgLevels
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((level, i) => ({
      name: level.name,
      count: orgNodes.filter(n => n.levelId === level.id).length,
      color: ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'][i % 4],
    }))

  return (
    <DashboardLayout eventType="network" eventId={eventId} enabledModules={enabledModules}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 12, padding: '8px 9px', display: 'flex' }}>
            <GitBranch size={20} color="#6366F1" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(1.3rem,4vw,2rem)', letterSpacing: '-0.6px', color: '#fff', margin: 0,
            }}>
              {eventMeta?.name || 'Network Event'}
            </h1>
            <p style={{ fontSize: 12, color: SUB2, margin: 0, marginTop: 2 }}>Network Event — Command Center</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <NetworkStatGrid
        totalRegistrants={registrants.length}
        totalOrgNodes={orgNodes.length}
        checkedIn={checkedIn}
        totalRevenue={totalRevenue}
        activeLevel={orgLevels[0]?.name || ''}
        fillRate={fillRate}
      />

      {/* Bottom grid: activity + org summary */}
      <div className="net-dash-grid" style={{ display: 'grid', gap: 16 }}>
        <NetworkRecentActivity items={activity} />
        <NetworkOrgSummary levels={levelSummary} eventId={eventId || ''} />
      </div>

      <style>{`
        .net-dash-grid { grid-template-columns: 1fr 340px; }
        @media (max-width: 900px) { .net-dash-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}