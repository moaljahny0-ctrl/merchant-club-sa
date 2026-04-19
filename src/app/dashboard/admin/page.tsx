import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await assertAdmin(supabase, user.id)

  // Fetch counts in parallel
  const [appsRes, productsRes, brandsRes, ordersRes] = await Promise.all([
    supabase.from('brand_applications').select('status').eq('status', 'pending'),
    supabase.from('products').select('status').eq('status', 'submitted'),
    supabase.from('brands').select('id, status'),
    supabase.from('orders').select('status'),
  ])

  const pendingApps = appsRes.data?.length ?? 0
  const pendingProducts = productsRes.data?.length ?? 0
  const totalBrands = brandsRes.data?.length ?? 0
  const activeBrands = brandsRes.data?.filter(b => b.status === 'active').length ?? 0
  const totalOrders = ordersRes.data?.length ?? 0

  const stats = [
    { label: 'Pending Applications', value: pendingApps, href: '/dashboard/admin/applications', urgent: pendingApps > 0 },
    { label: 'Products to Review', value: pendingProducts, href: '/dashboard/admin/products', urgent: pendingProducts > 0 },
    { label: 'Active Brands', value: `${activeBrands} / ${totalBrands}`, href: '/dashboard/admin/applications' },
    { label: 'Total Orders', value: totalOrders, href: '/dashboard/admin/orders' },
  ]

  const hasActions = pendingApps > 0 || pendingProducts > 0

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-2">Admin</p>
        <h1 className="font-display text-3xl md:text-4xl font-light text-parchment">Platform overview</h1>
      </div>

      {/* Priority Action Card */}
      {hasActions && (
        <div className="border border-gold/30 bg-gold/5 px-6 py-5 mb-8">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-surface border p-5 hover:border-gold transition-colors ${
              stat.urgent ? 'border-gold/40' : 'border-border'
            }`}
          >
            <p className="text-[9px] text-muted tracking-[0.25em] uppercase mb-3">{stat.label}</p>
            <p className={`text-2xl font-light ${stat.urgent ? 'text-gold' : 'text-parchment'}`}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
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
