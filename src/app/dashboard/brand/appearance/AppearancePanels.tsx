'use client'

import { useState } from 'react'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import {
  BODY_FONTS, CARD_STYLES, FILTER_PLACEMENTS, HERO_STYLES, LOGO_SIZES,
  LAYOUT_PRESETS, PERSONALITIES,
  type DesignTokens, type LayoutPresetId, type PersonalityId, type SectionKey,
} from '@/lib/theme-tokens'
import type { ThemePalette } from '@/lib/types/database'

export type AppearanceView = 'layout' | 'sections' | 'style' | 'typography' | 'colors' | 'personality' | 'pages'

export const APPEARANCE_NAV: AppearanceView[] = ['layout', 'sections', 'style', 'typography', 'colors', 'personality', 'pages']

const SPACING_STEPS: { value: number; key: 'spacing_tight' | 'spacing_normal' | 'spacing_wide' | 'spacing_luxurious' }[] = [
  { value: 0.7, key: 'spacing_tight' },
  { value: 1, key: 'spacing_normal' },
  { value: 1.4, key: 'spacing_wide' },
  { value: 1.6, key: 'spacing_luxurious' },
]

const fieldLabel = 'block text-[12px] text-muted/70 uppercase tracking-[0.15em] mb-2 font-medium'
const pill = (active: boolean) =>
  `px-3.5 py-2 rounded-full text-[12.5px] border transition-colors ${
    active ? 'bg-gold border-gold text-ink font-semibold' : 'border-border text-muted hover:text-parchment hover:border-gold/50'
  }`

export function AppearancePanels({
  view, tokens, palette, locale = 'en',
  onUpdate, onLayoutPreset, onPersonality,
}: {
  view: AppearanceView
  tokens: DesignTokens
  palette: ThemePalette[]
  locale?: DashLang
  onUpdate: (patch: Partial<DesignTokens>) => void
  onLayoutPreset: (id: LayoutPresetId) => void
  onPersonality: (id: PersonalityId) => void
}) {
  const t = dt(locale).appearance

  if (view === 'layout') {
    return (
      <div>
        <h2 className="text-parchment text-base font-medium mb-1">{t.layout_heading}</h2>
        <p className="text-muted text-[12.5px] leading-relaxed mb-5">{t.layout_body}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LAYOUT_PRESETS) as LayoutPresetId[]).map(id => (
            <button key={id} onClick={() => onLayoutPreset(id)} className={pill(tokens.layout === id)}>
              {t[`layout_${id}` as const]}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'sections') {
    const sections = tokens.sections
    function move(index: number, dir: -1 | 1) {
      const next = [...sections]
      const target = index + dir
      if (target < 0 || target >= next.length) return
      ;[next[index], next[target]] = [next[target], next[index]]
      onUpdate({ sections: next })
    }
    function toggle(key: SectionKey) {
      onUpdate({ sections: sections.map(s => s.key === key ? { ...s, visible: !s.visible } : s) })
    }
    return (
      <div>
        <h2 className="text-parchment text-base font-medium mb-1">{t.sections_heading}</h2>
        <p className="text-muted text-[12.5px] leading-relaxed mb-5">{t.sections_body}</p>
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div key={s.key} className="flex items-center justify-between px-3 py-2.5 bg-surface border border-border rounded-md">
              <span className="text-parchment text-[13px]">{t[`section_${s.key}` as const]}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => move(i, -1)} disabled={i === 0} title={t.move_up}
                  className="text-muted hover:text-gold disabled:opacity-30 disabled:hover:text-muted px-1">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} title={t.move_down}
                  className="text-muted hover:text-gold disabled:opacity-30 disabled:hover:text-muted px-1">↓</button>
                <button onClick={() => toggle(s.key)}
                  className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded ${s.visible ? 'text-gold border border-gold/40' : 'text-muted/60 border border-border'}`}>
                  {s.visible ? t.section_show : t.section_hide}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'style') {
    return (
      <div>
        <h2 className="text-parchment text-base font-medium mb-1">{t.style_heading}</h2>
        <p className="text-muted text-[12.5px] leading-relaxed mb-5">{t.style_body}</p>

        <div className="mb-6">
          <label className={fieldLabel}>{t.radius_label} — {tokens.radius}px</label>
          <input type="range" min={0} max={32} value={tokens.radius}
            onChange={e => onUpdate({ radius: Number(e.target.value) })}
            className="w-full accent-gold" />
        </div>

        <div className="mb-6">
          <label className={fieldLabel}>{t.spacing_label}</label>
          <div className="flex flex-wrap gap-2">
            {SPACING_STEPS.map(s => (
              <button key={s.value} onClick={() => onUpdate({ spacing: s.value })} className={pill(tokens.spacing === s.value)}>
                {t[s.key]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className={fieldLabel}>{t.card_label}</label>
          <div className="flex flex-wrap gap-2">
            {CARD_STYLES.map(cs => (
              <button key={cs} onClick={() => onUpdate({ cardStyle: cs })} className={pill(tokens.cardStyle === cs)}>
                {t[`card_${cs}` as const]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={fieldLabel}>{t.cols_label} — {tokens.cols}</label>
          <input type="range" min={2} max={5} value={tokens.cols}
            onChange={e => onUpdate({ cols: Number(e.target.value) })}
            className="w-full accent-gold" />
        </div>
      </div>
    )
  }

  if (view === 'typography') {
    return (
      <div>
        <h2 className="text-parchment text-base font-medium mb-1">{t.typography_heading}</h2>
        <p className="text-muted text-[12.5px] leading-relaxed mb-5">{t.typography_body}</p>
        <label className={fieldLabel}>{t.font_label}</label>
        <select value={tokens.bodyFont} onChange={e => onUpdate({ bodyFont: e.target.value as DesignTokens['bodyFont'] })}
          className="w-full bg-surface border border-border px-3 py-2.5 text-[13px] text-parchment rounded-md">
          {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
    )
  }

  if (view === 'colors') {
    const tokenFields: { key: 'primary' | 'accent' | 'bg' | 'surface'; labelKey: 'color_primary' | 'color_accent' | 'color_bg' | 'color_surface' }[] = [
      { key: 'primary', labelKey: 'color_primary' },
      { key: 'accent', labelKey: 'color_accent' },
      { key: 'bg', labelKey: 'color_bg' },
      { key: 'surface', labelKey: 'color_surface' },
    ]
    return (
      <div>
        <h2 className="text-parchment text-base font-medium mb-1">{t.colors_heading}</h2>
        <p className="text-muted text-[12.5px] leading-relaxed mb-5">{t.colors_body}</p>
        <div className="flex flex-wrap gap-5 mb-6">
          {tokenFields.map(({ key, labelKey }) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="relative w-10 h-10 rounded-xl border-2 border-border overflow-hidden" style={{ background: tokens[key] }}>
                <input type="color" value={tokens[key]} onChange={e => onUpdate({ [key]: e.target.value } as Partial<DesignTokens>)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              </div>
              <span className="text-[10.5px] text-muted">{t[labelKey]}</span>
            </div>
          ))}
        </div>
        {palette.length > 0 && (
          <div>
            <label className={fieldLabel}>{t.color_suggested}</label>
            <div className="flex flex-wrap gap-2">
              {palette.map(color => (
                <button key={color.id} title={locale === 'ar' ? color.name_ar : color.name_en}
                  onClick={() => onUpdate({ accent: color.accent_hex })}
                  className="w-7 h-7 rounded-full border-2 border-transparent hover:border-parchment transition-all"
                  style={{ background: color.accent_hex }} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (view === 'personality') {
    return (
      <div>
        <h2 className="text-parchment text-base font-medium mb-1">{t.personality_heading}</h2>
        <p className="text-muted text-[12.5px] leading-relaxed mb-5">{t.personality_body}</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PERSONALITIES) as PersonalityId[]).map(id => (
            <button key={id} onClick={() => onPersonality(id)}
              className={`border rounded-lg p-3 text-center text-[12px] transition-colors ${
                tokens.personality === id ? 'border-gold bg-gold/10 text-gold font-semibold' : 'border-border text-muted hover:text-parchment'
              }`}>
              <span className="block text-lg mb-1">{PERSONALITIES[id].emoji}</span>
              {t[`personality_${id}` as const]}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // pages
  return <PagesPanel tokens={tokens} locale={locale} onUpdate={onUpdate} />
}

function PagesPanel({
  tokens, locale, onUpdate,
}: {
  tokens: DesignTokens
  locale?: DashLang
  onUpdate: (patch: Partial<DesignTokens>) => void
}) {
  const t = dt(locale ?? 'en').appearance
  const [page, setPage] = useState<'homepage' | 'brand' | 'product' | 'collection' | 'cart'>('brand')
  const pages: { key: typeof page; labelKey: 'page_homepage' | 'page_brand' | 'page_product' | 'page_collection' | 'page_cart' }[] = [
    { key: 'homepage', labelKey: 'page_homepage' },
    { key: 'brand', labelKey: 'page_brand' },
    { key: 'product', labelKey: 'page_product' },
    { key: 'collection', labelKey: 'page_collection' },
    { key: 'cart', labelKey: 'page_cart' },
  ]

  return (
    <div>
      <h2 className="text-parchment text-base font-medium mb-1">{t.pages_heading}</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        {pages.map(p => (
          <button key={p.key} onClick={() => setPage(p.key)} className={pill(page === p.key)}>
            {t[p.labelKey]}
          </button>
        ))}
      </div>

      {page !== 'brand' ? (
        <p className="text-muted text-[12.5px] leading-relaxed">{t.page_coming_soon}</p>
      ) : (
        <>
          <div className="mb-6">
            <label className={fieldLabel}>{t.hero_style_label}</label>
            <div className="flex flex-wrap gap-2">
              {HERO_STYLES.map(hs => (
                <button key={hs} onClick={() => onUpdate({ brandPage: { ...tokens.brandPage, heroStyle: hs } })}
                  className={pill(tokens.brandPage.heroStyle === hs)}>
                  {t[`hero_style_${hs}` as const]}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className={fieldLabel}>{t.logo_size_label}</label>
            <div className="flex flex-wrap gap-2">
              {LOGO_SIZES.map(ls => (
                <button key={ls} onClick={() => onUpdate({ brandPage: { ...tokens.brandPage, logoSize: ls } })}
                  className={pill(tokens.brandPage.logoSize === ls)}>
                  {t[`logo_size_${ls}` as const]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={fieldLabel}>{t.filters_label}</label>
            <div className="flex flex-wrap gap-2">
              {FILTER_PLACEMENTS.map(fp => (
                <button key={fp} onClick={() => onUpdate({ brandPage: { ...tokens.brandPage, filters: fp } })}
                  className={pill(tokens.brandPage.filters === fp)}>
                  {t[`filters_${fp}` as const]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
