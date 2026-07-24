'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

type GalleryImage = { url: string; is_primary: boolean };

type Props = {
  images: GalleryImage[];
  title: string;
};

/**
 * Renders every image a product has (previously only the primary image
 * was ever shown — the rest of `product_images` was fetched and discarded).
 * Colors are the store's approved light palette, unchanged.
 */
export function ProductGallery({ images, title }: Props) {
  const ordered = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = ordered[activeIndex];

  if (ordered.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl" style={{ background: '#F0EBE1' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-px w-12" style={{ background: '#E5DDD0' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl" style={{ background: '#F0EBE1' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={active.url}
              alt={title}
              fill
              priority={activeIndex === 0}
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={90}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {ordered.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {ordered.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`${title} — ${i + 1}/${ordered.length}`}
              aria-current={i === activeIndex}
              className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-150"
              style={{
                border: `2px solid ${i === activeIndex ? '#B8975A' : '#E5DDD0'}`,
                opacity: i === activeIndex ? 1 : 0.7,
              }}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="64px" quality={75} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
