// Shared design-token model for the brand storefront Appearance engine.
// Used both server-side (computing the public storefront's CSS var block)
// and client-side (the dashboard Appearance editor + live preview).

export type LayoutPresetId = 'classic' | 'modern' | 'luxury' | 'editorial' | 'minimal' | 'marketplace'
export type PersonalityId = 'minimal' | 'luxury' | 'playful' | 'bold' | 'elegant' | 'dark' | 'organic' | 'modern'
export type BodyFont = 'IBM Plex Sans Arabic' | 'Cairo' | 'Tajawal' | 'Amiri'
export type CardStyle = 'elevated' | 'bordered' | 'minimal'
export type SectionKey = 'hero' | 'collections' | 'products' | 'footer'
export type HeroStyle = 'compact' | 'editorial' | 'cover' | 'split' | 'centered'
export type LogoSize = 'small' | 'medium' | 'large'
export type FilterPlacement = 'top' | 'sticky' | 'sidebar' | 'hidden'

export const BODY_FONTS: BodyFont[] = ['IBM Plex Sans Arabic', 'Cairo', 'Tajawal', 'Amiri']
export const CARD_STYLES: CardStyle[] = ['elevated', 'bordered', 'minimal']
export const SECTION_KEYS: SectionKey[] = ['hero', 'collections', 'products', 'footer']
export const HERO_STYLES: HeroStyle[] = ['compact', 'editorial', 'cover', 'split', 'centered']
export const LOGO_SIZES: LogoSize[] = ['small', 'medium', 'large']
export const FILTER_PLACEMENTS: FilterPlacement[] = ['top', 'sticky', 'sidebar', 'hidden']

export type DesignTokens = {
  layout: LayoutPresetId
  personality: PersonalityId | null
  radius: number
  spacing: number
  heroH: number
  cols: number
  cardStyle: CardStyle
  bodyFont: BodyFont
  primary: string
  accent: string
  bg: string
  surface: string
  sections: { key: SectionKey; visible: boolean }[]
  brandPage: {
    heroStyle: HeroStyle
    logoSize: LogoSize
    filters: FilterPlacement
  }
}

type LayoutPreset = {
  radius: number
  spacing: number
  heroH: number
  cols: number
  cardStyle: CardStyle
  bg?: string
  accent?: string
}

export const LAYOUT_PRESETS: Record<LayoutPresetId, LayoutPreset> = {
  classic:     { radius: 8,  spacing: 1,   heroH: 200, cols: 4, cardStyle: 'bordered' },
  modern:      { radius: 16, spacing: 1,   heroH: 220, cols: 4, cardStyle: 'elevated' },
  luxury:      { radius: 2,  spacing: 1.6, heroH: 320, cols: 3, cardStyle: 'minimal', bg: '#F7F4EE', accent: '#B8975A' },
  editorial:   { radius: 0,  spacing: 1.3, heroH: 260, cols: 2, cardStyle: 'bordered' },
  minimal:     { radius: 4,  spacing: 1.4, heroH: 180, cols: 4, cardStyle: 'minimal' },
  marketplace: { radius: 12, spacing: 0.7, heroH: 150, cols: 5, cardStyle: 'bordered' },
}

type Personality = {
  radius: number
  spacing: number
  bodyFont: BodyFont
  emoji: string
  accent?: string
  primary?: string
  bg?: string
  surface?: string
}

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  minimal:  { emoji: '◻︎', radius: 4,  spacing: 1.3, bodyFont: 'IBM Plex Sans Arabic' },
  luxury:   { emoji: '✦',       radius: 2,  spacing: 1.6, bodyFont: 'Amiri', accent: '#B8975A' },
  playful:  { emoji: '✺',       radius: 24, spacing: 0.9, bodyFont: 'Cairo' },
  bold:     { emoji: '▲',       radius: 6,  spacing: 0.8, bodyFont: 'Cairo', primary: '#0E0E0E' },
  elegant:  { emoji: '❋',       radius: 10, spacing: 1.4, bodyFont: 'Amiri' },
  dark:     { emoji: '●',       radius: 14, spacing: 1,   bodyFont: 'Tajawal', bg: '#111111', surface: '#1B1B1B', primary: '#000000' },
  organic:  { emoji: '❁',       radius: 28, spacing: 1.2, bodyFont: 'Tajawal' },
  modern:   { emoji: '◆',       radius: 16, spacing: 1,   bodyFont: 'IBM Plex Sans Arabic' },
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  layout: 'classic',
  personality: null,
  radius: 8,
  spacing: 1,
  heroH: 200,
  cols: 4,
  cardStyle: 'bordered',
  bodyFont: 'IBM Plex Sans Arabic',
  primary: '#1A1208',
  accent: '#B8975A',
  bg: '#F5F0E8',
  surface: '#FFFFFF',
  sections: SECTION_KEYS.map(key => ({ key, visible: true })),
  brandPage: {
    heroStyle: 'compact',
    logoSize: 'medium',
    filters: 'top',
  },
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value)
}

/**
 * Validates an arbitrary (e.g. jsonb-read or client-submitted) value against
 * the DesignTokens shape. Returns an error string, or null if valid.
 * No schema-validation library in this repo (confirmed) — matches the
 * hand-written guard-clause convention used elsewhere in lib/actions/*.
 */
export function validateDesignTokens(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Invalid appearance data.'
  const t = value as Partial<DesignTokens>

  if (!(t.layout && t.layout in LAYOUT_PRESETS)) return 'Invalid layout preset.'
  if (t.personality !== null && t.personality !== undefined && !(t.personality in PERSONALITIES)) return 'Invalid brand personality.'
  if (typeof t.radius !== 'number' || t.radius < 0 || t.radius > 48) return 'Radius must be between 0 and 48.'
  if (typeof t.spacing !== 'number' || t.spacing < 0.5 || t.spacing > 2) return 'Spacing must be between 0.5 and 2.'
  if (typeof t.heroH !== 'number' || t.heroH < 100 || t.heroH > 480) return 'Hero height must be between 100 and 480.'
  if (typeof t.cols !== 'number' || t.cols < 2 || t.cols > 5) return 'Products per row must be between 2 and 5.'
  if (!t.cardStyle || !CARD_STYLES.includes(t.cardStyle)) return 'Invalid card style.'
  if (!t.bodyFont || !BODY_FONTS.includes(t.bodyFont)) return 'Invalid font.'
  if (!isValidHex(t.primary)) return 'Primary color must be a valid hex value.'
  if (!isValidHex(t.accent)) return 'Accent color must be a valid hex value.'
  if (!isValidHex(t.bg)) return 'Background color must be a valid hex value.'
  if (!isValidHex(t.surface)) return 'Surface color must be a valid hex value.'

  if (!Array.isArray(t.sections) || t.sections.length !== SECTION_KEYS.length) return 'Invalid sections list.'
  const seenKeys = new Set<string>()
  for (const s of t.sections) {
    if (!s || typeof s !== 'object') return 'Invalid section entry.'
    if (!SECTION_KEYS.includes(s.key)) return 'Invalid section key.'
    if (typeof s.visible !== 'boolean') return 'Invalid section visibility flag.'
    seenKeys.add(s.key)
  }
  if (seenKeys.size !== SECTION_KEYS.length) return 'Sections list must include each block exactly once.'

  if (!t.brandPage || typeof t.brandPage !== 'object') return 'Invalid brand page settings.'
  if (!HERO_STYLES.includes(t.brandPage.heroStyle)) return 'Invalid hero style.'
  if (!LOGO_SIZES.includes(t.brandPage.logoSize)) return 'Invalid logo size.'
  if (!FILTER_PLACEMENTS.includes(t.brandPage.filters)) return 'Invalid filter placement.'

  return null
}

/**
 * Computes the `--mc-*` CSS custom properties for a brand's stored tokens.
 * Used both by the server-rendered `<style>` block on public storefront
 * pages and (as the same key names) by the preview postMessage payload.
 */
export function tokensToCssVars(tokens: DesignTokens): Record<string, string> {
  return {
    '--mc-radius': `${tokens.radius}px`,
    '--mc-space': `${tokens.spacing}`,
    '--mc-hero-h': `${tokens.heroH}px`,
    '--mc-cols': `${tokens.cols}`,
    '--mc-card-border': tokens.cardStyle === 'bordered' ? '1px solid rgba(0,0,0,0.08)' : 'none',
    '--mc-card-shadow': tokens.cardStyle === 'elevated' ? '0 10px 24px -14px rgba(0,0,0,.35)' : 'none',
    '--mc-font': `'${tokens.bodyFont}', sans-serif`,
    '--mc-primary': tokens.primary,
    '--mc-accent': tokens.accent,
    '--mc-bg': tokens.bg,
    '--mc-surface': tokens.surface,
  }
}

export function cssVarsToStyleString(vars: Record<string, string>): string {
  return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')
}
