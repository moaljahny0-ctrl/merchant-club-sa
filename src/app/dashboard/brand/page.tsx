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
          <p className="text-[9px] text-gold tracking-[0.4em] uppercase mb-5">
            Merchant Club SA
          </p>
          <h1 className="font-display text-[1.85rem] font-light text-parchment leading-snug mb-5">
            No brand linked<br />to this account.
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-10 max-w-xs mx-auto">
            Your account isn't connected to an active brand. If you applied, we're still reviewing it.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/apply/partner"
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
  const hasProducts = products.length > 0

  const liveProducts = products.filter(p => p.status === 'live').length
  const pendingReview = products.filter(p => p.status === 'submitted').length
  const totalRevenue = orders
    .filter(o => ['completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (o.subtotal ?? 0), 0)
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'fulfilling'].includes(o.status)).length

  return (
    <div className="p-8 md:p-12 max-w-3xl">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] text-gold tracking-[0.35em] uppercase mb-3">Brand Dashboard</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
          {brand?.name_en ?? 'Your Brand'}
        </h1>
      </div>

      {/* ── GETTING STARTED — shown when brand has no products ── */}
      {!hasProducts && (
        <div className="mb-10">
          <div className="border border-gold/30 bg-gold/5 px-7 py-7 mb-6">
            <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-3">Getting started</p>
            <p className="text-parchment text-base font-light leading-relaxed mb-6">
              Your dashboard is ready. The first thing to do is add a product — give it a name, price, image, and a short description.
            </p>
            <Link
              href="/dashboard/brand/products/new"
              className="inline-flex items-center bg-gold text-ink text-[10px] font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-gold-light transition-colors"
            >
              Add your first product
            </Link>
          </div>

          {/* Steps */}
          <div className="border border-border divide-y divide-border">
            {[
              {
                n: '1',
                title: 'Add a product',
                body: 'Enter the name, price, a short description, and upload an image. Takes about 2 minutes.',
                done: false,
              },
              {
                n: '2',
                title: 'Submit for review',
                body: 'Once your product looks good, submit it. Our team reviews it before it goes live.',
                done: false,
              },
              {
                n: '3',
                title: 'Go live',
                body: 'Approved products appear on the platform where creators can start promoting them.',
                done: false,
              },
            ].map(step => (
              <div key={step.n} className="flex gap-5 px-6 py-5">
                <div className="shrink-0 w-6 h-6 border border-border flex items-center justify-center mt-0.5">
                  <span className="text-[10px] text-muted">{step.n}</span>
                </div>
                <div>
                  <p className="text-parchment text-sm font-medium mb-1">{step.title}</p>
                  <p className="text-muted text-xs leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What you can do */}
          <div className="mt-6 border border-border px-6 py-5">
            <p className="text-[9px] text-muted/50 tracking-[0.25em] uppercase mb-4">As a brand owner you can</p>
            <div className="grid grid-cols-2 gap-y-2">
              {[
                'Add and edit products',
                'Upload product images',
                'Set prices in SAR',
                'Submit products for review',
                'See your product statuses',
                'View orders (when live)',
              ].map(item => (
                <p key={item} className="text-xs text-muted/70 leading-relaxed">
                  <span className="text-gold mr-2">—</span>{item}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE DASHBOARD — shown when brand has products ── */}
      {hasProducts && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: 'Live', value: String(liveProducts), sub: 'Products live' },
              { label: 'In review', value: String(pendingReview), sub: 'Awaiting approval' },
              { label: 'Open orders', value: String(pendingOrders), sub: 'Need fulfillment' },
              { label: 'Revenue', value: `${totalRevenue.toLocaleString('en-SA', { minimumFractionDigits: 0 })} SAR`, sub: 'Completed orders' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface border border-border px-5 py-6">
                <p className="text-[8px] text-muted/60 tracking-[0.2em] uppercase mb-3">{stat.label}</p>
                <p className="text-3xl font-light text-parchment leading-none mb-2">{stat.value}</p>
                <p className="text-[9px] text-muted/40 tracking-wide">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
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
          </div>
        </>
      )}

    </div>
  )
}
