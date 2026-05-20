'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { resetCustomerPassword } from '@/lib/actions/customers';

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

type Props = { locale: string; token: string };

export function ResetPasswordForm({ locale, token }: Props) {
  const ar = locale === 'ar';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(ar ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError(ar ? 'كلمة المرور غير متطابقة.' : 'Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await resetCustomerPassword(token, password);
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
        <label style={labelStyle}>{ar ? 'كلمة المرور الجديدة' : 'New Password'}</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          autoFocus
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
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: '#cc5555', lineHeight: 1.5 }}>{error}</p>
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
          ? (ar ? 'جارٍ الحفظ…' : 'Saving…')
          : (ar ? 'حفظ كلمة المرور' : 'Save password')}
      </button>

    </form>
  );
}
