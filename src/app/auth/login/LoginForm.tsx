'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6B5B4E',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5DDD0',
  borderRadius: '8px',
  background: '#FFFFFF',
  color: '#1A1208',
  fontSize: '17px',
  padding: '12px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard/brand'
  const linkExpired = searchParams.get('error') === 'link_expired'
  const resetSuccess = searchParams.get('reset') === 'success'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Incorrect email or password.')
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {linkExpired && (
        <div style={{ border: '1px solid rgba(184,151,90,0.3)', background: 'rgba(184,151,90,0.08)', borderRadius: '8px', padding: '12px 14px' }}>
          <p style={{ color: '#8C6A2E', fontSize: '14px', lineHeight: 1.5 }}>
            That login link has expired. Enter your email and password to sign in.
          </p>
        </div>
      )}

      {resetSuccess && (
        <div style={{ border: '1px solid rgba(76,175,125,0.3)', background: 'rgba(76,175,125,0.08)', borderRadius: '8px', padding: '12px 14px' }}>
          <p style={{ color: '#2E7D4F', fontSize: '14px', lineHeight: 1.5 }}>
            Your password has been updated. Sign in with your new password.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <Link href="/auth/reset-password" style={{ fontSize: '12px', color: '#6B5B4E', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ fontSize: '15px', color: '#cc5555', lineHeight: 1.5 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: '100%',
            background: isPending ? '#9A8060' : '#1A1208',
            color: '#F5F0E8',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '16px',
            border: 'none',
            borderRadius: '8px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>

      </form>
    </div>
  )
}
