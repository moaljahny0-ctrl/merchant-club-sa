import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminCharts, type MonthlyDatum, type DistributionDatum } from '@/components/dashboard/AdminCharts'

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

function buildMonthlyData(
  orders: { created_at: string; subtotal: number | null; status: string }[]
): MonthlyDatum[] {
  const now = new Date()
  const months: MonthlyDatum[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      revenue: 0,
      orders: 0,
    })
  }

  for (const order of orders) {
    const d = new Date(order.created_at)
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const slot = months.find(m => m.month === label)
    if (!slot) continue
    slot.orders++
    if (['completed', 'delivered'].includes(order.status)) {
      slot.revenue += Number(order.subtotal ?? 0)
    }
  }

  return months
}

function buildDistributionData(
  orders: { subtotal: number | null; status: string; brands: { name_en: string } | null }[]
): DistributionDatum[] {
  const map: Record<string, number> = {}
  for (const o of orders) {
    if (!['completed', 'delivered'].includes(o.status)) continue
    const name = o.brands?.name_en ?? 'Unknown'
    map[name] = (map[name] ?? 0) + Number(o.subtotal ?? 0)
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [appsRes, pendingProductsRes, brandsRes, allOrdersRes, liveProductsRes, recentOrdersRes] =
    await Promise.all([
      supabase.from('brand_applications').select('id').eq('status', 'pending'),
      supabase.from('products').select('id').eq('status', 'submitted'),
      supabase.from('brands').select('id, status'),
      supabase.from('orders').select('status, subtotal'),
      supabase.from('products').select('id').eq('status', 'live'),
      supabase
        .from('orders')
        .select('created_at, subtotal, status, brands(name_en)')
        .gte('created_at', sixMonthsAgo.toISOString()),
    ])

  const pendingApps     = appsRes.data?.length ?? 0
  const pendingProducts = pendingProductsRes.data?.length ?? 0
  const activeBrands    = brandsRes.data?.filter(b => b.status === 'active').length ?? 0
  const liveProducts    = liveProductsRes.data?.length ?? 0
  const totalOrders     = allOrdersRes.data?.length ?? 0
  const totalRevenue    = (allOrdersRes.data ?? [])
    .filter(o => ['completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0)

  const recentOrders = (recentOrdersRes.data ?? []) as unknown as {
    created_at: string
    subtotal: number | null
    status: string
    brands: { name_en: string } | null
  }[]

  const monthlyData      = buildMonthlyData(recentOrders)
  const distributionData = buildDistributionData(recentOrders)

  const hasActions = pendingApps > 0 || pendingProducts > 0

  const statCards = [
    {
      label: 'Total Revenue',
      value: `SAR ${totalRevenue.toLocaleString('en-SA', { minimumFractionDigits: 0 })}`,
      sub: 'Completed & delivered',
      href: '/dashboard/admin/orders',
      urgent: false,
    },
    {
      label: 'Total Orders',
      value: totalOrders.toString(),
      sub: 'All time',
      href: '/dashboard/admin/orders',
      urgent: false,
    },
    {
      label: 'Active Brands',
      value: activeBrands.toString(),
      sub: `${brandsRes.data?.length ?? 0} total registered`,
      href: '/dashboard/admin/brands',
      urgent: false,
    },
    {
      label: 'Live Products',
      value: liveProducts.toString(),
      sub: 'Visible in storefront',
      href: '/dashboard/admin/products',
      urgent: false,
    },
  ]

  return (
    <div className="p-6 md:p-10 max-w-6xl">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-3">Admin</p>
        <h1 className="font-display text-3xl md:text-4xl font-light text-parchment">
          Platform overview
        </h1>
      </div>

      {/* Requires attention */}
      {hasActions && (
        <div className="border border-gold/25 bg-gold/5 px-6 py-5 mb-8">
          <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-4">Requires attention</p>
          <div className="flex flex-col gap-3">
            {pendingApps > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-parchment text-sm">
                  {pendingApps} brand application{pendingApps !== 1 ? 's' : ''} pending review
                </p>
                <Link
                  href="/dashboard/admin/applications"
                  className="text-[10px] text-gold tracking-[0.15em] uppercase hover:text-gold-light transition-colors shrink-0 ml-4"
                >
                  Review →
                </Link>
              </div>
            )}
            {pendingProducts > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-parchment text-sm">
                  {pendingProducts} product{pendingProducts !== 1 ? 's' : ''} awaiting approval
                </p>
                <Link
                  href="/dashboard/admin/products"
                  className="text-[10px] text-gold tracking-[0.15em] uppercase hover:text-gold-light transition-colors shrink-0 ml-4"
                >
                  Review →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-px">
        {statCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-surface p-6 md:p-8 hover:bg-ink transition-colors group"
          >
            <p className="text-[9px] text-muted tracking-[0.25em] uppercase mb-4 group-hover:text-gold transition-colors">
              {card.label}
            </p>
            <p className="font-display text-2xl md:text-3xl font-light text-parchment mb-1.5 leading-none">
              {card.value}
            </p>
            <p className="text-[10px] text-muted">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts monthlyData={monthlyData} distributionData={distributionData} />

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mt-8">
        <Link
          href="/dashboard/admin/brands"
          className="border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
        >
          Manage brands
        </Link>
        <Link
          href="/dashboard/admin/applications"
          className="border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
        >
          Review applications
        </Link>
        <Link
          href="/dashboard/admin/products"
          className="border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
        >
          Review products
        </Link>
        <Link
          href="/dashboard/admin/orders"
          className="border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
        >
          View orders
        </Link>
      </div>

    </div>
  )
}
