import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchLivePartners } from '@/lib/queries/partners';
import { LightPartnerCard } from '@/components/partners/LightPartnerCard';
import { PartnersHero } from '@/components/storefront/PartnersHero';
import { Reveal } from '@/components/ui/Reveal';
import { placeholderSlots } from '@/lib/brands';

type Props = {
  params: Promise<{ locale: string }>;
};

const MIN_GRID_SIZE = 8;

export default async function StorePartnersPage({ params }: Props) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const supabase = createServiceClient();
  const livePartners = await fetchLivePartners(supabase, isAr);

  // Founding-partner slots keep the grid from reading as empty/abandoned
  // when only a handful of brands are live yet — same pattern as /brands.
  const padCount = Math.max(0, MIN_GRID_SIZE - livePartners.length);
  const padding = Array.from({ length: padCount }, (_, i) => ({
    ...placeholderSlots[i % placeholderSlots.length],
    id: `slot-${i}`,
  }));
  const partners = [...livePartners, ...padding];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1">
        <section className="px-4 sm:px-6 md:px-10 pt-8 md:pt-10">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <PartnersHero isAr={isAr} partners={livePartners} />
            </Reveal>
          </div>
        </section>

        <section className="px-6 md:px-10 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            {partners.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {partners.map((partner, i) => (
                  <Reveal key={partner.id} delay={Math.min(i, 7) * 0.05} y={14}>
                    <LightPartnerCard partner={partner} isAr={isAr} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="text-base" style={{ color: '#6B5B4E' }}>
                {isAr ? 'لا توجد علامات متاحة بعد.' : 'No brands available yet.'}
              </p>
            )}
          </div>
        </section>
      </main>
      <StoreFooter />
    </div>
  );
}
