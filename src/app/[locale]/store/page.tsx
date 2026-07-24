import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchLivePartners } from '@/lib/queries/partners';
import { StoreClient } from './StoreClient';
import type { ProductData } from './StoreClient';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ unavailable?: string; q?: string }>;
};

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function isNewProduct(publishedAt: string | null): boolean {
  return !!publishedAt && Date.now() - new Date(publishedAt).getTime() < NEW_WINDOW_MS;
}

export default async function StorePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const showUnavailable = sp?.unavailable === '1';
  const query = (sp?.q ?? '').trim();
  const isAr = locale === 'ar';
  const supabase = createServiceClient();

  // ── Products ─────────────────────────────────────────────────────────────────

  const { data: productsRaw } = await supabase
    .from('products')
    .select('id, title_en, title_ar, price, sale_price, category, published_at, brand_id, brands(name_en, name_ar, slug, logo_url), product_images(url, is_primary)')
    .eq('status', 'live')
    .order('published_at', { ascending: false });

  const allProducts = ((productsRaw ?? []) as unknown as ProductData[]).map(p => ({
    ...p,
    isNew: isNewProduct(p.published_at),
  }));

  const products = query
    ? allProducts.filter(p => {
        const needle = query.toLowerCase();
        return (
          p.title_en?.toLowerCase().includes(needle) ||
          p.title_ar?.toLowerCase().includes(needle) ||
          p.brands?.name_en?.toLowerCase().includes(needle) ||
          p.brands?.name_ar?.toLowerCase().includes(needle)
        );
      })
    : allProducts;

  // ── Brands ────────────────────────────────────────────────────────────────────

  const partners = await fetchLivePartners(supabase, isAr);

  // ── Categories ────────────────────────────────────────────────────────────────

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('key, name_en, name_ar, image_url')
    .order('sort_order', { ascending: true });

  const categoryPhotos = (categoriesRaw ?? []) as { key: string; name_en: string; name_ar: string; image_url: string | null }[];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      {showUnavailable && (
        <div
          style={{
            background: '#FFF8F0',
            borderBottom: '1px solid #E5DDD0',
            padding: '12px 24px',
            textAlign: 'center',
            fontSize: '16px',
            color: '#6B5B4E',
            fontFamily: 'Georgia, serif',
          }}
        >
          {isAr ? 'هذا المتجر غير متاح حالياً' : 'This store is currently unavailable'}
        </div>
      )}
      <StoreClient
        products={products}
        heroProducts={allProducts.slice(0, 2)}
        partners={partners}
        locale={locale}
        searchQuery={query}
        categoryPhotos={categoryPhotos}
      />
      <StoreFooter />
    </div>
  );
}
