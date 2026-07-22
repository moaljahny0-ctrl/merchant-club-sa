-- R.1 — RBAC & Admin Governance foundation
--
-- Adds granular permissions on top of the existing flat platform_admin/creator
-- role model. Fixed role presets confirmed by Mohammed 2026-07-21 (no custom
-- role builder for v1): platform_admin (Super Admin, unrestricted), plus 7 new
-- admin sub-roles — merchant_success, customer_support, operations, finance,
-- marketing, content_management, technical_support.
--
-- NOT YET APPLIED to the live project as of this commit — no Supabase CLI auth
-- token or direct DB connection string was available in this environment to run
-- it (PostgREST/service-role key can do CRUD but not DDL). Apply via the
-- Supabase Dashboard SQL Editor or `supabase db push` once linked. Application
-- code in src/lib/actions/_admin-utils.ts (hasPermission) is written to detect
-- whether these tables exist and falls back to the legacy platform_admin-only
-- check until this migration is applied — nothing breaks either way, and
-- granular permissions activate automatically the moment this runs.

-- ─── New role presets ───────────────────────────────────────────────────────

INSERT INTO roles (name) VALUES
  ('merchant_success'),
  ('customer_support'),
  ('operations'),
  ('finance'),
  ('marketing'),
  ('content_management'),
  ('technical_support')
ON CONFLICT (name) DO NOTHING;

-- ─── Permissions ─────────────────────────────────────────────────────────────

CREATE TABLE permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability  text NOT NULL UNIQUE,
  description text
);

INSERT INTO permissions (capability, description) VALUES
  ('brands.approve_suspend',       'Approve, reject, or suspend brand applications and accounts'),
  ('products.approve_reject',      'Approve or reject submitted products'),
  ('orders.view_manage',           'View and manage platform-wide orders'),
  ('customers.support',            'Look up and assist customer accounts'),
  ('creators.campaign_management', 'Manage creator/campaign program'),
  ('finance.payouts',              'View financial data and payout information'),
  ('cms.content',                  'Edit CMS and site positioning/content'),
  ('platform.settings',            'Change platform-wide configuration and feature flags'),
  ('admin.manage_roles',           'Create and assign admin roles'),
  ('audit.logs',                   'View audit logs');

-- ─── Role → Permission mapping ───────────────────────────────────────────────

CREATE TABLE role_permissions (
  role_id       uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Super Admin (platform_admin) gets every permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'platform_admin'
ON CONFLICT DO NOTHING;

-- Merchant Success: brand + product approval.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'merchant_success' AND p.capability IN ('brands.approve_suspend', 'products.approve_reject')
ON CONFLICT DO NOTHING;

-- Customer Support: order visibility + customer account help.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'customer_support' AND p.capability IN ('customers.support', 'orders.view_manage')
ON CONFLICT DO NOTHING;

-- Operations: order management.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'operations' AND p.capability IN ('orders.view_manage')
ON CONFLICT DO NOTHING;

-- Finance: payouts + order visibility.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'finance' AND p.capability IN ('finance.payouts', 'orders.view_manage')
ON CONFLICT DO NOTHING;

-- Marketing: creator/campaign management.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'marketing' AND p.capability IN ('creators.campaign_management')
ON CONFLICT DO NOTHING;

-- Content Management: CMS/content.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'content_management' AND p.capability IN ('cms.content')
ON CONFLICT DO NOTHING;

-- Technical Support: audit logs (read).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'technical_support' AND p.capability IN ('audit.logs')
ON CONFLICT DO NOTHING;

-- NOTE: matrix distinguishes "view only" vs "manage" for orders.view_manage on
-- Customer Support and Finance — this v1 pass ships a single boolean
-- capability. Read/write split is a follow-up refinement, not blocking R.1.

-- ─── Audit log ────────────────────────────────────────────────────────────────

CREATE TABLE admin_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES auth.users(id),
  action      text NOT NULL,
  target_type text NOT NULL,
  target_id   uuid,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- No anon/authenticated policies on any of these — permission mappings and the
-- audit log must never be exposed via the public REST API. Server-side code
-- reads/writes them exclusively through the service-role client, which bypasses
-- RLS entirely, so enabling it here with zero policies is a pure lockdown with
-- no effect on the app itself.
ALTER TABLE permissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log   ENABLE ROW LEVEL SECURITY;
