import { useState, useRef, useEffect } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { EVENT_TYPES } from './onboardingConstants'

type Props = {
  selectedType: string
  onSelectType: (typeId: string) => void
}

export default function OnboardingEventTypeStep({ selectedType, onSelectType }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = EVENT_TYPES.find(t => t.id === selectedType)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', marginTop: 10 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: selectedType ? `${selected?.color}10` : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${selectedType ? `${selected?.color}50` : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12, padding: '13px 15px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
        }}
      >
        {selectedType && selected ? (
          <>
            <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `${selected.color}18`, border: `1px solid ${selected.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected.color }}>
              <selected.icon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{selected.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.desc}</div>
            </div>
          </>
        ) : (
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1 }}>Select event type…</span>
        )}
        <ChevronRight size={16} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'rgba(10,16,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', zIndex: 100, boxShadow: '0 24px 80px rgba(0,0,0,0.65)', maxHeight: '50vh', overflowY: 'auto' }}>
          {EVENT_TYPES.map((t, i) => (
            <div
              key={t.id}
              onClick={() => { onSelectType(t.id); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer',
                background: selectedType === t.id ? `${t.color}12` : 'transparent',
                borderLeft: `3px solid ${selectedType === t.id ? t.color : 'transparent'}`,
                borderBottom: i < EVENT_TYPES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${t.color}15`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color }}>
                <t.icon size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedType === t.id ? '#fff' : 'rgba(255,255,255,0.85)' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
              </div>
              {selectedType === t.id && <Check size={14} color={t.color} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}