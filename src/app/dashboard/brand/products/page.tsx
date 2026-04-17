import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const { data: products } = await supabase
    .from('products')
    .select('id, title_en, title_ar, price, status, category, stock_quantity, updated_at')
    .eq('brand_id', member.brand_id)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8 md:p-12 max-w-5xl">

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[9px] text-gold tracking-[0.35em] uppercase mb-3">Brand Dashboard</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
            Products
          </h1>
        </div>
        <Link
          href="/dashboard/brand/products/new"
          className="bg-gold text-ink text-[10px] font-medium tracking-[0.18em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
        >
          + Add product
        </Link>
      </div>

      {(!products || products.length === 0) ? (
        /* Empty state */
        <div className="flex items-center justify-center py-24">
          <div className="max-w-[360px] w-full text-center">
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-px w-8 bg-border" />
              <div className="w-1.5 h-1.5 border border-border rotate-45" />
              <div className="h-px w-8 bg-border" />
            </div>

            <h2 className="font-display text-2xl font-light text-parchment mb-4">
              No products yet.
            </h2>
            <p className="text-muted text-sm leading-relaxed mb-10">
              Add your first product to start building your catalog. Each submission is reviewed before going live.
            </p>

            <Link
              href="/dashboard/brand/products/new"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              Add first product
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[1fr_100px_90px_80px_80px] gap-4 px-5 pb-3 border-b border-border">
            <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase">Product</p>
            <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Price</p>
            <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Stock</p>
            <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Status</p>
            <p className="text-[8px] text-muted/50 tracking-[0.2em] uppercase text-right">Actions</p>
          </div>

          <div className="divide-y divide-border border-b border-border">
            {products.map(product => {
              const status = product.status as ProductStatus
              return (
                <div
                  key={product.id}
                  className="flex md:grid md:grid-cols-[1fr_100px_90px_80px_80px] gap-4 items-center px-5 py-4 hover:bg-surface/50 transition-colors group"
                >
                  {/* Title + category */}
                  <div className="min-w-0 flex-1">
                    <p className="text-parchment text-sm group-hover:text-gold transition-colors truncate leading-snug">
                      {product.title_en}
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
              )
            })}
          </div>

          <p className="text-[9px] text-muted/40 tracking-wide mt-5">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  )
}
