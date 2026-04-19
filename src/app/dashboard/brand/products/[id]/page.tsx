import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductEditClient } from '@/components/dashboard/ProductEditClient'
import type { Product, ProductImage } from '@/lib/types/database'

type Props = {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Live',
  archived: 'Archived',
  out_of_stock: 'Out of stock',
}

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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

  const canEdit = ['draft', 'rejected'].includes(product.status)
  const canSubmit = ['draft', 'rejected'].includes(product.status)

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/dashboard/brand/products"
          className="text-[10px] text-muted hover:text-gold tracking-[0.2em] uppercase transition-colors"
        >
          ← Products
        </Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="font-display text-3xl font-light text-parchment">{product.title_en}</h1>
            <p className="text-muted text-xs mt-1">
              Status: <span className="text-parchment">{STATUS_LABELS[product.status] ?? product.status}</span>
            </p>
          </div>
        </div>
      </div>

      {product.status === 'rejected' && product.rejection_reason && (
        <div className="border border-red-500/30 bg-red-500/10 px-5 py-4 mb-8">
          <p className="text-red-400 text-xs font-medium mb-1">Rejected</p>
          <p className="text-muted text-xs">{product.rejection_reason}</p>
          <p className="text-muted text-xs mt-2">Edit your product and resubmit for review.</p>
        </div>
      )}

      {product.status === 'submitted' && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 px-5 py-4 mb-8">
          <p className="text-yellow-400 text-xs">This product is currently under review. You can&apos;t edit it until a decision is made.</p>
        </div>
      )}

      {product.status === 'live' && (
        <div className="border border-green-500/30 bg-green-500/5 px-5 py-4 mb-8">
          <p className="text-green-400 text-xs">This product is live and visible on your brand page.</p>
        </div>
      )}

      <ProductEditClient
        product={product as Product}
        canEdit={canEdit}
        canSubmit={canSubmit}
        currentImageUrl={primaryImage?.url}
      />
    </div>
  )
}
