'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { setupCustomerProfile } from '@/lib/actions/customers';

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

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/store/account`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        // No email confirmation required — set up profile immediately
        const result = await setupCustomerProfile(fullName, phone);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push('/store/account');
        router.refresh();
      } else {
        // Email confirmation required
        setEmailSent(true);
      }
    });
  }

  if (emailSent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ color: '#B8975A', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Check your inbox
        </p>
        <p style={{ color: '#1A1208', fontSize: '14px', lineHeight: 1.65 }}>
          We sent a verification link to <strong>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <label style={labelStyle}>Full Name</label>
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
        <label style={labelStyle}>Phone</label>
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
        <label style={labelStyle}>Email</label>
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
        <label style={labelStyle}>Password</label>
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
        <label style={labelStyle}>Confirm Password</label>
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
        {isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p style={{ fontSize: '12px', color: '#6B5B4E', textAlign: 'center' }}>
        Already have an account?{' '}
        <a href="/store/login" style={{ color: '#B8975A', textDecoration: 'none' }}>
          Login →
        </a>
      </p>

    </form>
  );
}
