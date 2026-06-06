'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type BrandProfileState = { error: string | null; success?: boolean }

export async function updateBrandProfile(
  brandId: string,
  _prev: BrandProfileState,
  formData: FormData
): Promise<BrandProfileState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    // Confirm membership
    const { data: member } = await supabase
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .maybeSingle()

    if (!member) return { error: 'Forbidden' }

    const logoUrl = (formData.get('logo_url') as string)?.trim()
    const updates = {
      ...(logoUrl !== undefined && { logo_url: logoUrl || null }),
      name_en: (formData.get('name_en') as string)?.trim(),
      name_ar: (formData.get('name_ar') as string)?.trim() || null,
      description_en: (formData.get('description_en') as string)?.trim() || null,
      description_ar: (formData.get('description_ar') as string)?.trim() || null,
      tagline_en: (formData.get('tagline_en') as string)?.trim() || null,
      tagline_ar: (formData.get('tagline_ar') as string)?.trim() || null,
      contact_email: (formData.get('contact_email') as string)?.trim() || null,
      contact_phone: (formData.get('contact_phone') as string)?.trim() || null,
      website_url: (formData.get('website_url') as string)?.trim() || null,
      shipping_info_en: (formData.get('shipping_info_en') as string)?.trim() || null,
      return_policy_en: (formData.get('return_policy_en') as string)?.trim() || null,
    }

    if (!updates.name_en) return { error: 'Brand name (English) is required.' }

    const { error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', brandId)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/profile')
  revalidatePath('/dashboard/brand')
  return { error: null, success: true }
}

// ── Logo upload ───────────────────────────────────────────────────────────────

export async function uploadBrandLogo(
  brandId: string,
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { url: null, error: 'Unauthenticated' }

    const { data: member } = await supabase
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .maybeSingle()

    if (!member) return { url: null, error: 'Forbidden' }

    const file = formData.get('logo') as File | null
    if (!file || file.size === 0) return { url: null, error: 'No file provided.' }

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return { url: null, error: 'Only JPG, PNG, or WebP files are allowed.' }
    }
    if (file.size > 2 * 1024 * 1024) {
      return { url: null, error: 'File must be under 2 MB.' }
    }

    const service = createServiceClient()

    // Create bucket if it doesn't exist yet
    await service.storage.createBucket('brand-assets', {
      public: true,
      fileSizeLimit: 2097152,
    })
    // Ignore "already exists" — bucket may already be present

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `brands/${brandId}/logo.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await service.storage
      .from('brand-assets')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) return { url: null, error: uploadError.message }

    const { data: { publicUrl } } = service.storage
      .from('brand-assets')
      .getPublicUrl(path)

    return { url: publicUrl, error: null }
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : 'Upload failed.' }
  }
}

// ── Storefront submission ─────────────────────────────────────────────────────

export async function submitStorefrontForReview(
  brandId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const { data: member } = await supabase
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .maybeSingle()

    if (!member) return { error: 'Forbidden' }

    const service = createServiceClient()
    const { data: brand } = await service
      .from('brands')
      .select('name_en, slug, onboarding_state')
      .eq('id', brandId)
      .single()

    if (!brand) return { error: 'Brand not found' }
    if (brand.onboarding_state === 'live') return { error: 'Storefront is already live.' }
    if (brand.onboarding_state === 'submitted') return { error: 'Already submitted for review.' }

    const { error } = await service
      .from('brands')
      .update({ onboarding_state: 'submitted' })
      .eq('id', brandId)

    if (error) return { error: error.message }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merchantclubsa.com'
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: 'Merchant Club SA <applications@merchantclubsa.com>',
          to: ['info@merchantclubsa.com'],
          subject: `[Review] Brand submitted — ${brand.name_en}`,
          html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0D0D0D;color:#fff;padding:40px;">
            <h2 style="color:#D4AF37;">Brand Storefront Submitted for Review</h2>
            <p><strong>Brand:</strong> ${brand.name_en}</p>
            <p><strong>Slug:</strong> ${brand.slug}</p>
            <p><a href="${siteUrl}/dashboard/admin/brands" style="color:#D4AF37;">Review in admin →</a></p>
          </body></html>`,
        })
      } catch (emailErr) {
        console.error('[brands] Storefront submission email failed:', emailErr)
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/brand/storefront')
  revalidatePath('/dashboard/brand')
  return { error: null }
}

export async function saveBrandLogoUrl(
  brandId: string,
  url: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const { data: member } = await supabase
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .maybeSingle()

    if (!member) return { error: 'Forbidden' }

    const { error } = await supabase
      .from('brands')
      .update({ logo_url: url })
      .eq('id', brandId)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error.' }
  }

  revalidatePath('/dashboard/brand/profile')
  revalidatePath('/[locale]/store', 'page')
  revalidatePath('/[locale]/brands', 'page')
  return { error: null }
}
