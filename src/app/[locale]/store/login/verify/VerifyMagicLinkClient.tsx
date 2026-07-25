'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { verifyMagicLink } from '@/lib/actions/customers';

type Props = {
  token: string;
  locale: string;
};

export function VerifyMagicLinkClient({ token, locale }: Props) {
  const ar = locale === 'ar';
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    verifyMagicLink(token).then(result => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/store/account');
      router.refresh();
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '17px', color: '#1A1208', marginBottom: '12px', lineHeight: 1.5 }}>
          {ar ? 'تعذّر تسجيل الدخول' : "Couldn't sign you in"}
        </p>
        <p style={{ fontSize: '15px', color: '#cc5555', marginBottom: '24px', lineHeight: 1.5 }}>
          {error}
        </p>
        <Link href="/store/login" style={{ color: '#B8975A', fontSize: '14px', textDecoration: 'none' }}>
          {ar ? '← رجوع لتسجيل الدخول' : '← Back to login'}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '17px', color: '#1A1208', lineHeight: 1.5 }}>
        {ar ? 'جارٍ تسجيل الدخول…' : 'Signing you in…'}
      </p>
    </div>
  );
}
