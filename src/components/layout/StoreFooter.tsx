import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Light-themed footer for the store family (approved store palette,
 * unchanged) — the dark marketing Footer doesn't belong under store pages;
 * it read as a jarring seam between a cream storefront and a black footer.
 */
export async function StoreFooter() {
  const t = await getTranslations('nav');

  return (
    <footer style={{ borderTop: '1px solid #E5DDD0', marginTop: 'auto', background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col gap-8 text-sm">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span
            className="tracking-[0.25em] uppercase"
            style={{ color: '#B8975A', fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            Merchant Club SA
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3" style={{ color: '#6B5B4E' }}>
            <Link href="/store" className="transition-colors tracking-[0.15em] uppercase hover:opacity-70">
              {t('shop')}
            </Link>
            <Link href="/track-order" className="transition-colors tracking-[0.15em] uppercase hover:opacity-70">
              {t('track_order')}
            </Link>
            <Link href="/about" className="transition-colors tracking-[0.15em] uppercase hover:opacity-70">
              {t('about')}
            </Link>
            <Link href="/brands" className="transition-colors tracking-[0.15em] uppercase hover:opacity-70">
              {t('brands')}
            </Link>
            <Link href="/members" className="transition-colors tracking-[0.15em] uppercase hover:opacity-70">
              {t('members')}
            </Link>
            <a href="mailto:info@merchantclubsa.com" className="transition-colors hover:opacity-70">
              info@merchantclubsa.com
            </a>
            <Link href="/privacy" className="transition-colors tracking-[0.15em] uppercase hover:opacity-70">
              {t('privacy')}
            </Link>
          </div>
          <p style={{ color: '#6B5B4E' }}>
            © {new Date().getFullYear()} Merchant Club SA
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/auth/login"
            className="transition-colors tracking-[0.15em] uppercase text-[13px]"
            style={{ color: 'rgba(107,91,78,0.35)' }}
          >
            {t('partner_login')}
          </Link>
        </div>

      </div>
    </footer>
  );
}
