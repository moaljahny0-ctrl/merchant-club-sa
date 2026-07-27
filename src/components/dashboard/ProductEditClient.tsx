'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from './ProductForm'
import { submitProductForReview, withdrawProductSubmission, deleteProduct, updateProduct } from '@/lib/actions/products'
import type { Product, ProductImage } from '@/lib/types/database'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

type Props = {
  product: Product
  canEdit: boolean
  canSubmit: boolean
  canWithdraw: boolean
  existingImages?: ProductImage[]
  locale?: DashLang
}

export function ProductEditClient({ product, canEdit, canSubmit, canWithdraw, existingImages, locale = 'en' }: Props) {
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

  function handleWithdraw() {
    if (!confirm(t.confirm_withdraw)) return
    startTransition(async () => {
      const result = await withdrawProductSubmission(product.id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const boundUpdateProduct = updateProduct.bind(null, product.id)

  return (
    <div className="space-y-8">
      <ProductForm
        action={boundUpdateProduct}
        defaultValues={product}
        submitLabel={product.status === 'live' ? t.submit_live : t.submit_default}
        existingImages={existingImages}
        locale={locale}
        disabled={!canEdit}
      />

      {/* Actions */}
      <div className="border-t border-border pt-6 max-w-xl flex flex-wrap gap-3">
        {canSubmit && (
          <button
            onClick={handleSubmitForReview}
            disabled={isPending}
            className="bg-gold text-ink text-sm font-medium tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {isPending ? t.btn_submitting : t.btn_submit}
          </button>
        )}
        {canWithdraw && (
          <button
            onClick={handleWithdraw}
            disabled={isPending}
            className="border border-yellow-500/40 text-yellow-400 text-sm tracking-[0.15em] uppercase px-6 py-3 hover:border-yellow-400 transition-colors disabled:opacity-50"
          >
            {isPending ? t.btn_withdrawing : t.btn_withdraw}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="border border-red-500/40 text-red-400 text-sm tracking-[0.15em] uppercase px-6 py-3 hover:border-red-400 transition-colors disabled:opacity-50"
        >
          {isPending ? t.btn_deleting : t.btn_delete}
        </button>
      </div>
    </div>
  )
}
