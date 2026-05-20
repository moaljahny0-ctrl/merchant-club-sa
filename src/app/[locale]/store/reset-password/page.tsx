import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StoreNavbar } from '@/components/layout/StoreNavbar';
import { Footer } from '@/components/layout/Footer';
import { ResetPasswordForm } from './ResetPasswordForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  const prefix = locale === 'ar' ? '/ar' : '';
  const ar = locale === 'ar';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${prefix}/store/forgot-password`);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
      <StoreNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div style={{ background: '#FFFFFF', border: '1px solid #E5DDD0' }} className="p-8 md:p-10">
            <p style={{ color: '#B8975A', fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {ar ? 'كلمة مرور جديدة' : 'New Password'}
            </p>
            <h1 style={{ color: '#1A1208', fontSize: '22px', fontWeight: 400, marginBottom: '32px', lineHeight: 1.2 }}>
              {ar ? 'اختر كلمة مرور جديدة' : 'Set a new password'}
            </h1>
            <ResetPasswordForm locale={locale} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
