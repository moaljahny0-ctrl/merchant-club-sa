import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { StorefrontActions } from './StorefrontActions'
import { FeaturedProductSelector } from './FeaturedProductSelector'
import { StorefrontDesignPicker } from './StorefrontDesignPicker'
import { CollectionsManager } from './CollectionsManager'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import { listCollections } from '@/lib/actions/brands'
import type { StorefrontTemplate, SocialLinks } from '@/lib/types/database'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

export default async function StorefrontPreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale)

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id, brands(id, name_en, slug, status, onboarding_state)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const rawBrand = member.brands
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand as {
    id: string; name_en: string; slug: string; status: string; onboarding_state: string
  } | null

  const isLive = brand && ['approved', 'active'].includes(brand.status)
  const storefrontUrl = brand?.slug ? `${SITE_URL}/en/brands/${brand.slug}` : null
  const onboardingState = brand?.onboarding_state ?? 'invited'
  const canSubmit = brand && !['submitted', 'live'].includes(onboardingState) && ['approved', 'active'].includes(brand.status)
  const isSubmitted = onboardingState === 'submitted'

  let liveProducts: { id: string; title_en: string; title_ar: string | null; price: number }[] = []
  let currentFeaturedIds: string[] = []
  let templateId: StorefrontTemplate = 'classic'
  let accentColorId = 'gold'
  let socialLinks: SocialLinks = {}
  let collections: Awaited<ReturnType<typeof listCollections>>['collections'] = []

  if (brand) {
    const [liveProductsRes, storefrontRes, collectionsRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, title_en, title_ar, price')
        .eq('brand_id', brand.id)
        .eq('status', 'live')
        .order('title_en'),
      supabase
        .from('storefronts')
        .select('featured_product_ids, template_id, accent_color_id, social_links')
        .eq('brand_id', brand.id)
        .maybeSingle(),
      listCollections(brand.id),
    ])
    liveProducts = (liveProductsRes.data ?? []) as typeof liveProducts
    currentFeaturedIds = (storefrontRes.data?.featured_product_ids as string[] | null) ?? []
    templateId = (storefrontRes.data?.template_id as StorefrontTemplate | undefined) ?? 'classic'
    accentColorId = storefrontRes.data?.accent_color_id ?? 'gold'
    socialLinks = (storefrontRes.data?.social_links as SocialLinks | undefined) ?? {}
    collections = collectionsRes.collections
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <p className="text-[12px] text-gold tracking-[0.35em] uppercase mb-3">{t.storefront.eyebrow}</p>
        <h1 className="font-display text-4xl font-light text-parchment leading-none">{t.storefront.heading}</h1>
      </div>

      {isSubmitted && (
        <div className="mb-6 border border-gold/30 bg-gold/5 px-6 py-5">
          <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-2">{t.storefront.under_review_label}</p>
          <p className="text-parchment text-base leading-relaxed">
            {t.storefront.under_review_body}
          </p>
        </div>
      )}

      {!isLive ? (
        <div className="border border-border rounded-lg px-8 py-12 text-center max-w-xl">
          <p className="text-[12px] text-muted/50 tracking-[0.3em] uppercase mb-4">{t.storefront.not_live_label}</p>
          <p className="text-parchment text-base font-light leading-relaxed mb-3">
            {t.storefront.not_live_body}
          </p>
          <p className="text-muted text-base leading-relaxed">
            {t.storefront.not_live_note}
          </p>
        </div>
      ) : (
        <>
          {/* URL bar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex-1 bg-surface border border-border px-4 py-2.5 flex items-center gap-3 min-w-0">
              <span className="text-[12px] text-muted/50 tracking-[0.2em] uppercase shrink-0">{t.storefront.live_url_label}</span>
              <span className="text-muted text-sm truncate font-mono">{storefrontUrl}</span>
            </div>
            <a
              href={`${SITE_URL}/en/brands/${brand?.slug}?preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border border-border text-parchment text-[13px] font-medium tracking-[0.18em] uppercase px-5 py-2.5 hover:border-gold hover:text-gold transition-colors"
            >
              {t.storefront.preview_btn}
            </a>
            <a
              href={storefrontUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-gold text-ink text-[13px] font-medium tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors"
            >
              {t.storefront.open_live_btn}
            </a>
          </div>

          <StorefrontDesignPicker
            brandId={brand!.id}
            initialTemplateId={templateId}
            initialAccentColorId={accentColorId}
            initialSocialLinks={socialLinks}
            locale={locale}
          />

          <CollectionsManager
            brandId={brand!.id}
            products={liveProducts}
            initialCollections={collections}
            locale={locale}
          />

          <FeaturedProductSelector
            brandId={brand!.id}
            products={liveProducts}
            initialIds={currentFeaturedIds}
            locale={locale}
          />

          {canSubmit && brand && (
            <StorefrontActions brandId={brand.id} locale={locale} />
          )}

          {/* Preview note */}
          <p className="text-[12px] text-muted/50 tracking-[0.2em] uppercase mb-4 mt-6">
            {t.storefront.live_preview_label}
          </p>

          {/* iframe preview */}
          <div className="border border-border bg-surface overflow-hidden" style={{ height: '70vh' }}>
            <iframe
              src={`${SITE_URL}/en/brands/${brand?.slug}`}
              className="w-full h-full"
              title="Storefront preview"
            />
          </div>

          <p className="text-[12px] text-muted/40 mt-3 leading-relaxed">
            {t.storefront.live_note}
          </p>
        </>
      )}
    </div>
  )
}
