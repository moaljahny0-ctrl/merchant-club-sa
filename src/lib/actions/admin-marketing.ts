'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'
import type { MarketingBanner } from '@/lib/types/database'

type BannerInput = Pick<MarketingBanner, 'title' | 'subtitle' | 'image_url' | 'link_url' | 'sort_order'>

export async function adminCreateBanner(input: BannerInput): Promise<{ error: string | null }> {
  if (!input.title.trim()) return { error: 'Title is required.' }

  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service.from('marketing_banners').insert({
      title: input.title,
      subtitle: input.subtitle || null,
      image_url: input.image_url || null,
      link_url: input.link_url || null,
      sort_order: input.sort_order,
    })

    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'banner.create', targetType: 'marketing_banner', after: input })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/marketing')
  return { error: null }
}

export async function adminToggleBannerActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service
      .from('marketing_banners')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'banner.toggle', targetType: 'marketing_banner', targetId: id, after: { is_active: isActive } })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/marketing')
  return { error: null }
}

export async function adminDeleteBanner(id: string): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service.from('marketing_banners').delete().eq('id', id)
    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'banner.delete', targetType: 'marketing_banner', targetId: id })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/marketing')
  return { error: null }
}
