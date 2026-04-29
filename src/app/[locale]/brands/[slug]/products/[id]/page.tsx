import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import { createServiceClient } from '@/lib/supabase/server'

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

  const brand = product.brands as { name_en: string; name_ar: string | null; slug: string } | null
  const images = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
  const primaryImage = images.find(i => i.is_primary) ?? images[0]

  const title = isAr && product.title_ar ? product.title_ar : product.title_en
  const description = isAr && product.description_ar ? product.description_ar : product.description_en
  const brandName = isAr && brand?.name_ar ? brand.name_ar : (brand?.name_en ?? '')
  const price = Number(product.price)
  const salePrice = product.sale_price ? Number(product.sale_price) : null
  const inStock = (product.stock_quantity ?? 0) > 0

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20">

          {/* Back link */}
          <Link
            href={`/brands/${slug}`}
            className="inline-flex items-center gap-2 text-muted hover:text-gold text-[10px] tracking-[0.2em] uppercase transition-colors mb-10 md:mb-16"
          >
            <span aria-hidden>{isAr ? '→' : '←'}</span>
            <span>{isAr ? 'العودة للمتجر' : 'Back to store'}</span>
          </Link>

          {/* Product layout: image left (3fr), details right (2fr) */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8 md:gap-16 items-start">

            {/* ── Image ── */}
            <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  quality={90}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-px w-12 bg-gold opacity-40" />
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="flex flex-col gap-6 md:sticky md:top-24">

              {/* Brand eyebrow */}
              {brandName && (
                <p className="text-[10px] text-gold tracking-[0.35em] uppercase">
                  {brandName}
                </p>
              )}

              {/* Product title */}
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-parchment leading-tight">
                {title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {salePrice ? (
                  <>
                    <span className="text-2xl md:text-3xl text-gold font-light">
                      SAR {salePrice.toFixed(2)}
                    </span>
                    <span className="text-base text-muted line-through">
                      SAR {price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl text-gold font-light">
                    SAR {price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-border" />

              {/* Description */}
              {description && (
                <p className="text-muted text-sm leading-relaxed max-w-sm">
                  {description}
                </p>
              )}

              {/* Stock status */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    inStock ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                <p
                  className={`text-xs ${inStock ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {inStock
                    ? (isAr ? 'متوفر — In Stock' : 'In Stock — متوفر')
                    : (isAr ? 'نفذت الكمية — Out of Stock' : 'Out of Stock — نفذت الكمية')}
                </p>
              </div>

              {/* Order Now / Out of Stock */}
              {inStock ? (
                <Link
                  href={`/brands/${slug}/products/${id}/order`}
                  className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors w-full mt-2"
                >
                  {isAr ? 'اطلب الآن' : 'Order Now'}
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center bg-surface/60 text-muted text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 w-full mt-2 cursor-not-allowed border border-border"
                >
                  {isAr ? 'نفذت الكمية' : 'Out of Stock'}
                </button>
              )}

            </div>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  )
}
