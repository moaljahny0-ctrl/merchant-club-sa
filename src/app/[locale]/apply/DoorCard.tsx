'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';

type Props = {
  href: string;
  index: string;
  title: string;
  body: string;
  cta: string;
  emphasis: 'primary' | 'secondary';
};

/**
 * The full panel is the click target (was previously only the small CTA
 * button — a large card that looks clickable but isn't is a Fitts's Law /
 * affordance mismatch). The visible "button" is a span, not a nested <a>.
 */
export function DoorCard({ href, index, title, body, cta, emphasis }: Props) {
  return (
    <Link
      href={href}
      aria-label={cta}
      className={`group block h-full p-10 md:p-16 flex flex-col transition-colors duration-300 ${
        emphasis === 'primary' ? 'bg-ink hover:bg-surface' : 'bg-surface hover:bg-surface-2'
      }`}
    >
      <div className="flex-1">
        <p className="text-[13px] text-gold tracking-[0.3em] uppercase mb-6">
          {index}
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-light text-parchment mb-5 leading-snug">
          {title}
        </h2>
        <p className="text-muted text-base leading-relaxed max-w-sm">
          {body}
        </p>
      </div>
      <div className="mt-12">
        <motion.span
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
          className={`inline-flex items-center justify-center gap-2 px-8 py-4 text-[13px] font-medium tracking-[0.2em] uppercase transition-all duration-200 ${
            emphasis === 'primary'
              ? 'bg-gold text-ink rounded-lg shadow-sm group-hover:bg-gold-light group-hover:shadow-md'
              : 'border border-border text-parchment rounded-lg group-hover:border-gold group-hover:text-gold'
          }`}
        >
          {cta}
        </motion.span>
      </div>
    </Link>
  );
}
