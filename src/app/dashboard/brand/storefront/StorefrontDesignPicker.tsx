'use client'

import { useState, useTransition } from 'react'
import { saveStorefrontCustomization } from '@/lib/actions/brands'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import type { StorefrontTemplate, SocialLinks } from '@/lib/types/database'

export function StorefrontDesignPicker({
  brandId,
  initialTemplateId,
  initialAccentColorId,
  initialSocialLinks,
  locale = 'en',
}: {
  brandId: string
  initialTemplateId: StorefrontTemplate
  initialAccentColorId: string
  initialSocialLinks: SocialLinks
  locale?: DashLang
}) {
  const t = dt(locale).storefront
  const [social, setSocial] = useState<SocialLinks>(initialSocialLinks)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveStorefrontCustomization(brandId, {
        templateId: initialTemplateId,
        accentColorId: initialAccentColorId,
        socialLinks: social,
      })
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <div className="mb-8 border border-border px-6 py-5">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-1">{t.social_heading}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-[13px] tracking-[0.2em] uppercase px-5 py-2.5 bg-gold text-ink font-medium hover:bg-gold-light transition-colors disabled:opacity-50 shrink-0"
        >
          {isPending ? t.social_saving : saved ? t.social_saved : t.social_save}
        </button>
      </div>

      <div className="space-y-2">
        <input
          type="url"
          placeholder={t.social_instagram}
          value={social.instagram ?? ''}
          onChange={e => { setSocial(s => ({ ...s, instagram: e.target.value })); setSaved(false) }}
          className="w-full bg-surface border border-border px-3 py-2 text-base text-parchment placeholder:text-muted/40"
        />
        <input
          type="url"
          placeholder={t.social_tiktok}
          value={social.tiktok ?? ''}
          onChange={e => { setSocial(s => ({ ...s, tiktok: e.target.value })); setSaved(false) }}
          className="w-full bg-surface border border-border px-3 py-2 text-base text-parchment placeholder:text-muted/40"
        />
        <input
          type="url"
          placeholder={t.social_x}
          value={social.x ?? ''}
          onChange={e => { setSocial(s => ({ ...s, x: e.target.value })); setSaved(false) }}
          className="w-full bg-surface border border-border px-3 py-2 text-base text-parchment placeholder:text-muted/40"
        />
      </div>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
