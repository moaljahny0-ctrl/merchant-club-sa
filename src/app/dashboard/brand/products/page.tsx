import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from '@/components/dashboard/ProductsClient'
import { Button } from '@/components/ui/Button'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale)

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
          <p className="text-[12px] text-gold tracking-[0.35em] uppercase mb-3">{t.products.eyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
            {t.products.heading}
          </h1>
        </div>
        <Button href="/dashboard/brand/products/new" native variant="primary" className="bg-gold text-ink hover:bg-gold-light">
          {t.products.add_product}
        </Button>
      </div>

      {(!products || products.length === 0) ? (
        <div className="flex items-center justify-center py-24">
          <div className="max-w-[360px] w-full text-center">
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-px w-8 bg-border" />
              <div className="w-1.5 h-1.5 border border-border rotate-45" />
              <div className="h-px w-8 bg-border" />
            </div>
            <h2 className="font-display text-2xl font-light text-parchment mb-4">
              {t.products.no_products_heading}
            </h2>
            <p className="text-muted text-base leading-relaxed mb-10">
              {t.products.no_products_body}
            </p>
            <Button href="/dashboard/brand/products/new" native variant="primary" className="bg-gold text-ink hover:bg-gold-light">
              {t.products.add_first}
            </Button>
          </div>
        </div>
      ) : (
        <ProductsClient initialProducts={products} locale={locale} />
      )}
    </div>
  )
}
