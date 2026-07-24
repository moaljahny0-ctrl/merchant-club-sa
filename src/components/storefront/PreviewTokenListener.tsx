'use client'

import { useEffect } from 'react'

/**
 * Rendered only when a storefront page loads with ?preview=true inside the
 * Appearance dashboard's iframe. Listens for CSS var updates posted by the
 * parent editor (AppearanceEditor.tsx) and applies them instantly to the
 * document, so merchants see live changes without a page reload or save.
 */
export function PreviewTokenListener() {
  useEffect(() => {
    if (window.parent === window) return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; vars?: Record<string, string> } | null
      if (!data || data.type !== 'mc-preview-tokens' || !data.vars) return
      for (const [key, value] of Object.entries(data.vars)) {
        document.documentElement.style.setProperty(key, value)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return null
}
