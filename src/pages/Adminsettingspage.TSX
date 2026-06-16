import { useEffect, useState, useRef } from 'react'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  RiBarChartLine, RiSettings3Line, RiShieldUserLine,
  RiAlertLine, RiInformationLine, RiSaveLine,
  RiLoader4Line, RiCheckLine, RiCloseLine,
  RiToggleLine, RiToggleFill, RiEdit2Line,
  RiDeleteBin2Line, RiRefreshLine, RiCodeLine,
  RiServerLine, RiTimeLine, RiGlobalLine,
  RiEyeLine, RiEyeOffLine, RiLockLine,
  RiUserLine, RiMailLine,
} from 'react-icons/ri'
import {
  getAuth, updateEmail, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
} from 'firebase/auth'

// ── Types ──────────────────────────────────────────────────────────────────────
interface PlatformStats {
  eventsManaged: string
  performersRegistered: string
  ticketsIssued: string
  customerSatisfaction: string
}

interface PlatformControls {
  maintenanceMode: boolean
  signupsEnabled: boolean
  publicListingEnabled: boolean
  maintenanceMessage: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
}
const valueStyle: React.CSSProperties = {
  fontSize: 14, color: 'var(--text)', fontWeight: 500,
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'rgba(13,199,94,0.08)', border: '1px solid rgba(13,199,94,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--green)', fontSize: 19,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--green)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: checked ? '#000' : 'rgba(255,255,255,0.7)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const auth = getAuth()

  // ── Stats state
  const [stats, setStats] = useState<PlatformStats>({
    eventsManaged: '18K+', performersRegistered: '120K+',
    ticketsIssued: '2M+', customerSatisfaction: '98%',
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsSaving, setStatsSaving] = useState(false)

  // ── Controls state
  const [controls, setControls] = useState<PlatformControls>({
    maintenanceMode: false, signupsEnabled: true,
    publicListingEnabled: true, maintenanceMessage: 'StageCheck is undergoing scheduled maintenance. We\'ll be back shortly.',
  })
  const [controlsLoading, setControlsLoading] = useState(true)
  const [controlsSaving, setControlsSaving] = useState(false)

  // ── Profile state
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '')
  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  // ── Danger zone state
  const [clearReportsLoading, setClearReportsLoading] = useState(false)
  const [wipeTestLoading, setWipeTestLoading] = useState(false)
  const [dangerConfirm, setDangerConfirm] = useState('')
  const [dangerAction, setDangerAction] = useState<'reports' | 'test' | null>(null)

  // ── Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── Load data
  useEffect(() => {
    async function load() {
      // Stats
      try {
        const snap = await getDocs(collection(db, 'platformStats'))
        if (!snap.empty) {
          const d = snap.docs[0].data()
          setStats({
            eventsManaged: d.eventsManaged ?? '18K+',
            performersRegistered: d.performersRegistered ?? '120K+',
            ticketsIssued: d.ticketsIssued ?? '2M+',
            customerSatisfaction: d.customerSatisfaction ?? '98%',
          })
        }
      } catch { }
      setStatsLoading(false)

      // Controls
      try {
        const snap = await getDoc(doc(db, 'platformConfig', 'controls'))
        if (snap.exists()) {
          const d = snap.data()
          setControls({
            maintenanceMode: d.maintenanceMode ?? false,
            signupsEnabled: d.signupsEnabled ?? true,
            publicListingEnabled: d.publicListingEnabled ?? true,
            maintenanceMessage: d.maintenanceMessage ?? controls.maintenanceMessage,
          })
        }
      } catch { }
      setControlsLoading(false)
    }
    load()
  }, [])

  // ── Save stats
  async function saveStats() {
    setStatsSaving(true)
    try {
      const snap = await getDocs(collection(db, 'platformStats'))
      if (!snap.empty) {
        await updateDoc(doc(db, 'platformStats', snap.docs[0].id), stats as any)
      } else {
        await setDoc(doc(db, 'platformStats', 'main'), stats)
      }
      showToast('Platform stats updated — landing page will reflect changes immediately')
    } catch (e: any) {
      showToast('Failed to save stats: ' + e.message, 'error')
    }
    setStatsSaving(false)
  }

  // ── Save controls (also saves individual toggles immediately)
  async function saveControls(patch?: Partial<PlatformControls>) {
    const updated = patch ? { ...controls, ...patch } : controls
    if (patch) setControls(updated)
    setControlsSaving(true)
    try {
      await setDoc(doc(db, 'platformConfig', 'controls'), updated, { merge: true })
      showToast('Platform controls saved')
    } catch (e: any) {
      showToast('Failed to save controls: ' + e.message, 'error')
    }
    setControlsSaving(false)
  }

  // ── Save profile
  async function saveProfile() {
  if (!auth.currentUser) return
  if (newPassword && newPassword !== confirmPassword) {
    showToast('Passwords do not match', 'error'); return
  }
  if (newPassword && newPassword.length < 6) {
    showToast('Password must be at least 6 characters', 'error'); return
  }

  setProfileSaving(true)
  try {
    // Re-authenticate first if changing sensitive fields
    if (currentPassword && auth.currentUser.email) {
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
        await reauthenticateWithCredential(auth.currentUser, credential)
      } catch (reauthErr: any) {
        showToast('Current password is wrong — try logging out and back in', 'error')
        setProfileSaving(false)
        return
      }
    }

    if (newEmail !== auth.currentUser.email) {
      await updateEmail(auth.currentUser, newEmail)
    }
    if (newPassword) {
      await updatePassword(auth.currentUser, newPassword)
      setNewPassword(''); setConfirmPassword(''); setCurrentPassword('')
    }
    showToast('Profile updated successfully')
  } catch (e: any) {
    const msg = e.code === 'auth/requires-recent-login'
      ? 'Session expired — log out and log back in, then try again'
      : e.code === 'auth/email-already-in-use'
      ? 'That email is already in use'
      : e.message
    showToast(msg, 'error')
  }
  setProfileSaving(false)
}

  // ── Danger: clear reports
  async function clearReports() {
    if (dangerConfirm !== 'DELETE') return
    setClearReportsLoading(true)
    try {
      const snap = await getDocs(collection(db, 'reports'))
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      showToast(`Cleared ${snap.docs.length} report(s)`)
    } catch (e: any) {
      showToast('Error: ' + e.message, 'error')
    }
    setClearReportsLoading(false)
    setDangerAction(null)
    setDangerConfirm('')
  }

  // ── Danger: wipe test data
  async function wipeTestData() {
    if (dangerConfirm !== 'DELETE') return
    setWipeTestLoading(true)
    try {
      const colls = ['testEvents', 'testUsers', 'testSubmissions']
      for (const c of colls) {
        const snap = await getDocs(collection(db, c))
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
      showToast('Test data wiped')
    } catch (e: any) {
      showToast('Error: ' + e.message, 'error')
    }
    setWipeTestLoading(false)
    setDangerAction(null)
    setDangerConfirm('')
  }

  const appVersion = '1.0.0'
  const projectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'stagecheck-app'
 const environment = (import.meta as any).env?.MODE === 'production' ? 'production' : 'development'
  const lastDeploy = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const statsFields = [
    { key: 'eventsManaged', label: 'Events Managed', placeholder: 'e.g. 18K+' },
    { key: 'performersRegistered', label: 'Performers Registered', placeholder: 'e.g. 120K+' },
    { key: 'ticketsIssued', label: 'Tickets Issued', placeholder: 'e.g. 2M+' },
    { key: 'customerSatisfaction', label: 'Customer Satisfaction', placeholder: 'e.g. 98%' },
  ] as const

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage platform configuration, controls, and your superadmin profile</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── 1. PLATFORM STATS ── */}
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <SectionHeader
            icon={<RiBarChartLine />}
            title="Platform Stats"
            subtitle="Numbers shown on the public landing page — update these as your platform grows"
          />

          {statsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <RiLoader4Line size={20} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
                {statsFields.map(f => (
                  <div key={f.key} className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{f.label}</label>
                    <input
                      className="form-input"
                      placeholder={f.placeholder}
                      value={stats[f.key]}
                      onChange={e => setStats(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={saveStats} disabled={statsSaving}>
                  {statsSaving
                    ? <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} />
                    : <RiSaveLine size={13} />}
                  Save Stats
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── 2. PLATFORM CONTROLS ── */}
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <SectionHeader
            icon={<RiSettings3Line />}
            title="Platform Controls"
            subtitle="Toggle key platform features — changes take effect immediately for all users"
          />

          {controlsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <RiLoader4Line size={20} style={{ animation: 'spin .8s linear infinite', color: 'var(--green)' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  key: 'maintenanceMode' as const,
                  label: 'Maintenance Mode',
                  desc: 'Shows a banner to all regular users — superadmins still have full access',
                  danger: true,
                },
                {
                  key: 'signupsEnabled' as const,
                  label: 'New Signups',
                  desc: 'Allow new users to create accounts on the platform',
                  danger: false,
                },
                {
                  key: 'publicListingEnabled' as const,
                  label: 'Public Event Listing',
                  desc: 'Show events on the public landing page to non-logged-in visitors',
                  danger: false,
                },
              ].map((item, i, arr) => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, padding: '18px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                      {item.danger && controls[item.key] && (
                        <span className="badge" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', fontSize: 10 }}>
                          ACTIVE
                        </span>
                      )}
                      {!item.danger && !controls[item.key] && (
                        <span className="badge badge-yellow" style={{ fontSize: 10 }}>DISABLED</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.desc}</div>
                  </div>
                  <Toggle
                    checked={controls[item.key]}
                    onChange={v => saveControls({ [item.key]: v })}
                    disabled={controlsSaving}
                  />
                </div>
              ))}

              {/* Maintenance message */}
              {controls.maintenanceMode && (
                <div style={{ marginTop: 16, padding: '16px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
                  <label style={labelStyle}><RiEdit2Line size={12} /> Maintenance Banner Message</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={controls.maintenanceMessage}
                    onChange={e => setControls(p => ({ ...p, maintenanceMessage: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button className="btn btn-ghost-sm" onClick={() => saveControls()} disabled={controlsSaving}>
                      {controlsSaving ? <RiLoader4Line size={12} style={{ animation: 'spin .8s linear infinite' }} /> : <RiSaveLine size={12} />}
                      Save Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. SUPERADMIN PROFILE ── */}
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <SectionHeader
            icon={<RiShieldUserLine />}
            title="Superadmin Profile"
            subtitle="Update your login credentials — requires your current password to change email or password"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current account info */}
            <div style={{ padding: '14px 16px', background: 'rgba(13,199,94,0.04)', border: '1px solid var(--border-g)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0dc75e, #0a9444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#000', flexShrink: 0 }}>
                {(auth.currentUser?.email || 'S').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{auth.currentUser?.email}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Superadmin account</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label"><RiMailLine size={11} style={{ marginRight: 4 }} />New Email</label>
                <input className="form-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label"><RiLockLine size={11} style={{ marginRight: 4 }} />Current Password (required to change)</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Your current password" style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowCurrentPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                    {showCurrentPw ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Leave password fields blank to keep your current password</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label"><RiLockLine size={11} style={{ marginRight: 4 }} />New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" style={{ paddingRight: 40 }} />
                    <button onClick={() => setShowNewPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                      {showNewPw ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label"><RiLockLine size={11} style={{ marginRight: 4 }} />Confirm New Password</label>
                  <input className="form-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={profileSaving}>
                {profileSaving
                  ? <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} />
                  : <RiSaveLine size={13} />}
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── 4. APP INFO ── */}
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <SectionHeader
            icon={<RiInformationLine />}
            title="App Info"
            subtitle="Current build and environment details"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { icon: <RiCodeLine size={13} />, label: 'App Version', value: `v${appVersion}` },
              { icon: <RiServerLine size={13} />, label: 'Firebase Project', value: projectId },
              {
                icon: <RiGlobalLine size={13} />, label: 'Environment', value: environment,
                badge: environment === 'production'
                  ? { label: 'PROD', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' }
                  : { label: 'DEV', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
              },
              { icon: <RiTimeLine size={13} />, label: 'Last Deploy', value: lastDeploy },
            ].map(item => (
              <div key={item.label}>
                <div style={labelStyle}>{item.icon}{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={valueStyle}>{item.value}</span>
                  {item.badge && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: item.badge.bg, color: item.badge.color, border: `1px solid ${item.badge.border}`, letterSpacing: '0.06em' }}>
                      {item.badge.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. DANGER ZONE ── */}
        <div className="card" style={{ padding: '28px 28px 24px', borderColor: 'rgba(248,113,113,0.2)' }}>
          <SectionHeader
            icon={<RiAlertLine style={{ color: '#f87171' }} />}
            title="Danger Zone"
            subtitle="Irreversible bulk actions — these cannot be undone"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                id: 'reports' as const,
                icon: <RiDeleteBin2Line size={14} />,
                label: 'Clear All Reports',
                desc: 'Permanently deletes every document in the reports collection',
                action: clearReports,
                loading: clearReportsLoading,
              },
              {
                id: 'test' as const,
                icon: <RiRefreshLine size={14} />,
                label: 'Wipe Test Data',
                desc: 'Removes all documents from testEvents, testUsers, and testSubmissions collections',
                action: wipeTestData,
                loading: wipeTestLoading,
              },
            ].map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '16px 18px', borderRadius: 12,
                background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)',
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{item.desc}</div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ fontSize: 12, padding: '8px 16px', flexShrink: 0 }}
                  onClick={() => { setDangerAction(item.id); setDangerConfirm('') }}
                  disabled={item.loading}
                >
                  {item.loading
                    ? <RiLoader4Line size={12} style={{ animation: 'spin .8s linear infinite' }} />
                    : item.icon}
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Danger Confirm Modal ── */}
      {dangerAction && (
        <div className="modal-backdrop" onClick={() => setDangerAction(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title" style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiAlertLine size={15} /> Confirm Action
              </span>
              <button className="btn btn-ghost-sm" onClick={() => setDangerAction(null)}>
                <RiCloseLine size={14} /> Cancel
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>
                This action is <strong>permanent and cannot be undone.</strong> Type <strong>DELETE</strong> below to confirm.
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Type DELETE to confirm</label>
                <input
                  className="form-input"
                  placeholder="DELETE"
                  value={dangerConfirm}
                  onChange={e => setDangerConfirm(e.target.value.toUpperCase())}
                  style={{ borderColor: dangerConfirm === 'DELETE' ? 'rgba(248,113,113,0.5)' : undefined }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost-sm" onClick={() => setDangerAction(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={dangerConfirm !== 'DELETE' || clearReportsLoading || wipeTestLoading}
                onClick={dangerAction === 'reports' ? clearReports : wipeTestData}
              >
                {(clearReportsLoading || wipeTestLoading)
                  ? <RiLoader4Line size={13} style={{ animation: 'spin .8s linear infinite' }} />
                  : <RiDeleteBin2Line size={13} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 2000,
          background: 'var(--bg-card)', border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.4)' : 'var(--border-g)'}`,
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          color: toast.type === 'error' ? '#f87171' : 'var(--green)',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)', animation: 'slideIn .3s ease',
          maxWidth: 380,
        }}>
          {toast.type === 'error' ? <RiAlertLine size={15} /> : <RiCheckLine size={15} />}
          {toast.msg}
        </div>
      )}
    </>
  )
}