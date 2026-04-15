import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';
import { activeMembers, memberPlaceholderSlots } from '@/lib/members';
import { MemberCard } from '@/components/members/MemberCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MembersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('members');

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Page Header */}
        <section className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <p className="text-[10px] text-gold tracking-[0.35em] uppercase mb-8">
              {t('eyebrow')}
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-light text-parchment mb-4 leading-tight">
              {t('heading')}
            </h1>
            <p className="text-muted text-base max-w-md leading-relaxed">
              {t('subheading')}
            </p>
          </div>
        </section>

        {activeMembers.length === 0 ? (

          // ── Coming soon state ──────────────────────────────────────────────
          <section className="px-6 md:px-10 py-20 md:py-28">
            <div className="max-w-7xl mx-auto">

              <div className="mb-16 max-w-lg">
                <h2 className="font-display text-3xl md:text-4xl font-light text-parchment mb-4">
                  {t('coming_soon_heading')}
                </h2>
                <p className="text-muted text-sm leading-relaxed mb-8">
                  {t('coming_soon_body')}
                </p>
                <Link
                  href="/apply/member"
                  className="inline-flex items-center justify-center bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
                >
                  {t('enquire_cta')}
                </Link>
              </div>

              {/* Placeholder grid — dimmed */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 opacity-30">
                {memberPlaceholderSlots.map((slot) => (
                  <MemberCard key={slot.id} member={slot} locale={locale} />
                ))}
              </div>

            </div>
          </section>

        ) : (

          // ── Live member grid ───────────────────────────────────────────────
          <section className="px-6 md:px-10 py-16 md:py-24">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {activeMembers.map((member) => (
                <MemberCard key={member.id} member={member} locale={locale} />
              ))}
            </div>
          </section>

        )}

      </main>
      <Footer />
    </div>
  );
}
