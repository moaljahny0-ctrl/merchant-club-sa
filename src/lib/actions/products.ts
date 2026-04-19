'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ProductStatus } from '@/lib/types/database'

export type ProductFormState = {
  error: string | null
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function getActiveBrandId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: member } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!member) throw new Error('No active brand membership')
  return member.brand_id
}

async function uploadProductImage(
  brandId: string,
  productId: string,
  file: File
): Promise<string | null> {
  const service = createServiceClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${brandId}/${productId}/primary.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await service.storage
    .from('product-images')
    .upload(storagePath, bytes, { contentType: file.type, upsert: true })

  if (uploadErr) {
    console.error('[products] Image upload error:', uploadErr)
    return null
  }

  const { data: urlData } = service.storage.from('product-images').getPublicUrl(storagePath)

  await service.from('product_images').insert({
    product_id: productId,
    url: urlData.publicUrl,
    storage_path: storagePath,
    is_primary: true,
    sort_order: 0,
  })

  return urlData.publicUrl
}

async function replaceProductImage(
  brandId: string,
  productId: string,
  file: File
): Promise<void> {
  const service = createServiceClient()

  // Remove existing primary image from storage and DB
  const { data: existing } = await service
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId)
    .eq('is_primary', true)
    .maybeSingle()

  if (existing?.storage_path) {
    await service.storage.from('product-images').remove([existing.storage_path])
  }
  await service.from('product_images').delete().eq('product_id', productId).eq('is_primary', true)

  await uploadProductImage(brandId, productId, file)
}

// ── create ────────────────────────────────────────────────────────────────────

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  let newId: string | undefined

  try {
    const brandId = await getActiveBrandId()

    const title_en = (formData.get('title_en') as string)?.trim()
    const description_en = (formData.get('description_en') as string)?.trim() ?? ''
    const priceRaw = formData.get('price') as string
    const price = parseFloat(priceRaw)
    const stock_quantity = parseInt(formData.get('stock_quantity') as string, 10)
    const imageFile = formData.get('image') as File | null

    if (!title_en || isNaN(price) || price < 0) {
      return { error: 'Product name and a valid price are required.' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .insert({
        brand_id: brandId,
        title_en,
        title_ar: '',
        description_en,
        description_ar: '',
        price,
        stock_quantity: isNaN(stock_quantity) ? 1 : Math.max(0, stock_quantity),
        category: '',
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    newId = data.id

    if (imageFile && imageFile.size > 0 && newId) {
      await uploadProductImage(brandId, newId, imageFile)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/products')
  redirect('/dashboard/brand/products')
}

// ── update ────────────────────────────────────────────────────────────────────

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  try {
    const brandId = await getActiveBrandId()

    const title_en = (formData.get('title_en') as string)?.trim()
    const description_en = (formData.get('description_en') as string)?.trim() ?? ''
    const price = parseFloat(formData.get('price') as string)
    const stock_quantity = parseInt(formData.get('stock_quantity') as string, 10)
    const imageFile = formData.get('image') as File | null

    if (!title_en || isNaN(price) || price < 0) {
      return { error: 'Product name and a valid price are required.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('products')
      .update({
        title_en,
        description_en,
        price,
        stock_quantity: isNaN(stock_quantity) ? 1 : Math.max(0, stock_quantity),
      })
      .eq('id', id)
      .eq('brand_id', brandId)

    if (error) return { error: error.message }

    if (imageFile && imageFile.size > 0) {
      await replaceProductImage(brandId, id, imageFile)
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/products')
  revalidatePath(`/dashboard/brand/products/${id}`)
  return { error: null }
}

// ── submit for review ─────────────────────────────────────────────────────────

export async function submitProductForReview(id: string): Promise<{ error: string | null }> {
  try {
    const brandId = await getActiveBrandId()
    const supabase = await createClient()

    const { data: product } = await supabase
      .from('products')
      .select('status')
      .eq('id', id)
      .eq('brand_id', brandId)
      .single()

    if (!product) return { error: 'Product not found.' }
    if (!['draft', 'rejected'].includes(product.status)) {
      return { error: 'Only draft or rejected products can be submitted.' }
    }

    const { error } = await supabase
      .from('products')
      .update({ status: 'submitted' })
      .eq('id', id)
      .eq('brand_id', brandId)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/products')
  revalidatePath(`/dashboard/brand/products/${id}`)
  return { error: null }
}

// ── delete ────────────────────────────────────────────────────────────────────

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  try {
    const brandId = await getActiveBrandId()
    const supabase = await createClient()

    // Remove images from storage first
    const service = createServiceClient()
    const { data: images } = await service
      .from('product_images')
      .select('storage_path')
      .eq('product_id', id)

    if (images && images.length > 0) {
      const paths = images.map(i => i.storage_path).filter(Boolean)
      if (paths.length) await service.storage.from('product-images').remove(paths)
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('brand_id', brandId)
      .in('status', ['draft', 'rejected'])

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/products')
  redirect('/dashboard/brand/products')
}

// ── admin: review ─────────────────────────────────────────────────────────────

export async function adminReviewProduct(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const serviceClient = createServiceClient()
    const now = new Date().toISOString()

    const { error } = await serviceClient
      .from('products')
      .update({
        status: action === 'approve' ? 'live' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: now,
        ...(action === 'approve' ? { published_at: now } : {}),
        ...(action === 'reject' ? { rejection_reason: rejectionReason ?? 'Did not meet requirements.' } : {}),
      })
      .eq('id', id)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/products')
  return { error: null }
}
