import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SalesTrendCard, DonutCard, type TrendDatum, type DonutDatum } from '@/components/dashboard/AdminCharts'

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

type OrderItemRow = { product_id: string; title: string; quantity: number; total: number }

type OrderRow = {
  id: string
  order_number: string
  brand_id: string
  customer_email: string | null
  subtotal: number
  status: string
  items: unknown
  created_at: string
  brands: { name_en: string } | { name_en: string }[] | null
}

const NON_REVENUE_STATUSES = ['cancelled', 'refunded']

function brandNameOf(row: OrderRow): string {
  const brand = row.brands
  const single = Array.isArray(brand) ? brand[0] : brand
  return single?.name_en ?? 'Unknown'
}

function revenueOf(rows: OrderRow[]): number {
  return rows
    .filter(o => !NON_REVENUE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0)
}

function pctChange(curr: number, prev: number): { value: number; isNew: boolean } {
  if (prev === 0) return { value: curr > 0 ? 100 : 0, isNew: curr > 0 }
  return { value: Math.round(((curr - prev) / prev) * 100), isNew: false }
}

function buildSalesTrend(orders: OrderRow[]): TrendDatum[] {
  const days: TrendDatum[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000)
    const dayKey = day.toISOString().slice(0, 10)
    const revenue = revenueOf(orders.filter(o => o.created_at.slice(0, 10) === dayKey))
    days.push({ label: day.toLocaleDateString('en-GB', { weekday: 'short' }), revenue })
  }
  return days
}

function buildOrderStatusData(orders: OrderRow[]): DonutDatum[] {
  const buckets = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 }
  for (const o of orders) {
    if (o.status === 'pending') buckets.Pending++
    else if (o.status === 'confirmed' || o.status === 'fulfilling') buckets.Processing++
    else if (o.status === 'shipped') buckets.Shipped++
    else if (o.status === 'delivered' || o.status === 'completed') buckets.Delivered++
    else if (NON_REVENUE_STATUSES.includes(o.status)) buckets.Cancelled++
  }
  return Object.entries(buckets)
    .map(([label, value]) => ({ label, value }))
    .filter(d => d.value > 0)
}

function buildSalesByBrand(orders: OrderRow[]): DonutDatum[] {
  const byBrand: Record<string, { name: string; value: number }> = {}
  for (const o of orders) {
    if (NON_REVENUE_STATUSES.includes(o.status)) continue
    if (!byBrand[o.brand_id]) byBrand[o.brand_id] = { name: brandNameOf(o), value: 0 }
    byBrand[o.brand_id].value += Number(o.subtotal ?? 0)
  }
  const sorted = Object.values(byBrand).sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, 4).map(b => ({ label: b.name, value: Math.round(b.value) }))
  const othersTotal = sorted.slice(4).reduce((s, b) => s + b.value, 0)
  if (othersTotal > 0) top.push({ label: 'Others', value: Math.round(othersTotal) })
  return top
}

function buildTopProducts(orders: OrderRow[]): { id: string; title: string; qty: number; revenue: number }[] {
  const byProduct: Record<string, { title: string; qty: number; revenue: number }> = {}
  for (const o of orders) {
    if (NON_REVENUE_STATUSES.includes(o.status)) continue
    const items = Array.isArray(o.items) ? (o.items as OrderItemRow[]) : []
    for (const item of items) {
      if (!item?.product_id) continue
      if (!byProduct[item.product_id]) {
        byProduct[item.product_id] = { title: item.title ?? 'Unknown product', qty: 0, revenue: 0 }
      }
      byProduct[item.product_id].qty += Number(item.quantity ?? 0)
      byProduct[item.product_id].revenue += Number(item.total ?? 0)
    }
  }
  return Object.entries(byProduct)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
}

function orderPillClass(status: string): string {
  if (status === 'pending') return 'a-pill a-p-pending'
  if (status === 'confirmed' || status === 'fulfilling') return 'a-pill a-p-review'
  if (status === 'shipped') return 'a-pill a-p-shipped'
  if (status === 'delivered' || status === 'completed') return 'a-pill a-p-delivered'
  return 'a-pill a-p-cancelled'
}

function ChangeBadge({ change, isNew }: { change: number; isNew: boolean }) {
  if (isNew) return <span className="a-stat-chg a-chg-up">New</span>
  if (change > 0) return <span className="a-stat-chg a-chg-up">▲ {change}%</span>
  if (change < 0) return <span className="a-stat-chg a-chg-dn">▼ {Math.abs(change)}%</span>
  return <span className="a-stat-chg a-chg-neutral">Flat</span>
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const service = createServiceClient()
  const period30Start = new Date(Date.now() - 30 * 86400000)
  const period60Start = new Date(Date.now() - 60 * 86400000)

  const [
    ordersRes,
    customersTotalRes,
    customersBeforeRes,
    storefrontViewsRes,
    brandsRes,
    appsRes,
    productsRes,
  ] = await Promise.all([
    service
      .from('orders')
      .select('id, order_number, brand_id, customer_email, subtotal, status, items, created_at, brands(name_en)')
      .order('created_at', { ascending: false }),
    service.from('customers').select('id', { count: 'exact', head: true }),
    service.from('customers').select('id', { count: 'exact', head: true }).lt('created_at', period30Start.toISOString()),
    service
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'storefront_view')
      .gte('created_at', period30Start.toISOString()),
    service.from('brands').select('id, status'),
    service.from('brand_applications').select('status'),
    service
      .from('products')
      .select('id, title_en, stock_quantity, low_stock_threshold, brands(name_en)')
      .eq('status', 'live'),
  ])

  const orders = (ordersRes.data ?? []) as OrderRow[]
  const current30 = orders.filter(o => new Date(o.created_at) >= period30Start)
  const prior30 = orders.filter(o => new Date(o.created_at) >= period60Start && new Date(o.created_at) < period30Start)

  const revenueCurr = revenueOf(current30)
  const revenuePrior = revenueOf(prior30)
  const ordersCurrCount = current30.length
  const ordersPriorCount = prior30.length
  const completedCurrCount = current30.filter(o => !NON_REVENUE_STATUSES.includes(o.status)).length
  const aovCurr = completedCurrCount > 0 ? revenueCurr / completedCurrCount : 0
  const completedPriorCount = prior30.filter(o => !NON_REVENUE_STATUSES.includes(o.status)).length
  const aovPrior = completedPriorCount > 0 ? revenuePrior / completedPriorCount : 0

  const totalCustomers = customersTotalRes.count ?? 0
  const customersBefore30 = customersBeforeRes.count ?? 0
  const storefrontViews30 = storefrontViewsRes.count ?? 0

  const revenueChange = pctChange(revenueCurr, revenuePrior)
  const ordersChange = pctChange(ordersCurrCount, ordersPriorCount)
  const aovChange = pctChange(aovCurr, aovPrior)
  const customersChange = pctChange(totalCustomers, customersBefore30)

  const conversionRate = storefrontViews30 > 0 ? (completedCurrCount / storefrontViews30) * 100 : 0

  const refundedCount = orders.filter(o => o.status === 'refunded').length
  const refundRate = orders.length > 0 ? (refundedCount / orders.length) * 100 : 0

  const ordersByCustomer: Record<string, number> = {}
  for (const o of orders) {
    if (!o.customer_email) continue
    ordersByCustomer[o.customer_email] = (ordersByCustomer[o.customer_email] ?? 0) + 1
  }
  const customersWithOrders = Object.keys(ordersByCustomer).length
  const repeatCustomers = Object.values(ordersByCustomer).filter(c => c > 1).length
  const repeatRate = customersWithOrders > 0 ? (repeatCustomers / customersWithOrders) * 100 : 0

  const allBrands = brandsRes.data ?? []
  const activeBrandsCount = allBrands.filter(b => b.status === 'active').length

  const allApps = appsRes.data ?? []
  const newApplications = allApps.filter(a => a.status === 'pending').length
  const underReview = allApps.filter(a => a.status === 'info_requested').length

  type LowStockProduct = {
    id: string
    title_en: string
    stock_quantity: number
    low_stock_threshold: number
    brands: { name_en: string } | { name_en: string }[] | null
  }
  const lowStock = ((productsRes.data ?? []) as LowStockProduct[])
    .filter(p => p.stock_quantity <= p.low_stock_threshold)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 4)

  const recentOrders = orders.slice(0, 5)
  const salesTrend = buildSalesTrend(orders)
  const orderStatusData = buildOrderStatusData(orders)
  const salesByBrandData = buildSalesByBrand(orders)
  const topProducts = buildTopProducts(orders)
  const maxTopProductQty = Math.max(...topProducts.map(p => p.qty), 1)

  const sar = (v: number) => `SAR ${Math.round(v).toLocaleString()}`

  return (
    <>
      <div style={{ marginBottom: 4 }}>
        <p className="a-card-sub">Overview of the last 30 days</p>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="a-stat-grid">
        <div className="a-stat-card a-s1">
          <div className="a-stat-icon">💰</div>
          <div className="a-stat-val">{sar(revenueCurr)}</div>
          <div className="a-stat-lbl">Total Sales</div>
          <ChangeBadge change={revenueChange.value} isNew={revenueChange.isNew} />
        </div>

        <div className="a-stat-card a-s2">
          <div className="a-stat-icon">🛍</div>
          <div className="a-stat-val">{ordersCurrCount}</div>
          <div className="a-stat-lbl">Orders</div>
          <ChangeBadge change={ordersChange.value} isNew={ordersChange.isNew} />
        </div>

        <div className="a-stat-card a-s3">
          <div className="a-stat-icon">👥</div>
          <div className="a-stat-val">{totalCustomers}</div>
          <div className="a-stat-lbl">Customers</div>
          <ChangeBadge change={customersChange.value} isNew={customersChange.isNew} />
        </div>

        <div className="a-stat-card a-s4">
          <div className="a-stat-icon">📈</div>
          <div className="a-stat-val">{sar(aovCurr)}</div>
          <div className="a-stat-lbl">Average Order Value</div>
          <ChangeBadge change={aovChange.value} isNew={aovChange.isNew} />
        </div>
      </div>

      {/* ── Sales trend / orders status / recent orders ──────────── */}
      <div className="a-row-wide">
        <SalesTrendCard data={salesTrend} />

        <DonutCard
          title="Orders Status"
          subtitle="All orders"
          data={orderStatusData}
          emptyLabel="No orders yet"
        />

        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Recent Orders</div>
              <div className="a-card-sub">Latest activity</div>
            </div>
            <Link href="/dashboard/admin/orders" className="a-view-all">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>No orders yet</span>
            </div>
          ) : (
            recentOrders.map(o => (
              <div key={o.id} className="a-order-row">
                <div>
                  <div className="a-order-id">#{o.order_number}</div>
                  <div className="a-order-brand">{brandNameOf(o)}</div>
                </div>
                <div className="a-order-amt">{sar(o.subtotal)}</div>
                <span className={orderPillClass(o.status)}>
                  {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Top products / sales by brand / store performance ────── */}
      <div className="a-row-even3">
        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Top Selling Products</div>
              <div className="a-card-sub">Last 30 days</div>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>No sales yet</span>
            </div>
          ) : (
            topProducts.map(p => (
              <div key={p.id} className="a-prod-row">
                <div className="a-thumb" />
                <div className="a-prod-info">
                  <div className="a-prod-top">
                    <span>{p.title}</span>
                    <span>{sar(p.revenue)}</span>
                  </div>
                  <div className="a-prod-sub">{p.qty} sold</div>
                  <div className="a-bar-wrap">
                    <div className="a-bar-fill" style={{ width: `${Math.round((p.qty / maxTopProductQty) * 100)}%`, background: 'var(--gold)' }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DonutCard
          title="Sales by Brand"
          subtitle="Top revenue share"
          data={salesByBrandData}
          emptyLabel="No sales yet"
          valueKind="currency"
        />

        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Store Performance</div>
              <div className="a-card-sub">Platform-wide</div>
            </div>
          </div>
          <div className="a-perf-row">
            <span className="a-perf-ic">✔</span>
            <span className="a-perf-label">Conversion Rate</span>
            <span className="a-perf-val">{conversionRate.toFixed(2)}%</span>
          </div>
          <div className="a-perf-row">
            <span className="a-perf-ic">↺</span>
            <span className="a-perf-label">Refund Rate</span>
            <span className="a-perf-val">{refundRate.toFixed(2)}%</span>
          </div>
          <div className="a-perf-row">
            <span className="a-perf-ic">🔁</span>
            <span className="a-perf-label">Repeat Customer Rate</span>
            <span className="a-perf-val">{repeatRate.toFixed(1)}%</span>
          </div>
          <div className="a-perf-row">
            <span className="a-perf-ic">🏷️</span>
            <span className="a-perf-label">Active Partners</span>
            <span className="a-perf-val">{activeBrandsCount}</span>
          </div>
        </div>
      </div>

      {/* ── Partner applications / low stock ─────────────────────── */}
      <div className="a-bottom-row">
        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Partner Applications</div>
              <div className="a-card-sub">Brand pipeline</div>
            </div>
          </div>
          <div className="a-pstat-row">
            <div className="a-pstat">
              <span className="a-pstat-ic" style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}>📋</span>
              <div><div className="a-pstat-v">{newApplications}</div><div className="a-pstat-l">New Applications</div></div>
            </div>
            <div className="a-pstat">
              <span className="a-pstat-ic" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>⏱</span>
              <div><div className="a-pstat-v">{underReview}</div><div className="a-pstat-l">Info Requested</div></div>
            </div>
            <div className="a-pstat">
              <span className="a-pstat-ic" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>✅</span>
              <div><div className="a-pstat-v">{activeBrandsCount}</div><div className="a-pstat-l">Active Partners</div></div>
            </div>
            <Link href="/dashboard/admin/brands" className="a-action-btn a-primary" style={{ marginLeft: 'auto' }}>
              Manage Partners
            </Link>
          </div>
        </div>

        <div className="a-chart-card">
          <div className="a-card-header">
            <div>
              <div className="a-card-title">Low Stock Alert</div>
              <div className="a-card-sub">Live products at or under threshold</div>
            </div>
            <Link href="/dashboard/admin/products" className="a-view-all">
              View all
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Nothing low on stock</span>
            </div>
          ) : (
            lowStock.map(p => {
              const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands
              const pct = p.low_stock_threshold > 0
                ? Math.min(100, Math.round((p.stock_quantity / p.low_stock_threshold) * 100))
                : 0
              return (
                <div key={p.id} className="a-prod-row">
                  <div className="a-thumb" />
                  <div className="a-prod-info">
                    <div className="a-prod-top">
                      <span>{p.title_en}</span>
                      <span className="a-prod-sub">{brand?.name_en ?? ''}</span>
                    </div>
                    <div className="a-prod-sub" style={{ color: 'var(--red)', fontWeight: 700 }}>
                      {p.stock_quantity} in stock
                    </div>
                    <div className="a-bar-wrap">
                      <div className="a-bar-fill" style={{ width: `${pct}%`, background: 'var(--red)' }} />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
