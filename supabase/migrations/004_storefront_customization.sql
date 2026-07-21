-- R.2 — Merchant Storefront Customization (Etsy-style constrained model)
--
-- Fixed template choice + fixed accent-color palette + collections + social
-- links. Deliberately NOT free-form theming (no color picker, no arbitrary
-- CSS) — matches Mohammed's confirmed direction over Shopify-style freedom.
--
-- template_id / accent_color_id / social_links are added to `storefronts`,
-- not `brands` — this is presentation config, the same home as the existing
-- featured_product_ids column, not brand identity.
--
-- NOT YET APPLIED to the live project as of 2026-07-21 — no DB execution
-- path was available this session (no Supabase CLI project link, no direct
-- DB password, no exec_sql-style RPC exposed). Apply via the Supabase
-- Dashboard SQL Editor. Additive only; safe to run once, matches the
-- "apply when convenient" pattern already used by 003_creator_self_service_links.sql.

-- ── Theme palette (fixed, not user-editable) ───────────────────────────────────

CREATE TABLE theme_palette (
  id          text PRIMARY KEY,
  name_en     text NOT NULL,
  name_ar     text NOT NULL,
  accent_hex  text NOT NULL,
  position    int NOT NULL DEFAULT 0
);

-- ── Collections ─────────────────────────────────────────────────────────────────

CREATE TABLE collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name_en     text NOT NULL,
  name_ar     text,
  position    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collection_products (
  collection_id  uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position       int NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- ── Storefront customization columns ───────────────────────────────────────────

ALTER TABLE storefronts
  ADD COLUMN template_id text NOT NULL DEFAULT 'classic'
    CHECK (template_id IN ('classic', 'editorial', 'grid')),
  ADD COLUMN accent_color_id text NOT NULL DEFAULT 'gold'
    REFERENCES theme_palette(id),
  ADD COLUMN social_links jsonb NOT NULL DEFAULT '{}';

-- ── Row Level Security ──────────────────────────────────────────────────────────

ALTER TABLE theme_palette      ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- ── theme_palette ────────────────────────────────────────────────────────────────

CREATE POLICY "public_read_palette" ON theme_palette FOR SELECT TO anon, authenticated
  USING (true);

-- ── collections ──────────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_collections" ON collections FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_crud_own_collections" ON collections FOR ALL TO authenticated
  USING (brand_id IN (SELECT my_brand_ids())) WITH CHECK (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "public_read_collections_of_live_brands" ON collections FOR SELECT TO anon
  USING (brand_id IN (SELECT id FROM brands WHERE status IN ('approved', 'active')));

-- ── collection_products ──────────────────────────────────────────────────────────

CREATE POLICY "admin_all_collection_products" ON collection_products FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_crud_own_collection_products" ON collection_products FOR ALL TO authenticated
  USING (
    collection_id IN (SELECT id FROM collections WHERE brand_id IN (SELECT my_brand_ids()))
  )
  WITH CHECK (
    collection_id IN (SELECT id FROM collections WHERE brand_id IN (SELECT my_brand_ids()))
  );

CREATE POLICY "public_read_collection_products_of_live_brands" ON collection_products FOR SELECT TO anon
  USING (
    collection_id IN (
      SELECT c.id FROM collections c JOIN brands b ON b.id = c.brand_id
      WHERE b.status IN ('approved', 'active')
    )
  );

-- ── Seed data ────────────────────────────────────────────────────────────────────

INSERT INTO theme_palette (id, name_en, name_ar, accent_hex, position) VALUES
  ('gold',       'Gold',       'ذهبي',        '#B8975A', 0),
  ('burgundy',   'Burgundy',   'عنابي',       '#7A2E3A', 1),
  ('forest',     'Forest',     'أخضر غابي',   '#3C5A45', 2),
  ('navy',       'Navy',       'كحلي',        '#28344E', 3),
  ('terracotta', 'Terracotta', 'فخاري',       '#B5613F', 4),
  ('charcoal',   'Charcoal',   'رمادي غامق',  '#2B2B2B', 5);
