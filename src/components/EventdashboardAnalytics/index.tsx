// src/components/EventAnalytics/index.tsx
import { useMemo, useState } from 'react'
import type { EventDoc, DateRangeFilter, StatusFilter } from './Types'
import { useOrganizerAnalytics } from './Useorganizeranalytics'
import { buildRevenueSeries, generateInsights, isWithinRange } from './Analytics.utils'

import AnalyticsFilters from './Analyticsfilters'
import KPICards from './Kpicards'
import PerformanceChart from './Performancechart'
import TopPerformingEvents from './Topperformingevents'
import EventsNeedingAttention from './Eventsneedingattention'
import RevenueByEvent from './Revenuebyevent'
import TicketSalesDonut from './Ticketsalesdonut'
import LiveActivityFeed from './Liveactivityfeed'
import TodaysSnapshot from './Todayssnapshot'
import Insights from './Insights'
import AllActiveEventsGrid from './Allactiveeventsgrid'

const RANGE_DAYS: Record<DateRangeFilter, number> = {
  '7d': 7, '30d': 30, '90d': 90, year: 365, all: 3650,
}

interface Props {
  events: EventDoc[]
  loading: boolean
}

export default function EventAnalytics({ events, loading: eventsLoading }: Props) {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')
  const [eventType, setEventType] = useState('all')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [search, setSearch] = useState('')

  const eventTypeOptions = useMemo(() => Array.from(new Set(events.map(e => e.eventType))).filter(Boolean), [events])
  const cityOptions = useMemo(() => Array.from(new Set(events.map(e => e.location))).filter(Boolean), [events])

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (status !== 'all' && e.status !== status) return false
      if (eventType !== 'all' && e.eventType !== eventType) return false
      if (city !== 'all' && e.location !== city) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [events, status, eventType, city, search])

  const { eventStats, allAttendees, activityFeed, totals, loading: dataLoading } = useOrganizerAnalytics(filteredEvents)

  const rangeDays = RANGE_DAYS[dateRange]
  const attendeesInRange = useMemo(
    () => allAttendees.filter(a => isWithinRange(a.purchasedAt?.toDate?.().toISOString(), rangeDays)),
    [allAttendees, rangeDays]
  )

  const revenueSeries = useMemo(() => buildRevenueSeries(attendeesInRange, Math.min(rangeDays, 60)), [attendeesInRange, rangeDays])
  const ticketsSeries = useMemo(() => {
    const series = buildRevenueSeries(
      attendeesInRange.map(a => ({ ...a, totalPaid: a.quantity || 1 })),
      Math.min(rangeDays, 60)
    )
    return series
  }, [attendeesInRange, rangeDays])
  const registrationsSeries = useMemo(() => {
    return buildRevenueSeries(attendeesInRange.map(a => ({ ...a, totalPaid: 1 })), Math.min(rangeDays, 60))
  }, [attendeesInRange, rangeDays])
  const checkInsSeries = useMemo(() => {
    return buildRevenueSeries(
      attendeesInRange.filter(a => a.checkedIn).map(a => ({ ...a, totalPaid: 1 })),
      Math.min(rangeDays, 60)
    )
  }, [attendeesInRange, rangeDays])

  const insights = useMemo(() => generateInsights(eventStats, allAttendees), [eventStats, allAttendees])

  const loading = eventsLoading || dataLoading

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.8px', marginBottom: 6, color: '#fff',
        }}>
          Active Events Analytics
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>
          Monitor the performance of all your active events in one place.
        </p>
      </div>

      <AnalyticsFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        eventType={eventType} onEventTypeChange={setEventType} eventTypeOptions={eventTypeOptions}
        city={city} onCityChange={setCity} cityOptions={cityOptions}
        status={status} onStatusChange={setStatus}
        search={search} onSearchChange={setSearch}
        onReset={() => { setDateRange('30d'); setEventType('all'); setCity('all'); setStatus('active'); setSearch('') }}
      />

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          Loading analytics...
        </div>
      ) : (
        <>
          <KPICards totals={totals} />

          <PerformanceChart
            revenueSeries={revenueSeries}
            ticketsSeries={ticketsSeries}
            registrationsSeries={registrationsSeries}
            checkInsSeries={checkInsSeries}
          />

          <div className="ea-two-col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 20 }}>
            <TopPerformingEvents stats={eventStats} />
            <EventsNeedingAttention stats={eventStats} />
          </div>

          <div className="ea-three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <RevenueByEvent stats={eventStats} />
            <TicketSalesDonut stats={eventStats} />
            <LiveActivityFeed activity={activityFeed} />
          </div>

          <div className="ea-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <TodaysSnapshot attendees={allAttendees} />
            <Insights insights={insights} />
          </div>

          <AllActiveEventsGrid stats={eventStats} />
        </>
      )}

      <style>{`
        @media (max-width: 1100px) {
          .ea-three-col { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .ea-two-col, .ea-three-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}