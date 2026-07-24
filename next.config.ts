import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl({
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    qualities: [75, 80, 85, 90, 92],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zmxrryuexereczngohqz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
});
