'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from './ProductForm'
import { submitProductForReview, deleteProduct, updateProduct } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'

type Props = {
  product: Product
  canEdit: boolean
  canSubmit: boolean
  currentImageUrl?: string
}

export function ProductEditClient({ product, canEdit, canSubmit, currentImageUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmitForReview() {
    startTransition(async () => {
      const result = await submitProductForReview(product.id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
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
          currentImageUrl={currentImageUrl}
        />
      ) : (
        <div className="max-w-xl space-y-6 opacity-60 pointer-events-none select-none">
          <ProductFormReadOnly product={product} currentImageUrl={currentImageUrl} />
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-border pt-6 max-w-xl flex flex-wrap gap-3">
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

function ProductFormReadOnly({ product, currentImageUrl }: { product: Product; currentImageUrl?: string }) {
  return (
    <div className="space-y-6">
      {currentImageUrl && (
        <div className="border border-border inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentImageUrl} alt={product.title_en} className="w-32 h-32 object-cover block" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Name</p>
          <p className="text-parchment text-sm">{product.title_en}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Price</p>
          <p className="text-parchment text-sm">SAR {Number(product.price).toFixed(2)}</p>
        </div>
      </div>
      {product.description_en && (
        <div>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Description</p>
          <p className="text-parchment text-sm whitespace-pre-wrap">{product.description_en}</p>
        </div>
      )}
    </div>
  )
}
