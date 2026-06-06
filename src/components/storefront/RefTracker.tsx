'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function RefTracker() {
  const params = useSearchParams()

  useEffect(() => {
    const ref = params.get('ref')
    if (ref && /^[a-zA-Z0-9_-]+$/.test(ref)) {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `mc_ref=${encodeURIComponent(ref)}; expires=${expires}; path=/; SameSite=Lax`
    }
  }, [params])

  return null
}
