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

// ── create ────────────────────────────────────────────────────────────────────

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  let newId: string | undefined

  try {
    const brandId = await getActiveBrandId()

    const title_en = (formData.get('title_en') as string)?.trim()
    const title_ar = (formData.get('title_ar') as string)?.trim() ?? ''
    const description_en = (formData.get('description_en') as string)?.trim() ?? ''
    const description_ar = (formData.get('description_ar') as string)?.trim() ?? ''
    const priceRaw = formData.get('price') as string
    const price = parseFloat(priceRaw)
    const category = (formData.get('category') as string)?.trim() ?? ''
    const sku = (formData.get('sku') as string)?.trim() || null
    const stockRaw = formData.get('stock_quantity') as string
    const stock_quantity = parseInt(stockRaw ?? '0', 10)

    if (!title_en || isNaN(price) || price < 0) {
      return { error: 'Title and a valid price are required.' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .insert({
        brand_id: brandId,
        title_en,
        title_ar,
        description_en,
        description_ar,
        price,
        category,
        sku,
        stock_quantity,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    newId = data.id
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/products')
  redirect(`/dashboard/brand/products/${newId}`)
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
    const title_ar = (formData.get('title_ar') as string)?.trim() ?? ''
    const description_en = (formData.get('description_en') as string)?.trim() ?? ''
    const description_ar = (formData.get('description_ar') as string)?.trim() ?? ''
    const price = parseFloat(formData.get('price') as string)
    const category = (formData.get('category') as string)?.trim() ?? ''
    const sku = (formData.get('sku') as string)?.trim() || null
    const stock_quantity = parseInt((formData.get('stock_quantity') as string) ?? '0', 10)

    if (!title_en || isNaN(price) || price < 0) {
      return { error: 'Title and a valid price are required.' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('products')
      .update({ title_en, title_ar, description_en, description_ar, price, category, sku, stock_quantity })
      .eq('id', id)
      .eq('brand_id', brandId)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/products')
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
    const newStatus: ProductStatus = action === 'approve' ? 'approved' : 'rejected'

    const { error } = await serviceClient
      .from('products')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
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
