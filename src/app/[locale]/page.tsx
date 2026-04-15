import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { Link } from '@/i18n/navigation';
import { activePartners, placeholderSlots } from '@/lib/brands';

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
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-10 pt-16">
      <div className="max-w-7xl mx-auto w-full py-24 md:py-40">

        <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-10">
          {t('hero_eyebrow')}
        </p>

        <h1 className="font-display text-5xl md:text-7xl lg:text-[88px] font-light text-parchment leading-[1.04] tracking-tight max-w-3xl">
          {t('hero_headline')}
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted font-light max-w-sm leading-relaxed">
          {t('hero_subline')}
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
          >
            {t('hero_cta')}
          </Link>
          <Link
            href="/brands"
            className="inline-flex items-center justify-center border border-border text-parchment text-xs tracking-[0.2em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
          >
            {t('hero_secondary_cta')}
          </Link>
        </div>

        <div className="mt-24 md:mt-40 h-px bg-border max-w-xs" />
      </div>
    </section>
  );
}

// ─── Partner Showcase ─────────────────────────────────────────────────────────

async function PartnerShowcase({ locale }: { locale: string }) {
  const t = await getTranslations('home');

  // Show real partners when available, placeholder slots otherwise
  const display = activePartners.length > 0
    ? activePartners.slice(0, 4)
    : placeholderSlots;

  return (
    <section className="px-6 md:px-10 py-20 md:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto">

        {/* Header row — heading left, CTA right */}
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

        {/* Image grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {display.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} locale={locale} />
          ))}
        </div>

        {/* Mobile CTA + coming soon note */}
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
          <h2 className="font-display text-4xl md:text-6xl font-light text-parchment leading-tight mb-6">
            {t('cta_headline')}
          </h2>
          <p className="text-muted text-sm mb-10 leading-relaxed max-w-sm">
            {t('cta_sub')}
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-10 py-4 hover:bg-gold-light transition-colors"
          >
            {t('hero_cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
