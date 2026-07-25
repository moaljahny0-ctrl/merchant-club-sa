import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ShieldCheck, Award, Truck, Headphones } from 'lucide-react'
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
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-6 md:py-8">

          {/* Back link */}
          <Button
            href={`/brands/${slug}`}
            variant="back"
            className="mb-4 md:mb-5"
            style={{ color: '#6B5B4E' }}
          >
            <span aria-hidden>{isAr ? '→' : '←'}</span>
            <span>{brandName}</span>
          </Button>

          {/* Product layout */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 md:gap-10 items-start">

            {/* ── Image gallery ── */}
            <div className="w-full max-w-md mx-auto md:mx-0">
              <ProductGallery images={images} title={title} />
            </div>

            {/* ── Details ── */}
            <div className="flex flex-col gap-3.5 md:sticky md:top-20">

              {/* Brand eyebrow */}
              {brandName && (
                <p className="text-[13px] font-medium tracking-[0.1em] uppercase" style={{ color: accentHex }}>
                  {brandName}
                </p>
              )}

              {/* Product title */}
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-[1.1]"
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
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#6B5B4E' }}>
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
                  sizes={product.sizes}
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
                className="px-4 py-3 flex flex-col gap-1.5"
                style={{ border: cardBorderStyle, background: 'var(--mc-surface)', borderRadius: 'var(--mc-radius)', boxShadow: cardShadowStyle }}
              >
                <p className="text-[13px] leading-snug" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ لا يلزم الدفع الإلكتروني — الدفع عند الاستلام'
                    : '✓ No online payment — Cash on delivery'}
                </p>
                <p className="text-[13px] leading-snug" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ سيتواصل معك المتجر لتأكيد الطلب'
                    : '✓ The brand will contact you to confirm'}
                </p>
                <p className="text-[13px] leading-snug" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ للاستفسار: info@merchantclubsa.com'
                    : '✓ Questions? info@merchantclubsa.com'}
                </p>
              </div>

            </div>
          </div>

          {/* Trust badges */}
          <section
            className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 p-4"
            style={{ border: '1px solid #E5DDD0', borderRadius: 'var(--mc-radius)', background: 'var(--mc-surface)' }}
          >
            {[
              { icon: ShieldCheck, title: isAr ? 'ضمان الجودة' : 'Quality Guarantee', detail: isAr ? 'نضمن أعلى جودة في كل منتج' : 'We ensure the highest quality in every product' },
              { icon: Award, title: isAr ? 'شركاء موثوقون' : 'Trusted Partners', detail: isAr ? 'نتعامل مع علامات ومتاجر موثوقة' : 'We partner with reliable brands and stores' },
              { icon: Truck, title: isAr ? 'توصيل سريع' : 'Fast Delivery', detail: isAr ? 'توصيل سريع وموثوق في كل أنحاء المملكة' : 'Quick and reliable delivery across Saudi Arabia' },
              { icon: Headphones, title: isAr ? 'دعم العملاء' : 'Customer Support', detail: isAr ? 'نحن هنا لمساعدتك في أي وقت' : "We're here to help you anytime" },
            ].map(({ icon: Icon, title: badgeTitle, detail }) => (
              <div key={badgeTitle} className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--mc-bg)', color: accentHex }}>
                  <Icon width={19} height={19} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--mc-primary)' }}>{badgeTitle}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B5B4E' }}>{detail}</p>
                </div>
              </div>
            ))}
          </section>

          <div
            className="mt-4 flex items-center justify-center gap-2 pt-4 text-xs font-semibold uppercase tracking-wide"
            style={{ borderTop: '1px solid #E5DDD0', color: '#6B5B4E' }}
          >
            <ShieldCheck width={15} height={15} style={{ color: accentHex }} />
            {isAr ? 'تجربة تسوّق آمنة 100%' : '100% Secure Shopping Experience'}
          </div>

        </section>
      </main>
      <StoreFooter />
    </div>
  )
}
