import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { Link } from '@/i18n/navigation';
import { placeholderSlots, type Partner } from '@/lib/brands';
import { createServiceClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('brands');
  const isAr = locale === 'ar';

  const supabase = createServiceClient();

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

  // Only surface brands that have at least one live product
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

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1">
        <PartnersHero t={t} />
        <PartnerCategories locale={locale} />
        {partners.length > 0 ? (
          <ActivePartnersSection partners={partners} locale={locale} t={t} />
        ) : (
          <ComingSoonSection slots={placeholderSlots} locale={locale} t={t} />
        )}
        <ApplySection t={t} />
      </main>
      <Footer />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

type TFn = Awaited<ReturnType<typeof getTranslations<'brands'>>>

async function PartnersHero({ t }: { t: TFn }) {
  return (
    <section className="relative min-h-[80vh] md:min-h-screen overflow-hidden flex items-center">

      {/* Layer 1 — image + color grading */}
      <div
        className="absolute inset-0"
        style={{ filter: 'contrast(1.06) brightness(0.85) saturate(1.08)' }}
      >
        <Image
          src="/partners.png"
          alt="Merchant Club SA — Partners"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={92}
        />
      </div>

      {/* Layer 2 — horizontal gradient */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.62) 42%, rgba(0,0,0,0.22) 100%)',
        }}
      />

      {/* Layer 3 — radial vignette */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at 25% 50%, transparent 22%, rgba(0,0,0,0.42) 100%)',
        }}
      />

      {/* Layer 4 — bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 z-10 bg-gradient-to-t from-ink to-transparent" />

      {/* Layer 5 — inset shadow */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ boxShadow: 'inset 0 -100px 150px rgba(0,0,0,0.45)' }}
      />

      {/* Content */}
      <div className="relative z-20 w-full px-6 md:px-10 lg:px-20 xl:px-28 flex items-center min-h-[80vh] md:min-h-screen">
        <div className="max-w-xl lg:max-w-2xl">

          <p className="text-[9px] text-gold tracking-[0.45em] uppercase mb-8 md:mb-10">
            {t('eyebrow')}
          </p>

          <h1 className="font-display text-[2.75rem] md:text-6xl lg:text-[5.5rem] font-light text-parchment leading-[1.05] tracking-tight">
            {t('heading')}
          </h1>

          <p
            className="mt-5 md:mt-7 text-sm md:text-base font-light max-w-xs md:max-w-sm leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {t('subheading')}
          </p>

          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply/partner"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              {t('apply_cta')}
            </Link>
            <Link
              href="#categories"
              className="inline-flex items-center justify-center border border-parchment/30 text-parchment text-[10px] tracking-[0.22em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              See categories
            </Link>
          </div>

        </div>
      </div>

    </section>
  );
}

// ─── Partner Categories ────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    key: 'fragrance',
    label: 'Fragrance',
    labelAr: 'عطور',
    description: 'Niche and luxury fragrance houses. Oud, oriental, and contemporary scents from independent Saudi perfumers.',
    descriptionAr: 'دور العطور الفاخرة والمستقلة. عطور الشرق والعود والروائح المعاصرة من صانعي العطور السعوديين.',
    detail: 'Oud · Oriental · Niche',
    index: '01',
  },
  {
    key: 'apparel',
    label: 'Apparel',
    labelAr: 'أزياء',
    description: 'Saudi fashion labels and independent designers. Streetwear, modest fashion, and performance wear built locally.',
    descriptionAr: 'العلامات التجارية السعودية ومصممو الأزياء المستقلون. موضة الشارع والأزياء المحتشمة وملابس الأداء.',
    detail: 'Streetwear · Modest · Performance',
    index: '02',
  },
  {
    key: 'home',
    label: 'Home & Living',
    labelAr: 'منزل وديكور',
    description: 'Home goods, artisan crafts, and interior pieces rooted in Saudi design tradition and contemporary craft.',
    descriptionAr: 'مستلزمات المنزل والحرف اليدوية وقطع الديكور المستوحاة من التصميم السعودي التقليدي والمعاصر.',
    detail: 'Decor · Craft · Artisan',
    index: '03',
  },
  {
    key: 'beauty',
    label: 'Beauty',
    labelAr: 'تجميل',
    description: 'Skincare, cosmetics, and personal care brands developed for the Saudi market by independent founders.',
    descriptionAr: 'ماركات العناية بالبشرة ومستحضرات التجميل والعناية الشخصية التي طورها مؤسسون مستقلون للسوق السعودي.',
    detail: 'Skincare · Cosmetics · Wellness',
    index: '04',
  },
] as const;

function PartnerCategories({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  return (
    <section id="categories" className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-12 md:mb-16">
          <div>
            <p className="text-[9px] text-gold tracking-[0.4em] uppercase mb-4">What we carry</p>
            <h2 className="font-display text-3xl md:text-5xl font-light text-parchment leading-tight">
              Product categories
            </h2>
          </div>
          <div className="hidden md:block h-px w-24 bg-border mb-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="bg-ink p-8 md:p-10 flex flex-col gap-6 group hover:bg-surface transition-colors duration-300"
            >
              <div className="flex items-start justify-between">
                <span className="text-[9px] text-gold/60 tracking-[0.3em] uppercase">{cat.index}</span>
                <div className="h-px w-8 bg-gold/30 mt-2 group-hover:w-12 group-hover:bg-gold/60 transition-all duration-300" />
              </div>

              <div>
                <h3 className="font-display text-2xl md:text-3xl font-light text-parchment mb-3 leading-tight">
                  {isAr ? cat.labelAr : cat.label}
                </h3>
                <p className="text-muted text-xs leading-relaxed">
                  {isAr ? cat.descriptionAr : cat.description}
                </p>
              </div>

              <p className="text-[9px] text-gold/50 tracking-[0.2em] uppercase mt-auto">
                {cat.detail}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Coming Soon ───────────────────────────────────────────────────────────────

function ComingSoonSection({
  slots,
  locale,
  t,
}: {
  slots: Partner[]
  locale: string
  t: TFn
}) {
  return (
    <section className="px-6 md:px-10 py-20 md:py-32 border-b border-border">
      <div className="max-w-7xl mx-auto">

        <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24 items-start">

          {/* Text */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-6 bg-gold/40" />
              <p className="text-[9px] text-gold/60 tracking-[0.35em] uppercase">Founding partners</p>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-light text-parchment mb-6 leading-tight">
              {t('coming_soon_heading')}
            </h2>
            <p className="text-muted text-sm leading-relaxed mb-10 max-w-sm">
              {t('coming_soon_body')}
            </p>
            <Link
              href="/apply/partner"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              {t('apply_cta')}
            </Link>
          </div>

          {/* Dimmed placeholder grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-25">
            {slots.map((slot) => (
              <PartnerCard key={slot.id} partner={slot} locale={locale} />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}

// ─── Active Partners Grid ──────────────────────────────────────────────────────

function ActivePartnersSection({
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
            {t('heading')}
          </h2>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase hidden md:block">
            {partners.length} partner{partners.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Apply Section ─────────────────────────────────────────────────────────────

function ApplySection({ t }: { t: TFn }) {
  return (
    <section className="px-6 md:px-10 py-24 md:py-40">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="max-w-2xl">
            <p className="text-[9px] text-gold tracking-[0.4em] uppercase mb-5">Join the platform</p>
            <h2 className="font-display text-4xl md:text-6xl font-light text-parchment leading-tight mb-4">
              Is your brand ready?
            </h2>
            <p className="text-muted text-sm leading-relaxed max-w-sm">
              We review every application. Founding partner spots are limited and given to brands that are genuinely ready.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link
              href="/apply/partner"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-10 py-4 hover:bg-gold-light transition-colors whitespace-nowrap"
            >
              {t('apply_cta')}
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center border border-border text-parchment text-[10px] tracking-[0.22em] uppercase px-10 py-4 hover:border-gold hover:text-gold transition-colors whitespace-nowrap"
            >
              See all options
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
