'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { AnalyticsEvent } from '@/lib/types/database'

export async function trackEvent(params: {
  event_type: AnalyticsEvent['event_type']
  brand_id?: string | null
  product_id?: string | null
  creator_link_id?: string | null
  session_id?: string | null
}): Promise<void> {
  try {
    const service = createServiceClient()
    await service.from('analytics_events').insert({
      event_type: params.event_type,
      brand_id: params.brand_id ?? null,
      product_id: params.product_id ?? null,
      creator_link_id: params.creator_link_id ?? null,
      session_id: params.session_id ?? null,
    })
  } catch (err) {
    console.error('[analytics] trackEvent failed:', err)
  }
}
