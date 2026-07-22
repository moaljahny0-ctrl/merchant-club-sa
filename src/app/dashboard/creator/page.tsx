import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import { CreatorLinksClient } from '@/components/dashboard/CreatorLinksClient'
import { Button } from '@/components/ui/Button'

export default async function CreatorOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale)

  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.id)

  const isCreator = (rolesData ?? []).some(
    (r: { roles: { name: string } | { name: string }[] }) => {
      const roles = Array.isArray(r.roles) ? r.roles : [r.roles]
      return roles.some(role => role.name === 'creator')
    }
  )

  if (!isCreator) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-[380px] w-full text-center">
          <p className="text-[12px] text-gold tracking-[0.4em] uppercase mb-5">
            Merchant Club SA
          </p>
          <h1 className="font-display text-[1.85rem] font-light text-parchment leading-snug mb-5">
            No creator access on this account.
          </h1>
          <p className="text-muted text-base leading-relaxed mb-10 max-w-xs mx-auto">
            If you applied to become a creator, we&apos;re still reviewing it.
          </p>
          <div className="flex flex-col gap-3">
            <Button href="/apply/member" native variant="primary" className="bg-gold text-ink hover:bg-gold-light">
              Apply as a creator
            </Button>
            <Button href="mailto:info@merchantclubsa.com" variant="secondary" className="border-border text-parchment hover:border-gold hover:text-gold">
              Contact support
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const service = createServiceClient()

  const [linksRes, brandsRes] = await Promise.all([
    supabase
      .from('creator_links')
      .select('id, link_code, commission_rate, created_at, brand_id, brands(id, name_en, name_ar, slug)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
    // Public brand listing — RLS on `brands` doesn't grant creators SELECT,
    // so this must go through the service client like the storefront does.
    service
      .from('brands')
      .select('id, name_en, name_ar, slug')
      .eq('status', 'approved')
      .eq('onboarding_state', 'live'),
  ])

  const linkIds = (linksRes.data ?? []).map(l => l.id as string)

  // Clicks + conversions + estimated earnings per link. First-pass calculation
  // using each link's own commission_rate against order subtotal — orders.
  // creator_commission is never populated at write time (checked orders.ts),
  // so this is computed at read time rather than trusting a stored column.
  const [clicksRes, ordersRes] = linkIds.length > 0
    ? await Promise.all([
        service
          .from('analytics_events')
          .select('creator_link_id')
          .eq('event_type', 'creator_link_click')
          .in('creator_link_id', linkIds),
        service
          .from('orders')
          .select('creator_link_id, subtotal, status')
          .in('creator_link_id', linkIds),
      ])
    : [{ data: [] }, { data: [] }]

  const clicksByLink: Record<string, number> = {}
  for (const row of clicksRes.data ?? []) {
    const id = row.creator_link_id as string
    clicksByLink[id] = (clicksByLink[id] ?? 0) + 1
  }

  const conversionsByLink: Record<string, number> = {}
  const earningsByLink: Record<string, number> = {}
  const rateByLink: Record<string, number> = {}
  for (const l of linksRes.data ?? []) {
    rateByLink[l.id as string] = Number(l.commission_rate)
  }
  for (const o of ordersRes.data ?? []) {
    const id = o.creator_link_id as string | null
    if (!id) continue
    if (o.status === 'cancelled') continue
    conversionsByLink[id] = (conversionsByLink[id] ?? 0) + 1
    const rate = rateByLink[id] ?? 0
    earningsByLink[id] = (earningsByLink[id] ?? 0) + Number(o.subtotal ?? 0) * (rate / 100)
  }

  const totalClicks = Object.values(clicksByLink).reduce((a, b) => a + b, 0)
  const totalConversions = Object.values(conversionsByLink).reduce((a, b) => a + b, 0)
  const totalEarnings = Object.values(earningsByLink).reduce((a, b) => a + b, 0)
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

  const links = (linksRes.data ?? []).map(l => {
    const rawBrand = l.brands
    const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand
    const id = l.id as string
    return {
      id,
      linkCode: l.link_code as string,
      commissionRate: Number(l.commission_rate),
      createdAt: l.created_at as string,
      brandId: l.brand_id as string,
      brandName: (brand as { name_en: string; name_ar: string | null } | null)?.name_en ?? 'Brand',
      brandSlug: (brand as { slug: string } | null)?.slug ?? '',
      clicks: clicksByLink[id] ?? 0,
      conversions: conversionsByLink[id] ?? 0,
      earnings: earningsByLink[id] ?? 0,
    }
  })

  const linkedBrandIds = new Set(links.map(l => l.brandId))
  const availableBrands = (brandsRes.data ?? [])
    .filter(b => !linkedBrandIds.has(b.id))
    .map(b => ({ id: b.id as string, name: b.name_en as string, slug: b.slug as string }))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

  return (
    <div className="p-8 md:p-12 max-w-3xl">
      <div className="mb-10">
        <p className="text-[12px] text-gold tracking-[0.35em] uppercase mb-3">{t.creator.eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
          {t.creator.heading}
        </h1>
      </div>

      {/* Stat cards — clicks, conversions, estimated earnings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {[
          { label: t.creator.stats_clicks,      value: totalClicks.toLocaleString() },
          { label: t.creator.stats_conversions, value: totalConversions.toLocaleString() },
          { label: t.creator.stats_conv_rate,   value: `${conversionRate.toFixed(1)}%` },
          { label: t.creator.stats_earnings,    value: `SAR ${totalEarnings.toFixed(2)}` },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-lg px-5 py-6">
            <p className="text-[12px] text-muted/60 tracking-[0.2em] uppercase mb-3">{stat.label}</p>
            <p className="text-2xl font-light text-parchment leading-none">{stat.value}</p>
          </div>
        ))}
      </div>
      <p className="text-muted/60 text-[14px] mb-10">{t.creator.stats_note}</p>

      {links.length > 0 && (
        <div className="mb-10">
          <p className="text-[12px] text-muted/50 tracking-[0.3em] uppercase mb-4">{t.creator.per_link_heading}</p>
          <div className="border border-border divide-y divide-border">
            {links.map(l => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3.5 gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-parchment text-sm truncate">{l.brandName}</p>
                  <p className="text-muted/50 text-[14px] font-mono">{l.linkCode}</p>
                </div>
                <div className="flex gap-5 text-sm shrink-0">
                  <span className="text-muted">{t.creator.stats_clicks}: <span className="text-parchment">{l.clicks}</span></span>
                  <span className="text-muted">{t.creator.stats_conversions}: <span className="text-parchment">{l.conversions}</span></span>
                  <span className="text-muted">{t.creator.stats_earnings}: <span className="text-parchment">SAR {l.earnings.toFixed(2)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreatorLinksClient
        links={links}
        availableBrands={availableBrands}
        siteUrl={siteUrl}
        t={t.creator}
      />
    </div>
  )
}
