import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { Link } from '@/i18n/navigation';
import { placeholderSlots } from '@/lib/brands';
import { createServiceClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PartnerShowcase locale={locale} />
        <ApplyCTA />
      </main>
      <Footer />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

async function Hero() {
  const t = await getTranslations('home');
  return (
    <section className="relative min-h-[80vh] md:min-h-screen overflow-hidden flex items-center">

      {/* ── Layer 1: Image + color grading (isolated — filter does not affect text) ── */}
      <div
        className="absolute inset-0"
        style={{ filter: 'contrast(1.05) brightness(0.95) saturate(1.1)' }}
      >
        <Image
          src="/hero.png"
          alt="Merchant Club SA"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={92}
        />
      </div>

      {/* ── Layer 2: Directional gradient — left dark, right open ── */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.52) 45%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* ── Layer 3: Radial vignette — edge depth + focus ── */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at 28% 50%, transparent 30%, rgba(0,0,0,0.32) 100%)',
        }}
      />

      {/* ── Layer 4: Bottom section fade into ink ── */}
      <div className="absolute inset-x-0 bottom-0 h-44 z-10 bg-gradient-to-t from-ink to-transparent" />

      {/* ── Layer 5: Inset bottom shadow — depth ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ boxShadow: 'inset 0 -100px 150px rgba(0,0,0,0.40)' }}
      />

      {/* ── Content — above all overlays ── */}
      <div className="relative z-20 w-full px-6 md:px-10 lg:px-20 xl:px-28 rtl:md:px-12 rtl:lg:px-24 rtl:xl:px-32 flex items-center min-h-[80vh] md:min-h-screen">
        <div className="hero-content max-w-xl lg:max-w-2xl rtl:max-w-3xl">

          <p className="text-[9px] text-gold tracking-[0.45em] uppercase mb-8 md:mb-10">
            {t('hero_eyebrow')}
          </p>

          <h1 className="font-display text-[2.75rem] md:text-6xl lg:text-[5.5rem] font-light text-parchment leading-[1.05] tracking-tight">
            {t('hero_headline')}
          </h1>

          <p className="mt-5 md:mt-7 text-sm md:text-base text-muted font-light max-w-xs md:max-w-sm leading-relaxed">
            {t('hero_subline')}
          </p>

          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              {t('hero_cta')}
            </Link>
            <Link
              href="/brands"
              className="inline-flex items-center justify-center border border-parchment/30 text-parchment text-[10px] tracking-[0.22em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              {t('hero_secondary_cta')}
            </Link>
          </div>

        </div>
      </div>

    </section>
  );
}

// ─── Partner Showcase ─────────────────────────────────────────────────────────

async function PartnerShowcase({ locale }: { locale: string }) {
  const t = await getTranslations('home');
  const isAr = locale === 'ar';

  type ProductImage = { url: string; is_primary: boolean }
  type Product = { status: string; product_images: ProductImage[] }
  type BrandRow = {
    id: string
    name_en: string
    name_ar: string | null
    slug: string
    tagline_en: string | null
    tagline_ar: string | null
    products: Product[]
  }

  const supabase = createServiceClient();
  const { data: brandsRaw } = await supabase
    .from('brands')
    .select('id, name_en, name_ar, slug, tagline_en, tagline_ar, products(status, product_images(url, is_primary))')
    .in('status', ['approved', 'active'])
    .order('created_at', { ascending: false })
    .limit(8);

  const brands = (brandsRaw ?? []) as BrandRow[];

  const display = brands.length > 0
    ? brands.slice(0, 4).map(brand => {
        const liveProducts = (brand.products ?? []).filter(p => p.status === 'live');
        const firstProduct = liveProducts[0];
        const primaryImage =
          firstProduct?.product_images?.find(i => i.is_primary) ??
          firstProduct?.product_images?.[0];
        return {
          id: brand.id,
          name: brand.name_en,
          nameAr: brand.name_ar ?? brand.name_en,
          category: (!isAr && brand.tagline_en) ? brand.tagline_en : (isAr && brand.tagline_ar ? brand.tagline_ar : ''),
          categoryAr: brand.tagline_ar ?? brand.tagline_en ?? '',
          imageUrl: primaryImage?.url,
          slug: brand.slug,
        };
      })
    : placeholderSlots;

  return (
    <section className="px-6 md:px-10 py-20 md:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-10 md:mb-12">
          <h2 className="font-display text-2xl md:text-4xl font-light text-parchment">
            {t('showcase_heading')}
          </h2>
          <Link
            href="/brands"
            className="hidden sm:inline-flex items-center gap-2 text-xs text-muted hover:text-gold transition-colors tracking-[0.15em] uppercase"
          >
            {t('showcase_cta')}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {display.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} locale={locale} />
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-border" />
            <p className="text-[10px] text-muted tracking-[0.25em] uppercase">
              {t('coming_soon')}
            </p>
          </div>
          <Link
            href="/brands"
            className="sm:hidden text-xs text-muted hover:text-gold transition-colors tracking-[0.15em] uppercase"
          >
            {t('showcase_cta')} →
          </Link>
        </div>

      </div>
    </section>
  );
}

// ─── Apply CTA ────────────────────────────────────────────────────────────────

async function ApplyCTA() {
  const t = await getTranslations('home');
  return (
    <section className="px-6 md:px-10 py-24 md:py-40 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl lg:text-6xl font-light text-parchment leading-tight mb-6">
            {t('cta_headline')}
          </h2>
          <p className="text-muted text-sm mb-10 leading-relaxed max-w-sm">
            {t('cta_sub')}
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-10 py-4 hover:bg-gold-light transition-colors"
          >
            {t('hero_cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
