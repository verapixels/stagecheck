import { useState, useRef, useEffect } from 'react'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Users, Check, Clock, Search, ChevronDown, MoreHorizontal,
  Download, UserPlus, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface Registration {
  id: string
  fullName: string
  email: string
  phone?: string
  orgPath?: string
  checkedIn?: boolean
  submittedAt?: any
  createdAt?: any
  customFields?: { id: string; label: string; type: string; value: string }[]
  [key: string]: any
}

interface Props {
  eventId: string
  registrations: Registration[]
  levels: any[]
  nodes?: any[]
  config?: any
}

const PAGE_SIZE = 10

// ── Avatar colours cycling through a palette ──
const AVATAR_COLORS = [
  '#6366F1', '#0dc75e', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ── Custom dropdown (no white flash) ──
function FilterDropdown({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 13px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(13,199,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: '#fff', fontSize: 12, fontWeight: 600,
          fontFamily: 'var(--font-body)', cursor: 'pointer',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
      >
        {selected?.label ?? placeholder}
        <ChevronDown
          size={12}
          color="rgba(255,255,255,0.5)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '100%', zIndex: 100,
          background: '#0d1526',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                padding: '10px 15px', fontSize: 13, fontWeight: 500,
                color: opt.value === value ? '#0dc75e' : '#fff',
                background: opt.value === value ? 'rgba(13,199,94,0.08)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = opt.value === value ? 'rgba(13,199,94,0.08)' : 'transparent')}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Three-dot action menu ──
function ActionMenu({ reg, eventId, onCheckin }: { reg: Registration; eventId: string; onCheckin: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const actions = [
    { label: reg.checkedIn ? 'Undo Check-in' : 'Mark Checked In', action: onCheckin },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: '1px solid transparent',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = open ? 'rgba(255,255,255,0.1)' : 'transparent'}
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          zIndex: 100, minWidth: 160,
          background: '#0d1526',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {actions.map(a => (
            <div
              key={a.label}
              onClick={() => { a.action(); setOpen(false) }}
              style={{
                padding: '10px 14px', fontSize: 13, fontWeight: 500,
                color: '#fff', cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {a.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NetworkRegistrationTable({
  eventId, registrations, levels, nodes = [], config,
}: Props) {
  const [search,   setSearch]   = useState('')
  const [filters,  setFilters]  = useState<Record<string, string>>({})
  const [groupBy,  setGroupBy]  = useState('none')
  const [statusF,  setStatusF]  = useState('all')
  const [page,     setPage]     = useState(1)

  const sortedLevels = [...levels].sort((a, b) => a.order - b.order)
    .slice(0, config?.levelDepth ?? levels.length)

  const customFields: { id: string; label: string }[] =
    config?.customFields?.map((f: any) => ({ id: f.id, label: f.label })) ?? []

  // All columns = hierarchy levels + custom fields
  const allCols = [
    ...sortedLevels.map(l => ({ key: `level_${l.id}`, label: l.name, color: l.color, isLevel: true, levelId: l.id })),
    ...customFields.map(f => ({ key: `cf_${f.id}`, label: f.label, color: 'rgba(255,255,255,0.6)', isLevel: false, fieldId: f.id })),
  ]

  // Build filter options per level
  const levelOptions = (levelId: string) => {
    const vals = new Set<string>()
    registrations.forEach(r => { if (r[`level_${levelId}`]) vals.add(r[`level_${levelId}`]) })
    return [
      { value: 'all', label: `All ${sortedLevels.find(l => l.id === levelId)?.name ?? ''}s` },
      ...Array.from(vals).sort().map(v => ({ value: v, label: v })),
    ]
  }

  // Group-by options
  const groupOptions = [
    { value: 'none', label: 'No Grouping' },
    ...sortedLevels.map(l => ({ value: `level_${l.id}`, label: `Group by ${l.name}` })),
    ...customFields.map(f => ({ value: `cf_${f.id}`, label: `Group by ${f.label}` })),
  ]

  const statusOptions = [
    { value: 'all',     label: 'All Statuses' },
    { value: 'checked', label: 'Checked In' },
    { value: 'pending', label: 'Pending' },
  ]

  // Filter
  const filtered = registrations.filter(r => {
    if (search) {
      const q = search.toLowerCase()
      const cfMatch = r.customFields?.some((f: any) => f.value?.toLowerCase().includes(q)) ?? false
      if (![r.fullName, r.email, r.phone, r.orgPath].some(f => f?.toLowerCase().includes(q)) && !cfMatch) return false
    }
    if (statusF === 'checked' && !r.checkedIn)  return false
    if (statusF === 'pending' &&  r.checkedIn)  return false
    for (const [key, val] of Object.entries(filters)) {
      if (val && val !== 'all' && r[key] !== val) return false
    }
    return true
  })

  // Group
  const grouped: { label: string; items: Registration[] }[] = (() => {
    if (groupBy === 'none') return [{ label: '', items: filtered }]
    const map = new Map<string, Registration[]>()
    filtered.forEach(r => {
      let val = ''
      if (groupBy.startsWith('level_')) val = r[groupBy] ?? '—'
      else if (groupBy.startsWith('cf_')) {
        const fId = groupBy.replace('cf_', '')
        val = r.customFields?.find((f: any) => f.id === fId)?.value?.trim() ?? '—'
      }
      if (!map.has(val)) map.set(val, [])
      map.get(val)!.push(r)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, items]) => ({ label, items }))
  })()

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const allItems   = grouped.flatMap(g => g.items)
  const pageItems  = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Re-group paged items
  const pagedGrouped: { label: string; items: Registration[] }[] = (() => {
    if (groupBy === 'none') return [{ label: '', items: pageItems }]
    const map = new Map<string, Registration[]>()
    pageItems.forEach(r => {
      let val = ''
      if (groupBy.startsWith('level_')) val = r[groupBy] ?? '—'
      else if (groupBy.startsWith('cf_')) {
        const fId = groupBy.replace('cf_', '')
        val = r.customFields?.find((f: any) => f.id === fId)?.value?.trim() ?? '—'
      }
      if (!map.has(val)) map.set(val, [])
      map.get(val)!.push(r)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, items]) => ({ label, items }))
  })()

  const handleCheckin = async (reg: Registration) => {
    await updateDoc(doc(db, 'events', eventId, 'networkRegistrations', reg.id), {
      checkedIn: !reg.checkedIn,
    })
  }

  const formatDate = (reg: Registration) => {
    const ts = reg.submittedAt || reg.createdAt
    if (!ts?.seconds) return '—'
    return new Date(ts.seconds * 1000).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getCellValue = (reg: Registration, col: typeof allCols[0]) => {
    if (col.isLevel) return reg[col.key] ?? '—'
    const fId = (col as any).fieldId
    return reg.customFields?.find((f: any) => f.id === fId)?.value ?? '—'
  }

  // dynamic grid: checkbox + registrant + one col per field + date + status + actions
  const gridCols = `40px 1fr ${allCols.map(() => '120px').join(' ')} 160px 110px 48px`

  const resetFilters = () => {
    setFilters({})
    setStatusF('all')
    setGroupBy('none')
    setSearch('')
    setPage(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        marginBottom: 16,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, email or phone number..."
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#fff', fontSize: 13,
              padding: '9px 12px 9px 34px', outline: 'none',
              fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(13,199,94,0.4)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Group-by */}
        <FilterDropdown
          value={groupBy}
          onChange={v => { setGroupBy(v); setPage(1) }}
          options={groupOptions}
          placeholder="No Grouping"
        />

        {/* Per-level filters */}
        {sortedLevels.map(level => (
          <FilterDropdown
            key={level.id}
            value={filters[`level_${level.id}`] ?? 'all'}
            onChange={v => { setFilters(p => ({ ...p, [`level_${level.id}`]: v })); setPage(1) }}
            options={levelOptions(level.id)}
            placeholder={`All ${level.name}s`}
          />
        ))}

        {/* Status filter */}
        <FilterDropdown
          value={statusF}
          onChange={v => { setStatusF(v); setPage(1) }}
          options={statusOptions}
          placeholder="All Statuses"
        />

        {/* Reset */}
        <button
          onClick={resetFilters}
          style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          Reset
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: 'rgba(6,14,28,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: gridCols,
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)',
          gap: 8,
        }}>
          {/* checkbox placeholder */}
          <div />
          <span style={thStyle}>Registrant</span>
          {allCols.map(col => (
            <span key={col.key} style={{ ...thStyle, color: col.color }}>{col.label}</span>
          ))}
          <span style={thStyle}>Registered On</span>
          <span style={thStyle}>Status</span>
          <span style={thStyle}>Actions</span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <Users size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {search ? 'No results match your search' : 'No registrations yet'}
            </p>
          </div>
        )}

        {/* Rows */}
        {pagedGrouped.map(({ label: groupLabel, items }, gi) => (
          <div key={gi}>
            {/* Group header */}
            {groupBy !== 'none' && (
              <div style={{
                padding: '8px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                borderTop: gi > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                background: 'rgba(13,199,94,0.04)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0dc75e', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0dc75e' }}>{groupLabel}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                  {items.length} registrant{items.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {items.map((reg, i) => (
              <div
                key={reg.id}
                style={{
                  display: 'grid', gridTemplateColumns: gridCols,
                  alignItems: 'center', padding: '14px 20px', gap: 8,
                  borderBottom: i < items.length - 1 || gi < pagedGrouped.length - 1
                    ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Checkbox */}
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent', cursor: 'pointer',
                }} />

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(reg.fullName || '?'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {initials(reg.fullName || '?')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reg.fullName}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reg.email}
                    </div>
                    {reg.phone && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reg.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic field columns */}
                {allCols.map(col => {
                  const val = getCellValue(reg, col)
                  const isEmpty = !val || val === '—'
                  return (
                    <div key={col.key} style={{ minWidth: 0 }}>
                      {isEmpty ? (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>—</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600, color: '#fff',
                        }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            background: col.color,
                            boxShadow: `0 0 5px ${col.color}60`,
                          }} />
                          {val}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Date */}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                  {formatDate(reg)}
                </div>

                {/* Status badge */}
                <div>
                  {reg.checkedIn ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 7,
                      background: 'rgba(13,199,94,0.1)',
                      border: '1px solid rgba(13,199,94,0.2)',
                      color: '#0dc75e', fontSize: 11, fontWeight: 700,
                    }}>
                      <Check size={10} strokeWidth={3} /> Checked In
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 7,
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      color: '#F59E0B', fontSize: 11, fontWeight: 700,
                    }}>
                      <Clock size={10} strokeWidth={2.5} /> Pending
                    </span>
                  )}
                </div>

                {/* Actions */}
                <ActionMenu
                  reg={reg}
                  eventId={eventId}
                  onCheckin={() => handleCheckin(reg)}
                />
              </div>
            ))}
          </div>
        ))}

        {/* ── Pagination footer ── */}
        {filtered.length > 0 && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} registrations
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PageBtn
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </PageBtn>

              {/* Page numbers */}
              {buildPageNumbers(page, totalPages).map((n, i) =>
                n === '...' ? (
                  <span key={`ellipsis-${i}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '0 4px' }}>…</span>
                ) : (
                  <PageBtn
                    key={n}
                    active={n === page}
                    onClick={() => setPage(n as number)}
                  >
                    {n}
                  </PageBtn>
                )
              )}

              <PageBtn
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </PageBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──
const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

function PageBtn({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32, height: 32, borderRadius: 8, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? '#0dc75e' : disabled ? 'transparent' : 'rgba(255,255,255,0.05)',
        color: active ? '#000' : disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
        padding: '0 8px',
      }}
    >
      {children}
    </button>
  )
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}