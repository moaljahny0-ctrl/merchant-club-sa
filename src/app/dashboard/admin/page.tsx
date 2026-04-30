import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminCharts, type TrendDatum, type BrandStatusDatum } from '@/components/dashboard/AdminCharts'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', userId)

  const isAdmin = (data ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'platform_admin')
    }
  )

  if (!isAdmin) redirect('/dashboard/brand')
}

function buildTrendData(
  applications: { created_at: string }[],
  brands: { created_at: string }[]
): TrendDatum[] {
  const now = new Date()
  const months: TrendDatum[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      applications: 0,
      brands: 0,
    })
  }

  for (const app of applications) {
    const label = new Date(app.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const slot = months.find(m => m.month === label)
    if (slot) slot.applications++
  }

  for (const brand of brands) {
    const label = new Date(brand.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const slot = months.find(m => m.month === label)
    if (slot) slot.brands++
  }

  return months
}

function buildBrandStatusData(brands: { status: string }[]): BrandStatusDatum[] {
  const active  = brands.filter(b => b.status === 'active').length
  const pending = brands.filter(b => b.status === 'pending').length
  const review  = brands.filter(b => !['active', 'pending'].includes(b.status)).length

  return [
    { label: 'Active',  value: active },
    { label: 'Pending', value: pending },
    { label: 'Review',  value: review },
  ].filter(d => d.value > 0)
}

function pillClass(status: string) {
  if (status === 'active')  return 'a-pill a-p-active'
  if (status === 'pending') return 'a-pill a-p-pending'
  return 'a-pill a-p-review'
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [
    pendingAppsRes,
    brandsRes,
    allOrdersRes,
    productsRes,
    recentAppsRes,
    recentBrandsMonthlyRes,
    recentBrandsTableRes,
  ] = await Promise.all([
    supabase.from('brand_applications').select('id').eq('status', 'pending'),
    supabase.from('brands').select('id, name_en, status, created_at').order('created_at', { ascending: false }),
    supabase.from('orders').select('status, subtotal'),
    supabase.from('products').select('id, brand_id, status'),
    supabase.from('brand_applications').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
    supabase.from('brands').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
    supabase.from('brands').select('id, name_en, status').order('created_at', { ascending: false }).limit(5),
  ])

  const pendingApps  = pendingAppsRes.data?.length ?? 0
  const allBrands    = brandsRes.data ?? []
  const activeBrands = allBrands.filter(b => b.status === 'active').length
  const totalBrands  = allBrands.length

  const products     = productsRes.data ?? []
  const liveProducts = products.filter(p => p.status === 'live').length
  const totalProducts = products.length

  const allOrders  = allOrdersRes.data ?? []
  const totalOrders = allOrders.length

  // Per-brand product counts for table
  const productsByBrand = products.reduce<Record<string, number>>((acc, p) => {
    if (!p.brand_id) return acc
    acc[p.brand_id] = (acc[p.brand_id] ?? 0) + 1
    return acc
  }, {})

  const recentBrands = (recentBrandsTableRes.data ?? []) as {
    id: string
    name_en: string
    status: string
  }[]

  const trendData       = buildTrendData(recentAppsRes.data ?? [], recentBrandsMonthlyRes.data ?? [])
  const brandStatusData = buildBrandStatusData(allBrands)

  // Stat card bar widths (0–100%)
  const brandBar   = totalBrands  > 0 ? Math.round((activeBrands / totalBrands)   * 100) : 5
  const appsBar    = Math.min(pendingApps * 12, 100)
  const prodBar    = totalProducts > 0 ? Math.round((liveProducts / totalProducts) * 100) : 5
  const ordersBar  = Math.min(totalOrders, 100)

  return (
    <>
      {/* ── Stat cards ──────────────────────────────── */}
      <div className="a-stat-grid">

        {/* Active Brands */}
        <div className="a-stat-card a-s1">
          <div className="a-stat-icon">🏷️</div>
          <div className="a-stat-val">{activeBrands}</div>
          <div className="a-stat-lbl">Active Brands</div>
          <div className="a-stat-chg a-chg-up">▲ {totalBrands} total</div>
          <div className="a-bar-wrap">
            <div className="a-bar-fill" style={{ width: `${brandBar}%` }} />
          </div>
        </div>

        {/* Pending Applications */}
        <div className="a-stat-card a-s2">
          <div className="a-stat-icon">📋</div>
          <div className="a-stat-val">{pendingApps}</div>
          <div className="a-stat-lbl">Pending Applications</div>
          <div className="a-stat-chg a-chg-neutral">Awaiting</div>
          <div className="a-bar-wrap">
            <div className="a-bar-fill" style={{ width: `${appsBar}%` }} />
          </div>
        </div>

        {/* Products Listed */}
        <div className="a-stat-card a-s3">
          <div className="a-stat-icon">📦</div>
          <div className="a-stat-val">{liveProducts}</div>
          <div className="a-stat-lbl">Products Listed</div>
          <div className={`a-stat-chg ${liveProducts > 0 ? 'a-chg-up' : 'a-chg-neutral'}`}>
            {liveProducts > 0 ? `▲ ${prodBar}% live` : 'No live'}
          </div>
          <div className="a-bar-wrap">
            <div className="a-bar-fill" style={{ width: `${prodBar}%` }} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="a-stat-card a-s4">
          <div className="a-stat-icon">🛒</div>
          <div className="a-stat-val">{totalOrders}</div>
          <div className="a-stat-lbl">Total Orders</div>
          <div className={`a-stat-chg ${totalOrders > 0 ? 'a-chg-up' : 'a-chg-dn'}`}>
            {totalOrders > 0 ? `▲ ${totalOrders} total` : '▼ No orders'}
          </div>
          <div className="a-bar-wrap">
            <div className="a-bar-fill" style={{ width: `${ordersBar}%` }} />
          </div>
        </div>

      </div>

      {/* ── Charts ──────────────────────────────────── */}
      <AdminCharts trendData={trendData} brandStatusData={brandStatusData} />

      {/* ── Bottom row ──────────────────────────────── */}
      <div className="a-bottom-row">

        {/* Recent Brands table */}
        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Recent Brands</div>
              <div className="a-card-sub">Latest registered on platform</div>
            </div>
          </div>
          <table className="a-stat-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Products</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBrands.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    No brands yet
                  </td>
                </tr>
              ) : (
                recentBrands.map(brand => (
                  <tr key={brand.id}>
                    <td>{brand.name_en}</td>
                    <td>{productsByBrand[brand.id] ?? 0}</td>
                    <td>
                      <span className={pillClass(brand.status)}>
                        {brand.status.charAt(0).toUpperCase() + brand.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Quick Actions</div>
              <div className="a-card-sub">Platform management shortcuts</div>
            </div>
          </div>
          <div className="a-actions-wrap">
            <Link href="/dashboard/admin/brands"       className="a-action-btn a-primary">Manage Brands</Link>
            <Link href="/dashboard/admin/applications" className="a-action-btn">Review Applications</Link>
            <Link href="/dashboard/admin/products"     className="a-action-btn">Review Products</Link>
            <Link href="/dashboard/admin/orders"       className="a-action-btn">View Orders</Link>
            <Link href="/store"                        className="a-action-btn">View Store</Link>
            <button className="a-action-btn">↑ Export Report</button>
          </div>
        </div>

      </div>
    </>
  )
}
