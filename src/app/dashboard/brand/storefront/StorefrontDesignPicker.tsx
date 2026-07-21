'use client'

import { useState, useTransition } from 'react'
import { saveStorefrontCustomization } from '@/lib/actions/brands'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import type { StorefrontTemplate, ThemePalette, SocialLinks } from '@/lib/types/database'

const TEMPLATES: { id: StorefrontTemplate; labelKey: 'template_classic' | 'template_editorial' | 'template_grid' }[] = [
  { id: 'classic',   labelKey: 'template_classic' },
  { id: 'editorial', labelKey: 'template_editorial' },
  { id: 'grid',      labelKey: 'template_grid' },
]

export function StorefrontDesignPicker({
  brandId,
  palette,
  initialTemplateId,
  initialAccentColorId,
  initialSocialLinks,
  locale = 'en',
}: {
  brandId: string
  palette: ThemePalette[]
  initialTemplateId: StorefrontTemplate
  initialAccentColorId: string
  initialSocialLinks: SocialLinks
  locale?: DashLang
}) {
  const t = dt(locale).storefront
  const [templateId, setTemplateId] = useState<StorefrontTemplate>(initialTemplateId)
  const [accentColorId, setAccentColorId] = useState(initialAccentColorId)
  const [social, setSocial] = useState<SocialLinks>(initialSocialLinks)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveStorefrontCustomization(brandId, {
        templateId,
        accentColorId,
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
          <p className="text-[9px] text-gold tracking-[0.3em] uppercase mb-1">{t.design_heading}</p>
          <p className="text-muted text-xs">{t.design_body}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 bg-gold text-ink font-medium hover:bg-gold-light transition-colors disabled:opacity-50 shrink-0"
        >
          {isPending ? t.design_saving : saved ? t.design_saved : t.design_save}
        </button>
      </div>

      {/* Template picker */}
      <p className="text-[9px] text-muted/60 tracking-[0.2em] uppercase mb-2">{t.template_label}</p>
      <div className="flex gap-2 mb-5">
        {TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => { setTemplateId(tpl.id); setSaved(false) }}
            className={`text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
              templateId === tpl.id ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted hover:text-parchment'
            }`}
          >
            {t[tpl.labelKey]}
          </button>
        ))}
      </div>

      {/* Accent color picker */}
      <p className="text-[9px] text-muted/60 tracking-[0.2em] uppercase mb-2">{t.accent_label}</p>
      <div className="flex gap-2 mb-5">
        {palette.map(color => (
          <button
            key={color.id}
            title={locale === 'ar' ? color.name_ar : color.name_en}
            onClick={() => { setAccentColorId(color.id); setSaved(false) }}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              accentColorId === color.id ? 'border-parchment scale-110' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{ background: color.accent_hex }}
          />
        ))}
      </div>

      {/* Social links */}
      <p className="text-[9px] text-muted/60 tracking-[0.2em] uppercase mb-2">{t.social_heading}</p>
      <div className="space-y-2">
        <input
          type="url"
          placeholder={t.social_instagram}
          value={social.instagram ?? ''}
          onChange={e => { setSocial(s => ({ ...s, instagram: e.target.value })); setSaved(false) }}
          className="w-full bg-surface border border-border px-3 py-2 text-sm text-parchment placeholder:text-muted/40"
        />
        <input
          type="url"
          placeholder={t.social_tiktok}
          value={social.tiktok ?? ''}
          onChange={e => { setSocial(s => ({ ...s, tiktok: e.target.value })); setSaved(false) }}
          className="w-full bg-surface border border-border px-3 py-2 text-sm text-parchment placeholder:text-muted/40"
        />
        <input
          type="url"
          placeholder={t.social_x}
          value={social.x ?? ''}
          onChange={e => { setSocial(s => ({ ...s, x: e.target.value })); setSaved(false) }}
          className="w-full bg-surface border border-border px-3 py-2 text-sm text-parchment placeholder:text-muted/40"
        />
      </div>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
