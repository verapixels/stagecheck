import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

export default function AuthInput({ label, error, icon, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)', display: 'flex', pointerEvents: 'none',
          }}>{icon}</div>
        )}
        <input
          type={inputType}
          style={{
            width: '100%', padding: `12px ${isPassword ? '44px' : '14px'} 12px ${icon ? '40px' : '14px'}`,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, color: '#fff',
            fontSize: 15, fontFamily: 'var(--font-body)',
            outline: 'none', transition: 'border-color 0.2s, background 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.5)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', padding: 2, display: 'flex',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <span style={{ fontSize: 12, color: '#F87171', fontFamily: 'var(--font-body)' }}>{error}</span>
      )}
    </div>
  )
}