'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useCart } from '@/lib/cart/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';

type CustomerInfo = { initial: string } | null;

type Props = { customer: CustomerInfo };

export function StoreNavbarClient({ customer }: Props) {
  const [open, setOpen] = useState(false);
  const { count, openCart } = useCart();
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isRTL = locale === 'ar';

  // Store-context header — only utilities a customer mid-shop actually needs.
  // Company/marketing pages (About, Brands, Members) live in the footer, not here.
  const links = [
    { href: '/store/partners', label: t('brands') },
    { href: '/track-order',    label: t('track_order') },
  ].map(link => ({
    ...link,
    active: pathname === link.href || pathname.startsWith(link.href + '/'),
  }));

  const searchAction = isRTL ? '/ar/store' : '/store';

  return (
    <>
    <header
      className="sticky top-0 z-50"
      style={{ background: '#FFFFFF', borderBottom: '1px solid #E5DDD0' }}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link href="/store" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <Image src="/logo.png" alt="Merchant Club SA" width={32} height={32} priority />
          <span
            className="text-[14px] tracking-[0.2em] uppercase hidden sm:block"
            style={{ color: '#1A1208', fontFamily: 'var(--font-body)' }}
          >
            Merchant Club SA
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <form
            action={searchAction}
            method="GET"
            className="flex items-center gap-2 px-3 rounded-full transition-colors"
            style={{ background: '#F5F0E8', border: '1px solid #E5DDD0', minHeight: '38px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5B4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="q"
              type="search"
              placeholder={isRTL ? 'ابحث عن منتج' : 'Search products'}
              className="text-sm bg-transparent outline-none w-36 lg:w-48"
              style={{ color: '#1A1208' }}
            />
          </form>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-[0.12em] uppercase transition-colors"
              style={{
                color: link.active ? '#1A1208' : '#6B5B4E',
                fontWeight: link.active ? 600 : 400,
                borderBottom: link.active ? '2px solid #B8975A' : '2px solid transparent',
                paddingBottom: '2px',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={pathname}
            locale={isRTL ? 'en' : 'ar'}
            className="text-sm transition-colors"
            style={{ color: '#6B5B4E' }}
          >
            {isRTL ? 'EN' : 'ع'}
          </Link>
        </div>

        {/* Auth — desktop */}
        <div className="hidden md:flex items-center gap-3">
          {customer ? (
            <Link
              href="/store/account"
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ textDecoration: 'none' }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#B8975A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  flexShrink: 0,
                }}
              >
                {customer.initial}
              </span>
              <span className="text-sm tracking-[0.12em] uppercase" style={{ color: '#B8975A' }}>
                حسابي
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/store/login"
                className="text-sm tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
                style={{ color: '#B8975A' }}
              >
                دخول
              </Link>
              <span style={{ color: '#E5DDD0', fontSize: '15px' }}>|</span>
              <Link
                href="/store/register"
                className="text-sm tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
                style={{ color: '#B8975A' }}
              >
                تسجيل
              </Link>
            </div>
          )}
        </div>

        {/* Cart + mobile hamburger */}
        <div className="flex items-center gap-4">
          <button
            onClick={openCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', minHeight: '44px', position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', color: '#6B5B4E' }}
            aria-label="Open cart"
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 001.96 1.61h9.72a2 2 0 001.95-1.61L23 6H6" />
              </svg>
              {count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  background: '#B8975A',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                }}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            <span className="text-sm hidden sm:block" style={{ fontFamily: 'var(--font-body)' }}>
              {isRTL ? `السلة · ${count}` : `Cart · ${count}`}
            </span>
          </button>

          {/* Language switcher — mobile only */}
          <Link
            href={pathname}
            locale={isRTL ? 'en' : 'ar'}
            className="text-sm md:hidden transition-colors"
            style={{ color: '#6B5B4E' }}
          >
            {isRTL ? 'EN' : 'ع'}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(!open)}
            className="flex md:hidden flex-col items-center justify-center gap-[5px] min-w-11 min-h-11"
            style={{ color: '#1A1208' }}
            aria-label="Toggle menu"
          >
            <span className={`block h-px bg-current transition-all duration-200 ${open ? 'w-5 translate-y-[7px] rotate-45' : 'w-5'}`} />
            <span className={`block h-px w-5 bg-current transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-200 ${open ? 'w-5 -translate-y-[7px] -rotate-45' : 'w-3'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}
        style={{
          background: '#FFFFFF',
          borderTop: open ? '1px solid #E5DDD0' : 'none',
        }}
      >
        <div className="px-6 py-5 flex flex-col gap-5">
          <form
            action={searchAction}
            method="GET"
            className="flex items-center gap-2 px-3 rounded-full"
            style={{ background: '#F5F0E8', border: '1px solid #E5DDD0', minHeight: '44px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5B4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="q"
              type="search"
              placeholder={isRTL ? 'ابحث عن منتج' : 'Search products'}
              className="text-sm bg-transparent outline-none flex-1"
              style={{ color: '#1A1208' }}
            />
          </form>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm tracking-[0.15em] uppercase transition-colors"
              style={{
                color: link.active ? '#1A1208' : '#6B5B4E',
                fontWeight: link.active ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile auth */}
          {customer ? (
            <Link
              href="/store/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
              style={{ textDecoration: 'none' }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#B8975A',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  flexShrink: 0,
                }}
              >
                {customer.initial}
              </span>
              <span className="text-sm tracking-[0.15em] uppercase" style={{ color: '#B8975A' }}>
                حسابي
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/store/login"
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.15em] uppercase"
                style={{ color: '#B8975A' }}
              >
                دخول
              </Link>
              <span style={{ color: '#E5DDD0' }}>|</span>
              <Link
                href="/store/register"
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.15em] uppercase"
                style={{ color: '#B8975A' }}
              >
                تسجيل
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
    <CartDrawer />
    </>
  );
}
