import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, orderBy, addDoc, serverTimestamp, getDoc, doc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  X, Mail, Shield, Globe, Check, ChevronDown, ChevronUp, Loader2, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgLevel { id: string; name: string; order: number; color: string }
interface OrgNode  { id: string; name: string; levelId: string; parentId?: string }

// One level of the custom-field hierarchy derived from registrant data
interface CfLevel {
  fieldId: string
  fieldLabel: string
  color: string
  // all unique values at this level
  values: string[]
}

// A selected scope item — one value at one level
interface ScopeSelection {
  // per level: fieldId → Set of selected values ('*' means all)
  [fieldId: string]: Set<string> | '*'
}

interface Props {
  open: boolean
  onClose: () => void
  eventId: string
  eventName: string
  eventImage?: string
  organizerName: string
  organizerUid: string
}

const FUNCTIONS_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

const LEVEL_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6', '#818CF8']

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#fff', fontSize: 13, padding: '10px 13px', outline: 'none',
  fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.75)', marginBottom: 7, display: 'block',
}
const SUB2   = 'rgba(255,255,255,0.7)'
const ACCENT = '#6366F1'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Given registrants + field order, get unique values for a level
// filtered by what was selected at parent levels
function getValuesForLevel(
  registrants: any[],
  cfLevels: CfLevel[],
  levelIndex: number,
  selections: ScopeSelection,
): string[] {
  const level = cfLevels[levelIndex]
  if (!level) return []

  // Filter registrants that match all parent selections
  const filtered = registrants.filter(r => {
    for (let i = 0; i < levelIndex; i++) {
      const parentLevel = cfLevels[i]
      const sel = selections[parentLevel.fieldId]
      if (!sel) return false                         // parent not selected yet
      if (sel === '*') continue                      // all = pass through
      const rVal = String(r[`cf_${parentLevel.fieldId}`] ?? '').trim().toLowerCase()
      const selSet = sel as Set<string>
      if (!selSet.has(rVal)) return false
    }
    return true
  })

  // Collect unique values for this level
  const seen = new Set<string>()
  const vals: string[] = []
  filtered.forEach(r => {
    const v = String(r[`cf_${level.fieldId}`] ?? '').trim()
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase())
      vals.push(v)
    }
  })
  return vals.sort((a, b) => {
    const na = Number(a), nb = Number(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })
}

// Build human-readable scope names from selections
function buildScopeNames(cfLevels: CfLevel[], selections: ScopeSelection): string[] {
  const parts: string[] = []
  cfLevels.forEach(level => {
    const sel = selections[level.fieldId]
    if (!sel) return
    if (sel === '*') {
      parts.push(`All ${level.fieldLabel}s`)
    } else {
      const vals = Array.from(sel as Set<string>)
      vals.forEach(v => parts.push(`${level.fieldLabel} ${v}`))
    }
  })
  return parts
}

// Build the scope object stored in Firestore
function buildScopeObject(cfLevels: CfLevel[], selections: ScopeSelection) {
  const pairs: { fieldId: string; fieldLabel: string; value: string | '*' }[] = []
  cfLevels.forEach(level => {
    const sel = selections[level.fieldId]
    if (!sel) return
    if (sel === '*') {
      pairs.push({ fieldId: level.fieldId, fieldLabel: level.fieldLabel, value: '*' })
    } else {
      Array.from(sel as Set<string>).forEach(v =>
        pairs.push({ fieldId: level.fieldId, fieldLabel: level.fieldLabel, value: v })
      )
    }
  })
  return { type: 'customFields', pairs }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InviteSubAdminDrawer({
  open, onClose, eventId, eventName, eventImage, organizerName, organizerUid,
}: Props) {
  const [email, setEmail]         = useState('')
  const [scopeType, setScopeType] = useState<'all' | 'scoped'>('all')

  // Data
  const [registrants, setRegistrants] = useState<any[]>([])
  const [cfLevels, setCfLevels]       = useState<CfLevel[]>([])

  // Org Builder path (fallback)
  const [orgLevels, setOrgLevels] = useState<OrgLevel[]>([])
  const [orgNodes, setOrgNodes]   = useState<OrgNode[]>([])
  const [path, setPath]           = useState<'cf' | 'org' | null>(null)

  // Cascading selections: fieldId → Set<string> | '*'
  const [selections, setSelections] = useState<ScopeSelection>({})
  // Which level is currently expanded
  const [activeLevelIdx, setActiveLevelIdx] = useState(0)

  // Org Builder selections (flat, for org path)
  const [orgSelected, setOrgSelected] = useState<Set<string>>(new Set())

  const [saving, setSaving] = useState(false)
  const [sent,   setSent]   = useState(false)
  const [error,  setError]  = useState('')

  // ── Load data when drawer opens ───────────────────────────────────────────
  useEffect(() => {
    if (!eventId || !open) return

    Promise.all([
      // Form config to get field order
      getDoc(doc(db, 'events', eventId, 'config', 'networkForm')),
      // All registrants for value extraction
      getDocs(collection(db, 'events', eventId, 'networkRegistrations')),
      // Org Builder levels + nodes (fallback)
      getDocs(query(collection(db, 'events', eventId, 'orgLevels'), orderBy('order'))),
      getDocs(collection(db, 'events', eventId, 'orgNodes')),
    ]).then(([cfgSnap, regSnap, lvlSnap, nodeSnap]) => {
      const regs = regSnap.docs.map(d => d.data())
      setRegistrants(regs)

      const orgLvls = lvlSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrgLevel))
      const orgNds  = nodeSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrgNode))
      setOrgLevels(orgLvls)
      setOrgNodes(orgNds)

      // Detect path: custom fields or org builder
      const customFields: any[] = cfgSnap.exists() ? (cfgSnap.data()?.customFields ?? []) : []

      if (customFields.length > 0 && regs.length > 0) {
        // Path: Custom Fields — use field order from config as hierarchy
        const levels: CfLevel[] = customFields.map((f: any, i: number) => ({
          fieldId:    f.id,
          fieldLabel: f.label,
          color:      LEVEL_COLORS[i % LEVEL_COLORS.length],
          values:     [],
        }))
        setCfLevels(levels)
        setPath('cf')
      } else if (orgLvls.length > 0) {
        // Path: Org Builder
        setPath('org')
      } else {
        setPath(null)
      }

      setSelections({})
      setActiveLevelIdx(0)
      setOrgSelected(new Set())
    })
  }, [eventId, open])

  const reset = () => {
    setEmail(''); setScopeType('all'); setSelections({})
    setActiveLevelIdx(0); setOrgSelected(new Set())
    setError(''); setSent(false)
  }
  const handleClose = () => { reset(); onClose() }

  // ── Selection helpers (cascading CF) ─────────────────────────────────────

  const selectAll = (fieldId: string) => {
    setSelections(prev => {
      const next = { ...prev, [fieldId]: '*' as '*' }
      // Clear all deeper levels
      const idx = cfLevels.findIndex(l => l.fieldId === fieldId)
      cfLevels.slice(idx + 1).forEach(l => delete next[l.fieldId])
      return next
    })
    const idx = cfLevels.findIndex(l => l.fieldId === fieldId)
    setActiveLevelIdx(Math.min(idx + 1, cfLevels.length - 1))
  }

  const toggleValue = (fieldId: string, value: string) => {
    setSelections(prev => {
      const current = prev[fieldId]
      const set: Set<string> = current === '*' ? new Set() : new Set(current as Set<string>)
      const key = value.toLowerCase()
      set.has(key) ? set.delete(key) : set.add(key)
      const next = { ...prev, [fieldId]: set.size > 0 ? set : undefined } as ScopeSelection
      if (!next[fieldId]) delete next[fieldId]
      // Clear deeper levels when parent changes
      const idx = cfLevels.findIndex(l => l.fieldId === fieldId)
      cfLevels.slice(idx + 1).forEach(l => delete next[l.fieldId])
      return next
    })
  }

  const isValueSelected = (fieldId: string, value: string): boolean => {
    const sel = selections[fieldId]
    if (!sel) return false
    if (sel === '*') return true
    return (sel as Set<string>).has(value.toLowerCase())
  }

  const levelHasSelection = (fieldId: string): boolean => {
    const sel = selections[fieldId]
    if (!sel) return false
    if (sel === '*') return true
    return (sel as Set<string>).size > 0
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.'); return
    }
    if (scopeType === 'scoped') {
      if (path === 'cf' && Object.keys(selections).length === 0) {
        setError('Select at least one value to assign scope.'); return
      }
      if (path === 'org' && orgSelected.size === 0) {
        setError('Select at least one area to assign.'); return
      }
    }

    setSaving(true); setError('')

    const scope      = scopeType === 'all' ? 'all' : buildScopeObject(cfLevels, selections)
    const scopeNames = scopeType === 'all' ? [] : buildScopeNames(cfLevels, selections)

    try {
      await addDoc(collection(db, 'events', eventId, 'pendingInvites'), {
        invitedEmail: email.trim().toLowerCase(),
        role: 'checkin_admin',
        scope, scopeNames,
        status: 'pending',
        invitedAt: serverTimestamp(),
      })

      fetch(`${FUNCTIONS_BASE}/sendInvitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitedEmail: email.trim().toLowerCase(),
          eventId, eventName,
          eventImage: eventImage || null,
          organizerName, organizerUid,
          role: 'checkin_admin',
          scope, scopeNames,
        }),
      }).catch(() => console.warn('Email send failed — invite doc saved'))

      setSent(true)
    } catch {
      setError('Failed to save invitation. Please try again.')
    }
    setSaving(false)
  }

  // ── Render cascading CF picker ────────────────────────────────────────────
  const renderCfPicker = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {cfLevels.map((level, idx) => {
        // Only show levels where parent has a selection (or it's the first level)
        const parentSelected = idx === 0 || levelHasSelection(cfLevels[idx - 1].fieldId)
        if (!parentSelected) return null

        const values   = getValuesForLevel(registrants, cfLevels, idx, selections)
        const isActive = activeLevelIdx === idx
        const hasSel   = levelHasSelection(level.fieldId)
        const selCount = selections[level.fieldId] === '*'
          ? values.length
          : (selections[level.fieldId] as Set<string>)?.size ?? 0

        return (
          <div key={level.fieldId} style={{
            border: `1px solid ${hasSel ? level.color + '44' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            {/* Level header */}
            <div
              onClick={() => setActiveLevelIdx(isActive ? -1 : idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                background: hasSel ? `${level.color}10` : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              {/* Step indicator */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: hasSel ? level.color : 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: hasSel ? '#fff' : 'rgba(255,255,255,0.3)',
              }}>
                {hasSel ? <Check size={12} /> : idx + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: hasSel ? level.color : '#fff' }}>
                  {level.fieldLabel}
                </div>
                {hasSel && (
                  <div style={{ fontSize: 11, color: SUB2, marginTop: 1 }}>
                    {selections[level.fieldId] === '*' ? `All (${values.length})` : `${selCount} selected`}
                  </div>
                )}
              </div>

              {idx < cfLevels.length - 1 && hasSel && !isActive && (
                <ChevronRight size={13} color={level.color} />
              )}
              {isActive ? <ChevronUp size={13} color={SUB2} /> : <ChevronDown size={13} color={SUB2} />}
            </div>

            {/* Values */}
            {isActive && (
              <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {values.length === 0 ? (
                  <p style={{ fontSize: 12, color: SUB2, margin: 0 }}>No values found yet from registrant data.</p>
                ) : (
                  <>
                    {/* Select All chip */}
                    <button
                      onClick={() => selectAll(level.fieldId)}
                      style={{
                        padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, marginBottom: 10,
                        border: `1px solid ${selections[level.fieldId] === '*' ? level.color : 'rgba(255,255,255,0.12)'}`,
                        background: selections[level.fieldId] === '*' ? `${level.color}18` : 'transparent',
                        color: selections[level.fieldId] === '*' ? level.color : SUB2,
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {selections[level.fieldId] === '*' && <Check size={10} />}
                      All {level.fieldLabel}s ({values.length})
                    </button>

                    {/* Individual value chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {values.map(val => {
                        const isSel = isValueSelected(level.fieldId, val)
                        return (
                          <button
                            key={val}
                            onClick={() => toggleValue(level.fieldId, val)}
                            style={{
                              padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
                              fontSize: 12, fontWeight: 600,
                              border: `1px solid ${isSel ? level.color : 'rgba(255,255,255,0.1)'}`,
                              background: isSel ? `${level.color}18` : 'transparent',
                              color: isSel ? level.color : 'rgba(255,255,255,0.6)',
                              display: 'flex', alignItems: 'center', gap: 5,
                              transition: 'all 0.13s', fontFamily: 'var(--font-body)',
                            }}
                          >
                            {isSel && <Check size={10} />}
                            {level.fieldLabel} {val}
                          </button>
                        )
                      })}
                    </div>

                    {/* Prompt to go to next level */}
                    {hasSel && idx < cfLevels.length - 1 && (
                      <button
                        onClick={() => setActiveLevelIdx(idx + 1)}
                        style={{
                          marginTop: 12, display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: 12, color: level.color, background: 'none', border: 'none',
                          cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
                          padding: 0,
                        }}
                      >
                        Next: choose {cfLevels[idx + 1].fieldLabel} <ChevronRight size={13} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── Render org builder picker (flat grouped by level) ─────────────────────
  const renderOrgPicker = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orgLevels.map(level => {
        const levelNodes = orgNodes.filter(n => n.levelId === level.id)
        const selCount   = levelNodes.filter(n => orgSelected.has(n.id)).length
        return (
          <div key={level.id} style={{ border: `1px solid ${level.color}22`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: `${level.color}08` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: level.color }}>{level.name}</span>
              {selCount > 0 && <span style={{ fontSize: 11, color: SUB2 }}>{selCount}/{levelNodes.length} selected</span>}
            </div>
            <div style={{ padding: '6px 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {levelNodes.map(node => {
                const isSel = orgSelected.has(node.id)
                return (
                  <button key={node.id} onClick={() => {
                    setOrgSelected(prev => {
                      const next = new Set(prev)
                      next.has(node.id) ? next.delete(node.id) : next.add(node.id)
                      return next
                    })
                  }} style={{
                    padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    border: `1px solid ${isSel ? level.color : 'rgba(255,255,255,0.1)'}`,
                    background: isSel ? `${level.color}18` : 'transparent',
                    color: isSel ? level.color : 'rgba(255,255,255,0.55)',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.13s', fontFamily: 'var(--font-body)',
                  }}>
                    {isSel && <Check size={10} />}{node.name}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)', zIndex: 199,
        opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity 0.25s',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: open ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        width: 'min(680px, 96vw)',
        maxHeight: '90vh',
        background: '#060d1a',
        border: '1px solid rgba(13,199,94,0.15)',
        borderRadius: 20,
        zIndex: 200, display: 'flex', flexDirection: 'column',
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s',
        boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(13,199,94,0.15)',
        overflow: 'hidden',
      }}>

        {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#0dc75e,#14B8A6,#0dc75e)', flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, background: '#060d1a', zIndex: 1, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ background: 'rgba(13,199,94,0.1)', border: '1px solid rgba(13,199,94,0.25)', borderRadius: 9, padding: '7px 8px', display: 'flex' }}>
              <Shield size={15} color='#0dc75e' />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Invite Check-in Admin
            </span>
          </div>
          <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SUB2 }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(13,199,94,0.12)', border: '1px solid rgba(13,199,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={26} color="#22C55E" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Invitation Sent!</div>
                <div style={{ fontSize: 13, color: SUB2, lineHeight: 1.6, maxWidth: 280 }}>
                  Invitation sent to <strong style={{ color: '#fff' }}>{email}</strong>. Status will show as Pending until they accept.
                </div>
              </div>
              <button onClick={reset} style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, border: `1px solid ${ACCENT}40`, background: `${ACCENT}10`, color: ACCENT, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Invite Another
              </button>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label style={lbl}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: SUB2 }} />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="colleague@example.com"
                    style={{ ...inp, paddingLeft: 34 }}
                    onFocus={e => e.currentTarget.style.borderColor = `${ACCENT}50`}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
                <p style={{ fontSize: 11, color: SUB2, margin: '6px 0 0', lineHeight: 1.5 }}>
                  They'll be prompted to create a StageCheck account if they don't have one.
                </p>
              </div>

              {/* Scope type */}
              <div>
                <label style={lbl}>Access Scope</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'all',    icon: <Globe size={13} />,  title: 'All Access',  desc: 'Can check in everyone' },
                    { key: 'scoped', icon: <Shield size={13} />, title: 'Scoped',      desc: 'Specific areas only'   },
                  ].map(opt => {
                    const active = scopeType === opt.key
                    return (
                      <button key={opt.key} onClick={() => setScopeType(opt.key as 'all' | 'scoped')} style={{
                        padding: '12px 14px', borderRadius: 11, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${active ? 'rgba(13,199,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: active ? 'rgba(13,199,94,0.08)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', flexDirection: 'column', gap: 4,
                        transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: active ? '#0dc75e' : SUB2 }}>{opt.icon}</span>
                          {active && <Check size={11} color='#0dc75e' />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#0dc75e' : 'rgba(255,255,255,0.75)' }}>{opt.title}</span>
                        <span style={{ fontSize: 11, color: SUB2, lineHeight: 1.4 }}>{opt.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Scope picker */}
              {scopeType === 'scoped' && (
                <div>
                  <label style={lbl}>
                    Assign Areas
                    {Object.keys(selections).length > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: `${ACCENT}18`, color: ACCENT, padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
                        {buildScopeNames(cfLevels, selections).length} selected
                      </span>
                    )}
                  </label>

                  {path === null ? (
                    <div style={{ fontSize: 12, color: SUB2, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', lineHeight: 1.6 }}>
                      No org structure or registrations found yet.<br />
                      Wait until attendees register, or build your Org structure first.
                    </div>
                  ) : path === 'cf' ? (
                    <>
                      <p style={{ fontSize: 11, color: SUB2, margin: '0 0 12px', lineHeight: 1.5 }}>
                        Select step by step — choose a value at each level to narrow down the next.
                      </p>
                      {renderCfPicker()}
                    </>
                  ) : renderOrgPicker()}
                </div>
              )}

              {error && (
                <p style={{ fontSize: 12, color: '#F87171', margin: 0, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: 9, border: '1px solid rgba(248,113,113,0.15)' }}>
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: 'rgba(8,12,26,0.99)' }}>
            <button onClick={handleSend} disabled={saving || !email.trim()} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: email.trim() ? '#0dc75e' : 'rgba(255,255,255,0.06)', border: 'none',
              color: email.trim() ? '#000' : 'rgba(255,255,255,0.2)',
              padding: '11px 0', borderRadius: 12, cursor: email.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.18s',
            }}>
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                : <><Mail size={14} /> Send Invitation &rarr;</>
              }
            </button>
            <button onClick={handleClose} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: SUB2, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              Cancel
            </button>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  )
}