'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '9px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#6B5B4E',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5DDD0',
  background: '#FFFFFF',
  color: '#1A1208',
  fontSize: '14px',
  padding: '12px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

export function StoreLoginForm() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPartnerError, setIsPartnerError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPartnerError(false);

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.');
        return;
      }

      // Verify user has a customer profile — brand/admin users must not login here
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        setIsPartnerError(true);
        setError(
          ar
            ? 'هذا الحساب مخصص للشركاء. يرجى تسجيل الدخول من هنا.'
            : 'This account is for brand partners. Please use the partner login.'
        );
        return;
      }

      router.push('/store/account');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <label style={labelStyle}>{ar ? 'البريد الإلكتروني' : 'Email'}</label>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          dir="ltr"
        />
      </div>

      <div>
        <label style={labelStyle}>{ar ? 'كلمة المرور' : 'Password'}</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: '#cc5555', lineHeight: 1.5 }}>
          {error}
          {isPartnerError && (
            <>
              {' '}
              <a href="/auth/login" style={{ color: '#B8975A', textDecoration: 'none' }}>
                {ar ? 'دخول الشركاء ←' : 'Partner Login →'}
              </a>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: '100%',
          background: isPending ? '#9A8060' : '#1A1208',
          color: '#F5F0E8',
          fontSize: '10px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          padding: '16px',
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
      >
        {isPending
          ? (ar ? 'جارٍ الدخول…' : 'Signing in…')
          : (ar ? 'دخول' : 'Sign in')}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#6B5B4E', margin: 0 }}>
          {ar ? (
            <>عميل جديد؟{' '}
              <a href="/store/register" style={{ color: '#B8975A', textDecoration: 'none' }}>إنشاء حساب ←</a>
            </>
          ) : (
            <>New customer?{' '}
              <a href="/store/register" style={{ color: '#B8975A', textDecoration: 'none' }}>Register →</a>
            </>
          )}
        </p>
        <p style={{ fontSize: '12px', color: '#6B5B4E', margin: 0 }}>
          <a href="/store/forgot-password" style={{ color: '#B8975A', textDecoration: 'none' }}>
            {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
          </a>
        </p>
      </div>

    </form>
  );
}
