import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

export default async function BrandAnalyticsPage() {
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

  const brandId = member.brand_id
  const service = createServiceClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [eventsRes, ordersRes] = await Promise.all([
    service
      .from('analytics_events')
      .select('event_type, product_id, creator_link_id, created_at')
      .eq('brand_id', brandId)
      .gte('created_at', since),
    service
      .from('orders')
      .select('id, creator_link_id, creator_links(link_code)')
      .eq('brand_id', brandId)
      .gte('created_at', since),
  ])

  const events = eventsRes.data ?? []
  const orders = ordersRes.data ?? []

  const storefrontViews = events.filter(e => e.event_type === 'storefront_view').length
  const productViews = events.filter(e => e.event_type === 'product_view').length
  const orderCount = orders.length

  // Top 3 products by views
  const productViewCounts: Record<string, number> = {}
  for (const e of events) {
    if (e.event_type === 'product_view' && e.product_id) {
      productViewCounts[e.product_id] = (productViewCounts[e.product_id] ?? 0) + 1
    }
  }
  const topProductIds = Object.entries(productViewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ id, count }))

  // Fetch product titles for top products
  type ProductTitle = { id: string; title_en: string; title_ar: string }
  let topProducts: Array<{ id: string; count: number; title: string }> = []
  if (topProductIds.length > 0) {
    const { data: productRows } = await service
      .from('products')
      .select('id, title_en, title_ar')
      .in('id', topProductIds.map(p => p.id))
    const titleMap = new Map((productRows as ProductTitle[] ?? []).map(p => [
      p.id,
      locale === 'ar' && p.title_ar ? p.title_ar : p.title_en,
    ]))
    topProducts = topProductIds.map(p => ({
      ...p,
      title: titleMap.get(p.id) ?? t.analytics.unknown_product,
    }))
  }

  // Top creator by attributed orders
  const creatorOrderCounts: Record<string, { count: number; code: string }> = {}
  for (const o of orders) {
    if (o.creator_link_id) {
      const code = (o.creator_links as unknown as { link_code: string } | null)?.link_code ?? o.creator_link_id
      if (!creatorOrderCounts[o.creator_link_id]) {
        creatorOrderCounts[o.creator_link_id] = { count: 0, code }
      }
      creatorOrderCounts[o.creator_link_id].count++
    }
  }
  const topCreator = Object.values(creatorOrderCounts).sort((a, b) => b.count - a.count)[0] ?? null

  const maxViews = Math.max(storefrontViews, productViews, orderCount, 1)

  return (
    <div className="p-8 md:p-12 max-w-3xl">
      <div className="mb-10">
        <p className="text-[9px] text-gold tracking-[0.35em] uppercase mb-3">{t.analytics.eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">{t.analytics.heading}</h1>
        <p className="text-muted text-xs mt-3">{t.analytics.last_30}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {[
          { label: t.analytics.stat_storefront, value: storefrontViews },
          { label: t.analytics.stat_products,   value: productViews },
          { label: t.analytics.stat_orders,     value: orderCount },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border px-5 py-6">
            <p className="text-[8px] text-muted/60 tracking-[0.2em] uppercase mb-3">{stat.label}</p>
            <p className="text-3xl font-light text-parchment leading-none mb-2">{stat.value.toLocaleString()}</p>
            <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gold/60 rounded-full"
                style={{ width: `${Math.round((stat.value / maxViews) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div className="mb-8">
        <p className="text-[9px] text-muted/50 tracking-[0.3em] uppercase mb-4">{t.analytics.top_products_label}</p>
        {topProducts.length === 0 ? (
          <p className="text-muted text-sm">{t.analytics.no_product_views}</p>
        ) : (
          <div className="border border-border divide-y divide-border">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] text-muted/40 font-mono shrink-0">{i + 1}</span>
                  <p className="text-parchment text-xs truncate">{p.title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold/60 rounded-full"
                      style={{ width: `${Math.round((p.count / (topProducts[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-muted text-xs w-8 text-right">{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top creator */}
      <div>
        <p className="text-[9px] text-muted/50 tracking-[0.3em] uppercase mb-4">{t.analytics.top_creator_label}</p>
        {!topCreator ? (
          <p className="text-muted text-sm">{t.analytics.no_creator_orders}</p>
        ) : (
          <div className="border border-border px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-muted/50 uppercase tracking-[0.15em] mb-1">{t.analytics.col_link_code}</p>
              <p className="text-parchment text-sm font-mono">{topCreator.code}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted/50 uppercase tracking-[0.15em] mb-1">{t.analytics.col_orders}</p>
              <p className="text-parchment text-2xl font-light">{topCreator.count}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
