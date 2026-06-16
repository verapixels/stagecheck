import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiSearchLine, RiLoader4Line, RiCalendarEventLine, RiDeleteBin2Line,
  RiEyeLine, RiShieldLine, RiCheckLine, RiMapPinLine, RiGroupLine,
  RiFilterLine, RiArrowUpLine, RiArrowDownLine,
} from 'react-icons/ri'

interface Event {
  id: string; name: string; date: any; location: string; venue?: string
  eventType: string; status: string; attendingCount: number
  organizerName?: string; organizerId?: string; ticketPrice?: number
  createdAt?: any; summary?: string
}

function toDate(val: any): Date {
  if (!val) return new Date(0)
  if (val?.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}
function fmtDate(val: any) {
  try { return toDate(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return 'TBA' }
}

const TYPE_COLORS: Record<string, string> = {
  choir: '#22C55E', talent: '#F59E0B', conference: '#3B82F6',
  competition: '#8B5CF6', drama: '#EC4899', worship: '#14B8A6',
  openmic: '#F97316', graduation: '#06B6D4', custom: '#A78BFA',
}

export default function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([])
  const [filtered, setFiltered] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortField, setSortField] = useState<'date' | 'name' | 'attendingCount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'delete' | 'activate'; event: Event } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [detailEvent, setDetailEvent] = useState<Event | null>(null)

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      let snap
      try {
        const q = query(collection(db, 'events'), orderBy('date', 'desc'))
        snap = await getDocs(q)
      } catch {
        snap = await getDocs(collection(db, 'events'))
      }
      const list: Event[] = snap.docs.map(d => ({
        id: d.id, name: d.data().name ?? 'Unnamed',
        date: d.data().date, location: d.data().location ?? 'TBA',
        venue: d.data().venue, eventType: d.data().eventType ?? 'custom',
        status: d.data().status ?? 'active',
        attendingCount: d.data().attendingCount ?? d.data().ticketsSold ?? 0,
        organizerName: d.data().organizerName ?? d.data().createdByName ?? '',
        organizerId: d.data().organizerId ?? d.data().createdBy ?? '',
        ticketPrice: d.data().ticketPrice ?? 0,
        createdAt: d.data().createdAt, summary: d.data().summary ?? '',
      }))
      setEvents(list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let list = [...events]
    if (search) list = list.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      (e.organizerName ?? '').toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter(e => e.eventType === typeFilter)
    list.sort((a, b) => {
      let va: any, vb: any
      if (sortField === 'date') { va = toDate(a.date).getTime(); vb = toDate(b.date).getTime() }
      else if (sortField === 'attendingCount') { va = a.attendingCount; vb = b.attendingCount }
      else { va = a.name.toLowerCase(); vb = b.name.toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    setFiltered(list)
  }, [events, search, statusFilter, typeFilter, sortField, sortDir])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleAction() {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      const ref = doc(db, 'events', confirmAction.event.id)
      if (confirmAction.type === 'delete') {
        await deleteDoc(ref)
        setEvents(prev => prev.filter(e => e.id !== confirmAction.event.id))
        showToast('Event deleted')
      } else if (confirmAction.type === 'suspend') {
        await updateDoc(ref, { status: 'suspended' })
        setEvents(prev => prev.map(e => e.id === confirmAction.event.id ? { ...e, status: 'suspended' } : e))
        showToast('Event suspended')
      } else {
        await updateDoc(ref, { status: 'active' })
        setEvents(prev => prev.map(e => e.id === confirmAction.event.id ? { ...e, status: 'active' } : e))
        showToast('Event activated')
      }
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading(false); setConfirmAction(null) }
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <RiArrowUpLine size={11} /> : <RiArrowDownLine size={11} />)
      : null

  const EVENT_TYPES = ['all', 'choir', 'talent', 'conference', 'competition', 'drama', 'worship', 'openmic', 'graduation', 'custom']

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Events</h1>
        <p className="page-sub">{filtered.length} of {events.length} events</p>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <RiSearchLine size={14} color="var(--muted2)" />
            <input
              placeholder="Search by name, location, organizer..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="draft">Draft</option>
          </select>
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="empty-state"><RiLoader4Line size={24} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><RiCalendarEventLine size={32} />No events found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Event <SortIcon field="name" />
                  </th>
                  <th onClick={() => toggleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Date <SortIcon field="date" />
                  </th>
                  <th>Location</th>
                  <th>Type</th>
                  <th onClick={() => toggleSort('attendingCount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Attending <SortIcon field="attendingCount" />
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => {
                  const typeColor = TYPE_COLORS[ev.eventType] ?? '#A78BFA'
                  return (
                    <tr key={ev.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.name}</div>
                        {ev.organizerName && <div style={{ fontSize: 11, color: 'var(--muted)' }}>by {ev.organizerName}</div>}
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(ev.date)}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <RiMapPinLine size={11} />{ev.venue || ev.location}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: `${typeColor}18`, color: typeColor,
                          border: `1px solid ${typeColor}30`,
                        }}>{ev.eventType}</span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                          <RiGroupLine size={11} />{ev.attendingCount}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${ev.status === 'suspended' ? 'badge-red' : ev.status === 'draft' ? 'badge-yellow' : 'badge-green'}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost-sm" onClick={() => setDetailEvent(ev)} title="View details">
                            <RiEyeLine size={12} />
                          </button>
                          {ev.status === 'suspended' ? (
                            <button className="btn btn-ghost-sm" onClick={() => setConfirmAction({ type: 'activate', event: ev })} title="Activate">
                              <RiCheckLine size={12} />
                            </button>
                          ) : (
                            <button className="btn btn-warn" onClick={() => setConfirmAction({ type: 'suspend', event: ev })} title="Suspend">
                              <RiShieldLine size={12} />
                            </button>
                          )}
                          <button className="btn btn-danger" onClick={() => setConfirmAction({ type: 'delete', event: ev })} title="Delete">
                            <RiDeleteBin2Line size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailEvent && (
        <div className="modal-backdrop" onClick={() => setDetailEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">{detailEvent.name}</span>
              <button className="btn btn-ghost-sm" onClick={() => setDetailEvent(null)}>Close</button>
            </div>
            <div className="modal-body">
              {[
                ['Event ID', detailEvent.id],
                ['Date', fmtDate(detailEvent.date)],
                ['Location', detailEvent.venue || detailEvent.location],
                ['Type', detailEvent.eventType],
                ['Status', detailEvent.status],
                ['Attending', detailEvent.attendingCount],
                ['Organizer', detailEvent.organizerName || 'N/A'],
                ['Summary', detailEvent.summary || 'No summary'],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)', minWidth: 90, fontWeight: 600 }}>{k}</span>
                  <span style={{ color: 'var(--text)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              {detailEvent.status === 'suspended' ? (
                <button className="btn btn-primary" onClick={() => { setConfirmAction({ type: 'activate', event: detailEvent }); setDetailEvent(null) }}>
                  <RiCheckLine size={13} /> Activate Event
                </button>
              ) : (
                <button className="btn btn-warn" onClick={() => { setConfirmAction({ type: 'suspend', event: detailEvent }); setDetailEvent(null) }}>
                  <RiShieldLine size={13} /> Suspend Event
                </button>
              )}
              <button className="btn btn-danger" onClick={() => { setConfirmAction({ type: 'delete', event: detailEvent }); setDetailEvent(null) }}>
                <RiDeleteBin2Line size={13} /> Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">
                {confirmAction.type === 'delete' ? 'Delete Event' : confirmAction.type === 'suspend' ? 'Suspend Event' : 'Activate Event'}
              </span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                {confirmAction.type === 'delete'
                  ? `Are you sure you want to permanently delete "${confirmAction.event.name}"? This cannot be undone.`
                  : confirmAction.type === 'suspend'
                  ? `Suspend "${confirmAction.event.name}"? It will be hidden from public view.`
                  : `Reactivate "${confirmAction.event.name}"? It will be visible to users again.`}
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost-sm" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={`btn ${confirmAction.type === 'delete' ? 'btn-danger' : confirmAction.type === 'suspend' ? 'btn-warn' : 'btn-primary'}`}
                onClick={handleAction} disabled={actionLoading}
              >
                {actionLoading ? <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} /> : null}
                {confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'suspend' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: 'var(--bg-card)',
          border: '1px solid var(--border-g)', borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, color: 'var(--green)', zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'slideIn .3s ease',
        }}>
          <RiCheckLine size={15} />{toast}
        </div>
      )}
    </>
  )
}