import Link from 'next/link'
import { createProduct } from '@/lib/actions/products'
import { ProductForm } from '@/components/dashboard/ProductForm'

export default function NewProductPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard/brand/products"
          className="text-[10px] text-muted hover:text-gold tracking-[0.2em] uppercase transition-colors"
        >
          ← Products
        </Link>
        <h1 className="font-display text-3xl font-light text-parchment mt-3">New product</h1>
        <p className="text-muted text-sm mt-1">
          Save as draft first, then submit for review when ready.
        </p>
      </div>

      <ProductForm action={createProduct} submitLabel="Create product" />
    </div>
  )
}
