-- ============================================================
-- Merchant Club SA — Initial Schema
-- Migration: 001_initial_schema
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Roles ───────────────────────────────────────────────────────────────────

CREATE TABLE roles (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES
  ('platform_admin'),
  ('brand_owner'),
  ('brand_staff'),
  ('creator'),
  ('customer');

CREATE TABLE user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ─── Brands ──────────────────────────────────────────────────────────────────

CREATE TABLE brands (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     text UNIQUE NOT NULL,
  name_en                  text NOT NULL,
  name_ar                  text,
  description_en           text,
  description_ar           text,
  tagline_en               text,
  tagline_ar               text,
  logo_url                 text,
  banner_url               text,
  contact_email            text,
  contact_phone            text,
  website_url              text,
  shipping_info_en         text,
  shipping_info_ar         text,
  return_policy_en         text,
  return_policy_ar         text,
  fulfillment_lead_days    integer,
  legal_name               text,
  commercial_reg_number    text,
  vat_number               text,
  status                   text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','active','suspended','rejected')),
  onboarding_state         text NOT NULL DEFAULT 'invited'
                             CHECK (onboarding_state IN (
                               'invited','account_setup','profile_setup',
                               'products_setup','submitted','live'
                             )),
  terms_accepted_at        timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brand_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('brand_owner', 'brand_staff')),
  invited_by  uuid REFERENCES auth.users(id),
  invited_at  timestamptz NOT NULL DEFAULT now(),
  joined_at   timestamptz,
  status      text NOT NULL DEFAULT 'invited'
                CHECK (status IN ('invited', 'active', 'suspended')),
  UNIQUE (brand_id, user_id)
);

CREATE TABLE brand_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name_en     text NOT NULL,
  brand_name_ar     text,
  category          text,
  contact_name      text NOT NULL,
  contact_email     text NOT NULL,
  contact_phone     text,
  instagram_url     text,
  website_url       text,
  brand_description text,
  referral_source   text,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','info_requested')),
  reviewed_by       uuid REFERENCES auth.users(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  brand_id          uuid REFERENCES brands(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── Products ─────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  sku                   text,
  title_en              text NOT NULL,
  title_ar              text NOT NULL DEFAULT '',
  description_en        text NOT NULL DEFAULT '',
  description_ar        text NOT NULL DEFAULT '',
  price                 numeric(10, 2) NOT NULL CHECK (price >= 0),
  sale_price            numeric(10, 2),
  currency              text NOT NULL DEFAULT 'SAR',
  stock_quantity        integer NOT NULL DEFAULT 0,
  low_stock_threshold   integer NOT NULL DEFAULT 5,
  track_inventory       boolean NOT NULL DEFAULT true,
  category              text NOT NULL DEFAULT '',
  tags                  text[],
  status                text NOT NULL DEFAULT 'draft'
                          CHECK (status IN (
                            'draft','submitted','approved','rejected',
                            'live','archived','out_of_stock'
                          )),
  rejection_reason      text,
  rejection_code        text,
  is_featured           boolean NOT NULL DEFAULT false,
  reviewed_by           uuid REFERENCES auth.users(id),
  reviewed_at           timestamptz,
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url           text NOT NULL,
  storage_path  text NOT NULL,
  alt_text_en   text,
  alt_text_ar   text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_primary    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Storefronts ──────────────────────────────────────────────────────────────

CREATE TABLE storefronts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
  status                text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','submitted','approved','live','suspended')),
  is_published          boolean NOT NULL DEFAULT false,
  featured_product_ids  uuid[],
  visibility            text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','hidden')),
  submitted_at          timestamptz,
  approved_at           timestamptz,
  approved_by           uuid REFERENCES auth.users(id),
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── Creators ─────────────────────────────────────────────────────────────────

CREATE TABLE creator_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  link_code       text NOT NULL UNIQUE,
  commission_rate numeric(5, 2) NOT NULL DEFAULT 8.0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, brand_id)
);

-- ─── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL REFERENCES brands(id),
  order_number          text NOT NULL UNIQUE,
  customer_name         text,
  customer_email        text,
  customer_phone        text,
  delivery_address      jsonb,
  items                 jsonb NOT NULL DEFAULT '[]',
  subtotal              numeric(10, 2) NOT NULL,
  platform_commission   numeric(10, 2),
  creator_commission    numeric(10, 2),
  creator_link_id       uuid REFERENCES creator_links(id),
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN (
                            'pending','confirmed','fulfilling','shipped',
                            'delivered','completed','cancelled','refunded'
                          )),
  fulfillment_status    text,
  tracking_number       text,
  brand_notes           text,
  cancellation_reason   text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── Analytics ────────────────────────────────────────────────────────────────

CREATE TABLE analytics_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text NOT NULL CHECK (event_type IN (
                     'storefront_view','product_view','creator_link_click','order_placed'
                   )),
  brand_id         uuid REFERENCES brands(id) ON DELETE SET NULL,
  product_id       uuid REFERENCES products(id) ON DELETE SET NULL,
  creator_link_id  uuid REFERENCES creator_links(id) ON DELETE SET NULL,
  session_id       text,
  ip_hash          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_brand_members_user   ON brand_members(user_id);
CREATE INDEX idx_brand_members_brand  ON brand_members(brand_id);
CREATE INDEX idx_products_brand       ON products(brand_id);
CREATE INDEX idx_products_status      ON products(status);
CREATE INDEX idx_orders_brand         ON orders(brand_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_creator_links_creator ON creator_links(creator_id);
CREATE INDEX idx_creator_links_brand   ON creator_links(brand_id);
CREATE INDEX idx_analytics_brand      ON analytics_events(brand_id);
CREATE INDEX idx_analytics_type       ON analytics_events(event_type);
CREATE INDEX idx_analytics_created    ON analytics_events(created_at DESC);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER storefronts_updated_at
  BEFORE UPDATE ON storefronts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands             ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefronts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events   ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a platform admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'platform_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get brand_ids the current user is an active member of
CREATE OR REPLACE FUNCTION my_brand_ids()
RETURNS SETOF uuid AS $$
  SELECT brand_id FROM brand_members
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── brands ────────────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_brands" ON brands FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_read_own_brand" ON brands FOR SELECT TO authenticated
  USING (id IN (SELECT my_brand_ids()));

CREATE POLICY "member_update_own_brand" ON brands FOR UPDATE TO authenticated
  USING (id IN (SELECT my_brand_ids())) WITH CHECK (id IN (SELECT my_brand_ids()));

-- ── brand_members ─────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_members" ON brand_members FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_read_own_membership" ON brand_members FOR SELECT TO authenticated
  USING (brand_id IN (SELECT my_brand_ids()) OR user_id = auth.uid());

-- ── brand_applications ────────────────────────────────────────────────────────

CREATE POLICY "admin_all_applications" ON brand_applications FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "anon_insert_application" ON brand_applications FOR INSERT TO anon
  WITH CHECK (true);

-- ── products ──────────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_products" ON products FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_crud_own_products" ON products FOR ALL TO authenticated
  USING (brand_id IN (SELECT my_brand_ids())) WITH CHECK (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "public_read_live_products" ON products FOR SELECT TO anon
  USING (status = 'live');

CREATE POLICY "auth_read_live_products" ON products FOR SELECT TO authenticated
  USING (status = 'live');

-- ── product_images ────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_images" ON product_images FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_crud_own_images" ON product_images FOR ALL TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE brand_id IN (SELECT my_brand_ids())
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE brand_id IN (SELECT my_brand_ids())
    )
  );

CREATE POLICY "public_read_images_of_live_products" ON product_images FOR SELECT TO anon
  USING (
    product_id IN (SELECT id FROM products WHERE status = 'live')
  );

-- ── storefronts ───────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_storefronts" ON storefronts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_read_own_storefront" ON storefronts FOR SELECT TO authenticated
  USING (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "member_update_own_storefront" ON storefronts FOR UPDATE TO authenticated
  USING (brand_id IN (SELECT my_brand_ids())) WITH CHECK (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "public_read_live_storefronts" ON storefronts FOR SELECT TO anon
  USING (is_published = true AND visibility = 'public');

-- ── creator_links ─────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_links" ON creator_links FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "creator_read_own_links" ON creator_links FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "brand_read_own_links" ON creator_links FOR SELECT TO authenticated
  USING (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "public_read_active_links" ON creator_links FOR SELECT TO anon
  USING (is_active = true);

-- ── orders ────────────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_orders" ON orders FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "brand_read_own_orders" ON orders FOR SELECT TO authenticated
  USING (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "brand_update_own_orders" ON orders FOR UPDATE TO authenticated
  USING (brand_id IN (SELECT my_brand_ids()))
  WITH CHECK (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "creator_read_attributed_orders" ON orders FOR SELECT TO authenticated
  USING (
    creator_link_id IN (
      SELECT id FROM creator_links WHERE creator_id = auth.uid()
    )
  );

-- ── analytics ─────────────────────────────────────────────────────────────────

CREATE POLICY "admin_read_all_analytics" ON analytics_events FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "brand_read_own_analytics" ON analytics_events FOR SELECT TO authenticated
  USING (brand_id IN (SELECT my_brand_ids()));

CREATE POLICY "creator_read_own_analytics" ON analytics_events FOR SELECT TO authenticated
  USING (
    creator_link_id IN (SELECT id FROM creator_links WHERE creator_id = auth.uid())
  );

CREATE POLICY "insert_analytics" ON analytics_events FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "insert_analytics_auth" ON analytics_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── roles (read-only for all authenticated) ───────────────────────────────────

CREATE POLICY "read_roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_user_roles" ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
