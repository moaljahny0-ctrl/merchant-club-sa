'use client'

import { useState, useTransition } from 'react'
import { generateCreatorLink } from '@/lib/actions/creator'

type LinkRow = {
  id: string
  linkCode: string
  commissionRate: number
  createdAt: string
  brandId: string
  brandName: string
  brandSlug: string
}

type AvailableBrand = { id: string; name: string; slug: string }

type CreatorDict = {
  no_links_heading: string
  no_links_body: string
  links_col_brand: string
  links_col_link: string
  links_col_rate: string
  links_col_created: string
  copy: string
  copied: string
  available_heading: string
  available_body: string
  generate: string
  generating: string
  no_brands_live: string
  all_linked: string
}

export function CreatorLinksClient({
  links,
  availableBrands,
  siteUrl,
  t,
}: {
  links: LinkRow[]
  availableBrands: AvailableBrand[]
  siteUrl: string
  t: CreatorDict
}) {
  // New links generated during this session, merged with what the server
  // already had. Avoids a full page refresh just to see a freshly minted link.
  const [sessionLinks, setSessionLinks] = useState<LinkRow[]>([])
  const [pendingBrandId, setPendingBrandId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const allLinks = [...sessionLinks, ...links]
  const generatedBrandIds = new Set(allLinks.map(l => l.brandId))
  const remainingBrands = availableBrands.filter(b => !generatedBrandIds.has(b.id))

  function shareUrl(link: LinkRow) {
    return `${siteUrl}/brands/${link.brandSlug}?ref=${link.linkCode}`
  }

  function handleCopy(link: LinkRow) {
    navigator.clipboard.writeText(shareUrl(link)).then(() => {
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }

  function handleGenerate(brand: AvailableBrand) {
    setErrors(prev => ({ ...prev, [brand.id]: '' }))
    setPendingBrandId(brand.id)
    startTransition(async () => {
      const result = await generateCreatorLink(brand.id)
      setPendingBrandId(null)
      if (result.error) {
        setErrors(prev => ({ ...prev, [brand.id]: result.error! }))
        return
      }
      setSessionLinks(prev => [
        {
          id: `session-${brand.id}`,
          linkCode: result.linkCode!,
          commissionRate: 8,
          createdAt: new Date().toISOString(),
          brandId: brand.id,
          brandName: brand.name,
          brandSlug: brand.slug,
        },
        ...prev,
      ])
    })
  }

  return (
    <>
      {/* Existing links */}
      {allLinks.length === 0 ? (
        <div className="border border-border px-7 py-7 mb-10">
          <p className="text-parchment text-base font-light leading-relaxed mb-1">{t.no_links_heading}</p>
          <p className="text-muted text-sm leading-relaxed">{t.no_links_body}</p>
        </div>
      ) : (
        <div className="mb-10 border border-border divide-y divide-border">
          <div className="grid grid-cols-[1.4fr_1.8fr_0.7fr_0.9fr] gap-3 px-5 py-3 text-[9px] text-muted/50 tracking-[0.15em] uppercase">
            <span>{t.links_col_brand}</span>
            <span>{t.links_col_link}</span>
            <span>{t.links_col_rate}</span>
            <span>{t.links_col_created}</span>
          </div>
          {allLinks.map(link => (
            <div key={link.id} className="grid grid-cols-[1.4fr_1.8fr_0.7fr_0.9fr] gap-3 px-5 py-4 items-center">
              <span className="text-parchment text-sm truncate">{link.brandName}</span>
              <button
                onClick={() => handleCopy(link)}
                title={shareUrl(link)}
                className="text-left text-xs text-gold hover:text-gold-light truncate"
              >
                {copiedId === link.id ? t.copied : shareUrl(link)}
              </button>
              <span className="text-muted text-xs">{link.commissionRate}%</span>
              <span className="text-muted/60 text-xs">
                {new Date(link.createdAt).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Available brands to generate a link for */}
      <div className="mb-4">
        <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-2">{t.available_heading}</p>
        <p className="text-muted text-xs leading-relaxed mb-5 max-w-md">{t.available_body}</p>
      </div>

      {availableBrands.length === 0 ? (
        <p className="text-muted text-sm">{t.no_brands_live}</p>
      ) : remainingBrands.length === 0 ? (
        <p className="text-muted text-sm">{t.all_linked}</p>
      ) : (
        <div className="border border-border divide-y divide-border">
          {remainingBrands.map(brand => (
            <div key={brand.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="text-parchment text-sm">{brand.name}</span>
              <div className="flex items-center gap-3">
                {errors[brand.id] && <span className="text-xs text-red-400">{errors[brand.id]}</span>}
                <button
                  onClick={() => handleGenerate(brand)}
                  disabled={isPending && pendingBrandId === brand.id}
                  className="bg-gold text-ink text-[10px] font-medium tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isPending && pendingBrandId === brand.id ? t.generating : t.generate}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
