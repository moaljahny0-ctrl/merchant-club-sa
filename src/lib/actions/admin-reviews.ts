'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'

export async function adminModerateReview(id: string, action: 'approve' | 'reject'): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { data: review } = await service.from('reviews').select('status').eq('id', id).single()

    const { error } = await service
      .from('reviews')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        moderated_by: admin.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { error: error.message }

    await logAdminAction({
      actorId: admin.id,
      action: `review.${action}`,
      targetType: 'review',
      targetId: id,
      before: { status: review?.status },
      after: { status: action === 'approve' ? 'approved' : 'rejected' },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/reviews')
  return { error: null }
}

export async function adminDeleteReview(id: string): Promise<{ error: string | null }> {
  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service.from('reviews').delete().eq('id', id)
    if (error) return { error: error.message }

    await logAdminAction({ actorId: admin.id, action: 'review.delete', targetType: 'review', targetId: id })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/reviews')
  return { error: null }
}
