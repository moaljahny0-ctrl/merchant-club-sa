import Image from 'next/image';
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
    <section className="relative min-h-screen flex flex-col md:grid md:grid-cols-[48%_52%]">

      {/* ── Mobile image strip (md:hidden) ──────────────────────── */}
      <div className="md:hidden relative h-[58vw] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Merchant Club SA"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={90}
        />
        {/* Bottom fade into page background */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
      </div>

      {/* ── Text column ─────────────────────────────────────────── */}
      <div className="flex flex-col justify-center px-6 md:px-10 lg:px-16 pt-10 pb-20 md:pt-0 md:pb-0 md:min-h-screen">
        <div className="max-w-xl">

          <p className="text-[9px] text-gold tracking-[0.45em] uppercase mb-8 md:mb-10">
            {t('hero_eyebrow')}
          </p>

          <h1 className="font-display text-[2.75rem] md:text-6xl lg:text-[5.25rem] font-light text-parchment leading-[1.05] tracking-tight">
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
              className="inline-flex items-center justify-center border border-border text-parchment text-[10px] tracking-[0.22em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              {t('hero_secondary_cta')}
            </Link>
          </div>

        </div>
      </div>

      {/* ── Image column (desktop only) ──────────────────────────── */}
      <div className="hidden md:block relative overflow-hidden">
        <Image
          src="/hero.png"
          alt="Merchant Club SA — brand collection"
          fill
          priority
          className="object-cover object-center"
          sizes="52vw"
          quality={92}
        />
        {/* Left-edge gradient — melts into text column */}
        <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-ink to-transparent" />
        {/* Bottom fade for seamless section transition */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
      </div>

    </section>
  );
}

// ─── Partner Showcase ─────────────────────────────────────────────────────────

async function PartnerShowcase({ locale }: { locale: string }) {
  const t = await getTranslations('home');

  const display = activePartners.length > 0
    ? activePartners.slice(0, 4)
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
          <h2 className="font-display text-4xl md:text-6xl font-light text-parchment leading-tight mb-6">
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
