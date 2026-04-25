import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createServiceClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/order/OrderForm'

type Props = {
  params: Promise<{ locale: string; slug: string; id: string }>
}

export default async function OrderPage({ params }: Props) {
  const { locale, slug, id } = await params
  const isAr = locale === 'ar'
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, brands(id, name_en, name_ar, contact_email, slug), product_images(url, is_primary)')
    .eq('id', id)
    .eq('status', 'live')
    .single()

  if (!product) redirect(`/${locale}/brands/${slug}`)

  const brand = product.brands as {
    id: string
    name_en: string
    name_ar: string | null
    contact_email: string | null
    slug: string
  } | null

  if (!brand) redirect(`/${locale}/brands/${slug}`)

  const images = (product.product_images as { url: string; is_primary: boolean }[]) ?? []
  const primaryImage = images.find(i => i.is_primary) ?? images[0]

  const title       = isAr && product.title_ar ? product.title_ar : product.title_en
  const brandName   = isAr && brand.name_ar ? brand.name_ar : brand.name_en
  const price       = Number(product.price)
  const salePrice   = product.sale_price ? Number(product.sale_price) : null
  const displayPrice = salePrice ?? price
  const inStock     = (product.stock_quantity ?? 0) > 0

  if (!inStock) redirect(`/${locale}/brands/${slug}/products/${id}`)

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20">
          <OrderForm
            productId={id}
            brandId={brand.id}
            brandSlug={slug}
            locale={locale}
            productTitle={title}
            brandName={brandName}
            displayPrice={displayPrice}
            originalPrice={salePrice ? price : null}
            primaryImageUrl={primaryImage?.url ?? null}
            stockQuantity={product.stock_quantity ?? 0}
          />
        </section>
      </main>
      <Footer />
    </div>
  )
}
