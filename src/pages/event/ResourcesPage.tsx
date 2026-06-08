import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import DashboardLayout from '../../components/DashboardLayout'
import {
  Package, Plus, Trash2, Check, X, Edit2, Loader2,
  Mic2, Monitor, Music2, DoorOpen, Clock, CheckCircle2
} from 'lucide-react'
import { useEvent } from '../../context/Eventcontext'

type ResourceType = 'microphone' | 'projector' | 'instrument' | 'room' | 'timeslot' | 'other'

interface Resource {
  id: string
  name: string
  type: ResourceType
  quantity: number
  assignedTo?: string
  assignedName?: string
  returned?: boolean
  notes?: string
  createdAt?: any
}

const TYPE_META: Record<ResourceType, { label: string; icon: React.ReactNode; color: string }> = {
  microphone: { label: 'Microphone',  icon: <Mic2 size={14} />,      color: '#22C55E' },
  projector:  { label: 'Projector',   icon: <Monitor size={14} />,   color: '#3B82F6' },
  instrument: { label: 'Instrument',  icon: <Music2 size={14} />,    color: '#F59E0B' },
  room:       { label: 'Room',        icon: <DoorOpen size={14} />,  color: '#8B5CF6' },
  timeslot:   { label: 'Time Slot',   icon: <Clock size={14} />,     color: '#14B8A6' },
  other:      { label: 'Other',       icon: <Package size={14} />,   color: '#A78BFA' },
}

const EMPTY_FORM = { name: '', type: 'microphone' as ResourceType, quantity: 1, notes: '' }

export default function ResourcesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [resources, setResources] = useState<Resource[]>([])
  const { eventType, enabledModules, loading: metaLoading } = useEvent()
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | ResourceType>('all')

  useEffect(() => {
    if (!eventId) return
    const unsub = onSnapshot(collection(db, 'events', eventId, 'resources'), snap => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)))
      setLoading(false)
    })
    return () => unsub()
  }, [eventId])

  const handleSave = async () => {
    if (!eventId || !form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'events', eventId, 'resources', editingId), { ...form })
      } else {
        await addDoc(collection(db, 'events', eventId, 'resources'), {
          ...form, returned: false, createdAt: serverTimestamp(),
        })
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!eventId) return
    await deleteDoc(doc(db, 'events', eventId, 'resources', id))
  }

  const toggleReturned = async (res: Resource) => {
    if (!eventId) return
    await updateDoc(doc(db, 'events', eventId, 'resources', res.id), { returned: !res.returned })
  }

  const startEdit = (res: Resource) => {
    setForm({ name: res.name, type: res.type, quantity: res.quantity, notes: res.notes || '' })
    setEditingId(res.id)
    setShowForm(true)
  }

  const filtered = filterType === 'all' ? resources : resources.filter(r => r.type === filterType)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, color: '#fff', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5,
  }
  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12,
  }

  const stats = {
    total:    resources.length,
    assigned: resources.filter(r => r.assignedTo).length,
    returned: resources.filter(r => r.returned).length,
  }

  return (
   <DashboardLayout
  plan="starter"
  eventType={eventType ?? 'custom'}
  eventId={eventId}
  enabledModules={enabledModules}
>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Package size={20} color="#8B5CF6" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.5px', color: '#fff' }}>
              Resources
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Manage equipment, rooms and time slots for this event
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#8B5CF6', border: 'none', color: '#fff',
            padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}
        >
          <Plus size={15} /> Add Resource
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Resources', value: stats.total,    color: '#fff'     },
          { label: 'Assigned',        value: stats.assigned, color: '#F59E0B' },
          { label: 'Returned',        value: stats.returned, color: '#22C55E' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 20 }}>
          <div style={{ ...sectionLabel }}>{editingId ? 'Edit Resource' : 'Add New Resource'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }} className="res-form-grid">
            <div>
              <label style={labelStyle}>Resource Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. SM58 Microphone" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ResourceType }))}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                {(Object.keys(TYPE_META) as ResourceType[]).map(t => (
                  <option key={t} value={t} style={{ background: '#0B1020' }}>{TYPE_META[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Assigned to main stage only" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#8B5CF6', border: 'none',
              color: '#fff', padding: '9px 18px', borderRadius: 9, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
              opacity: !form.name.trim() ? 0.5 : 1,
            }}>
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
              {editingId ? 'Save Changes' : 'Add Resource'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterTab label="All" active={filterType === 'all'} color="#fff" onClick={() => setFilterType('all')} count={resources.length} />
        {(Object.keys(TYPE_META) as ResourceType[]).map(t => (
          <FilterTab key={t} label={TYPE_META[t].label} active={filterType === t} color={TYPE_META[t].color}
            onClick={() => setFilterType(t)} count={resources.filter(r => r.type === t).length} />
        ))}
      </div>

      {/* Resource list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', padding: '32px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading resources...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <Package size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            {resources.length === 0 ? 'No resources added yet.' : 'No resources of this type.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(res => {
            const meta = TYPE_META[res.type] ?? TYPE_META.other
            return (
              <div key={res.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: res.returned ? 'rgba(34,197,94,0.04)' : 'rgba(19,26,46,0.7)',
                border: `1px solid ${res.returned ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, padding: '14px 18px', transition: 'all 0.15s',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: res.returned ? 'rgba(255,255,255,0.4)' : '#fff', textDecoration: res.returned ? 'line-through' : 'none', marginBottom: 2 }}>
                    {res.name}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: meta.color, background: `${meta.color}15`, padding: '2px 7px', borderRadius: 4 }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Qty: {res.quantity}</span>
                    {res.assignedName && <span style={{ fontSize: 11, color: '#F59E0B' }}>→ {res.assignedName}</span>}
                    {res.notes && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{res.notes}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => toggleReturned(res)} title={res.returned ? 'Mark as not returned' : 'Mark as returned'}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                      borderColor: res.returned ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
                      background: res.returned ? 'rgba(34,197,94,0.1)' : 'transparent',
                      color: res.returned ? '#22C55E' : 'rgba(255,255,255,0.4)',
                    }}>
                    <CheckCircle2 size={12} /> {res.returned ? 'Returned' : 'Return'}
                  </button>
                  <button onClick={() => startEdit(res)}
                    style={{ padding: '6px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(res.id)}
                    style={{ padding: '6px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.05)', color: '#F87171', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) { .res-form-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}

function FilterTab({ label, active, color, onClick, count }: { label: string; active: boolean; color: string; onClick: () => void; count: number }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, border: '1px solid',
      cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
      borderColor: active ? `${color}40` : 'rgba(255,255,255,0.08)',
      background: active ? `${color}10` : 'transparent',
      color: active ? color : 'rgba(255,255,255,0.4)',
    }}>
      {label}
      {count > 0 && <span style={{ fontSize: 10, background: active ? `${color}20` : 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>{count}</span>}
    </button>
  )
}