import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { VerifyMagicLinkClient } from './VerifyMagicLinkClient';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyMagicLinkPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  const prefix = locale === 'ar' ? '/ar' : '';

  if (!token) redirect(`${prefix}/store/login`);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(26,18,8,0.05)' }} className="p-8 md:p-10">
            <VerifyMagicLinkClient token={token} locale={locale} />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
