'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from './_admin-utils'

export async function updateMemberStatus(
  memberId: string,
  status: 'approved' | 'rejected'
): Promise<{ error: string | null }> {
  try {
    await assertAdmin()
    const service = createServiceClient()

    const { error } = await service
      .from('members')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', memberId)

    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/members')
  return { error: null }
}
