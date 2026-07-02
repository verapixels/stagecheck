// src/components/EventAnalytics/analytics.utils.ts
import type { EventStats, AttendeeDoc } from './Types'

export function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`
  return `₦${amount.toLocaleString('en-NG')}`
}

export function formatNairaFull(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0
  return Math.round((part / whole) * 100)
}

export function trendLabel(current: number, previous: number): { value: string; up: boolean } {
  if (previous <= 0) return { value: current > 0 ? 'New' : '0%', up: current >= 0 }
  const change = ((current - previous) / previous) * 100
  return { value: `${Math.abs(change).toFixed(1)}%`, up: change >= 0 }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function isWithinRange(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return d >= cutoff
}

export function isToday(date: Date): boolean {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr)
  const day = d.getDay()
  return day === 0 || day === 6
}

/** Builds a daily revenue series for the last N days from all attendee docs. */
export function buildRevenueSeries(attendees: AttendeeDoc[], days: number): { date: string; label: string; value: number }[] {
  const series: { date: string; label: string; value: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateKey = d.toISOString().split('T')[0]
    series.push({
      date: dateKey,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: 0,
    })
  }

  const byDate = new Map(series.map(s => [s.date, s]))

  for (const a of attendees) {
    if (!a.purchasedAt?.toDate) continue
    const d = a.purchasedAt.toDate()
    const key = d.toISOString().split('T')[0]
    const bucket = byDate.get(key)
    if (bucket) bucket.value += a.totalPaid || 0
  }

  return series
}

/** Generates plain-language insight bullets from aggregated event stats + attendees. */
export function generateInsights(stats: EventStats[], attendees: AttendeeDoc[]): string[] {
  const insights: string[] = []
  if (stats.length === 0) return insights

  const totalRevenue = stats.reduce((s, e) => s + e.revenue, 0)
  if (totalRevenue > 0) {
    const top = [...stats].sort((a, b) => b.revenue - a.revenue)[0]
    const share = pct(top.revenue, totalRevenue)
    if (share >= 30) insights.push(`${top.event.name} generated ${share}% of total revenue.`)
  }

  const weekendRevenue = stats.filter(e => isWeekend(e.event.date)).reduce((s, e) => s + e.revenue, 0)
  const weekdayRevenue = totalRevenue - weekendRevenue
  if (weekendRevenue > 0 && weekdayRevenue > 0) {
    const diff = pct(Math.abs(weekendRevenue - weekdayRevenue), weekdayRevenue)
    if (weekendRevenue > weekdayRevenue && diff >= 10) {
      insights.push(`Weekend events are outperforming weekday events by ${diff}%.`)
    }
  }

  const soldOut = stats.filter(e => e.soldPercent >= 95).length
  if (soldOut > 0) insights.push(`${soldOut} event${soldOut > 1 ? 's are' : ' is'} nearly or fully sold out.`)

  const totalTickets = stats.reduce((s, e) => s + e.ticketsSold, 0)
  if (totalTickets > 0 && totalRevenue > 0) {
    const avgPrice = Math.round(totalRevenue / totalTickets)
    insights.push(`Average ticket price across active events is ${formatNairaFull(avgPrice)}.`)
  }

  const hourCounts = new Array(24).fill(0)
  attendees.forEach(a => {
    if (a.purchasedAt?.toDate) hourCounts[a.purchasedAt.toDate().getHours()]++
  })
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
  if (Math.max(...hourCounts) > 0) {
    const label = peakHour === 0 ? '12 AM' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`
    insights.push(`Ticket purchases peak around ${label}.`)
  }

  return insights.slice(0, 5)
}