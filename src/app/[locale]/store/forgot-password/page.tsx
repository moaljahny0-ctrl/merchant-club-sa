import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  const ar = locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(26,18,8,0.05)' }} className="p-8 md:p-10">
            <p style={{ color: '#B8975A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {ar ? 'استعادة الحساب' : 'Account Recovery'}
            </p>
            <h1 style={{ color: '#1A1208', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '12px', lineHeight: 1.2 }}>
              {ar ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
            </h1>
            <p style={{ color: '#6B5B4E', fontSize: '16px', lineHeight: 1.6, marginBottom: '28px' }}>
              {ar
                ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.'
                : 'Enter your email and we\'ll send you a password reset link.'}
            </p>
            <ForgotPasswordForm locale={locale} />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
