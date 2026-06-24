import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import DashboardLayout from '../components/DashboardLayout'
import { useEvent } from '../context/Eventcontext'
import { Users, UserCheck, Clock } from 'lucide-react'
import NetworkRegistrationTable from '../components/network/NetworkRegistrationTable'

export default function NetworkRegistrationsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { enabledModules } = useEvent()

  const [registrations, setRegistrations] = useState<any[]>([])
  const [levels,        setLevels]        = useState<any[]>([])
  const [nodes,         setNodes]         = useState<any[]>([])
  const [config,        setConfig]        = useState<any>(null)

  useEffect(() => {
    if (!eventId) return

    // real-time listeners for registrations, levels, nodes
    const unsubR = onSnapshot(collection(db, 'events', eventId, 'networkRegistrations'), snap => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubL = onSnapshot(collection(db, 'events', eventId, 'orgLevels'), snap => {
      setLevels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubN = onSnapshot(collection(db, 'events', eventId, 'orgNodes'), snap => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // one-time fetch for form config (single doc — getDoc, not onSnapshot)
    getDoc(doc(db, 'events', eventId, 'config', 'networkForm')).then(snap => {
      if (snap.exists()) setConfig(snap.data())
    })

    return () => { unsubR(); unsubL(); unsubN() }
  }, [eventId])

  const checkedIn = registrations.filter(r => r.checkedIn).length
  const pending   = registrations.length - checkedIn

  const statCards = [
    {
      label: 'Total Registrations',
      value: registrations.length,
      icon: <Users size={22} color="#0dc75e" />,
      iconBg: 'rgba(13,199,94,0.12)',
      accent: '#0dc75e',
      sub: checkedIn > 0 && registrations.length > 0
        ? `↑ ${((checkedIn / registrations.length) * 100).toFixed(1)}% checked in`
        : 'No check-ins yet',
    },
    {
      label: 'Checked In',
      value: checkedIn,
      icon: <UserCheck size={22} color="#818CF8" />,
      iconBg: 'rgba(129,140,248,0.12)',
      accent: '#818CF8',
      sub: registrations.length > 0
        ? `${((checkedIn / registrations.length) * 100).toFixed(1)}% of total`
        : '0% of total',
    },
    {
      label: 'Pending Check-in',
      value: pending,
      icon: <Clock size={22} color="#F59E0B" />,
      iconBg: 'rgba(245,158,11,0.12)',
      accent: '#F59E0B',
      sub: registrations.length > 0
        ? `${((pending / registrations.length) * 100).toFixed(1)}% remaining`
        : '0% remaining',
    },
  ]

  return (
    <DashboardLayout eventType="network" eventId={eventId} enabledModules={enabledModules}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(13,199,94,0.12)', borderRadius: 12, padding: '8px 9px', display: 'flex' }}>
            <Users size={20} color="#0dc75e" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(1.2rem,4vw,1.8rem)', letterSpacing: '-0.5px',
              color: '#fff', margin: 0,
            }}>
              Registrations
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: 2 }}>
              Manage all registrations for your event
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: 'rgba(6,14,28,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: card.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: 28, fontWeight: 800, color: '#fff',
                lineHeight: 1, fontFamily: 'var(--font-display)', marginBottom: 4,
              }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: card.accent, fontWeight: 600 }}>
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <NetworkRegistrationTable
        eventId={eventId || ''}
        registrations={registrations}
        levels={levels}
        nodes={nodes}
        config={config}
      />

    </DashboardLayout>
  )
}