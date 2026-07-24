'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { saveDesignTokens } from '@/lib/actions/brands'
import { dt, type DashLang } from '@/lib/dashboard-i18n'
import {
  LAYOUT_PRESETS, PERSONALITIES, tokensToCssVars,
  type DesignTokens, type LayoutPresetId, type PersonalityId,
} from '@/lib/theme-tokens'
import type { ThemePalette } from '@/lib/types/database'
import { AppearancePanels, APPEARANCE_NAV, type AppearanceView } from './AppearancePanels'

type Device = 'desktop' | 'tablet' | 'mobile'

const DEVICE_MAX_WIDTH: Record<Device, string> = {
  desktop: '1040px',
  tablet: '600px',
  mobile: '340px',
}

export function AppearanceEditor({
  brandId,
  storefrontUrl,
  palette,
  initialTokens,
  locale = 'en',
}: {
  brandId: string
  storefrontUrl: string | null
  palette: ThemePalette[]
  initialTokens: DesignTokens
  locale?: DashLang
}) {
  const t = dt(locale).appearance
  const [tokens, setTokens] = useState<DesignTokens>(initialTokens)
  const [view, setView] = useState<AppearanceView>('layout')
  const [device, setDevice] = useState<Device>('desktop')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const previewSrc = storefrontUrl ? `${storefrontUrl}?preview=true` : null
  const previewOrigin = storefrontUrl ? new URL(storefrontUrl).origin : null

  function update(patch: Partial<DesignTokens>) {
    setTokens(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  function applyLayoutPreset(id: LayoutPresetId) {
    const p = LAYOUT_PRESETS[id]
    update({
      layout: id,
      radius: p.radius,
      spacing: p.spacing,
      heroH: p.heroH,
      cols: p.cols,
      cardStyle: p.cardStyle,
      ...(p.bg ? { bg: p.bg } : {}),
      ...(p.accent ? { accent: p.accent } : {}),
    })
  }

  function applyPersonality(id: PersonalityId) {
    const p = PERSONALITIES[id]
    update({
      personality: id,
      radius: p.radius,
      spacing: p.spacing,
      bodyFont: p.bodyFont,
      ...(p.accent ? { accent: p.accent } : {}),
      ...(p.primary ? { primary: p.primary } : {}),
      ...(p.bg ? { bg: p.bg } : {}),
      ...(p.surface ? { surface: p.surface } : {}),
    })
  }

  // Push live preview updates into the iframe on every token change — the
  // storefront page's preview-mode script applies these as CSS var writes,
  // no reload needed.
  useEffect(() => {
    const frame = iframeRef.current
    if (!frame?.contentWindow || !previewOrigin) return
    frame.contentWindow.postMessage({ type: 'mc-preview-tokens', vars: tokensToCssVars(tokens) }, previewOrigin)
  }, [tokens, previewOrigin])

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveDesignTokens(brandId, tokens)
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-[12px] text-gold tracking-[0.3em] uppercase mb-1">{t.eyebrow}</p>
          <h1 className="font-display text-4xl font-light text-parchment leading-none">{t.heading}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 border border-border rounded-md p-1">
            {(['desktop', 'tablet', 'mobile'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-wider rounded transition-colors ${
                  device === d ? 'bg-gold text-ink font-semibold' : 'text-muted hover:text-parchment'
                }`}
              >
                {t[`device_${d}` as const]}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="text-[13px] tracking-[0.2em] uppercase px-5 py-2.5 bg-gold text-ink font-medium hover:bg-gold-light transition-colors disabled:opacity-50 shrink-0"
          >
            {isPending ? t.saving : saved ? t.saved : t.save}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid md:grid-cols-[200px_320px_1fr] border border-border">
        <nav className="border-e border-border p-3 space-y-1">
          {APPEARANCE_NAV.map(key => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`w-full text-start px-3 py-2 rounded text-[13px] transition-colors ${
                view === key ? 'bg-gold/10 text-gold font-semibold' : 'text-muted hover:text-parchment'
              }`}
            >
              {t[`nav_${key}` as const]}
            </button>
          ))}
        </nav>

        <div className="border-e border-border p-5 overflow-y-auto max-h-[70vh]">
          <AppearancePanels
            view={view}
            tokens={tokens}
            palette={palette}
            locale={locale}
            onUpdate={update}
            onLayoutPreset={applyLayoutPreset}
            onPersonality={applyPersonality}
          />
        </div>

        <div className="bg-[#0B0805] flex items-start justify-center p-6 overflow-auto">
          {previewSrc ? (
            <div
              className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl transition-[max-width] duration-200 mx-auto"
              style={{ maxWidth: DEVICE_MAX_WIDTH[device] }}
            >
              <iframe
                ref={iframeRef}
                src={previewSrc}
                className="w-full block"
                style={{ height: '70vh', border: 0 }}
                title="Storefront live preview"
              />
            </div>
          ) : (
            <p className="text-muted text-sm max-w-xs text-center mt-10">{t.preview_unavailable}</p>
          )}
        </div>
      </div>
    </div>
  )
}
