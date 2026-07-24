'use client';

import { useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleFavorite } from '@/lib/actions/favorites';

type Props = {
  brandId: string;
  initialFollowing: boolean;
  initialCount: number;
  accentHex: string;
  isAr: boolean;
  revalidatePath: string;
};

export function FollowBrandButton({ brandId, initialFollowing, initialCount, accentHex, isAr, revalidatePath }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavorite('brand', brandId, revalidatePath);
      if (result.requiresAuth) {
        router.push('/store/login');
        return;
      }
      if (result.error) {
        alert(result.error);
        return;
      }
      setFollowing(!!result.following);
      setCount(c => c + (result.following ? 1 : -1));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={following}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-60"
      style={{
        border: `1px solid ${following ? accentHex : '#D8D0C0'}`,
        background: following ? `${accentHex}14` : '#FFFFFF',
        color: following ? accentHex : '#1A1208',
      }}
    >
      {following ? <BookmarkCheck width={14} height={14} /> : <Bookmark width={14} height={14} />}
      {following ? (isAr ? 'متابَع' : 'Following') : (isAr ? 'متابعة العلامة' : 'Follow Brand')}
      <span style={{ opacity: 0.6 }}>· {count}</span>
    </button>
  );
}
