/* ─────────────────────────────────────────────────────────────
   RegularTicketCheckin.tsx
   Full-screen check-in station — camera scan + manual entry.
   Existing logic preserved, refactored as a named component.
───────────────────────────────────────────────────────────── */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ArrowLeft, Camera, Keyboard, Zap, Users, Check, ScanLine,
  Loader2, CameraOff, CheckCircle2, AlertCircle, XCircle, Lightbulb,
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import jsQR from 'jsqr'
import { CARD, BORDER, TX1, TX2, TX3, G } from '../pages/RegularTicket/RegularTicketTypes'
import type { Attendee, CheckinResult } from '../pages/RegularTicket/RegularTicketTypes'

interface Props {
  eventId: string
  attendees: Attendee[]
  onBack: () => void
}

export default function RegularTicketCheckin({ eventId, attendees, onBack }: Props) {
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

  const playSound = (type: 'success' | 'already' | 'invalid') => {
    try {
      const ctx  = new AudioContext()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      if (type === 'success') {
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6)
      } else if (type === 'already') {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.setValueAtTime(350, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
      } else {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(180, ctx.currentTime)
        gain.gain.setValueAtTime(1.0, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
      }
    } catch { /* audio not available */ }
  }

  const processCode = useCallback(async (rawCode: string) => {
    let code = rawCode.trim().toUpperCase()
    try { const p = JSON.parse(rawCode.trim()); if (p.code) code = p.code.toUpperCase() } catch { /* raw */ }
    if (!code || processing) return
    setProcessing(true); setResult(null)
    try {
      const att = attendees.find(a => a.ticketCode?.toUpperCase() === code)
      if (!att)          { playSound('invalid'); setResult({ status: 'invalid' }); return }
      if (att.checkedIn) { playSound('already'); setResult({ status: 'already', attendee: att }); return }
      await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), { checkedIn: true, checkedInAt: serverTimestamp() })
      setScanCount(n => n + 1)
      playSound('success')
      setResult({ status: 'success', attendee: { ...att, checkedIn: true } })
    } finally { setProcessing(false) }
  }, [attendees, eventId, processing])

  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => {
      setResult(null); lastScanned.current = ''
      if (mode === 'manual') { setManualCode(''); manualRef.current?.focus() }
    }, 4000)
    return () => clearTimeout(t)
  }, [result, mode])

  useEffect(() => {
    if (mode === 'manual') setTimeout(() => manualRef.current?.focus(), 100)
  }, [mode])

  const startCamera = useCallback(async () => {
    setCameraError(null); setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraReady(true) }
    } catch (e: any) {
      setCameraError(
        e?.name === 'NotAllowedError' ? 'Camera permission denied. Allow camera access in your browser settings.' :
        e?.name === 'NotFoundError'   ? 'No camera found on this device.' : 'Could not access camera.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraReady(false)
  }, [])

  useEffect(() => {
    if (mode !== 'camera' || !cameraReady) return
    let lastTime = 0
    const scan = (ts: number) => {
      rafRef.current = requestAnimationFrame(scan)
      if (ts - lastTime < 150) return; lastTime = ts
      const v = videoRef.current; const c = canvasRef.current
      if (!v || !c || v.readyState < 2) return
      const scale = Math.min(1, 400 / v.videoWidth)
      c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale)
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(v, 0, 0, c.width, c.height)
      const img  = ctx.getImageData(0, 0, c.width, c.height)
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
      if (code?.data && code.data !== lastScanned.current && !processing) {
        lastScanned.current = code.data; processCode(code.data)
      }
    }
    rafRef.current = requestAnimationFrame(scan)
    return () => cancelAnimationFrame(rafRef.current)
  }, [mode, cameraReady, processing, processCode])

  useEffect(() => {
    if (mode === 'camera') startCamera(); else stopCamera()
    return () => stopCamera()
  }, [mode])

  const checkedInCount = attendees.filter(a => a.checkedIn).length

  const glass: React.CSSProperties = {
    background: 'rgba(12,17,35,0.8)', border: `1px solid ${BORDER}`, borderRadius: 20,
  }

  const resultConfig = {
    success: { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  icon: <CheckCircle2 size={28} color={G} />,      titleColor: G,        title: 'Checked in successfully' },
    already: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', icon: <AlertCircle  size={28} color="#FBBF24" />, titleColor: '#FBBF24', title: 'Already checked in'       },
    invalid: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  icon: <XCircle      size={28} color="#EF4444" />, titleColor: '#EF4444', title: 'Invalid ticket code'      },
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, color: TX2, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', flexShrink: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(15px,3vw,20px)', fontWeight: 800, color: TX1, fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Check-in Station
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: TX2, marginTop: 2 }}>{checkedInCount} of {attendees.length} checked in</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '6px 12px', flexShrink: 0 }}>
          <Zap size={12} color={G} />
          <span style={{ fontSize: 12, color: G, fontWeight: 700 }}>{scanCount} scanned</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: `1px solid ${BORDER}`, gap: 4, marginBottom: 20 }}>
        {([
          { key: 'camera', icon: <Camera size={14} />,   label: 'Camera Scan'      },
          { key: 'manual', icon: <Keyboard size={14} />, label: 'Manual / Scanner' },
        ] as const).map(opt => (
          <button key={opt.key} onClick={() => setMode(opt.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
            background: mode === opt.key ? 'rgba(255,255,255,0.09)' : 'transparent',
            color: mode === opt.key ? TX1 : TX3,
          }}>
            {opt.icon} <span className="rt-btn-label">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Camera */}
      {mode === 'camera' && (
        <div style={{ ...glass, overflow: 'hidden', marginBottom: 20 }}>
          {cameraError ? (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <CameraOff size={36} color="rgba(239,68,68,0.6)" style={{ marginBottom: 14 }} />
              <p style={{ color: '#F87171', fontSize: 14, margin: '0 0 14px', lineHeight: 1.6 }}>{cameraError}</p>
              <button onClick={() => { setCameraError(null); startCamera() }} style={{ padding: '9px 24px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: G, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Try Again
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', aspectRatio: '4/3', background: '#000' }}>
              <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {cameraReady && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {[
                    { top: '25%', left: '25%', borderTop: `3px solid ${G}`, borderLeft: `3px solid ${G}`, borderRadius: '4px 0 0 0' },
                    { top: '25%', right: '25%', borderTop: `3px solid ${G}`, borderRight: `3px solid ${G}`, borderRadius: '0 4px 0 0' },
                    { bottom: '25%', left: '25%', borderBottom: `3px solid ${G}`, borderLeft: `3px solid ${G}`, borderRadius: '0 0 0 4px' },
                    { bottom: '25%', right: '25%', borderBottom: `3px solid ${G}`, borderRight: `3px solid ${G}`, borderRadius: '0 0 4px 0' },
                  ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />)}
                  <div style={{ position: 'absolute', left: '25%', right: '25%', height: 2, background: `linear-gradient(90deg,transparent,${G},transparent)`, animation: 'rtScanLine 2s ease-in-out infinite' }} />
                </div>
              )}
              {!cameraReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Loader2 size={28} color={G} style={{ animation: 'rtSpin 1s linear infinite', marginBottom: 10 }} />
                    <p style={{ color: TX2, fontSize: 13, margin: 0 }}>Starting camera…</p>
                  </div>
                </div>
              )}
              {processing && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={28} color={G} style={{ animation: 'rtSpin 1s linear infinite' }} />
                </div>
              )}
            </div>
          )}
          {cameraReady && (
            <div style={{ padding: '12px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: TX2 }}>
                <ScanLine size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Point camera at a ticket QR code
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual */}
      {mode === 'manual' && (
        <div style={{ ...glass, padding: '22px 20px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Keyboard size={14} color={TX3} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TX2 }}>
              Enter or Scan Ticket Code
            </span>
          </div>
          <p style={{ fontSize: 13, color: TX2, margin: '0 0 16px', lineHeight: 1.55 }}>
            Type a code and press Enter — or connect a USB/Bluetooth barcode scanner. This field stays focused automatically.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              ref={manualRef}
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && manualCode.trim() && processCode(manualCode)}
              placeholder="e.g. SC-89NB-56AE-UZQ3"
              autoComplete="off" spellCheck={false}
              style={{ flex: 1, minWidth: 160, background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, color: TX1, fontSize: 15, padding: '13px 16px', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.07em', transition: 'border-color 0.15s' }}
              onFocus={e => e.currentTarget.style.borderColor = `${G}55`}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <button
              onClick={() => manualCode.trim() && processCode(manualCode)}
              disabled={!manualCode.trim() || processing}
              style={{ padding: '13px 18px', borderRadius: 12, border: 'none', cursor: manualCode.trim() ? 'pointer' : 'not-allowed', background: manualCode.trim() ? G : 'rgba(255,255,255,0.07)', color: manualCode.trim() ? '#000' : TX3, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', flexShrink: 0 }}
            >
              {processing ? <Loader2 size={15} style={{ animation: 'rtSpin 1s linear infinite' }} /> : <Check size={15} />}
              Check In
            </button>
          </div>
          <p style={{ fontSize: 12, color: TX2, margin: '12px 0 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1, color: TX3 }} />
            External scanners work here — they type the code and send Enter automatically
          </p>
        </div>
      )}

      {/* Result */}
      {result && (() => {
        const rc = resultConfig[result.status]
        return (
          <div style={{ ...glass, padding: '20px 22px', border: `1px solid ${rc.border}`, background: rc.bg, marginBottom: 20, animation: 'rtFadeSlideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{rc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: rc.titleColor, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{rc.title}</div>
                {'attendee' in result && result.attendee && (<>
                  <div style={{ fontSize: 14, color: TX1, fontWeight: 600, marginBottom: 2 }}>{result.attendee.name}</div>
                  <div style={{ fontSize: 12, color: TX2, marginBottom: 6 }}>{result.attendee.email}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: `${rc.titleColor}18`, color: rc.titleColor, padding: '3px 10px', borderRadius: 6 }}>{result.attendee.ticketType}</span>
                </>)}
                {result.status === 'already' && (
                  <div style={{ fontSize: 13, color: 'rgba(251,191,36,0.85)', marginTop: 6 }}>This ticket was already scanned — do not allow re-entry.</div>
                )}
                {result.status === 'invalid' && (
                  <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.8)' }}>This code doesn't match any ticket. Check for typos or verify the ticket belongs to this event.</div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Recent check-ins */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color={TX3} />
          <span style={{ fontSize: 11, fontWeight: 600, color: TX2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Check-ins</span>
        </div>
        {attendees.filter(a => a.checkedIn).length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: TX2 }}>No check-ins yet</div>
        ) : (
          [...attendees].filter(a => a.checkedIn).slice(-8).reverse().map((att, i, arr) => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={13} color={G} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TX1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                <div style={{ fontSize: 12, color: TX2 }}>{att.ticketType}</div>
              </div>
              <code style={{ fontSize: 11, color: TX2, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 5, flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                {att.ticketCode}
              </code>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes rtScanLine    { 0% { top:25% } 50% { top:75% } 100% { top:25% } }
        @keyframes rtFadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes rtSpin        { to { transform: rotate(360deg); } }
        @media (max-width: 380px) { .rt-btn-label { display: none; } }
      `}</style>
    </div>
  )
}