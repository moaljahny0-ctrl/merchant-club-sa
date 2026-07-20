-- 2.2 Creator Onboarding Flow — self-service link generation
--
-- creator_links currently has no INSERT policy for the 'authenticated' role —
-- only admin_all_links (admin) and public_read_active_links (anon, read-only)
-- exist. The creator-facing "generate my referral link" action in
-- src/lib/actions/creator.ts works around this today by using the
-- service-role client with an explicit assertCreator() check in application
-- code (same pattern already used by the admin actions), so the feature does
-- not depend on this migration being applied.
--
-- This migration adds the correct row-level policy so creator_links is
-- properly self-service at the database layer too, matching how every other
-- "user manages their own row" table in this schema works (e.g.
-- member_crud_own_products on products). Apply this to the live project when
-- convenient — it is additive and does not change existing behavior.

CREATE POLICY "creator_insert_own_links" ON creator_links FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND brand_id IN (SELECT id FROM brands WHERE status IN ('approved', 'active'))
  );
