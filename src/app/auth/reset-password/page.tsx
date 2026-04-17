'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/invite?type=recovery`,
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    })
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-10 text-center">
          <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-2">Merchant Club SA</p>
          <h1 className="font-display text-3xl font-light text-parchment">Reset password</h1>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-muted text-sm">Check your email for a password reset link.</p>
            <a href="/auth/login" className="text-gold text-xs tracking-[0.15em] uppercase hover:text-gold-light transition-colors">
              Back to login
            </a>
          </div>
        ) : (
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

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {isPending ? 'Sending…' : 'Send reset link'}
            </button>

            <div className="text-center mt-2">
              <a href="/auth/login" className="text-xs text-muted hover:text-gold transition-colors">
                Back to login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
