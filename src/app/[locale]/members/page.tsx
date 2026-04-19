import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';
import { activeMembers, type Member } from '@/lib/members';
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
      <main className="flex-1">
        <MembersHero t={t} />
        <MembershipTypes locale={locale} />
        {activeMembers.length > 0 ? (
          <ActiveMembersSection members={activeMembers} locale={locale} t={t} />
        ) : (
          <ComingSoonSection t={t} />
        )}
      </main>
      <Footer />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

type TFn = Awaited<ReturnType<typeof getTranslations<'members'>>>

async function MembersHero({ t }: { t: TFn }) {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">

      {/* Layer 1 — image + color grading */}
      <div
        className="absolute inset-0"
        style={{ filter: 'contrast(1.05) brightness(0.88) saturate(1.08)' }}
      >
        <Image
          src="/members.png"
          alt="Merchant Club SA — Members"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={92}
        />
      </div>

      {/* Layer 2 — horizontal gradient (left dark, right open) */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.60) 40%, rgba(0,0,0,0.20) 100%)',
        }}
      />

      {/* Layer 3 — radial vignette */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at 28% 50%, transparent 25%, rgba(0,0,0,0.38) 100%)',
        }}
      />

      {/* Layer 4 — bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 z-10 bg-gradient-to-t from-ink to-transparent" />

      {/* Layer 5 — inset shadow */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ boxShadow: 'inset 0 -100px 150px rgba(0,0,0,0.45)' }}
      />

      {/* Content */}
      <div className="relative z-20 w-full px-6 md:px-10 lg:px-20 xl:px-28 flex items-center min-h-screen">
        <div className="max-w-xl lg:max-w-2xl">

          <p className="text-[9px] text-gold tracking-[0.45em] uppercase mb-8 md:mb-10">
            {t('eyebrow')}
          </p>

          <h1 className="font-display text-[2.75rem] md:text-6xl lg:text-[5.5rem] font-light text-parchment leading-[1.05] tracking-tight">
            {t('heading')}
          </h1>

          <p className="mt-5 md:mt-7 text-sm md:text-base font-light max-w-xs md:max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {t('subheading')}
          </p>

          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply/member"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              {t('enquire_cta')}
            </Link>
            <Link
              href="#membership"
              className="inline-flex items-center justify-center border border-parchment/30 text-parchment text-[10px] tracking-[0.22em] uppercase px-8 py-4 hover:border-gold hover:text-gold transition-colors"
            >
              Learn more
            </Link>
          </div>

        </div>
      </div>

    </section>
  );
}

// ─── Membership Types ──────────────────────────────────────────────────────────

const MEMBER_TYPES = [
  {
    key: 'creator',
    label: 'Creator',
    labelAr: 'صانع محتوى',
    description: 'Content creators, influencers, and digital storytellers with an engaged audience.',
    descriptionAr: 'صناع المحتوى والمؤثرون الرقميون الذين يمتلكون جمهوراً متفاعلاً.',
    detail: 'Instagram · YouTube · TikTok · Podcast',
    index: '01',
  },
  {
    key: 'athlete',
    label: 'Athlete',
    labelAr: 'رياضي',
    description: 'Professional and semi-professional athletes, sports personalities, and fitness figures.',
    descriptionAr: 'الرياضيون المحترفون وشخصيات عالم الرياضة والتمارين.',
    detail: 'Pro · Semi-Pro · Rising talent',
    index: '02',
  },
  {
    key: 'club',
    label: 'Club',
    labelAr: 'نادٍ رياضي',
    description: 'Sports clubs and organizations with an established fan base and community following.',
    descriptionAr: 'الأندية الرياضية والمنظمات ذات القاعدة الجماهيرية الراسخة.',
    detail: 'Saudi · Regional · National',
    index: '03',
  },
  {
    key: 'media',
    label: 'Media',
    labelAr: 'إعلام',
    description: 'Podcasts, YouTube channels, and media properties covering sports, culture, and lifestyle.',
    descriptionAr: 'البودكاست وقنوات يوتيوب والمنافذ الإعلامية في الرياضة والثقافة.',
    detail: 'Podcast · Channel · Network',
    index: '04',
  },
] as const;

function MembershipTypes({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  return (
    <section id="membership" className="px-6 md:px-10 py-20 md:py-28 border-b border-border">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-12 md:mb-16">
          <div>
            <p className="text-[9px] text-gold tracking-[0.4em] uppercase mb-4">Membership</p>
            <h2 className="font-display text-3xl md:text-5xl font-light text-parchment leading-tight">
              Who we select
            </h2>
          </div>
          <div className="hidden md:block h-px w-24 bg-border mb-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {MEMBER_TYPES.map((type) => (
            <div
              key={type.key}
              className="bg-ink p-8 md:p-10 flex flex-col gap-6 group hover:bg-surface transition-colors duration-300"
            >
              <div className="flex items-start justify-between">
                <span className="text-[9px] text-gold/60 tracking-[0.3em] uppercase">{type.index}</span>
                <div className="h-px w-8 bg-gold/30 mt-2 group-hover:w-12 group-hover:bg-gold/60 transition-all duration-300" />
              </div>

              <div>
                <h3 className="font-display text-2xl md:text-3xl font-light text-parchment mb-3 leading-tight">
                  {isAr ? type.labelAr : type.label}
                </h3>
                <p className="text-muted text-xs leading-relaxed">
                  {isAr ? type.descriptionAr : type.description}
                </p>
              </div>

              <p className="text-[9px] text-gold/50 tracking-[0.2em] uppercase mt-auto">
                {type.detail}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Coming Soon ───────────────────────────────────────────────────────────────

function ComingSoonSection({ t }: { t: TFn }) {
  return (
    <section className="px-6 md:px-10 py-20 md:py-32">
      <div className="max-w-7xl mx-auto">

        <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24 items-start">

          {/* Text */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-6 bg-gold/40" />
              <p className="text-[9px] text-gold/60 tracking-[0.35em] uppercase">Founding members</p>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-light text-parchment mb-6 leading-tight">
              {t('coming_soon_heading')}
            </h2>
            <p className="text-muted text-sm leading-relaxed mb-10 max-w-sm">
              {t('coming_soon_body')}
            </p>
            <Link
              href="/apply/member"
              className="inline-flex items-center justify-center bg-gold text-ink text-[10px] font-medium tracking-[0.22em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
            >
              {t('enquire_cta')}
            </Link>
          </div>

          {/* Placeholder slots — 4 dimmed cards referencing the 4 jersey types */}
          <div className="grid grid-cols-2 gap-3">
            {(['Creator', 'Athlete', 'Club', 'Media'] as const).map((label, i) => (
              <div key={i} className="border border-border/40 aspect-[3/4] flex flex-col justify-between p-4 opacity-25">
                <div className="h-px w-5 bg-gold" />
                <p className="text-[9px] tracking-[0.25em] uppercase text-muted">{label}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}

// ─── Active Members Grid ───────────────────────────────────────────────────────

function ActiveMembersSection({
  members,
  locale,
  t,
}: {
  members: Member[]
  locale: string
  t: TFn
}) {
  return (
    <section className="px-6 md:px-10 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-light text-parchment">
            {t('heading')}
          </h2>
          <p className="text-[9px] text-muted tracking-[0.2em] uppercase hidden md:block">
            {members.length} members
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
