import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { Link } from '@/i18n/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import type { Partner } from '@/lib/brands';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function StorePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('store');
  const isAr = locale === 'ar';

  const supabase = createServiceClient();

  // ── Brands ──────────────────────────────────────────────────────────────────

  type ProductImage = { url: string; is_primary: boolean }
  type BrandProduct = { status: string; product_images: ProductImage[] }
  type BrandRow = {
    id: string
    name_en: string
    name_ar: string | null
    slug: string
    tagline_en: string | null
    tagline_ar: string | null
    logo_url: string | null
    products: BrandProduct[]
  }

  const { data: brandsRaw } = await supabase
    .from('brands')
    .select('id, name_en, name_ar, slug, tagline_en, tagline_ar, logo_url, products(status, product_images(url, is_primary))')
    .in('status', ['approved', 'active'])
    .order('created_at', { ascending: true });

  const brands = (brandsRaw ?? []) as BrandRow[];

  const partners: Partner[] = brands
    .filter(brand => (brand.products ?? []).some(p => p.status === 'live'))
    .map(brand => {
      const liveProducts = (brand.products ?? []).filter(p => p.status === 'live');
      const firstProduct = liveProducts[0];
      const primaryImage =
        firstProduct?.product_images?.find(i => i.is_primary) ??
        firstProduct?.product_images?.[0];
      return {
        id: brand.id,
        name: brand.name_en,
        nameAr: brand.name_ar ?? brand.name_en,
        category: isAr ? (brand.tagline_ar ?? brand.tagline_en ?? '') : (brand.tagline_en ?? ''),
        categoryAr: brand.tagline_ar ?? brand.tagline_en ?? '',
        imageUrl: primaryImage?.url ?? brand.logo_url ?? undefined,
        slug: brand.slug,
      };
    });

  // ── Featured Products ────────────────────────────────────────────────────────

  type FeaturedProduct = {
    id: string
    title_en: string
    title_ar: string | null
    price: number
    sale_price: number | null
    brand_id: string
    brands: { name_en: string; name_ar: string | null; slug: string } | null
    product_images: { url: string; is_primary: boolean }[]
  }

  let featuredProducts: FeaturedProduct[] = []
  if (partners.length > 0) {
    const brandIds = partners.map(p => p.id)
    const { data } = await supabase
      .from('products')
      .select('id, title_en, title_ar, price, sale_price, brand_id, brands(name_en, name_ar, slug), product_images(url, is_primary)')
      .eq('status', 'live')
      .in('brand_id', brandIds)
      .order('published_at', { ascending: false })
      .limit(8)
    featuredProducts = (data ?? []) as unknown as FeaturedProduct[]
  }

  // ── Members ─────────────────────────────────────────────────────────────────

  type MemberRow = {
    id: string
    full_name: string | null
    email: string | null
    status: string
  }

  const { data: membersRaw } = await supabase
    .from('members')
    .select('id, full_name, email, status')
    .eq('status', 'approved')
    .order('applied_at', { ascending: true });

  const members = (membersRaw ?? []) as MemberRow[];

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1">
        <StoreHero t={t} />
        {featuredProducts.length > 0 && (
          <FeaturedProductsSection products={featuredProducts} locale={locale} t={t} />
        )}
        <BrandsSection partners={partners} locale={locale} t={t} />
        {members.length > 0 && (
          <MembersSection members={members} t={t} />
        )}
      </main>
      <Footer />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TFn = Awaited<ReturnType<typeof getTranslations<'store'>>>

// ─── Hero ─────────────────────────────────────────────────────────────────────

function StoreHero({ t }: { t: TFn }) {
  return (
    <section className="pt-32 pb-16 px-6 md:px-10 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <p className="text-[9px] text-gold tracking-[0.45em] uppercase mb-6">
          {t('eyebrow')}
        </p>
        <h1 className="font-display text-[2.75rem] md:text-6xl lg:text-[5rem] font-light text-parchment leading-[1.05] tracking-tight mb-5">
          {t('heading')}
        </h1>
        <p
          className="text-sm md:text-base font-light max-w-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {t('subheading')}
        </p>
      </div>
    </section>
  );
}

// ─── Featured Products ─────────────────────────────────────────────────────────

type FeaturedProduct = {
  id: string
  title_en: string
  title_ar: string | null
  price: number
  sale_price: number | null
  brand_id: string
  brands: { name_en: string; name_ar: string | null; slug: string } | null
  product_images: { url: string; is_primary: boolean }[]
}

function FeaturedProductsSection({
  products,
  locale,
  t,
}: {
  products: FeaturedProduct[]
  locale: string
  t: TFn
}) {
  const isAr = locale === 'ar'
  return (
    <section className="px-6 md:px-10 py-16 md:py-24 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-light text-parchment">
            {t('featured_heading')}
          </h2>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase hidden md:block">
            {products.length} {isAr ? 'منتج' : `product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => {
            const brand = product.brands
            const images = product.product_images ?? []
            const primaryImage = images.find(i => i.is_primary) ?? images[0]
            const title = isAr && product.title_ar ? product.title_ar : product.title_en
            const brandName = isAr && brand?.name_ar ? brand.name_ar : (brand?.name_en ?? '')
            const price = Number(product.price)
            const salePrice = product.sale_price ? Number(product.sale_price) : null
            const href = brand?.slug
              ? `/brands/${brand.slug}/products/${product.id}`
              : '#'

            return (
              <Link
                key={product.id}
                href={href}
                className="group flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-px w-8 bg-gold opacity-40" />
                    </div>
                  )}
                </div>
                <div className="pt-3 space-y-1">
                  {brandName && (
                    <p className="text-[9px] text-gold/70 tracking-[0.25em] uppercase"
                       style={{ fontFamily: 'var(--font-body)' }}>
                      {brandName}
                    </p>
                  )}
                  <p className="text-xs text-parchment font-medium leading-snug">{title}</p>
                  <div className="flex items-baseline gap-2">
                    {salePrice ? (
                      <>
                        <span className="text-xs text-gold">SAR {salePrice.toFixed(2)}</span>
                        <span className="text-[10px] text-muted line-through">SAR {price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gold">SAR {price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Brands Section ───────────────────────────────────────────────────────────

function BrandsSection({
  partners,
  locale,
  t,
}: {
  partners: Partner[]
  locale: string
  t: TFn
}) {
  return (
    <section className="px-6 md:px-10 py-16 md:py-24 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-light text-parchment">
            {t('brands_heading')}
          </h2>
          {partners.length > 0 && (
            <p className="text-[9px] text-muted tracking-[0.2em] uppercase hidden md:block">
              {partners.length} {locale === 'ar' ? 'علامة' : `brand${partners.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        {partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">{t('no_brands')}</p>
        )}
      </div>
    </section>
  );
}

// ─── Members Section ──────────────────────────────────────────────────────────

type MemberRow = { id: string; full_name: string | null; email: string | null; status: string }

function getInitials(name: string | null): string {
  if (!name) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'M';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function MembersSection({
  members,
  t,
}: {
  members: MemberRow[]
  t: TFn
}) {
  return (
    <section className="px-6 md:px-10 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-light text-parchment">
            {t('members_heading')}
          </h2>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase hidden md:block">
            {members.length} {members.length !== 1 ? 'members' : 'member'}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col items-center gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-ink text-sm font-medium shrink-0"
                style={{ background: 'var(--color-gold)', fontFamily: 'var(--font-body)' }}
              >
                {getInitials(member.full_name)}
              </div>
              <div className="text-center">
                <p className="text-xs text-parchment font-medium leading-snug">
                  {member.full_name ?? 'Member'}
                </p>
                <p
                  className="text-[9px] text-gold/70 tracking-[0.2em] uppercase mt-0.5"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t('member_label')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
