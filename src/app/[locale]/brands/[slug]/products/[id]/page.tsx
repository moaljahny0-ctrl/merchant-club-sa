import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { StoreNavbar } from '@/components/layout/StoreNavbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { RefTracker } from '@/components/storefront/RefTracker'
import { TrackView } from '@/components/storefront/TrackView'

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
    .select('*, brands(name_en, name_ar, slug), product_images(url, is_primary)')
    .eq('id', id)
    .eq('status', 'live')
    .single()

  if (!product) redirect(`/${locale}/brands/${slug}`)

  const brand        = product.brands as { id?: string; name_en: string; name_ar: string | null; slug: string } | null
  const images       = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
  const primaryImage = images.find(i => i.is_primary) ?? images[0]

  const title     = isAr && product.title_ar     ? product.title_ar     : product.title_en
  const description = isAr && product.description_ar ? product.description_ar : product.description_en
  const brandName = isAr && brand?.name_ar        ? brand.name_ar        : (brand?.name_en ?? '')
  const price     = Number(product.price)
  const salePrice = product.sale_price ? Number(product.sale_price) : null
  const inStock   = (product.stock_quantity ?? 0) > 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <Suspense fallback={null}><RefTracker /></Suspense>
      <Suspense fallback={null}><TrackView event_type="product_view" brand_id={product.brand_id} product_id={product.id} /></Suspense>
      <StoreNavbar />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-16">

          {/* Back link */}
          <Link
            href={`/brands/${slug}`}
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60 mb-10 md:mb-14"
            style={{ color: '#6B5B4E' }}
          >
            <span aria-hidden>{isAr ? '→' : '←'}</span>
            <span>{brandName}</span>
          </Link>

          {/* Product layout */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8 md:gap-16 items-start">

            {/* ── Image ── */}
            <div
              className="relative aspect-[4/5] overflow-hidden"
              style={{ background: '#F0EBE1' }}
            >
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={title}
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={90}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-px w-12" style={{ background: '#E5DDD0' }} />
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="flex flex-col gap-6 md:sticky md:top-24">

              {/* Brand eyebrow */}
              {brandName && (
                <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: '#B8975A' }}>
                  {brandName}
                </p>
              )}

              {/* Product title */}
              <h1
                className="font-display text-3xl md:text-4xl lg:text-5xl font-light leading-tight"
                style={{ color: '#1A1208' }}
              >
                {title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {salePrice ? (
                  <>
                    <span className="text-2xl md:text-3xl font-light" style={{ color: '#B8975A' }}>
                      {salePrice.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                    </span>
                    <span className="text-base line-through" style={{ color: '#6B5B4E' }}>
                      {price.toFixed(2)} {isAr ? 'ريال' : 'SAR'}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl font-light" style={{ color: '#B8975A' }}>
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
                <p className={`text-xs ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
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
                  image_url={primaryImage?.url ?? null}
                  maxQty={product.stock_quantity ?? 10}
                />
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 w-full mt-2 cursor-not-allowed"
                  style={{
                    background: '#F0EBE1',
                    color: '#6B5B4E',
                    border: '1px solid #E5DDD0',
                  }}
                >
                  {isAr ? 'نفذت الكمية' : 'Out of Stock'}
                </button>
              )}

              {/* Trust strip */}
              <div
                className="px-4 py-4 flex flex-col gap-2 rounded-lg"
                style={{ border: '1px solid #E5DDD0', background: '#FFFFFF' }}
              >
                <p className="text-[10px] leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ لا يلزم الدفع الإلكتروني — الدفع عند الاستلام'
                    : '✓ No online payment — Cash on delivery'}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ سيتواصل معك المتجر لتأكيد الطلب'
                    : '✓ The brand will contact you to confirm'}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: '#6B5B4E' }}>
                  {isAr
                    ? '✓ للاستفسار: info@merchantclubsa.com'
                    : '✓ Questions? info@merchantclubsa.com'}
                </p>
              </div>

            </div>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  )
}
