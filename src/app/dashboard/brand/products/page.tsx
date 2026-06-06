import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from '@/components/dashboard/ProductsClient'

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
    .select('id, title_en, title_ar, price, status, category, stock_quantity, is_featured, updated_at')
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
        <ProductsClient initialProducts={products} />
      )}
    </div>
  )
}
