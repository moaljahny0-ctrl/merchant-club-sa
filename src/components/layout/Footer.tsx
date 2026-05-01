import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function Footer() {
  const t = await getTranslations('nav');

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col gap-8 text-xs">

        {/* Main footer row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-display text-gold tracking-[0.25em] uppercase">
            Merchant Club SA
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-muted">
            <Link href="/store" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('shop')}
            </Link>
            <Link href="/about" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('about')}
            </Link>
            <Link href="/brands" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('brands')}
            </Link>
            <Link href="/members" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('members')}
            </Link>
            <Link href="/apply" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('apply')}
            </Link>
            <Link href="/track-order" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('track_order')}
            </Link>
            <a
              href="mailto:info@merchantclubsa.com"
              className="hover:text-parchment transition-colors"
            >
              info@merchantclubsa.com
            </a>
            <Link href="/privacy" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
              {t('privacy')}
            </Link>
          </div>
          <p className="text-muted">
            © {new Date().getFullYear()} Merchant Club SA
          </p>
        </div>

        {/* Partner access — deliberately subtle, not for customers */}
        <div className="flex justify-center">
          <Link
            href="/auth/login"
            className="text-muted/30 hover:text-muted/60 transition-colors tracking-[0.15em] uppercase text-[10px]"
          >
            {t('partner_login')}
          </Link>
        </div>

      </div>
    </footer>
  );
}
