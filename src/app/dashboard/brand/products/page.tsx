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
  draft: 'text-muted',
  submitted: 'text-yellow-400',
  approved: 'text-blue-400',
  rejected: 'text-red-400',
  live: 'text-green-400',
  archived: 'text-muted',
  out_of_stock: 'text-orange-400',
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
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-1">Brand Dashboard</p>
          <h1 className="font-display text-3xl font-light text-parchment">Products</h1>
        </div>
        <Link
          href="/dashboard/brand/products/new"
          className="bg-gold text-ink text-xs font-medium tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors"
        >
          + Add product
        </Link>
      </div>

      {(!products || products.length === 0) ? (
        <div className="border border-border p-10 text-center">
          <p className="text-muted text-sm mb-4">No products yet.</p>
          <Link
            href="/dashboard/brand/products/new"
            className="text-gold text-xs tracking-[0.15em] uppercase hover:text-gold-light transition-colors"
          >
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {products.map(product => (
            <Link
              key={product.id}
              href={`/dashboard/brand/products/${product.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-parchment text-sm group-hover:text-gold transition-colors truncate">
                  {product.title_en}
                </p>
                <p className="text-muted text-xs mt-0.5">{product.category || '—'}</p>
              </div>
              <div className="flex items-center gap-6 ml-4 shrink-0">
                <p className="text-parchment text-sm">
                  SAR {Number(product.price).toFixed(2)}
                </p>
                <p className="text-muted text-xs w-16 text-right">
                  {product.stock_quantity} in stock
                </p>
                <span className={`text-xs tracking-wide w-20 text-right ${STATUS_COLORS[product.status as ProductStatus] ?? 'text-muted'}`}>
                  {STATUS_LABELS[product.status as ProductStatus] ?? product.status}
                </span>
                <span className="text-muted text-xs">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
