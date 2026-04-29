import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/i18n/navigation'
import { createServiceClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string; slug: string }>
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

export default async function BrandStorefrontPage({ params }: Props) {
  const { locale, slug } = await params
  const isAr = locale === 'ar'
  const supabase = createServiceClient()

  const { data: brand } = await supabase
    .from('brands')
    .select('id, slug, name_en, name_ar, description_en, description_ar, tagline_en, tagline_ar, logo_url, banner_url, status')
    .eq('slug', slug)
    .single()

  if (!brand || !['approved', 'active'].includes(brand.status)) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, title_en, title_ar, description_en, description_ar, price, sale_price, category, product_images(url, is_primary)')
    .eq('brand_id', brand.id)
    .eq('status', 'live')
    .order('published_at', { ascending: false })

  const liveProducts = products ?? []

  const brandName = isAr && brand.name_ar ? brand.name_ar : brand.name_en
  const brandDesc = isAr && brand.description_ar ? brand.description_ar : brand.description_en
  const brandTagline = isAr && brand.tagline_ar ? brand.tagline_ar : brand.tagline_en

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Brand Header */}
        <section className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-start">
            {brand.logo_url && (
              <div className="shrink-0">
                <div className="relative w-20 h-20 md:w-28 md:h-28 border border-border overflow-hidden">
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
              <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-4">
                {isAr ? 'المتجر' : 'Brand'}
              </p>
              <h1 className="font-display text-4xl md:text-6xl font-light text-parchment mb-3 leading-tight">
                {brandName}
              </h1>
              {brandTagline && (
                <p className="text-muted text-base mb-4 leading-relaxed">{brandTagline}</p>
              )}
              {brandDesc && (
                <p className="text-muted text-sm max-w-xl leading-relaxed">{brandDesc}</p>
              )}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">

            {liveProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted text-sm">
                  {isAr ? 'لا توجد منتجات متاحة حالياً.' : 'No products available yet.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-10">
                  {isAr ? 'المنتجات' : 'Products'} ({liveProducts.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                  {liveProducts.map(product => {
                    const images = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
                    const primaryImage = images.find(i => i.is_primary) ?? images[0]
                    const title = isAr && product.title_ar ? product.title_ar : product.title_en
                    const price = Number(product.price)
                    const salePrice = product.sale_price ? Number(product.sale_price) : null

                    return (
                      <Link
                        key={product.id}
                        href={`/brands/${slug}/products/${product.id}`}
                        className="group flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
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
                              <div className="h-px w-8 bg-gold opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="pt-3 space-y-1">
                          <p className="text-xs text-parchment font-medium leading-snug">{title}</p>
                          <div className="flex items-baseline gap-2">
                            {salePrice ? (
                              <>
                                <span className="text-xs text-gold">SAR {salePrice.toFixed(2)}</span>
                                <span className="text-[10px] text-muted line-through">SAR {price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted">SAR {price.toFixed(2)}</span>
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
