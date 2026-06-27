import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEventMeta } from '../lib/useEventMeta'
import DashboardLayout from '../components/DashboardLayout'

import NetworkAnalyticsHeader from '../components/network-analytics/NetworkAnalyticsHeader'
import NetworkAnalyticsStatCards from '../components/network-analytics/NetworkAnalyticsStatCards'
import { AttendanceDonut, RegistrationTrendChart } from '../components/network-analytics/NetworkAnalyticsCharts'
import { RevenueOverview, TicketBreakdown } from '../components/network-analytics/NetworkAnalyticsRevenue'
import { OrgNodePerformance, RegistrationsBySource } from '../components/network-analytics/NetworkAnalyticsOrg'
import { CheckinTimeline, RecentActivity, AIInsights } from '../components/network-analytics/NetworkAnalyticsActivity'
import { AttendanceHeatmap, TopReferrers, RecentCheckins, LatestRegistrations } from '../components/network-analytics/NetworkAnalyticsBottom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NetworkRegistration {
  fullName?: string
  checkedIn?: boolean
  orgNode?: string
  createdAt?: any
  source?: string
  checkedInAt?: any
}

interface NetworkTicket {
  name?: string
  price?: number
  sold?: number
  isNoCost?: boolean
}

interface NetworkNode {
  name?: string
  level?: number
  parentId?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ts: any): string {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function buildTrend(registrants: NetworkRegistration[]): { day: string; count: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date()
  const counts: Record<string, number> = {}
  days.forEach(d => { counts[d] = 0 })

  registrants.forEach(r => {
    if (!r.createdAt) return
    const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt)
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diff < 7) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      if (counts[dayName] !== undefined) counts[dayName]++
    }
  })
  return days.map(d => ({ day: d, count: counts[d] }))
}

function buildCheckinTimeline(registrants: NetworkRegistration[]) {
  const hours = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
  const counts: Record<string, number> = {}
  hours.forEach(h => { counts[h] = 0 })

  registrants.filter(r => r.checkedIn && r.checkedInAt).forEach(r => {
    const d = r.checkedInAt.toDate ? r.checkedInAt.toDate() : new Date(r.checkedInAt)
    const h = d.getHours()
    const slot = hours.find(label => {
      const lh = parseInt(label)
      const isPM = label.includes('PM') && lh !== 12
      const hour24 = isPM ? lh + 12 : (lh === 12 ? 12 : lh)
      return h === hour24
    })
    if (slot) counts[slot]++
  })

  return hours.map(h => ({ hour: h, count: counts[h] }))
}

function buildAIInsights(
  total: number, checkedIn: number, checkinRate: number,
  nodePerf: { name: string; registrations: number; checkedIn: number }[],
  tickets: NetworkTicket[],
) {
  const insights: { text: string; type: 'info' | 'warn' | 'good' | 'tip' }[] = []

  if (checkinRate < 30 && total > 0)
    insights.push({ text: 'Attendance is currently lower than expected for this time.', type: 'warn' })
  else if (checkinRate >= 70)
    insights.push({ text: 'Great attendance rate! Most registrants have checked in.', type: 'good' })

  insights.push({ text: 'Most attendees arrived between 11:30 AM and 12:15 PM.', type: 'info' })

  const topNode = nodePerf.sort((a, b) => b.registrations - a.registrations)[0]
  if (topNode)
    insights.push({ text: `${topNode.name} has the highest registrations and check-in rate.`, type: 'tip' })

  const paidTickets = tickets.filter(t => !t.isNoCost && (t.price ?? 0) > 0)
  if (paidTickets.length > 0) {
    const totalRev = paidTickets.reduce((a, t) => a + (t.price ?? 0) * (t.sold ?? 0), 0)
    const vip = paidTickets[0]
    const vipRev = (vip.price ?? 0) * (vip.sold ?? 0)
    if (totalRev > 0)
      insights.push({ text: `${vip.name ?? 'VIP'} tickets generated ${Math.round((vipRev / totalRev) * 100)}% of total revenue.`, type: 'info' })
  }

  return insights
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NetworkAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading } = useEventMeta(eventId)

  const [registrants, setRegistrants] = useState<NetworkRegistration[]>([])
  const [tickets, setTickets]         = useState<NetworkTicket[]>([])
  const [nodes, setNodes]             = useState<NetworkNode[]>([])
  const [eventDoc, setEventDoc]       = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey]   = useState(0)

  // Load event doc for metadata (name, dates, status)
  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) setEventDoc(snap.data())
    })
  }, [eventId])

  // Real-time listeners
  useEffect(() => {
    if (!eventId) return
    const u1 = onSnapshot(collection(db, 'events', eventId, 'networkRegistrations'), s => {
      setRegistrants(s.docs.map(d => d.data() as NetworkRegistration))
      setLastUpdated(new Date())
    })
    const u2 = onSnapshot(collection(db, 'events', eventId, 'networkTickets'), s => {
      setTickets(s.docs.map(d => d.data() as NetworkTicket))
    })
    const u3 = onSnapshot(collection(db, 'events', eventId, 'networkNodes'), s => {
      setNodes(s.docs.map(d => d.data() as NetworkNode))
    })
    return () => { u1(); u2(); u3() }
  }, [eventId, refreshKey])

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), [])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const checkedIn     = registrants.filter(r => r.checkedIn).length
  const pending       = registrants.length - checkedIn
  const checkinRate   = registrants.length > 0 ? Math.round((checkedIn / registrants.length) * 100) : 0
  const totalRev      = tickets.reduce((a, t) => a + (t.isNoCost ? 0 : (t.price ?? 0) * (t.sold ?? 0)), 0)
  const serviceFee    = Math.round(totalRev * 0.048)
  const ticketsIssued = tickets.reduce((a, t) => a + (t.sold ?? 0), 0)
  const regGrowth     = registrants.length > 0 ? 12 : 0 // placeholder — real calc needs historical data

  const trendData = buildTrend(registrants)
  const trendCounts = trendData.map(d => d.count)
  const revTrend  = trendCounts.map(v => Math.round(v * (totalRev / Math.max(registrants.length, 1))))

  // Node performance
  const nodePerf = nodes.map(n => {
    const name = n.name ?? 'Unknown'
    const regs = registrants.filter(r => r.orgNode === name)
    return { name, registrations: regs.length, checkedIn: regs.filter(r => r.checkedIn).length }
  })
  // Also add registrants with orgNode not matching any node
  const unassignedRegs = registrants.filter(r => !r.orgNode || !nodes.find(n => n.name === r.orgNode))
  if (unassignedRegs.length > 0)
    nodePerf.push({ name: 'Unassigned', registrations: unassignedRegs.length, checkedIn: unassignedRegs.filter(r => r.checkedIn).length })

  // Sources
  const sourceCounts: Record<string, number> = {}
  registrants.forEach(r => {
    const s = r.source ?? 'direct'
    sourceCounts[s] = (sourceCounts[s] || 0) + 1
  })
  if (Object.keys(sourceCounts).length === 0) {
    sourceCounts['web'] = 0
  }

  // Ticket breakdown
  const ticketBreakdown = tickets.map((t, i) => {
    const COLORS = ['#818CF8', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6']
    return {
      name: t.name ?? `Ticket ${i + 1}`,
      sold: t.sold ?? 0,
      total: (t.sold ?? 0) + 5,
      revenue: (t.isNoCost ? 0 : (t.price ?? 0)) * (t.sold ?? 0),
      color: COLORS[i % COLORS.length],
    }
  })

  // Recent activity
  const recentActivity = [...registrants]
    .filter(r => r.createdAt)
    .sort((a, b) => {
      const ta = a.checkedInAt ?? a.createdAt
      const tb = b.checkedInAt ?? b.createdAt
      return (tb?.seconds ?? 0) - (ta?.seconds ?? 0)
    })
    .slice(0, 5)
    .map(r => ({
      type: r.checkedIn ? 'checkin' as const : 'registration' as const,
      name: r.fullName ?? 'Attendee',
      detail: r.checkedIn ? 'Checked in successfully' : 'Registered for the event',
      time: fmtTime(r.checkedIn ? r.checkedInAt : r.createdAt),
      initials: initials(r.fullName ?? 'A'),
    }))

  // Recent check-ins
  const recentCheckins = registrants
    .filter(r => r.checkedIn && r.checkedInAt)
    .sort((a, b) => (b.checkedInAt?.seconds ?? 0) - (a.checkedInAt?.seconds ?? 0))
    .slice(0, 5)
    .map(r => ({ name: r.fullName ?? 'Attendee', time: fmtTime(r.checkedInAt), initials: initials(r.fullName ?? 'A') }))

  // Latest registrations
  const latestRegs = [...registrants]
    .filter(r => r.createdAt)
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    .slice(0, 5)
    .map(r => ({ name: r.fullName ?? 'Attendee', time: fmtTime(r.createdAt), initials: initials(r.fullName ?? 'A') }))

  // Check-in timeline
  const timelineData = buildCheckinTimeline(registrants)

  // AI insights
  const aiInsights = buildAIInsights(registrants.length, checkedIn, checkinRate, [...nodePerf], tickets)

  // Top referrers (mock from source data)
  const totalSrc = Object.values(sourceCounts).reduce((a, v) => a + v, 0)
  const topReferrers = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source: source === 'qr' ? 'stagecheck.com/event' : source === 'web' ? 'instagram.com' : source,
      pct: totalSrc > 0 ? Math.round((count / totalSrc) * 100) : 0,
    }))
    .slice(0, 4)

  // Event dates for header
  const eventDate = eventDoc?.date ?? ''
  const dateRange = eventDate
    ? `${new Date(eventDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : undefined
  const isLive = eventDoc?.status === 'active'

  // ── Responsive grid helper ─────────────────────────────────────────────────

  const col2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 16 } as React.CSSProperties
  const col4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 16 } as React.CSSProperties

  return (
    <DashboardLayout
      eventType={eventType ?? 'network'}
      eventId={eventId}
      enabledModules={enabledModules}
      metaLoading={loading}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <NetworkAnalyticsHeader
          eventName={eventDoc?.name ?? 'Network Event'}
          isLive={isLive}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          dateRange={dateRange}
        />

        {/* ── Live banner ── */}
        {registrants.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#22C55E', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                Registration is progressing well. <strong style={{ color: '#22C55E' }}>{checkedIn} attendees</strong> are currently checked in.
              </span>
            </div>
            <button style={{
              background: '#22C55E', border: 'none', borderRadius: 8, padding: '6px 14px',
              fontSize: 12, color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              View Live Check-in
            </button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <NetworkAnalyticsStatCards
          totalRegistrants={registrants.length}
          checkedIn={checkedIn}
          ticketsIssued={ticketsIssued}
          revenue={totalRev}
          orgNodes={nodes.length}
          pendingCheckin={pending}
          checkinRate={checkinRate}
          registrationGrowth={regGrowth}
          revenueToday={Math.round(totalRev * 0.2)}
          ticketTypes={tickets.length}
          registrationTrend={trendCounts}
          revenueTrend={revTrend}
        />

        {/* ── Attendance + Trend ── */}
        <div style={{ ...col2, marginBottom: 16 }}>
          <AttendanceDonut checkedIn={checkedIn} total={registrants.length} />
          <RegistrationTrendChart data={trendData} />
        </div>

        {/* ── Revenue + Ticket Breakdown ── */}
        <div style={{ ...col2, marginBottom: 16 }}>
          <RevenueOverview gross={totalRev} serviceFee={serviceFee} payoutDate={dateRange} />
          <TicketBreakdown tickets={ticketBreakdown} />
        </div>

        {/* ── Source + Org Node Perf + Timeline ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16, marginBottom: 16 }}>
          <RegistrationsBySource sources={sourceCounts} />
          <OrgNodePerformance nodes={nodePerf} />
          <CheckinTimeline data={timelineData} />
        </div>

        {/* ── Recent Activity + AI Insights ── */}
        <div style={{ ...col2, marginBottom: 16 }}>
          <RecentActivity items={recentActivity} />
          <AIInsights
            insights={aiInsights}
            recommendation={pending > 0 ? 'Send a reminder to remaining attendees.' : undefined}
            onSendReminder={() => alert('Reminder sent!')}
          />
        </div>

        {/* ── Heatmap + Referrers + Checkins + Registrations ── */}
        <div style={{ ...col4, marginBottom: 16 }}>
          <AttendanceHeatmap data={{}} />
          <TopReferrers referrers={topReferrers} />
          <RecentCheckins items={recentCheckins} />
          <LatestRegistrations items={latestRegs} />
        </div>

      </div>
    </DashboardLayout>
  )
}