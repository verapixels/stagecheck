import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Ticket, Plus, Trash2, QrCode, Users, TrendingUp, Loader2, Check,
  Edit2, X, Tag, Hash, AlignLeft, Palette, Layers,
  BarChart2, UserCheck, BadgeDollarSign, Sparkles, Gift, CreditCard,
  ScanLine, Keyboard, Camera, CameraOff, CheckCircle2, XCircle,
  AlertCircle, ArrowLeft, Zap,
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'
import jsQR from 'jsqr'

/* ─── Types ─── */
interface TicketType {
  id: string; name: string; price: number; isFree: boolean
  quantity: number; sold: number; description?: string; color: string
}

interface Attendee {
  id: string; name: string; email: string; ticketType: string
  ticketCode: string; checkedIn: boolean; checkedInAt?: any; purchasedAt?: any
}

type CheckinResult =
  | { status: 'success'; attendee: Attendee }
  | { status: 'already';  attendee: Attendee }
  | { status: 'invalid' }
  | null

interface ConfirmCheckinModal {
  attendee: Attendee
  inputCode: string
  error: string | null
}

/* ─── Constants ─── */
const PRESET_COLORS = [
  '#22C55E','#3B82F6','#F59E0B','#8B5CF6',
  '#EC4899','#14B8A6','#EF4444','#F97316',
  '#06B6D4','#A855F7','#84CC16','#FBBF24',
]
const EMPTY_FORM = { name: '', isFree: true, price: 0, quantity: 100, description: '', color: PRESET_COLORS[0] }
const isValidHex = (h: string) => /^#[0-9A-Fa-f]{6}$/.test(h)

const SUB  = 'rgba(255,255,255,0.80)'
const SUB2 = 'rgba(255,255,255,0.62)'

/* ══════════════════════════════════════════════
   NUMERIC INPUT
══════════════════════════════════════════════ */
function NumericInput({ value, onChange, min = 0, placeholder = '0', style }: {
  value: number; onChange: (n: number) => void
  min?: number; placeholder?: string; style?: React.CSSProperties
}) {
  const [display, setDisplay] = useState(value === 0 ? '' : String(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => { if (!focused) setDisplay(value === 0 ? '' : String(value)) }, [value, focused])
  return (
    <input type="text" inputMode="numeric" pattern="[0-9]*"
      value={display} placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        const n = parseInt(display) || 0
        const clamped = Math.max(min, n)
        onChange(clamped); setDisplay(clamped === 0 ? '' : String(clamped))
      }}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, ''); setDisplay(raw)
        if (raw !== '') onChange(Math.max(min, parseInt(raw)))
      }}
      style={style}
    />
  )
}

/* ══════════════════════════════════════════════
   COLOR PICKER
══════════════════════════════════════════════ */
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [hex, setHex] = useState(value)
  const [hexError, setHexError] = useState(false)
  const nativeRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setHex(value) }, [value])

  const handleHexChange = (raw: string) => {
    let val = raw.trim(); if (!val.startsWith('#')) val = '#' + val; setHex(val)
    if (isValidHex(val)) { setHexError(false); onChange(val) } else setHexError(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => { onChange(c); setHex(c); setHexError(false) }} style={{
            width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
            border: value === c ? '2px solid #fff' : '2px solid transparent',
            transform: value === c ? 'scale(1.18)' : 'scale(1)', transition: 'all 0.13s',
            boxShadow: value === c ? `0 0 0 3px ${c}55` : 'none', outline: 'none', flexShrink: 0,
          }} />
        ))}
        <button title="Open colour picker" onClick={() => nativeRef.current?.click()} style={{
          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
          background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none', flexShrink: 0,
        }}>
          <Palette size={12} color={SUB2} />
        </button>
        <input ref={nativeRef} type="color" value={value}
          onChange={e => { setHex(e.target.value); setHexError(false); onChange(e.target.value) }}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: isValidHex(hex) ? hex : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
        }} />
        <input value={hex} onChange={e => handleHexChange(e.target.value)}
          placeholder="#22C55E" maxLength={7}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${hexError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, color: hexError ? '#F87171' : '#fff', fontSize: 13,
            padding: '9px 12px', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em',
          }}
        />
        {hexError && <span style={{ fontSize: 11, color: '#F87171', whiteSpace: 'nowrap' }}>invalid hex</span>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   CHECK-IN STATION
══════════════════════════════════════════════ */
function CheckinStation({ eventId, attendees, onBack }: {
  eventId: string; attendees: Attendee[]; onBack: () => void
}) {
  const [mode, setMode]             = useState<'camera' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [result, setResult]         = useState<CheckinResult>(null)
  const [processing, setProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [scanCount, setScanCount]   = useState(0)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)
  const lastScanned = useRef('')
  const manualRef   = useRef<HTMLInputElement>(null)

  // jsQR is imported directly — no CDN loading needed

  /* Process ticket code */
  const processCode = useCallback(async (rawCode: string) => {
    let code = rawCode.trim().toUpperCase()
    try {
      const parsed = JSON.parse(rawCode.trim())
      if (parsed.code) code = parsed.code.toUpperCase()
    } catch { /* not JSON, use raw */ }
    if (!code || processing) return
    setProcessing(true); setResult(null)

    const playSound = (type: 'success' | 'already' | 'invalid') => {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'success') {
        // Happy ding ding
        osc.frequency.setValueAtTime(523, ctx.currentTime)        // C5
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12) // E5
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24) // G5
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.6)
      } else if (type === 'already') {
        // Warning beep
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.setValueAtTime(350, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
      } else {
        // Error buzz
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(180, ctx.currentTime)
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      }
    }

    try {
      const att = attendees.find(a => a.ticketCode?.toUpperCase() === code)
      if (!att)          { playSound('invalid'); setResult({ status: 'invalid' }); return }
      if (att.checkedIn) { playSound('already'); setResult({ status: 'already', attendee: att }); return }
      await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), {
        checkedIn: true, checkedInAt: serverTimestamp(),
      })
      setScanCount(n => n + 1)
      playSound('success')
      setResult({ status: 'success', attendee: { ...att, checkedIn: true } })
    } finally { setProcessing(false) }
  }, [attendees, eventId, processing])

  /* Auto-clear result after 4s */
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => {
      setResult(null); lastScanned.current = ''
      if (mode === 'manual') { setManualCode(''); manualRef.current?.focus() }
    }, 4000)
    return () => clearTimeout(t)
  }, [result, mode])

  /* Auto-focus manual input */
  useEffect(() => {
    if (mode === 'manual') setTimeout(() => manualRef.current?.focus(), 120)
  }, [mode])

  /* Camera */
  const startCamera = useCallback(async () => {
    setCameraError(null); setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch (e: any) {
      setCameraError(
        e?.name === 'NotAllowedError' ? 'Camera permission denied. Allow camera access in your browser settings.' :
        e?.name === 'NotFoundError'   ? 'No camera found on this device.' :
        'Could not access camera.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraReady(false)
  }, [])

  /* Scan loop */
  useEffect(() => {
  if (mode !== 'camera' || !cameraReady) return
  let lastTime = 0
  const THROTTLE_MS = 150  // decode at most ~6fps — plenty for QR

  const scan = (timestamp: number) => {
    rafRef.current = requestAnimationFrame(scan)
    if (timestamp - lastTime < THROTTLE_MS) return
    lastTime = timestamp

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    // Downscale to max 400px wide before passing to jsQR
    const scale = Math.min(1, 400 / video.videoWidth)
    canvas.width  = Math.round(video.videoWidth  * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
    if (code?.data && code.data !== lastScanned.current && !processing) {
      lastScanned.current = code.data
      processCode(code.data)
    }
  }

  rafRef.current = requestAnimationFrame(scan)
  return () => cancelAnimationFrame(rafRef.current)
}, [mode, cameraReady, processing, processCode])


  useEffect(() => {
    if (mode === 'camera') startCamera()
    else stopCamera()
    return () => stopCamera()
  }, [mode])

  const handleManualKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && manualCode.trim()) processCode(manualCode)
  }

  const checkedInCount = attendees.filter(a => a.checkedIn).length

  const resultColors = {
    success: { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  icon: <CheckCircle2 size={28} color="#22C55E" /> },
    already: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', icon: <AlertCircle  size={28} color="#FBBF24" /> },
    invalid: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  icon: <XCircle      size={28} color="#EF4444" /> },
  }

  const glass: React.CSSProperties = {
    background: 'rgba(12,17,35,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '0 2px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: SUB, padding: '8px 14px', borderRadius: 10,
          cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', flexShrink: 0,
        }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(15px,3vw,20px)', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Check-in Station
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: SUB2, marginTop: 2 }}>
            {checkedInCount} of {attendees.length} checked in
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '6px 12px', flexShrink: 0 }}>
          <Zap size={12} color="#22C55E" />
          <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 700 }}>{scanCount} scanned</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.07)', gap: 4, marginBottom: 20 }}>
        {([
          { key: 'camera', icon: <Camera size={14} />,   label: 'Camera Scan' },
          { key: 'manual', icon: <Keyboard size={14} />, label: 'Manual / Scanner' },
        ] as const).map(opt => (
          <button key={opt.key} onClick={() => setMode(opt.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
            background: mode === opt.key ? 'rgba(255,255,255,0.09)' : 'transparent',
            color: mode === opt.key ? '#fff' : SUB2,
          }}>
            {opt.icon}
            <span className="btn-label">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Camera mode */}
      {mode === 'camera' && (
        <div style={{ ...glass, overflow: 'hidden', marginBottom: 20 }}>
          {cameraError ? (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <CameraOff size={36} color="rgba(239,68,68,0.6)" style={{ marginBottom: 14 }} />
              <p style={{ color: '#F87171', fontSize: 14, margin: '0 0 14px', lineHeight: 1.6 }}>{cameraError}</p>
              <button onClick={() => { setCameraError(null); startCamera() }} style={{
                padding: '9px 24px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)',
                background: 'rgba(34,197,94,0.1)', color: '#22C55E', cursor: 'pointer',
                fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600,
              }}>Try Again</button>
            </div>
          ) : (
            <div style={{ position: 'relative', aspectRatio: '4/3', background: '#000' }}>
              <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {cameraReady && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {[
                    { top: '25%', left: '25%', borderTop: '3px solid #22C55E', borderLeft: '3px solid #22C55E', borderRadius: '4px 0 0 0' },
                    { top: '25%', right: '25%', borderTop: '3px solid #22C55E', borderRight: '3px solid #22C55E', borderRadius: '0 4px 0 0' },
                    { bottom: '25%', left: '25%', borderBottom: '3px solid #22C55E', borderLeft: '3px solid #22C55E', borderRadius: '0 0 0 4px' },
                    { bottom: '25%', right: '25%', borderBottom: '3px solid #22C55E', borderRight: '3px solid #22C55E', borderRadius: '0 0 4px 0' },
                  ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />)}
                  <div style={{ position: 'absolute', left: '25%', right: '25%', height: 2, background: 'linear-gradient(90deg,transparent,#22C55E,transparent)', animation: 'scanline 2s ease-in-out infinite' }} />
                </div>
              )}
              {!cameraReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Loader2 size={28} color="#22C55E" style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
                    <p style={{ color: SUB, fontSize: 13, margin: 0 }}>
                      Starting camera…
                    </p>
                  </div>
                </div>
              )}
              {processing && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={28} color="#22C55E" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          )}
          {cameraReady && (
            <div style={{ padding: '12px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
                <ScanLine size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Point camera at a ticket QR code
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual / external scanner mode */}
      {mode === 'manual' && (
        <div style={{ ...glass, padding: '22px 20px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Keyboard size={14} color={SUB2} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SUB2 }}>
              Enter or Scan Ticket Code
            </span>
          </div>
          <p style={{ fontSize: 13, color: SUB2, margin: '0 0 16px', lineHeight: 1.55 }}>
            Type a code and press Enter — or connect a USB/Bluetooth barcode scanner. This field stays focused automatically.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              ref={manualRef}
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={handleManualKey}
              placeholder="e.g. SC-89NB-56AE-UZQ3"
              autoComplete="off" spellCheck={false}
              style={{
                flex: 1, minWidth: 160,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, color: '#fff', fontSize: 15,
                padding: '13px 16px', outline: 'none',
                fontFamily: 'monospace', letterSpacing: '0.07em',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <button
              onClick={() => manualCode.trim() && processCode(manualCode)}
              disabled={!manualCode.trim() || processing}
              style={{
                padding: '13px 18px', borderRadius: 12, border: 'none',
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                background: manualCode.trim() ? '#22C55E' : 'rgba(255,255,255,0.07)',
                color: manualCode.trim() ? '#000' : 'rgba(255,255,255,0.25)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {processing ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
              Check In
            </button>
          </div>
          <p style={{ fontSize: 12, color: SUB2, margin: '12px 0 0' }}>
            💡 External scanners work here — they type the code and send Enter automatically
          </p>
        </div>
      )}

      {/* Result panel */}
      {result && (() => {
        const rc = resultColors[result.status]
        return (
          <div style={{ ...glass, padding: '20px 22px', border: `1px solid ${rc.border}`, background: rc.bg, marginBottom: 20, animation: 'fadeSlideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{rc.icon}</div>
              <div style={{ flex: 1 }}>
                {result.status === 'success' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-display)', marginBottom: 4 }}>✓ Checked in successfully</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{result.attendee.name}</div>
                  <div style={{ fontSize: 12, color: SUB, marginBottom: 6 }}>{result.attendee.email}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '3px 10px', borderRadius: 6 }}>{result.attendee.ticketType}</span>
                </>)}
                {result.status === 'already' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-display)', marginBottom: 4 }}>Already checked in</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{result.attendee.name}</div>
                  <div style={{ fontSize: 12, color: SUB, marginBottom: 4 }}>{result.attendee.email}</div>
                  <div style={{ fontSize: 13, color: 'rgba(251,191,36,0.85)' }}>This ticket was already scanned — do not allow re-entry.</div>
                </>)}
                {result.status === 'invalid' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-display)', marginBottom: 4 }}>Invalid ticket code</div>
                  <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.8)' }}>This code doesn't match any ticket. Check for typos or verify the ticket belongs to this event.</div>
                </>)}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Recent check-ins */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color={SUB2} />
          <span style={{ fontSize: 11, fontWeight: 600, color: SUB2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Check-ins</span>
        </div>
        {attendees.filter(a => a.checkedIn).length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: SUB2 }}>No check-ins yet</div>
        ) : (
          [...attendees].filter(a => a.checkedIn).slice(-8).reverse().map((att, i, arr) => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={13} color="#22C55E" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                <div style={{ fontSize: 12, color: SUB2 }}>{att.ticketType}</div>
              </div>
              <code style={{ fontSize: 11, color: SUB2, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 5, flexShrink: 0, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                {att.ticketCode}
              </code>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes scanline { 0% { top:25% } 50% { top:75% } 100% { top:25% } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @media (max-width: 380px) { .btn-label { display: none; } }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function TicketingPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules } = useEvent()
  const [tickets, setTickets]     = useState<TicketType[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tickets' | 'attendees' | 'checkin'>('tickets')
  const [search, setSearch]       = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [confirmModal, setConfirmModal]   = useState<ConfirmCheckinModal | null>(null)
  const confirmInputRef = useRef<HTMLInputElement>(null)
  const drawerRef       = useRef<HTMLDivElement>(null)

  /* Firestore listeners */
  useEffect(() => {
    if (!eventId) return
    const unsubT = onSnapshot(collection(db, 'events', eventId, 'tickets'), snap => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as TicketType))); setLoading(false)
    })
    const unsubA = onSnapshot(collection(db, 'events', eventId, 'attendees'), snap => {
      setAttendees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendee)))
    })
    return () => { unsubT(); unsubA() }
  }, [eventId])

  /* Close drawer on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showForm && drawerRef.current && !drawerRef.current.contains(e.target as Node)) closeForm()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showForm])

  /* Focus confirm modal input */
  useEffect(() => {
    if (confirmModal) setTimeout(() => confirmInputRef.current?.focus(), 100)
  }, [confirmModal])

  const openNew  = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }
  const openEdit = (t: TicketType) => {
    setForm({ name: t.name, isFree: t.isFree ?? t.price === 0, price: t.price, quantity: t.quantity, description: t.description || '', color: t.color })
    setEditingId(t.id); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (!eventId || !form.name.trim()) return
    setSaving(true)
    try {
      const finalPrice = form.isFree ? 0 : form.price
      if (editingId) {
        await updateDoc(doc(db, 'events', eventId, 'tickets', editingId), { ...form, price: finalPrice })
      } else {
        await addDoc(collection(db, 'events', eventId, 'tickets'), { ...form, price: finalPrice, sold: 0, createdAt: serverTimestamp() })
      }
      closeForm()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!eventId) return
    await deleteDoc(doc(db, 'events', eventId, 'tickets', id)); setDeleteConfirm(null)
  }

  /* Confirm-code manual check-in */
  const openConfirmModal = (att: Attendee) => {
    setConfirmModal({ attendee: att, inputCode: '', error: null })
  }
  const submitConfirmModal = async () => {
    if (!confirmModal || !eventId) return
    const entered  = confirmModal.inputCode.trim().toUpperCase()
    const expected = confirmModal.attendee.ticketCode?.toUpperCase()
    if (entered !== expected) {
      setConfirmModal(m => m ? { ...m, error: 'Code does not match. Please check and try again.' } : null)
      return
    }
    await updateDoc(doc(db, 'events', eventId, 'attendees', confirmModal.attendee.id), {
      checkedIn: true, checkedInAt: serverTimestamp(),
    })
    setConfirmModal(null)
  }

  /* Undo check-in */
  const undoCheckin = async (att: Attendee) => {
    if (!eventId) return
    await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), { checkedIn: false, checkedInAt: null })
  }

  /* Stats */
  const totalRevenue = tickets.reduce((s, t) => s + (t.isFree ? 0 : t.price) * t.sold, 0)
  const totalSold    = tickets.reduce((s, t) => s + t.sold, 0)
  const totalCap     = tickets.reduce((s, t) => s + t.quantity, 0)
  const checkedInCnt = attendees.filter(a => a.checkedIn).length
  const fillRate     = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0

  const filteredAttendees = attendees.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.ticketCode?.toLowerCase().includes(search.toLowerCase())
  )

  /* Styles */
  const glass: React.CSSProperties = {
    background: 'rgba(12,17,35,0.75)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
  }
  const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: SUB2,
  }
  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, color: '#fff', fontSize: 14, padding: '11px 14px', outline: 'none',
    fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s',
  }
  const focusInp = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = `${form.color}66`; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
  }
  const blurInp = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
  }

  const displayPrice = (t: TicketType) => (t.isFree ?? t.price === 0) ? 'Free' : `₦${t.price.toLocaleString()}`

  const stats = [
    { label: 'Types',      value: tickets.length,                          icon: <Layers size={15} />,         color: '#818CF8' },
    { label: 'Sold / Cap', value: `${totalSold}/${totalCap}`,              icon: <BarChart2 size={15} />,       color: '#34D399' },
    { label: 'Fill Rate',  value: `${fillRate}%`,                          icon: <TrendingUp size={15} />,      color: '#60A5FA' },
    { label: 'Checked In', value: `${checkedInCnt}/${attendees.length}`,   icon: <UserCheck size={15} />,       color: '#A78BFA' },
    { label: 'Revenue',    value: `₦${totalRevenue.toLocaleString()}`,     icon: <BadgeDollarSign size={15} />, color: '#FBBF24' },
  ]

  /* Render check-in station as full-page */
  if (activeTab === 'checkin' && eventId) {
    return (
      <DashboardLayout plan="starter" eventType={eventType ?? 'custom'} eventId={eventId} enabledModules={enabledModules}>
        <CheckinStation eventId={eventId} attendees={attendees} onBack={() => setActiveTab('attendees')} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout plan="starter" eventType={eventType ?? 'custom'} eventId={eventId} enabledModules={enabledModules}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ background: 'rgba(236,72,153,0.12)', borderRadius: 10, padding: '7px 8px', display: 'flex' }}>
            <Ticket size={18} color="#EC4899" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.3rem,4vw,2rem)', letterSpacing: '-0.6px', color: '#fff', margin: 0 }}>
            Ticketing
          </h1>
        </div>
        <p style={{ fontSize: 13, color: SUB2, margin: 0 }}>
          Create ticket tiers, track sales, and manage attendance
        </p>
      </div>

      {/* Stats grid */}
      <div className="stat-grid" style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ ...glass, padding: '13px 15px', borderRadius: 16, borderLeft: `3px solid ${s.color}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: s.color, opacity: 0.85 }}>{s.icon}</span>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: 'clamp(0.9rem,2.5vw,1.3rem)', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginBottom: 2, letterSpacing: '-0.3px', lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: SUB2, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar + actions */}
      <div className="tab-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.07)', gap: 2, flexShrink: 0 }}>
          {([
            { key: 'tickets',   label: 'Tickets' },
            { key: 'attendees', label: `Attendees (${attendees.length})` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : SUB2,
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              whiteSpace: 'nowrap',
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {activeTab === 'attendees' && (<>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ ...inp, padding: '8px 12px', width: 'clamp(120px,20vw,180px)', borderRadius: 10, fontSize: 13 }}
            />
            <button onClick={() => setActiveTab('checkin')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)',
              color: '#22C55E', padding: '8px 13px', borderRadius: 11,
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
            >
              <ScanLine size={14} />
              <span className="btn-label">Check-in Station</span>
            </button>
          </>)}
          {activeTab === 'tickets' && (
            <button onClick={openNew} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', padding: '8px 14px', borderRadius: 11,
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              <Plus size={14} />
              <span className="btn-label">New Ticket Type</span>
            </button>
          )}
        </div>
      </div>

      {/* ══ TICKETS TAB ══ */}
      {activeTab === 'tickets' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: SUB2, padding: '40px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Loading ticket types…</span>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ ...glass, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ marginBottom: 14, opacity: 0.15 }}><Ticket size={40} color="#fff" /></div>
              <p style={{ fontSize: 14, color: SUB2, margin: 0 }}>No ticket types yet — create your first one.</p>
            </div>
          ) : (
            <div className="ticket-grid">
              {tickets.map(t => {
                const isFree = t.isFree ?? t.price === 0
                const pct = t.quantity > 0 ? Math.min(100, Math.round((t.sold / t.quantity) * 100)) : 0
                return (
                  <div key={t.id} style={{
                    background: 'rgba(12,17,35,0.8)', border: `1px solid ${t.color}22`,
                    borderRadius: 20, overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${t.color}18` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: 3, background: `linear-gradient(90deg,${t.color},${t.color}44)` }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            {isFree ? <Gift size={11} color={t.color} /> : <CreditCard size={11} color={t.color} />}
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.color, opacity: 0.85 }}>
                              {isFree ? 'Free ticket' : 'Paid ticket'}
                            </span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 3, lineHeight: 1.3 }}>{t.name}</div>
                          {t.description && <div style={{ fontSize: 12, color: SUB2, lineHeight: 1.4 }}>{t.description}</div>}
                        </div>
                        <div style={{ background: `${t.color}18`, border: `1px solid ${t.color}30`, borderRadius: 10, padding: '5px 10px', textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: t.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>{displayPrice(t)}</div>
                          {!isFree && <div style={{ fontSize: 10, color: `${t.color}80`, marginTop: 1 }}>per ticket</div>}
                        </div>
                      </div>

                      <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                          { icon: <Tag size={11} />,        label: 'Capacity',  value: `${t.quantity} total` },
                          { icon: <Users size={11} />,      label: 'Sold',      value: `${t.sold} sold` },
                          { icon: <Hash size={11} />,       label: 'Remaining', value: `${t.quantity - t.sold} left` },
                          { icon: <TrendingUp size={11} />, label: 'Revenue',   value: isFree ? 'N/A' : `₦${(t.price * t.sold).toLocaleString()}` },
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: SUB2 }}>{item.icon}<span style={{ fontSize: 12 }}>{item.label}</span></div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: SUB2, marginBottom: 5 }}>
                          <span>Sales progress</span>
                          <span style={{ color: t.color, fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${t.color},${t.color}aa)`, borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>

                      {deleteConfirm === t.id ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'rgba(248,113,113,0.85)', flex: 1 }}>Delete this ticket type?</span>
                          <button onClick={() => handleDelete(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: SUB, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: SUB, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          ><Edit2 size={11} /> Edit</button>
                          <button onClick={() => setDeleteConfirm(t.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.04)', color: '#F87171', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.04)'}
                          ><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ══ ATTENDEES TAB ══ */}
      {activeTab === 'attendees' && (
        <div style={{ ...glass, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} color={SUB2} />
              <span style={{ fontSize: 12, fontWeight: 600, color: SUB2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {filteredAttendees.length} {filteredAttendees.length === 1 ? 'Attendee' : 'Attendees'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: SUB2 }}>
              <span style={{ color: '#34D399', fontWeight: 600 }}>{checkedInCnt} checked in</span>
              <span>·</span>
              <span>{attendees.length - checkedInCnt} pending</span>
            </div>
          </div>

          {filteredAttendees.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', fontSize: 13, color: SUB2 }}>
              {search ? 'No attendees match your search.' : 'No attendees yet.'}
            </div>
          ) : (
            <div className="attendee-table">
              <div className="att-row att-header">
                {['Attendee', 'Ticket', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>{h}</span>
                ))}
              </div>
              {filteredAttendees.map((att, i) => (
                <div key={att.id} className="att-row"
                  style={{ borderBottom: i < filteredAttendees.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                    <div style={{ fontSize: 12, color: SUB2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.email}</div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: SUB, padding: '3px 9px', borderRadius: 6, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.ticketType}
                    </span>
                  </div>
                  <div>
                    {att.checkedIn ? (
                      <button onClick={() => undoCheckin(att)}
                        title="Click to undo check-in"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 11px', borderRadius: 8,
                          border: '1px solid rgba(52,211,153,0.25)',
                          background: 'rgba(52,211,153,0.08)', color: '#34D399',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = '#F87171' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.08)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.25)'; e.currentTarget.style.color = '#34D399' }}
                      >
                        <Check size={11} />
                        <span className="btn-label">Checked in</span>
                      </button>
                    ) : (
                      <button onClick={() => openConfirmModal(att)} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 11px', borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)', color: SUB,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      >
                        <QrCode size={11} />
                        <span className="btn-label">Check in</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ CONFIRM CODE MODAL ══ */}
      {confirmModal && (
        <>
          <div onClick={() => setConfirmModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 'min(420px, calc(100vw - 28px))',
            background: 'rgba(10,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, zIndex: 201, padding: 'clamp(20px,4vw,28px)',
            animation: 'fadeSlideIn 0.18s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
                  Verify Ticket Code
                </div>
                <div style={{ fontSize: 13, color: SUB2 }}>
                  Enter the code on <strong style={{ color: '#fff' }}>{confirmModal.attendee.name}</strong>'s ticket
                </div>
              </div>
              <button onClick={() => setConfirmModal(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SUB, flexShrink: 0, marginLeft: 12 }}>
                <X size={13} />
              </button>
            </div>
            <input
              ref={confirmInputRef}
              value={confirmModal.inputCode}
              onChange={e => setConfirmModal(m => m ? { ...m, inputCode: e.target.value.toUpperCase(), error: null } : null)}
              onKeyDown={e => e.key === 'Enter' && submitConfirmModal()}
              placeholder="e.g. SC-89NB-56AE-UZQ3"
              autoComplete="off" spellCheck={false}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${confirmModal.error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 12, color: '#fff', fontSize: 15,
                padding: '13px 16px', outline: 'none',
                fontFamily: 'monospace', letterSpacing: '0.07em', marginBottom: 8,
              }}
            />
            {confirmModal.error && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#F87171' }}>{confirmModal.error}</p>
            )}
            <p style={{ fontSize: 12, color: SUB2, margin: '0 0 16px', lineHeight: 1.5 }}>
              This ensures you're checking in the right person. The code is on their ticket or confirmation email.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={submitConfirmModal} disabled={!confirmModal.inputCode.trim()} style={{
                flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
                background: confirmModal.inputCode.trim() ? '#22C55E' : 'rgba(255,255,255,0.07)',
                color: confirmModal.inputCode.trim() ? '#000' : 'rgba(255,255,255,0.25)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                cursor: confirmModal.inputCode.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Check size={14} /> Confirm Check-in
              </button>
              <button onClick={() => setConfirmModal(null)} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: SUB, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ TICKET FORM DRAWER ══ */}
      <div onClick={closeForm} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
        zIndex: 99, opacity: showForm ? 1 : 0, pointerEvents: showForm ? 'all' : 'none', transition: 'opacity 0.22s',
      }} />

      <div ref={drawerRef} className="drawer" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        background: 'rgba(10,14,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transform: showForm ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: 'rgba(10,14,28,0.98)', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Sparkles size={14} color={editingId ? '#818CF8' : '#34D399'} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                {editingId ? 'Edit Ticket Type' : 'New Ticket Type'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: SUB2 }}>
              {editingId ? 'Update the details below' : 'Fill in the details to create a new tier'}
            </p>
          </div>
          <button onClick={closeForm} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SUB }}>
            <X size={14} />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={fieldWrap}>
            <label style={lbl}><AlignLeft size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Ticket Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. General Admission" style={inp} onFocus={focusInp} onBlur={blurInp} />
          </div>

          <div style={fieldWrap}>
            <label style={lbl}>Ticket Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { key: true,  icon: <Gift size={14} />,       label: 'Free', sub: 'No charge' },
                { key: false, icon: <CreditCard size={14} />, label: 'Paid', sub: 'Set a price' },
              ].map(opt => {
                const active = form.isFree === opt.key
                return (
                  <button key={String(opt.key)} onClick={() => setForm(p => ({ ...p, isFree: opt.key, price: opt.key ? 0 : p.price }))} style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${active ? `${form.color}60` : 'rgba(255,255,255,0.08)'}`,
                    background: active ? `${form.color}12` : 'rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                    textAlign: 'left', color: active ? form.color : SUB2,
                  }}>
                    <span style={{ opacity: active ? 1 : 0.6 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', marginBottom: 1 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>{opt.sub}</div>
                    </div>
                    {active && (
                      <div style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={9} color="#000" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {!form.isFree && (
            <div style={fieldWrap}>
              <label style={lbl}>Price (₦)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: SUB2, pointerEvents: 'none' }}>₦</span>
                <NumericInput value={form.price} onChange={n => setForm(p => ({ ...p, price: n }))} min={0} placeholder="0" style={{ ...inp, paddingLeft: 26 }} />
              </div>
            </div>
          )}

          <div style={fieldWrap}>
            <label style={lbl}>Quantity</label>
            <NumericInput value={form.quantity} onChange={n => setForm(p => ({ ...p, quantity: Math.max(1, n) }))} min={1} placeholder="100" style={inp} />
          </div>

          <div style={fieldWrap}>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Includes programme, seat access, and complimentary drink" rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6, padding: '12px 14px' } as React.CSSProperties}
              onFocus={focusInp as any} onBlur={blurInp as any}
            />
          </div>

          <div style={fieldWrap}>
            <label style={lbl}><Palette size={10} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Accent Colour</label>
            <ColorPicker value={form.color} onChange={c => setForm(p => ({ ...p, color: c }))} />
            <div style={{ marginTop: 4, height: 36, borderRadius: 10, border: `1px solid ${form.color}30`, background: `${form.color}0e`, display: 'flex', alignItems: 'center', paddingLeft: 14, gap: 9 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: form.color, fontWeight: 600 }}>
                {form.name || 'Preview'} · {form.isFree ? 'Free' : form.price > 0 ? `₦${form.price.toLocaleString()}` : 'Set price'}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: 'rgba(10,14,28,0.98)' }}>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: form.name.trim() ? form.color : 'rgba(255,255,255,0.06)',
            border: 'none', color: form.name.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
            padding: '11px 0', borderRadius: 12, cursor: form.name.trim() ? 'pointer' : 'not-allowed',
            fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.18s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
            {editingId ? 'Save Changes' : 'Create Ticket'}
          </button>
          <button onClick={closeForm} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: SUB, cursor: 'pointer', fontSize: 13.5, fontFamily: 'var(--font-body)' }}>
            Cancel
          </button>
        </div>
      </div>

      {/* ══ GLOBAL STYLES ══ */}
      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes scanline     { 0% { top:25% } 50% { top:75% } 100% { top:25% } }
        @keyframes fadeSlideIn  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }

        /* ── Stat grid ── */
        .stat-grid { grid-template-columns: repeat(5, 1fr); }
        @media (max-width: 900px)  { .stat-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 560px)  { .stat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 340px)  { .stat-grid { grid-template-columns: 1fr 1fr !important; } }

        /* ── Ticket card grid ── */
        .ticket-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 14px;
        }
        @media (max-width: 400px) {
          .ticket-grid { grid-template-columns: 1fr; gap: 12px; }
        }

        /* ── Attendees table ── */
        .attendee-table { width: 100%; }
        .att-row {
          display: grid;
          grid-template-columns: 1fr 130px 110px;
          align-items: center;
          padding: 12px 18px;
          transition: background 0.12s;
        }
        .att-header {
          padding: 10px 18px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        @media (max-width: 640px) {
          .att-row { grid-template-columns: 1fr 100px; }
          .att-row > div:nth-child(2) { display: none; }
          .att-header > span:nth-child(2) { display: none; }
        }
        @media (max-width: 420px) {
          .att-row { grid-template-columns: 1fr auto; padding: 10px 14px; }
        }

        /* ── Drawer width ── */
        .drawer { width: min(440px, 100vw); }

        /* ── Tab actions row ── */
        .tab-actions { flex-wrap: wrap; }

        /* ── Button labels hidden on very small screens ── */
        @media (max-width: 360px) {
          .btn-label { display: none; }
        }
      `}</style>
    </DashboardLayout>
  )
}