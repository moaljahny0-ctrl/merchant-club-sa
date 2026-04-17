'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard/brand')
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-10 text-center">
          <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-2">Merchant Club SA</p>
          <h1 className="font-display text-3xl font-light text-parchment">Set your password</h1>
          <p className="text-muted text-sm mt-2">Welcome — choose a password to access your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              New password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
              Confirm password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
              placeholder="Repeat password"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>

      </div>
    </div>
  )
}
