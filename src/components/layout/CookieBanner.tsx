'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function CookieBanner() {
  const t = useTranslations('cookie');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) setVisible(true);
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, []);

  function handleAccept() {
    try { localStorage.setItem('cookie_consent', 'accepted'); } catch { /* ignore */ }
    setVisible(false);
  }

  function handleDecline() {
    try { localStorage.setItem('cookie_consent', 'declined'); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-muted leading-relaxed max-w-lg">
          {t('message')}{' '}
          <Link
            href="/privacy"
            className="text-gold hover:text-gold-light underline underline-offset-2 transition-colors"
          >
            {t('policy_link')}
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="text-xs text-muted hover:text-parchment transition-colors tracking-[0.15em] uppercase px-4 py-2"
          >
            {t('decline')}
          </button>
          <button
            onClick={handleAccept}
            className="text-xs bg-gold text-ink hover:bg-gold-light transition-colors tracking-[0.2em] uppercase px-6 py-2"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
