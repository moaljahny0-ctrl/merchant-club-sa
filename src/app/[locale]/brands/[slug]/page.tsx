import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { ChevronRight, Calendar, Package, Truck, Tag, Bookmark, CreditCard, RotateCcw, Headphones } from 'lucide-react'
import { StoreNavbar } from '@/components/layout/StoreNavbar'
import { StoreFooter } from '@/components/layout/StoreFooter'
import { Link } from '@/i18n/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { RefTracker } from '@/components/storefront/RefTracker'
import { TrackView } from '@/components/storefront/TrackView'
import { FollowBrandButton } from '@/components/storefront/FollowBrandButton'
import { BrandProductGrid, type GridProduct } from '@/components/storefront/BrandProductGrid'
import { getFavoriteCount, getCustomerFavoriteIds } from '@/lib/actions/favorites'
import { PreviewTokenListener } from '@/components/storefront/PreviewTokenListener'
import { PartnerTiltPoster } from '@/components/storefront/PartnerTiltPoster'
import { BrandContactChannels } from '@/components/storefront/BrandContactChannels'
import type { Partner } from '@/lib/brands'
import {
  DEFAULT_DESIGN_TOKENS, cssVarsToStyleString, tokensToCssVars,
  type DesignTokens, type SectionKey,
} from '@/lib/theme-tokens'

const HERO_GOLD = '#D4AF37';
const HERO_CREAM = '#F5F0E8';
const HERO_CREAM2 = '#F0EBE1';

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ preview?: string; ref?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const isAr = locale === 'ar'
  const supabase = createServiceClient()
  const { data: brand } = await supabase
    .from('brands')
    .select('name_en, name_ar, description_en, description_ar')
    .eq('slug', slug)
    .single()

  if (!brand) return {}
  const title = isAr && brand.name_ar ? brand.name_ar : brand.name_en
  const description = (isAr && brand.description_ar ? brand.description_ar : brand.description_en) ?? undefined
  return {
    title,
    description,
    openGraph: { title, description, locale: isAr ? 'ar_SA' : 'en_SA' },
  }
}

export default async function BrandStorefrontPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  const sp = await searchParams
  const isPreview = sp?.preview === 'true'
  const isAr = locale === 'ar'
  const supabase = createServiceClient()

  const { data: brand } = await supabase
    .from('brands')
    .select('id, slug, name_en, name_ar, description_en, description_ar, tagline_en, tagline_ar, logo_url, banner_url, status, created_at, fulfillment_lead_days, shipping_info_en, shipping_info_ar, return_policy_en, return_policy_ar, website_url, contact_email')
    .eq('slug', slug)
    .single()

  if (!brand) notFound()
  if (brand.status === 'suspended') {
    redirect(`/${locale}/store?unavailable=1`)
  }
  if (!['approved', 'active'].includes(brand.status)) notFound()

  const [
    { data: products },
    { data: storefront },
    { data: collectionRows },
    { data: collectionLinks },
    followerCount,
    followingBrandIds,
    favoriteProductIds,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, title_en, title_ar, description_en, description_ar, price, sale_price, category, is_featured, product_images(url, is_primary)')
      .eq('brand_id', brand.id)
      .eq('status', 'live')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false }),
    supabase
      .from('storefronts')
      .select('design_tokens, social_links')
      .eq('brand_id', brand.id)
      .maybeSingle(),
    supabase.from('collections').select('id, name_en, name_ar, position').eq('brand_id', brand.id).order('position'),
    supabase.from('collection_products').select('collection_id, product_id, position'),
    getFavoriteCount('brand', brand.id),
    getCustomerFavoriteIds('brand'),
    getCustomerFavoriteIds('product'),
  ])

  const liveProducts = products ?? []
  const tokens = (storefront?.design_tokens as DesignTokens | undefined) ?? DEFAULT_DESIGN_TOKENS
  const socialLinks = (storefront?.social_links as { instagram?: string; tiktok?: string; x?: string } | null) ?? {}
  const accentHex = tokens.accent
  const isFollowingBrand = followingBrandIds.has(brand.id)
  const cssVars = tokensToCssVars(tokens)
  const cssVarsStyle = cssVarsToStyleString(cssVars)

  const categoryCount = new Set(liveProducts.map(p => p.category)).size
  const memberSinceYear = new Date(brand.created_at).getFullYear()
  const shippingInfo = isAr ? brand.shipping_info_ar : brand.shipping_info_en
  const returnPolicy = isAr ? brand.return_policy_ar : brand.return_policy_en

  const collections = (collectionRows ?? []).map(c => ({
    ...c,
    products: (collectionLinks ?? [])
      .filter(l => l.collection_id === c.id)
      .sort((a, b) => a.position - b.position)
      .map(l => liveProducts.find(p => p.id === l.product_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p)),
  })).filter(c => c.products.length > 0)

  const gridProducts: GridProduct[] = liveProducts.map(p => {
    const images = (p.product_images as { url: string; is_primary: boolean }[]) ?? []
    const primaryImage = images.find(i => i.is_primary) ?? images[0]
    return {
      id: p.id,
      title: isAr && p.title_ar ? p.title_ar : p.title_en,
      price: Number(p.price),
      salePrice: p.sale_price ? Number(p.sale_price) : null,
      category: p.category,
      imageUrl: primaryImage?.url,
    }
  })

  const brandName    = isAr && brand.name_ar    ? brand.name_ar    : brand.name_en
  const brandDesc    = isAr && brand.description_ar ? brand.description_ar : brand.description_en
  const brandTagline = isAr && brand.tagline_ar  ? brand.tagline_ar  : brand.tagline_en

  // Single-item array — PartnerTiltPoster/PartnerShowcaseRing render this as
  // a large, static (non-cycling) display when there's only one entry.
  const brandAsPartner: Partner[] = [{
    id: brand.id,
    name: brand.name_en,
    nameAr: brand.name_ar ?? brand.name_en,
    category: brandTagline ?? '',
    categoryAr: brand.tagline_ar ?? brand.tagline_en ?? '',
    logoUrl: brand.logo_url ?? undefined,
    slug: brand.slug,
  }]

  const isEditorial = tokens.layout === 'editorial'
  const cardBorderStyle = tokens.cardStyle === 'bordered' ? '1px solid #E5DDD0' : 'none'
  const cardShadowStyle = tokens.cardStyle === 'elevated' ? '0 10px 24px -14px rgba(26,18,8,0.18)' : 'none'

  // Hero — brand header card, breadcrumb, and (editorial layout) full-width banner.
  const heroBlock = (
    <section key="hero">
      <div className="px-6 md:px-10 pt-8">
        <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto flex items-center gap-1.5 text-sm" style={{ color: '#6B5B4E' }}>
          <Link href="/store" className="hover:opacity-70 transition-opacity">{isAr ? 'المتجر' : 'Store'}</Link>
          <ChevronRight width={14} height={14} className="rtl:rotate-180" />
          <Link href="/store/partners" className="hover:opacity-70 transition-opacity">{isAr ? 'العلامات' : 'Brands'}</Link>
          <ChevronRight width={14} height={14} className="rtl:rotate-180" />
          <span className="font-medium" style={{ color: 'var(--mc-primary)' }}>{brandName}</span>
        </nav>
      </div>

      {isEditorial && brand.banner_url && (
        <div className="relative w-full" style={{ height: 'var(--mc-hero-h)' }}>
          <Image src={brand.banner_url} alt={brandName} fill className="object-cover" />
        </div>
      )}

      <div className="px-6 md:px-10 pt-6 pb-10 md:pb-14">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-3xl grid grid-cols-1 md:grid-cols-[1fr_0.85fr]"
            style={{
              background: `radial-gradient(ellipse at 20% 0%, #fff8ea 0%, transparent 55%), linear-gradient(135deg, ${HERO_CREAM}, ${HERO_CREAM2})`,
              boxShadow: cardShadowStyle || '0 40px 80px -30px rgba(28,20,12,0.25)',
              border: `1px solid ${HERO_CREAM2}`,
            }}
          >
            <div className="p-6 sm:p-8 md:p-10 relative z-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: HERO_GOLD }} />
                <p className="text-[12px] font-medium tracking-[0.2em] uppercase" style={{ color: HERO_GOLD }}>
                  {brandTagline || (isAr ? 'علامة تجارية' : 'Brand')}
                </p>
              </div>
              <h1
                className="font-semibold leading-[1.05] mb-3 text-3xl md:text-5xl"
                style={{ color: '#1A1208', letterSpacing: '-0.02em' }}
              >
                {brandName}
              </h1>
              {brandDesc && (
                <p className="text-base max-w-xl leading-relaxed line-clamp-3 mb-6" style={{ color: '#6B5B4E' }}>
                  {brandDesc}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <FollowBrandButton
                  brandId={brand.id}
                  initialFollowing={isFollowingBrand}
                  initialCount={followerCount}
                  accentHex={HERO_GOLD}
                  isAr={isAr}
                  revalidatePath={`/${locale}/brands/${slug}`}
                />
                {typeof brand.fulfillment_lead_days === 'number' && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B5B4E' }}>
                    <Truck width={14} height={14} />
                    {isAr ? `يشحن خلال ${brand.fulfillment_lead_days} يوم` : `Ships in ${brand.fulfillment_lead_days}d`}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <BrandContactChannels
                  instagram={socialLinks.instagram}
                  tiktok={socialLinks.tiktok}
                  x={socialLinks.x}
                  website={brand.website_url ?? undefined}
                  email={brand.contact_email ?? undefined}
                  accentHex={HERO_GOLD}
                  isAr={isAr}
                />
              </div>
            </div>

            <div
              className="relative flex items-center justify-center py-8 md:py-0"
              style={{ background: 'radial-gradient(circle at 65% 40%, #fbf3e0 0%, #ecdfc4 55%, #ddcda3 100%)' }}
            >
              <PartnerTiltPoster partners={brandAsPartner} isAr={isAr} size="lg" />
            </div>

            {/* Quantified stats — Products / Categories / Followers / Member since. Real numbers only. */}
            <div
              className="md:col-span-2 relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mx-6 sm:mx-8 md:mx-10 mb-6 sm:mb-8 md:mb-10 pt-8"
              style={{ borderTop: `1px solid ${HERO_CREAM2}` }}
            >
              {[
                { icon: Package,  label: isAr ? 'المنتجات' : 'Products',    value: String(liveProducts.length) },
                { icon: Tag,      label: isAr ? 'الفئات' : 'Categories',    value: String(categoryCount) },
                { icon: Bookmark, label: isAr ? 'المتابعون' : 'Followers',  value: String(followerCount) },
                { icon: Calendar, label: isAr ? 'عضو منذ' : 'Member since', value: String(memberSinceYear) },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl px-3 py-4 text-center" style={{ background: '#FFFFFF' }}>
                  <stat.icon width={16} height={16} className="mx-auto mb-1.5" style={{ color: HERO_GOLD }} />
                  <p className="text-xl font-bold" style={{ color: '#1A1208' }}>{stat.value}</p>
                  <p className="mt-0.5 text-[11px] tracking-[0.05em]" style={{ color: '#6B5B4E' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )

  const collectionsBlock = collections.length > 0 && (
    <section key="collections">
      {collections.map(collection => {
        const name = isAr && collection.name_ar ? collection.name_ar : collection.name_en
        return (
          <div key={collection.id} className="px-6 md:px-10 py-10 md:py-14" style={{ borderBottom: '1px solid #E5DDD0' }}>
            <div className="max-w-7xl mx-auto">
              <p className="text-[13px] font-medium tracking-[0.1em] uppercase mb-6" style={{ color: accentHex }}>
                {name}
              </p>
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6"
                style={{ gridTemplateColumns: `repeat(var(--mc-cols), minmax(0, 1fr))` }}
              >
                {collection.products.map(product => {
                  const images = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
                  const primaryImage = images.find(i => i.is_primary) ?? images[0]
                  const title = isAr && product.title_ar ? product.title_ar : product.title_en
                  return (
                    <Link key={product.id} href={`/brands/${slug}/products/${product.id}`} className="group flex flex-col cursor-pointer">
                      <div
                        className="relative aspect-[3/4] overflow-hidden transition-shadow duration-200 group-hover:shadow-md"
                        style={{ background: '#F0EBE1', borderRadius: 'var(--mc-radius)', border: cardBorderStyle, boxShadow: cardShadowStyle }}
                      >
                        {primaryImage && (
                          <Image src={primaryImage.url} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 50vw, 25vw" />
                        )}
                      </div>
                      <p className="text-base font-medium leading-snug pt-3" style={{ color: 'var(--mc-primary)' }}>{title}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )

  const productsBlock = (
    <section key="products" className="px-6 md:px-10 py-14 md:py-20">
      <div className="max-w-7xl mx-auto">
        {liveProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base" style={{ color: '#6B5B4E' }}>
              {isAr ? 'لا توجد منتجات متاحة حالياً.' : 'No products available yet.'}
            </p>
          </div>
        ) : (
          <BrandProductGrid
            products={gridProducts}
            favoriteIds={favoriteProductIds}
            brandId={brand.id}
            brandSlug={slug}
            brandName={brandName}
            accentHex={accentHex}
            isAr={isAr}
          />
        )}
      </div>
    </section>
  )

  const footerBlock = (
    <section key="footer" className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid #E5DDD0' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {[
          {
            icon: CreditCard,
            title: isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery',
            detail: isAr ? 'لا يلزم دفع إلكتروني' : 'No online payment required',
          },
          {
            icon: Truck,
            title: isAr ? 'تأكيد الطلب' : 'Order Confirmation',
            detail: shippingInfo ?? (isAr ? 'سيتواصل معك المتجر لتأكيد الطلب' : 'The brand will contact you to confirm'),
          },
          {
            icon: RotateCcw,
            title: isAr ? 'سياسة الإرجاع' : 'Returns',
            detail: returnPolicy ?? (isAr ? 'تواصل مع المتجر لتفاصيل الإرجاع' : 'Contact the brand for return details'),
          },
          {
            icon: Headphones,
            title: isAr ? 'الدعم' : 'Support',
            detail: 'info@merchantclubsa.com',
          },
        ].map(badge => (
          <div key={badge.title} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: '#F0EBE1' }}>
              <badge.icon width={17} height={17} style={{ color: '#6B5B4E' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--mc-primary)' }}>{badge.title}</p>
              <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: '#6B5B4E' }}>{badge.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )

  const blockByKey: Record<SectionKey, React.ReactNode> = {
    hero: heroBlock,
    collections: collectionsBlock,
    products: productsBlock,
    footer: footerBlock,
  }

  const orderedBlocks = tokens.sections
    .filter(s => s.visible)
    .map(s => blockByKey[s.key])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--mc-bg)', fontFamily: 'var(--mc-font)' }}>
      <style>{`:root{${cssVarsStyle}}`}</style>
      {isPreview && <PreviewTokenListener />}
      <Suspense fallback={null}><RefTracker brandId={brand.id} /></Suspense>
      {!isPreview && (
        <Suspense fallback={null}><TrackView event_type="storefront_view" brand_id={brand.id} /></Suspense>
      )}
      {isPreview && (
        <div
          style={{
            background: '#1A1208',
            color: '#B8975A',
            textAlign: 'center',
            padding: '10px 20px',
            fontSize: '15px',
            letterSpacing: '0.15em',
            fontFamily: 'Georgia, serif',
          }}
        >
          {isAr ? 'هذا معاينة متجرك — هذه الصفحة غير مرئية للعملاء' : 'This is your store preview — this page is not visible to customers'}
        </div>
      )}
      <StoreNavbar />
      <main className="flex-1">
        {orderedBlocks}
      </main>
      <StoreFooter />
    </div>
  )
}
