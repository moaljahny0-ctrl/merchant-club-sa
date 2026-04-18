'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard/brand'
  const linkExpired = searchParams.get('error') === 'link_expired'

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
    <div className="space-y-7">

      {linkExpired && (
        <div className="border border-gold/30 bg-gold/5 px-4 py-3">
          <p className="text-gold text-xs leading-relaxed">
            That login link has expired. Enter your email and password to sign in.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-[9px] text-muted tracking-[0.25em] uppercase mb-2.5">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/30 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[9px] text-muted tracking-[0.25em] uppercase">
              Password
            </label>
            <a
              href="/auth/reset-password"
              className="text-[9px] text-muted/60 hover:text-gold tracking-[0.1em] transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/30 transition-colors"
          />
        </div>

        {error && (
          <p className="text-[11px] text-amber-400/90 tracking-wide">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gold text-ink text-[10px] font-medium tracking-[0.25em] uppercase py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>

      </form>
    </div>
  )
}
