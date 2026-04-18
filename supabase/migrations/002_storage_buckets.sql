-- ============================================================
-- Merchant Club SA — Storage Buckets
-- Migration: 002_storage_buckets
-- ============================================================

-- Product images — public bucket (served via CDN, no auth required to view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
