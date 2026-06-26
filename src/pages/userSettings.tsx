// src/pages/Settings.tsx
import { useState, useRef } from 'react'
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  Ticket, Globe, Clock, DollarSign, Mail, Trash2, Key,
  Lock, Camera, Check, ChevronRight, X, Save,
} from 'lucide-react'
import UserDashboardLayout from '../components/UserDashboardLayout'
import { useAuth } from '../context/Authcontext'
import { useUserProfile } from '../lib/useUserProfile'
import { useUserTickets } from '../lib/useUserTickets'
import { useUserInvitations } from '../lib/useUserInvitations'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase' 

type SettingsTab = 'account' | 'notifications' | 'privacy' | 'appearance' | 'tickets'

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'account',       label: 'Account',        icon: <User size={15} />    },
  { key: 'notifications', label: 'Notifications',  icon: <Bell size={15} />    },
  { key: 'privacy',       label: 'Privacy',        icon: <Shield size={15} />  },
  { key: 'appearance',    label: 'Appearance',     icon: <Palette size={15} /> },
  { key: 'tickets',       label: 'Tickets',        icon: <Ticket size={15} />  },
]

const LANGUAGES = ['English', 'Yoruba', 'Igbo', 'Hausa', 'French', 'Pidgin']
const TIMEZONES = [
  '(GMT+1) West Africa Time (Lagos)',
  '(GMT+0) Greenwich Mean Time',
  '(GMT+2) Central Africa Time',
  '(GMT-5) Eastern Time (US)',
  '(GMT+3) East Africa Time',
]
const CURRENCIES = [
  'NGN — Nigerian Naira',
  'USD — US Dollar',
  'GBP — British Pound',
  'EUR — Euro',
  'GHS — Ghanaian Cedi',
]

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? '#0dc75e' : 'rgba(255,255,255,0.15)',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10, padding: '9px 36px 9px 12px', color: '#fff',
        fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer',
        appearance: 'none', width: '100%', maxWidth: 240,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }}
    >
      {options.map(o => <option key={o} value={o} style={{ background: '#0e1117' }}>{o}</option>)}
    </select>
  )
}

export default function UserSettings() {
  const { user } = useAuth()
  const { profile, loading, saving, updateProfile } = useUserProfile(user?.uid)
  const { tickets } = useUserTickets(user?.uid)
  const { pending } = useUserInvitations(user?.uid, user?.email)

  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [saved, setSaved]         = useState(false)

  const eventsAttended = tickets.filter(t => t.status === 'used').length

  const handleSave = async (updates: Record<string, any>) => {
    await updateProfile(updates)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const memberSince = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const pwChanged = profile?.passwordLastChanged
    ? `Last changed ${new Date(profile.passwordLastChanged).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Never changed'

  return (
    <UserDashboardLayout invitationCount={pending.length}>
      <style>{`
        .s-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap;
        }
        .s-row:last-child { border-bottom: none; }
        .s-row-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .s-row-label { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); font-family: 'DM Sans', sans-serif; }
        .s-row-sub   { font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; margin-top: 2px; }

        .s-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .s-card-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .s-card-title { font-size: 15px; font-weight: 700; color: #fff; font-family: 'Syne', sans-serif; margin: 0; }
        .s-card-sub   { font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; margin-top: 3px; }

        .s-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          flex-wrap: nowrap;
        }
        .s-tabs::-webkit-scrollbar { display: none; }
        .s-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          border-radius: 8px;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .s-tab.active { background: rgba(13,199,94,0.12); color: #0dc75e; }
        .s-tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }

        .s-main {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }

        .s-icon-chip {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sec-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap; flex-shrink: 0;
        }
        .danger-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px;
          border: 1px solid rgba(239,68,68,0.35);
          background: rgba(239,68,68,0.07);
          color: #f87171;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap; flex-shrink: 0;
        }

        .profile-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
          flex: 1;
        }

        .pref-row-control { flex-shrink: 0; }

        /* Edit mode input */
        .s-field-input {
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(13,199,94,0.4);
          border-radius: 9px;
          padding: 9px 12px;
          color: #fff;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          box-sizing: border-box;
        }
        .s-field-input:focus { border-color: #0dc75e; }

        @media (max-width: 900px) {
          .s-main { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .profile-inner { flex-direction: column !important; }
          .profile-fields { grid-template-columns: 1fr; }
          .s-row { flex-direction: column; align-items: flex-start; gap: 10px; }
          .pref-row-control { width: 100%; max-width: 100%; }
          .pref-row-control select { max-width: 100% !important; width: 100% !important; }
          .danger-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px; }
          .sec-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px; }
        }

        @media (max-width: 420px) {
          .s-tab { padding: 7px 10px; font-size: 12px; gap: 4px; }
          .s-card-header { padding: 14px 16px 12px; }
          .s-row { padding: 14px 16px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <SettingsIcon size={24} color="#0dc75e" />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', color: '#fff', margin: 0 }}>
            Settings
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
          Manage your account preferences and configure your experience.
        </p>
      </div>

      {/* Tabs */}
      <div className="s-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`s-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Save toast */}
      {saved && (
        <div style={{ position: 'fixed', bottom: 24, right: 20, background: '#0dc75e', color: '#000', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, zIndex: 999, fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(13,199,94,0.4)' }}>
          <Check size={16} /> Changes saved
        </div>
      )}

      <div className="s-main">
        {/* Left: tab content */}
        <div>
          {activeTab === 'account'       && <AccountTab profile={profile} loading={loading} saving={saving} onSave={handleSave} userId={user?.uid} />}
          {activeTab === 'notifications' && <NotificationsTab profile={profile} onSave={handleSave} />}
          {activeTab === 'privacy'       && <PrivacyTab profile={profile} onSave={handleSave} />}
          {activeTab === 'appearance'    && <AppearanceTab />}
          {activeTab === 'tickets'       && <TicketsTab />}
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Account summary */}
          <div className="s-card" style={{ overflow: 'hidden' }}>
            <div className="s-card-header"><p className="s-card-title">Account Summary</p></div>
            <div style={{ padding: '4px 0' }}>
              {[
                { icon: <SettingsIcon size={13} />, label: 'Member Since',    value: loading ? '—' : memberSince },
                { icon: <User size={13} />,         label: 'Account Type',    value: profile?.accountType || '—' },
                { icon: <Ticket size={13} />,       label: 'Total Tickets',   value: loading ? '—' : String(tickets.length) },
                { icon: <SettingsIcon size={13} />, label: 'Events Attended', value: loading ? '—' : String(eventsAttended) },
              ].map((item, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'DM Sans, sans-serif', minWidth: 0 }}>
                    {item.icon}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick preferences */}
          <div className="s-card" style={{ overflow: 'hidden' }}>
            <div className="s-card-header"><p className="s-card-title">Preferences</p></div>
            <div style={{ padding: '4px 0' }}>
              {[
                { key: 'pushNotifications',  icon: <Bell size={13} />,  label: 'Push Notifications' },
                { key: 'emailNotifications', icon: <Mail size={13} />,  label: 'Email Notifications' },
                { key: 'marketingEmails',    icon: <Globe size={13} />, label: 'Marketing Emails' },
              ].map((item, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                    {item.icon} {item.label}
                  </div>
                  <Toggle value={!!profile?.[item.key as keyof typeof profile]} onChange={v => handleSave({ [item.key]: v })} />
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="s-card" style={{ overflow: 'hidden' }}>
            <div className="s-card-header"><p className="s-card-title">Security</p></div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="sec-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
                  <Key size={13} /> Password
                </div>
                <button className="sec-btn">Change</button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif', paddingLeft: 20 }}>{pwChanged}</div>
            </div>
            <div style={{ padding: '12px 20px' }}>
              <div className="sec-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
                  <Lock size={13} /> Two-Factor Auth
                </div>
                <button className="sec-btn">{profile?.twoFactorEnabled ? 'Disable' : 'Enable'}</button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif', paddingLeft: 20 }}>Add an extra layer of security.</div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f87171', fontFamily: 'Syne, sans-serif', marginBottom: 12 }}>Danger Zone</div>
            <div className="danger-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif' }}>Delete Account</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>Permanently delete your account and data.</div>
              </div>
              <button className="danger-btn"><Trash2 size={13} /> Delete</button>
            </div>
          </div>

        </div>
      </div>
    </UserDashboardLayout>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Tab panels                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function AccountTab({ profile, loading, saving, onSave, userId }: any) {
  const [editMode, setEditMode]       = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local editable fields
  const [form, setForm] = useState({
    displayName:  '',
    phone:        '',
    dateOfBirth:  '',
    language:     '',
    timezone:     '',
    currency:     '',
  })

  // Sync form from profile when entering edit mode
  const enterEdit = () => {
    setForm({
      displayName:  profile?.displayName  || '',
      phone:        profile?.phone        || '',
      dateOfBirth:  profile?.dateOfBirth  || '',
      language:     profile?.language     || 'English',
      timezone:     profile?.timezone     || '(GMT+1) West Africa Time (Lagos)',
      currency:     profile?.currency     || 'NGN — Nigerian Naira',
    })
    setEditMode(true)
  }

  const cancelEdit = () => setEditMode(false)

  const saveEdit = async () => {
    await onSave({
      displayName: form.displayName,
      phone:       form.phone,
      dateOfBirth: form.dateOfBirth,
      language:    form.language,
      timezone:    form.timezone,
      currency:    form.currency,
    })
    setEditMode(false)
  }

  // Preference selects when NOT in edit mode
  const lang = profile?.language || 'English'
  const tz   = profile?.timezone  || '(GMT+1) West Africa Time (Lagos)'
  const cur  = profile?.currency  || 'NGN — Nigerian Naira'

  // ── Photo upload ──────────────────────────────────────────────
  const handlePhotoClick = () => fileInputRef.current?.click()
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file || !userId) return
  setUploadingPhoto(true)
  try {
    const storage  = getStorage()
    const photoRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`)
    await uploadBytes(photoRef, file)
    const url = await getDownloadURL(photoRef)

    // Update BOTH Firestore (via your hook) AND Firebase Auth
    await Promise.all([
      onSave({ photoURL: url }),
      updateProfile(auth.currentUser!, { photoURL: url }),
    ])
  } catch (err) {
    console.error('Photo upload failed:', err)
  } finally {
    setUploadingPhoto(false)
    e.target.value = ''
  }
}

  const prefItems = [
    { key: 'language', icon: <Globe size={16} />,      iconBg: 'rgba(96,165,250,0.12)',  iconColor: '#60a5fa', label: 'Language',         sub: 'Choose your preferred language.',   options: LANGUAGES },
    { key: 'timezone', icon: <Clock size={16} />,      iconBg: 'rgba(168,85,247,0.12)', iconColor: '#a78bfa', label: 'Time Zone',         sub: 'Select your current time zone.',    options: TIMEZONES },
    { key: 'currency', icon: <DollarSign size={16} />, iconBg: 'rgba(250,204,21,0.12)', iconColor: '#fbbf24', label: 'Currency',          sub: 'Choose your preferred currency.',   options: CURRENCIES },
  ]

  const prefValues: Record<string, string> = { language: lang, timezone: tz, currency: cur }

  return (
    <div>
      {/* Hidden file input for photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />

      {/* Profile information */}
      <div className="s-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10 }}>
          <p className="s-card-title" style={{ margin: 0 }}>Profile Information</p>
          {editMode ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                <X size={13} /> Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: '#0dc75e', color: '#000', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.7 : 1 }}>
                <Save size={13} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={enterEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Camera size={13} /> Edit Profile
            </button>
          )}
        </div>

        <div className="profile-inner" style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Avatar — always clickable */}
          <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }} onClick={handlePhotoClick} title="Change profile photo">
            {uploadingPhoto ? (
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(13,199,94,0.15)', border: '2px solid #0dc75e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: '#0dc75e', fontFamily: 'DM Sans, sans-serif' }}>…</span>
              </div>
            ) : profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0dc75e' }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(13,199,94,0.2)', border: '2px solid #0dc75e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#0dc75e', fontFamily: 'Syne, sans-serif' }}>
                {(profile?.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#0dc75e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={11} color="#000" />
            </div>
          </div>

          {/* Fields */}
          <div className="profile-fields">
            {/* Full Name */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 5 }}>Full Name</label>
              {editMode ? (
                <input className="s-field-input" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Your full name" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 12px' }}>
                  <span style={{ fontSize: 13, color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', fontFamily: 'DM Sans, sans-serif', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loading ? 'Loading…' : profile?.displayName || '—'}
                  </span>
                </div>
              )}
            </div>

            {/* Email — never editable */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 5 }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 12px' }}>
                <span style={{ fontSize: 13, color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', fontFamily: 'DM Sans, sans-serif', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loading ? 'Loading…' : profile?.email || '—'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0dc75e', background: 'rgba(13,199,94,0.12)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Verified ✓</span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 5 }}>Phone Number</label>
              {editMode ? (
                <input className="s-field-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+234 800 000 0000" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 12px' }}>
                  <span style={{ fontSize: 13, color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
                    {loading ? 'Loading…' : profile?.phone || '—'}
                  </span>
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 5 }}>Date of Birth</label>
              {editMode ? (
                <input className="s-field-input" type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  style={{ colorScheme: 'dark' } as any}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 12px' }}>
                  <span style={{ fontSize: 13, color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
                    {loading ? 'Loading…' : profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account preferences */}
      <div className="s-card">
        <div className="s-card-header"><p className="s-card-title" style={{ margin: 0 }}>Account Preferences</p></div>
        {prefItems.map((item) => (
          <div key={item.key} className="s-row">
            <div className="s-row-left">
              <div className="s-icon-chip" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="s-row-label">{item.label}</div>
                <div className="s-row-sub">{item.sub}</div>
              </div>
            </div>
            <div className="pref-row-control">
              {editMode ? (
                <Select
                  value={form[item.key as keyof typeof form] || prefValues[item.key]}
                  onChange={v => setForm(p => ({ ...p, [item.key]: v }))}
                  options={item.options}
                />
              ) : (
                <Select
                  value={prefValues[item.key]}
                  onChange={v => onSave({ [item.key]: v })}
                  options={item.options}
                />
              )}
            </div>
          </div>
        ))}
        {/* Email Preferences row */}
        <div className="s-row">
          <div className="s-row-left">
            <div className="s-icon-chip" style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}><Mail size={16} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="s-row-label">Email Preferences</div>
              <div className="s-row-sub">Manage emails you receive from us.</div>
            </div>
          </div>
          <div className="pref-row-control">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', padding: 0 }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="s-card">
        <div className="s-card-header">
          <p className="s-card-title" style={{ margin: 0 }}>Connected Accounts</p>
          <p className="s-card-sub">Connect your accounts for a better experience.</p>
        </div>
        <div className="s-row">
          <div className="s-row-left">
            <div className="s-icon-chip" style={{ background: 'rgba(234,67,53,0.12)', fontSize: 18, color: '#ea4335', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>G</div>
            <div>
              <div className="s-row-label">Google</div>
              <div className="s-row-sub">{profile?.googleEmail ? `Connected as ${profile.googleEmail}` : 'Not connected'}</div>
            </div>
          </div>
          <button style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
            {profile?.connectedGoogle ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab({ profile, onSave }: any) {
  const items = [
    { key: 'pushNotifications',  label: 'Push Notifications', sub: 'Receive push notifications on your device.', icon: <Bell size={16} />,  iconBg: 'rgba(13,199,94,0.12)',  iconColor: '#0dc75e' },
    { key: 'emailNotifications', label: 'Email Notifications',sub: 'Receive email updates and reminders.',       icon: <Mail size={16} />,  iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60a5fa' },
    { key: 'marketingEmails',    label: 'Marketing Emails',   sub: 'Receive updates about events and offers.',   icon: <Mail size={16} />,  iconBg: 'rgba(168,85,247,0.12)', iconColor: '#a78bfa' },
  ]
  return (
    <div className="s-card">
      <div className="s-card-header">
        <p className="s-card-title" style={{ margin: 0 }}>Notification Preferences</p>
        <p className="s-card-sub">Choose how and when you want to be notified.</p>
      </div>
      {items.map((item, i) => (
        <div key={i} className="s-row">
          <div className="s-row-left">
            <div className="s-icon-chip" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
            <div>
              <div className="s-row-label">{item.label}</div>
              <div className="s-row-sub">{item.sub}</div>
            </div>
          </div>
          <Toggle value={!!profile?.[item.key]} onChange={v => onSave({ [item.key]: v })} />
        </div>
      ))}
    </div>
  )
}

function PrivacyTab({ profile, onSave }: any) {
  const items = [
    { key: 'profileVisible',     label: 'Public Profile',       sub: 'Allow others to view your profile.'                      },
    { key: 'showAttendedEvents', label: 'Show Attended Events', sub: 'Display events you have attended on your profile.'       },
    { key: 'allowTagging',       label: 'Allow Tagging',        sub: 'Let others tag you in event posts.'                      },
    { key: 'dataSharing',        label: 'Data Sharing',         sub: 'Share usage data to help improve StageCheck.'            },
  ]
  return (
    <div className="s-card">
      <div className="s-card-header">
        <p className="s-card-title" style={{ margin: 0 }}>Privacy Settings</p>
        <p className="s-card-sub">Control how your information is used and displayed.</p>
      </div>
      {items.map((item, i) => (
        <div key={i} className="s-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="s-row-label">{item.label}</div>
            <div className="s-row-sub">{item.sub}</div>
          </div>
          <Toggle value={!!profile?.[item.key]} onChange={v => onSave({ [item.key]: v })} />
        </div>
      ))}
    </div>
  )
}

function AppearanceTab() {
  return (
    <div className="s-card" style={{ padding: '20px' }}>
      <p className="s-card-title" style={{ marginBottom: 16 }}>Appearance</p>
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
        Theme customisation coming soon.
      </div>
    </div>
  )
}

function TicketsTab() {
  return (
    <div className="s-card" style={{ padding: '20px' }}>
      <p className="s-card-title" style={{ marginBottom: 16 }}>Tickets & Events</p>
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
        Ticket preferences and event notification settings coming soon.
      </div>
    </div>
  )
}