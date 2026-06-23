import { ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

type Props = {
  onContinue: () => void
  continueLabel?: string
  loading?: boolean
}

export default function OnboardingFooterBar({ onContinue, continueLabel = 'Save & Continue', loading }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        background: 'rgba(19,26,46,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '14px 18px',
        marginTop: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
        <ShieldCheck size={15} color="#22C55E" />
        Your event is safe with us. You can save as draft and publish later.
      </div>
      <button
        onClick={onContinue}
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #22C55E, #16a34a)',
          border: 'none',
          color: '#0B1020',
          padding: '12px 22px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontFamily: 'var(--font-body)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
          flexShrink: 0,
        }}
      >
        {loading ? (
          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
        ) : (
          <>{continueLabel} {continueLabel.includes('Create') ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}</>
        )}
      </button>
    </div>
  )
}