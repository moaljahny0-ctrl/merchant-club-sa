'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
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
        color: '#6B5B4E',
        fontSize: '10px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '12px 24px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, color 0.2s',
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
