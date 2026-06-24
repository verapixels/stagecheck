import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEventMeta } from '../lib/useEventMeta'
import DashboardLayout from '../components/DashboardLayout'
import { ScanLine, Search, CheckCircle2, XCircle, Users } from 'lucide-react'

interface Registrant {
  id: string
  name: string
  email: string
  phone?: string
  orgNode?: string
  checkedIn: boolean
  ticketCode?: string
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
  overflow: 'hidden',
}
const SUB2 = 'rgba(255,255,255,0.4)'

export default function NetworkCheckinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { eventType, enabledModules, loading } = useEventMeta(eventId)
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [search, setSearch] = useState('')
  const [checking, setChecking] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'networkRegistrations'), snap => {
      setRegistrants(snap.docs.map(d => ({ id: d.id, ...d.data() } as Registrant)))
    })
    return unsub
  }, [eventId])

  const filtered = registrants.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.ticketCode?.toLowerCase().includes(search.toLowerCase())
  )

  const checkedInCount = registrants.filter(r => r.checkedIn).length

  const toggleCheckin = async (r: Registrant) => {
    if (!eventId) return
    setChecking(r.id)
    await updateDoc(doc(db, 'events', eventId, 'networkRegistrations', r.id), {
      checkedIn: !r.checkedIn,
    })
    setChecking(null)
  }

  return (
    <DashboardLayout eventType={eventType ?? 'network'} eventId={eventId} enabledModules={enabledModules} metaLoading={loading}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ScanLine size={20} color="#6366F1" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Check-in Center
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
            Search and check in registrants for this network event.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Registered', value: registrants.length, color: '#6366F1' },
            { label: 'Checked In',       value: checkedInCount,      color: '#22C55E' },
            { label: 'Remaining',        value: registrants.length - checkedInCount, color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(12,17,35,0.8)', border: `1px solid ${s.color}22`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: SUB2, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: SUB2 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or ticket code..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12, color: '#fff', fontSize: 13, padding: '11px 14px 11px 38px',
              outline: 'none', fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* List */}
        <div style={glass}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Users size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 13, color: SUB2 }}>
                {search ? 'No results found' : 'No registrants yet'}
              </p>
            </div>
          ) : (
            filtered.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: r.checkedIn ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: r.checkedIn ? '#22C55E' : '#818CF8',
                }}>
                  {r.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: SUB2 }}>{r.email}{r.orgNode ? ` · ${r.orgNode}` : ''}</div>
                </div>
                {r.ticketCode && (
                  <span style={{ fontSize: 11, color: '#818CF8', background: 'rgba(129,140,248,0.1)', padding: '3px 9px', borderRadius: 6, fontWeight: 600 }}>
                    {r.ticketCode}
                  </span>
                )}
                <button
                  onClick={() => toggleCheckin(r)}
                  disabled={checking === r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                    background: r.checkedIn ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)',
                    color: r.checkedIn ? '#F87171' : '#22C55E',
                    transition: 'all 0.15s',
                    opacity: checking === r.id ? 0.5 : 1,
                  }}
                >
                  {r.checkedIn
                    ? <><XCircle size={13} /> Undo</>
                    : <><CheckCircle2 size={13} /> Check In</>
                  }
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}