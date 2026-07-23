-- Phase 3.1 — Payment Integration (Moyasar, test mode)
--
-- Payment is modeled as its own aggregate, separate from `orders`, because a
-- single checkout can span multiple brands (placeOrder groups cart items by
-- brand_id and inserts one `orders` row per brand) but the customer is only
-- charged ONCE. `orders.payment_id` points every order row spawned by the
-- same checkout back to the one payment that covers all of them.
--
-- Orders are NOT materialized until payment is confirmed `paid` — the
-- `cart_snapshot` column holds everything needed to create the order rows
-- (validated cart items, customer info) so nothing is lost across the 3DS
-- redirect round-trip to Moyasar and back. This also means the existing
-- stock-decrement-on-insert behavior only ever fires for orders that were
-- actually paid for, not every checkout attempt.
--
-- Test mode only: uses MOYASAR_SECRET_KEY / NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY
-- (sk_test_ / pk_test_) which Moyasar issues immediately on signup, no
-- merchant approval required. Swapping to sk_live_/pk_live_ once the real
-- merchant account is approved (1B.5) is an env var change only — no code
-- change needed.

CREATE TABLE payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moyasar_payment_id   text UNIQUE,
  status               text NOT NULL DEFAULT 'initiated'
                         CHECK (status IN ('initiated', 'paid', 'failed', 'refunded', 'voided')),
  amount               numeric(10, 2) NOT NULL,
  currency             text NOT NULL DEFAULT 'SAR',
  source_type          text,
  card_brand           text,
  card_last4           text,
  transaction_url       text,
  failure_message      text,
  cart_snapshot        jsonb NOT NULL,
  orders_materialized_at timestamptz,
  live                 boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_moyasar_id ON payments(moyasar_payment_id);
CREATE INDEX idx_payments_status     ON payments(status);

ALTER TABLE orders
  ADD COLUMN payment_id uuid REFERENCES payments(id);

CREATE INDEX idx_orders_payment ON orders(payment_id);

-- ── Row Level Security ──────────────────────────────────────────────────────────
-- Payment records are financial data — no anon/public access at all. All
-- reads/writes from application code go through the service-role client
-- (checkout server actions, the Moyasar callback route, the webhook route),
-- which bypasses RLS entirely, matching the existing pattern for admin/server
-- operations in this codebase. The only client-facing role granted anything
-- here is admin, for the future finance/payouts view.

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_payments" ON payments FOR SELECT TO authenticated
  USING (is_admin());
