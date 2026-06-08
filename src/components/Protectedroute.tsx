import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Authcontext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B1020',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(34,197,94,0.2)',
            borderTop: '3px solid #22C55E', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}