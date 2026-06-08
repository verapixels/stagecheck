import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckSquare, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../context/Authcontext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) {
      const code = (error as any)?.code || ''
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect email or password.')
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
    // ✅ No navigate here — AuthRoute handles it
  }

 const handleGoogle = async () => {
  setGoogleLoading(true)
  setError('')
  const { error } = await signInWithGoogle(true) // ← true = login mode
  if (error) {
    const code = (error as any)?.code || ''
    if (code === 'auth/user-not-found') {
      setError('No account found for this Google email. Please sign up first.')
    } else if (code === 'auth/popup-closed-by-user') {
      setError('Google sign-in was cancelled.')
    } else {
      setError('Google sign-in failed. Please try again.')
    }
  }
  setGoogleLoading(false)
}

  return (
    <div style={{
      minHeight: '100vh', background: '#0B1020', display: 'flex',
      fontFamily: 'var(--font-body)', overflow: 'hidden', position: 'relative',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* Left panel */}
      <div className="left-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '3rem',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: '#22C55E', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(34,197,94,0.4)',
          }}>
            <CheckSquare size={20} color="#0B1020" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.5px' }}>
            StageCheck
          </span>
        </div>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            padding: '6px 14px', borderRadius: 100, marginBottom: 28,
          }}>
            <Zap size={12} color="#22C55E" fill="#22C55E" />
            <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>The Event Operating System</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1.1,
            letterSpacing: '-1.5px', color: '#fff', marginBottom: 20,
          }}>
            Your stage.<br /><span style={{ color: '#22C55E' }}>Your control.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 380 }}>
            Manage schedules, performers, conflicts, and live events — all from one powerful dashboard.
          </p>
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Zero-conflict scheduling engine', 'Live stage control & monitoring', 'Performer check-in & verification'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          {[{ value: '18k+', label: 'Events run' }, { value: '120k+', label: 'Performers' }, { value: '99.9%', label: 'Uptime' }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', background: 'rgba(13,20,40,0.85)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '2.5rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.8px', color: '#fff', marginBottom: 8 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Sign in to your StageCheck account</p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="google-btn"
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 24, transition: 'all 0.2s', opacity: googleLoading ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.5V5.43H1.83a8 8 0 0 0 0 7.12z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 0 0 1.83 5.43L4.5 7.5a4.77 4.77 0 0 1 4.48-3.92z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#f87171',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14,
                    fontFamily: 'var(--font-body)', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: '#22C55E', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '12px 42px 12px 42px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14,
                    fontFamily: 'var(--font-body)', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex',
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'rgba(34,197,94,0.5)' : '#22C55E',
                border: 'none', borderRadius: 12, color: '#0B1020', fontSize: 15, fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginTop: 4,
                boxShadow: loading ? 'none' : '0 0 24px rgba(34,197,94,0.3)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#1da34a'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'translateY(0)' }}}
            >
              {loading ? <><div className="spinner" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#22C55E', textDecoration: 'none', fontWeight: 600 }}>Sign up free</Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #0d1428 inset !important; -webkit-text-fill-color: #fff !important; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; }
        .blob-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 8s ease-in-out infinite; }
        .blob-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%); bottom: -80px; right: 200px; animation: blobFloat 10s ease-in-out infinite reverse; }
        .blob-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%); top: 50%; right: -50px; animation: blobFloat 12s ease-in-out infinite 2s; }
        @keyframes blobFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(20px, -20px) scale(1.05); } 66% { transform: translate(-15px, 15px) scale(0.95); } }
        .google-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(11,16,32,0.3); border-top-color: #0B1020; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .left-panel { display: none !important; } }
      `}</style>
    </div>
  )
}