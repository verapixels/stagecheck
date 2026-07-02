// src/components/EventAnalytics/AnalyticsFilters.tsx
import { CalendarDays, Filter, RotateCcw, Search } from 'lucide-react'
import type { DateRangeFilter, StatusFilter } from './Types'

interface Props {
  dateRange: DateRangeFilter
  onDateRangeChange: (v: DateRangeFilter) => void
  eventType: string
  onEventTypeChange: (v: string) => void
  eventTypeOptions: string[]
  city: string
  onCityChange: (v: string) => void
  cityOptions: string[]
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  search: string
  onSearchChange: (v: string) => void
  onReset: () => void
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(19,26,46,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#fff',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  cursor: 'pointer',
  minWidth: 130,
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  year: 'This Year',
  all: 'All Time',
}

export default function AnalyticsFilters(props: Props) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end',
      marginBottom: 20,
    }}>
      <div>
        <div style={labelStyle}><CalendarDays size={10} style={{ marginRight: 4, verticalAlign: -1 }} />Date Range</div>
        <select style={selectStyle} value={props.dateRange} onChange={e => props.onDateRangeChange(e.target.value as DateRangeFilter)}>
          {Object.entries(DATE_RANGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Event Type</div>
        <select style={selectStyle} value={props.eventType} onChange={e => props.onEventTypeChange(e.target.value)}>
          <option value="all">All Types</option>
          {props.eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <div style={labelStyle}>City</div>
        <select style={selectStyle} value={props.city} onChange={e => props.onCityChange(e.target.value)}>
          <option value="all">All Cities</option>
          {props.cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Status</div>
        <select style={selectStyle} value={props.status} onChange={e => props.onStatusChange(e.target.value as StatusFilter)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
        <div style={labelStyle}>&nbsp;</div>
        <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 12, top: 12 }} />
        <input
          value={props.search}
          onChange={e => props.onSearchChange(e.target.value)}
          placeholder="Search events..."
          style={{ ...selectStyle, width: '100%', paddingLeft: 34, cursor: 'text' }}
        />
      </div>

      <button
        onClick={props.onReset}
        style={{
          ...selectStyle, display: 'flex', alignItems: 'center', gap: 6,
          minWidth: 'auto', color: 'rgba(255,255,255,0.5)', fontWeight: 600,
        }}
      >
        <Filter size={13} /> <RotateCcw size={13} /> Reset
      </button>
    </div>
  )
}