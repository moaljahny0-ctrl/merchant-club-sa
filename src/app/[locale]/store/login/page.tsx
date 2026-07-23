import { getCustomerSession } from '@/lib/customer-auth';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { StoreLoginForm } from './StoreLoginForm';

type Props = { params: Promise<{ locale: string }> };

export default async function StoreLoginPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';

  const session = await getCustomerSession();
  if (session) redirect(`${prefix}/store/account`);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(26,18,8,0.05)' }} className="p-8 md:p-10">
            <p style={{ color: '#B8975A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {locale === 'ar' ? 'دخول العملاء' : 'Customer Login'}
            </p>
            <h1 style={{ color: '#1A1208', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '32px', lineHeight: 1.2 }}>
              {locale === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}
            </h1>
            <StoreLoginForm />
            <p style={{ fontSize: '14px', color: '#6B5B4E', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
              {locale === 'ar' ? (
                <>
                  هل أنت شريك علامة تجارية؟{' '}
                  <a href="/auth/login" style={{ color: '#B8975A', textDecoration: 'none' }}>
                    سجّل دخولك هنا ←
                  </a>
                </>
              ) : (
                <>
                  Are you a brand partner?{' '}
                  <a href="/auth/login" style={{ color: '#B8975A', textDecoration: 'none' }}>
                    Login here →
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
