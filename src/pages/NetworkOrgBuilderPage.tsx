import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import DashboardLayout from '../components/DashboardLayout'
import { useEvent } from '../context/Eventcontext'
import { GitBranch } from 'lucide-react'
import NetworkLevelEditor from '../components/network/NetworkLevelEditor'
import NetworkOrgTree from '../components/network/NetworkOrgTree'

const SUB2 = 'rgba(255,255,255,0.45)'

export default function NetworkOrgBuilderPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { enabledModules } = useEvent()

  const [levels, setLevels] = useState<any[]>([])
  const [nodes, setNodes]   = useState<any[]>([])

  useEffect(() => {
    if (!eventId) return
    const unsubL = onSnapshot(collection(db, 'events', eventId, 'orgLevels'), snap => {
      setLevels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubN = onSnapshot(collection(db, 'events', eventId, 'orgNodes'), snap => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsubL(); unsubN() }
  }, [eventId])

  return (
    <DashboardLayout eventType="network" eventId={eventId} enabledModules={enabledModules}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 12, padding: '8px 9px', display: 'flex' }}>
            <GitBranch size={20} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.2rem,4vw,1.8rem)', letterSpacing: '-0.5px', color: '#fff', margin: 0 }}>
              Organisation Builder
            </h1>
            <p style={{ fontSize: 12, color: SUB2, margin: 0, marginTop: 2 }}>
              Define your hierarchy levels, then populate each with its units
            </p>
          </div>
        </div>
      </div>

      <div className="org-builder-grid" style={{ display: 'grid', gap: 16 }}>
        <NetworkLevelEditor eventId={eventId || ''} levels={levels} />
        <NetworkOrgTree eventId={eventId || ''} levels={levels} nodes={nodes} />
      </div>

      <style>{`
        .org-builder-grid { grid-template-columns: 360px 1fr; }
        @media (max-width: 860px) { .org-builder-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}