import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import { CreatorLinksClient } from '@/components/dashboard/CreatorLinksClient'

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
          <p className="text-[9px] text-gold tracking-[0.4em] uppercase mb-5">
            Merchant Club SA
          </p>
          <h1 className="font-display text-[1.85rem] font-light text-parchment leading-snug mb-5">
            No creator access on this account.
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-10 max-w-xs mx-auto">
            If you applied to become a creator, we&apos;re still reviewing it.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/apply/member"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              Apply as a creator
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

  const [linksRes, brandsRes] = await Promise.all([
    supabase
      .from('creator_links')
      .select('id, link_code, commission_rate, created_at, brand_id, brands(id, name_en, name_ar, slug)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('brands')
      .select('id, name_en, name_ar, slug')
      .in('status', ['approved', 'active']),
  ])

  const links = (linksRes.data ?? []).map(l => {
    const rawBrand = l.brands
    const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand
    return {
      id: l.id as string,
      linkCode: l.link_code as string,
      commissionRate: Number(l.commission_rate),
      createdAt: l.created_at as string,
      brandId: l.brand_id as string,
      brandName: (brand as { name_en: string; name_ar: string | null } | null)?.name_en ?? 'Brand',
      brandSlug: (brand as { slug: string } | null)?.slug ?? '',
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
        <p className="text-[9px] text-gold tracking-[0.35em] uppercase mb-3">{t.creator.eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl font-light text-parchment leading-none">
          {t.creator.heading}
        </h1>
      </div>

      <CreatorLinksClient
        links={links}
        availableBrands={availableBrands}
        siteUrl={siteUrl}
        t={t.creator}
      />
    </div>
  )
}
