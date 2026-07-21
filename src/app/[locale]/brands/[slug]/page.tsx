import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { StoreNavbar } from '@/components/layout/StoreNavbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { RefTracker } from '@/components/storefront/RefTracker'
import { TrackView } from '@/components/storefront/TrackView'

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
    .select('id, slug, name_en, name_ar, description_en, description_ar, tagline_en, tagline_ar, logo_url, banner_url, status')
    .eq('slug', slug)
    .single()

  if (!brand) notFound()
  if (brand.status === 'suspended') {
    redirect(`/${locale}/store?unavailable=1`)
  }
  if (!['approved', 'active'].includes(brand.status)) notFound()

  const [{ data: products }, { data: storefront }, { data: theme }, { data: collectionRows }, { data: collectionLinks }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title_en, title_ar, description_en, description_ar, price, sale_price, category, is_featured, product_images(url, is_primary)')
      .eq('brand_id', brand.id)
      .eq('status', 'live')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false }),
    supabase
      .from('storefronts')
      .select('template_id, accent_color_id, social_links')
      .eq('brand_id', brand.id)
      .maybeSingle(),
    supabase.from('theme_palette').select('id, accent_hex'),
    supabase.from('collections').select('id, name_en, name_ar, position').eq('brand_id', brand.id).order('position'),
    supabase.from('collection_products').select('collection_id, product_id, position'),
  ])

  const liveProducts = products ?? []
  const templateId = storefront?.template_id ?? 'classic'
  const accentColorId = storefront?.accent_color_id ?? 'gold'
  const socialLinks = (storefront?.social_links as { instagram?: string; tiktok?: string; x?: string } | null) ?? {}
  const accentHex = (theme ?? []).find(c => c.id === accentColorId)?.accent_hex ?? '#B8975A'

  const collections = (collectionRows ?? []).map(c => ({
    ...c,
    products: (collectionLinks ?? [])
      .filter(l => l.collection_id === c.id)
      .sort((a, b) => a.position - b.position)
      .map(l => liveProducts.find(p => p.id === l.product_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p)),
  })).filter(c => c.products.length > 0)

  const brandName    = isAr && brand.name_ar    ? brand.name_ar    : brand.name_en
  const brandDesc    = isAr && brand.description_ar ? brand.description_ar : brand.description_en
  const brandTagline = isAr && brand.tagline_ar  ? brand.tagline_ar  : brand.tagline_en

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
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
            fontSize: '12px',
            letterSpacing: '0.15em',
            fontFamily: 'Georgia, serif',
          }}
        >
          {isAr ? 'هذا معاينة متجرك — هذه الصفحة غير مرئية للعملاء' : 'This is your store preview — this page is not visible to customers'}
        </div>
      )}
      <StoreNavbar />
      <main className="flex-1">

        {/* Back to store */}
        <div className="px-6 md:px-10 pt-10">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
              style={{ color: '#6B5B4E' }}
            >
              <span aria-hidden>{isAr ? '→' : '←'}</span>
              <span>{isAr ? 'كل العلامات' : 'All Brands'}</span>
            </Link>
          </div>
        </div>

        {/* Editorial template: full-width banner hero above the header */}
        {templateId === 'editorial' && brand.banner_url && (
          <div className="relative w-full h-[220px] md:h-[340px]">
            <Image src={brand.banner_url} alt={brandName} fill className="object-cover" />
          </div>
        )}

        {/* Brand Header */}
        <section
          className={`px-6 md:px-10 ${templateId === 'grid' ? 'py-8 md:py-10' : 'py-14 md:py-20'}`}
          style={{ borderBottom: '1px solid #E5DDD0' }}
        >
          <div
            className={`max-w-7xl mx-auto flex gap-8 md:gap-16 items-start ${
              templateId === 'editorial' ? 'flex-col text-center md:items-center' : 'flex-col md:flex-row'
            }`}
          >
            {brand.logo_url && (
              <div className="shrink-0">
                <div
                  className={`relative overflow-hidden ${templateId === 'editorial' ? 'w-24 h-24 md:w-32 md:h-32 mx-auto' : 'w-20 h-20 md:w-28 md:h-28'}`}
                  style={{ border: '1px solid #E5DDD0', background: '#FFFFFF' }}
                >
                  <Image
                    src={brand.logo_url}
                    alt={brandName}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              </div>
            )}
            <div>
              <p
                className="text-[10px] tracking-[0.35em] uppercase mb-4"
                style={{ color: accentHex }}
              >
                {isAr ? 'المتجر' : 'Brand'}
              </p>
              <h1
                className={`font-display font-light leading-tight mb-3 ${templateId === 'grid' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl'}`}
                style={{ color: '#1A1208' }}
              >
                {brandName}
              </h1>
              {brandTagline && templateId !== 'grid' && (
                <p className="text-base mb-4 leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {brandTagline}
                </p>
              )}
              {brandDesc && templateId !== 'grid' && (
                <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {brandDesc}
                </p>
              )}
              {(socialLinks.instagram || socialLinks.tiktok || socialLinks.x) && (
                <div className="flex gap-4 mt-4">
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[11px] tracking-[0.15em] uppercase hover:opacity-70" style={{ color: accentHex }}>Instagram</a>
                  )}
                  {socialLinks.tiktok && (
                    <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-[11px] tracking-[0.15em] uppercase hover:opacity-70" style={{ color: accentHex }}>TikTok</a>
                  )}
                  {socialLinks.x && (
                    <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" className="text-[11px] tracking-[0.15em] uppercase hover:opacity-70" style={{ color: accentHex }}>X</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Collections */}
        {collections.length > 0 && collections.map(collection => {
          const name = isAr && collection.name_ar ? collection.name_ar : collection.name_en
          return (
            <section key={collection.id} className="px-6 md:px-10 py-10 md:py-14" style={{ borderBottom: '1px solid #E5DDD0' }}>
              <div className="max-w-7xl mx-auto">
                <p className="text-[10px] tracking-[0.35em] uppercase mb-6" style={{ color: accentHex }}>
                  {name}
                </p>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 ${templateId === 'grid' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                  {collection.products.map(product => {
                    const images = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
                    const primaryImage = images.find(i => i.is_primary) ?? images[0]
                    const title = isAr && product.title_ar ? product.title_ar : product.title_en
                    return (
                      <Link key={product.id} href={`/brands/${slug}/products/${product.id}`} className="group flex flex-col cursor-pointer">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg" style={{ background: '#F0EBE1' }}>
                          {primaryImage && (
                            <Image src={primaryImage.url} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 50vw, 25vw" />
                          )}
                        </div>
                        <p className="text-sm font-medium leading-snug pt-3" style={{ color: '#1A1208' }}>{title}</p>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>
          )
        })}

        {/* Products */}
        <section className="px-6 md:px-10 py-14 md:py-20">
          <div className="max-w-7xl mx-auto">
            {liveProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm" style={{ color: '#6B5B4E' }}>
                  {isAr ? 'لا توجد منتجات متاحة حالياً.' : 'No products available yet.'}
                </p>
              </div>
            ) : (
              <>
                <p
                  className="text-[10px] tracking-[0.35em] uppercase mb-10"
                  style={{ color: accentHex }}
                >
                  {isAr ? 'كل المنتجات' : 'All Products'} ({liveProducts.length})
                </p>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 ${templateId === 'grid' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                  {liveProducts.map(product => {
                    const images      = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
                    const primaryImage = images.find(i => i.is_primary) ?? images[0]
                    const title       = isAr && product.title_ar ? product.title_ar : product.title_en
                    const price       = Number(product.price)
                    const salePrice   = product.sale_price ? Number(product.sale_price) : null

                    return (
                      <Link
                        key={product.id}
                        href={`/brands/${slug}/products/${product.id}`}
                        className="group flex flex-col cursor-pointer"
                      >
                        <div
                          className="relative aspect-[3/4] overflow-hidden rounded-lg"
                          style={{ background: '#F0EBE1' }}
                        >
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-px w-8" style={{ background: '#E5DDD0' }} />
                            </div>
                          )}
                        </div>
                        <div className="pt-3 space-y-1">
                          <p className="text-sm font-medium leading-snug" style={{ color: '#1A1208' }}>
                            {title}
                          </p>
                          <div className="flex items-baseline gap-2">
                            {salePrice ? (
                              <>
                                <span className="text-sm font-bold" style={{ color: accentHex }}>
                                  {salePrice.toFixed(0)} {isAr ? 'ريال' : 'SAR'}
                                </span>
                                <span className="text-[10px] line-through" style={{ color: '#6B5B4E' }}>
                                  {price.toFixed(0)} {isAr ? 'ريال' : 'SAR'}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-bold" style={{ color: accentHex }}>
                                {price.toFixed(0)} {isAr ? 'ريال' : 'SAR'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
