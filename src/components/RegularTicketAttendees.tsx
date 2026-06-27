/* ─────────────────────────────────────────────────────────────
   RegularTicketAttendees.tsx
   Attendance table — matches design reference image 4
   with check-in panel on the right and stats at top
───────────────────────────────────────────────────────────── */
import { useState, useRef, useCallback } from 'react'
import {
  Users, Check, QrCode, Download, Filter, ScanLine,
  CheckCircle2, Clock, UserPlus, ChevronLeft, ChevronRight,
  Camera, Keyboard, X, Loader2, CheckCircle, AlertCircle, XCircle,
} from 'lucide-react'
import { CARD, BORDER, TX1, TX2, TX3, G } from '../pages/RegularTicket/RegularTicketTypes'
import type { Attendee } from '../pages/RegularTicket/RegularTicketTypes'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface Props {
  attendees: Attendee[]
  eventId: string
  search: string
  onSearch: (v: string) => void
  onOpenCheckin: () => void
}

const PAGE_SIZE = 10

export default function RegularTicketAttendees({ attendees, eventId, search, onSearch, onOpenCheckin }: Props) {
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending' | 'walkins'>('all')
  const [page, setPage]     = useState(1)
  const [checkinMode, setCheckinMode] = useState<'scan' | 'manual'>('scan')
  const [manualCode, setManualCode]   = useState('')
  const [processing, setProcessing]   = useState(false)
  const [result, setResult]           = useState<null | 'success' | 'already' | 'invalid'>(null)
  const [resultAtt, setResultAtt]     = useState<Attendee | null>(null)
  const manualRef = useRef<HTMLInputElement>(null)

  const checkedIn  = attendees.filter(a => a.checkedIn).length
  const pending    = attendees.length - checkedIn
  const walkIns    = 12 // placeholder

  const topStats = [
    { label: 'Total Tickets Sold', value: attendees.length, sub: '+24 this week',  color: '#818CF8', icon: <Users size={16} color="#818CF8" /> },
    { label: 'Checked In',         value: checkedIn,        sub: `${attendees.length > 0 ? Math.round((checkedIn / attendees.length) * 100) : 0}%`, color: G, icon: <CheckCircle2 size={16} color={G} />, bar: { pct: attendees.length > 0 ? Math.round((checkedIn / attendees.length) * 100) : 0, color: G } },
    { label: 'Pending',            value: pending,          sub: `${attendees.length > 0 ? Math.round((pending / attendees.length) * 100) : 0}%`,   color: '#FBBF24', icon: <Clock size={16} color="#FBBF24" />, bar: { pct: attendees.length > 0 ? Math.round((pending / attendees.length) * 100) : 0, color: '#FBBF24' } },
    { label: 'Walk-ins',           value: walkIns,          sub: '+3 today',       color: '#A78BFA', icon: <UserPlus size={16} color="#A78BFA" /> },
  ]

  const FILTER_TABS = [
    { key: 'all',     label: `All (${attendees.length})` },
    { key: 'checked', label: `Checked In (${checkedIn})` },
    { key: 'pending', label: `Pending (${pending})` },
    { key: 'walkins', label: `Walk-ins (${walkIns})` },
  ] as const

  const filtered = attendees.filter(a => {
    const matchSearch =
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.ticketCode?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'checked' ? a.checkedIn :
      filter === 'pending' ? !a.checkedIn : false
    return matchSearch && matchFilter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const doCheckin = useCallback(async (code: string) => {
    const c = code.trim().toUpperCase()
    if (!c || processing) return
    setProcessing(true); setResult(null); setResultAtt(null)
    try {
      const att = attendees.find(a => a.ticketCode?.toUpperCase() === c)
      if (!att) { setResult('invalid'); return }
      if (att.checkedIn) { setResult('already'); setResultAtt(att); return }
      await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), { checkedIn: true, checkedInAt: serverTimestamp() })
      setResult('success'); setResultAtt({ ...att, checkedIn: true })
      setManualCode('')
    } finally {
      setProcessing(false)
      setTimeout(() => { setResult(null); setResultAtt(null) }, 4000)
    }
  }, [attendees, eventId, processing])

  const undoCheckin = async (att: Attendee) => {
    await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), { checkedIn: false, checkedInAt: null })
  }

  const manualCheckin = async (att: Attendee) => {
    if (att.checkedIn) { await undoCheckin(att); return }
    await updateDoc(doc(db, 'events', eventId, 'attendees', att.id), { checkedIn: true, checkedInAt: serverTimestamp() })
  }

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
    borderRadius: 10, color: TX1, fontSize: 14, padding: '10px 14px',
    outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s',
  }

  return (
    <>
      {/* Top stats */}
      <div className="rt-att-stats">
        {topStats.map((s, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.sub}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: TX1, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: TX2, marginTop: 4 }}>{s.label}</div>
            {s.bar && (
              <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.bar.pct}%`, background: s.bar.color, borderRadius: 4 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main layout: table + sidebar */}
      <div className="rt-att-layout">

        {/* ── Left: table ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Filter tabs + toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
              {FILTER_TABS.map(t => (
                <button key={t.key} onClick={() => { setFilter(t.key); setPage(1) }} style={{
                  padding: '8px 14px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${filter === t.key ? G : 'transparent'}`,
                  marginBottom: -2, color: filter === t.key ? G : TX2,
                  cursor: 'pointer', fontSize: 13, fontWeight: filter === t.key ? 700 : 500,
                  fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TX2, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                <Filter size={13} /> Filter
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TX2, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                <Download size={13} /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
            {/* Header */}
            <div className="rt-att-row rt-att-head" style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Attendee</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket Type</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket / Code</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: TX3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Check-in Time</span>
              <span />
            </div>

            {paginated.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: TX2, fontSize: 14 }}>
                {search ? 'No attendees match your search.' : 'No attendees yet.'}
              </div>
            ) : paginated.map((att, i) => (
              <div
                key={att.id}
                className="rt-att-row"
                style={{ padding: '14px 20px', borderBottom: i < paginated.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Attendee */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${G}, #16a34a)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#000',
                  }}>
                    {att.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TX1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                    <div style={{ fontSize: 12, color: TX2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.email}</div>
                  </div>
                </div>

                {/* Ticket type */}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 7, background: 'rgba(34,197,94,0.1)', color: G }}>
                    {att.ticketType}
                  </span>
                </div>

                {/* Code */}
                <code style={{ fontSize: 12, color: TX2, background: 'rgba(255,255,255,0.06)', padding: '4px 9px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  {att.ticketCode}
                </code>

                {/* Status */}
                <div>
                  {att.checkedIn ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: G, background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: 7 }}>
                      <CheckCircle2 size={11} /> Checked In
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#FBBF24', background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: 7 }}>
                      <Clock size={11} /> Pending
                    </span>
                  )}
                </div>

                {/* Time */}
                <div style={{ fontSize: 12, color: TX2 }}>
                  {att.checkedIn && att.checkedInAt
                    ? new Date(att.checkedInAt?.toDate?.() || att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </div>

                {/* Action */}
                <div>
                  <button
                    onClick={() => manualCheckin(att)}
                    style={{
                      padding: '6px 0', width: 28, height: 28, borderRadius: 8,
                      border: `1px solid ${att.checkedIn ? 'rgba(248,113,113,0.2)' : BORDER}`,
                      background: att.checkedIn ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.04)',
                      color: att.checkedIn ? '#F87171' : TX2,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    title={att.checkedIn ? 'Undo check-in' : 'Check in'}
                    onMouseEnter={e => e.currentTarget.style.background = att.checkedIn ? 'rgba(248,113,113,0.14)' : 'rgba(255,255,255,0.09)'}
                    onMouseLeave={e => e.currentTarget.style.background = att.checkedIn ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.04)'}
                  >
                    <MoreHorizIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, color: TX2 }}>
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: page === 1 ? TX3 : TX1, cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1px solid ${page === p ? G + '50' : BORDER}`,
                      background: page === p ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                      color: page === p ? G : TX2,
                      cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 700 : 500,
                    }}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: page === totalPages ? TX3 : TX1, cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
              <span style={{ fontSize: 13, color: TX2 }}>{PAGE_SIZE} / page</span>
            </div>
          )}
        </div>

        {/* ── Right: check-in panel ── */}
        <div className="rt-att-panel" style={{ width: 280, flexShrink: 0 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: TX1, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Check-in</div>
              <div style={{ fontSize: 12, color: TX2 }}>Scan QR code or enter ticket code to check-in attendees</div>
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', margin: '12px 14px 0', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, gap: 3 }}>
              {([
                { key: 'scan', label: 'Scan QR Code', icon: <Camera size={12} /> },
                { key: 'manual', label: 'Enter Code', icon: <Keyboard size={12} /> },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => setCheckinMode(opt.key)} style={{
                  flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: checkinMode === opt.key ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: checkinMode === opt.key ? TX1 : TX3,
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {/* Scan area */}
            {checkinMode === 'scan' && (
              <div style={{ margin: '14px', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 12px' }}>
                    <QrCode size={64} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                    {/* Corner markers */}
                    {[
                      { top: 0, left: 0, borderTop: `2px solid ${G}`, borderLeft: `2px solid ${G}`, borderRadius: '4px 0 0 0' },
                      { top: 0, right: 0, borderTop: `2px solid ${G}`, borderRight: `2px solid ${G}`, borderRadius: '0 4px 0 0' },
                      { bottom: 0, left: 0, borderBottom: `2px solid ${G}`, borderLeft: `2px solid ${G}`, borderRadius: '0 0 0 4px' },
                      { bottom: 0, right: 0, borderBottom: `2px solid ${G}`, borderRight: `2px solid ${G}`, borderRadius: '0 0 4px 0' },
                    ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...s }} />)}
                  </div>
                  <p style={{ fontSize: 12, color: TX3, margin: 0 }}>Position QR code within</p>
                  <p style={{ fontSize: 12, color: TX3, margin: '2px 0 0' }}>the frame to scan</p>
                </div>
              </div>
            )}

            {/* Manual input */}
            <div style={{ padding: '14px' }}>
              {checkinMode === 'scan' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: BORDER }} />
                  <span style={{ fontSize: 11, color: TX3, fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: BORDER }} />
                </div>
              )}
              <input
                ref={manualRef}
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && manualCode.trim() && doCheckin(manualCode)}
                placeholder="Enter ticket code manually"
                style={{ ...inp, width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '10px 12px', marginBottom: 8 }}
                onFocus={e => e.currentTarget.style.borderColor = `${G}66`}
                onBlur={e => e.currentTarget.style.borderColor = BORDER}
              />
              <button
                onClick={() => manualCode.trim() && doCheckin(manualCode)}
                disabled={!manualCode.trim() || processing}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                  background: manualCode.trim() ? G : 'rgba(255,255,255,0.07)',
                  color: manualCode.trim() ? '#000' : TX3,
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                  cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {processing ? <Loader2 size={14} style={{ animation: 'rtSpin 1s linear infinite' }} /> : <Check size={14} />}
                Check In
              </button>
            </div>

            {/* Result */}
            {result && (
              <div style={{ margin: '0 14px 14px', padding: '12px 14px', borderRadius: 10, background: result === 'success' ? 'rgba(34,197,94,0.08)' : result === 'already' ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${result === 'success' ? 'rgba(34,197,94,0.3)' : result === 'already' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  {result === 'success' ? <CheckCircle size={16} color={G} style={{ flexShrink: 0, marginTop: 1 }} /> :
                   result === 'already' ? <AlertCircle size={16} color="#FBBF24" style={{ flexShrink: 0, marginTop: 1 }} /> :
                   <XCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: result === 'success' ? G : result === 'already' ? '#FBBF24' : '#EF4444', marginBottom: 2 }}>
                      {result === 'success' ? 'Checked in!' : result === 'already' ? 'Already checked in' : 'Invalid code'}
                    </div>
                    {resultAtt && <div style={{ fontSize: 12, color: TX2 }}>{resultAtt.name}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check-in summary donut */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TX1 }}>Check-in Summary</div>
              <button style={{ fontSize: 12, color: G, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>View full report</button>
            </div>
            {/* Simple visual ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke={G} strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 28 * (attendees.length > 0 ? checkedIn / attendees.length : 0)} ${2 * Math.PI * 28}`}
                    strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 0.5s' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: TX1 }}>{attendees.length > 0 ? Math.round((checkedIn / attendees.length) * 100) : 0}%</span>
                  <span style={{ fontSize: 9, color: TX3 }}>In</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Checked In', value: checkedIn, color: G },
                  { label: 'Pending',    value: pending,   color: '#FBBF24' },
                  { label: 'Walk-ins',   value: walkIns,   color: '#A78BFA' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: TX2 }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TX1, marginLeft: 'auto' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full station CTA */}
          <button onClick={onOpenCheckin} style={{
            width: '100%', padding: '12px 0', borderRadius: 12,
            border: `1px solid rgba(34,197,94,0.3)`,
            background: 'rgba(34,197,94,0.08)', color: G,
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}
          >
            <ScanLine size={15} /> Open Full Check-in Station
          </button>
        </div>
      </div>

      <style>{`
        .rt-att-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 900px) { .rt-att-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .rt-att-stats { grid-template-columns: 1fr 1fr; } }

        .rt-att-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }
        .rt-att-panel { display: block; }
        @media (max-width: 1000px) {
          .rt-att-layout { flex-direction: column; }
          .rt-att-panel  { width: 100% !important; }
        }

        .rt-att-row {
          display: grid;
          grid-template-columns: 1.4fr 110px 140px 110px 100px 40px;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 800px) {
          .rt-att-row { grid-template-columns: 1fr 90px 90px 90px; }
          .rt-att-row > *:nth-child(5), .rt-att-row > *:nth-child(6),
          .rt-att-head > *:nth-child(5), .rt-att-head > *:nth-child(6) { display: none; }
        }
        @media (max-width: 520px) {
          .rt-att-row { grid-template-columns: 1fr 80px 80px; }
          .rt-att-row > *:nth-child(3), .rt-att-row > *:nth-child(5), .rt-att-row > *:nth-child(6),
          .rt-att-head > *:nth-child(3), .rt-att-head > *:nth-child(5), .rt-att-head > *:nth-child(6) { display: none; }
        }
        @keyframes rtSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

// MoreHoriz as inline (avoids another import)
function MoreHorizIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  )
}