'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { Partner } from '@/lib/brands';

const C = {
  catBg:  '#F0EBE1',
  border: '#E5DDD0',
  text:   '#1A1208',
  text2:  '#6B5B4E',
  gold:   '#B8975A',
} as const;

type Props = {
  partner: Partner;
  isAr: boolean;
};

/**
 * Store-family partner card (approved light palette, unchanged) — each tile
 * is a real entry point into that brand's own storefront (/brands/[slug]),
 * not a static listing.
 */
export function LightPartnerCard({ partner, isAr }: Props) {
  const name = isAr ? partner.nameAr : partner.name;
  const category = isAr ? partner.categoryAr : partner.category;
  const hasImage = !!partner.imageUrl;
  const hasName = !!name;

  const card = (
    <motion.div className="group flex flex-col cursor-pointer" whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl transition-shadow duration-200 group-hover:shadow-lg"
        style={{ background: C.catBg, border: `1px solid ${C.border}` }}
      >
        {hasImage ? (
          <Image
            src={partner.imageUrl!}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : hasName ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: C.gold }}>
            <span style={{ color: '#FFFFFF', fontSize: '2rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              {name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-4" style={{ opacity: 0.5 }}>
            <div className="h-px w-5" style={{ background: C.gold }} />
            <p className="text-[12px] tracking-[0.25em] uppercase" style={{ color: C.text2 }}>
              {isAr ? 'يقبل الطلبات' : 'Accepting applications'}
            </p>
          </div>
        )}

        {partner.logoUrl && partner.imageUrl && (
          <div
            className="absolute top-2.5 start-2.5 w-9 h-9 rounded-full overflow-hidden shrink-0"
            style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
          >
            <Image src={partner.logoUrl} alt="" fill className="object-cover" sizes="36px" />
          </div>
        )}

        {partner.latestProductName && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0.92, 1, 0.92], y: 0 }}
            transition={{ opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.4 } }}
            className="absolute bottom-2.5 start-2.5 end-2.5 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(2px)' }}
          >
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: C.gold, color: '#FFFFFF' }}>
              {isAr ? 'جديد' : 'New'}
            </span>
            <span className="text-[12px] truncate" style={{ color: C.text }}>
              {partner.latestProductName}
            </span>
          </motion.div>
        )}
      </div>
      <div className="pt-3 space-y-0.5">
        {name && (
          <p className="text-base font-medium" style={{ color: C.text }}>
            {name}
          </p>
        )}
        {category && (
          <p className="text-[13px] uppercase tracking-wider" style={{ color: C.text2 }}>
            {category}
          </p>
        )}
      </div>
    </motion.div>
  );

  if (partner.slug) {
    return <Link href={`/brands/${partner.slug}`}>{card}</Link>;
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
