'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toggleProductFeatured } from '@/lib/actions/products'
import type { ProductStatus } from '@/lib/types/database'

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  submitted: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Live',
  archived: 'Archived',
  out_of_stock: 'Out of stock',
}

const STATUS_COLORS: Record<ProductStatus, string> = {
  draft: 'text-muted/60',
  submitted: 'text-yellow-400',
  approved: 'text-blue-400',
  rejected: 'text-red-400',
  live: 'text-green-400',
  archived: 'text-muted/60',
  out_of_stock: 'text-orange-400',
}

const STATUS_DOT: Record<ProductStatus, string> = {
  draft: 'bg-muted/40',
  submitted: 'bg-yellow-400',
  approved: 'bg-blue-400',
  rejected: 'bg-red-400',
  live: 'bg-green-400',
  archived: 'bg-muted/40',
  out_of_stock: 'bg-orange-400',
}

type Product = {
  id: string
  title_en: string
  title_ar: string
  price: number
  status: string
  category: string | null
  stock_quantity: number
  is_featured: boolean
  updated_at: string
}

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)

  return (
    <>
      {/* Column headers */}
      <div className="hidden md:grid grid-cols-[1fr_100px_90px_80px_60px_80px] gap-4 px-5 pb-3 border-b border-border">
        <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase">Product</p>
        <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Price</p>
        <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Stock</p>
        <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Status</p>
        <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-center">Feature</p>
        <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Actions</p>
      </div>

      <div className="divide-y divide-border border-b border-border">
        {products.map(product => (
          <ProductRow
            key={product.id}
            product={product}
            onFeatureToggled={(id, newVal) =>
              setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: newVal } : p))
            }
          />
        ))}
      </div>

      <p className="text-[9px] text-muted/40 tracking-wide mt-5">
        {products.length} product{products.length !== 1 ? 's' : ''}
        {products.filter(p => p.is_featured).length > 0 && (
          <span className="ml-3 text-gold/70">
            · {products.filter(p => p.is_featured).length}/6 featured
          </span>
        )}
      </p>
    </>
  )
}

function ProductRow({
  product,
  onFeatureToggled,
}: {
  product: Product
  onFeatureToggled: (id: string, newVal: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [featureError, setFeatureError] = useState<string | null>(null)
  const status = product.status as ProductStatus

  function handleFeature() {
    setFeatureError(null)
    startTransition(async () => {
      const result = await toggleProductFeatured(product.id)
      if (result.error) {
        setFeatureError(result.error)
      } else if (result.is_featured !== undefined) {
        onFeatureToggled(product.id, result.is_featured)
      }
    })
  }

  return (
    <>
      <div className="flex md:grid md:grid-cols-[1fr_100px_90px_80px_60px_80px] gap-4 items-center px-5 py-4 hover:bg-surface/50 transition-colors group">
        {/* Title + category */}
        <div className="min-w-0 flex-1">
          <p className="text-parchment text-sm group-hover:text-gold transition-colors truncate leading-snug">
            {product.title_en}
            {product.is_featured && (
              <span className="ml-2 text-[8px] text-gold/80 tracking-[0.1em] uppercase border border-gold/30 px-1.5 py-0.5 rounded-sm">
                Featured
              </span>
            )}
          </p>
          <p className="text-muted/60 text-xs mt-0.5 truncate">{product.category || '—'}</p>
        </div>

        {/* Price */}
        <p className="text-parchment text-sm text-right hidden md:block">
          {Number(product.price).toLocaleString('en-SA', { minimumFractionDigits: 2 })}
        </p>

        {/* Stock */}
        <p className="text-muted text-xs text-right hidden md:block">
          {product.stock_quantity} units
        </p>

        {/* Status */}
        <div className="hidden md:flex items-center justify-end gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-muted/40'}`} />
          <span className={`text-[10px] tracking-wide ${STATUS_COLORS[status] ?? 'text-muted'}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        {/* Feature toggle */}
        <div className="hidden md:flex items-center justify-center">
          <button
            onClick={handleFeature}
            disabled={isPending || (status !== 'live' && !product.is_featured)}
            title={status !== 'live' && !product.is_featured ? 'Only live products can be featured' : product.is_featured ? 'Remove from featured' : 'Add to featured'}
            className="transition-colors"
            style={{ opacity: (status !== 'live' && !product.is_featured) ? 0.3 : isPending ? 0.5 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={product.is_featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={product.is_featured ? 'text-gold' : 'text-muted/40 hover:text-muted'}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 ml-auto md:ml-0">
          <Link
            href={`/dashboard/brand/products/${product.id}`}
            className="text-[9px] text-muted hover:text-gold tracking-[0.15em] uppercase transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>
      {featureError && (
        <div className="px-5 pb-2 text-[10px] text-red-400">{featureError}</div>
      )}
    </>
  )
}
