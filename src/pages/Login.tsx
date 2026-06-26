import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiZap
} from 'react-icons/fi'
import { BsTicketPerforated, BsBookmark, BsBellFill } from 'react-icons/bs'
import { useAuth } from '../context/Authcontext'

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

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await signInWithGoogle(true)
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
          --text: #ffffff;
          --muted: rgba(255,255,255,0.5);
          --muted2: rgba(255,255,255,0.3);
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

        .li-page {
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
          justify-content: space-between;
          padding: 40px 44px 48px;
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
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
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

        .lp-bot { position: relative; z-index: 2; }
        .lp-ticket-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
        .lp-ticket {
          width: 220px; height: 220px; object-fit: contain;
          animation: ticketFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 0 40px rgba(34,197,94,0.25));
        }
        .lp-signup-link { font-size: 13px; color: var(--muted); }
        .lp-signup-link a { color: var(--green); font-weight: 600; text-decoration: none; }
        .lp-signup-link a:hover { text-decoration: underline; }

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
          border: 1px solid rgba(255,255,255,0.08);
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

        /* Error */
        .err-banner {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 11px 14px; margin-bottom: 16px;
          font-size: 13px; color: #f87171;
        }

        /* Form */
        .li-form { display: flex; flex-direction: column; gap: 16px; }
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

        /* Remember / Forgot row */
        .rem-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .rem-left { display: flex; align-items: center; gap: 8px; }
        .rem-cb {
          width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.04);
          cursor: pointer; appearance: none; -webkit-appearance: none;
          transition: all .15s;
        }
        .rem-cb:checked { background: var(--green); border-color: var(--green); }
        .rem-cb:checked::after {
          content: '';
          display: block; width: 5px; height: 9px;
          border: 2px solid #0b1120; border-top: none; border-left: none;
          transform: rotate(45deg) translateY(-1px);
          margin: 0 auto;
        }
        .rem-label { font-size: 13px; color: var(--muted); cursor: pointer; user-select: none; }
        .forgot-link { font-size: 13px; color: var(--green); font-weight: 600; text-decoration: none; }
        .forgot-link:hover { text-decoration: underline; }

        /* Submit */
        .sub-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          background: var(--green); border: none; color: #0b1120;
          font-size: 15px; font-weight: 700; font-family: var(--font-b);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all .2s;
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

        /* Input autofill fix */
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0e1829 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        input::placeholder { color: rgba(255,255,255,0.22); }

        /* ── MOBILE ── */
        @media (max-width: 860px) {
          .li-page { grid-template-columns: 1fr; }
          .lp {
            min-height: unset; padding: 28px 24px 32px;
            flex-direction: column; gap: 24px;
          }
          .lp-ticket-wrap { margin-bottom: 0; }
          .lp-ticket { width: 160px; height: 160px; }
          .lp-headline { font-size: 28px; }
          .rp { padding: 24px 16px 40px; }
          .rp-card { padding: 28px 20px; border-radius: 16px; }
        }
      `}</style>

      <div className="li-page">
        {/* ── LEFT ── */}
        <div className="lp">
          <div className="lp-blob-1" />
          <div className="lp-blob-2" />

          <div className="lp-top">
            <div className="lp-logo">
              <img src="/Stagechecklogo.png" alt="StageCheck" />
            </div>
          </div>

          <div className="lp-mid">
            <div className="lp-eyebrow">
              <FiZap size={11} fill="currentColor" />
              Your events, your experience
            </div>
            <h2 className="lp-headline">
              Discover.<br />
              Book.<br />
              <span className="accent">Experience.</span>
            </h2>
            <p className="lp-sub">
              Log in to your account and manage your events, tickets and more.
            </p>
            <div className="feats">
              <FeatureRow
                icon={<BsTicketPerforated size={20} />}
                title="Access Your Tickets"
                desc="View, download and manage all your tickets in one place."
                accent="rgba(34,197,94,0.18)"
              />
              <FeatureRow
                icon={<BsBookmark size={20} />}
                title="Save Your Favorites"
                desc="Save events you love and never miss out."
                accent="rgba(139,92,246,0.2)"
              />
              <FeatureRow
                icon={<BsBellFill size={18} />}
                title="Stay Updated"
                desc="Get notifications and updates about upcoming events."
                accent="rgba(59,130,246,0.18)"
              />
            </div>
          </div>

          <div className="lp-bot">
            <div className="lp-ticket-wrap">
              <img
                src="/ticket-glow.png"
                alt="StageCheck Ticket"
                className="lp-ticket"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="lp-signup-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="rp">
          <div className="rp-inner">
            <div className="rp-card">
              <h1 className="rp-title">Welcome back</h1>
              <p className="rp-sub">Log in to continue to your StageCheck account.</p>

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

              {error && <div className="err-banner">{error}</div>}

              <form onSubmit={handleSubmit} className="li-form" noValidate>
                {/* Email */}
                <div className="inp-wrap">
                  <label className="inp-label">Email Address</label>
                  <div className="inp-box">
                    <span className="inp-icon"><FiMail size={15} /></span>
                    <input
                      type="email" placeholder="Enter your email address"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="inp-el"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="inp-wrap">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="inp-label">Password</label>
                    <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                  </div>
                  <div className="inp-box">
                    <span className="inp-icon"><FiLock size={15} /></span>
                    <input
                      type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="inp-el"
                      required
                    />
                    <button type="button" className="inp-eye" onClick={() => setShowPassword(s => !s)}>
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="rem-row">
                  <div className="rem-left">
                    <input
                      type="checkbox" className="rem-cb"
                      id="rem-cb"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="rem-cb" className="rem-label">Remember me</label>
                  </div>
                </div>

                <button type="submit" className="sub-btn" disabled={loading}>
                  {loading
                    ? <><span className="spinner" /> Signing in...</>
                    : 'Log In'
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
              Don't have an account? <Link to="/signup">Sign up free</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}