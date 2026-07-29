'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin, logAdminAction } from './_admin-utils'
import type { PlatformSettings } from '@/lib/types/database'

export async function updatePlatformSettings(
  input: Pick<PlatformSettings, 'site_name' | 'support_email' | 'maintenance_mode' | 'commission_rate_pct' | 'low_stock_default_threshold'>
): Promise<{ error: string | null }> {
  if (!input.site_name.trim()) return { error: 'Site name is required.' }
  if (!input.support_email.trim()) return { error: 'Support email is required.' }
  if (input.commission_rate_pct < 0 || input.commission_rate_pct > 100) {
    return { error: 'Commission rate must be between 0 and 100.' }
  }
  if (input.low_stock_default_threshold < 0) {
    return { error: 'Low stock threshold must be non-negative.' }
  }

  try {
    const admin = await assertAdmin()
    const service = createServiceClient()

    const { error } = await service
      .from('platform_settings')
      .update({ ...input, updated_by: admin.id, updated_at: new Date().toISOString() })
      .eq('id', true)

    if (error) return { error: error.message }

    await logAdminAction({
      actorId: admin.id,
      action: 'settings.update',
      targetType: 'platform_settings',
      after: input,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }

  revalidatePath('/dashboard/admin/settings')
  return { error: null }
}
