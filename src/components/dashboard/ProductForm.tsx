'use client'

import { useActionState, useState } from 'react'
import type { ProductFormState } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>
  defaultValues?: Partial<Product>
  submitLabel?: string
  currentImageUrl?: string
}

export function ProductForm({ action, defaultValues, submitLabel = 'Save product', currentImageUrl }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-7 max-w-xl">

      {state.error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-red-400 text-xs">{state.error}</p>
        </div>
      )}

      {/* Product name */}
      <div>
        <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2.5">
          Product name <span className="text-gold">*</span>
        </label>
        <input
          name="title_en"
          required
          defaultValue={defaultValues?.title_en}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
          placeholder="Enter product name"
        />
      </div>

      {/* Price + Stock row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2.5">
            Price (SAR) <span className="text-gold">*</span>
          </label>
          <input
            name="price"
            type="number"
            required
            min={0}
            step={0.01}
            defaultValue={defaultValues?.price}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2.5">
            Stock quantity <span className="text-gold">*</span>
          </label>
          <input
            name="stock_quantity"
            type="number"
            required
            min={0}
            step={1}
            defaultValue={defaultValues?.stock_quantity ?? 1}
            className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors"
            placeholder="1"
          />
        </div>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2.5">
          Short description
        </label>
        <textarea
          name="description_en"
          rows={3}
          defaultValue={defaultValues?.description_en}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3.5 focus:outline-none focus:border-gold placeholder:text-muted/40 transition-colors resize-none leading-relaxed"
          placeholder="Briefly describe this product…"
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-[10px] text-muted tracking-[0.2em] uppercase mb-2.5">
          Product image
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
          <span className="text-[10px] text-muted tracking-[0.15em] uppercase group-hover:text-gold transition-colors">
            {previewUrl ? 'Replace image' : 'Choose image'}
          </span>
          <span className="text-[10px] text-muted/40 ml-auto">JPEG · PNG · WebP · Max 5 MB</span>
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
          className="bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>

    </form>
  )
}
