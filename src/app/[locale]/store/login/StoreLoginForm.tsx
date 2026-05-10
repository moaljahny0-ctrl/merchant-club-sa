'use client';

import { useState, useTransition } from 'react';
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Incorrect email or password.');
      } else {
        router.push('/store/account');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <label style={labelStyle}>Email</label>
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
        <label style={labelStyle}>Password</label>
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
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p style={{ fontSize: '12px', color: '#6B5B4E', textAlign: 'center' }}>
        New customer?{' '}
        <a href="/store/register" style={{ color: '#B8975A', textDecoration: 'none' }}>
          Register →
        </a>
      </p>

    </form>
  );
}
