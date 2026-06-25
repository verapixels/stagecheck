import { useState, useEffect } from 'react'
import {
  collection, getDocs, query, orderBy,
  addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  X, Mail, Shield, Globe, Check, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'

interface OrgLevel { id: string; name: string; order: number; color: string }
interface OrgNode  { id: string; name: string; levelId: string; parentId?: string }

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

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#fff', fontSize: 13,
  padding: '10px 13px', outline: 'none',
  fontFamily: 'var(--font-body)', width: '100%',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
  marginBottom: 7, display: 'block',
}
const SUB2 = 'rgba(255,255,255,0.4)'
const ACCENT = '#6366F1'

export default function InviteSubAdminDrawer({
  open, onClose, eventId, eventName, eventImage, organizerName, organizerUid,
}: Props) {
  const [email, setEmail]           = useState('')
  const [scopeType, setScopeType]   = useState<'all' | 'scoped'>('all')
  const [levels, setLevels]         = useState<OrgLevel[]>([])
  const [nodes, setNodes]           = useState<OrgNode[]>([])
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [saving, setSaving]         = useState(false)
  const [sent, setSent]             = useState(false)
  const [error, setError]           = useState('')

  // Load org levels + nodes once
  useEffect(() => {
    if (!eventId) return
    Promise.all([
      getDocs(query(collection(db, 'events', eventId, 'orgLevels'), orderBy('order'))),
      getDocs(collection(db, 'events', eventId, 'orgNodes')),
    ]).then(([lvlSnap, nodeSnap]) => {
      const lvls = lvlSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrgLevel))
      const nds  = nodeSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrgNode))
      setLevels(lvls)
      setNodes(nds)
      // Expand first level by default
      if (lvls.length) setExpanded(new Set([lvls[0].id]))
    })
  }, [eventId])

  const reset = () => {
    setEmail(''); setScopeType('all'); setSelected(new Set())
    setError(''); setSent(false)
  }

  const handleClose = () => { reset(); onClose() }

  const toggleNode = (nodeId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId)
      return next
    })
  }

  const toggleLevel = (levelId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(levelId) ? next.delete(levelId) : next.add(levelId)
      return next
    })
  }

  // Select / deselect all nodes in a level
  const toggleLevelAll = (levelId: string) => {
    const levelNodes = nodes.filter(n => n.levelId === levelId).map(n => n.id)
    const allSelected = levelNodes.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) levelNodes.forEach(id => next.delete(id))
      else levelNodes.forEach(id => next.add(id))
      return next
    })
  }

  const handleSend = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.'); return
    }
    if (scopeType === 'scoped' && selected.size === 0) {
      setError('Select at least one area/zone/parish to assign.'); return
    }

    setSaving(true); setError('')

    const scope: 'all' | string[] = scopeType === 'all'
      ? 'all'
      : Array.from(selected)

    const scopeNames = scopeType === 'all'
      ? []
      : nodes.filter(n => selected.has(n.id)).map(n => n.name)

    try {
      // 1. Write a pending teamMember doc so check-in page can filter immediately
      //    (will be updated to active when they accept)
      await addDoc(collection(db, 'events', eventId, 'pendingInvites'), {
        invitedEmail: email.trim().toLowerCase(),
        role: 'checkin_admin',
        scope,
        scopeNames,
        status: 'pending',
        invitedAt: serverTimestamp(),
      })

      // 2. Call Cloud Function to create invitation doc + send email
      const res = await fetch(`${FUNCTIONS_BASE}/sendInvitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitedEmail: email.trim().toLowerCase(),
          eventId,
          eventName,
          eventImage: eventImage || null,
          organizerName,
          organizerUid,
          role: 'checkin_admin',
          scope,
          scopeNames,
        }),
      })

      if (!res.ok) throw new Error('Function call failed')

      setSent(true)
    } catch {
      setError('Failed to send invitation. Please try again.')
    }
    setSaving(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)', zIndex: 199,
          opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.22s',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(460px,100vw)',
        background: 'rgba(8,12,26,0.99)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, background: 'rgba(8,12,26,0.99)', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}28`, borderRadius: 9, padding: '7px 8px', display: 'flex' }}>
              <Shield size={15} color={ACCENT} />
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {sent ? (
            /* ── Success state ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={26} color="#22C55E" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Invitation Sent!</div>
                <div style={{ fontSize: 13, color: SUB2, lineHeight: 1.6, maxWidth: 280 }}>
                  An invitation email has been sent to <strong style={{ color: '#fff' }}>{email}</strong>. Their status will show as <em>Pending</em> until they accept.
                </div>
              </div>
              <button
                onClick={reset}
                style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, border: `1px solid ${ACCENT}40`, background: `${ACCENT}10`, color: ACCENT, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
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
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="colleague@example.com"
                    style={{ ...inp, paddingLeft: 34 }}
                    onFocus={e => e.currentTarget.style.borderColor = `${ACCENT}50`}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
                <p style={{ fontSize: 11, color: SUB2, margin: '6px 0 0', lineHeight: 1.5 }}>
                  If they don't have a StageCheck account yet, they'll be prompted to create one before accepting.
                </p>
              </div>

              {/* Scope type */}
              <div>
                <label style={lbl}>Access Scope</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'all',    icon: <Globe size={13} />,  title: 'All Access',    desc: 'Can check in everyone' },
                    { key: 'scoped', icon: <Shield size={13} />, title: 'Scoped',         desc: 'Specific areas only' },
                  ].map(opt => {
                    const active = scopeType === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setScopeType(opt.key as 'all' | 'scoped')}
                        style={{
                          padding: '12px 14px', borderRadius: 11, cursor: 'pointer', textAlign: 'left',
                          border: `1.5px solid ${active ? `${ACCENT}55` : 'rgba(255,255,255,0.08)'}`,
                          background: active ? `${ACCENT}10` : 'rgba(255,255,255,0.02)',
                          display: 'flex', flexDirection: 'column', gap: 4,
                          transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: active ? ACCENT : SUB2 }}>{opt.icon}</span>
                          {active && <Check size={11} color={ACCENT} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>{opt.title}</span>
                        <span style={{ fontSize: 11, color: SUB2, lineHeight: 1.4 }}>{opt.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Node picker (only when scoped) */}
              {scopeType === 'scoped' && (
                <div>
                  <label style={lbl}>
                    Assign Specific Nodes
                    {selected.size > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: `${ACCENT}18`, color: ACCENT, padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
                        {selected.size} selected
                      </span>
                    )}
                  </label>

                  {levels.length === 0 ? (
                    <div style={{ fontSize: 12, color: SUB2, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                      No org levels found. Build your org structure first in the Org Builder, or the registrants' selections will appear here automatically.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {levels.map(level => {
                        const levelNodes  = nodes.filter(n => n.levelId === level.id)
                        const isExpanded  = expanded.has(level.id)
                        const selCount    = levelNodes.filter(n => selected.has(n.id)).length
                        const allSel      = levelNodes.length > 0 && selCount === levelNodes.length

                        return (
                          <div key={level.id} style={{ border: `1px solid ${level.color}22`, borderRadius: 12, overflow: 'hidden' }}>
                            {/* Level header */}
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '11px 14px', background: `${level.color}08`, cursor: 'pointer',
                            }}>
                              {/* Select-all checkbox */}
                              <div
                                onClick={e => { e.stopPropagation(); toggleLevelAll(level.id) }}
                                style={{
                                  width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                                  border: `1.5px solid ${allSel ? level.color : 'rgba(255,255,255,0.2)'}`,
                                  background: allSel ? level.color : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.13s',
                                }}
                              >
                                {allSel && <Check size={10} color="#fff" />}
                              </div>

                              <div style={{ flex: 1 }} onClick={() => toggleLevel(level.id)}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: level.color }}>{level.name}</span>
                                <span style={{ fontSize: 11, color: SUB2, marginLeft: 8 }}>
                                  {selCount > 0 ? `${selCount}/${levelNodes.length} selected` : `${levelNodes.length} total`}
                                </span>
                              </div>

                              <div onClick={() => toggleLevel(level.id)} style={{ color: SUB2, cursor: 'pointer' }}>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </div>

                            {/* Nodes */}
                            {isExpanded && (
                              <div style={{ padding: '4px 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                {levelNodes.length === 0 ? (
                                  <span style={{ fontSize: 11, color: SUB2, padding: '8px 0' }}>No nodes in this level yet.</span>
                                ) : levelNodes.map(node => {
                                  const isSel = selected.has(node.id)
                                  return (
                                    <button
                                      key={node.id}
                                      onClick={() => toggleNode(node.id)}
                                      style={{
                                        padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                        border: `1px solid ${isSel ? level.color : 'rgba(255,255,255,0.1)'}`,
                                        background: isSel ? `${level.color}18` : 'transparent',
                                        color: isSel ? level.color : 'rgba(255,255,255,0.55)',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        transition: 'all 0.13s', fontFamily: 'var(--font-body)',
                                      }}
                                    >
                                      {isSel && <Check size={10} />}
                                      {node.name}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
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
            <button
              onClick={handleSend}
              disabled={saving || !email.trim()}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: email.trim() ? ACCENT : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: email.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                padding: '11px 0', borderRadius: 12, cursor: email.trim() ? 'pointer' : 'not-allowed',
                fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.18s',
              }}
            >
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                : <><Mail size={14} /> Send Invitation</>
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