'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackCreatorLinkClick } from '@/lib/actions/analytics'

export function RefTracker({ brandId }: { brandId?: string | null } = {}) {
  const params = useSearchParams()
  const fired = useRef(false)

  useEffect(() => {
    const ref = params.get('ref')
    if (ref && /^[a-zA-Z0-9_-]+$/.test(ref)) {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `mc_ref=${encodeURIComponent(ref)}; expires=${expires}; path=/; SameSite=Lax`

      if (!fired.current) {
        fired.current = true
        trackCreatorLinkClick({ linkCode: ref, brandId }).catch(() => {})
      }
    }
  }, [params, brandId])

  return null
}
