import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ApplyForm } from '@/components/apply/ApplyForm';

export default async function ApplyPartnerPage() {
  const t = await getTranslations('apply');

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-xl mx-auto px-6 md:px-10 py-20 md:py-28">

          <div className="mb-12 md:mb-16">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-8">
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-light text-parchment leading-tight mb-4">
              {t('heading')}
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              {t('subheading')}
            </p>
            <div className="mt-8 h-px w-10 bg-border" />
          </div>

          <ApplyForm />

        </div>
      </main>
      <Footer />
    </div>
  );
}
