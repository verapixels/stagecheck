import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, doc, getDoc,
  deleteDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEventMeta } from '../lib/useEventMeta'
import DashboardLayout from '../components/DashboardLayout'
import InviteSubAdminDrawer from '../components/network/Invitesubadmindrawer'
import { useAuth } from '../context/Authcontext'
import {
  Users, Plus, Shield, Globe, Clock, CheckCircle2,
  Trash2, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react'

interface PendingInvite {
  id: string
  invitedEmail: string
  role: string
  scope: 'all' | string[]
  scopeNames: string[]
  status: 'pending' | 'accepted' | 'declined'
  invitedAt?: { seconds: number }
}

interface TeamMember {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: string
  scope: 'all' | string[]
  scopeNames: string[]
  status: 'active'
  addedAt?: { seconds: number }
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18, overflow: 'hidden',
}
const SUB2   = 'rgba(255,255,255,0.4)'
const ACCENT = '#6366F1'

function ScopeBadge({ scope, scopeNames }: { scope: 'all' | string[]; scopeNames: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (scope === 'all') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '3px 9px', borderRadius: 6 }}>
        <Globe size={10} /> All Access
      </span>
    )
  }

  const names = scopeNames.length ? scopeNames : scope as string[]
  return (
    <div>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
      >
        <Shield size={10} /> {names.length} node{names.length !== 1 ? 's' : ''}
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {expanded && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {names.map((n, i) => (
            <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 5 }}>
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NetworkTeamPage() {
  const { eventId }     = useParams<{ eventId: string }>()
  const { user }        = useAuth()
  const { eventType, enabledModules, loading: metaLoading } = useEventMeta(eventId)

  const [event, setEvent]       = useState<any>(null)
  const [members, setMembers]   = useState<TeamMember[]>([])
  const [invites, setInvites]   = useState<PendingInvite[]>([])
  const [drawerOpen, setDrawer] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [tab, setTab]           = useState<'active' | 'pending'>('active')

  // Load event meta
  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(s => {
      if (s.exists()) setEvent(s.data())
    })
  }, [eventId])

  // Live team members
  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'teamMembers'), snap => {
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as TeamMember)))
    })
    return unsub
  }, [eventId])

  // Live pending invites
  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'pendingInvites'), snap => {
      setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingInvite)))
    })
    return unsub
  }, [eventId])

  const removeMember = async (uid: string) => {
    if (!eventId) return
    setRemoving(uid)
    await deleteDoc(doc(db, 'events', eventId, 'teamMembers', uid))
    setRemoving(null)
  }

  const cancelInvite = async (inviteId: string) => {
    if (!eventId) return
    await deleteDoc(doc(db, 'events', eventId, 'pendingInvites', inviteId))
  }

  const pendingInvites = invites.filter(i => i.status === 'pending')
  const activeCount    = members.length
  const pendingCount   = pendingInvites.length

  const organizerName  = event?.organizerName || user?.displayName || 'Organizer'
  const eventName      = event?.eventName || ''
  const eventImage     = event?.coverImage || ''

  return (
    <DashboardLayout
      eventType={eventType ?? 'network'}
      eventId={eventId}
      enabledModules={enabledModules}
      metaLoading={metaLoading}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ background: `${ACCENT}14`, borderRadius: 12, padding: '8px 9px', display: 'flex' }}>
                <Users size={20} color={ACCENT} />
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                Team Management
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
              Invite check-in admins and control which areas they can manage.
            </p>
          </div>
          <button
            onClick={() => setDrawer(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: ACCENT, border: 'none', color: '#fff',
              padding: '11px 18px', borderRadius: 11, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
              boxShadow: `0 4px 18px ${ACCENT}40`,
            }}
          >
            <Plus size={14} /> Invite Admin
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Admins',    value: activeCount,  color: '#22C55E' },
            { label: 'Pending Invites',  value: pendingCount, color: '#F59E0B' },
            { label: 'Total Team',       value: activeCount + pendingCount, color: ACCENT },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(12,17,35,0.8)', border: `1px solid ${s.color}22`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: SUB2, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 12 }}>
          {([
            { key: 'active',  label: 'Active',  count: activeCount },
            { key: 'pending', label: 'Pending', count: pendingCount },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: 'var(--font-body)',
                background: tab === t.key ? `${ACCENT}14` : 'transparent',
                color: tab === t.key ? ACCENT : SUB2,
                fontWeight: tab === t.key ? 700 : 400,
              }}
            >
              {t.label}
              <span style={{
                fontSize: 11, borderRadius: 999, padding: '1px 7px', fontWeight: 700,
                background: tab === t.key ? ACCENT : 'rgba(255,255,255,0.08)',
                color: tab === t.key ? '#fff' : SUB2,
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Active members list ── */}
        {tab === 'active' && (
          <div style={glass}>
            {members.length === 0 ? (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <Users size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>No active admins yet. Invite someone to get started.</p>
              </div>
            ) : members.map((m, i) => (
              <div key={m.uid} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: `${ACCENT}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: ACCENT,
                }}>
                  {m.photoURL
                    ? <img src={m.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : (m.displayName || m.email).charAt(0).toUpperCase()
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                    {m.displayName || m.email}
                  </div>
                  {m.displayName && (
                    <div style={{ fontSize: 11, color: SUB2, marginBottom: 6 }}>{m.email}</div>
                  )}
                  <ScopeBadge scope={m.scope} scopeNames={m.scopeNames} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '3px 9px', borderRadius: 6 }}>
                    <CheckCircle2 size={10} /> Active
                  </span>
                  <button
                    onClick={() => removeMember(m.uid)}
                    disabled={removing === m.uid}
                    style={{
                      padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(248,113,113,0.18)',
                      background: 'rgba(248,113,113,0.05)', color: '#F87171', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      opacity: removing === m.uid ? 0.5 : 1, transition: 'all 0.15s',
                    }}
                    title="Remove admin"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pending invites list ── */}
        {tab === 'pending' && (
          <div style={glass}>
            {pendingInvites.length === 0 ? (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <Clock size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>No pending invitations.</p>
              </div>
            ) : pendingInvites.map((inv, i) => (
              <div key={inv.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
                borderBottom: i < pendingInvites.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                {/* Avatar placeholder */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(245,158,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: '#F59E0B',
                }}>
                  {inv.invitedEmail.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {inv.invitedEmail}
                  </div>
                  <ScopeBadge scope={inv.scope} scopeNames={inv.scopeNames} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '3px 9px', borderRadius: 6 }}>
                    <Clock size={10} /> Pending
                  </span>
                  <button
                    onClick={() => cancelInvite(inv.id)}
                    style={{
                      padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(248,113,113,0.18)',
                      background: 'rgba(248,113,113,0.05)', color: '#F87171', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                    }}
                    title="Cancel invite"
                  >
                    <XCircle size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite drawer */}
      <InviteSubAdminDrawer
        open={drawerOpen}
        onClose={() => setDrawer(false)}
        eventId={eventId || ''}
        eventName={eventName}
        eventImage={eventImage}
        organizerName={organizerName}
        organizerUid={user?.uid || ''}
      />
    </DashboardLayout>
  )
}