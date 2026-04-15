import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';

export default async function AboutPage() {
  const t = await getTranslations('about');

  const values = [0, 1, 2].map((i) => ({
    title: t(`values.${i}.title`),
    body:  t(`values.${i}.body`),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Hero */}
        <section className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-8">
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-light text-parchment leading-tight">
              {t('heading')}
            </h1>
          </div>
        </section>

        {/* Story */}
        <section className="px-6 md:px-10 py-16 md:py-24 border-b border-border">
          <div className="max-w-3xl mx-auto space-y-8">
            {[
              t('story_1'),
              t('story_2'),
              t('story_3'),
              t('story_4'),
            ].map((paragraph, i) => (
              <p key={i} className="text-base md:text-lg text-muted leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="px-6 md:px-10 py-16 md:py-24 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-6">
              {t('mission_label')}
            </p>
            <p className="font-display text-2xl md:text-4xl font-light text-parchment leading-snug">
              {t('mission_body')}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="px-6 md:px-10 py-16 md:py-24 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-12">
              {t('values_label')}
            </p>
            <div className="space-y-10">
              {values.map((value) => (
                <div key={value.title} className="grid md:grid-cols-3 gap-4 md:gap-10">
                  <p className="text-sm text-parchment font-medium">{value.title}</p>
                  <p className="md:col-span-2 text-sm text-muted leading-relaxed">{value.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact + Apply */}
        <section className="px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-16">

            <div>
              <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-6">
                {t('contact_label')}
              </p>
              <p className="text-sm text-muted leading-relaxed mb-6">
                {t('contact_body')}
              </p>
              <a
                href="mailto:info@merchantclubsa.com"
                className="text-sm text-parchment hover:text-gold transition-colors"
              >
                {t('contact_cta')}
              </a>
            </div>

            <div>
              <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-6">
                {t('apply_label')}
              </p>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
              >
                {t('apply_cta')}
              </Link>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
