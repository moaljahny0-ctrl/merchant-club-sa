import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { createServiceClient } from '@/lib/supabase/server';
import { StoreClient } from './StoreClient';
import type { ProductData } from './StoreClient';
import type { Partner } from '@/lib/brands';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ unavailable?: string }>;
};

export default async function StorePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const showUnavailable = sp?.unavailable === '1';
  const isAr = locale === 'ar';
  const supabase = createServiceClient();

  // ── Products ─────────────────────────────────────────────────────────────────

  const { data: productsRaw } = await supabase
    .from('products')
    .select('id, title_en, title_ar, price, sale_price, category, published_at, brand_id, brands(name_en, name_ar, slug), product_images(url, is_primary)')
    .eq('status', 'live')
    .order('published_at', { ascending: false });

  const products = (productsRaw ?? []) as unknown as ProductData[];

  // ── Brands ────────────────────────────────────────────────────────────────────

  type BrandRow = {
    id: string;
    name_en: string;
    name_ar: string | null;
    slug: string;
    tagline_en: string | null;
    tagline_ar: string | null;
    logo_url: string | null;
    products: { status: string }[];
  };

  const { data: brandsRaw } = await supabase
    .from('brands')
    .select('id, name_en, name_ar, slug, tagline_en, tagline_ar, logo_url, products(status)')
    .in('status', ['approved', 'active'])
    .order('created_at', { ascending: true });

  const brands = (brandsRaw ?? []) as BrandRow[];

  const partners: Partner[] = brands
    .filter(brand => (brand.products ?? []).some(p => p.status === 'live'))
    .map(brand => ({
      id: brand.id,
      name: brand.name_en,
      nameAr: brand.name_ar ?? brand.name_en,
      category: isAr
        ? (brand.tagline_ar ?? brand.tagline_en ?? '')
        : (brand.tagline_en ?? ''),
      categoryAr: brand.tagline_ar ?? brand.tagline_en ?? '',
      imageUrl: brand.logo_url ?? undefined,
      slug: brand.slug,
    }));

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
            fontSize: '13px',
            color: '#6B5B4E',
            fontFamily: 'Georgia, serif',
          }}
        >
          {isAr ? 'هذا المتجر غير متاح حالياً' : 'This store is currently unavailable'}
        </div>
      )}
      <StoreClient
        products={products}
        heroProducts={products.slice(0, 2)}
        partners={partners}
        locale={locale}
      />
      <Footer />
    </div>
  );
}
