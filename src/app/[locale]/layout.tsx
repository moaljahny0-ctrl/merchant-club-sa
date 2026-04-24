import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Analytics } from '@/components/layout/Analytics';
import { CookieBanner } from '@/components/layout/CookieBanner';
import '../globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const hanazad = localFont({
  src: '../fonts/TSHanazad-Display.woff2',
  variable: '--font-hanazad',
  display: 'swap',
});

const BASE_URL = 'https://www.merchantclubsa.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Merchant Club SA — Curated Saudi Brands',
    template: '%s — Merchant Club SA',
  },
  description: "Saudi Arabia's first curated marketplace for independent brands.",
  keywords: ['Saudi brands', 'independent brands', 'Saudi marketplace', 'curated brands', 'علامات سعودية'],
  authors: [{ name: 'Merchant Club SA', url: BASE_URL }],
  openGraph: {
    title: 'Merchant Club SA — Curated Saudi Brands',
    description: "Saudi Arabia's first curated marketplace for independent brands.",
    url: BASE_URL,
    siteName: 'Merchant Club SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merchant Club SA — Curated Saudi Brands',
    description: "Saudi Arabia's first curated marketplace for independent brands.",
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${playfair.variable} ${inter.variable} ${hanazad.variable}`}
    >
      <body>
        <Analytics />
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
