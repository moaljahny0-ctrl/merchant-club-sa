import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function BrandOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id, role, brands(id, name_en, status, onboarding_state)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-[380px] w-full text-center">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="h-px w-10 bg-border" />
            <div className="w-1.5 h-1.5 border border-border rotate-45" />
            <div className="h-px w-10 bg-border" />
          </div>

          <p className="text-[9px] text-gold tracking-[0.4em] uppercase mb-5">
            Merchant Club SA
          </p>

          <h1 className="font-display text-[1.85rem] font-light text-parchment leading-snug mb-5">
            No brand linked<br />to this account.
          </h1>

          <p className="text-muted text-sm leading-relaxed mb-12 max-w-xs mx-auto">
            Your account isn't connected to an active brand yet. If you applied, we're still reviewing it.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="/apply"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              Apply as a brand
            </a>
            <a
              href="mailto:info@merchantclubsa.com"
              className="inline-flex items-center justify-center border border-border text-parchment text-[10px] tracking-[0.22em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              Contact support
            </a>
          </div>

          <p className="mt-10 text-[10px] text-muted/30 tracking-[0.15em]">
            info@merchantclubsa.com
          </p>
        </div>
      </div>
    )
  }

  const rawBrand = member.brands
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand
  const brandId = member.brand_id

  const [productsRes, ordersRes] = await Promise.all([
    supabase.from('products').select('status').eq('brand_id', brandId),
    supabase.from('orders').select('status, subtotal').eq('brand_id', brandId),
  ])

  const products = productsRes.data ?? []
  const orders = ordersRes.data ?? []

  const liveProducts = products.filter(p => p.status === 'live').length
  const pendingReview = products.filter(p => p.status === 'submitted').length
  const totalRevenue = orders
    .filter(o => ['completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (o.subtotal ?? 0), 0)
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'fulfilling'].includes(o.status)).length

  const stats = [
    { label: 'Live Products', value: String(liveProducts), sub: 'Active listings' },
    { label: 'Pending Review', value: String(pendingReview), sub: 'Awaiting approval' },
    { label: 'Open Orders', value: String(pendingOrders), sub: 'Need fulfillment' },
    {
      label: 'Total Revenue',
      value: `${totalRevenue.toLocaleString('en-SA', { minimumFractionDigits: 0 })}`,
      sub: 'SAR — completed orders',
    },
  ]

  return (
    <div className="p-8 md:p-12 max-w-5xl">

      {/* Page header */}
      <div className="mb-12">
        <p className="text-[9px] text-gold tracking-[0.35em] uppercase mb-3">Overview</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
          {brand?.name_en ?? 'Your Brand'}
        </h1>
      </div>

      {/* Status notice */}
      {brand?.status !== 'active' && (
        <div className="border border-gold/25 bg-gold/5 px-6 py-5 mb-10">
          <p className="text-gold text-[10px] font-medium mb-1.5 tracking-[0.2em] uppercase">
            Status — {brand?.status}
          </p>
          <p className="text-muted text-sm leading-relaxed">
            {brand?.status === 'pending'
              ? 'Your brand is under review. You can add products while waiting for approval.'
              : brand?.status === 'approved'
              ? 'Your brand is approved. Complete your profile to go live.'
              : 'Contact support for help with your brand status.'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mb-2">
        <p className="text-[8px] text-muted/50 tracking-[0.25em] uppercase mb-4">Performance</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className="bg-surface border border-border px-5 py-6">
              <p className="text-[8px] text-muted/60 tracking-[0.2em] uppercase mb-3">{stat.label}</p>
              <p className="text-4xl font-light text-parchment leading-none mb-2">{stat.value}</p>
              <p className="text-[9px] text-muted/40 tracking-wide">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-10" />

      {/* Primary action + quick links */}
      <div className="mb-10">
        <p className="text-[8px] text-muted/50 tracking-[0.25em] uppercase mb-4">Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/brand/products/new"
            className="inline-flex items-center bg-gold text-ink text-[10px] font-medium tracking-[0.18em] uppercase px-7 py-3.5 hover:bg-gold-light transition-colors"
          >
            + Add product
          </Link>
          <Link
            href="/dashboard/brand/products"
            className="inline-flex items-center border border-border text-parchment text-[10px] tracking-[0.18em] uppercase px-7 py-3.5 hover:border-gold hover:text-gold transition-colors"
          >
            Products
          </Link>
          <Link
            href="/dashboard/brand/orders"
            className="inline-flex items-center border border-border text-parchment text-[10px] tracking-[0.18em] uppercase px-7 py-3.5 hover:border-gold hover:text-gold transition-colors"
          >
            Orders
          </Link>
          <Link
            href="/dashboard/brand/profile"
            className="inline-flex items-center border border-border text-parchment text-[10px] tracking-[0.18em] uppercase px-7 py-3.5 hover:border-gold hover:text-gold transition-colors"
          >
            Edit profile
          </Link>
        </div>
      </div>

    </div>
  )
}
