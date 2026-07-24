'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { Partner } from '@/lib/brands';

const GOLD = '#D4AF37';

type Size = 'md' | 'lg';

const SIZES: Record<Size, { wrap: number; logo: number; fontSize: string; nameSize: string; nameWidth: number }> = {
  md: { wrap: 172, logo: 116, fontSize: '34px', nameSize: '11px', nameWidth: 110 },
  lg: { wrap: 232, logo: 172, fontSize: '48px', nameSize: '13px', nameWidth: 160 },
};

type Props = {
  partners: Partner[];
  isAr: boolean;
  size?: Size;
};

/**
 * Sits inside the frame's non-rotating center — cycles through real
 * partners (logo if they have one, name otherwise), one at a time.
 * A single-item `partners` array renders as a large, static display
 * (the interval never fires with fewer than 2 items) — used for a
 * single brand's own storefront hero instead of the partner directory.
 */
export function PartnerShowcaseRing({ partners = [], isAr, size = 'md' }: Props) {
  const [index, setIndex] = useState(0);
  const usable = partners.filter(p => (isAr ? p.nameAr : p.name));
  const dims = SIZES[size];

  useEffect(() => {
    if (usable.length < 2) return;
    const id = setInterval(() => setIndex(i => (i + 1) % usable.length), 2800);
    return () => clearInterval(id);
  }, [usable.length]);

  if (usable.length === 0) {
    return (
      <svg width="130" height="130" viewBox="0 0 150 150">
        <g fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 78 L52 66 L66 74 L82 74 L98 66 L120 78" />
          <path d="M52 66 L60 90 L74 96 L84 90 L94 66" />
          <path d="M40 82 L34 96 L44 106" />
          <path d="M110 82 L116 96 L106 106" />
        </g>
        <text x="75" y="40" textAnchor="middle" fill={GOLD} fontFamily="var(--font-cairo), sans-serif" fontSize="17" fontWeight="700">شركاؤنا</text>
        <text x="75" y="130" textAnchor="middle" fill={GOLD} fontFamily="var(--font-cairo), sans-serif" fontSize="17" fontWeight="700">نجاحنا</text>
      </svg>
    );
  }

  const partner = usable[index % usable.length];
  const name = isAr ? partner.nameAr : partner.name;

  return (
    <div className="relative flex items-center justify-center" style={{ width: dims.wrap, height: dims.wrap }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={partner.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-1.5"
        >
          {partner.logoUrl ? (
            <div
              className="relative rounded-full overflow-hidden shrink-0"
              style={{ width: dims.logo, height: dims.logo, background: '#FFFFFF', border: `3px solid ${GOLD}` }}
            >
              <Image src={partner.logoUrl} alt="" fill className="object-cover" sizes={`${dims.logo}px`} />
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: dims.logo, height: dims.logo, background: GOLD, color: '#FFFFFF', fontSize: dims.fontSize, fontWeight: 700 }}
            >
              {name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()}
            </div>
          )}
          <span
            className="font-semibold text-center leading-tight truncate"
            style={{ color: GOLD, fontSize: dims.nameSize, maxWidth: dims.nameWidth }}
          >
            {name}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
