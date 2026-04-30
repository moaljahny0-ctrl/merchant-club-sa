import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerCard } from '@/components/partners/PartnerCard';
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
        <BrandsSection partners={partners} locale={locale} t={t} />
        <MembersSection members={members} t={t} />
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
    <section className="pt-32 pb-20 px-6 md:px-10 border-b border-border">
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
          {members.length > 0 && (
            <p className="text-[9px] text-muted tracking-[0.2em] uppercase hidden md:block">
              {members.length} {members.length !== 1 ? 'members' : 'member'}
            </p>
          )}
        </div>
        {members.length > 0 ? (
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
                    Member
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">{t('no_members')}</p>
        )}
      </div>
    </section>
  );
}
