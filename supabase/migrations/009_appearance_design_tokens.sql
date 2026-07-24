-- ============================================================
-- Merchant Club SA — Storefront Appearance (Free-Form Theming)
-- Migration: 009_appearance_design_tokens
-- ============================================================
-- Supersedes the constrained model from 005_storefront_customization.sql
-- (fixed 3 templates + fixed 6-color palette, "Etsy-style, not Shopify-
-- style"). Mohammed has since confirmed the opposite direction: brands get
-- full free-form control — arbitrary colors, radius, spacing, typography,
-- layout/personality presets, and homepage section visibility/order.
--
-- `template_id` / `accent_color_id` / `social_links` are left in place
-- (additive-only, no DROP COLUMN) — the dashboard UI simply stops writing
-- to the first two going forward. `theme_palette`'s 6 colors are kept too,
-- repurposed as quick-select swatch suggestions inside the new free-form
-- color pickers rather than the only choice.
--
-- One consolidated jsonb column (not a column per token) — mirrors the
-- existing `social_links jsonb` precedent on this same table, keeps all
-- presentation config as one versionable blob. Shape/validation lives in
-- application code (src/lib/theme-tokens.ts), matching this repo's existing
-- convention of no DB-level jsonb schema validation.
--
-- No new RLS policies needed — `design_tokens` is just another column on
-- `storefronts`, already covered by the table's existing policies
-- (`admin_all_storefronts`, `member_read_own_storefront`,
-- `member_update_own_storefront`, `public_read_live_storefronts` from
-- 001_initial_schema.sql).

ALTER TABLE storefronts
  ADD COLUMN design_tokens jsonb NOT NULL DEFAULT '{
    "layout": "classic",
    "personality": null,
    "radius": 8,
    "spacing": 1,
    "heroH": 200,
    "cols": 4,
    "cardStyle": "bordered",
    "bodyFont": "IBM Plex Sans Arabic",
    "primary": "#1A1208",
    "accent": "#B8975A",
    "bg": "#F5F0E8",
    "surface": "#FFFFFF",
    "sections": [
      { "key": "hero", "visible": true },
      { "key": "collections", "visible": true },
      { "key": "products", "visible": true },
      { "key": "footer", "visible": true }
    ],
    "brandPage": { "heroStyle": "compact", "logoSize": "medium", "filters": "top" }
  }'::jsonb;
