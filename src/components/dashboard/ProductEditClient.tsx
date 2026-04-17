'use client'

import { useTransition } from 'react'
import { ProductForm } from './ProductForm'
import { submitProductForReview, deleteProduct, updateProduct } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'

type Props = {
  product: Product
  canEdit: boolean
  canSubmit: boolean
}

export function ProductEditClient({ product, canEdit, canSubmit }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmitForReview() {
    startTransition(async () => {
      const result = await submitProductForReview(product.id)
      if (result.error) alert(result.error)
    })
  }

  function handleDelete() {
    if (!confirm('Delete this product? This cannot be undone.')) return
    startTransition(async () => {
      await deleteProduct(product.id)
    })
  }

  const boundUpdateProduct = updateProduct.bind(null, product.id)

  return (
    <div className="space-y-8">
      {canEdit ? (
        <ProductForm
          action={boundUpdateProduct}
          defaultValues={product}
          submitLabel="Save changes"
        />
      ) : (
        <div className="max-w-2xl space-y-6 opacity-60 pointer-events-none select-none">
          <ProductFormReadOnly product={product} />
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-border pt-6 max-w-2xl flex flex-wrap gap-3">
        {canSubmit && (
          <button
            onClick={handleSubmitForReview}
            disabled={isPending}
            className="bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
        {canEdit && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="border border-red-500/40 text-red-400 text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-red-400 transition-colors disabled:opacity-50"
          >
            Delete product
          </button>
        )}
      </div>
    </div>
  )
}

function ProductFormReadOnly({ product }: { product: Product }) {
  const fields = [
    { label: 'Title (English)', value: product.title_en },
    { label: 'Title (Arabic)', value: product.title_ar || '—' },
    { label: 'Price', value: `SAR ${Number(product.price).toFixed(2)}` },
    { label: 'SKU', value: product.sku || '—' },
    { label: 'Stock', value: String(product.stock_quantity) },
    { label: 'Category', value: product.category || '—' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.label}>
            <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">{f.label}</p>
            <p className="text-parchment text-sm">{f.value}</p>
          </div>
        ))}
      </div>
      {product.description_en && (
        <div>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Description (English)</p>
          <p className="text-parchment text-sm whitespace-pre-wrap">{product.description_en}</p>
        </div>
      )}
    </div>
  )
}
