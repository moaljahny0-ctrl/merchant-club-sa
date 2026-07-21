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

// Resolves a creator's link_code (from the ?ref= param) to its creator_link_id and
// logs a creator_link_click event. Was never wired up — creator_link_click existed
// in the schema but no code path ever inserted one, so click stats were always zero.
export async function trackCreatorLinkClick(params: {
  linkCode: string
  brandId?: string | null
  sessionId?: string | null
}): Promise<void> {
  try {
    const service = createServiceClient()
    const { data: link } = await service
      .from('creator_links')
      .select('id')
      .eq('link_code', params.linkCode)
      .eq('is_active', true)
      .maybeSingle()

    if (!link) return

    await service.from('analytics_events').insert({
      event_type: 'creator_link_click',
      brand_id: params.brandId ?? null,
      product_id: null,
      creator_link_id: link.id,
      session_id: params.sessionId ?? null,
    })
  } catch (err) {
    console.error('[analytics] trackCreatorLinkClick failed:', err)
  }
}
