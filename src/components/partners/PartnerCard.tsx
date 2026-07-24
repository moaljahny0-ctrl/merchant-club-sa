'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
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
    <motion.div className="group flex flex-col cursor-pointer" whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>

      {/* Image area — 3:4 portrait */}
      <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden transition-colors duration-300 group-hover:border-gold/50">
        {hasImage ? (
          <Image
            src={partner.imageUrl!}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
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

        {/* Hover scrim — grounds the "view brand" affordance without a redundant label */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Brand mark — over the product photo, not instead of it */}
        {partner.logoUrl && hasImage && (
          <div className="absolute top-2.5 start-2.5 w-9 h-9 rounded-full overflow-hidden shrink-0 bg-parchment border border-ink/10 shadow-sm">
            <Image src={partner.logoUrl} alt="" fill className="object-cover" sizes="36px" />
          </div>
        )}

        {/* Newest drop indicator */}
        {partner.latestProductName && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0.92, 1, 0.92], y: 0 }}
            transition={{ opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.4 } }}
            className="absolute bottom-2.5 start-2.5 end-2.5 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
            style={{ background: 'rgba(13,13,13,0.82)', backdropFilter: 'blur(2px)' }}
          >
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gold text-ink">
              {isAr ? 'جديد' : 'New'}
            </span>
            <span className="text-[12px] truncate text-parchment">
              {partner.latestProductName}
            </span>
          </motion.div>
        )}
      </div>

      {/* Partner info */}
      {(hasName || category) && (
        <div className="pt-3 space-y-0.5">
          {hasName && (
            <p className="text-sm text-parchment font-medium tracking-wide leading-snug transition-colors duration-200 group-hover:text-gold">
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

    </motion.div>
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
