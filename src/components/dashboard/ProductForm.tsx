'use client'

import { useActionState, useState, useTransition } from 'react'
import { deleteProductImageAction, type ProductFormState } from '@/lib/actions/products'
import type { Product, ProductImage } from '@/lib/types/database'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>
  defaultValues?: Partial<Product>
  submitLabel?: string
  existingImages?: ProductImage[]
  locale?: DashLang
}

const CATEGORIES = ['apparel', 'fragrance', 'home', 'beauty', 'jewelry', 'food', 'art', 'other'] as const

export function ProductForm({ action, defaultValues, submitLabel, existingImages, locale = 'en' }: Props) {
  const t = dt(locale).product_form
  const [state, formAction, isPending] = useActionState(action, { error: null })
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [isDeleting, startDeleteTransition] = useTransition()

  const resolvedSubmitLabel = submitLabel ?? t.save_product
  const visibleImages = (existingImages ?? []).filter(img => !deletedIds.has(img.id))

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setNewPreviews(files.map(file => URL.createObjectURL(file)))
  }

  function handleRemoveExisting(imageId: string) {
    startDeleteTransition(async () => {
      const result = await deleteProductImageAction(imageId)
      if (result.error) {
        alert(result.error)
      } else {
        setDeletedIds(prev => new Set(prev).add(imageId))
      }
    })
  }

  return (
    <form action={formAction} className="space-y-7 max-w-xl">

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

      {/* Images */}
      <div>
        <label className="block text-[13px] text-muted tracking-[0.2em] uppercase mb-2.5">
          {t.label_image}
        </label>

        {visibleImages.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-muted/50 tracking-[0.15em] uppercase mb-2">{t.existing_images}</p>
            <div className="flex flex-wrap gap-3">
              {visibleImages.map(img => (
                <div key={img.id} className="relative w-24 h-24 border border-border group overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover block" />
                  {img.is_primary && (
                    <span className="absolute top-1 start-1 bg-gold text-ink text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5">
                      {t.primary_image}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveExisting(img.id)}
                    disabled={isDeleting}
                    className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/70 opacity-0 group-hover:opacity-100 text-parchment text-[11px] tracking-[0.1em] uppercase transition-all duration-150 disabled:opacity-50"
                  >
                    {t.remove_image}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newPreviews.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {newPreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 border border-gold/60 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover block" />
                <span className="absolute bottom-0 inset-x-0 bg-ink/75 text-parchment text-[9px] text-center py-0.5 leading-tight">
                  {t.new_images_pending}
                </span>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-3 border border-border border-dashed px-4 py-4 cursor-pointer hover:border-gold transition-colors group">
          <span className="text-[13px] text-muted tracking-[0.15em] uppercase group-hover:text-gold transition-colors">
            {visibleImages.length > 0 || newPreviews.length > 0 ? t.replace_image : t.choose_image}
          </span>
          <span className="text-[13px] text-muted/40 ms-auto">{t.image_formats}</span>
          <input
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
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
