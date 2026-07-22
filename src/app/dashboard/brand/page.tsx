import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { dt, type DashLang } from '@/lib/dashboard-i18n'

function OnboardingBanner({ state, locale }: { state: string; locale: DashLang }) {
  const t = dt(locale)
  const step = t.onboarding[state as keyof typeof t.onboarding]
  if (!step) return null
  const href = state === 'invited' || state === 'account_setup'
    ? '/dashboard/brand/profile'
    : state === 'products_setup'
    ? '/dashboard/brand/products/new'
    : undefined
  return (
    <div className="mb-8 border border-gold/20 bg-gold/5 px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-gold/60" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-1">{step.label}</p>
          <p className="text-parchment text-base leading-relaxed mb-3">{step.next}</p>
          {'action' in step && step.action && href && (
            <Button href={href} native variant="primary" className="bg-gold text-ink hover:bg-gold-light">
              {step.action}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function BrandOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale)

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
          <p className="text-[12px] text-gold tracking-[0.4em] uppercase mb-5">
            Merchant Club SA
          </p>
          <h1 className="font-display text-[1.85rem] font-light text-parchment leading-snug mb-5">
            {t.overview.no_brand_heading.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-muted text-base leading-relaxed mb-10 max-w-xs mx-auto">
            {t.overview.no_brand_body}
          </p>
          <div className="flex flex-col gap-3">
            <Button href="/apply/partner" native variant="primary" className="bg-gold text-ink hover:bg-gold-light">
              {t.overview.no_brand_apply}
            </Button>
            <Button href="mailto:info@merchantclubsa.com" variant="secondary" className="border-border text-parchment hover:border-gold hover:text-gold">
              {t.overview.no_brand_contact}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const rawBrand = member.brands
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand
  const brandId = member.brand_id
  const onboardingState = (brand as { onboarding_state?: string } | null)?.onboarding_state ?? 'invited'

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
        <p className="text-[12px] text-gold tracking-[0.35em] uppercase mb-3">{t.overview.eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
          {brand?.name_en ?? 'Your Brand'}
        </h1>
      </div>

      {/* Onboarding status banner */}
      {onboardingState !== 'live' && (
        <OnboardingBanner state={onboardingState} locale={locale} />
      )}

      {/* Getting started — shown when brand has no products */}
      {!hasProducts && (
        <div className="mb-10">
          <div className="border border-gold/30 bg-gold/5 px-7 py-7 mb-6">
            <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-3">{t.overview.getting_started}</p>
            <p className="text-parchment text-base font-light leading-relaxed mb-6">
              {t.overview.getting_started_body}
            </p>
            <Button
              href="/dashboard/brand/products/new"
              native
              variant="primary"
              className="bg-gold text-ink hover:bg-gold-light"
            >
              {t.overview.add_first_product}
            </Button>
          </div>

          {/* Steps */}
          <div className="border border-border divide-y divide-border rounded-lg overflow-hidden">
            {t.overview.steps.map(step => (
              <div key={step.n} className="flex gap-5 px-6 py-5">
                <div className="shrink-0 w-6 h-6 border border-border rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-[13px] text-muted">{step.n}</span>
                </div>
                <div>
                  <p className="text-parchment text-base font-medium mb-1">{step.title}</p>
                  <p className="text-muted text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="mt-6 border border-border rounded-lg px-6 py-5">
            <p className="text-[12px] text-muted/50 tracking-[0.25em] uppercase mb-4">{t.overview.capabilities_label}</p>
            <div className="grid grid-cols-2 gap-y-2">
              {t.overview.capabilities.map(item => (
                <p key={item} className="text-sm text-muted/70 leading-relaxed">
                  <span className="text-gold mr-2">—</span>{item}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active dashboard — shown when brand has products */}
      {hasProducts && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: t.overview.stat_live,    value: String(liveProducts),    sub: t.overview.stat_live_sub },
              { label: t.overview.stat_review,  value: String(pendingReview),   sub: t.overview.stat_review_sub },
              { label: t.overview.stat_orders,  value: String(pendingOrders),   sub: t.overview.stat_orders_sub },
              { label: t.overview.stat_revenue, value: `${totalRevenue.toLocaleString('en-SA', { minimumFractionDigits: 0 })} SAR`, sub: t.overview.stat_revenue_sub },
            ].map(stat => (
              <div key={stat.label} className="bg-surface border border-border rounded-lg px-5 py-6">
                <p className="text-[12px] text-muted/60 tracking-[0.2em] uppercase mb-3">{stat.label}</p>
                <p className="text-3xl font-light text-parchment leading-none mb-2">{stat.value}</p>
                <p className="text-[12px] text-muted/40 tracking-wide">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/brand/products/new" native variant="primary" className="bg-gold text-ink hover:bg-gold-light">
              {t.overview.add_product}
            </Button>
            <Button href="/dashboard/brand/products" native variant="secondary" className="border-border text-parchment hover:border-gold hover:text-gold">
              {t.overview.products_btn}
            </Button>
            <Button href="/dashboard/brand/orders" native variant="secondary" className="border-border text-parchment hover:border-gold hover:text-gold">
              {t.overview.orders_btn}
            </Button>
          </div>
        </>
      )}

    </div>
  )
}
