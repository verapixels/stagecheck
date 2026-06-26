// src/pages/AcceptInvitationPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/Authcontext'
import { Shield, Globe, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

const ACCENT = '#6366F1'

type Stage = 'loading' | 'ready' | 'accepting' | 'done' | 'error' | 'already'

export default function AcceptInvitationPage() {
  const { invitationId } = useParams<{ invitationId: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [stage, setStage]       = useState<Stage>('loading')
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError]       = useState('')

  // ── 1. Load the invitation doc ──────────────────────────────────────────────
  useEffect(() => {
    if (!invitationId || authLoading) return
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'invitations', invitationId))
        if (!snap.exists()) { setError('Invitation not found or has expired.'); setStage('error'); return }

        const data = snap.data()
        setInvitation({ id: snap.id, ...data })

        if (data.status === 'accepted') {
          if (user) {
            try {
              await setDoc(
                doc(db, 'events', data.eventId, 'teamMembers', user.uid),
                { uid: user.uid, email: user.email, displayName: user.displayName || '', photoURL: user.photoURL || '', role: data.role || 'checkin_admin', scope: data.scope ?? 'all', scopeNames: data.scopeNames ?? [], status: 'active', addedAt: serverTimestamp(), invitationId: snap.id },
                { merge: true },
              )
              if (!data.invitedUserId) { await updateDoc(doc(db, 'invitations', snap.id), { invitedUserId: user.uid }) }
            } catch {}
          }
          setStage('already'); return
        }
        if (data.status === 'declined') { setError('This invitation was already declined.'); setStage('error'); return }

        // If user is logged in but not the right email, warn them
        if (user && data.invitedEmail && user.email?.toLowerCase() !== data.invitedEmail.toLowerCase()) {
          setError(`This invitation was sent to ${data.invitedEmail}. Please log in with that account.`)
          setStage('error')
          return
        }

        setStage('ready')
      } catch (e: any) {
        setError(e.message ?? 'Failed to load invitation.')
        setStage('error')
      }
    })()
  }, [invitationId, authLoading, user])

  // ── 2. If not logged in, redirect to login then come back ───────────────────
  useEffect(() => {
    if (!authLoading && !user && stage === 'ready') {
      navigate(`/login?redirect=/accept-invitation/${invitationId}`, { replace: true })
    }
  }, [authLoading, user, stage, invitationId, navigate])

  // ── 3. Accept ───────────────────────────────────────────────────────────────
  const accept = async () => {
    if (!user || !invitation) return
    setStage('accepting')
    try {
      // Stamp uid + accepted status on the root invitation doc
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status:          'accepted',
        invitedUserId:   user.uid,
        respondedAt:     serverTimestamp(),
      })

      // Write the teamMember sub-doc so the event pages work immediately
      await setDoc(
        doc(db, 'events', invitation.eventId, 'teamMembers', user.uid),
        {
          uid:         user.uid,
          email:       user.email,
          displayName: user.displayName || '',
          photoURL:    user.photoURL    || '',
          role:        invitation.role  || 'checkin_admin',
          scope:       invitation.scope ?? 'all',
          scopeNames:  invitation.scopeNames ?? [],
          status:      'active',
          addedAt:     serverTimestamp(),
          invitationId: invitation.id,
        },
        { merge: true },
      )

      // Clean up pendingInvites sub-collection — try both the invitation ID and email as doc ID
      try {
        const byId = doc(db, 'events', invitation.eventId, 'pendingInvites', invitation.id)
        await updateDoc(byId, { status: 'accepted' })
      } catch {
        try {
          const byEmail = doc(db, 'events', invitation.eventId, 'pendingInvites', invitation.invitedEmail)
          await updateDoc(byEmail, { status: 'accepted' })
        } catch { /* no-op */ }
      }

      setStage('done')
    } catch (e: any) {
      setError(e.message ?? 'Failed to accept invitation.')
      setStage('error')
    }
  }

  const decline = async () => {
    if (!invitation) return
    await updateDoc(doc(db, 'invitations', invitation.id), {
      status:      'declined',
      respondedAt: serverTimestamp(),
    })
    navigate('/dashboard')
  }

  // ── Scope label ─────────────────────────────────────────────────────────────
  const isFullAccess = !invitation?.scope || invitation.scope === 'all'
  const scopeLabel   = (() => {
    if (isFullAccess) return 'Full Access'
    if (invitation?.scopeNames?.length) return invitation.scopeNames.join(', ')
    return 'Scoped Access'
  })()

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#030d1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: 'var(--font-body, Arial, sans-serif)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="https://res.cloudinary.com/dr0qtfjjf/image/upload/q_auto,f_auto,w_160/v1780966404/ChatGPT_Image_Jun_8_2026_10_17_50_PM_phtfqg.png"
            alt="StageCheck" style={{ height: 32, width: 'auto' }}
          />
        </div>

        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'rgba(12,17,35,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg,${ACCENT},#818CF8)` }} />

          <div style={{ padding: 32 }}>

            {/* LOADING */}
            {(stage === 'loading' || authLoading) && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Spinner />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 14 }}>Loading invitation…</p>
              </div>
            )}

            {/* ERROR */}
            {stage === 'error' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <XCircle size={40} color="#F87171" style={{ marginBottom: 16 }} />
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Oops!</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
                <button onClick={() => navigate('/dashboard')} style={btnStyle(ACCENT)}>
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* ALREADY ACCEPTED */}
            {stage === 'already' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={40} color="#22C55E" style={{ marginBottom: 16 }} />
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>You're already in!</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  You've already accepted this invitation for <strong style={{ color: '#fff' }}>{invitation?.eventName}</strong>.
                </p>
                <button onClick={() => navigate(`/manage/event/${invitation?.eventId}/network/checkin`)} style={btnStyle('#22C55E')}>
                  Open Check-in
                </button>
              </div>
            )}

            {/* DONE */}
            {stage === 'done' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={48} color="#22C55E" style={{ marginBottom: 16 }} />
                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>You're in! 🎉</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  You've joined the team for <strong style={{ color: '#fff' }}>{invitation?.eventName}</strong>.
                </p>
                <button onClick={() => navigate(`/manage/event/${invitation?.eventId}/network/checkin`)} style={btnStyle('#22C55E')}>
                  Open Check-in
                </button>
              </div>
            )}

            {/* READY */}
            {(stage === 'ready' || stage === 'accepting') && invitation && (
              <>
                {/* Event image */}
                {invitation.eventImage && (
                  <img src={invitation.eventImage} alt={invitation.eventName} style={{
                    width: '100%', borderRadius: 12, objectFit: 'cover',
                    maxHeight: 160, marginBottom: 24, display: 'block',
                  }} />
                )}

                <span style={{
                  fontSize: 10, fontWeight: 700, color: ACCENT,
                  background: `${ACCENT}14`, border: `1px solid ${ACCENT}28`,
                  borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 12,
                }}>
                  Team Invitation
                </span>

                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
                  {invitation.eventName}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                  <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{invitation.organizerName}</strong> has invited
                  you to help manage this event as a <strong style={{ color: '#fff' }}>Check-in Admin</strong>.
                </p>

                {/* Scope badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
                  fontSize: 12, fontWeight: 600,
                  color: isFullAccess ? '#22C55E' : ACCENT,
                  background: isFullAccess ? 'rgba(34,197,94,0.08)' : `${ACCENT}08`,
                  border: `1px solid ${isFullAccess ? 'rgba(34,197,94,0.2)' : `${ACCENT}20`}`,
                  padding: '5px 12px', borderRadius: 8,
                }}>
                  {isFullAccess ? <Globe size={13} /> : <Shield size={13} />}
                  {scopeLabel}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={decline}
                    disabled={stage === 'accepting'}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.55)', fontSize: 14, fontFamily: 'inherit',
                      opacity: stage === 'accepting' ? 0.5 : 1,
                    }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={accept}
                    disabled={stage === 'accepting'}
                    style={{
                      flex: 2, padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                      background: ACCENT, border: 'none',
                      color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: stage === 'accepting' ? 0.7 : 1,
                      boxShadow: `0 4px 18px ${ACCENT}40`,
                    }}
                  >
                    {stage === 'accepting' ? <><Spinner small /> Accepting…</> : <><CheckCircle2 size={15} /> Accept Invitation</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Spinner({ small }: { small?: boolean }) {
  const size = small ? 14 : 28
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.15)`,
      borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    marginTop: 24, padding: '12px 28px', borderRadius: 10,
    background: color, border: 'none', color: color === '#22C55E' ? '#000' : '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  }
}