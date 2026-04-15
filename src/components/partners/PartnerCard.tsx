import Image from 'next/image';
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
    <div className="group flex flex-col">

      {/* Image area — 3:4 portrait */}
      <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
        {hasImage ? (
          <Image
            src={partner.imageUrl!}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          /* Empty slot — awaiting partner content */
          <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
            <div className="h-px w-5 bg-gold" />
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted">
              {isAr ? 'يقبل الطلبات' : 'Accepting applications'}
            </p>
          </div>
        )}
      </div>

      {/* Partner info */}
      {(hasName || category) && (
        <div className="pt-3 space-y-0.5">
          {hasName && (
            <p className="text-xs text-parchment font-medium tracking-wide leading-snug">
              {name}
            </p>
          )}
          {category && (
            <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
              {category}
            </p>
          )}
        </div>
      )}

    </div>
  );

  // If partner has a store link, wrap in an anchor
  if (partner.storeUrl) {
    return (
      <a href={partner.storeUrl} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );
  }

  return card;
}
