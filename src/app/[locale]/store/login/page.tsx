import Link from 'next/link';
import { getCustomerSession } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { AuthCard } from '@/components/storefront/AuthCard';

type Props = { params: Promise<{ locale: string }> };

export default async function StoreLoginPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';
  const ar = locale === 'ar';

  const session = await getCustomerSession();
  if (session) redirect(`${prefix}/store/account`);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-16">
        <AuthCard initialView="signin" locale={locale} />
        <p style={{ fontSize: '14px', color: '#6B5B4E', textAlign: 'center' }}>
          {ar ? (
            <>هل أنت شريك علامة تجارية؟{' '}
              <Link href="/auth/login" style={{ color: '#B8975A', textDecoration: 'none' }}>سجّل دخولك هنا ←</Link>
            </>
          ) : (
            <>Are you a brand partner?{' '}
              <Link href="/auth/login" style={{ color: '#B8975A', textDecoration: 'none' }}>Login here →</Link>
            </>
          )}
        </p>
      </main>
      <StoreFooter />
    </div>
  );
}
