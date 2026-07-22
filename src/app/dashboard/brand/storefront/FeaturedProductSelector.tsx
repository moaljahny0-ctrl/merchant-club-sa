'use client'

import { useState, useTransition } from 'react'
import { saveFeaturedProducts } from '@/lib/actions/brands'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

type LiveProduct = {
  id: string
  title_en: string
  title_ar: string | null
  price: number
}

const MAX = 6

export function FeaturedProductSelector({
  brandId,
  products,
  initialIds,
  locale = 'en',
}: {
  brandId: string
  products: LiveProduct[]
  initialIds: string[]
  locale?: DashLang
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const t = dt(locale).storefront

  function toggle(id: string) {
    setSaved(false)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX) {
        next.add(id)
      }
      return next
    })
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveFeaturedProducts(brandId, Array.from(selected))
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  if (products.length === 0) {
    return (
      <div className="mb-8 border border-border px-6 py-5">
        <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-2">{t.featured_heading}</p>
        <p className="text-muted text-base">{t.featured_none}</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-1">{t.featured_heading}</p>
          <p className="text-muted text-sm">{t.featured_body}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[12px] tracking-[0.15em] ${selected.size === MAX ? 'text-gold' : 'text-muted/50'}`}>
            {t.featured_count(selected.size)}
          </span>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="text-[13px] tracking-[0.2em] uppercase px-5 py-2.5 bg-gold text-ink font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {isPending ? t.featured_saving : saved ? t.featured_saved : t.featured_save}
          </button>
        </div>
      </div>

      <div className="border border-border divide-y divide-border">
        {products.map(product => {
          const isSelected = selected.has(product.id)
          const isDisabled = !isSelected && selected.size >= MAX
          const title = locale === 'ar' && product.title_ar ? product.title_ar : product.title_en

          return (
            <label
              key={product.id}
              className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface/50'
              } ${isSelected ? 'bg-gold/5' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => toggle(product.id)}
                className="sr-only"
              />
              <div className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-colors ${
                isSelected ? 'border-gold bg-gold/20' : 'border-border'
              }`}>
                {isSelected && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p className={`text-base flex-1 truncate transition-colors ${isSelected ? 'text-parchment' : 'text-muted'}`}>
                {title}
              </p>
              <p className="text-sm text-muted/60 shrink-0">
                SAR {Number(product.price).toLocaleString('en-SA', { minimumFractionDigits: 2 })}
              </p>
            </label>
          )
        })}
      </div>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
