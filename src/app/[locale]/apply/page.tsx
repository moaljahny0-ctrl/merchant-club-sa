import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Reveal } from '@/components/ui/Reveal';
import { DoorCard } from './DoorCard';

export default async function ApplyGatewayPage() {
  const t = await getTranslations('apply_gateway');

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col">

        {/* Header */}
        <section className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
          <Reveal className="max-w-7xl mx-auto">
            <p className="text-[13px] text-gold tracking-[0.35em] uppercase mb-8">
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-light text-parchment leading-tight mb-4">
              {t('heading')}
            </h1>
            <p className="text-muted text-base max-w-xs leading-relaxed">
              {t('subheading')}
            </p>
          </Reveal>
        </section>

        {/* Two doors */}
        <section className="flex-1 px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-px bg-border">

            <Reveal delay={0}>
              <DoorCard
                href="/apply/partner"
                index="01"
                title={t('partner_title')}
                body={t('partner_body')}
                cta={t('partner_cta')}
                emphasis="primary"
              />
            </Reveal>

            <Reveal delay={0.08}>
              <DoorCard
                href="/apply/member"
                index="02"
                title={t('member_title')}
                body={t('member_body')}
                cta={t('member_cta')}
                emphasis="secondary"
              />
            </Reveal>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
