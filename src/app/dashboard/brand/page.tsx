import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function BrandOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get brand membership
  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id, role, brands(id, name_en, status, onboarding_state)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) {
    return (
      <div className="p-8 max-w-lg">
        <h1 className="font-display text-3xl font-light text-parchment mb-3">No brand found</h1>
        <p className="text-muted text-sm">Your account is not associated with any active brand. Contact support if this is unexpected.</p>
      </div>
    )
  }

  const rawBrand = member.brands
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand
  const brandId = member.brand_id

  // Fetch stats in parallel
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
    { label: 'Live Products', value: liveProducts },
    { label: 'Pending Review', value: pendingReview },
    { label: 'Open Orders', value: pendingOrders },
    { label: 'Total Revenue', value: `SAR ${totalRevenue.toLocaleString('en-SA', { minimumFractionDigits: 2 })}` },
  ]

  return (
    <div className="p-6 md:p-10 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-2">Dashboard</p>
        <h1 className="font-display text-3xl md:text-4xl font-light text-parchment">
          {brand?.name_en ?? 'Your Brand'}
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="bg-surface border border-border p-5">
            <p className="text-[9px] text-muted tracking-[0.25em] uppercase mb-3">{stat.label}</p>
            <p className="text-2xl font-light text-parchment">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <h2 className="text-[10px] text-muted tracking-[0.25em] uppercase mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/brand/products/new"
            className="inline-flex items-center bg-gold text-ink text-xs font-medium tracking-[0.15em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
          >
            Add product
          </Link>
          <Link
            href="/dashboard/brand/products"
            className="inline-flex items-center border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            View products
          </Link>
          <Link
            href="/dashboard/brand/orders"
            className="inline-flex items-center border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            View orders
          </Link>
          <Link
            href="/dashboard/brand/profile"
            className="inline-flex items-center border border-border text-parchment text-xs tracking-[0.15em] uppercase px-6 py-3 hover:border-gold hover:text-gold transition-colors"
          >
            Edit profile
          </Link>
        </div>
      </div>

      {/* Status notice */}
      {brand?.status !== 'active' && (
        <div className="border border-gold/30 bg-gold/5 px-5 py-4">
          <p className="text-gold text-xs font-medium mb-1 tracking-wide">Brand status: {brand?.status}</p>
          <p className="text-muted text-xs">
            {brand?.status === 'pending'
              ? 'Your brand is under review. You can add products while waiting for approval.'
              : brand?.status === 'approved'
              ? 'Your brand is approved. Complete your profile to go live.'
              : 'Contact support for help with your brand status.'}
          </p>
        </div>
      )}
    </div>
  )
}
