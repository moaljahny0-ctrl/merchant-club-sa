import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { StoreNavbar } from '@/components/layout/StoreNavbar'
import { StoreFooter } from '@/components/layout/StoreFooter'
import { createServiceClient } from '@/lib/supabase/server'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Button } from '@/components/ui/Button'
import { RefTracker } from '@/components/storefront/RefTracker'
import { TrackView } from '@/components/storefront/TrackView'
import { ProductGallery } from '@/components/storefront/ProductGallery'
import { DEFAULT_DESIGN_TOKENS, cssVarsToStyleString, tokensToCssVars, type DesignTokens } from '@/lib/theme-tokens'

type Props = {
  params: Promise<{ locale: string; slug: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const isAr = locale === 'ar'
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('products')
    .select('title_en, title_ar, description_en, description_ar')
    .eq('id', id)
    .eq('status', 'live')
    .single()

  if (!data) return {}
  const title = isAr && data.title_ar ? data.title_ar : data.title_en
  const description = (isAr && data.description_ar ? data.description_ar : data.description_en) ?? undefined
  return {
    title,
    description,
    openGraph: { title, description, locale: isAr ? 'ar_SA' : 'en_SA' },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug, id } = await params
  const isAr = locale === 'ar'
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, brands(name_en, name_ar, slug), product_images(url, is_primary, sort_order)')
    .eq('id', id)
    .eq('status', 'live')
    .single()

  if (!product) redirect(`/${locale}/brands/${slug}`)

  const { data: storefront } = await supabase
    .from('storefronts')
    .select('design_tokens')
    .eq('brand_id', product.brand_id)
    .maybeSingle()
  const tokens = (storefront?.design_tokens as DesignTokens | undefined) ?? DEFAULT_DESIGN_TOKENS
  const cssVarsStyle = cssVarsToStyleString(tokensToCssVars(tokens))
  const accentHex = tokens.accent
  const cardBorderStyle = tokens.cardStyle === 'bordered' ? '1px solid #E5DDD0' : 'none'
  const cardShadowStyle = tokens.cardStyle === 'elevated' ? '0 10px 24px -14px rgba(26,18,8,0.18)' : 'none'

  const brand  = product.brands as { id?: string; name_en: string; name_ar: string | null; slug: string } | null
  const images = ((product.product_images as { url: string; is_primary: boolean; sort_order: number }[]) ?? [])
    .slice()
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order)

  const title     = isAr && product.title_ar     ? product.title_ar     : product.title_en
  const description = isAr && product.description_ar ? product.description_ar : product.description_en
  const brandName = isAr && brand?.name_ar        ? brand.name_ar        : (brand?.name_en ?? '')
  const price     = Number(product.price)
  const salePrice = product.sale_price ? Number(product.sale_price) : null
  const inStock   = (product.stock_quantity ?? 0) > 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--mc-bg)', fontFamily: 'var(--mc-font)' }}>
      <style>{`:root{${cssVarsStyle}}`}</style>
      <Suspense fallback={null}><RefTracker brandId={product.brand_id} /></Suspense>
      <Suspense fallback={null}><TrackView event_type="product_view" brand_id={product.brand_id} product_id={product.id} /></Suspense>
      <StoreNavbar />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-16">

          {/* Back link */}
          <Button
            href={`/brands/${slug}`}
            variant="back"
            className="mb-10 md:mb-14"
            style={{ color: '#6B5B4E' }}
          >
            <span aria-hidden>{isAr ? '→' : '←'}</span>
            <span>{brandName}</span>
          </Button>

          {/* Product layout */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8 md:gap-16 items-start">

            {/* ── Image gallery ── */}
            <ProductGallery images={images} title={title} />

            {/* ── Details ── */}
            <div className="flex flex-col gap-6 md:sticky md:top-24">

              {/* Brand eyebrow */}
              {brandName && (
                <p className="text-[13px] font-medium tracking-[0.1em] uppercase" style={{ color: accentHex }}>
                  {brandName}
                </p>
              )}

              {/* Product title */}
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.05]"
                style={{ color: 'var(--mc-primary)', letterSpacing: '-0.02em' }}
              >
                {title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {salePrice ? (
                  <>
                    <span className="text-2xl md:text-3xl font-semibold" style={{ color: accentHex }}>
                      {salePrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                    </span>
                    <span className="text-base line-through" style={{ color: '#6B5B4E' }}>
                      {price.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl font-semibold" style={{ color: accentHex }}>
                    {price.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px w-full" style={{ background: '#E5DDD0' }} />

              {/* Description */}
              {description && (
                <p className="text-base leading-relaxed max-w-sm" style={{ color: '#6B5B4E' }}>
                  {description}
                </p>
              )}

              {/* Stock status */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    inStock ? 'bg-emerald-500' : 'bg-red-400'
                  }`}
                />
                <p className={`text-sm ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                  {inStock
                    ? (isAr ? 'متوفر — In Stock' : 'In Stock — متوفر')
                    : (isAr ? 'نفذت الكمية — Out of Stock' : 'Out of Stock — نفذت الكمية')}
                </p>
              </div>

              {/* CTA */}
              {inStock ? (
                <AddToCartButton
                  productId={id}
                  brandId={product.brand_id}
                  brandSlug={slug}
                  productName={title}
                  brandName={brandName}
                  price={salePrice ?? price}
                  image_url={images[0]?.url ?? null}
                  maxQty={product.stock_quantity ?? 10}
                />
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  fullWidth
                  className="mt-2"
                  style={{
                    background: '#F0EBE1',
                    color: '#6B5B4E',
                    border: '1px solid #E5DDD0',
                  }}
                >
                  {isAr ? 'نفذت الكمية' : 'Out of Stock'}
                </Button>
              )}

              {/* Trust strip */}
              <div
                className="px-4 py-4 flex flex-col gap-2"
                style={{ border: cardBorderStyle, background: 'var(--mc-surface)', borderRadius: 'var(--mc-radius)', boxShadow: cardShadowStyle }}
              >
                <p className="text-[13px] leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ لا يلزم الدفع الإلكتروني — الدفع عند الاستلام'
                    : '✓ No online payment — Cash on delivery'}
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ سيتواصل معك المتجر لتأكيد الطلب'
                    : '✓ The brand will contact you to confirm'}
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ للاستفسار: info@merchantclubsa.com'
                    : '✓ Questions? info@merchantclubsa.com'}
                </p>
              </div>

            </div>
          </div>

        </section>
      </main>
      <StoreFooter />
    </div>
  )
}
