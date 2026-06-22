// ─── EventDetail helper functions ─────────────────────────────────────────────

export function formatDate(val: any): string {
  try {
    let d: Date
    if (val?.toDate) d = val.toDate()
    else if (val instanceof Date) d = val
    else d = new Date(val)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function formatDateShort(val: any): string {
  try {
    let d: Date
    if (val?.toDate) d = val.toDate()
    else if (val instanceof Date) d = val
    else d = new Date(val)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function formatTime(time: string): string {
  if (!time) return ''
  try {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return time
  }
}

export function getEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    choir: 'Choir Concert',
    talent: 'Talent Show',
    conference: 'Conference',
    competition: 'Competition',
    drama: 'Drama / Theatre',
    worship: 'Worship Night',
    openmic: 'Open Mic',
    graduation: 'Award / Graduation',
    custom: 'Event',
    concert: 'Live In Concert',
    music: 'Music Concert',
  }
  return map[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : '')
}

export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return (
    'SC-' +
    Array.from({ length: 3 }, () =>
      Array.from(
        { length: 4 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    ).join('-')
  )
}

export function formatAttendingCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}