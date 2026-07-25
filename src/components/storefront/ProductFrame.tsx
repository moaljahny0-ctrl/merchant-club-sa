import Image from 'next/image';

type ProductFrameProps = {
  src?: string;
  alt?: string;
  caption?: string;
  priority?: boolean;
  /** Border color between the mat and the image panel — defaults to the
   *  platform gold; brand-specific pages should pass their own accent. */
  accentHex?: string;
  /** Aspect ratio of the framed image — defaults to square. */
  aspectClassName?: string;
  sizes?: string;
  /** Absolutely-positioned content over the frame, e.g. a wishlist button or a "New" badge. */
  overlay?: React.ReactNode;
};

/**
 * Shared "display case" chrome for product photos: cream mat → accent
 * border → image panel, as three nested boxes with percentage padding so
 * the proportions hold at any size.
 */
export function ProductFrame({
  src,
  alt = '',
  caption,
  priority = false,
  accentHex = '#B8975A',
  aspectClassName = 'aspect-square',
  sizes = '(max-width: 768px) 50vw, 25vw',
  overlay,
}: ProductFrameProps) {
  return (
    <figure className="flex flex-col">
      <div
        className={`relative w-full rounded-sm p-[4.2%] ${aspectClassName}`}
        style={{ background: '#F4EFE4', boxShadow: '0 30px 60px -25px rgba(20,15,5,.4), 0 10px 20px -10px rgba(20,15,5,.25)' }}
      >
        {overlay}
        <div className="relative w-full h-full rounded-[2px] p-[3.6%]" style={{ background: accentHex }}>
          <div className="relative w-full h-full rounded-[1px] overflow-hidden flex items-center justify-center" style={{ background: '#F4F1EA' }}>
            {src ? (
              <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                priority={priority}
              />
            ) : (
              <div className="h-px w-8" style={{ background: '#E5DDD0' }} />
            )}
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-[12px] font-semibold" style={{ color: '#6B6255' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
