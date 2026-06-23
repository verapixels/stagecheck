import { useState, useRef, useEffect } from 'react'
import { CalendarDays, Clock, ChevronRight, ChevronLeft } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
}

export function OnboardingDatePicker({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const selectDay = (d: number) => { onChange(`${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`); setOpen(false) }
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }
  const displayVal = parsed ? `${MONTHS[parsed.getMonth()].slice(0,3)} ${parsed.getDate()}, ${parsed.getFullYear()}` : ''

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : open ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, userSelect: 'none' }}>
        <CalendarDays size={15} color={open ? '#22C55E' : 'rgba(255,255,255,0.7)'} />
        <span style={{ flex: 1, fontSize: 14, color: displayVal ? '#fff' : 'rgba(255,255,255,0.4)' }}>{displayVal || 'Pick a date'}</span>
        <ChevronRight size={14} color="rgba(255,255,255,0.4)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, width: 280, boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={15} /></button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={15} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', padding: '3px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
              const isSelected = parsed?.getDate() === d && parsed?.getMonth() === viewMonth && parsed?.getFullYear() === viewYear
              const isToday = today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear
              return (
                <div key={d} onClick={() => selectDay(d)} style={{ textAlign: 'center', fontSize: 12, padding: '6px 2px', borderRadius: 8, cursor: 'pointer', fontWeight: isSelected ? 700 : 400, background: isSelected ? '#22C55E' : isToday ? 'rgba(34,197,94,0.12)' : 'transparent', color: isSelected ? '#0B1020' : isToday ? '#22C55E' : 'rgba(255,255,255,0.8)' }}>
                  {d}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function OnboardingTimePicker({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hours = value ? parseInt(value.split(':')[0]) : null
  const minutes = value ? parseInt(value.split(':')[1]) : null
  const ampm = hours !== null ? (hours >= 12 ? 'PM' : 'AM') : null
  const displayHour = hours !== null ? (hours % 12 || 12) : null
  const displayVal = hours !== null && minutes !== null ? `${displayHour}:${String(minutes).padStart(2,'0')} ${ampm}` : ''

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const setTime = (h: number, m: number) => onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : open ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, userSelect: 'none' }}>
        <Clock size={15} color={open ? '#22C55E' : 'rgba(255,255,255,0.7)'} />
        <span style={{ flex: 1, fontSize: 14, color: displayVal ? '#fff' : 'rgba(255,255,255,0.4)' }}>{displayVal || 'Pick a time'}</span>
        <ChevronRight size={14} color="rgba(255,255,255,0.4)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, width: 260, boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['AM', 'PM'] as const).map(period => (
              <button key={period} onClick={() => { if (hours === null) { setTime(period === 'AM' ? 8 : 20, 0); return } const base = hours % 12; setTime(period === 'AM' ? base : base + 12, minutes ?? 0) }}
                style={{ flex: 1, padding: 7, borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: ampm === period ? '#22C55E' : 'rgba(255,255,255,0.06)', color: ampm === period ? '#0B1020' : 'rgba(255,255,255,0.8)' }}>
                {period}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6 }}>HOUR</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                {hourOptions.map(h => {
                  const h24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h)
                  const sel = displayHour === h
                  return <div key={h} onClick={() => setTime(h24, minutes ?? 0)} style={{ textAlign: 'center', padding: '5px 2px', fontSize: 12, borderRadius: 7, cursor: 'pointer', fontWeight: sel ? 700 : 400, background: sel ? '#22C55E' : 'transparent', color: sel ? '#0B1020' : 'rgba(255,255,255,0.7)' }}>{h}</div>
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6 }}>MIN</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                {minuteOptions.map(m => {
                  const sel = minutes === m
                  return <div key={m} onClick={() => setTime(hours ?? 8, m)} style={{ textAlign: 'center', padding: '5px 2px', fontSize: 12, borderRadius: 7, cursor: 'pointer', fontWeight: sel ? 700 : 400, background: sel ? '#22C55E' : 'transparent', color: sel ? '#0B1020' : 'rgba(255,255,255,0.7)' }}>{String(m).padStart(2,'0')}</div>
                })}
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ marginTop: 12, width: '100%', padding: 8, borderRadius: 9, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
        </div>
      )}
    </div>
  )
}