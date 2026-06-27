// src/pages/VerifyEmailPage.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiHelpCircle, FiShield, FiCheck, FiClock, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../context/Authcontext'

const FUNCTIONS_BASE = 'https://us-central1-stagecheck-699c7.cloudfunctions.net'
const CODE_LENGTH = 6
const EXPIRY_SECONDS = 600 // 10 min
const RESEND_COOLDOWN = 60

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 3)
  return `${visible}***@${domain}`
}

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signUp } = useAuth()

  // Passed from signup page via navigation state
  const { email = '', password = '', fullName = '' } = (location.state as any) || {}
  const firstName = fullName.split(' ')[0] || 'there'

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS)
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [sending, setSending] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Count down expiry timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  // Count down resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) { setCanResend(true); return }
    const t = setInterval(() => setResendCooldown(s => {
      if (s <= 1) { setCanResend(true); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const progressPct = Math.max(0, (timeLeft / EXPIRY_SECONDS) * 100)

  const handleDigitInput = useCallback((index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = cleaned
    setDigits(next)
    setError('')
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
      setActiveIndex(index + 1)
    }
  }, [digits])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next)
      } else if (index > 0) {
        const next = [...digits]; next[index - 1] = ''; setDigits(next)
        inputRefs.current[index - 1]?.focus()
        setActiveIndex(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus(); setActiveIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus(); setActiveIndex(index + 1)
    }
  }, [digits])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    setError('')
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
    setActiveIndex(focusIdx)
  }, [])

  const handleVerify = async () => {
    const code = digits.join('')
    if (code.length < CODE_LENGTH) { setError('Please enter all 6 digits.'); return }
    if (timeLeft <= 0) { setError('Your code has expired. Please request a new one.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/verifyEmailCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Incorrect code. Please try again.'); setLoading(false); return }

      // Code verified — create account
      const { error: authError } = await signUp(email, password, fullName)
      if (authError) {
        const code = (authError as any)?.code || ''
        if (code === 'auth/email-already-in-use') setError('This email is already registered. Try logging in.')
        else setError('Account creation failed. Please try again.')
        setLoading(false); return
      }
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || sending) return
    setSending(true); setError('')
    try {
      await fetch(`${FUNCTIONS_BASE}/sendVerificationCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      })
      setTimeLeft(EXPIRY_SECONDS)
      setResendCooldown(RESEND_COOLDOWN)
      setCanResend(false)
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      setActiveIndex(0)
    } catch {
      setError('Failed to resend. Please try again.')
    }
    setSending(false)
  }

  const isExpired = timeLeft <= 0
  const isComplete = digits.every(d => d !== '')

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
          --green-dim: rgba(34,197,94,0.15);
          --green-border: rgba(34,197,94,0.3);
          --green-glow: rgba(34,197,94,0.25);
          --bg: #030d1a;
          --card-bg: #0a1628;
          --card-border: rgba(255,255,255,0.08);
          --text: #ffffff;
          --muted: rgba(255,255,255,0.55);
          --muted2: rgba(255,255,255,0.35);
          --muted3: rgba(255,255,255,0.2);
          --font-d: 'Syne', sans-serif;
          --font-b: 'DM Sans', sans-serif;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        .vp {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font-b);
          display: grid;
          grid-template-rows: auto 1fr auto;
        }

        /* ── NAVBAR ── */
        .vp-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .vp-logo { display: flex; align-items: center; gap: 10px; }
        .vp-logo img { height: 30px; }
        .vp-help {
          display: flex; align-items: center; gap: 7px;
          color: var(--muted); font-size: 13.5px; font-weight: 500;
          text-decoration: none; transition: color .2s;
        }
        .vp-help:hover { color: var(--text); }

        /* ── MAIN ── */
        .vp-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 0;
        }

        /* ── LEFT IMAGE PANEL ── */
        .vp-left {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 40px;
          background: #040e1c;
        }
        .vp-left-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.85;
        }
        .vp-left-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(3,13,26,0.92) 0%, rgba(3,13,26,0.3) 60%, rgba(3,13,26,0.1) 100%);
        }
        .vp-left-content {
          position: relative; z-index: 2;
          margin-top: auto;
        }
        .vp-trusted {
          display: flex; align-items: flex-start; gap: 14px;
          background: rgba(10,22,40,0.75);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 14px; padding: 16px 18px;
          backdrop-filter: blur(12px);
        }
        .vp-trusted-icon {
          width: 40px; height: 40px; flex-shrink: 0;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.3);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--green);
        }
        .vp-trusted-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .vp-trusted-desc { font-size: 12.5px; color: var(--muted); line-height: 1.55; }

        /* ── RIGHT CARD PANEL ── */
        .vp-right {
          display: flex; align-items: center; justify-content: center;
          padding: clamp(24px, 4vh, 48px) clamp(20px, 4vw, 48px);
          overflow-y: auto;
        }
        .vp-card {
          width: 100%; max-width: 500px;
          background: #0a1628;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          animation: fadeUp .4s ease both;
        }
        .vp-card-top { height: 4px; background: linear-gradient(90deg, var(--green), #14B8A6, var(--green)); }

        .vp-card-body { padding: 36px 32px 28px; }

        /* Icon circle */
        .vp-icon-wrap {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(34,197,94,0.1);
          border: 1.5px solid rgba(34,197,94,0.3);
          display: flex; align-items: center; justify-content: center;
          color: var(--green);
          margin: 0 auto 20px;
        }
        .vp-title {
          font-family: var(--font-d);
          font-size: clamp(24px, 3vw, 30px);
          font-weight: 800;
          color: var(--text);
          text-align: center;
          letter-spacing: -.5px;
          margin-bottom: 8px;
        }
        .vp-title .accent { color: var(--green); }
        .vp-subtitle {
          font-size: 13.5px; color: var(--muted);
          text-align: center; line-height: 1.65;
          margin-bottom: 4px;
        }
        .vp-email-display {
          text-align: center; font-size: 14px; font-weight: 700;
          color: var(--text); margin-bottom: 6px;
        }
        .vp-change {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          font-size: 12.5px; color: #818cf8; text-decoration: none;
          font-weight: 500; margin-bottom: 28px; transition: opacity .2s;
        }
        .vp-change:hover { opacity: .75; }

        /* Digit inputs */
        .vp-digits {
          display: flex; gap: 8px; justify-content: center;
          margin-bottom: 20px;
        }
        .vp-digit {
          width: 60px; height: 68px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-size: 28px; font-weight: 800;
          color: var(--text);
          text-align: center;
          font-family: var(--font-b);
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
          caret-color: var(--green);
        }
        .vp-digit:focus, .vp-digit.active {
          border-color: var(--green);
          background: rgba(34,197,94,0.06);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
        }
        .vp-digit.filled {
          border-color: rgba(34,197,94,0.4);
        }
        .vp-digit.error-state {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.05);
        }

        /* Timer */
        .vp-timer {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; color: var(--muted2);
          margin-bottom: 10px;
        }
        .vp-timer-val { color: var(--green); font-weight: 700; font-variant-numeric: tabular-nums; }
        .vp-timer-val.expiring { color: #f87171; }
        .vp-progress-bar {
          height: 3px; background: rgba(255,255,255,0.08);
          border-radius: 2px; margin-bottom: 24px; overflow: hidden;
        }
        .vp-progress-fill {
          height: 100%; border-radius: 2px;
          background: var(--green);
          transition: width .9s linear, background .3s;
        }
        .vp-progress-fill.expiring { background: #f87171; }

        /* Error */
        .vp-error {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 10px 14px;
          font-size: 13px; color: #f87171;
          margin-bottom: 16px;
        }

        /* Verify btn */
        .vp-btn {
          width: 100%; height: 52px; border-radius: 13px;
          background: var(--green); border: none;
          color: #030d1a; font-size: 15px; font-weight: 700;
          font-family: var(--font-b);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all .2s;
          box-shadow: 0 0 32px rgba(34,197,94,0.28);
          margin-bottom: 20px;
        }
        .vp-btn:hover:not(:disabled) {
          background: #16a34a;
          box-shadow: 0 0 44px rgba(34,197,94,0.4);
          transform: translateY(-1px);
        }
        .vp-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .vp-btn.success-state { background: var(--green); animation: pulse-green 1s ease; }

        /* Resend */
        .vp-resend { text-align: center; margin-bottom: 0; }
        .vp-resend-text { font-size: 13px; color: var(--muted); margin-bottom: 3px; }
        .vp-resend-action {
          font-size: 13px; font-weight: 600;
        }
        .vp-resend-btn {
          background: none; border: none; cursor: pointer;
          color: var(--green); font-size: 13px; font-weight: 600;
          font-family: var(--font-b); padding: 0;
          transition: opacity .2s;
        }
        .vp-resend-btn:disabled { color: var(--muted2); cursor: not-allowed; }
        .vp-resend-btn:not(:disabled):hover { opacity: .75; }
        .vp-countdown { color: var(--green); font-weight: 700; }

        /* Security + divider */
        .vp-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 24px 0 0; }
        .vp-security {
          padding: 20px 32px 28px;
          display: flex; align-items: flex-start; gap: 14px;
        }
        .vp-sec-icon {
          width: 44px; height: 44px; flex-shrink: 0;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #818cf8;
        }
        .vp-sec-title { font-size: 13.5px; font-weight: 700; color: #818cf8; margin-bottom: 8px; }
        .vp-sec-item {
          display: flex; align-items: flex-start; gap: 7px;
          font-size: 12.5px; color: var(--muted);
          line-height: 1.5; margin-bottom: 5px;
        }
        .vp-sec-item:last-child { margin-bottom: 0; }
        .vp-sec-check { color: var(--green); flex-shrink: 0; margin-top: 1px; }

        /* Card bottom bar */
        .vp-card-bot { height: 4px; background: linear-gradient(90deg, #14B8A6, var(--green), #14B8A6); }

        /* Footer */
        .vp-footer {
          padding: 16px 32px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .vp-footer-lock { color: var(--green); display: flex; align-items: center; }
        .vp-footer-text { font-size: 12px; color: var(--muted3); }
        .vp-footer-copy { font-size: 12px; color: var(--muted3); }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(3,13,26,0.3);
          border-top-color: #030d1a;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          flex-shrink: 0;
        }

        /* Success check */
        .check-circle {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(3,13,26,0.2);
          display: flex; align-items: center; justify-content: center;
          animation: checkPop .4s ease both;
        }

        /* ── MOBILE ── */
        @media (max-width: 800px) {
          .vp-main { grid-template-columns: 1fr; }
          .vp-left { display: none; }
          .vp-nav { padding: 14px 20px; flex-direction: column; align-items: center; gap: 12px; }
          .vp-logo-mobile { display: flex; flex-direction: column; align-items: center; gap: 6px; }
          .vp-logo-mobile img { height: 40px; }
          .vp-logo-mobile-name {
            font-family: var(--font-d);
            font-size: 18px; font-weight: 800;
            letter-spacing: 1px;
          }
          .vp-logo-mobile-name .g { color: var(--green); }
          .vp-right { padding: 20px 16px 32px; align-items: flex-start; padding-top: 24px; }
          .vp-card { border-radius: 16px; }
          .vp-card-body { padding: 28px 20px 22px; }
          .vp-digit { width: 48px; height: 58px; font-size: 24px; border-radius: 10px; }
          .vp-digits { gap: 6px; }
          .vp-security { padding: 16px 20px 24px; }
          .vp-footer { padding: 14px 20px; flex-wrap: wrap; justify-content: center; gap: 4px; }
          .vp-help-mobile { display: flex; }
          .vp-help-desktop { display: none; }
        }
        @media (min-width: 801px) {
          .vp-logo-mobile { display: none; }
          .vp-help-mobile { display: none; }
          .vp-help-desktop { display: flex; }
        }
      `}</style>

      <div className="vp">
        {/* NAV */}
        <nav className="vp-nav">
          {/* Desktop logo */}
          <div className="vp-logo" style={{ display: 'flex' }}>
            <img src="/logo.png" alt="StageCheck" />
          </div>
          {/* Mobile logo (centered column) */}
          <div className="vp-logo-mobile">
            <img src="/logo.png" alt="StageCheck" />
            <div className="vp-logo-mobile-name">
              <span className="g">STAGE</span>CHECK
            </div>
          </div>
          <a href="mailto:support@stagecheck.com.ng" className="vp-help vp-help-desktop">
            <FiHelpCircle size={15} /> Need Help?
          </a>
          <a href="mailto:support@stagecheck.com.ng" className="vp-help vp-help-mobile">
            <FiHelpCircle size={15} /> Need Help?
          </a>
        </nav>

        {/* MAIN */}
        <main className="vp-main">
          {/* LEFT — desktop only */}
          <div className="vp-left">
            <img src="/desktop_sideimage.png" alt="" className="vp-left-img" />
            <div className="vp-left-overlay" />
            <div className="vp-left-content">
              <div className="vp-trusted">
                <div className="vp-trusted-icon">
                  <FiShield size={20} />
                </div>
                <div>
                  <div className="vp-trusted-title">Trusted by organizers.</div>
                  <div className="vp-trusted-desc">
                    StageCheck is built to make event registration, ticketing and check-in secure, simple and seamless.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — verification card */}
          <div className="vp-right">
            <div className="vp-card">
              <div className="vp-card-top" />

              <div className="vp-card-body">
                {/* Icon */}
                <div className="vp-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    <path d="M14 13.5 22 20M10 13.5 2 20"/>
                  </svg>
                </div>

                {/* Title */}
                <h1 className="vp-title">
                  Verify <span className="accent">Your Email</span>
                </h1>
                <p className="vp-subtitle">We've sent a 6 digit verification code to</p>
                <div className="vp-email-display">{maskEmail(email)}</div>
                <Link to="/signup" state={{ email, password, fullName }} className="vp-change">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Change email
                </Link>

                {/* Digit inputs */}
                <div className="vp-digits" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      className={`vp-digit${activeIndex === i ? ' active' : ''}${d ? ' filled' : ''}${error ? ' error-state' : ''}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitInput(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onFocus={() => setActiveIndex(i)}
                      autoFocus={i === 0}
                      disabled={success}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="vp-timer">
                  <FiClock size={13} />
                  <span>Code expires in</span>
                  <span className={`vp-timer-val${timeLeft < 60 ? ' expiring' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="vp-progress-bar">
                  <div
                    className={`vp-progress-fill${timeLeft < 60 ? ' expiring' : ''}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Error */}
                {error && <div className="vp-error">{error}</div>}

                {/* Button */}
                <button
                  className={`vp-btn${success ? ' success-state' : ''}`}
                  onClick={handleVerify}
                  disabled={loading || success || isExpired || !isComplete}
                >
                  {success ? (
                    <><div className="check-circle"><FiCheck size={12} /></div> Verified! Redirecting...</>
                  ) : loading ? (
                    <><span className="spinner" /> Verifying...</>
                  ) : (
                    <>Verify Email <span style={{ fontSize: 18 }}>→</span></>
                  )}
                </button>

                {/* Resend */}
                <div className="vp-resend">
                  <div className="vp-resend-text">Didn't receive a code?</div>
                  {canResend ? (
                    <button className="vp-resend-btn" onClick={handleResend} disabled={sending}>
                      {sending ? <><FiRefreshCw size={12} style={{ display: 'inline', marginRight: 4 }} />Sending...</> : 'Resend code'}
                    </button>
                  ) : (
                    <span className="vp-resend-action" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                      Resend code in <span className="vp-countdown">{resendCooldown}</span> seconds
                    </span>
                  )}
                </div>
              </div>

              {/* Security tips */}
              <div className="vp-divider" />
              <div className="vp-security">
                <div className="vp-sec-icon">
                  <FiShield size={20} />
                </div>
                <div>
                  <div className="vp-sec-title">Security Tips</div>
                  <div className="vp-sec-item">
                    <FiCheck size={13} className="vp-sec-check" style={{ color: '#22C55E', flexShrink: 0, marginTop: 1 }} />
                    Never share your verification code with anyone.
                  </div>
                  <div className="vp-sec-item">
                    <FiCheck size={13} style={{ color: '#22C55E', flexShrink: 0, marginTop: 1 }} />
                    StageCheck will never ask for your code via phone, email or chat.
                  </div>
                </div>
              </div>

              <div className="vp-card-bot" />
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="vp-footer">
          <span className="vp-footer-lock">
            <FiShield size={13} />
          </span>
          <span className="vp-footer-text">Your security is our priority</span>
          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 12 }}>·</span>
          <span className="vp-footer-copy">&copy; {new Date().getFullYear()} StageCheck. All rights reserved.</span>
        </footer>
      </div>
    </>
  )
}