import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Partner } from '@/lib/brands';

type Props = {
  partner: Partner;
  locale: string;
};

export function PartnerCard({ partner, locale }: Props) {
  const isAr = locale === 'ar';
  const name     = isAr ? partner.nameAr  : partner.name;
  const category = isAr ? partner.categoryAr : partner.category;
  const hasImage = !!partner.imageUrl;
  const hasName  = !!name;

  const card = (
    <div className="group flex flex-col cursor-pointer">

      {/* Image area — 3:4 portrait */}
      <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
        {hasImage ? (
          <Image
            src={partner.imageUrl!}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
          />
        ) : hasName ? (
          /* Real brand with no logo — show initials on gold */
          <div className="absolute inset-0 flex items-center justify-center bg-gold">
            <span style={{ color: '#FFFFFF', fontSize: '2rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              {name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()}
            </span>
          </div>
        ) : (
          /* Empty placeholder slot — awaiting partner content */
          <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
            <div className="h-px w-5 bg-gold" />
            <p className="text-[12px] tracking-[0.25em] uppercase text-muted">
              {isAr ? 'يقبل الطلبات' : 'Accepting applications'}
            </p>
          </div>
        )}
      </div>

      {/* Partner info */}
      {(hasName || category) && (
        <div className="pt-3 space-y-0.5">
          {hasName && (
            <p className="text-sm text-parchment font-medium tracking-wide leading-snug">
              {name}
            </p>
          )}
          {category && (
            <p className="text-[13px] text-muted tracking-[0.15em] uppercase">
              {category}
            </p>
          )}
        </div>
      )}

    </div>
  );

  // Internal brand page takes priority over external storeUrl
  if (partner.slug) {
    return (
      <Link href={`/brands/${partner.slug}`}>
        {card}
      </Link>
    );
  }

  if (partner.storeUrl) {
    return (
      <a href={partner.storeUrl} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );
  }

  return card;
}
