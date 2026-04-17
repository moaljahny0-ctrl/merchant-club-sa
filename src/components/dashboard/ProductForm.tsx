'use client'

import { useActionState } from 'react'
import type { ProductFormState } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>
  defaultValues?: Partial<Product>
  submitLabel?: string
}

const CATEGORIES = [
  'Fashion & Apparel',
  'Beauty & Skincare',
  'Accessories',
  'Home & Living',
  'Food & Beverages',
  'Health & Wellness',
  'Art & Crafts',
  'Kids & Baby',
  'Books & Stationery',
  'Other',
]

export function ProductForm({ action, defaultValues, submitLabel = 'Save product' }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">

      {state.error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-red-400 text-xs">{state.error}</p>
        </div>
      )}

      {/* Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Title (English) <span className="text-gold">*</span>
          </label>
          <input
            name="title_en"
            required
            defaultValue={defaultValues?.title_en}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="Product title in English"
          />
        </div>
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Title (Arabic)
          </label>
          <input
            name="title_ar"
            dir="rtl"
            defaultValue={defaultValues?.title_ar}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="اسم المنتج بالعربية"
          />
        </div>
      </div>

      {/* Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Description (English)
          </label>
          <textarea
            name="description_en"
            rows={4}
            defaultValue={defaultValues?.description_en}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors resize-none"
            placeholder="Describe your product…"
          />
        </div>
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Description (Arabic)
          </label>
          <textarea
            name="description_ar"
            dir="rtl"
            rows={4}
            defaultValue={defaultValues?.description_ar}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors resize-none"
            placeholder="وصف المنتج…"
          />
        </div>
      </div>

      {/* Price, SKU, Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Price (SAR) <span className="text-gold">*</span>
          </label>
          <input
            name="price"
            type="number"
            required
            min={0}
            step={0.01}
            defaultValue={defaultValues?.price}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            SKU
          </label>
          <input
            name="sku"
            defaultValue={defaultValues?.sku ?? ''}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="SKU-001"
          />
        </div>
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
            Stock quantity
          </label>
          <input
            name="stock_quantity"
            type="number"
            min={0}
            defaultValue={defaultValues?.stock_quantity ?? 0}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
          Category
        </label>
        <select
          name="category"
          defaultValue={defaultValues?.category ?? ''}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors appearance-none"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
