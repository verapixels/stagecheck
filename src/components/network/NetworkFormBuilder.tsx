import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  ClipboardList, Check, ToggleLeft, ToggleRight, Save, Info,
  Plus, Trash2, GripVertical, Type, Hash, AtSign, Phone, ChevronDown,
} from 'lucide-react'

interface OrgLevel {
  id: string
  name: string
  order: number
  color: string
}

export interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel'
  required: boolean
}

interface Props {
  eventId: string
  levels: OrgLevel[]
  existingConfig: any
  onSaved: (config: any) => void
}

const glass: React.CSSProperties = {
  background: 'rgba(12,17,35,0.85)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  overflow: 'hidden',
}

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 13,
  padding: '9px 12px',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  width: '100%',
  boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  marginBottom: 7,
  display: 'block',
}

const FIELD_TYPES: { value: CustomField['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'text',   label: 'Text',   icon: <Type size={12} /> },
  { value: 'number', label: 'Number', icon: <Hash size={12} /> },
  { value: 'email',  label: 'Email',  icon: <AtSign size={12} /> },
  { value: 'tel',    label: 'Phone',  icon: <Phone size={12} /> },
]

function Toggle({
  label, sub, value, onChange,
}: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: value ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${value ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, padding: '12px 16px', cursor: 'pointer', gap: 12, transition: 'all 0.15s',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {value
          ? <ToggleRight size={26} color="#818CF8" />
          : <ToggleLeft  size={26} color="rgba(255,255,255,0.2)" />}
      </div>
    </div>
  )
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function NetworkFormBuilder({ eventId, levels, existingConfig, onSaved }: Props) {
  const sorted = [...levels].sort((a, b) => a.order - b.order)

  const [requirePhone,    setRequirePhone]    = useState(existingConfig?.requirePhone    ?? false)
  const [requirePhoto,    setRequirePhoto]    = useState(existingConfig?.requirePhoto    ?? false)
  const [maxPerPerson,    setMaxPerPerson]    = useState(existingConfig?.maxPerPerson    ?? '')
  const [formTitle,       setFormTitle]       = useState(existingConfig?.formTitle       ?? '')
  const [formDescription, setFormDescription] = useState(existingConfig?.formDescription ?? '')
  const [levelDepth,      setLevelDepth]      = useState<number>(existingConfig?.levelDepth ?? sorted.length)
  const [customFields,    setCustomFields]    = useState<CustomField[]>(existingConfig?.customFields ?? [])
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // ── new field draft state ──
  const [addingField, setAddingField] = useState(false)
  const [draftLabel,  setDraftLabel]  = useState('')
  const [draftType,   setDraftType]   = useState<CustomField['type']>('text')
  const [draftReq,    setDraftReq]    = useState(false)

  const commitField = () => {
    if (!draftLabel.trim()) return
    const field: CustomField = {
      id: uid(),
      label: draftLabel.trim(),
      type: draftType,
      required: draftReq,
    }
    setCustomFields(prev => [...prev, field])
    setDraftLabel(''); setDraftType('text'); setDraftReq(false); setAddingField(false)
  }

  const removeField = (id: string) => setCustomFields(prev => prev.filter(f => f.id !== id))

  const toggleFieldRequired = (id: string) =>
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, required: !f.required } : f))

  const handleSave = async () => {
    setSaving(true)
    const config = {
      requirePhone,
      requirePhoto,
      maxPerPerson: maxPerPerson === '' ? null : Number(maxPerPerson),
      formTitle: formTitle.trim(),
      formDescription: formDescription.trim(),
      levelDepth,
      customFields,
      updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'events', eventId, 'config', 'networkForm'), config, { merge: true })
    setSaving(false); setSaved(true)
    onSaved(config)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Form identity ── */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={14} color="#818CF8" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Form Settings</span>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Form Title</label>
            <input
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g. 2025 Convention Registration"
              style={inp}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'}
            />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Shown at the top of the public form"
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 } as React.CSSProperties}
              onFocus={e => (e.currentTarget as any).style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => (e.currentTarget as any).style.borderColor = 'rgba(255,255,255,0.11)'}
            />
          </div>
          <div>
            <label style={lbl}>Max registrations per person</label>
            <input
              type="number" min={1}
              value={maxPerPerson}
              onChange={e => setMaxPerPerson(e.target.value)}
              placeholder="No limit"
              style={inp}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'}
            />
          </div>
        </div>
      </div>

      {/* ── Custom Fields ── */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Type size={14} color="#34D399" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Custom Fields</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>attendees fill these in</span>
          </div>
          {!addingField && (
            <button
              onClick={() => setAddingField(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                color: '#34D399', padding: '7px 13px', borderRadius: 9,
                cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
              }}
            >
              <Plus size={13} /> Add Field
            </button>
          )}
        </div>

        <div style={{ padding: customFields.length > 0 || addingField ? '8px 0' : '0' }}>

          {/* Existing fields */}
          {customFields.map((field, i) => (
            <div
              key={field.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 20px',
                borderBottom: i < customFields.length - 1 || addingField ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <GripVertical size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, cursor: 'grab' }} />

              {/* type badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
                color: '#34D399', fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>
                {FIELD_TYPES.find(t => t.value === field.type)?.icon}
                {field.type.toUpperCase()}
              </div>

              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {field.label}
              </span>

              {/* required toggle */}
              <button
                onClick={() => toggleFieldRequired(field.id)}
                style={{
                  padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: field.required ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
                  color: field.required ? '#F87171' : 'rgba(255,255,255,0.35)',
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                }}
              >
                {field.required ? 'Required' : 'Optional'}
              </button>

              <button
                onClick={() => removeField(field.id)}
                style={{
                  background: 'rgba(248,113,113,0.05)', border: 'none', borderRadius: 7,
                  padding: '6px 9px', cursor: 'pointer', color: '#F87171', display: 'flex',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {customFields.length === 0 && !addingField && (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                No custom fields yet — add fields attendees fill in when registering
              </p>
            </div>
          )}

          {/* New field draft */}
          {addingField && (
            <div style={{
              padding: '14px 20px',
              borderTop: customFields.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 12,
              background: 'rgba(52,211,153,0.03)',
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Label */}
                <div style={{ flex: 1 }}>
                  <label style={{ ...lbl, color: 'rgba(255,255,255,0.5)' }}>Field Label</label>
                  <input
                    autoFocus
                    value={draftLabel}
                    onChange={e => setDraftLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitField(); if (e.key === 'Escape') setAddingField(false) }}
                    placeholder="e.g. Zone Name"
                    style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.45)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'}
                  />
                </div>

                {/* Type */}
                <div style={{ width: 120 }}>
                  <label style={{ ...lbl, color: 'rgba(255,255,255,0.5)' }}>Type</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={draftType}
                      onChange={e => setDraftType(e.target.value as CustomField['type'])}
                      style={{ ...inp, cursor: 'pointer', paddingRight: 28, appearance: 'none', WebkitAppearance: 'none' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.45)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'}
                    >
                      {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Required toggle + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  onClick={() => setDraftReq(r => !r)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    padding: '6px 12px', borderRadius: 8,
                    background: draftReq ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${draftReq ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {draftReq
                    ? <ToggleRight size={18} color="#F87171" />
                    : <ToggleLeft  size={18} color="rgba(255,255,255,0.25)" />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: draftReq ? '#F87171' : 'rgba(255,255,255,0.45)' }}>
                    Required
                  </span>
                </div>

                <div style={{ flex: 1 }} />

                <button
                  onClick={() => { setAddingField(false); setDraftLabel(''); setDraftType('text'); setDraftReq(false) }}
                  style={{
                    padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.09)',
                    background: 'transparent', color: 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={commitField}
                  disabled={!draftLabel.trim()}
                  style={{
                    padding: '8px 16px', borderRadius: 9, border: 'none', cursor: draftLabel.trim() ? 'pointer' : 'not-allowed',
                    background: draftLabel.trim() ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                    color: draftLabel.trim() ? '#34D399' : 'rgba(255,255,255,0.25)',
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
                  }}
                >
                  <Check size={13} /> Add Field
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Org level dropdowns (optional) ── */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Hierarchy Dropdowns</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>Optional</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>pre-defined levels attendees pick from</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10 }}>
              <Info size={13} color="#818CF8" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Build your org hierarchy first (Org Builder page), then configure which levels appear here.
                This section is optional — you can skip it and use custom fields above instead.
              </p>
            </div>
          ) : (
            sorted.map((level, i) => {
              const included = i < levelDepth
              return (
                <div
                  key={level.id}
                  onClick={() => setLevelDepth(included ? i : i + 1)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                    background: included ? `${level.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${included ? `${level.color}30` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    background: included ? level.color : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${included ? level.color : 'rgba(255,255,255,0.12)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {included && <Check size={10} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: included ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    {level.name}
                  </span>
                  <span style={{ fontSize: 11, color: included ? level.color : 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
                    Level {i + 1}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Standard extra fields ── */}
      <div style={glass}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Standard Extras</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Toggle
            label="Require phone number"
            sub="Registrants must provide a contact phone"
            value={requirePhone}
            onChange={setRequirePhone}
          />
          <Toggle
            label="Require passport photo"
            sub="Registrants upload a photo for their badge"
            value={requirePhoto}
            onChange={setRequirePhoto}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 0', borderRadius: 14, border: 'none', cursor: saving ? 'wait' : 'pointer',
          background: saved ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
          color: saved ? '#22C55E' : '#fff',
          fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
          boxShadow: saved ? 'none' : '0 6px 20px rgba(99,102,241,0.3)',
          transition: 'all 0.2s',
        }}
      >
        {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Form Config</>}
      </button>
    </div>
  )
}