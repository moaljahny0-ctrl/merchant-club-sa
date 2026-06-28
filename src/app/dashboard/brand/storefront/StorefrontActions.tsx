'use client'

import { useState, useTransition } from 'react'
import { submitStorefrontForReview } from '@/lib/actions/brands'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

export function StorefrontActions({ brandId, locale = 'en' }: { brandId: string; locale?: DashLang }) {
  const t = dt(locale).storefront_actions
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
        <p className="text-sm text-parchment">{t.submitted_msg}</p>
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
        {isPending ? t.btn_submitting : t.btn_submit}
      </button>
      <p className="text-[10px] text-muted/60 leading-relaxed">
        {t.description}
      </p>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  )
}
