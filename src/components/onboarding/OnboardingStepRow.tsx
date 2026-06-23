import { ChevronRight, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  number: number
  label: string
  desc: string
  statusText?: string
  color: string
  active: boolean
  done: boolean
  onToggle: () => void
  children?: ReactNode
}

export default function OnboardingStepRow({ number, label, desc, statusText, color, active, done, onToggle, children }: Props) {
  return (
    <div
      style={{
        background: 'rgba(19,26,46,0.8)',
        border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        marginBottom: 12,
        transition: 'border-color 0.2s',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            background: done ? color : active ? `${color}25` : 'rgba(255,255,255,0.08)',
            border: `1px solid ${done || active ? color : 'rgba(255,255,255,0.15)'}`,
            color: done ? '#0B1020' : active ? color : 'rgba(255,255,255,0.5)',
            transition: 'all 0.2s',
          }}
        >
          {done ? <CheckCircle2 size={14} /> : number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{desc}</div>
        </div>
        {statusText && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, whiteSpace: 'nowrap' }}>{statusText}</div>
        )}
        <ChevronRight
          size={16}
          color="rgba(255,255,255,0.4)"
          style={{ flexShrink: 0, transform: active ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        />
      </div>
      {active && children && (
        <div style={{ padding: '4px 18px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {children}
        </div>
      )}
    </div>
  )
}