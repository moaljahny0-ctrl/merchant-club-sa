import { getCustomerSession } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { RegisterForm } from './RegisterForm';

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';

  const session = await getCustomerSession();
  if (session) redirect(`${prefix}/store/account`);

  const ar = locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(26,18,8,0.05)' }} className="p-8 md:p-10">
            <p style={{ color: '#B8975A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {ar ? 'عميل جديد' : 'New Customer'}
            </p>
            <h1 style={{ color: '#1A1208', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '32px', lineHeight: 1.2 }}>
              {ar ? 'أنشئ حسابك' : 'Create your account'}
            </h1>
            <RegisterForm />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
