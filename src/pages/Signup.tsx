import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiAlertCircle,
  FiArrowRight, FiUser
} from 'react-icons/fi'
import { useAuth } from '../context/Authcontext'

const FUNCTIONS_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="inp-box">
      <span className="inp-icon"><FiPhone size={15} /></span>
      <div className="phone-flag">
        <img src="https://flagcdn.com/w20/ng.png" alt="NG" style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 2 }} />
        <span className="phone-code">+234</span>
        <span className="phone-chevron">&#8964;</span>
      </div>
      <div className="phone-sep" />
      <input type="tel" placeholder="801 234 5678" value={value} onChange={e => onChange(e.target.value)} className="inp-el" />
    </div>
  )
}

export default function SignUp() {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'At least 8 characters with a number and letter'
    return e
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      // 1. Check if email already exists
      const checkRes = await fetch(`${FUNCTIONS_BASE}/checkEmailExists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      if (!checkRes.ok) {
        const body = await checkRes.json()
        setServerError(body.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      const { exists } = await checkRes.json()
      if (exists) {
        setErrors(prev => ({ ...prev, email: 'An account with this email already exists.' }))
        setLoading(false)
        return
      }

      // 2. Send verification code
      const res = await fetch(`${FUNCTIONS_BASE}/sendVerificationCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          firstName: form.fullName.trim().split(' ')[0],
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        setServerError(body.error || 'Failed to send verification email. Please try again.')
        setLoading(false)
        return
      }

      // 3. Navigate to verify page
      navigate('/verify-email', {
        state: {
          email: form.email,
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone,
        },
      })
    } catch {
      setServerError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setServerError('')
    await signInWithGoogle()
    setGoogleLoading(false)
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #22C55E;
          --bg: #080e1a;
          --bg-left: #060c18;
          --text: #ffffff;
          --muted: rgba(255,255,255,0.5);
          --font-d: 'Syne', sans-serif;
          --font-b: 'Inter', sans-serif;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(15px,-15px) scale(1.04); }
          66% { transform: translate(-10px,10px) scale(0.96); }
        }

        body { background: var(--bg); }

        .su-page {
          height: 100vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-b);
        }

        /* ══ LEFT PANEL ══════════════════════════════════════════════ */
        .lp {
          position: relative;
          background: var(--bg-left);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100vh;
          overflow: hidden;
          padding: 0 40px 36px;
        }

        /* ambient blobs */
        .blob {
          position: absolute; border-radius: 50%;
          pointer-events: none; filter: blur(90px);
        }
        .blob-1 {
          width: 480px; height: 480px;
          background: rgba(34,197,94,0.08);
          top: -80px; left: -120px;
          animation: blobFloat 10s ease-in-out infinite;
        }
        .blob-2 {
          width: 320px; height: 320px;
          background: rgba(99,102,241,0.07);
          bottom: 15%; right: -80px;
          animation: blobFloat 14s ease-in-out infinite reverse;
        }

        /* top arc highlight — matches reference */
        .lp-arc {
          position: absolute; top: 0; left: 50%;
          transform: translateX(-50%);
          width: 55%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent);
          z-index: 5;
        }

        /* ── Logo bar ── */
        .lp-logo {
          position: relative; z-index: 10;
          display: flex; align-items: center; gap: 10px;
          padding-top: 28px; padding-bottom: 0;
          flex-shrink: 0;
        }
        .lp-logo img { width: 36px; height: 36px; object-fit: contain; }
        .lp-logo-name {
          font-family: var(--font-d); font-size: 20px; font-weight: 800;
          color: var(--text); letter-spacing: -0.3px;
        }
        .lp-logo-name span { color: var(--green); }

        /* ── Middle block: eyebrow + headline ── */
        .lp-mid {
          position: relative; z-index: 10;
          display: flex; flex-direction: column;
          gap: 0;
          flex: 1;
          justify-content: center;
          padding-top: 20px;
        }

        /* eyebrow pill */
        .eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.22);
          border-radius: 100px; padding: 5px 14px;
          font-size: 11px; font-weight: 600; color: var(--green);
          letter-spacing: .05em; width: fit-content;
          margin-bottom: 18px;
        }
        .eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--green);
        }

        /* headline */
        .lp-headline {
          font-family: var(--font-d);
          font-size: clamp(32px, 3.4vw, 54px);
          font-weight: 800;
          line-height: 1.04;
          color: var(--text);
          letter-spacing: -1.5px;
          margin-bottom: 12px;
        }
        .lp-headline .accent { color: var(--green); }

        .lp-sub {
          font-size: 13.5px; color: var(--muted);
          line-height: 1.65; max-width: 340px;
          margin-bottom: 24px;
        }

        /* ── Bottom block: features + social proof ── */
        .lp-bottom { position: relative; z-index: 10; }

        .feats { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
        .feat-row { display: flex; align-items: flex-start; gap: 12px; }
        .feat-icon-box {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .feat-title { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .feat-desc { font-size: 12px; color: var(--muted); line-height: 1.45; }

        .social-proof { display: flex; align-items: center; gap: 0; }
        .avatars { display: flex; }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid var(--bg-left);
          object-fit: cover; margin-right: -9px;
        }
        .social-text {
          font-size: 12.5px; color: var(--muted); line-height: 1.4;
          margin-left: 22px;
        }
        .social-text strong { color: var(--green); font-weight: 700; }

        /* ══ RIGHT PANEL ══════════════════════════════════════════════ */
        .rp {
          display: flex; align-items: center; justify-content: center;
          padding: clamp(16px, 3vh, 32px) clamp(20px, 4vw, 52px);
          background: var(--bg);
          height: 100vh; overflow: hidden;
        }
        .rp-inner { width: 100%; max-width: 520px; }

        /* right panel card — subtle border like reference */
        .rp-card {
          background: #0b1525;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 36px;
        }

        .rp-title {
          font-family: var(--font-d); font-size: clamp(24px, 2.2vw, 30px);
          font-weight: 800; color: var(--text);
          letter-spacing: -1px; line-height: 1.05;
          margin-bottom: 6px;
        }
        .rp-title span { color: var(--green); }
        .rp-sub { font-size: 13px; color: var(--muted); margin-bottom: 16px; }

        /* Google */
        .g-btn {
          width: 100%; padding: 11px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text); font-size: 14px; font-weight: 500; font-family: var(--font-b);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background .2s, border-color .2s; margin-bottom: 14px;
        }
        .g-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
        .g-btn:disabled { opacity: .6; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .div-text { font-size: 12px; color: rgba(255,255,255,0.28); }

        .srv-err {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 11px 14px; margin-bottom: 14px;
        }
        .srv-err-txt { font-size: 13px; color: #f87171; }

        /* Form */
        .su-form { display: flex; flex-direction: column; gap: 10px; }
        .inp-wrap { display: flex; flex-direction: column; gap: 4px; }
        .inp-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.65); }
        .inp-box {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; padding: 0 14px; height: 44px;
          transition: border-color .18s, box-shadow .18s;
        }
        .inp-box:focus-within {
          border-color: rgba(34,197,94,0.4);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.06);
        }
        .inp-box.err-box { border-color: rgba(239,68,68,0.38); }
        .inp-icon { color: rgba(255,255,255,0.28); flex-shrink: 0; display: flex; }
        .inp-el {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 14px; font-family: var(--font-b);
        }
        .inp-el::placeholder { color: rgba(255,255,255,0.2); }
        .inp-eye {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.28); padding: 0; display: flex;
          transition: color .18s;
        }
        .inp-eye:hover { color: rgba(255,255,255,0.55); }
        .inp-err { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #f87171; }
        .inp-hint { font-size: 11.5px; color: rgba(255,255,255,0.28); }

        .phone-flag { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .phone-code { font-size: 13px; color: var(--text); font-weight: 500; }
        .phone-chevron { font-size: 11px; color: rgba(255,255,255,0.3); }
        .phone-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.1); flex-shrink: 0; }

        /* Submit */
        .sub-btn {
          width: 100%; padding: 12px 20px; border-radius: 12px;
          background: var(--green); border: none; color: #050d0a;
          font-size: 15px; font-weight: 700; font-family: var(--font-b);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background .2s, transform .15s; margin-top: 2px;
        }
        .sub-btn:hover:not(:disabled) { background: #1db851; transform: translateY(-1px); }
        .sub-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .sub-btn.sending {
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.28);
          color: var(--green);
        }
        .sub-btn.sending .spinner {
          border: 2px solid rgba(34,197,94,0.2);
          border-top-color: var(--green);
        }

        /* Terms note */
        .terms-note {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 12px;
        }
        .terms-text { font-size: 11.5px; color: rgba(255,255,255,0.38); line-height: 1.5; }
        .terms-text a { color: rgba(255,255,255,0.65); text-decoration: underline; text-underline-offset: 2px; }
        .terms-text a:hover { color: var(--green); }

        .rp-foot { text-align: center; margin-top: 10px; font-size: 13px; color: rgba(255,255,255,0.38); }
        .rp-foot a { color: var(--green); text-decoration: none; font-weight: 700; }
        .rp-foot a:hover { text-decoration: underline; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(5,13,10,0.2);
          border-top-color: #050d0a;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          flex-shrink: 0;
        }

        /* ══ MOBILE ══════════════════════════════════════════════════ */
        @media (max-width: 860px) {
          .su-page { grid-template-columns: 1fr; }
          .lp {
            min-height: auto;
            padding: 0 20px 0;
          }
          .lp-mid { padding-top: 12px; }
          .blob-1, .blob-2 { display: none; }
          .lp-bottom { display: none; }
          .lp-sub { display: none; }
          .lp-headline { font-size: 28px; margin-bottom: 16px; }
          .rp { padding: 20px 16px 40px; min-height: auto; align-items: flex-start; }
          .rp-inner { max-width: 100%; }
          .rp-card { padding: 24px 18px; border-radius: 16px; }
          .rp-title { font-size: 24px; }
        }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0b1525 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      <div className="su-page">

        {/* ══ LEFT ══ */}
        <div className="lp">
          <div className="lp-arc" />
          <div className="blob blob-1" />
          <div className="blob blob-2" />

          {/* Logo */}
          <div className="lp-logo">
            <img src="/logo.png" alt="StageCheck" style={{ width: 34, height: 34 }} />
            <span className="lp-logo-name">Stage<span>Check</span></span>
          </div>

          {/* Middle: eyebrow + headline + sub */}
          <div className="lp-mid">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Your events. Your experience.
            </div>

            <h2 className="lp-headline">
              Discover.<br />
              Book.<br />
              <span className="accent">Experience.</span>
            </h2>
            <p className="lp-sub">
              Create your account and start discovering amazing events near you.
            </p>
          </div>

          {/* Bottom: features + social proof */}
          <div className="lp-bottom">
            <div className="feats">
              <div className="feat-row">
                <div className="feat-icon-box" style={{ background: 'rgba(34,197,94,0.14)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <div>
                  <div className="feat-title">Find Amazing Events</div>
                  <div className="feat-desc">Discover events that match your interests.</div>
                </div>
              </div>
              <div className="feat-row">
                <div className="feat-icon-box" style={{ background: 'rgba(139,92,246,0.16)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <div>
                  <div className="feat-title">Save &amp; Get Updates</div>
                  <div className="feat-desc">Save your favorite events and get notified.</div>
                </div>
              </div>
              <div className="feat-row">
                <div className="feat-icon-box" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <div className="feat-title">Secure &amp; Trusted</div>
                  <div className="feat-desc">Your data is protected and your experience is our priority.</div>
                </div>
              </div>
            </div>

            <div className="social-proof">
              <div className="avatars">
                {['https://i.pravatar.cc/32?img=11','https://i.pravatar.cc/32?img=22','https://i.pravatar.cc/32?img=33'].map((src, i) => (
                  <img key={i} src={src} alt="" className="avatar" />
                ))}
              </div>
              <span className="social-text">
                Join <strong>10,000+</strong> event lovers<br />across Nigeria.
              </span>
            </div>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="rp">
          <div className="rp-inner">
            <div className="rp-card">
              <h1 className="rp-title">Create an <span>account</span></h1>
              <p className="rp-sub">Join StageCheck and be part of unforgettable experiences.</p>

              <button className="g-btn" onClick={handleGoogle} disabled={googleLoading || loading} type="button">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                {googleLoading
                  ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} /> Redirecting...</>
                  : 'Continue with Google'
                }
              </button>

              <div className="divider">
                <div className="div-line" /><span className="div-text">or</span><div className="div-line" />
              </div>

              {serverError && (
                <div className="srv-err">
                  <FiAlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span className="srv-err-txt">{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="su-form" noValidate>
                <div className="inp-wrap">
                  <label className="inp-label">Full Name</label>
                  <div className={`inp-box${errors.fullName ? ' err-box' : ''}`}>
                    <span className="inp-icon"><FiUser size={15} /></span>
                    <input type="text" placeholder="Enter your full name" value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })} className="inp-el" />
                  </div>
                  {errors.fullName && <span className="inp-err"><FiAlertCircle size={11} />{errors.fullName}</span>}
                </div>

                <div className="inp-wrap">
                  <label className="inp-label">Email Address</label>
                  <div className={`inp-box${errors.email ? ' err-box' : ''}`}>
                    <span className="inp-icon"><FiMail size={15} /></span>
                    <input type="email" placeholder="Enter your email address" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} className="inp-el" />
                  </div>
                  {errors.email && <span className="inp-err"><FiAlertCircle size={11} />{errors.email}</span>}
                </div>

                <div className="inp-wrap">
                  <label className="inp-label">
                    Phone Number <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <PhoneInput value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                </div>

                <div className="inp-wrap">
                  <label className="inp-label">Password</label>
                  <div className={`inp-box${errors.password ? ' err-box' : ''}`}>
                    <span className="inp-icon"><FiLock size={15} /></span>
                    <input type={showPw ? 'text' : 'password'} placeholder="Create a password"
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="inp-el" autoComplete="new-password" />
                    <button type="button" className="inp-eye" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.password
                    ? <span className="inp-err"><FiAlertCircle size={11} />{errors.password}</span>
                    : <span className="inp-hint">At least 8 characters with a number and letter.</span>
                  }
                </div>

                <button
                  type="submit"
                  className={`sub-btn${loading ? ' sending' : ''}`}
                  disabled={loading || googleLoading}
                >
                  {loading
                    ? <><span className="spinner" /> Sending verification code...</>
                    : <>Create Account <FiArrowRight size={16} /></>
                  }
                </button>
              </form>

              <div className="terms-note">
                <FiLock size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span className="terms-text">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms">Terms of Service</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>.
                </span>
              </div>

              <p className="rp-foot">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}