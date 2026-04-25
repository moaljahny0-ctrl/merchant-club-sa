import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl({
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zmxrryuexereczngohqz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
});
