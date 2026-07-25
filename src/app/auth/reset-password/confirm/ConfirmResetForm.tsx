'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetBrandPassword } from '@/lib/actions/brand-auth'

export function ConfirmResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('This link is invalid.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await resetBrandPassword(token, password)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/auth/login?reset=success')
      }
    })
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted text-base">This link is invalid or incomplete.</p>
        <Link href="/auth/reset-password" className="text-gold text-sm tracking-[0.15em] uppercase hover:text-gold-light transition-colors">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2">
          New password
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-surface border border-border text-parchment text-base px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          placeholder="Min. 8 characters"
        />
      </div>

      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2">
          Confirm password
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-surface border border-border text-parchment text-base px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          placeholder="Repeat password"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gold text-ink text-sm font-medium tracking-[0.2em] uppercase py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}
