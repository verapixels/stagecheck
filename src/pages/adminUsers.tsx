import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiSearchLine, RiLoader4Line, RiGroupLine, RiDeleteBin2Line,
  RiShieldLine, RiCheckLine, RiMailLine, RiTimeLine, RiEyeLine,
  RiArrowUpLine, RiArrowDownLine, RiUserLine,
} from 'react-icons/ri'

interface User {
  id: string; displayName: string; email: string; role: string
  suspended: boolean; createdAt: any; photoURL?: string
  eventsCreated?: number; lastLogin?: any; phone?: string
}

function toDate(val: any): Date {
  if (!val) return new Date(0)
  if (val?.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}
function fmtDate(val: any) {
  if (!val) return 'N/A'
  try { return toDate(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return 'N/A' }
}
function timeAgo(val: any) {
  if (!val) return 'N/A'
  const d = toDate(val)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<'displayName' | 'createdAt' | 'email'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'delete' | 'activate' | 'makeAdmin' | 'removeAdmin'; user: User } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [detailUser, setDetailUser] = useState<User | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      let snap
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
        snap = await getDocs(q)
      } catch {
        snap = await getDocs(collection(db, 'users'))
      }
      const list: User[] = snap.docs.map(d => ({
        id: d.id,
        displayName: d.data().displayName ?? d.data().name ?? 'Unknown',
        email: d.data().email ?? '',
        role: d.data().role ?? 'user',
        suspended: d.data().suspended ?? false,
        createdAt: d.data().createdAt,
        photoURL: d.data().photoURL ?? '',
        eventsCreated: d.data().eventsCreated ?? 0,
        lastLogin: d.data().lastLogin,
        phone: d.data().phone ?? '',
      }))
      setUsers(list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let list = [...users]
    if (search) list = list.filter(u =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter)
    if (statusFilter === 'active') list = list.filter(u => !u.suspended)
    if (statusFilter === 'suspended') list = list.filter(u => u.suspended)
    list.sort((a, b) => {
      let va: any, vb: any
      if (sortField === 'createdAt') { va = toDate(a.createdAt).getTime(); vb = toDate(b.createdAt).getTime() }
      else if (sortField === 'displayName') { va = a.displayName.toLowerCase(); vb = b.displayName.toLowerCase() }
      else { va = a.email.toLowerCase(); vb = b.email.toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    setFiltered(list)
  }, [users, search, roleFilter, statusFilter, sortField, sortDir])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleAction() {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      const ref = doc(db, 'users', confirmAction.user.id)
      switch (confirmAction.type) {
        case 'delete':
          await deleteDoc(ref)
          setUsers(prev => prev.filter(u => u.id !== confirmAction.user.id))
          showToast('User deleted')
          break
        case 'suspend':
          await updateDoc(ref, { suspended: true })
          setUsers(prev => prev.map(u => u.id === confirmAction.user.id ? { ...u, suspended: true } : u))
          showToast('User suspended')
          break
        case 'activate':
          await updateDoc(ref, { suspended: false })
          setUsers(prev => prev.map(u => u.id === confirmAction.user.id ? { ...u, suspended: false } : u))
          showToast('User activated')
          break
        case 'makeAdmin':
          await updateDoc(ref, { role: 'admin' })
          setUsers(prev => prev.map(u => u.id === confirmAction.user.id ? { ...u, role: 'admin' } : u))
          showToast('User promoted to admin')
          break
        case 'removeAdmin':
          await updateDoc(ref, { role: 'user' })
          setUsers(prev => prev.map(u => u.id === confirmAction.user.id ? { ...u, role: 'user' } : u))
          showToast('Admin role removed')
          break
      }
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading(false); setConfirmAction(null) }
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }
  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (sortDir === 'asc' ? <RiArrowUpLine size={11} /> : <RiArrowDownLine size={11} />) : null

  const roleColor = (r: string) => r === 'superadmin' ? '#f87171' : r === 'admin' ? '#a78bfa' : 'var(--muted)'
  const roleBadge = (r: string) => r === 'superadmin' ? 'badge-red' : r === 'admin' ? 'badge-blue' : 'badge-gray'

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-sub">{filtered.length} of {users.length} users</p>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <RiSearchLine size={14} color="var(--muted2)" />
            <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state"><RiLoader4Line size={24} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><RiGroupLine size={32} />No users found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('displayName')} style={{ cursor: 'pointer' }}>User <SortIcon field="displayName" /></th>
                  <th onClick={() => toggleSort('email')} style={{ cursor: 'pointer' }}>Email <SortIcon field="email" /></th>
                  <th>Role</th>
                  <th>Status</th>
                  <th onClick={() => toggleSort('createdAt')} style={{ cursor: 'pointer' }}>Joined <SortIcon field="createdAt" /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const initials = (u.displayName || u.email || 'U').slice(0, 2).toUpperCase()
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: u.suspended ? 'rgba(248,113,113,.15)' : 'linear-gradient(135deg, #0dc75e, #0a9444)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11,
                            color: u.suspended ? '#f87171' : '#000',
                          }}>{initials}</div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{u.displayName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                          <RiMailLine size={11} />{u.email}
                        </span>
                      </td>
                      <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.suspended ? 'badge-red' : 'badge-green'}`}>{u.suspended ? 'Suspended' : 'Active'}</span></td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted2)' }}>
                          <RiTimeLine size={11} />{fmtDate(u.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost-sm" onClick={() => setDetailUser(u)} title="View details"><RiEyeLine size={12} /></button>
                          {u.suspended ? (
                            <button className="btn btn-ghost-sm" onClick={() => setConfirmAction({ type: 'activate', user: u })} title="Activate"><RiCheckLine size={12} /></button>
                          ) : (
                            <button className="btn btn-warn" onClick={() => setConfirmAction({ type: 'suspend', user: u })} title="Suspend"><RiShieldLine size={12} /></button>
                          )}
                          <button className="btn btn-danger" onClick={() => setConfirmAction({ type: 'delete', user: u })} title="Delete"><RiDeleteBin2Line size={12} /></button>
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

      {/* User Detail Modal */}
      {detailUser && (
        <div className="modal-backdrop" onClick={() => setDetailUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">User Profile</span>
              <button className="btn btn-ghost-sm" onClick={() => setDetailUser(null)}>Close</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 8px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0dc75e, #0a9444)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000',
                }}>{(detailUser.displayName || 'U').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{detailUser.displayName}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{detailUser.email}</div>
                </div>
              </div>
              {[
                ['User ID', detailUser.id],
                ['Role', detailUser.role],
                ['Status', detailUser.suspended ? 'Suspended' : 'Active'],
                ['Joined', fmtDate(detailUser.createdAt)],
                ['Last Login', fmtDate(detailUser.lastLogin)],
                ['Events Created', detailUser.eventsCreated ?? 0],
                ['Phone', detailUser.phone || 'N/A'],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: 12, fontSize: 13, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ color: 'var(--muted)', minWidth: 110, fontWeight: 600 }}>{k}</span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              {detailUser.role === 'user'
                ? <button className="btn btn-ghost-sm" onClick={() => { setConfirmAction({ type: 'makeAdmin', user: detailUser }); setDetailUser(null) }}>Make Admin</button>
                : detailUser.role === 'admin'
                ? <button className="btn btn-ghost-sm" onClick={() => { setConfirmAction({ type: 'removeAdmin', user: detailUser }); setDetailUser(null) }}>Remove Admin</button>
                : null}
              {detailUser.suspended
                ? <button className="btn btn-primary" onClick={() => { setConfirmAction({ type: 'activate', user: detailUser }); setDetailUser(null) }}><RiCheckLine size={13} />Activate</button>
                : <button className="btn btn-warn" onClick={() => { setConfirmAction({ type: 'suspend', user: detailUser }); setDetailUser(null) }}><RiShieldLine size={13} />Suspend</button>}
              <button className="btn btn-danger" onClick={() => { setConfirmAction({ type: 'delete', user: detailUser }); setDetailUser(null) }}>
                <RiDeleteBin2Line size={13} />Delete
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
              <span className="modal-title">Confirm Action</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                {confirmAction.type === 'delete' && `Permanently delete "${confirmAction.user.displayName}"? This cannot be undone.`}
                {confirmAction.type === 'suspend' && `Suspend "${confirmAction.user.displayName}"? They won't be able to log in.`}
                {confirmAction.type === 'activate' && `Reactivate "${confirmAction.user.displayName}"?`}
                {confirmAction.type === 'makeAdmin' && `Promote "${confirmAction.user.displayName}" to admin?`}
                {confirmAction.type === 'removeAdmin' && `Remove admin role from "${confirmAction.user.displayName}"?`}
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost-sm" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={`btn ${confirmAction.type === 'delete' ? 'btn-danger' : confirmAction.type === 'suspend' ? 'btn-warn' : 'btn-primary'}`}
                onClick={handleAction} disabled={actionLoading}
              >
                {actionLoading && <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: 'var(--bg-card)',
          border: '1px solid var(--border-g)', borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, color: 'var(--green)', zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          animation: 'slideIn .3s ease',
        }}>
          <RiCheckLine size={15} />{toast}
        </div>
      )}
    </>
  )
}