import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, serverTimestamp, orderBy, query
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/Authcontext'
import DashboardLayout from '../../components/DashboardLayout'
import {
  MessageSquare, Send, Users, Loader2, Clock,
  ChevronDown, Mail, CheckCheck, User, AlertCircle
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'
import { doc, getDoc } from 'firebase/firestore'

interface Message {
  id: string
  text: string
  sentBy: string
  senderName: string
  sentAt?: any
  type: 'broadcast' | 'system' | 'targeted'
  recipientEmails?: string[]
  recipientLabel?: string
  emailStatus?: 'sent' | 'failed' | 'pending'
}

interface Performer {
  id: string
  performerName: string
  groupName?: string
  email?: string
}

// ── Cloud Function URL — update to your deployed function URL ──
const SEND_EMAIL_FN = import.meta.env.VITE_SEND_MESSAGE_FN_URL || 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/sendEventMessage'

export default function MessagesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules } = useEvent()
  const { user } = useAuth()

  const [messages, setMessages]       = useState<Message[]>([])
  const [performers, setPerformers]   = useState<Performer[]>([])
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [loadingPerformers, setLoadingPerformers] = useState(true)
  const [eventName, setEventName] = useState('')

  // Recipient selection
  const [recipientMode, setRecipientMode] = useState<'all' | 'specific'>('all')
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const bottomRef    = useRef<HTMLDivElement>(null)
  const dropdownRef  = useRef<HTMLDivElement>(null)

  // ── Load messages ──────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    const q = query(collection(db, 'events', eventId, 'messages'), orderBy('sentAt', 'asc'))
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
      setLoading(false)
    })
  }, [eventId])

  // ── Load performers from submissions ───────────────────────────
  useEffect(() => {
    if (!eventId) return
    // Live listener so new submissions appear instantly
    return onSnapshot(collection(db, 'events', eventId, 'submissions'), snap => {
      const list: Performer[] = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Performer))
        .filter(p => p.email) // only those who gave an email
      setPerformers(list)
      setLoadingPerformers(false)
    })
  }, [eventId])

  // ── Fetch event name ──────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    getDoc(doc(db, 'events', eventId)).then(snap => {
      if (snap.exists()) setEventName(snap.data()?.name || 'Your Event')
    })
  }, [eventId])

  // ── Auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Close dropdown on outside click ───────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Send ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!eventId || !text.trim() || !user) return
    if (recipientMode === 'specific' && !selectedPerformer) return

    setSending(true)
    setEmailFeedback(null)

    const recipientEmails =
      recipientMode === 'all'
        ? performers.map(p => p.email!).filter(Boolean)
        : selectedPerformer?.email
          ? [selectedPerformer.email]
          : []

    const recipientLabel =
      recipientMode === 'all'
        ? `All performers (${recipientEmails.length})`
        : selectedPerformer?.groupName || selectedPerformer?.performerName || ''

    try {
      // 1. Store in Firestore
      await addDoc(collection(db, 'events', eventId, 'messages'), {
        text: text.trim(),
        sentBy: user.uid,
        senderName: user.displayName || user.email || 'Organiser',
        sentAt: serverTimestamp(),
        type: recipientMode === 'all' ? 'broadcast' : 'targeted',
        recipientEmails,
        recipientLabel,
        emailStatus: recipientEmails.length > 0 ? 'pending' : 'none',
      })

      // 2. Call Cloud Function to send emails
      if (recipientEmails.length > 0) {
        const res = await fetch(SEND_EMAIL_FN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            eventName: eventName || 'Your Event',
            messageText: text.trim(),
            senderName: user.displayName || user.email || 'Organiser',
            senderEmail: user.email || '',
            recipientEmails,
          }),
        })
        if (!res.ok) throw new Error('Email send failed')
        setEmailFeedback({ type: 'success', msg: `Email sent to ${recipientEmails.length} performer${recipientEmails.length !== 1 ? 's' : ''}` })
      }

      setText('')
      setSelectedPerformer(null)
      setRecipientMode('all')
    } catch (e) {
      setEmailFeedback({ type: 'error', msg: 'Message saved but email delivery failed. Retry?' })
    } finally {
      setSending(false)
      setTimeout(() => setEmailFeedback(null), 5000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
      ', ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const card: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
  }

  const performersWithEmail = performers.filter(p => p.email)

  return (
    <DashboardLayout
      plan="starter"
      eventType={eventType ?? 'custom'}
      eventId={eventId}
      enabledModules={enabledModules}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <MessageSquare size={20} color="#14B8A6" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Messages
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Broadcast announcements to performers via email
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#14B8A6', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', padding: '6px 14px', borderRadius: 8 }}>
          <Mail size={12} /> Email delivery
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Messages Sent',    value: messages.length,             color: '#14B8A6' },
          { label: 'Performers',        value: performersWithEmail.length,  color: '#22C55E' },
          { label: 'Last Message',      value: messages.length > 0 ? formatTime(messages[messages.length - 1]?.sentAt) || '—' : '—', color: 'rgba(255,255,255,0.6)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: i < 2 ? 24 : 14, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Info banner ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          <Mail size={14} color="#14B8A6" />
          {performersWithEmail.length === 0
            ? 'No performers with email addresses yet. Emails collect when performers submit.'
            : `${performersWithEmail.length} performer${performersWithEmail.length !== 1 ? 's' : ''} with email addresses ready to receive messages.`
          }
        </div>

        {/* ── Message history ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Message History
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 440, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
                No messages yet. Send your first announcement below.
              </div>
            ) : messages.map(msg => (
              <div key={msg.id} style={{
                background: 'rgba(20,184,166,0.06)',
                border: '1px solid rgba(20,184,166,0.15)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #14B8A6, #22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0B1020' }}>
                      {msg.senderName?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#14B8A6' }}>{msg.senderName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Recipient badge */}
                    {msg.recipientLabel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '2px 8px' }}>
                        {msg.type === 'broadcast' ? <Users size={9} /> : <User size={9} />}
                        {msg.recipientLabel}
                      </div>
                    )}
                    {/* Email status badge */}
                    {msg.emailStatus === 'sent' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22C55E' }}>
                        <CheckCheck size={11} /> Delivered
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                      <Clock size={10} /> {formatTime(msg.sentAt)}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Compose ── */}
        <div style={card}>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
              New Announcement
            </div>

            {/* ── Recipient selector ── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Send to</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: recipientMode === 'specific' ? 10 : 0 }}>
                {/* All button */}
                <button
                  onClick={() => { setRecipientMode('all'); setSelectedPerformer(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 9, border: '1px solid',
                    borderColor: recipientMode === 'all' ? '#14B8A6' : 'rgba(255,255,255,0.1)',
                    background: recipientMode === 'all' ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                    color: recipientMode === 'all' ? '#14B8A6' : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Users size={13} />
                  All performers
                  {performersWithEmail.length > 0 && (
                    <span style={{ background: recipientMode === 'all' ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>
                      {performersWithEmail.length}
                    </span>
                  )}
                </button>

                {/* Specific button */}
                <button
                  onClick={() => setRecipientMode('specific')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 9, border: '1px solid',
                    borderColor: recipientMode === 'specific' ? '#14B8A6' : 'rgba(255,255,255,0.1)',
                    background: recipientMode === 'specific' ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                    color: recipientMode === 'specific' ? '#14B8A6' : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s',
                  }}
                >
                  <User size={13} />
                  Specific person
                </button>
              </div>

              {/* Performer dropdown */}
              {recipientMode === 'specific' && (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 9, border: '1px solid',
                      borderColor: dropdownOpen ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)', color: selectedPerformer ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {selectedPerformer
                        ? <>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#14B8A6,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0B1020', flexShrink: 0 }}>
                              {(selectedPerformer.groupName || selectedPerformer.performerName)[0].toUpperCase()}
                            </div>
                            <span>
                              {selectedPerformer.groupName || selectedPerformer.performerName}
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>{selectedPerformer.email}</span>
                            </span>
                          </>
                        : 'Select a performer...'
                      }
                    </span>
                    <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                      background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                      maxHeight: 240, overflowY: 'auto',
                    }}>
                      {loadingPerformers ? (
                        <div style={{ padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
                        </div>
                      ) : performersWithEmail.length === 0 ? (
                        <div style={{ padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                          No performers with email addresses yet.
                        </div>
                      ) : performersWithEmail.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedPerformer(p); setDropdownOpen(false) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: selectedPerformer?.id === p.id ? 'rgba(20,184,166,0.08)' : 'transparent',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = selectedPerformer?.id === p.id ? 'rgba(20,184,166,0.08)' : 'transparent')}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#14B8A6,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0B1020', flexShrink: 0 }}>
                            {(p.groupName || p.performerName)[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.groupName || p.performerName}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                          </div>
                          {selectedPerformer?.id === p.id && <CheckCheck size={13} color="#14B8A6" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your announcement... (Enter to send, Shift+Enter for new line)"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'var(--font-body)',
                outline: 'none', resize: 'vertical', lineHeight: 1.6, marginBottom: 12,
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(20,184,166,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            {/* Email feedback */}
            {emailFeedback && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                padding: '10px 14px', borderRadius: 9, fontSize: 13,
                background: emailFeedback.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${emailFeedback.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}`,
                color: emailFeedback.type === 'success' ? '#22C55E' : '#F87171',
              }}>
                {emailFeedback.type === 'success' ? <CheckCheck size={14} /> : <AlertCircle size={14} />}
                {emailFeedback.msg}
              </div>
            )}

            {/* Send button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSend}
                disabled={sending || !text.trim() || (recipientMode === 'specific' && !selectedPerformer)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: (text.trim() && (recipientMode === 'all' || selectedPerformer))
                    ? '#14B8A6' : 'rgba(20,184,166,0.3)',
                  border: 'none',
                  color: (text.trim() && (recipientMode === 'all' || selectedPerformer))
                    ? '#0B1020' : 'rgba(11,16,32,0.5)',
                  padding: '10px 20px', borderRadius: 10,
                  cursor: (text.trim() && (recipientMode === 'all' || selectedPerformer)) ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}
              >
                {sending
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                  : <><Send size={14} /> {recipientMode === 'all' ? `Send to All (${performersWithEmail.length})` : 'Send to Performer'}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}