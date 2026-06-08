import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/Authlayout'
import AuthInput from '../components/Authinput'
import { useAuth } from '../context/Authcontext'

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName)
    setLoading(false)

    if (error) {
      const code = (error as any)?.code || ''
      if (code === 'auth/email-already-in-use') {
        setServerError('An account with this email already exists.')
      } else if (code === 'auth/weak-password') {
        setServerError('Password is too weak.')
      } else if (code === 'auth/network-request-failed') {
        setServerError('Network error. Check your connection.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
    // ✅ No navigate or setSuccess here — AuthRoute handles redirect automatically
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setServerError('')
    await signInWithGoogle()
    // signInWithRedirect navigates away — page unloads
    setGoogleLoading(false)
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up StageCheck for your events. Free to start."
    >
      {/* Google button */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', cursor: googleLoading ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.2s', opacity: googleLoading ? 0.7 : 1,
        }}
        onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Error */}
      {serverError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: '#F87171', fontFamily: 'var(--font-body)' }}>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuthInput label="Full name" type="text" placeholder="e.g. Emeka Okonkwo" icon={<User size={16} />}
          value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
        <AuthInput label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={16} />}
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <AuthInput label="Password" type="password" placeholder="Min. 8 characters" icon={<Lock size={16} />}
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <AuthInput label="Confirm password" type="password" placeholder="Repeat your password" icon={<Lock size={16} />}
          value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px', borderRadius: 10,
          background: loading ? 'rgba(34,197,94,0.6)' : '#22C55E',
          border: 'none', color: '#0B1020', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s', marginTop: 4,
        }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1da34a' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#22C55E' }}
        >
          {loading ? 'Creating account...' : <><ArrowRight size={16} /> Create Account</>}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#22C55E', textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthLayout>
  )
}