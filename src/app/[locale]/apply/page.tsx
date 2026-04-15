import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';

export default async function ApplyGatewayPage() {
  const t = await getTranslations('apply_gateway');

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col">

        {/* Header */}
        <section className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-8">
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-light text-parchment leading-tight mb-4">
              {t('heading')}
            </h1>
            <p className="text-muted text-base max-w-xs leading-relaxed">
              {t('subheading')}
            </p>
          </div>
        </section>

        {/* Two doors */}
        <section className="flex-1 px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-px bg-border">

            {/* Partner door */}
            <div className="bg-ink p-10 md:p-16 flex flex-col">
              <div className="flex-1">
                <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-6">
                  01
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-light text-parchment mb-5 leading-snug">
                  {t('partner_title')}
                </h2>
                <p className="text-muted text-sm leading-relaxed max-w-sm">
                  {t('partner_body')}
                </p>
              </div>
              <div className="mt-12">
                <Link
                  href="/apply/partner"
                  className="inline-flex items-center justify-center bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
                >
                  {t('partner_cta')}
                </Link>
              </div>
            </div>

            {/* Member door */}
            <div className="bg-surface p-10 md:p-16 flex flex-col">
              <div className="flex-1">
                <p className="text-[10px] text-gold tracking-[0.3em] uppercase mb-6">
                  02
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-light text-parchment mb-5 leading-snug">
                  {t('member_title')}
                </h2>
                <p className="text-muted text-sm leading-relaxed max-w-sm">
                  {t('member_body')}
                </p>
              </div>
              <div className="mt-12">
                <Link
                  href="/apply/member"
                  className="inline-flex items-center justify-center border border-border text-parchment text-xs tracking-[0.2em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
                >
                  {t('member_cta')}
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
