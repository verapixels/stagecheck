import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, serverTimestamp, orderBy, query
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/Authcontext'
import DashboardLayout from '../../components/DashboardLayout'
import { MessageSquare, Send, Users, Loader2, Clock } from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

interface Message {
  id: string
  text: string
  sentBy: string
  senderName: string
  sentAt?: any
  type: 'broadcast' | 'system'
}

export default function MessagesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const { user }    = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!eventId) return
    const q = query(collection(db, 'events', eventId, 'messages'), orderBy('sentAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!eventId || !text.trim() || !user) return
    setSending(true)
    try {
      await addDoc(collection(db, 'events', eventId, 'messages'), {
        text: text.trim(),
        sentBy: user.uid,
        senderName: user.displayName || user.email || 'Organiser',
        sentAt: serverTimestamp(),
        type: 'broadcast',
      })
      setText('')
    } finally {
      setSending(false)
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

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
  }

  return (
    <DashboardLayout
  plan="starter"
  eventType={eventType ?? 'custom'}
  eventId={eventId}
  enabledModules={enabledModules}
>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <MessageSquare size={20} color="#14B8A6" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Messages
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Broadcast announcements to all performers
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#14B8A6', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', padding: '6px 14px', borderRadius: 8 }}>
          <Users size={12} /> Broadcast channel
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Messages Sent', value: messages.length, color: '#14B8A6' },
          { label: 'Last Message',  value: messages.length > 0 ? formatTime(messages[messages.length - 1]?.sentAt) || '—' : '—', color: 'rgba(255,255,255,0.6)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: i === 0 ? 24 : 16, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Info banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          <MessageSquare size={14} color="#14B8A6" />
          Messages are stored and visible to performers. Email delivery coming soon.
        </div>

        {/* Messages list */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
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
                background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #14B8A6, #22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0B1020' }}>
                      {msg.senderName?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#14B8A6' }}>{msg.senderName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                    <Clock size={10} /> {formatTime(msg.sentAt)}
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

        {/* Compose */}
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
              New Announcement
            </div>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: text.trim() ? '#14B8A6' : 'rgba(20,184,166,0.3)',
                  border: 'none', color: text.trim() ? '#0B1020' : 'rgba(11,16,32,0.5)',
                  padding: '10px 20px', borderRadius: 10, cursor: text.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}
              >
                {sending
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                  : <><Send size={14} /> Send Announcement</>
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