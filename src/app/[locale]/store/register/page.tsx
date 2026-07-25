import { getCustomerSession } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { AuthCard } from '@/components/storefront/AuthCard';

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';

  const session = await getCustomerSession();
  if (session) redirect(`${prefix}/store/account`);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <AuthCard initialView="signup" locale={locale} />
      </main>
      <StoreFooter />
    </div>
  );
}
