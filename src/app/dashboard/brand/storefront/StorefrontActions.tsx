'use client'

import { useState, useTransition } from 'react'
import { submitStorefrontForReview } from '@/lib/actions/brands'

export function StorefrontActions({ brandId }: { brandId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await submitStorefrontForReview(brandId)
      if (result.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <div className="mb-6 border border-gold/30 bg-gold/5 px-6 py-4">
        <p className="text-sm text-parchment">
          ✓ Submitted for review. We&apos;ll notify you once it&apos;s approved.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-center gap-4 flex-wrap">
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="bg-gold text-ink text-[10px] font-medium tracking-[0.18em] uppercase px-6 py-3 hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit for Review'}
      </button>
      <p className="text-[10px] text-muted/60 leading-relaxed">
        Submit your storefront to the admin team for final review before it goes live.
      </p>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  )
}
