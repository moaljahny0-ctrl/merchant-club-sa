'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { logoutCustomer } from '@/lib/actions/customers';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutCustomer();
      router.push('/store');
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      style={{
        background: 'transparent',
        border: '1px solid #E5DDD0',
        borderRadius: '8px',
        color: '#6B5B4E',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '12px 24px',
        minHeight: '44px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, color 0.2s',
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
    </button>
  );
}
