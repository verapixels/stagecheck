import { Check } from 'lucide-react'
import { ALL_MODULES } from './onboardingConstants'

type Props = {
  enabledModules: string[]
  onToggleModule: (moduleId: string) => void
}

export default function OnboardingModulesStep({ enabledModules, onToggleModule }: Props) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
        {ALL_MODULES.map(m => {
          const on = enabledModules.includes(m.id)
          return (
            <div
              key={m.id}
              onClick={() => onToggleModule(m.id)}
              style={{
                background: on ? `${m.color}10` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${on ? `${m.color}40` : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: '14px', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: on ? '#fff' : 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{m.desc}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: on ? m.color : 'rgba(255,255,255,0.08)',
                border: `1px solid ${on ? m.color : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>
                {on && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
          {enabledModules.length} module{enabledModules.length !== 1 ? 's' : ''} enabled
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {enabledModules.length === 0 ? (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No modules selected</span>
          ) : (
            enabledModules.map(id => {
              const m = ALL_MODULES.find(x => x.id === id)
              if (!m) return null
              return (
                <span key={id} style={{ fontSize: 11, background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color, padding: '3px 10px', borderRadius: 20 }}>
                  {m.label}
                </span>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}