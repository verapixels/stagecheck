import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiAlertCircle,
  FiArrowRight, FiShield, FiCheck
} from 'react-icons/fi'
import { BsTicketPerforated, BsHeartPulse, BsCalendar2Check } from 'react-icons/bs'
import { useAuth } from '../context/Authcontext'

// ─── Phone input with country code ───────────────────────────────────────────
function PhoneInput({
  value, onChange
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inp-box">
      <span className="inp-icon"><FiPhone size={15} /></span>
      <div className="phone-flag">
        <img
          src="https://flagcdn.com/w20/ng.png"
          alt="NG"
          style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 2 }}
        />
        <span className="phone-code">+234</span>
        <span className="phone-chevron">&#8964;</span>
      </div>
      <div className="phone-sep" />
      <input
        type="tel"
        placeholder="801 234 5678"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="inp-el"
      />
    </div>
  )
}

// ─── Feature row ─────────────────────────────────────────────────────────────
function FeatureRow({
  icon, title, desc, accent
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent: string
}) {
  return (
    <div className="feat-row">
      <div className="feat-icon-box" style={{ background: accent }}>
        {icon}
      </div>
      <div>
        <div className="feat-title">{title}</div>
        <div className="feat-desc">{desc}</div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth()

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [agreed, setAgreed] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'At least 8 characters with a number and letter'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!agreed) e.agreed = 'You must agree to the terms'
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
      if (code === 'auth/email-already-in-use') setServerError('An account with this email already exists.')
      else if (code === 'auth/weak-password') setServerError('Password is too weak.')
      else if (code === 'auth/network-request-failed') setServerError('Network error. Check your connection.')
      else setServerError('Something went wrong. Please try again.')
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
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #22C55E;
          --green-glow: rgba(34,197,94,0.35);
          --bg: #0b1120;
          --bg-left: #0c1222;
          --card: #111827;
          --card-border: rgba(255,255,255,0.08);
          --text: #ffffff;
          --muted: rgba(255,255,255,0.5);
          --muted2: rgba(255,255,255,0.3);
          --inp-bg: rgba(255,255,255,0.04);
          --inp-border: rgba(255,255,255,0.1);
          --font-d: 'Syne', sans-serif;
          --font-b: 'DM Sans', sans-serif;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-20px) scale(1.05); }
          66% { transform: translate(-15px,15px) scale(0.95); }
        }
        @keyframes ticketFloat {
          0%,100% { transform: translateY(0px) rotate(-8deg); }
          50% { transform: translateY(-12px) rotate(-8deg); }
        }

        .su-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          font-family: var(--font-b);
        }

        /* ── LEFT PANEL ── */
          .lp {
  position: relative;
  overflow: hidden;
  background: var(--bg-left);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 40px;
  padding: 40px 44px;
  min-height: 100vh;
}
        .lp-blob-1 {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%);
          top: -120px; left: -80px;
          animation: blobFloat 9s ease-in-out infinite;
        }
        .lp-blob-2 {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          bottom: 20%; right: -60px;
          animation: blobFloat 12s ease-in-out infinite reverse;
        }
        .lp-top { position: relative; z-index: 2; }
        .lp-logo { display: flex; align-items: center; gap: 10px; }
        .lp-logo img { height: 32px; object-fit: contain; }

        .lp-mid { position: relative; z-index: 2; }
        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          border-radius: 100px; padding: 5px 14px; margin-bottom: 24px;
          font-size: 11px; font-weight: 600; color: var(--green); letter-spacing: .04em;
        }
        .lp-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
        .lp-headline {
          font-family: var(--font-d);
          font-size: clamp(30px, 3vw, 46px);
          font-weight: 800;
          line-height: 1.08;
          color: var(--text);
          letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .lp-headline .accent { color: var(--green); }
        .lp-sub {
          font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 360px;
          margin-bottom: 32px;
        }
        .feats { display: flex; flex-direction: column; gap: 16px; }
        .feat-row { display: flex; align-items: flex-start; gap: 14px; }
        .feat-icon-box {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .feat-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
        .feat-desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; }

      .lp-bot { display: none; }
        .lp-ticket-wrap { display: none; }
        .lp-signin-link {
          font-size: 13px; color: var(--muted);
        }
        .lp-signin-link a { color: var(--green); font-weight: 600; text-decoration: none; }
        .lp-signin-link a:hover { text-decoration: underline; }

        /* ── RIGHT PANEL ── */
        .rp {
          display: flex; align-items: center; justify-content: center;
          padding: clamp(24px, 5vh, 48px) clamp(20px, 4vw, 48px);
          background: var(--bg);
          min-height: 100vh;
          overflow-y: auto;
        }
        .rp-inner { width: 100%; max-width: 460px; }
        .rp-card {
          background: #0e1829;
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }
        .rp-title {
          font-family: var(--font-d); font-size: 26px; font-weight: 800;
          color: var(--text); margin-bottom: 6px; letter-spacing: -.5px;
        }
        .rp-sub { font-size: 13.5px; color: var(--muted); margin-bottom: 24px; }

        /* Google btn */
        .g-btn {
          width: 100%; padding: 12px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text); font-size: 14px; font-weight: 500; font-family: var(--font-b);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all .2s; margin-bottom: 20px;
        }
        .g-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
        .g-btn:disabled { opacity: .6; cursor: not-allowed; }

        /* Divider */
        .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .div-text { font-size: 12px; color: rgba(255,255,255,0.3); white-space: nowrap; }

        /* Error banner */
        .srv-err {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 11px 14px; margin-bottom: 16px;
        }
        .srv-err-txt { font-size: 13px; color: #f87171; }

        /* Form */
        .su-form { display: flex; flex-direction: column; gap: 14px; }
        .inp-wrap { display: flex; flex-direction: column; gap: 6px; }
        .inp-label { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.65); }
        .inp-box {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 0 14px; height: 48px;
          transition: border-color .2s, box-shadow .2s;
        }
        .inp-box:focus-within {
          border-color: rgba(34,197,94,0.45);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.07);
        }
        .inp-box.err-box { border-color: rgba(239,68,68,0.4); }
        .inp-icon { color: rgba(255,255,255,0.3); flex-shrink: 0; display: flex; align-items: center; }
        .inp-el {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 14px; font-family: var(--font-b);
        }
        .inp-el::placeholder { color: rgba(255,255,255,0.22); }
        .inp-eye {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); padding: 0; display: flex; align-items: center;
          transition: color .2s;
        }
        .inp-eye:hover { color: rgba(255,255,255,0.6); }
        .inp-err { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #f87171; }

        /* Phone */
        .phone-flag { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .phone-code { font-size: 13px; color: var(--text); font-weight: 500; }
        .phone-chevron { font-size: 11px; color: var(--muted2); }
        .phone-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.12); flex-shrink: 0; }

        /* Hint */
        .inp-hint { font-size: 11.5px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        /* Checkbox */
        .agree-row { display: flex; align-items: flex-start; gap: 10px; }
        .agree-cb {
          width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.04);
          cursor: pointer; appearance: none; -webkit-appearance: none;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px; transition: all .15s;
        }
        .agree-cb:checked { background: var(--green); border-color: var(--green); }
        .agree-cb:checked::after {
          content: '';
          display: block; width: 5px; height: 9px;
          border: 2px solid #0b1120; border-top: none; border-left: none;
          transform: rotate(45deg) translateY(-1px);
        }
        .agree-text { font-size: 12.5px; color: var(--muted); line-height: 1.6; }
        .agree-text a { color: var(--green); text-decoration: none; font-weight: 600; }
        .agree-text a:hover { text-decoration: underline; }
        .agree-err { font-size: 11.5px; color: #f87171; margin-top: 3px; }

        /* Submit */
        .sub-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          background: var(--green); border: none; color: #0b1120;
          font-size: 15px; font-weight: 700; font-family: var(--font-b);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all .2s; margin-top: 4px;
          box-shadow: 0 0 28px rgba(34,197,94,0.3);
        }
        .sub-btn:hover:not(:disabled) {
          background: #1da34a; box-shadow: 0 0 40px rgba(34,197,94,0.45);
          transform: translateY(-1px);
        }
        .sub-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }

        /* Security note */
        .sec-note {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.12);
          border-radius: 10px; padding: 11px 13px; margin-top: 16px;
        }
        .sec-note-txt { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* Footer */
        .rp-foot { text-align: center; margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.4); }
        .rp-foot a { color: var(--green); text-decoration: none; font-weight: 600; }
        .rp-foot a:hover { text-decoration: underline; }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(11,17,32,0.25);
          border-top-color: #0b1120;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          flex-shrink: 0;
        }

        /* ── MOBILE ── */
        @media (max-width: 860px) {
  .su-page { grid-template-columns: 1fr; }
  .lp { display: none; }
  .rp { padding: 24px 16px 40px; min-height: 100vh; }
  .rp-card { padding: 28px 20px; border-radius: 16px; }
}
      `}</style>

      <div className="su-page">
        {/* ── LEFT ── */}
        <div className="lp">
          <div className="lp-blob-1" />
          <div className="lp-blob-2" />

          <div className="lp-mid">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Your events, your experience
            </div>
            <h2 className="lp-headline">
              Discover.<br />
              Book.<br />
              <span className="accent">Experience.</span>
            </h2>
            <p className="lp-sub">
              Create your account and start discovering amazing events near you.
            </p>
            <div className="feats">
              <FeatureRow
                icon={<BsTicketPerforated size={20} />}
                title="Find Amazing Events"
                desc="Discover events that match your interests."
                accent="rgba(34,197,94,0.18)"
              />
              <FeatureRow
                icon={<BsHeartPulse size={20} />}
                title="Save & Get Updates"
                desc="Save events and get notified about what you love."
                accent="rgba(139,92,246,0.2)"
              />
              <FeatureRow
                icon={<BsCalendar2Check size={20} />}
                title="Secure Ticketing"
                desc="Book tickets securely and hassle-free."
                accent="rgba(59,130,246,0.18)"
              />
            </div>
          </div>

          <div className="lp-bot">
            
            <div className="lp-signin-link">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="rp">
          <div className="rp-inner">
            <div className="rp-card">
              <h1 className="rp-title">Create an account</h1>
              <p className="rp-sub">Join StageCheck and be part of unforgettable experiences.</p>

              {/* Google */}
              <button className="g-btn" onClick={handleGoogle} disabled={googleLoading} type="button">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                {googleLoading ? <><span className="spinner" /> Redirecting...</> : 'Continue with Google'}
              </button>

              <div className="divider">
                <div className="div-line" />
                <span className="div-text">or</span>
                <div className="div-line" />
              </div>

              {serverError && (
                <div className="srv-err">
                  <FiAlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span className="srv-err-txt">{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="su-form" noValidate>
                {/* Full Name */}
                <div className="inp-wrap">
                  <label className="inp-label">Full Name</label>
                  <div className={`inp-box ${errors.fullName ? 'err-box' : ''}`}>
                    <span className="inp-icon"><FiUser size={15} /></span>
                    <input
                      type="text" placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      className="inp-el"
                    />
                  </div>
                  {errors.fullName && <span className="inp-err"><FiAlertCircle size={11} />{errors.fullName}</span>}
                </div>

                {/* Email */}
                <div className="inp-wrap">
                  <label className="inp-label">Email Address</label>
                  <div className={`inp-box ${errors.email ? 'err-box' : ''}`}>
                    <span className="inp-icon"><FiMail size={15} /></span>
                    <input
                      type="email" placeholder="Enter your email address"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="inp-el"
                    />
                  </div>
                  {errors.email && <span className="inp-err"><FiAlertCircle size={11} />{errors.email}</span>}
                </div>

                {/* Phone */}
                <div className="inp-wrap">
                  <label className="inp-label">Phone Number</label>
                  <PhoneInput value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                </div>

                {/* Password */}
                <div className="inp-wrap">
                  <label className="inp-label">Password</label>
                  <div className={`inp-box ${errors.password ? 'err-box' : ''}`}>
                    <span className="inp-icon"><FiLock size={15} /></span>
                    <input
                      type={showPw ? 'text' : 'password'} placeholder="Create a password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="inp-el"
                      autoComplete="new-password"
                    />
                    <button type="button" className="inp-eye" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.password
                    ? <span className="inp-err"><FiAlertCircle size={11} />{errors.password}</span>
                    : <span className="inp-hint">At least 8 characters with a number and letter.</span>
                  }
                </div>

                {/* Confirm Password */}
                <div className="inp-wrap">
                  <label className="inp-label">Confirm Password</label>
                  <div className={`inp-box ${errors.confirmPassword ? 'err-box' : ''}`}>
                    <span className="inp-icon"><FiLock size={15} /></span>
                    <input
                      type={showCpw ? 'text' : 'password'} placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      className="inp-el"
                      autoComplete="new-password"
                    />
                    <button type="button" className="inp-eye" onClick={() => setShowCpw(v => !v)}>
                      {showCpw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="inp-err"><FiAlertCircle size={11} />{errors.confirmPassword}</span>}
                </div>

                {/* Terms */}
                <div>
                  <div className="agree-row">
                    <input
                      type="checkbox" className="agree-cb"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      id="agree-cb"
                    />
                    <label htmlFor="agree-cb" className="agree-text">
                      I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
                      <Link to="/privacy">Privacy Policy</Link>
                    </label>
                  </div>
                  {errors.agreed && <div className="agree-err">{errors.agreed}</div>}
                </div>

                <button type="submit" className="sub-btn" disabled={loading}>
                  {loading
                    ? <><span className="spinner" /> Creating account...</>
                    : 'Create Account'
                  }
                </button>
              </form>

              {/* Security note */}
              <div className="sec-note">
                <FiShield size={15} color="rgba(34,197,94,0.7)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span className="sec-note-txt">
                  Your information is safe with us. We never share your data with third parties.
                </span>
              </div>
            </div>

            <p className="rp-foot">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}