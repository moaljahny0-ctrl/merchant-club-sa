import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ProductEditClient } from '@/components/dashboard/ProductEditClient'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import type { Product, ProductImage } from '@/lib/types/database'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ imageError?: string }>
}

export default async function ProductEditPage({ params, searchParams }: Props) {
  const { id } = await params
  const { imageError } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('dashboard_locale')?.value ?? 'en') as DashLang
  const t = dt(locale).product_edit_page

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) redirect('/dashboard/brand')

  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(id, url, storage_path, is_primary, sort_order, created_at, alt_text_en, alt_text_ar)')
    .eq('id', id)
    .eq('brand_id', member.brand_id)
    .single()

  if (!product) notFound()

  const images = (product.product_images as ProductImage[]) ?? []
  const primaryImage = images.find(img => img.is_primary) ?? images[0]

  const canEdit = true
  const canSubmit = ['draft', 'rejected'].includes(product.status)

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/dashboard/brand/products"
          className="text-[10px] text-muted hover:text-gold tracking-[0.2em] uppercase transition-colors"
        >
          {t.back}
        </Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="font-display text-3xl font-light text-parchment">{product.title_en}</h1>
            <p className="text-muted text-xs mt-1">
              {t.label_status} <span className="text-parchment">{t.status[product.status as keyof typeof t.status] ?? product.status}</span>
            </p>
          </div>
        </div>
      </div>

      {imageError && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 px-5 py-4 mb-8">
          <p className="text-yellow-400 text-xs font-medium mb-1">{t.img_error_heading}</p>
          <p className="text-muted text-xs">{t.img_error_body}</p>
        </div>
      )}

      {product.status === 'rejected' && product.rejection_reason && (
        <div className="border border-red-500/30 bg-red-500/10 px-5 py-4 mb-8">
          <p className="text-red-400 text-xs font-medium mb-1">{t.rejected_heading}</p>
          <p className="text-muted text-xs">{product.rejection_reason}</p>
          <p className="text-muted text-xs mt-2">{t.rejected_note}</p>
        </div>
      )}

      {product.status === 'submitted' && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 px-5 py-4 mb-8">
          <p className="text-yellow-400 text-xs">{t.review_note}</p>
        </div>
      )}

      {product.status === 'live' && (
        <div className="border border-green-500/30 bg-green-500/5 px-5 py-4 mb-8">
          <p className="text-green-400 text-xs">{t.live_note}</p>
        </div>
      )}

      <ProductEditClient
        product={product as Product}
        canEdit={canEdit}
        canSubmit={canSubmit}
        currentImageUrl={primaryImage?.url}
        locale={locale}
      />
    </div>
  )
}
