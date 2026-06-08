import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  updateProfile, updateEmail, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/Authcontext'
import DashboardLayout from '../components/DashboardLayout'
import {
  User, Mail, Camera, Save, Loader2, CheckCircle2,
  AlertTriangle, Shield, CreditCard, Trash2, Eye, EyeOff,
  Lock, Zap, Star
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail]             = useState(user?.email ?? '')
  const [saving, setSaving]           = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]     = useState('')

  // Password re-auth for delete
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteInput, setDeleteInput] = useState('')

  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      await updateProfile(user, { displayName: displayName.trim() || null })
      if (email.trim() !== user.email) {
        await updateEmail(user, email.trim())
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      setSaveError(e.message ?? 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteInput !== 'DELETE') return
    setDeleting(true)
    setDeleteError('')
    try {
      const credential = EmailAuthProvider.credential(user.email!, deletePassword)
      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)
      navigate('/')
    } catch (e: any) {
      setDeleteError(e.message ?? 'Failed to delete account.')
      setDeleting(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(19,26,46,0.7)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '24px',
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 16,
  }
  const inputStyle = (err?: boolean): React.CSSProperties => ({
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${err ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, color: '#fff', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none', transition: 'border-color 0.2s',
  })
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6,
  }

  return (
    <DashboardLayout plan="starter" eventType="custom">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.5px', color: '#fff', marginBottom: 4,
        }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          Manage your account, plan and preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }} className="settings-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Profile ── */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Profile</div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22C55E, #14B8A6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: '#0B1020', fontFamily: 'var(--font-display)',
                  overflow: 'hidden',
                }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#22C55E', border: '2px solid #0B1020',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={10} color="#0B1020" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                  {user?.displayName || 'No name set'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user?.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: 5 }} />Display name</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle()}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: 5 }} />Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle()}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, display: 'block' }}>
                  Changing email requires recent sign-in
                </span>
              </div>
            </div>

            {saveError && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                {saveError}
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                background: saveSuccess ? 'rgba(34,197,94,0.15)' : '#22C55E',
                border: saveSuccess ? '1px solid rgba(34,197,94,0.4)' : 'none',
                color: saveSuccess ? '#22C55E' : '#0B1020',
                padding: '10px 20px', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s',
              }}
            >
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                : saveSuccess
                  ? <><CheckCircle2 size={14} /> Saved!</>
                  : <><Save size={14} /> Save changes</>
              }
            </button>
          </div>

          {/* ── Security ── */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Security</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={16} color="#22C55E" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 2 }}>Password</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Last changed — unknown</div>
              </div>
              <button
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', padding: '7px 14px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)',
                }}
              >
                Change
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="#3B82F6" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 2 }}>Two-factor auth</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Not enabled</div>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 8px', borderRadius: 6 }}>
                Soon
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Plan ── */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Current Plan</div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(20,184,166,0.08))',
              border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '18px 20px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap size={16} color="#22C55E" />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                  Starter
                </span>
                <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '2px 8px', borderRadius: 4 }}>
                  Free
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Up to 3 events', 'Up to 50 performers per event', 'Core submission forms', 'Basic analytics'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                    <CheckCircle2 size={12} color="#22C55E" /> {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Star size={14} color="#F59E0B" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>Upgrade to Pro</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12, lineHeight: 1.6 }}>
                Unlimited events, unlimited performers, AI insights, ticketing, advanced analytics and more.
              </div>
              <button style={{
                background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                border: 'none', color: '#0B1020',
                padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
              }}>
                View Pro Plans
              </button>
            </div>
          </div>

          {/* ── Billing ── */}
          <div style={cardStyle}>
            <div style={sectionLabel}>Billing</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <CreditCard size={16} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No payment method on file</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 10, lineHeight: 1.5 }}>
              You're on the free Starter plan. No billing required.
            </p>
          </div>

          {/* ── Danger zone ── */}
          <div style={{ ...cardStyle, border: '1px solid rgba(248,113,113,0.2)' }}>
            <div style={{ ...sectionLabel, color: '#F87171' }}>Danger Zone</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 16 }}>
              Permanently delete your account and all associated events and data. This cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  color: '#F87171', padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                }}
              >
                <Trash2 size={13} /> Delete Account
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, color: '#F87171', fontWeight: 600 }}>
                  Are you sure? Type <code style={{ background: 'rgba(248,113,113,0.1)', padding: '1px 6px', borderRadius: 4 }}>DELETE</code> to confirm.
                </div>
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  style={{ ...inputStyle(), borderColor: 'rgba(248,113,113,0.3)' }}
                />
                <div style={{ position: 'relative' }}>
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                    style={{ ...inputStyle(), borderColor: 'rgba(248,113,113,0.3)', paddingRight: 40 }}
                  />
                  <button
                    onClick={() => setShowDeletePassword(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}
                  >
                    {showDeletePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {deleteError && <div style={{ fontSize: 12, color: '#F87171' }}>{deleteError}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeletePassword('') }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteInput !== 'DELETE'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: deleteInput === 'DELETE' ? '#EF4444' : 'rgba(248,113,113,0.2)',
                      border: 'none', color: '#fff', padding: '9px 16px', borderRadius: 8,
                      cursor: deleteInput === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
                    }}
                  >
                    {deleting ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...</> : <><AlertTriangle size={12} /> Delete Account</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  )
}