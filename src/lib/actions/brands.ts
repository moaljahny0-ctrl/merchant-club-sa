'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

    const updates = {
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
