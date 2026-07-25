-- ============================================================
-- Merchant Club SA — Customer Magic-Link Login
-- Migration: 010_customer_login_tokens
-- ============================================================
-- Passwordless login for customers: a separate table from
-- customer_reset_tokens on purpose — a leaked/misused login token only
-- signs someone in with existing account state, while a reset token can
-- change the password outright. Keeping them apart means a bug in one
-- flow can never grant the other flow's capability.

CREATE TABLE customer_login_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_login_tokens_customer ON customer_login_tokens (customer_id);

ALTER TABLE customer_login_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_customer_login_tokens" ON customer_login_tokens FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
