'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { registerCustomer } from '@/lib/actions/customers';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6B5B4E',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5DDD0',
  borderRadius: '8px',
  background: '#FFFFFF',
  color: '#1A1208',
  fontSize: '17px',
  padding: '12px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

export function RegisterForm() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(ar ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(ar ? 'كلمة المرور غير متطابقة.' : 'Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await registerCustomer(fullName, phone, email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/store/account');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <label style={labelStyle}>{ar ? 'الاسم الكامل' : 'Full Name'}</label>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>{ar ? 'رقم الجوال' : 'Phone Number'}</label>
        <input
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={inputStyle}
          dir="ltr"
        />
      </div>

      <div>
        <label style={labelStyle}>{ar ? 'البريد الإلكتروني' : 'Email'}</label>
        <input
          type="email"
          required
          autoComplete="email"
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
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>{ar ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: '15px', color: '#cc5555', lineHeight: 1.5 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: '100%',
          background: isPending ? '#9A8060' : '#1A1208',
          color: '#F5F0E8',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '16px',
          border: 'none',
          borderRadius: '8px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
      >
        {isPending
          ? (ar ? 'جارٍ الإنشاء…' : 'Creating account…')
          : (ar ? 'إنشاء الحساب' : 'Create account')}
      </button>

      <p style={{ fontSize: '15px', color: '#6B5B4E', textAlign: 'center' }}>
        {ar ? (
          <>لديك حساب بالفعل؟{' '}
            <a href="/store/login" style={{ color: '#B8975A', textDecoration: 'none' }}>تسجيل الدخول ←</a>
          </>
        ) : (
          <>Already have an account?{' '}
            <a href="/store/login" style={{ color: '#B8975A', textDecoration: 'none' }}>Sign in →</a>
          </>
        )}
      </p>

    </form>
  );
}
