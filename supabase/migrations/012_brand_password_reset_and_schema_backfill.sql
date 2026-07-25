-- ============================================================
-- Merchant Club SA — Brand Password Reset (+ Schema Backfill)
-- Migration: 012_brand_password_reset_and_schema_backfill
-- ============================================================
-- Brand/admin/creator password reset was the only auth email in this app
-- still sent by Supabase Auth's own built-in mailer
-- (supabase.auth.resetPasswordForEmail) — unbranded sending domain, and
-- tied to a PKCE code-exchange that fails if the reset link is opened in
-- a different browser/device than the one that requested it. Every other
-- auth email (brand invite, customer reset, customer magic-link) already
-- uses a custom token table + a Resend-branded email instead. This gives
-- brand/admin/creator accounts the same treatment — same shape as
-- customer_reset_tokens/customer_login_tokens, still Supabase Auth
-- identities under the hood, just no Supabase-mailer or PKCE dependency
-- for the reset step itself.
--
-- Also: customer_reset_tokens has been a live table (and used in app
-- code) with no migration file ever committed for it — schema drift
-- between this repo and production. Backfilling it here with
-- IF NOT EXISTS so this migration is safe to run regardless, and the
-- migrations folder stops lying about what's actually live.

-- ── Brand/admin/creator password reset tokens ──────────────────────────────────

CREATE TABLE IF NOT EXISTS brand_password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_password_reset_tokens_user ON brand_password_reset_tokens (user_id);

ALTER TABLE brand_password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_brand_password_reset_tokens" ON brand_password_reset_tokens;
CREATE POLICY "admin_all_brand_password_reset_tokens" ON brand_password_reset_tokens FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Backfill: customer_reset_tokens (already live, migration never committed) ──

CREATE TABLE IF NOT EXISTS customer_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_reset_tokens_customer ON customer_reset_tokens (customer_id);

ALTER TABLE customer_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_customer_reset_tokens" ON customer_reset_tokens;
CREATE POLICY "admin_all_customer_reset_tokens" ON customer_reset_tokens FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
