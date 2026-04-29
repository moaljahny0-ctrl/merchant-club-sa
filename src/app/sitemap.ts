import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.merchantclubsa.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase
      .from('brands')
      .select('slug, updated_at')
      .in('status', ['approved', 'active']),
    supabase
      .from('products')
      .select('id, updated_at, brands(slug)')
      .eq('status', 'live'),
  ])

  const brandEntries: MetadataRoute.Sitemap = []
  for (const brand of brands ?? []) {
    const mod = brand.updated_at ? new Date(brand.updated_at) : new Date()
    brandEntries.push(
      { url: `${BASE_URL}/brands/${brand.slug}`,    lastModified: mod, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${BASE_URL}/ar/brands/${brand.slug}`, lastModified: mod, changeFrequency: 'weekly', priority: 0.9 },
    )
  }

  const productEntries: MetadataRoute.Sitemap = []
  for (const product of products ?? []) {
    const brandSlug = (product.brands as unknown as { slug: string } | null)?.slug
    if (!brandSlug) continue
    const mod = product.updated_at ? new Date(product.updated_at) : new Date()
    productEntries.push(
      { url: `${BASE_URL}/brands/${brandSlug}/products/${product.id}`,    lastModified: mod, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${BASE_URL}/ar/brands/${brandSlug}/products/${product.id}`, lastModified: mod, changeFrequency: 'weekly', priority: 0.8 },
    )
  }

  return [
    { url: `${BASE_URL}/`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/brands`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/members`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/apply`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/apply/partner`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/apply/member`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/ar`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/ar/brands`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/ar/members`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/ar/apply`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/ar/apply/partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/ar/apply/member`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/ar/about`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/ar/privacy`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...brandEntries,
    ...productEntries,
  ]
}
