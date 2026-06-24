import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  doc, getDoc, collection, onSnapshot,
  addDoc, serverTimestamp, getDocs, query, orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Loader2, Check, ChevronDown } from 'lucide-react'
import type { CustomField } from '../components/network/NetworkFormBuilder'

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  padding: '11px 14px',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  width: '100%',
  boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.65)',
  marginBottom: 7,
  display: 'block',
}

export default function PublicNetworkRegPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event,    setEvent]    = useState<any>(null)
  const [levels,   setLevels]   = useState<any[]>([])
  const [nodes,    setNodes]    = useState<any[]>([])
  const [config,   setConfig]   = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState<Record<string, string>>({})
  const [submitting, setSub]    = useState(false)
  const [done,     setDone]     = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})

  useEffect(() => {
    if (!eventId) return
    Promise.all([
      getDoc(doc(db, 'events', eventId)),
      getDoc(doc(db, 'events', eventId, 'config', 'networkForm')),
      getDocs(query(collection(db, 'events', eventId, 'orgLevels'), orderBy('order'))),
      getDocs(collection(db, 'events', eventId, 'orgNodes')),
    ]).then(([evSnap, cfgSnap, lvlSnap, nodeSnap]) => {
      if (evSnap.exists()) setEvent(evSnap.data())
      if (cfgSnap.exists()) setConfig(cfgSnap.data())
      setLevels(lvlSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setNodes(nodeSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [eventId])

  // Custom fields from config
  const customFields: CustomField[] = config?.customFields ?? []

  // How many hierarchy levels to show
  const shownLevels = levels.slice(0, config?.levelDepth ?? levels.length)

  // Get nodes for a given level, optionally filtered by parent selection
  const nodesForLevel = (levelId: string, levelIndex: number): any[] => {
    if (levelIndex === 0) {
      return nodes.filter(n => n.levelId === levelId)
    }
    const parentLevel = shownLevels[levelIndex - 1]
    const parentNodeId = form[`level_${parentLevel.id}`]
    if (!parentNodeId) return []
    return nodes.filter(n => n.levelId === levelId && n.parentId === parentNodeId)
  }

  // Validate all required fields
  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!form['name']?.trim())  errs['name']  = 'Full name is required.'
    if (!form['email']?.trim()) errs['email'] = 'Email address is required.'
    if (!/^\S+@\S+\.\S+$/.test(form['email'] ?? '')) errs['email'] = 'Enter a valid email address.'

    if (config?.requirePhone && !form['phone']?.trim()) errs['phone'] = 'Phone number is required.'

    customFields.forEach(f => {
      if (f.required && !form[`custom_${f.id}`]?.trim()) {
        errs[`custom_${f.id}`] = `${f.label} is required.`
      }
      if (f.type === 'email' && form[`custom_${f.id}`] && !/^\S+@\S+\.\S+$/.test(form[`custom_${f.id}`])) {
        errs[`custom_${f.id}`] = 'Enter a valid email address.'
      }
      if (f.type === 'number' && form[`custom_${f.id}`] && isNaN(Number(form[`custom_${f.id}`]))) {
        errs[`custom_${f.id}`] = 'Enter a valid number.'
      }
    })

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!eventId) return
    if (!validate()) return

    setSub(true)
    try {
      // Build orgPath from selected hierarchy nodes
      const orgPathParts: string[] = []
      shownLevels.forEach(level => {
        const nodeId = form[`level_${level.id}`]
        if (nodeId) {
          const node = nodes.find(n => n.id === nodeId)
          if (node) orgPathParts.push(node.name)
        }
      })

      // Build custom field values map for easy querying
      const customValues: Record<string, string> = {}
      customFields.forEach(f => {
        if (form[`custom_${f.id}`]) {
          customValues[`cf_${f.id}`] = form[`custom_${f.id}`]
          customValues[`cflabel_${f.id}`] = f.label
        }
      })

      await addDoc(collection(db, 'events', eventId, 'networkRegistrations'), {
        fullName: form['name'].trim(),
        email: form['email'].trim(),
        phone: form['phone']?.trim() || null,
        orgPath: orgPathParts.join(' › '),
        checkedIn: false,
        customFields: customFields.map(f => ({
          id: f.id,
          label: f.label,
          type: f.type,
          value: form[`custom_${f.id}`]?.trim() || '',
        })),
        ...customValues,
        // also store level node IDs for filtering
        ...shownLevels.reduce((acc, level) => {
          if (form[`level_${level.id}`]) {
            const node = nodes.find(n => n.id === form[`level_${level.id}`])
            acc[`level_${level.id}`] = node?.name ?? form[`level_${level.id}`]
            acc[`levelId_${level.id}`] = form[`level_${level.id}`]
          }
          return acc
        }, {} as Record<string, string>),
        submittedAt: serverTimestamp(),
      })
      setDone(true)
    } catch (e) {
      setErrors({ _global: 'Something went wrong. Please try again.' })
    }
    setSub(false)
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Not found ──
  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Registration not found.</p>
    </div>
  )

  // ── Success ──
  if (done) return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={30} color="#22C55E" />
      </div>
      <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 24, margin: 0, fontWeight: 800 }}>You're Registered!</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
        You have successfully registered for <strong style={{ color: '#fff' }}>{event.eventName}</strong>.
      </p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000612', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 16px 60px' }}>

      {/* ── Logo ── */}
      <div style={{ marginBottom: 32 }}>
        <img src="/stagechecklogo.svg" alt="StageCheck" style={{ height: 32, display: 'block' }} />
      </div>

      {/* ── Card ── */}
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'rgba(6,14,28,0.95)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 22,
        overflow: 'hidden',
      }}>

        {/* Event banner image */}
        {event.coverImage && (
          <div style={{ width: '100%', aspectRatio: '16/7', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
            <img
              src={event.coverImage}
              alt={event.eventName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        <div style={{ padding: '28px 28px 32px' }}>

          {/* Event info header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818CF8', marginBottom: 8 }}>
              Network Event Registration
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
              {event.eventName}
            </h1>
            {event.eventDate && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px' }}>
                {new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {(event.description || event.eventDescription) && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6, maxWidth: 380, marginInline: 'auto' }}>
                {event.description || event.eventDescription}
              </p>
            )}
          </div>

          {/* ── Form fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Full Name */}
            <Field
              label="Full Name"
              required
              error={errors['name']}
            >
              <input
                type="text"
                placeholder="Enter your full name"
                value={form['name'] || ''}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); clearErr('name') }}
                style={inp}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" required error={errors['email']}>
              <input
                type="email"
                placeholder="name@example.com"
                value={form['email'] || ''}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); clearErr('email') }}
                style={inp}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </Field>

            {/* Phone (if enabled) */}
            {config?.requirePhone && (
              <Field label="Phone Number" required error={errors['phone']}>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form['phone'] || ''}
                  onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); clearErr('phone') }}
                  style={inp}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </Field>
            )}

            {/* Custom fields */}
            {customFields.map(field => {
              const key = `custom_${field.id}`
              return (
                <Field key={field.id} label={field.label} required={field.required} error={errors[key]}>
                  <input
                    type={field.type}
                    placeholder={
                      field.type === 'number' ? '0'
                      : field.type === 'email' ? 'name@example.com'
                      : field.type === 'tel'   ? '+234 800 000 0000'
                      : `Enter ${field.label.toLowerCase()}`
                    }
                    inputMode={field.type === 'number' ? 'numeric' : undefined}
                    value={form[key] || ''}
                    onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); clearErr(key) }}
                    style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(52,211,153,0.45)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </Field>
              )
            })}

            {/* Hierarchy dropdowns (cascade) */}
            {shownLevels.map((level, idx) => {
              const options = nodesForLevel(level.id, idx)
              // disable if previous level not selected yet
              const disabled = idx > 0 && !form[`level_${shownLevels[idx - 1].id}`]
              return (
                <Field key={level.id} label={level.name} required>
                  <div style={{ position: 'relative' }}>
                    <select
                      disabled={disabled}
                      value={form[`level_${level.id}`] || ''}
                      onChange={e => {
                        const val = e.target.value
                        // clear all deeper selections when a parent changes
                        const reset: Record<string, string> = {}
                        shownLevels.slice(idx + 1).forEach(l => { reset[`level_${l.id}`] = '' })
                        setForm(p => ({ ...p, [`level_${level.id}`]: val, ...reset }))
                      }}
                      style={{
                        ...inp,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        paddingRight: 34,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        opacity: disabled ? 0.4 : 1,
                        borderColor: disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
                      }}
                      onFocus={e => !disabled && (e.currentTarget.style.borderColor = `${level.color}60`)}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    >
                      <option value="">
                        {disabled ? `Select ${shownLevels[idx - 1]?.name} first` : `Select ${level.name}`}
                      </option>
                      {options.map(node => (
                        <option key={node.id} value={node.id}>{node.name}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      color="rgba(255,255,255,0.4)"
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                  </div>
                </Field>
              )
            })}

            {/* Global error */}
            {errors['_global'] && (
              <p style={{ fontSize: 12, color: '#F87171', margin: 0, textAlign: 'center' }}>{errors['_global']}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                marginTop: 4,
                padding: '14px', borderRadius: 12, border: 'none',
                background: submitting ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
                color: '#fff', fontSize: 15, fontWeight: 800,
                fontFamily: 'var(--font-body)', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: submitting ? 'none' : '0 6px 24px rgba(99,102,241,0.35)',
                letterSpacing: '0.01em',
              }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                : 'Register Now'
              }
            </button>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 28 }}>
        Powered by StageCheck
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  function clearErr(key: string) {
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }
}

// ── Field wrapper ──
function Field({
  label, required, error, children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)',
        marginBottom: 7, display: 'block',
      }}>
        {label}
        {required && <span style={{ color: '#F87171', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 11, color: '#F87171', margin: '5px 0 0', paddingLeft: 2 }}>{error}</p>
      )}
    </div>
  )
}