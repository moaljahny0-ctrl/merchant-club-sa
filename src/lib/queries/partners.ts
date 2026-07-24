import type { createServiceClient } from '@/lib/supabase/server';
import type { Partner } from '@/lib/brands';

type BrandProductRow = {
  status: string;
  published_at: string | null;
  title_en: string;
  title_ar: string | null;
  product_images: { url: string; is_primary: boolean }[];
};

type BrandRow = {
  id: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
  tagline_en: string | null;
  tagline_ar: string | null;
  logo_url: string | null;
  products: BrandProductRow[];
};

type Options = {
  limit?: number;
  newestFirst?: boolean; // orders brands by created_at — not the same as each brand's newest product
  includeWithoutLiveProduct?: boolean; // homepage teaser fills its 4 slots even from brands with nothing live yet
};

/**
 * Live partners (brands with at least one live product), each carrying
 * their true newest product's photo/name — not just the brand logo.
 * Shared by the homepage showcase, /brands, /store's ticker, and
 * /store/partners so "newest" means the same thing everywhere.
 */
export async function fetchLivePartners(
  supabase: ReturnType<typeof createServiceClient>,
  isAr: boolean,
  opts: Options = {}
): Promise<Partner[]> {
  let query = supabase
    .from('brands')
    .select('id, name_en, name_ar, slug, tagline_en, tagline_ar, logo_url, products(status, published_at, title_en, title_ar, product_images(url, is_primary))')
    .in('status', ['approved', 'active'])
    .order('created_at', { ascending: !opts.newestFirst });

  if (opts.limit) query = query.limit(opts.limit);

  const { data: brandsRaw } = await query;
  const brands = (brandsRaw ?? []) as BrandRow[];

  return brands
    .filter(brand => opts.includeWithoutLiveProduct || (brand.products ?? []).some(p => p.status === 'live'))
    .map(brand => {
      const liveProducts = (brand.products ?? [])
        .filter(p => p.status === 'live')
        .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
      const newest = liveProducts[0];
      const newestImage = newest?.product_images?.find(i => i.is_primary) ?? newest?.product_images?.[0];

      return {
        id: brand.id,
        name: brand.name_en,
        nameAr: brand.name_ar ?? brand.name_en,
        category: isAr
          ? (brand.tagline_ar ?? brand.tagline_en ?? '')
          : (brand.tagline_en ?? ''),
        categoryAr: brand.tagline_ar ?? brand.tagline_en ?? '',
        imageUrl: newestImage?.url ?? brand.logo_url ?? undefined,
        logoUrl: brand.logo_url ?? undefined,
        latestProductName: newest ? (isAr && newest.title_ar ? newest.title_ar : newest.title_en) : undefined,
        slug: brand.slug,
      };
    });
}
