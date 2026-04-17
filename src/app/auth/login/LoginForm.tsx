'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard/brand'

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
        setError(error.message)
      } else {
        router.push(redirect)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
          Password
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase py-4 hover:bg-gold-light transition-colors disabled:opacity-50 mt-2"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="mt-6 text-center">
        <a
          href="/auth/reset-password"
          className="text-xs text-muted hover:text-gold transition-colors tracking-wide"
        >
          Forgot password?
        </a>
      </div>
    </form>
  )
}
