-- ============================================================
-- Merchant Club SA — Product Sizes
-- Migration: 011_product_sizes
-- ============================================================
-- Products had no size/variant concept at all — apparel brands had
-- nowhere to declare available sizes, and the storefront had no size
-- picker. This adds a simple, optional size list per product; NULL/empty
-- means no size selector (non-apparel products, or brands that haven't
-- set sizes yet) — fully backward compatible with every existing product.
--
-- Deliberately NOT a per-size stock/variants table: stock stays a single
-- global `stock_quantity` per product. Sizes are selection-only for now;
-- real per-variant inventory is a materially bigger project than "add a
-- size picker" and can be layered on top of this later if needed.

ALTER TABLE products
  ADD COLUMN sizes text[];
