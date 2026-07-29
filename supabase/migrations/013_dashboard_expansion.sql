-- ============================================================
-- Merchant Club SA — Dashboard Expansion (Settings, Reviews, Discounts, Messages, Marketing)
-- Migration: 013_dashboard_expansion
-- ============================================================
-- Backs five new admin dashboard sections. Same convention as
-- customer_favorites (008): RLS enabled and locked to admin-only via
-- is_admin(), all reads/writes go through service-role server actions
-- with application-level authorization — no table here is queried
-- directly by an authenticated client.

-- ── Platform Settings (singleton row) ──────────────────────────
CREATE TABLE platform_settings (
  id                          boolean PRIMARY KEY DEFAULT true CHECK (id),
  site_name                   text NOT NULL DEFAULT 'Merchant Club SA',
  support_email                text NOT NULL DEFAULT 'info@merchantclubsa.com',
  maintenance_mode            boolean NOT NULL DEFAULT false,
  commission_rate_pct         numeric(5,2) NOT NULL DEFAULT 0,
  low_stock_default_threshold integer NOT NULL DEFAULT 5,
  updated_by                  uuid REFERENCES auth.users(id),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id) VALUES (true);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_platform_settings" ON platform_settings FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Reviews (customer product ratings) ─────────────────────────
CREATE TABLE reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id  uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id     uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating       integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON reviews (product_id);
CREATE INDEX idx_reviews_status ON reviews (status);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_reviews" ON reviews FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Discount Codes ──────────────────────────────────────────────
CREATE TABLE discount_codes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  description       text,
  discount_type     text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value             numeric NOT NULL CHECK (value > 0),
  min_order_amount  numeric NOT NULL DEFAULT 0,
  max_uses          integer,
  used_count        integer NOT NULL DEFAULT 0,
  starts_at         timestamptz,
  ends_at           timestamptz,
  active            boolean NOT NULL DEFAULT true,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discount_codes_code ON discount_codes (code);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_discount_codes" ON discount_codes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Messages (simple admin <-> brand inbox, no realtime) ────────
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'brand')),
  sender_id   uuid NOT NULL REFERENCES auth.users(id),
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_brand ON messages (brand_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_messages" ON messages FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Marketing Banners ────────────────────────────────────────────
CREATE TABLE marketing_banners (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  subtitle   text,
  image_url  text,
  link_url   text,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_marketing_banners" ON marketing_banners FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
