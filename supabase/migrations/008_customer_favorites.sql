-- ============================================================
-- Merchant Club SA — Customer Favorites (brand follows + product wishlist)
-- Migration: 008_customer_favorites
-- ============================================================
-- Backs the real "Follow Brand" button and product heart/wishlist icon.
-- Customers authenticate through a custom JWT session (not Supabase Auth),
-- so every read/write here goes through service-role server actions with
-- application-level authorization — same pattern as customers.ts,
-- orders.ts, and cart handling elsewhere in this codebase. RLS is enabled
-- and locked to admin-only for defense in depth; no anon/authenticated
-- policies are needed since the client never queries this table directly.

CREATE TABLE customer_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('brand', 'product')),
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, target_type, target_id)
);

CREATE INDEX idx_customer_favorites_target ON customer_favorites (target_type, target_id);
CREATE INDEX idx_customer_favorites_customer ON customer_favorites (customer_id);

ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_customer_favorites" ON customer_favorites FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
