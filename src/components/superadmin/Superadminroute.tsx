import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/Authcontext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { RiLoader4Line, RiShieldLine } from 'react-icons/ri'

export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }

    // Check Firestore role instead of token claims
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      setIsSuperAdmin(snap.exists() && snap.data()?.role === 'superadmin')
      setChecking(false)
    }).catch(() => setChecking(false))

  }, [user, loading])

  if (loading || checking) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000612',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <RiLoader4Line size={32} color="#0dc75e" style={{ animation: 'spin .8s linear infinite' }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
          Verifying access...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!isSuperAdmin) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000612',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <RiShieldLine size={48} color="rgba(239,68,68,0.6)" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f87171', fontWeight: 700, fontSize: 18, fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>
            Access Denied
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
            You don't have superadmin privileges.
          </div>
        </div>
        <a href="/dashboard" style={{ color: '#0dc75e', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          Go back to dashboard
        </a>
      </div>
    )
  }

  return <>{children}</>
}