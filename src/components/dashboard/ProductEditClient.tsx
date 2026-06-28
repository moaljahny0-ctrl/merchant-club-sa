'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from './ProductForm'
import { submitProductForReview, deleteProduct, updateProduct } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

type Props = {
  product: Product
  canEdit: boolean
  canSubmit: boolean
  currentImageUrl?: string
  locale?: DashLang
}

export function ProductEditClient({ product, canEdit, canSubmit, currentImageUrl, locale = 'en' }: Props) {
  const t = dt(locale).product_edit
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
    if (!confirm(t.confirm_delete)) return
    startTransition(async () => {
      await deleteProduct(product.id)
    })
  }

  const boundUpdateProduct = updateProduct.bind(null, product.id)

  return (
    <div className="space-y-8">
      <ProductForm
        action={boundUpdateProduct}
        defaultValues={product}
        submitLabel={product.status === 'live' ? t.submit_live : t.submit_default}
        currentImageUrl={currentImageUrl}
        locale={locale}
      />

      {/* Actions */}
      <div className="border-t border-border pt-6 max-w-xl flex flex-wrap gap-3">
        {canSubmit && (
          <button
            onClick={handleSubmitForReview}
            disabled={isPending}
            className="bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {isPending ? t.btn_submitting : t.btn_submit}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="border border-red-500/40 text-red-400 text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-red-400 transition-colors disabled:opacity-50"
        >
          {isPending ? t.btn_deleting : t.btn_delete}
        </button>
      </div>
    </div>
  )
}
