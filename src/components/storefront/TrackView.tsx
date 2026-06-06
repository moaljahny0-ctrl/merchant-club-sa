'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/actions/analytics'
import type { AnalyticsEvent } from '@/lib/types/database'

function getOrCreateSessionId(): string {
  const key = 'mc_sid'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, sid)
  }
  return sid
}

export function TrackView({
  event_type,
  brand_id,
  product_id,
  creator_link_id,
}: {
  event_type: AnalyticsEvent['event_type']
  brand_id?: string | null
  product_id?: string | null
  creator_link_id?: string | null
}) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const session_id = getOrCreateSessionId()
    trackEvent({ event_type, brand_id, product_id, creator_link_id, session_id }).catch(() => {})
  }, [event_type, brand_id, product_id, creator_link_id])

  return null
}
