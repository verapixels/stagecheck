import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react'

type Props = {
  onAddDates: (dates: string[]) => void
  excludeDates?: string[] // dates already added — shown as disabled
}

const toISODate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
}

export default function OnboardingMultiDatePicker({ onAddDates, excludeDates = [] }: Props) {
  const [viewDate, setViewDate] = useState(new Date())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const toggleDate = (d: Date) => {
    const iso = toISODate(d)
    if (excludeDates.includes(iso)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  const handleAdd = () => {
    if (selected.size === 0) return
    onAddDates(Array.from(selected).sort())
    setSelected(new Set())
  }

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={navBtnStyle}><ChevronLeft size={14} /></button>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{monthLabel}</div>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={navBtnStyle}><ChevronRight size={14} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const iso = toISODate(d)
          const isPast = d < today
          const isSelected = selected.has(iso)
          const isExcluded = excludeDates.includes(iso)
          return (
            <button
              key={i}
              disabled={isPast || isExcluded}
              onClick={() => toggleDate(d)}
              style={{
                aspectRatio: '1', borderRadius: 8,
                border: '1px solid ' + (isSelected ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.08)'),
                background: isSelected ? 'rgba(34,197,94,0.25)' : isExcluded ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                color: isPast || isExcluded ? 'rgba(255,255,255,0.2)' : isSelected ? '#22C55E' : 'rgba(255,255,255,0.75)',
                fontSize: 11, fontWeight: 600, cursor: isPast || isExcluded ? 'not-allowed' : 'pointer',
              }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <button onClick={handleAdd} disabled={selected.size === 0} style={{
        marginTop: 12, width: '100%', padding: '9px', borderRadius: 9,
        background: selected.size ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
        border: '1px solid ' + (selected.size ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'),
        color: selected.size ? '#22C55E' : 'rgba(255,255,255,0.35)',
        fontSize: 13, fontWeight: 700, cursor: selected.size ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <CalendarPlus size={13} /> {selected.size ? `Add ${selected.size} Date${selected.size > 1 ? 's' : ''}` : 'Tap dates to select'}
      </button>
    </div>
  )
}