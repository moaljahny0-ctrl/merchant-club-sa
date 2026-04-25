'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ProductStatus } from '@/lib/types/database'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildSubmissionEmailHtml(
  productTitle: string,
  brandName: string,
  price: number,
  stock: number,
  adminUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border:1px solid #252525;">
        <tr>
          <td style="padding:40px 40px 28px;border-bottom:1px solid #252525;">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#D4AF37;">Merchant Club SA — Admin</p>
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:400;color:#FFFFFF;letter-spacing:-0.02em;">New product submitted for review.</h1>
            <p style="margin:0;font-size:14px;color:#777777;">${esc(brandName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A2A2A;margin-bottom:28px;">
              <tr><td style="padding:14px 24px;border-bottom:1px solid #2A2A2A;background:#141414;">
                <p style="margin:0 0 3px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Product</p>
                <p style="margin:0;font-size:14px;color:#FFFFFF;">${esc(productTitle)}</p>
              </td></tr>
              <tr><td style="padding:14px 24px;border-bottom:1px solid #2A2A2A;background:#141414;">
                <p style="margin:0 0 3px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Brand</p>
                <p style="margin:0;font-size:14px;color:#FFFFFF;">${esc(brandName)}</p>
              </td></tr>
              <tr><td style="padding:14px 24px;border-bottom:1px solid #2A2A2A;background:#141414;">
                <p style="margin:0 0 3px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Price</p>
                <p style="margin:0;font-size:14px;color:#FFFFFF;">SAR ${esc(Number(price).toFixed(2))}</p>
              </td></tr>
              <tr><td style="padding:14px 24px;background:#141414;">
                <p style="margin:0 0 3px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Stock</p>
                <p style="margin:0;font-size:14px;color:#FFFFFF;">${esc(String(stock))} units</p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="background:#D4AF37;">
                <a href="${esc(adminUrl)}" style="display:inline-block;padding:16px 36px;font-size:11px;font-family:Georgia,serif;letter-spacing:0.2em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;font-weight:600;">Review product →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #252525;">
          <p style="margin:0;font-size:10px;color:#444444;letter-spacing:0.1em;">merchantclubsa.com &nbsp;·&nbsp; info@merchantclubsa.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

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
): Promise<string> {
  const service = createServiceClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${brandId}/${productId}/primary.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await service.storage
    .from('product-images')
    .upload(storagePath, bytes, { contentType: file.type, upsert: true })

  if (uploadErr) {
    throw new Error(`Image upload failed: ${uploadErr.message}`)
  }

  const { data: urlData } = service.storage.from('product-images').getPublicUrl(storagePath)

  const { error: insertErr } = await service.from('product_images').insert({
    product_id: productId,
    url: urlData.publicUrl,
    storage_path: storagePath,
    is_primary: true,
    sort_order: 0,
  })

  if (insertErr) {
    throw new Error(`Image record failed to save: ${insertErr.message}`)
  }

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
    // If the product row was already created, redirect to edit so they don't
    // submit a duplicate — surface the image error as a query param.
    if (newId) {
      revalidatePath('/dashboard/brand/products')
      redirect(`/dashboard/brand/products/${newId}?imageError=1`)
    }
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

    const { data: current } = await supabase
      .from('products')
      .select('status')
      .eq('id', id)
      .eq('brand_id', brandId)
      .single()

    if (!current) return { error: 'Product not found.' }
    const wasLive = current.status === 'live'

    const { error } = await supabase
      .from('products')
      .update({
        title_en,
        description_en,
        price,
        stock_quantity: isNaN(stock_quantity) ? 1 : Math.max(0, stock_quantity),
        ...(wasLive ? { status: 'submitted' } : {}),
      })
      .eq('id', id)
      .eq('brand_id', brandId)

    if (error) return { error: error.message }

    if (imageFile && imageFile.size > 0) {
      await replaceProductImage(brandId, id, imageFile)
    }

    if (wasLive) {
      const service = createServiceClient()
      const { data: brand } = await service.from('brands').select('slug').eq('id', brandId).single()
      if (brand?.slug) {
        revalidatePath(`/en/brands/${brand.slug}`)
        revalidatePath(`/ar/brands/${brand.slug}`)
      }
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
      .select('status, title_en, price, stock_quantity')
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

    const service = createServiceClient()
    const { data: brand } = await service.from('brands').select('name_en').eq('id', brandId).single()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: 'Merchant Club SA <applications@merchantclubsa.com>',
          to: ['info@merchantclubsa.com'],
          subject: `New product submitted for review — ${product.title_en}`,
          html: buildSubmissionEmailHtml(
            product.title_en,
            brand?.name_en ?? 'Unknown Brand',
            product.price,
            product.stock_quantity,
            `${siteUrl}/dashboard/admin/products`
          ),
        })
      } catch (emailErr) {
        console.error('[products] Submission email failed:', emailErr)
      }
    }
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
    const service = createServiceClient()

    const [{ data: images }, { data: current }] = await Promise.all([
      service.from('product_images').select('storage_path').eq('product_id', id),
      service.from('products').select('status, brands(slug)').eq('id', id).eq('brand_id', brandId).single(),
    ])

    if (images && images.length > 0) {
      const paths = images.map((i: { storage_path: string }) => i.storage_path).filter(Boolean)
      if (paths.length) await service.storage.from('product-images').remove(paths)
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('brand_id', brandId)

    if (error) return { error: error.message }

    if (current?.status === 'live') {
      const slug = (current.brands as { slug?: string } | null)?.slug
      if (slug) {
        revalidatePath(`/en/brands/${slug}`)
        revalidatePath(`/ar/brands/${slug}`)
      }
    }
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
