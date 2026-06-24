import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import DashboardLayout from '../components/DashboardLayout'
import { useEvent } from '../context/Eventcontext'
import { ClipboardList } from 'lucide-react'
import NetworkFormBuilder from '../components/network/NetworkFormBuilder'
import NetworkFormPreview from '../components/network/NetworkFormPreview'

const SUB2 = 'rgba(255,255,255,0.45)'

export default function NetworkRegistrationFormPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { enabledModules } = useEvent()

  const [levels, setLevels]         = useState<any[]>([])
  const [formConfig, setFormConfig] = useState<any>(null)

  useEffect(() => {
    if (!eventId) return
    const unsubL = onSnapshot(collection(db, 'events', eventId, 'orgLevels'), snap => {
      setLevels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    getDoc(doc(db, 'events', eventId, 'config', 'networkForm')).then(s => {
      if (s.exists()) setFormConfig(s.data())
    })
    return () => unsubL()
  }, [eventId])

  return (
    <DashboardLayout eventType="network" eventId={eventId} enabledModules={enabledModules}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ background: 'rgba(129,140,248,0.12)', borderRadius: 12, padding: '8px 9px', display: 'flex' }}>
            <ClipboardList size={20} color="#818CF8" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.2rem,4vw,1.8rem)', letterSpacing: '-0.5px', color: '#fff', margin: 0 }}>
              Registration Form
            </h1>
            <p style={{ fontSize: 12, color: SUB2, margin: 0, marginTop: 2 }}>
              Configure your public registration form and share the link
            </p>
          </div>
        </div>
      </div>

      <div className="reg-form-grid" style={{ display: 'grid', gap: 20 }}>
        <NetworkFormBuilder
          eventId={eventId || ''}
          levels={levels}
          existingConfig={formConfig}
          onSaved={setFormConfig}
        />
        <NetworkFormPreview
          eventId={eventId || ''}
          levels={levels}
          config={formConfig}
        />
      </div>

      <style>{`
        .reg-form-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 880px) { .reg-form-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}