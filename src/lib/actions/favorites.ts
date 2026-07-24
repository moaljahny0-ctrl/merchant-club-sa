'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/customer-auth'

export type FavoriteTargetType = 'brand' | 'product'

export type ToggleFavoriteResult = {
  error: string | null
  requiresAuth?: boolean
  following?: boolean
}

export async function toggleFavorite(
  targetType: FavoriteTargetType,
  targetId: string,
  revalidatePathOnChange?: string
): Promise<ToggleFavoriteResult> {
  const session = await getCustomerSession()
  if (!session) return { error: null, requiresAuth: true }

  const service = createServiceClient()

  const { data: existing } = await service
    .from('customer_favorites')
    .select('id')
    .eq('customer_id', session.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  if (existing) {
    const { error } = await service.from('customer_favorites').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    if (revalidatePathOnChange) revalidatePath(revalidatePathOnChange)
    return { error: null, following: false }
  }

  const { error } = await service
    .from('customer_favorites')
    .insert({ customer_id: session.id, target_type: targetType, target_id: targetId })

  if (error) return { error: error.message }
  if (revalidatePathOnChange) revalidatePath(revalidatePathOnChange)
  return { error: null, following: true }
}

export async function getFavoriteCount(targetType: FavoriteTargetType, targetId: string): Promise<number> {
  const service = createServiceClient()
  const { count } = await service
    .from('customer_favorites')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
  return count ?? 0
}

export async function getCustomerFavoriteIds(targetType: FavoriteTargetType): Promise<Set<string>> {
  const session = await getCustomerSession()
  if (!session) return new Set()

  const service = createServiceClient()
  const { data } = await service
    .from('customer_favorites')
    .select('target_id')
    .eq('customer_id', session.id)
    .eq('target_type', targetType)

  return new Set((data ?? []).map(row => row.target_id as string))
}
