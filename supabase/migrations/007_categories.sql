-- ============================================================
-- Merchant Club SA — Product Categories
-- Migration: 007_categories
-- ============================================================
-- Categories were free-text strings on products with no entity of their
-- own, so there was nowhere to attach a professional cover photo per
-- category or manage it outside a code deploy. This gives the storefront
-- category browser a real, admin-managed image per category.

CREATE TABLE categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text UNIQUE NOT NULL,   -- matches products.category values
  name_en      text NOT NULL,
  name_ar      text NOT NULL,
  image_url    text,
  storage_path text,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_categories" ON categories FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon
  USING (true);

CREATE POLICY "auth_read_categories" ON categories FOR SELECT TO authenticated
  USING (true);

-- Seed the categories already used by the product form's fixed dropdown
-- (src/components/dashboard/ProductForm.tsx CATEGORIES) — this is the
-- canonical key list; images start empty until an admin uploads one.
INSERT INTO categories (key, name_en, name_ar, sort_order) VALUES
  ('apparel',   'Clothing',  'الملابس',      1),
  ('fragrance', 'Fragrance', 'العطور',       2),
  ('home',      'Home',      'المنزل',       3),
  ('beauty',    'Beauty',    'الجمال',       4),
  ('jewelry',   'Jewelry',   'المجوهرات',    5),
  ('food',      'Food',      'الطعام',       6),
  ('art',       'Arts',      'الفنون',       7),
  ('other',     'Other',     'أخرى',         8)
ON CONFLICT (key) DO NOTHING;
