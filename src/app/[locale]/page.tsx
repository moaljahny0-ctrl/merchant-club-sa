import { Suspense } from 'react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/ui/Reveal';
import { placeholderSlots } from '@/lib/brands';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchLivePartners } from '@/lib/queries/partners';

export const revalidate = 60;

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
        <Suspense fallback={<PartnerShowcaseSkeleton />}>
          <PartnerShowcase locale={locale} />
        </Suspense>
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
          src="/hero.jpg"
          alt="Merchant Club SA"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={80}
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
        <StaggerGroup className="hero-content max-w-xl lg:max-w-2xl rtl:max-w-3xl">

          <StaggerItem y={12}>
            <p className="text-[12px] text-gold tracking-[0.45em] uppercase mb-8 md:mb-10">
              {t('hero_eyebrow')}
            </p>
          </StaggerItem>

          <StaggerItem>
            <h1 className="font-display text-[2.75rem] md:text-6xl lg:text-[5.5rem] font-light text-parchment leading-[1.05] tracking-tight">
              {t('hero_headline')}
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-5 md:mt-7 text-base md:text-base text-muted font-light max-w-xs md:max-w-sm leading-relaxed">
              {t('hero_subline')}
            </p>
          </StaggerItem>

          <StaggerItem className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3">
            <Button href="/apply" variant="primary" className="bg-gold text-ink hover:bg-gold-light">
              {t('hero_cta')}
            </Button>
            <Button href="/brands" variant="secondary" className="border-parchment/30 text-parchment hover:border-gold hover:text-gold">
              {t('hero_secondary_cta')}
            </Button>
          </StaggerItem>

        </StaggerGroup>
      </div>

    </section>
  );
}

// ─── Partner Showcase ─────────────────────────────────────────────────────────

async function PartnerShowcase({ locale }: { locale: string }) {
  const t = await getTranslations('home');
  const isAr = locale === 'ar';

  const supabase = createServiceClient();
  const partners = await fetchLivePartners(supabase, isAr, { limit: 4, newestFirst: true, includeWithoutLiveProduct: true });
  const display = partners.length > 0 ? partners : placeholderSlots;

  return (
    <section className="px-6 md:px-10 py-20 md:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto">

        <Reveal className="flex items-end justify-between mb-10 md:mb-12">
          <h2 className="font-display text-2xl md:text-4xl font-light text-parchment">
            {t('showcase_heading')}
          </h2>
          <Link
            href="/brands"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-muted hover:text-gold transition-colors tracking-[0.15em] uppercase"
          >
            {t('showcase_cta')}
            <span aria-hidden>→</span>
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {display.map((partner, i) => (
            <Reveal key={partner.id} delay={Math.min(i, 3) * 0.08}>
              <PartnerCard partner={partner} locale={locale} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-border" />
            <p className="text-[13px] text-muted tracking-[0.25em] uppercase">
              {t('coming_soon')}
            </p>
          </div>
          <Link
            href="/brands"
            className="sm:hidden text-sm text-muted hover:text-gold transition-colors tracking-[0.15em] uppercase"
          >
            {t('showcase_cta')} →
          </Link>
        </div>

      </div>
    </section>
  );
}

function PartnerShowcaseSkeleton() {
  return (
    <section className="px-6 md:px-10 py-20 md:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 md:mb-12">
          <div className="h-8 md:h-10 w-40 md:w-56 bg-surface animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[3/4] bg-surface animate-pulse" />
              <div className="mt-3 h-4 w-2/3 bg-surface animate-pulse" />
            </div>
          ))}
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
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl lg:text-6xl font-light text-parchment leading-tight mb-6">
            {t('cta_headline')}
          </h2>
          <p className="text-muted text-base mb-10 leading-relaxed max-w-sm">
            {t('cta_sub')}
          </p>
          <Button href="/apply" variant="primary" className="bg-gold text-ink hover:bg-gold-light">
            {t('hero_cta')}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
