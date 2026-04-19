import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'

export default async function StorefrontPreviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id, brands(id, name_en, slug, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const rawBrand = member.brands
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand

  const isLive = brand && ['approved', 'active'].includes(brand.status)
  const storefrontUrl = brand?.slug ? `${SITE_URL}/en/brands/${brand.slug}` : null

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <p className="text-[9px] text-gold tracking-[0.35em] uppercase mb-3">Brand Dashboard</p>
        <h1 className="font-display text-4xl font-light text-parchment leading-none">Storefront</h1>
      </div>

      {!isLive ? (
        <div className="border border-border px-8 py-12 text-center max-w-xl">
          <p className="text-[9px] text-muted/50 tracking-[0.3em] uppercase mb-4">Not live yet</p>
          <p className="text-parchment text-base font-light leading-relaxed mb-3">
            Your storefront isn&apos;t visible to customers yet.
          </p>
          <p className="text-muted text-sm leading-relaxed">
            Your brand needs at least one approved product and an active account before your storefront goes live.
          </p>
        </div>
      ) : (
        <>
          {/* URL bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-surface border border-border px-4 py-2.5 flex items-center gap-3 min-w-0">
              <span className="text-[9px] text-muted/50 tracking-[0.2em] uppercase shrink-0">Live URL</span>
              <span className="text-muted text-xs truncate font-mono">{storefrontUrl}</span>
            </div>
            <a
              href={storefrontUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-gold text-ink text-[10px] font-medium tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors"
            >
              Open ↗
            </a>
          </div>

          {/* Preview note */}
          <p className="text-[9px] text-muted/50 tracking-[0.2em] uppercase mb-4">
            Live preview — what customers see
          </p>

          {/* iframe preview */}
          <div className="border border-border bg-surface overflow-hidden" style={{ height: '70vh' }}>
            <iframe
              src={`${SITE_URL}/en/brands/${brand?.slug}`}
              className="w-full h-full"
              title="Storefront preview"
            />
          </div>

          <p className="text-[9px] text-muted/40 mt-3 leading-relaxed">
            This is your live public storefront. Customers browse and discover your products here.
            Approve products from the Products section to have them appear.
          </p>
        </>
      )}
    </div>
  )
}
