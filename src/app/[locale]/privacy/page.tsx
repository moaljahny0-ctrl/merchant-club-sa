import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

  const sections = [
    { title: t('sections.collect_title'),      body: t('sections.collect_body') },
    { title: t('sections.purpose_title'),      body: t('sections.purpose_body') },
    { title: t('sections.storage_title'),      body: t('sections.storage_body') },
    { title: t('sections.retention_title'),    body: t('sections.retention_body') },
    { title: t('sections.rights_title'),       body: t('sections.rights_body') },
    { title: t('sections.third_party_title'),  body: t('sections.third_party_body') },
    { title: t('sections.contact_title'),      body: t('sections.contact_body') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-2xl mx-auto px-6 md:px-10 py-20 md:py-28">

          {/* Header */}
          <div className="mb-14">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-8">
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-parchment mb-4">
              {t('heading')}
            </h1>
            <p className="text-xs text-muted tracking-wide">{t('last_updated')}</p>
            <div className="mt-8 h-px w-10 bg-border" />
          </div>

          {/* Intro */}
          <p className="text-sm text-muted leading-relaxed mb-12">
            {t('intro')}
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title} className="border-t border-border pt-10">
                <h2 className="text-xs tracking-[0.2em] uppercase text-parchment mb-4">
                  {section.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
