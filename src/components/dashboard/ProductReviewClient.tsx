'use client'

import { useState, useTransition } from 'react'
import { adminReviewProduct } from '@/lib/actions/admin'
import type { Product } from '@/lib/types/database'

type ProductWithBrand = Product & { brands?: { name_en: string } | null }

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-muted',
  submitted: 'text-yellow-400',
  approved: 'text-green-400',
  rejected: 'text-red-400',
  live: 'text-blue-400',
  archived: 'text-muted',
  out_of_stock: 'text-orange-400',
}

export function ProductReviewClient({ products }: { products: ProductWithBrand[] }) {
  const [filter, setFilter] = useState<string>('submitted')
  const filtered = filter === 'all' ? products : products.filter(p => p.status === filter)

  const counts: Record<string, number> = {}
  for (const p of products) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {['all', 'submitted', 'approved', 'rejected', 'live'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
              filter === tab
                ? 'text-gold border-b border-gold'
                : 'text-muted hover:text-parchment'
            }`}
          >
            {tab} {tab !== 'all' && counts[tab] ? `(${counts[tab]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No products in this status.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <ProductReviewCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductReviewCard({ product }: { product: ProductWithBrand }) {
  const [expanded, setExpanded] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleApprove() {
    setActionError(null)
    startTransition(async () => {
      const result = await adminReviewProduct(product.id, 'approve')
      if (result.error) setActionError(result.error)
    })
  }

  function handleReject() {
    if (!rejectionReason.trim()) {
      setActionError('Please provide a rejection reason.')
      return
    }
    setActionError(null)
    startTransition(async () => {
      const result = await adminReviewProduct(product.id, 'reject', rejectionReason)
      if (result.error) setActionError(result.error)
    })
  }

  const brandName = product.brands?.name_en ?? '—'

  return (
    <div className="border border-border bg-surface">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <p className="text-parchment text-sm font-medium truncate">{product.title_en}</p>
            <p className="text-muted text-xs mt-0.5">{brandName} · {product.category || 'No category'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <p className="text-parchment text-sm">SAR {Number(product.price).toFixed(2)}</p>
          <span className={`text-xs ${STATUS_COLORS[product.status] ?? 'text-muted'}`}>{product.status}</span>
          <span className="text-muted">{expanded ? '↑' : '↓'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'SKU', value: product.sku },
              { label: 'Stock', value: String(product.stock_quantity) },
              { label: 'Updated', value: new Date(product.updated_at).toLocaleDateString('en-SA') },
              { label: 'Brand', value: brandName },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">{f.label}</p>
                <p className="text-parchment text-sm">{f.value ?? '—'}</p>
              </div>
            ))}
          </div>

          {product.description_en && (
            <div>
              <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Description (EN)</p>
              <p className="text-parchment text-sm whitespace-pre-wrap leading-relaxed">{product.description_en}</p>
            </div>
          )}

          {product.description_ar && (
            <div>
              <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Description (AR)</p>
              <p className="text-parchment text-sm whitespace-pre-wrap leading-relaxed" dir="rtl">{product.description_ar}</p>
            </div>
          )}

          {product.rejection_reason && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
              <p className="text-[9px] text-muted tracking-[0.2em] uppercase mb-1">Previous rejection reason</p>
              <p className="text-red-400 text-sm">{product.rejection_reason}</p>
            </div>
          )}

          {actionError && <p className="text-red-400 text-xs">{actionError}</p>}

          {product.status === 'submitted' && (
            <div className="flex flex-col gap-3 pt-2">
              <div>
                <label className="block text-[9px] text-muted tracking-[0.2em] uppercase mb-2">
                  Rejection reason (required to reject)
                </label>
                <input
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full bg-ink border border-border text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-gold transition-colors"
                  placeholder="Reason for rejection…"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isPending}
                  className="bg-gold text-ink text-xs font-medium tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isPending ? '…' : 'Approve'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isPending}
                  className="border border-red-500/40 text-red-400 text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:border-red-400 transition-colors disabled:opacity-50"
                >
                  {isPending ? '…' : 'Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
