import { useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Plus, Trash2, GripVertical, Check, X, Edit2, GitBranch } from 'lucide-react'

interface OrgLevel {
  id: string
  name: string
  order: number
  color: string
}

interface Props {
  eventId: string
  levels: OrgLevel[]
}

const LEVEL_COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF']

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18, overflow: 'hidden',
}

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  padding: '10px 13px', outline: 'none',
  fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
}

export default function NetworkLevelEditor({ eventId, levels }: Props) {
  const [adding, setAdding]   = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving]   = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const sorted = [...levels].sort((a, b) => a.order - b.order)

  const handleAdd = async () => {
    if (!newName.trim() || !eventId) return
    setSaving(true)
    await addDoc(collection(db, 'events', eventId, 'orgLevels'), {
      name: newName.trim(),
      order: levels.length,
      color: LEVEL_COLORS[levels.length % LEVEL_COLORS.length],
      createdAt: serverTimestamp(),
    })
    setNewName(''); setAdding(false); setSaving(false)
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    await updateDoc(doc(db, 'events', eventId, 'orgLevels', id), { name: editName.trim() })
    setEditId(null); setEditName('')
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'events', eventId, 'orgLevels', id))
    setDeleteConfirm(null)
  }

  return (
    <div style={glass}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={14} color="#6366F1" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Hierarchy Levels</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>e.g. Zone → Area → Parish</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            color: '#818CF8', padding: '7px 13px', borderRadius: 9,
            cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}
        >
          <Plus size={13} /> Add Level
        </button>
      </div>

      {sorted.length === 0 && !adding && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <GitBranch size={32} color="rgba(99,102,241,0.25)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>
            No levels defined yet
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            Define your hierarchy — e.g. Church, Zone, Area, Parish
          </p>
        </div>
      )}

      <div style={{ padding: sorted.length > 0 || adding ? '8px 0' : 0 }}>
        {sorted.map((level, i) => (
          <div key={level.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <GripVertical size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, cursor: 'grab' }} />
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: level.color, flexShrink: 0,
              boxShadow: `0 0 6px ${level.color}50`,
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
              minWidth: 20, textAlign: 'right', flexShrink: 0,
            }}>
              L{i + 1}
            </span>

            {editId === level.id ? (
              <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEdit(level.id)}
                  autoFocus
                  style={{ ...inp, flex: 1, padding: '7px 11px', fontSize: 13 }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
                <button onClick={() => handleEdit(level.id)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#818CF8', display: 'flex' }}>
                  <Check size={13} />
                </button>
                <button onClick={() => setEditId(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#fff' }}>{level.name}</span>
                {deleteConfirm === level.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#F87171' }}>Delete?</span>
                    <button onClick={() => handleDelete(level.id)} style={{ padding: '5px 11px', borderRadius: 7, border: 'none', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>No</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditId(level.id); setEditName(level.name) }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    ><Edit2 size={12} /></button>
                    <button onClick={() => setDeleteConfirm(level.id)} style={{ background: 'rgba(248,113,113,0.04)', border: 'none', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', color: '#F87171', display: 'flex', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.04)'}
                    ><Trash2 size={12} /></button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {adding && (
          <div style={{ display: 'flex', gap: 8, padding: '11px 20px', borderTop: sorted.length > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Level name (e.g. Zone)"
              autoFocus
              style={{ ...inp, flex: 1, padding: '9px 12px', fontSize: 13 }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
            <button onClick={handleAdd} disabled={saving || !newName.trim()} style={{ background: newName.trim() ? '#6366F1' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: '9px 14px', cursor: newName.trim() ? 'pointer' : 'not-allowed', color: newName.trim() ? '#fff' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
              <Check size={13} /> Add
            </button>
            <button onClick={() => setAdding(false)} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', transition: 'all 0.15s' }}>
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}