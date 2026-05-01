'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isRTL = locale === 'ar';
  const isHome = pathname === '/' || pathname === '/members' || pathname === '/brands' || pathname === '/store';

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const transparent = isHome && !scrolled

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      transparent
        ? 'border-b border-transparent bg-transparent'
        : 'border-b border-border bg-ink/90 backdrop-blur-sm'
    }`}>
      <nav className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="Merchant Club SA"
            width={40}
            height={40}
            priority
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/about"
            className={`text-xs hover:text-parchment transition-colors tracking-[0.2em] uppercase ${transparent ? 'text-parchment/80' : 'text-muted'}`}
          >
            {t('about')}
          </Link>
          <Link
            href="/brands"
            className={`text-xs hover:text-parchment transition-colors tracking-[0.2em] uppercase ${transparent ? 'text-parchment/80' : 'text-muted'}`}
          >
            {t('brands')}
          </Link>
          <Link
            href="/members"
            className={`text-xs hover:text-parchment transition-colors tracking-[0.2em] uppercase ${transparent ? 'text-parchment/80' : 'text-muted'}`}
          >
            {t('members')}
          </Link>
          <Link
            href="/store"
            className={`text-xs hover:text-parchment transition-colors tracking-[0.2em] uppercase ${transparent ? 'text-parchment/80' : 'text-muted'}`}
          >
            {t('shop')}
          </Link>
          <Link
            href="/apply"
            className="text-xs bg-gold text-ink hover:bg-gold-light transition-colors px-5 py-2.5 tracking-[0.2em] uppercase"
          >
            {t('apply')}
          </Link>
          <Link
            href={pathname}
            locale={isRTL ? 'en' : 'ar'}
            className={`text-xs hover:text-parchment transition-colors tracking-widest ${
              isRTL ? 'text-parchment/80' : (transparent ? 'text-parchment/80' : 'text-muted')
            }`}
            style={isRTL ? { fontFamily: 'var(--font-body)', letterSpacing: '0.1em' } : undefined}
          >
            {isRTL ? 'EN' : 'ع'}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-5">
          <Link
            href={pathname}
            locale={isRTL ? 'en' : 'ar'}
            className={`text-xs hover:text-parchment transition-colors ${isRTL ? 'text-parchment/80' : 'text-muted'}`}
            style={isRTL ? { fontFamily: 'var(--font-body)', letterSpacing: '0.1em' } : undefined}
          >
            {isRTL ? 'EN' : 'ع'}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex flex-col gap-[5px] p-1 text-parchment"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-px bg-current transition-all duration-200 ${open ? 'w-5 translate-y-[7px] rotate-45' : 'w-5'}`}
            />
            <span
              className={`block h-px w-5 bg-current transition-all duration-200 ${open ? 'opacity-0' : ''}`}
            />
            <span
              className={`block h-px bg-current transition-all duration-200 ${open ? 'w-5 -translate-y-[7px] -rotate-45' : 'w-3'}`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 border-t border-border bg-surface ${
          open ? 'max-h-64' : 'max-h-0 border-transparent'
        }`}
      >
        <div className="px-6 py-6 flex flex-col gap-6">
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="text-xs text-muted hover:text-parchment transition-colors tracking-[0.2em] uppercase"
          >
            {t('about')}
          </Link>
          <Link
            href="/brands"
            onClick={() => setOpen(false)}
            className="text-xs text-muted hover:text-parchment transition-colors tracking-[0.2em] uppercase"
          >
            {t('brands')}
          </Link>
          <Link
            href="/members"
            onClick={() => setOpen(false)}
            className="text-xs text-muted hover:text-parchment transition-colors tracking-[0.2em] uppercase"
          >
            {t('members')}
          </Link>
          <Link
            href="/store"
            onClick={() => setOpen(false)}
            className="text-xs text-muted hover:text-parchment transition-colors tracking-[0.2em] uppercase"
          >
            {t('shop')}
          </Link>
          <Link
            href="/track-order"
            onClick={() => setOpen(false)}
            className="text-xs text-muted hover:text-parchment transition-colors tracking-[0.2em] uppercase"
          >
            {t('track_order')}
          </Link>
          <Link
            href="/apply"
            onClick={() => setOpen(false)}
            className="text-xs text-parchment tracking-[0.2em] uppercase"
          >
            {t('apply')}
          </Link>
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="text-xs text-muted/40 hover:text-muted transition-colors tracking-[0.2em] uppercase"
          >
            {t('partner_login')}
          </Link>
        </div>
      </div>
    </header>
  );
}
