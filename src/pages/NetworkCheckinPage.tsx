import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEventMeta } from '../lib/useEventMeta'
import { useTeamRole } from '../lib/Useteamrole'
import DashboardLayout from '../components/DashboardLayout'
import {
  ScanLine, Search, CheckCircle2, XCircle, Users, Shield, Globe,
  Camera, CameraOff, Keyboard, ArrowLeft, Loader2, Check,
  AlertCircle, Zap, Lightbulb,
} from 'lucide-react'
import jsQR from 'jsqr'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Registrant {
  id: string
  name?: string
  fullName?: string
  email: string
  phone?: string
  orgPath?: string
  checkedIn: boolean
  ticketCode?: string
  [key: string]: any
}

type ScanResult =
  | { status: 'success'; registrant: Registrant }
  | { status: 'already';  registrant: Registrant }
  | { status: 'invalid' }
  | { status: 'outofscope'; registrant: Registrant }
  | null

// ── Styles ────────────────────────────────────────────────────────────────────
const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18, overflow: 'hidden',
}
const SUB2 = 'rgba(255,255,255,0.65)'
const GREEN = '#0dc75e'

// ── Sound helper ──────────────────────────────────────────────────────────────
function playSound(type: 'success' | 'already' | 'invalid') {
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
  } catch { /* AudioContext blocked */ }
}

// ── Check-in Station ──────────────────────────────────────────────────────────
function CheckinStation({
  eventId, scopeFiltered, allRegistrants, isOrganizer, scopeLabel, onBack,
}: {
  eventId: string
  scopeFiltered: Registrant[]
  allRegistrants: Registrant[]
  isOrganizer: boolean
  scopeLabel: string | null
  onBack: () => void
}) {
  const [mode, setMode]           = useState<'manual' | 'camera'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [result, setResult]       = useState<ScanResult>(null)
  const [processing, setProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [scanCount, setScanCount] = useState(0)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number>(0)
  const lastScanned = useRef('')
  const manualRef   = useRef<HTMLInputElement>(null)

  const displayName = (r: Registrant) => r.fullName || r.name || r.email || '?'
  const checkedInCount = scopeFiltered.filter(r => r.checkedIn).length

  const processCode = useCallback(async (rawCode: string) => {
    let code = rawCode.trim().toUpperCase()
    // Handle JSON QR codes
    try {
      const parsed = JSON.parse(rawCode.trim())
      if (parsed.code) code = parsed.code.toUpperCase()
    } catch { /* raw code */ }

    if (!code || processing) return
    setProcessing(true); setResult(null)

    try {
      // Search in ALL registrants first (not just scope) to detect out-of-scope
      const inAll   = allRegistrants.find(r => r.ticketCode?.toUpperCase() === code)
      const inScope = scopeFiltered.find(r => r.ticketCode?.toUpperCase() === code)

      if (!inAll) {
        playSound('invalid')
        setResult({ status: 'invalid' })
        return
      }

      // Registrant exists but not in this admin's scope
      if (!inScope) {
        playSound('invalid')
        setResult({ status: 'outofscope', registrant: inAll })
        return
      }

      if (inScope.checkedIn) {
        playSound('already')
        setResult({ status: 'already', registrant: inScope })
        return
      }

      await updateDoc(doc(db, 'events', eventId, 'networkRegistrations', inScope.id), {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
      })
      setScanCount(n => n + 1)
      playSound('success')
      setResult({ status: 'success', registrant: { ...inScope, checkedIn: true } })
    } finally {
      setProcessing(false)
    }
  }, [allRegistrants, scopeFiltered, eventId, processing])

  // Auto-clear result after 4s
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => {
      setResult(null); lastScanned.current = ''
      if (mode === 'manual') { setManualCode(''); manualRef.current?.focus() }
    }, 4000)
    return () => clearTimeout(t)
  }, [result, mode])

  // Auto-focus manual input
  useEffect(() => {
    if (mode === 'manual') setTimeout(() => manualRef.current?.focus(), 120)
  }, [mode])

  const startCamera = useCallback(async () => {
    setCameraError(null); setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
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

  // Camera scan loop
  useEffect(() => {
    if (mode !== 'camera' || !cameraReady) return
    let lastTime = 0
    const scan = (ts: number) => {
      rafRef.current = requestAnimationFrame(scan)
      if (ts - lastTime < 150) return
      lastTime = ts
      const video = videoRef.current; const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return
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

  const resultConfig = {
    success:    { bg: 'rgba(13,199,94,0.1)',   border: 'rgba(13,199,94,0.3)',   icon: <CheckCircle2 size={28} color={GREEN} /> },
    already:    { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  icon: <AlertCircle  size={28} color="#FBBF24" /> },
    invalid:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   icon: <XCircle      size={28} color="#EF4444" /> },
    outofscope: { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   icon: <Shield       size={28} color="#EF4444" /> },
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: SUB2, padding: '8px 14px', borderRadius: 10,
          cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', flexShrink: 0,
        }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
            Check-in Station
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: SUB2, marginTop: 2 }}>
            {checkedInCount} of {scopeFiltered.length} checked in
            {scopeLabel && <span style={{ color: GREEN }}> · Scoped to: {scopeLabel}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `rgba(13,199,94,0.1)`, border: `1px solid rgba(13,199,94,0.25)`, borderRadius: 10, padding: '6px 12px', flexShrink: 0 }}>
          <Zap size={12} color={GREEN} />
          <span style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>{scanCount} scanned</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.07)', gap: 4, marginBottom: 20 }}>
        {([
          { key: 'manual', icon: <Keyboard size={14} />, label: 'Manual / Scanner' },
          { key: 'camera', icon: <Camera   size={14} />, label: 'Camera Scan'       },
        ] as const).map(opt => (
          <button key={opt.key} onClick={() => setMode(opt.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
            background: mode === opt.key ? 'rgba(255,255,255,0.09)' : 'transparent',
            color: mode === opt.key ? '#fff' : SUB2,
          }}>
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Manual input */}
      {mode === 'manual' && (
        <div style={{ ...glass, padding: '22px 20px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Keyboard size={14} color={SUB2} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SUB2 }}>
              Enter or Scan Ticket Code
            </span>
          </div>
          <p style={{ fontSize: 13, color: SUB2, margin: '0 0 16px', lineHeight: 1.55 }}>
            Type a code and press Enter, or use a USB/Bluetooth barcode scanner.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              ref={manualRef}
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && manualCode.trim() && processCode(manualCode)}
              placeholder="Enter ticket code..."
              autoComplete="off" spellCheck={false}
              style={{
                flex: 1, minWidth: 160,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, color: '#fff', fontSize: 15,
                padding: '13px 16px', outline: 'none',
                fontFamily: 'monospace', letterSpacing: '0.07em',
              }}
              onFocus={e => e.currentTarget.style.borderColor = `rgba(13,199,94,0.45)`}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <button
              onClick={() => manualCode.trim() && processCode(manualCode)}
              disabled={!manualCode.trim() || processing}
              style={{
                padding: '13px 18px', borderRadius: 12, border: 'none',
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                background: manualCode.trim() ? GREEN : 'rgba(255,255,255,0.07)',
                color: manualCode.trim() ? '#000' : 'rgba(255,255,255,0.25)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {processing ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
              Check In
            </button>
          </div>
          <p style={{ fontSize: 12, color: SUB2, margin: '12px 0 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            External scanners type the code and send Enter automatically
          </p>
        </div>
      )}

      {/* Camera */}
      {mode === 'camera' && (
        <div style={{ ...glass, overflow: 'hidden', marginBottom: 20 }}>
          {cameraError ? (
            <div style={{ padding: '36px 24px', textAlign: 'center' }}>
              <CameraOff size={36} color="rgba(239,68,68,0.6)" style={{ marginBottom: 14 }} />
              <p style={{ color: '#F87171', fontSize: 14, margin: '0 0 14px', lineHeight: 1.6 }}>{cameraError}</p>
              <button onClick={() => { setCameraError(null); startCamera() }} style={{
                padding: '9px 24px', borderRadius: 10, border: `1px solid rgba(13,199,94,0.3)`,
                background: `rgba(13,199,94,0.1)`, color: GREEN, cursor: 'pointer',
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
                    { top: '25%',    left: '25%',  borderTop:    `3px solid ${GREEN}`, borderLeft:   `3px solid ${GREEN}`, borderRadius: '4px 0 0 0' },
                    { top: '25%',    right: '25%', borderTop:    `3px solid ${GREEN}`, borderRight:  `3px solid ${GREEN}`, borderRadius: '0 4px 0 0' },
                    { bottom: '25%', left: '25%',  borderBottom: `3px solid ${GREEN}`, borderLeft:   `3px solid ${GREEN}`, borderRadius: '0 0 0 4px' },
                    { bottom: '25%', right: '25%', borderBottom: `3px solid ${GREEN}`, borderRight:  `3px solid ${GREEN}`, borderRadius: '0 0 4px 0' },
                  ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />)}
                  <div style={{ position: 'absolute', left: '25%', right: '25%', height: 2, background: `linear-gradient(90deg,transparent,${GREEN},transparent)`, animation: 'scanline 2s ease-in-out infinite' }} />
                </div>
              )}
              {!cameraReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Loader2 size={28} color={GREEN} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
                    <p style={{ color: SUB2, fontSize: 13, margin: 0 }}>Starting camera…</p>
                  </div>
                </div>
              )}
              {processing && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={28} color={GREEN} style={{ animation: 'spin 1s linear infinite' }} />
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

      {/* Result */}
      {result && (() => {
        const rc = resultConfig[result.status]
        return (
          <div style={{ ...glass, padding: '20px 22px', border: `1px solid ${rc.border}`, background: rc.bg, marginBottom: 20, animation: 'fadeSlideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{rc.icon}</div>
              <div style={{ flex: 1 }}>
                {result.status === 'success' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 4 }}>Checked in successfully ✓</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{displayName(result.registrant)}</div>
                  <div style={{ fontSize: 12, color: SUB2 }}>{result.registrant.email}</div>
                  {result.registrant.orgPath && <div style={{ fontSize: 12, color: SUB2, marginTop: 2 }}>{result.registrant.orgPath}</div>}
                </>)}
                {result.status === 'already' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FBBF24', marginBottom: 4 }}>Already checked in</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{displayName(result.registrant)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(251,191,36,0.85)' }}>This ticket was already scanned — do not allow re-entry.</div>
                </>)}
                {result.status === 'invalid' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>Invalid ticket code</div>
                  <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.8)' }}>This code doesn't match any registrant for this event.</div>
                </>)}
                {result.status === 'outofscope' && (<>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>Outside your scope</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{displayName(result.registrant)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(239,68,68,0.8)' }}>This registrant is not in your assigned area. Contact a full-access admin.</div>
                </>)}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Recent check-ins */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color={SUB2} />
          <span style={{ fontSize: 11, fontWeight: 600, color: SUB2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Check-ins</span>
        </div>
        {scopeFiltered.filter(r => r.checkedIn).length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: SUB2 }}>No check-ins yet</div>
        ) : (
          [...scopeFiltered].filter(r => r.checkedIn).slice(-8).reverse().map((r, i, arr) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `rgba(13,199,94,0.12)`, border: `1px solid rgba(13,199,94,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={13} color={GREEN} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(r)}</div>
                <div style={{ fontSize: 12, color: SUB2 }}>{r.orgPath || r.email}</div>
              </div>
              {r.ticketCode && (
                <code style={{ fontSize: 11, color: SUB2, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>
                  {r.ticketCode}
                </code>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanline { 0% { top:25% } 50% { top:75% } 100% { top:25% } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NetworkCheckinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading: metaLoading } = useEventMeta(eventId)
  const { member, loading: roleLoading, isOrganizer, scopeNodeIds, scopeCustomPairs, scopeLabel } = useTeamRole(eventId)

  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [search, setSearch]           = useState('')
  const [checking, setChecking]       = useState<string | null>(null)
  const [view, setView]               = useState<'list' | 'station'>('list')

  useEffect(() => {
    if (!eventId) return
    return onSnapshot(
      collection(db, 'events', eventId, 'networkRegistrations'),
      snap => setRegistrants(snap.docs.map(d => ({ id: d.id, ...d.data() } as Registrant))),
    )
  }, [eventId])

  // ── Scope filter ──────────────────────────────────────────────────────────
  const scopeFiltered: Registrant[] = (() => {
    if (isOrganizer || (!scopeNodeIds && !scopeCustomPairs)) return registrants
    return registrants.filter(r => {
      if (scopeNodeIds) {
        return Object.entries(r).some(([key, val]) =>
          key.startsWith('levelId_') && scopeNodeIds.includes(val as string)
        )
      }
      if (scopeCustomPairs) {
        return scopeCustomPairs.every(pair => {
          if (pair.value === '*') return true
          const rVal = String(r[`cf_${pair.fieldId}`] ?? '').trim().toLowerCase()
          return rVal === pair.value.toLowerCase()
        })
      }
      return false
    })
  })()

  const filtered = scopeFiltered.filter(r => {
    const name = r.fullName || r.name || ''
    const q    = search.toLowerCase()
    return (
      name.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.ticketCode?.toLowerCase().includes(q) ||
      r.orgPath?.toLowerCase().includes(q)
    )
  })

  const checkedInCount = scopeFiltered.filter(r => r.checkedIn).length

  const toggleCheckin = async (r: Registrant) => {
    if (!eventId) return
    setChecking(r.id)
    await updateDoc(doc(db, 'events', eventId, 'networkRegistrations', r.id), {
      checkedIn: !r.checkedIn,
    })
    setChecking(null)
  }

  const displayName = (r: Registrant) => r.fullName || r.name || '?'
  const hasScope    = !isOrganizer && member

  if (metaLoading || roleLoading) {
    return (
      <DashboardLayout eventType={eventType ?? 'network'} eventId={eventId} enabledModules={enabledModules} metaLoading>
        <div />
      </DashboardLayout>
    )
  }

  // ── Check-in station view ──────────────────────────────────────────────────
  if (view === 'station' && eventId) {
    return (
      <DashboardLayout eventType={eventType ?? 'network'} eventId={eventId} enabledModules={enabledModules} metaLoading={metaLoading}>
        <CheckinStation
          eventId={eventId}
          scopeFiltered={scopeFiltered}
          allRegistrants={registrants}
          isOrganizer={isOrganizer}
          scopeLabel={scopeLabel}
          onBack={() => setView('list')}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout eventType={eventType ?? 'network'} eventId={eventId} enabledModules={enabledModules} metaLoading={metaLoading}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <ScanLine size={20} color={GREEN} />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                Check-in Center
              </h1>
            </div>
            {hasScope && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 10,
                background: scopeLabel ? 'rgba(99,102,241,0.08)' : 'rgba(13,199,94,0.08)',
                border: `1px solid ${scopeLabel ? 'rgba(99,102,241,0.2)' : 'rgba(13,199,94,0.2)'}`,
              }}>
                {scopeLabel
                  ? <><Shield size={12} color="#6366F1" /><span style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>Scoped to: {scopeLabel}</span></>
                  : <><Globe size={12} color={GREEN} /><span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>Full Access</span></>
                }
              </div>
            )}
          </div>

          {/* Check-in station button */}
          <button
            onClick={() => setView('station')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: GREEN, border: 'none', color: '#000',
              padding: '11px 18px', borderRadius: 11, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
              boxShadow: `0 4px 18px rgba(13,199,94,0.35)`,
            }}
          >
            <ScanLine size={14} /> Check-in Station
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: isOrganizer ? 'Total Registered' : 'In Your Scope', value: scopeFiltered.length, color: '#6366F1' },
            { label: 'Checked In',  value: checkedInCount,                color: GREEN },
            { label: 'Remaining',   value: scopeFiltered.length - checkedInCount, color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(12,17,35,0.8)', border: `1px solid ${s.color}22`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: SUB2, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: SUB2 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, ticket code or org path..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12, color: '#fff', fontSize: 13,
              padding: '11px 14px 11px 38px', outline: 'none', fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* ── Registrant list ── */}
        <div style={glass}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Users size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
                {search ? 'No results found' : hasScope && scopeLabel ? 'No registrants match your assigned scope yet.' : 'No registrants yet'}
              </p>
            </div>
          ) : filtered.map((r, i) => {
            const name = displayName(r)
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: r.checkedIn ? 'rgba(13,199,94,0.15)' : 'rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  color: r.checkedIn ? GREEN : '#818CF8',
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 12, color: SUB2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.email}
                    {r.orgPath && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {r.orgPath}</span>}
                  </div>
                </div>

                {r.ticketCode && (
                  <span style={{ fontSize: 11, color: '#818CF8', background: 'rgba(129,140,248,0.1)', padding: '3px 9px', borderRadius: 6, fontWeight: 600, flexShrink: 0 }}>
                    {r.ticketCode}
                  </span>
                )}

                {/* Undo only — no direct check-in without scan */}
                {r.checkedIn ? (
                  <button
                    onClick={() => toggleCheckin(r)}
                    disabled={checking === r.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', flexShrink: 0,
                      background: 'rgba(248,113,113,0.1)', color: '#F87171',
                      transition: 'all 0.15s', opacity: checking === r.id ? 0.5 : 1,
                    }}
                  >
                    <XCircle size={13} /> Undo
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: SUB2, background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: 9, flexShrink: 0 }}>
                    Pending
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}