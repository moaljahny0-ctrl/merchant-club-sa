'use client';

import { useState, useTransition } from 'react';
import { sendPasswordResetEmail } from '@/lib/actions/customers';

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

type Props = { locale: string };

export function ForgotPasswordForm({ locale }: Props) {
  const ar = locale === 'ar';
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await sendPasswordResetEmail(email);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ color: '#4A9E6B', fontSize: '13px', lineHeight: 1.65, marginBottom: '20px' }}>
          {ar
            ? 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور قريباً.'
            : 'If this email is registered, you will receive a password reset link shortly.'}
        </p>
        <a href="/store/login" style={{ color: '#B8975A', fontSize: '12px', textDecoration: 'none' }}>
          {ar ? '← العودة لتسجيل الدخول' : '← Back to login'}
        </a>
      </div>
    );
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
          ? (ar ? 'جارٍ الإرسال…' : 'Sending…')
          : (ar ? 'إرسال رابط الاستعادة' : 'Send reset link')}
      </button>

      <p style={{ fontSize: '12px', color: '#6B5B4E', textAlign: 'center' }}>
        <a href="/store/login" style={{ color: '#B8975A', textDecoration: 'none' }}>
          {ar ? '← العودة لتسجيل الدخول' : '← Back to login'}
        </a>
      </p>

    </form>
  );
}
