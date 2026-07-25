'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

type GalleryImage = { url: string; is_primary: boolean };

type Props = {
  images: GalleryImage[];
  title: string;
  badge?: string;
};

/**
 * Renders every image a product has (previously only the primary image
 * was ever shown — the rest of `product_images` was fetched and discarded).
 * "Framed" chrome (matted outer card + thin accent border) around both the
 * main image and thumbnails, echoing a poster-frame treatment.
 */
export function ProductGallery({ images, title, badge }: Props) {
  const ordered = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const active = ordered[activeIndex];

  if (ordered.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-sm p-[4%]" style={{ background: '#F4EFE4', boxShadow: '0 20px 40px -18px rgba(20,15,5,.4)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-px w-12" style={{ background: '#E5DDD0' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {ordered.length > 1 && (
        <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
          {ordered.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`${title} — ${i + 1}/${ordered.length}`}
              aria-current={i === activeIndex}
              className="relative shrink-0 w-16 h-16 rounded-sm p-[6%] transition-all duration-150"
              style={{
                background: '#F4EFE4',
                boxShadow: i === activeIndex ? '0 10px 22px -10px rgba(20,15,5,.4)' : '0 6px 14px -8px rgba(20,15,5,.25)',
                opacity: i === activeIndex ? 1 : 0.75,
              }}
            >
              <div className="relative w-full h-full rounded-[2px] p-[8%]" style={{ background: 'var(--mc-accent, #B8975A)' }}>
                <div className="relative w-full h-full rounded-[1px] overflow-hidden" style={{ background: '#F4F1EA' }}>
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" quality={75} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        className="relative aspect-square flex-1 rounded-sm p-[4%]"
        style={{ background: '#F4EFE4', boxShadow: '0 20px 40px -18px rgba(20,15,5,.4)' }}
      >
        {badge && (
          <span
            className="absolute left-4 top-4 z-10 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ background: 'var(--mc-accent, #B8975A)', color: '#100B05' }}
          >
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Zoom image"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow hover:bg-neutral-50"
        >
          <Search width={16} height={16} className="text-neutral-700" />
        </button>

        <div className="relative w-full h-full rounded-[2px] p-[3.4%]" style={{ background: 'var(--mc-accent, #B8975A)' }}>
          <div className="relative w-full h-full rounded-[1px] overflow-hidden" style={{ background: '#F4F1EA' }}>
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
        </div>
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(16,11,5,0.9)' }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setZoomed(false)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X width={20} height={20} />
          </button>
          <div className="relative h-full w-full max-w-3xl">
            <Image src={active.url} alt={title} fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </div>
  );
}
