import { useState } from 'react'
import {
  collection, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Plus, Trash2, X, Check, ChevronRight } from 'lucide-react'

interface OrgLevel {
  id: string
  name: string
  order: number
  color: string
}

interface OrgNode {
  id: string
  name: string
  levelId: string
  parentId?: string
}

interface Props {
  eventId: string
  levels: OrgLevel[]
  nodes: OrgNode[]
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18, overflow: 'hidden',
}

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#fff', fontSize: 13,
  padding: '8px 12px', outline: 'none',
  fontFamily: 'var(--font-body)', boxSizing: 'border-box',
}

export default function NetworkOrgTree({ eventId, levels, nodes }: Props) {
  const [activeLevel, setActiveLevel] = useState<string | null>(levels[0]?.id || null)
  const [adding, setAdding]           = useState<string | null>(null) // levelId being added to
  const [newNodeName, setNewNodeName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const sorted = [...levels].sort((a, b) => a.order - b.order)
  const currentLevel = sorted.find(l => l.id === activeLevel)
  const levelNodes = nodes.filter(n => n.levelId === activeLevel)

  const handleAddNode = async (levelId: string) => {
    if (!newNodeName.trim()) return
    await addDoc(collection(db, 'events', eventId, 'orgNodes'), {
      name: newNodeName.trim(),
      levelId,
      createdAt: serverTimestamp(),
    })
    setNewNodeName(''); setAdding(null)
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'events', eventId, 'orgNodes', id))
    setDeleteConfirm(null)
  }

  if (sorted.length === 0) {
    return (
      <div style={{ ...glass, padding: '30px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Define your hierarchy levels first, then populate nodes here
        </p>
      </div>
    )
  }

  return (
    <div style={glass}>
      {/* Level tabs */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {sorted.map(level => {
          const active = level.id === activeLevel
          const count  = nodes.filter(n => n.levelId === level.id).length
          return (
            <button key={level.id} onClick={() => setActiveLevel(level.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: active ? `${level.color}18` : 'rgba(255,255,255,0.04)',
              color: active ? level.color : 'rgba(255,255,255,0.45)',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              outline: active ? `1px solid ${level.color}35` : 'none',
            }}>
              {level.name}
              <span style={{
                fontSize: 10, fontWeight: 800,
                background: active ? `${level.color}25` : 'rgba(255,255,255,0.08)',
                color: active ? level.color : 'rgba(255,255,255,0.35)',
                padding: '1px 6px', borderRadius: 5,
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Node list */}
      <div style={{ minHeight: 120 }}>
        {levelNodes.length === 0 && adding !== activeLevel && (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>
              No {currentLevel?.name || 'nodes'} added yet
            </p>
            <button
              onClick={() => setAdding(activeLevel)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: `${currentLevel?.color}14`, border: `1px solid ${currentLevel?.color}30`,
                color: currentLevel?.color, padding: '7px 14px', borderRadius: 9,
                cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
              }}
            >
              <Plus size={12} /> Add {currentLevel?.name}
            </button>
          </div>
        )}

        {levelNodes.map((node, i) => (
          <div key={node.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
            borderBottom: i < levelNodes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronRight size={12} color={currentLevel?.color || '#818CF8'} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#fff' }}>{node.name}</span>
            {deleteConfirm === node.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#F87171' }}>Remove?</span>
                <button onClick={() => handleDelete(node.id)} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Yes</button>
                <button onClick={() => setDeleteConfirm(null)} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>No</button>
              </div>
            ) : (
              <button onClick={() => setDeleteConfirm(node.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#F87171', opacity: 0.5, display: 'flex', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
              ><Trash2 size={13} /></button>
            )}
          </div>
        ))}

        {/* Inline add row */}
        {adding === activeLevel && (
          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: levelNodes.length > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <input
              value={newNodeName}
              onChange={e => setNewNodeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNode(activeLevel!); if (e.key === 'Escape') setAdding(null) }}
              placeholder={`${currentLevel?.name || 'Node'} name`}
              autoFocus
              style={{ ...inp, flex: 1 }}
              onFocus={e => e.currentTarget.style.borderColor = `${currentLevel?.color || '#818CF8'}60`}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
            <button onClick={() => handleAddNode(activeLevel!)} disabled={!newNodeName.trim()} style={{ background: newNodeName.trim() ? currentLevel?.color || '#6366F1' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 9, padding: '8px 13px', cursor: newNodeName.trim() ? 'pointer' : 'not-allowed', color: newNodeName.trim() ? '#fff' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
              <Check size={12} /> Add
            </button>
            <button onClick={() => setAdding(null)} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 9, padding: '8px 11px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Footer add button */}
      {levelNodes.length > 0 && adding !== activeLevel && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setAdding(activeLevel)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
              fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = currentLevel?.color || '#818CF8'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            <Plus size={13} /> Add {currentLevel?.name}
          </button>
        </div>
      )}
    </div>
  )
}