import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppearanceEditor } from './AppearanceEditor'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import { listThemePalette } from '@/lib/actions/brands'
import { DEFAULT_DESIGN_TOKENS, type DesignTokens } from '@/lib/theme-tokens'

export default async function AppearancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale)

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id, brands(id, name_en, slug, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const rawBrand = member.brands
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand as {
    id: string; name_en: string; slug: string; status: string
  } | null

  if (!brand) redirect('/dashboard/brand')

  const isLive = ['approved', 'active'].includes(brand.status)
  // Relative path (not an absolute NEXT_PUBLIC_SITE_URL link) so the live
  // preview iframe always targets whatever host is actually serving this
  // dashboard right now — localhost in dev, the real domain in production —
  // never a hardcoded production URL while testing elsewhere.
  const brandSlug = isLive ? brand.slug : null

  const [{ data: storefront }, palette] = await Promise.all([
    supabase
      .from('storefronts')
      .select('design_tokens')
      .eq('brand_id', brand.id)
      .maybeSingle(),
    listThemePalette(),
  ])

  const initialTokens = (storefront?.design_tokens as DesignTokens | undefined) ?? DEFAULT_DESIGN_TOKENS

  return (
    <div className="p-6 md:p-10 max-w-7xl">
      <AppearanceEditor
        brandId={brand.id}
        brandSlug={brandSlug}
        palette={palette}
        initialTokens={initialTokens}
        locale={locale}
      />
      {!isLive && (
        <p className="text-[12px] text-muted/50 tracking-[0.2em] uppercase mt-2">
          {t.appearance.preview_unavailable}
        </p>
      )}
    </div>
  )
}
