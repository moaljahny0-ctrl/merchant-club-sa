'use client'

import { useActionState, useState } from 'react'
import type { ProductFormState } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>
  defaultValues?: Partial<Product>
  submitLabel?: string
  currentImageUrl?: string
  locale?: DashLang
}

const CATEGORIES = ['apparel', 'fragrance', 'home', 'beauty', 'jewelry', 'food', 'art', 'other'] as const

export function ProductForm({ action, defaultValues, submitLabel, currentImageUrl, locale = 'en' }: Props) {
  const t = dt(locale).product_form
  const [state, formAction, isPending] = useActionState(action, { error: null })
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null)

  const resolvedSubmitLabel = submitLabel ?? t.save_product

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-7 max-w-xl">

      {state.error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      {/* Product name */}
      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
          {t.label_name} <span className="text-gold">*</span>
        </label>
        <input
          name="title_en"
          required
          dir="ltr"
          defaultValue={defaultValues?.title_en}
          className="w-full bg-surface border border-border text-parchment text-base px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          placeholder={t.placeholder_name}
        />
      </div>

      {/* Price + Stock row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
            {t.label_price} <span className="text-gold">*</span>
          </label>
          <input
            name="price"
            type="number"
            required
            min={0}
            step={0.01}
            dir="ltr"
            defaultValue={defaultValues?.price}
            className="w-full bg-surface border border-border text-parchment text-base px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
            {t.label_stock} <span className="text-gold">*</span>
          </label>
          <input
            name="stock_quantity"
            type="number"
            required
            min={0}
            step={1}
            dir="ltr"
            defaultValue={defaultValues?.stock_quantity ?? 1}
            className="w-full bg-surface border border-border text-parchment text-base px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="1"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
          {t.label_category} <span className="text-gold">*</span>
        </label>
        <select
          name="category"
          required
          defaultValue={defaultValues?.category || ''}
          dir="ltr"
          className="w-full bg-surface border border-border text-parchment text-base px-4 py-3.5 focus:outline-none focus:border-gold transition-colors"
        >
          <option value="" disabled>{t.placeholder_category}</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{t[`cat_${cat}` as keyof typeof t]}</option>
          ))}
        </select>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
          {t.label_description}
        </label>
        <textarea
          name="description_en"
          rows={3}
          dir="ltr"
          defaultValue={defaultValues?.description_en}
          className="w-full bg-surface border border-border text-parchment text-base px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors resize-none leading-relaxed"
          placeholder={t.placeholder_desc}
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
          {t.label_image}
        </label>

        {previewUrl && (
          <div className="mb-3 border border-border inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-32 h-32 object-cover block"
            />
          </div>
        )}

        <label className="flex items-center gap-3 border border-border border-dashed px-4 py-4 cursor-pointer hover:border-gold transition-colors group">
          <span className="text-[13px] text-muted tracking-[0.15em] uppercase group-hover:text-gold transition-colors">
            {previewUrl ? t.replace_image : t.choose_image}
          </span>
          <span className="text-[13px] text-muted/40 ms-auto">{t.image_formats}</span>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleImageChange}
          />
        </label>
      </div>

      {/* Submit */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gold text-ink text-sm font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? t.saving : resolvedSubmitLabel}
        </button>
      </div>

    </form>
  )
}
