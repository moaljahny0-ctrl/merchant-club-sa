import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { StoreLoginForm } from './StoreLoginForm';

type Props = { params: Promise<{ locale: string }> };

export default async function StoreLoginPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Only redirect if already logged in as a customer (not admin/brand users browsing the store)
  if (user?.app_metadata?.role === 'customer') redirect(`${prefix}/store/account`);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }} className="p-8 md:p-10">
            <p style={{ color: '#B8975A', fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {locale === 'ar' ? 'دخول العملاء' : 'Customer Login'}
            </p>
            <h1 style={{ color: '#1A1208', fontSize: '22px', fontWeight: 400, marginBottom: '32px', lineHeight: 1.2 }}>
              {locale === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}
            </h1>
            <StoreLoginForm />
            <p style={{ fontSize: '11px', color: '#6B5B4E', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
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
